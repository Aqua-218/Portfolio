/**
 * 管理画面のログインとGitHubの中継(BFF)。トークンはブラウザに渡さず、ここ(KVのセッション)だけが持つ。
 * ブラウザには HttpOnly の Cookie だけを渡す。設計は Issue #79。
 *
 * URLPatternとnode:zlibは使わない(2026年にworkerdで見つかったメモリ破壊のバグの入口だったため)。
 */

/** 設定。秘密の値(clientSecret・key)は Workers の Secrets から入る */
export interface Config {
  clientId: string;
  clientSecret: string;
  /** 管理画面に入れる GitHub のユーザーの id */
  ownerId: number;
  /** 中継してよいリポジトリ(owner/name) */
  repo: string;
  /** このサイトのオリジン(https://example.com) */
  origin: string;
  /** セッションと端末の記憶を暗号化する鍵(AES-GCM、32バイト) */
  key: CryptoKey;
}

/** KV のうち使うところだけ */
export interface Store {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
  delete(key: string): Promise<void>;
}

/** さわらなければ切れるまでの秒数 */
export const IDLE = 3600;
/** ログインから切れるまでの秒数 */
export const ABSOLUTE = 8 * 3600;
/** 端末を覚えておく秒数 */
export const REMEMBER = 30 * 86400;
/** ログインを始められる回数(1つのIPで、10分に) */
export const ATTEMPTS = 10;
/** ログインを始めてから戻ってくるまでの秒数 */
const OAUTH_TTL = 600;

export const SESSION_COOKIE = "__Host-admin";
export const DEVICE_COOKIE = "__Host-admin-device";
export const OAUTH_COOKIE = "__Host-admin-oauth";

const GITHUB = "https://github.com";
const API = "https://api.github.com";

interface Token {
  access: string;
  refresh: string;
  expires: number;
}

interface Session {
  user: string;
  token: Token;
  started: number;
  seen: number;
}

interface Device {
  hash: string;
  old: string[];
  refresh: string;
  until: number;
}

interface Oauth {
  state: string;
  verifier: string;
  remember: boolean;
  at: number;
}

export interface Deps {
  config: Config;
  store: Store;
  fetch: typeof fetch;
  /** いまの時刻(秒) */
  now: () => number;
}

// ---- 小物 ----

function base64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function random(bytes = 32): string {
  return base64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return base64url(new Uint8Array(digest));
}

/** 時間をかけずに比べると、値を少しずつ当てられるので、長さによらず全部比べる */
function same(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function encrypt(key: CryptoKey, plain: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const box = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plain),
  );
  return base64url(iv) + "." + base64url(new Uint8Array(box));
}

function fromBase64url(s: string): Uint8Array {
  const b = atob(s.replaceAll("-", "+").replaceAll("_", "/"));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

async function decrypt(key: CryptoKey, sealed: string): Promise<string | null> {
  try {
    const [iv = "", box = ""] = sealed.split(".");
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64url(iv) },
      key,
      fromBase64url(box),
    );
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

/** 鍵を読む。Secrets の KEY は32バイトを base64 にしたもの */
export async function importKey(base64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  if (raw.length !== 32) throw new Error("鍵は32バイトにしてください");
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

function cookie(
  name: string,
  value: string,
  maxAge: number,
  sameSite: "Lax" | "Strict",
): string {
  // __Host- は Secure・Path=/・Domain なしのときだけ受けつけられるので、ほかのサブドメインから上書きできない
  return `${name}=${value}; Max-Age=${String(Math.max(0, maxAge))}; Path=/; Secure; HttpOnly; SameSite=${sameSite}`;
}

function cookies(req: Request): Map<string, string> {
  const out = new Map<string, string>();
  for (const part of (req.headers.get("cookie") ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out.set(part.slice(0, i).trim(), part.slice(i + 1).trim());
  }
  return out;
}

function json(
  status: number,
  data: unknown,
  setCookies: string[] = [],
): Response {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
  });
  for (const c of setCookies) headers.append("Set-Cookie", c);
  return new Response(JSON.stringify(data), { status, headers });
}

function redirect(to: string, setCookies: string[] = []): Response {
  const headers = new Headers({ Location: to });
  for (const c of setCookies) headers.append("Set-Cookie", c);
  return new Response(null, { status: 303, headers });
}

/** 中継してよいか。このリポジトリの contents・git・pulls・commits・branches と、actions(見るだけ) */
export function allowed(method: string, path: string, repo: string): boolean {
  if (!["GET", "POST", "PUT", "PATCH"].includes(method)) return false;
  // .. や %、\ など、パスをずらす書き方は通さない
  if (
    // クエリの値には下書きのブランチ(draft/events/x.md)が入るので、/も通す
    !/^\/[A-Za-z0-9._/-]*(\?[A-Za-z0-9._=&/-]*)?$/.test(path) ||
    path.includes("..")
  ) {
    return false;
  }
  const base = `/repos/${repo}/`;
  if (!path.startsWith(base)) return false;
  const area = path.slice(base.length).split("?")[0]?.split("/")[0] ?? "";
  if (
    !["contents", "git", "actions", "pulls", "commits", "branches"].includes(
      area,
    )
  ) {
    return false;
  }
  return !(area === "actions" && method !== "GET");
}

/** 下書きのブランチ。管理画面が書けるのはここだけ */
const DRAFT = "draft/";

/**
 * 書き込みの中身まで見て、通してよいか。allowedを通ったものだけに使う。
 * mainはルールセットで守っている(PRが要り、チェックが通らないとマージできない)が、ここでも下書きのブランチにしか書かせない。
 * - contents: content/の中だけ、下書きのブランチへ
 * - git: blob・tree・commitは作ってよい。ブランチを作る・動かすのは下書きだけ
 * - pulls: 下書きからmainへのPRを作る・閉じる・マージする(マージはチェックが通らないとGitHubが断る)
 */
export function writable(
  method: string,
  path: string,
  body: string,
  repo: string,
): boolean {
  if (method === "GET") return true;
  const rest = path.slice(`/repos/${repo}/`.length).split("?")[0] ?? "";
  let data: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(body);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
      return false;
    data = parsed as Record<string, unknown>;
  } catch {
    return false;
  }
  const draft = (v: unknown, prefix = "") =>
    typeof v === "string" &&
    v.startsWith(prefix + DRAFT) &&
    v.length > (prefix + DRAFT).length;

  if (method === "PUT" && /^contents\/content\/[^?]+$/.test(rest))
    return draft(data.branch);
  if (method === "POST" && /^git\/(blobs|trees|commits)$/.test(rest))
    return true;
  if (method === "POST" && rest === "git/refs")
    return draft(data.ref, "refs/heads/");
  if (method === "PATCH" && rest.startsWith(`git/refs/heads/${DRAFT}`))
    return rest.length > `git/refs/heads/${DRAFT}`.length;
  if (method === "POST" && rest === "pulls")
    return draft(data.head) && data.base === "main";
  if (method === "PATCH" && /^pulls\/\d+$/.test(rest)) return true;
  if (method === "PUT" && /^pulls\/\d+\/merge$/.test(rest)) return true;
  return false;
}

/**
 * このサイトの画面からの呼び出しか。独自ヘッダー X-Admin(別のサイトからはつけられない)があり、
 * Origin がこのサイトか、Origin がないとき(同じサイトへの GET)は Sec-Fetch-Site が same-origin
 */
function sameSite(req: Request, origin: string): boolean {
  if (req.headers.get("x-admin") !== "1") return false;
  const o = req.headers.get("origin");
  if (o !== null) return same(o, origin);
  return req.headers.get("sec-fetch-site") === "same-origin";
}

// ---- 本体 ----

export class Admin {
  constructor(private readonly d: Deps) {}

  async handle(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const res = await this.route(req, url);
    // トークンを含むことがあるので、どこにも残させない
    res.headers.set("Cache-Control", "no-store");
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("Referrer-Policy", "no-referrer");
    return res;
  }

  private async route(req: Request, url: URL): Promise<Response> {
    switch (url.pathname) {
      case "/admin/auth/login":
        return req.method === "GET"
          ? this.login(req, url.searchParams.get("remember") === "1")
          : json(405, { error: "GET で呼んでください" });
      case "/admin/auth/callback":
        return this.callback(
          req,
          url.searchParams.get("code") ?? "",
          url.searchParams.get("state") ?? "",
        );
      case "/admin/auth/me":
        return this.me(req);
      case "/admin/auth/logout":
        return req.method === "POST"
          ? this.logout(req)
          : json(405, { error: "POST で呼んでください" });
      case "/admin/api":
        return this.api(req, url.searchParams.get("path") ?? "");
      default:
        return json(404, { error: "見つかりません" });
    }
  }

  // ---- ログイン ----

  private async login(req: Request, remember: boolean): Promise<Response> {
    if (!(await this.allowAttempt(req))) {
      return json(429, {
        error: "ログインを試す回数が多すぎます。しばらく待ってください",
      });
    }
    const id = random();
    const oauth: Oauth = {
      state: random(),
      verifier: random(),
      remember,
      at: this.d.now(),
    };
    await this.d.store.put(
      `oauth:${await sha256(id)}`,
      await encrypt(this.d.config.key, JSON.stringify(oauth)),
      { expirationTtl: OAUTH_TTL },
    );
    const challenge = base64url(
      new Uint8Array(
        await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(oauth.verifier),
        ),
      ),
    );
    const query = new URLSearchParams({
      client_id: this.d.config.clientId,
      redirect_uri: `${this.d.config.origin}/admin/auth/callback`,
      state: oauth.state,
      code_challenge: challenge,
      code_challenge_method: "S256",
      allow_signup: "false",
    });
    // GitHub から戻ってくる移動でも届くよう、この Cookie は Lax
    return redirect(`${GITHUB}/login/oauth/authorize?${query.toString()}`, [
      cookie(OAUTH_COOKIE, id, OAUTH_TTL, "Lax"),
    ]);
  }

  private async callback(
    req: Request,
    code: string,
    state: string,
  ): Promise<Response> {
    const clear = cookie(OAUTH_COOKIE, "", 0, "Lax");
    const id = cookies(req).get(OAUTH_COOKIE) ?? "";
    const key = `oauth:${await sha256(id)}`;
    const sealed = id === "" ? null : await this.d.store.get(key);
    // 1回きり
    if (sealed !== null) await this.d.store.delete(key);
    const plain =
      sealed === null ? null : await decrypt(this.d.config.key, sealed);
    const oauth = plain === null ? null : (JSON.parse(plain) as Oauth);
    if (
      oauth === null ||
      !same(oauth.state, state) ||
      this.d.now() - oauth.at > OAUTH_TTL
    ) {
      return this.fail("state", [clear]);
    }
    const token = await this.tokenRequest({
      code,
      redirect_uri: `${this.d.config.origin}/admin/auth/callback`,
      code_verifier: oauth.verifier,
    });
    if (token === null) return this.fail("token", [clear]);
    const user = await this.owner(token.access);
    if (user === null) {
      // 持ち主でなければ、もらったトークンはすぐに取り消す
      await this.revoke(token.access);
      return this.fail("owner", [clear]);
    }
    const set = [clear, (await this.startSession(user, token)).cookie];
    if (oauth.remember) set.push(await this.rememberDevice(token));
    return redirect("/admin/", set);
  }

  /** いまログインしているか。切れていても、覚えた端末なら入り直す */
  private async me(req: Request): Promise<Response> {
    const set: string[] = [];
    const session =
      (await this.session(req, set)) ?? (await this.resume(req, set));
    if (session === null)
      return json(401, { error: "ログインしていません" }, set);
    return json(200, { login: session.user }, set);
  }

  /** ログアウト。GitHub のトークンと、この端末の記憶とセッションを取り消す */
  private async logout(req: Request): Promise<Response> {
    if (!sameSite(req, this.d.config.origin))
      return json(403, { error: "別のサイトからは操作できません" });
    const jar = cookies(req);
    const sid = jar.get(SESSION_COOKIE) ?? "";
    if (sid !== "") {
      const s = await this.loadSession(sid);
      if (s !== null) await this.revoke(s.token.access);
      await this.d.store.delete(`session:${await sha256(sid)}`);
    }
    const [dev = ""] = (jar.get(DEVICE_COOKIE) ?? "").split(".");
    if (dev !== "") await this.forgetDevice(dev);
    return json(200, { ok: true }, [
      cookie(SESSION_COOKIE, "", 0, "Lax"),
      cookie(DEVICE_COOKIE, "", 0, "Strict"),
    ]);
  }

  // ---- 中継 ----

  private async api(req: Request, path: string): Promise<Response> {
    if (!sameSite(req, this.d.config.origin))
      return json(403, { error: "別のサイトからは操作できません" });
    if (!allowed(req.method, path, this.d.config.repo))
      return json(403, { error: "その操作はできません" });
    // 書き込みは中身まで見る。セッションやトークンに触る前に断る
    const body = req.method === "GET" ? null : await req.text();
    if (!writable(req.method, path, body ?? "", this.d.config.repo))
      return json(403, { error: "その操作はできません" });
    const set: string[] = [];
    const session =
      (await this.session(req, set)) ?? (await this.resume(req, set));
    if (session === null)
      return json(401, { error: "ログインしていません" }, set);
    const token = await this.freshToken(req, session);
    if (token === null)
      return json(401, { error: "ログインが切れました" }, [
        ...set,
        cookie(SESSION_COOKIE, "", 0, "Lax"),
      ]);
    const res = await this.github(req.method, path, token, body);
    const text =
      res.status === 403 || res.status === 404
        ? JSON.stringify({
            error: "権限が足りないか、見つかりません",
            status: res.status,
          })
        : await res.text();
    const headers = new Headers({
      "Content-Type": "application/json; charset=utf-8",
    });
    for (const c of set) headers.append("Set-Cookie", c);
    return new Response(text, { status: res.status, headers });
  }

  // ---- セッション ----

  /** セッションを作る。ログインのたびに新しいidにする(固定化させない) */
  private async startSession(
    user: string,
    token: Token,
  ): Promise<{ cookie: string; session: Session }> {
    const sid = random();
    const now = this.d.now();
    const session = { user, token, started: now, seen: now };
    await this.saveSession(sid, session);
    return { cookie: cookie(SESSION_COOKIE, sid, ABSOLUTE, "Lax"), session };
  }

  private async saveSession(sid: string, s: Session): Promise<void> {
    const left = s.started + ABSOLUTE - this.d.now();
    await this.d.store.put(
      `session:${await sha256(sid)}`,
      await encrypt(this.d.config.key, JSON.stringify(s)),
      { expirationTtl: Math.max(60, left) },
    );
  }

  private async loadSession(sid: string): Promise<Session | null> {
    const sealed = await this.d.store.get(`session:${await sha256(sid)}`);
    const plain =
      sealed === null ? null : await decrypt(this.d.config.key, sealed);
    return plain === null ? null : (JSON.parse(plain) as Session);
  }

  /** 届いたセッション。切れていたら消す */
  private async session(req: Request, set: string[]): Promise<Session | null> {
    const sid = cookies(req).get(SESSION_COOKIE) ?? "";
    if (sid === "") return null;
    const s = await this.loadSession(sid);
    const now = this.d.now();
    if (s === null || now - s.seen > IDLE || now - s.started > ABSOLUTE) {
      await this.d.store.delete(`session:${await sha256(sid)}`);
      set.push(cookie(SESSION_COOKIE, "", 0, "Lax"));
      return null;
    }
    s.seen = now;
    await this.saveSession(sid, s);
    return s;
  }

  /** アクセストークン。切れそうならリフレッシュトークンで取り直す */
  private async freshToken(req: Request, s: Session): Promise<string | null> {
    if (s.token.expires - 60 > this.d.now()) return s.token.access;
    const next = await this.tokenRequest({
      grant_type: "refresh_token",
      refresh_token: s.token.refresh,
    });
    if (next === null) return null;
    s.token = next;
    const sid = cookies(req).get(SESSION_COOKIE) ?? "";
    if (sid !== "") await this.saveSession(sid, s);
    return next.access;
  }

  // ---- 端末の記憶 ----

  /** 端末を覚える。Cookie にはランダムな値だけ。KV にはそのハッシュと、暗号化したリフレッシュトークン */
  private async rememberDevice(token: Token): Promise<string> {
    const id = random(16);
    const secret = random();
    await this.saveDevice(id, {
      hash: await sha256(secret),
      old: [],
      refresh: token.refresh,
      until: this.d.now() + REMEMBER,
    });
    return cookie(DEVICE_COOKIE, `${id}.${secret}`, REMEMBER, "Strict");
  }

  /** 覚えた端末なら入り直す。使うたびに値を新しくし、古い値が使われたら取り消す */
  private async resume(req: Request, set: string[]): Promise<Session | null> {
    const raw = cookies(req).get(DEVICE_COOKIE) ?? "";
    const m = /^([A-Za-z0-9_-]{22})\.([A-Za-z0-9_-]{43})$/.exec(raw);
    if (m === null) return null;
    const [, id = "", secret = ""] = m;
    const forget = async () => {
      await this.forgetDevice(id);
      set.push(cookie(DEVICE_COOKIE, "", 0, "Strict"));
      return null;
    };
    const device = await this.loadDevice(id);
    if (device === null || device.until < this.d.now()) return forget();
    const hash = await sha256(secret);
    if (!same(device.hash, hash)) {
      // 前に使った値がもう一度来たら、盗まれたとみなして取り消す
      if (device.old.some((o) => same(o, hash))) return forget();
      return null;
    }
    const token = await this.tokenRequest({
      grant_type: "refresh_token",
      refresh_token: device.refresh,
    });
    if (token === null) return forget();
    const user = await this.owner(token.access);
    if (user === null) {
      await this.revoke(token.access);
      return forget();
    }
    const next = random();
    await this.saveDevice(id, {
      hash: await sha256(next),
      old: [hash, ...device.old].slice(0, 20),
      refresh: token.refresh,
      until: device.until,
    });
    set.push(
      cookie(
        DEVICE_COOKIE,
        `${id}.${next}`,
        device.until - this.d.now(),
        "Strict",
      ),
    );
    const started = await this.startSession(user, token);
    set.push(started.cookie);
    return started.session;
  }

  private async saveDevice(id: string, d: Device): Promise<void> {
    await this.d.store.put(
      `device:${id}`,
      await encrypt(this.d.config.key, JSON.stringify(d)),
      { expirationTtl: Math.max(60, d.until - this.d.now()) },
    );
  }

  private async loadDevice(id: string): Promise<Device | null> {
    const sealed = await this.d.store.get(`device:${id}`);
    const plain =
      sealed === null ? null : await decrypt(this.d.config.key, sealed);
    return plain === null ? null : (JSON.parse(plain) as Device);
  }

  private async forgetDevice(id: string): Promise<void> {
    if (/^[A-Za-z0-9_-]{22}$/.test(id))
      await this.d.store.delete(`device:${id}`);
  }

  // ---- 試行回数 ----

  private async allowAttempt(req: Request): Promise<boolean> {
    const ip = req.headers.get("cf-connecting-ip") ?? "";
    const key = `attempts:${await sha256(ip)}`;
    const now = this.d.now();
    const times = (
      JSON.parse((await this.d.store.get(key)) ?? "[]") as number[]
    ).filter((t) => now - t < 600);
    if (times.length >= ATTEMPTS) return false;
    times.push(now);
    await this.d.store.put(key, JSON.stringify(times), { expirationTtl: 600 });
    return true;
  }

  // ---- GitHub ----

  private async tokenRequest(
    params: Record<string, string>,
  ): Promise<Token | null> {
    const res = await this.d.fetch(`${GITHUB}/login/oauth/access_token`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: this.d.config.clientId,
        client_secret: this.d.config.clientSecret,
        ...params,
      }).toString(),
    });
    const data = (await res.json().catch(() => null)) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    } | null;
    if (
      !res.ok ||
      data?.access_token === undefined ||
      data.refresh_token === undefined
    )
      return null;
    return {
      access: data.access_token,
      refresh: data.refresh_token,
      expires: this.d.now() + (data.expires_in ?? 28800),
    };
  }

  /** トークンの持ち主が、管理画面の持ち主ならそのログイン名 */
  private async owner(access: string): Promise<string | null> {
    const res = await this.github("GET", "/user", access, null);
    if (!res.ok) return null;
    const user = await res.json<{ id?: number; login?: string }>();
    return user.id === this.d.config.ownerId ? (user.login ?? "") : null;
  }

  private github(
    method: string,
    path: string,
    token: string,
    body: string | null,
  ): Promise<Response> {
    return this.d.fetch(`${API}${path}`, {
      method,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "portfolio-admin",
        ...(body === null ? {} : { "Content-Type": "application/json" }),
      },
      body,
    });
  }

  private async revoke(access: string): Promise<void> {
    await this.d.fetch(
      `${API}/applications/${encodeURIComponent(this.d.config.clientId)}/token`,
      {
        method: "DELETE",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Basic ${btoa(`${this.d.config.clientId}:${this.d.config.clientSecret}`)}`,
          "User-Agent": "portfolio-admin",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ access_token: access }),
      },
    );
  }

  /**
   * ログインに失敗した。文は画面側で決まったものに置き換えるので、ここでは短い記号だけ渡す
   * (URLに文を載せると、作ったURLで好きな文を管理画面に出せてしまう)
   */
  private fail(code: "state" | "token" | "owner", set: string[]): Response {
    return redirect(`/admin/?error=${code}`, set);
  }
}
