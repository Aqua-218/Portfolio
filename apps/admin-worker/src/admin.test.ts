import { beforeEach, describe, expect, it } from "vitest";
import {
  ABSOLUTE,
  Admin,
  DEVICE_COOKIE,
  IDLE,
  OAUTH_COOKIE,
  REMEMBER,
  SESSION_COOKIE,
  type Store,
  allowed,
  writable,
  importKey,
} from "./admin";

const OWNER = 4242;
const ORIGIN = "https://example.com";
const REPO = "Aqua-218/Portfolio";

/** 偽のKV。期限は見ない(Workerの側で時刻を見て切っている) */
class FakeKV implements Store {
  readonly data = new Map<string, string>();
  get(key: string) {
    return Promise.resolve(this.data.get(key) ?? null);
  }
  put(key: string, value: string) {
    this.data.set(key, value);
    return Promise.resolve();
  }
  delete(key: string) {
    this.data.delete(key);
    return Promise.resolve();
  }
  keys(prefix: string) {
    return [...this.data.keys()].filter((k) => k.startsWith(prefix));
  }
}

interface Call {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | null;
}

/** 偽のGitHubとブラウザ */
class World {
  kv = new FakeKV();
  calls: Call[] = [];
  userId = OWNER;
  tokenOk = true;
  issued = 0;
  now = 1_800_000_000;
  jar = new Map<string, string>();
  ip = "203.0.113.7";
  key!: CryptoKey;

  async init() {
    this.key = await importKey(
      btoa(String.fromCharCode(...new Uint8Array(32).fill(1))),
    );
    return this;
  }

  admin() {
    return new Admin({
      config: {
        clientId: "Iv1.client",
        clientSecret: "secret",
        ownerId: OWNER,
        repo: REPO,
        origin: ORIGIN,
        key: this.key,
      },
      store: this.kv,
      now: () => this.now,
      fetch: (input, init) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url;
        const headers = Object.fromEntries(
          new Headers(init?.headers).entries(),
        );
        const body = typeof init?.body === "string" ? init.body : null;
        this.calls.push({ method: init?.method ?? "GET", url, headers, body });
        if (url.endsWith("/login/oauth/access_token")) {
          if (!this.tokenOk)
            return Promise.resolve(
              Response.json({ error: "bad_verification_code" }),
            );
          this.issued += 1;
          return Promise.resolve(
            Response.json({
              access_token: `ghu_access${String(this.issued)}`,
              refresh_token: `ghr_refresh${String(this.issued)}`,
              expires_in: 28800,
            }),
          );
        }
        if (url.endsWith("/user"))
          return Promise.resolve(
            Response.json({ id: this.userId, login: "neko" }),
          );
        return Promise.resolve(Response.json({ ok: true }));
      },
    });
  }

  to(part: string) {
    return this.calls.filter((c) => c.url.includes(part));
  }

  /** ブラウザとして呼ぶ。Cookieを送り、Set-Cookieを覚える */
  async send(
    path: string,
    init: RequestInit & { site?: "same" | "cross" } = {},
  ) {
    const headers = new Headers(init.headers);
    headers.set("cf-connecting-ip", this.ip);
    headers.set(
      "cookie",
      [...this.jar].map(([k, v]) => `${k}=${v}`).join("; "),
    );
    const res = await this.admin().handle(
      new Request(`${ORIGIN}${path}`, { ...init, headers }),
    );
    for (const c of res.headers.getSetCookie()) {
      const [pair = ""] = c.split(";");
      const i = pair.indexOf("=");
      const k = pair.slice(0, i);
      const v = pair.slice(i + 1);
      if (v === "" || c.includes("Max-Age=0")) this.jar.delete(k);
      else this.jar.set(k, v);
    }
    return res;
  }

  /** 同じサイトの画面からの呼び出し */
  api(method: string, path: string, body?: string) {
    return this.send(`/admin/api?path=${encodeURIComponent(path)}`, {
      method,
      ...(body === undefined ? {} : { body }),
      headers: {
        "x-admin": "1",
        ...(method === "GET"
          ? { "sec-fetch-site": "same-origin" }
          : { origin: ORIGIN }),
      },
    });
  }

  async login(remember = false) {
    const r = await this.send(
      `/admin/auth/login${remember ? "?remember=1" : ""}`,
    );
    const state =
      new URL(r.headers.get("location") ?? "").searchParams.get("state") ?? "";
    return this.send(`/admin/auth/callback?code=code&state=${state}`);
  }
}

let w: World;
beforeEach(async () => {
  w = await new World().init();
});

describe("ログイン", () => {
  it("PKCE(S256)とstateをつけてGitHubへ送り、client secretはURLに出さない", async () => {
    const r = await w.send("/admin/auth/login");
    expect(r.status).toBe(303);
    const url = new URL(r.headers.get("location") ?? "");
    expect(url.origin + url.pathname).toBe(
      "https://github.com/login/oauth/authorize",
    );
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("state")).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(url.toString()).not.toContain("secret");
    expect(r.headers.get("set-cookie")).toContain(`${OAUTH_COOKIE}=`);
  });

  it("stateが違えば、トークンをもらいに行かない", async () => {
    await w.send("/admin/auth/login");
    const r = await w.send("/admin/auth/callback?code=code&state=nisemono");
    expect(r.headers.get("location")).toMatch(/\?error=(state|token|owner)$/);
    expect(w.to("access_token")).toEqual([]);
  });

  it("ログインを始めずに戻ってきても入れない", async () => {
    const r = await w.send("/admin/auth/callback?code=code&state=x");
    expect(r.headers.get("location")).toMatch(/\?error=(state|token|owner)$/);
  });

  it("同じログインの手続きは2回使えない", async () => {
    const r = await w.send("/admin/auth/login");
    const state =
      new URL(r.headers.get("location") ?? "").searchParams.get("state") ?? "";
    const oauth = w.jar.get(OAUTH_COOKIE) ?? "";
    await w.send(`/admin/auth/callback?code=code&state=${state}`);
    w.jar.clear();
    w.jar.set(OAUTH_COOKIE, oauth);
    const again = await w.send(`/admin/auth/callback?code=code&state=${state}`);
    expect(again.headers.get("location")).toMatch(
      /\?error=(state|token|owner)$/,
    );
  });

  it("10分たったら戻ってきても入れない", async () => {
    const r = await w.send("/admin/auth/login");
    const state =
      new URL(r.headers.get("location") ?? "").searchParams.get("state") ?? "";
    w.now += 601;
    const back = await w.send(`/admin/auth/callback?code=code&state=${state}`);
    expect(back.headers.get("location")).toMatch(
      /\?error=(state|token|owner)$/,
    );
  });

  it("PKCEのverifierをトークンの交換に渡し、challengeと合う", async () => {
    const r = await w.send("/admin/auth/login");
    const url = new URL(r.headers.get("location") ?? "");
    await w.send(
      `/admin/auth/callback?code=code&state=${url.searchParams.get("state") ?? ""}`,
    );
    const sent = new URLSearchParams(w.to("access_token")[0]?.body ?? "");
    const verifier = sent.get("code_verifier") ?? "";
    const digest = new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)),
    );
    const challenge = btoa(String.fromCharCode(...digest))
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replace(/=+$/, "");
    expect(url.searchParams.get("code_challenge")).toBe(challenge);
  });

  it("持ち主ならログインする。トークンはブラウザに返さず、Cookieは__Host-・Secure・HttpOnly", async () => {
    const r = await w.login();
    expect(r.headers.get("location")).toBe("/admin/");
    const set = r.headers.getSetCookie().join("\n");
    expect(set).toContain(`${SESSION_COOKIE}=`);
    expect(set).toMatch(
      /__Host-admin=[^;]+; Max-Age=\d+; Path=\/; Secure; HttpOnly; SameSite=Lax/,
    );
    expect(set).not.toContain(DEVICE_COOKIE + "=");
    expect(set + (await r.text())).not.toContain("ghu_access1");
  });

  it("KVのセッションは暗号化してあり、トークンが平文で入らない", async () => {
    await w.login(true);
    for (const v of w.kv.data.values()) {
      expect(v).not.toContain("ghu_access1");
      expect(v).not.toContain("ghr_refresh1");
    }
  });

  it("持ち主でなければ、もらったトークンを取り消して拒む", async () => {
    w.userId = 999;
    const r = await w.login();
    expect(r.headers.get("location")).toMatch(/\?error=(state|token|owner)$/);
    expect(w.jar.has(SESSION_COOKIE)).toBe(false);
    expect(w.to("/applications/Iv1.client/token")).toHaveLength(1);
  });

  it("GitHubがトークンをくれなければ入れない", async () => {
    w.tokenOk = false;
    expect((await w.login()).headers.get("location")).toMatch(
      /\?error=(state|token|owner)$/,
    );
  });

  it("ログインを始めるのは、1つのIPで10分に10回まで", async () => {
    for (let i = 0; i < 10; i++)
      expect((await w.send("/admin/auth/login")).status).toBe(303);
    expect((await w.send("/admin/auth/login")).status).toBe(429);
    w.now += 601;
    expect((await w.send("/admin/auth/login")).status).toBe(303);
  });
});

describe("セッション", () => {
  it("ログインしていなければ401", async () => {
    expect((await w.send("/admin/auth/me")).status).toBe(401);
  });

  it("ログインのたびに新しいセッションidになる", async () => {
    await w.login();
    const first = w.jar.get(SESSION_COOKIE);
    await w.login();
    expect(w.jar.get(SESSION_COOKIE)).not.toBe(first);
  });

  it("1時間さわらなければ切れる", async () => {
    await w.login();
    w.now += IDLE - 1;
    expect((await w.send("/admin/auth/me")).status).toBe(200);
    w.now += IDLE + 1;
    expect((await w.send("/admin/auth/me")).status).toBe(401);
  });

  it("さわっていても8時間で切れる", async () => {
    await w.login();
    const end = w.now + ABSOLUTE;
    while (w.now + 3000 <= end) {
      w.now += 3000;
      await w.send("/admin/auth/me");
    }
    w.now = end + 1;
    expect((await w.send("/admin/auth/me")).status).toBe(401);
  });
});

describe("中継", () => {
  it("許可した操作だけ通す", () => {
    const repo = `/repos/${REPO}`;
    const yes: [string, string][] = [
      ["GET", `${repo}/contents/content/events`],
      ["PUT", `${repo}/contents/content/events/x.md`],
      ["POST", `${repo}/git/trees`],
      ["POST", `${repo}/pulls`],
      ["GET", `${repo}/actions/runs?branch=main`],
      ["GET", `${repo}/contents/content/events/x.md?ref=draft/events/x.md`],
      ["GET", `${repo}/git/matching-refs/heads/draft/`],
    ];
    const no: [string, string][] = [
      ["GET", "/repos/someone/else/contents/x"],
      ["GET", "/user/repos"],
      ["DELETE", `${repo}/contents/content/x.md`],
      ["PUT", `${repo}/actions/secrets/X`],
      ["PATCH", `/repos/${REPO}`],
      ["PUT", `${repo}/collaborators/evil`],
      ["GET", `${repo}/contents/../../../user`],
      ["GET", `${repo}/contents/%2e%2e/x`],
      ["GET", `${repo}/contents\\..\\x`],
      ["GET", `/repos/${REPO}x/contents/a`],
      ["GET", `https://evil.example/repos/${REPO}/contents`],
      ["GET", `${repo}/hooks`],
      ["GET", `${repo}/contents/a?ref=draft/../../x`],
    ];
    for (const [m, p] of yes)
      expect(allowed(m, p, REPO), `${m} ${p}`).toBe(true);
    for (const [m, p] of no)
      expect(allowed(m, p, REPO), `${m} ${p}`).toBe(false);
  });

  it("書き込みは、下書きのブランチとcontent/の中だけ", () => {
    const repo = `/repos/${REPO}`;
    const put = (branch: unknown) => JSON.stringify({ message: "m", branch });
    const yes: [string, string, string][] = [
      ["PUT", `${repo}/contents/content/events/x.md`, put("draft/events/x.md")],
      ["POST", `${repo}/git/blobs`, '{"content":"x"}'],
      ["POST", `${repo}/git/trees`, '{"tree":[]}'],
      ["POST", `${repo}/git/commits`, '{"message":"m"}'],
      ["POST", `${repo}/git/refs`, '{"ref":"refs/heads/draft/x","sha":"1"}'],
      ["PATCH", `${repo}/git/refs/heads/draft/x`, '{"sha":"1"}'],
      ["POST", `${repo}/pulls`, '{"head":"draft/x","base":"main"}'],
      ["PATCH", `${repo}/pulls/3`, '{"state":"closed"}'],
      ["PUT", `${repo}/pulls/3/merge`, '{"merge_method":"squash"}'],
    ];
    const no: [string, string, string][] = [
      // mainやほかのブランチには書かない
      ["PUT", `${repo}/contents/content/x.md`, put("main")],
      ["PUT", `${repo}/contents/content/x.md`, put(undefined)],
      ["PUT", `${repo}/contents/content/x.md`, put("draft/")],
      ["PUT", `${repo}/contents/content/x.md`, put("feature/draft/x")],
      ["PUT", `${repo}/contents/content/x.md`, put(["draft/x"])],
      // content/の外には書かない
      ["PUT", `${repo}/contents/.github/workflows/ci.yml`, put("draft/x")],
      ["PUT", `${repo}/contents/apps/web/x.ts`, put("draft/x")],
      ["POST", `${repo}/git/refs`, '{"ref":"refs/heads/main","sha":"1"}'],
      ["POST", `${repo}/git/refs`, '{"ref":"refs/tags/v9","sha":"1"}'],
      ["PATCH", `${repo}/git/refs/heads/main`, '{"sha":"1","force":true}'],
      ["PATCH", `${repo}/git/refs/heads/draft/`, '{"sha":"1"}'],
      ["POST", `${repo}/git/tags`, '{"tag":"v9"}'],
      ["POST", `${repo}/pulls`, '{"head":"feature","base":"main"}'],
      ["POST", `${repo}/pulls`, '{"head":"draft/x","base":"release"}'],
      ["POST", `${repo}/commits/abc/comments`, '{"body":"x"}'],
      ["PUT", `${repo}/branches/main/protection`, "{}"],
      // JSONでないもの
      ["PUT", `${repo}/contents/content/x.md`, "branch=draft/x"],
      ["POST", `${repo}/pulls`, "[]"],
    ];
    for (const [m, p, b] of yes)
      expect(writable(m, p, b, REPO), `${m} ${p} ${b}`).toBe(true);
    for (const [m, p, b] of no)
      expect(writable(m, p, b, REPO), `${m} ${p} ${b}`).toBe(false);
  });

  it("下書きでないブランチへの書き込みは、トークンを使う前に断る", async () => {
    await w.login();
    const r = await w.api(
      "PUT",
      `/repos/${REPO}/contents/content/a.md`,
      '{"message":"m","branch":"main"}',
    );
    expect(r.status).toBe(403);
    expect(w.to("/contents")).toEqual([]);
  });

  it("独自ヘッダーがなければ拒む", async () => {
    await w.login();
    const r = await w.send(
      `/admin/api?path=${encodeURIComponent(`/repos/${REPO}/contents/a`)}`,
      { headers: { origin: ORIGIN } },
    );
    expect(r.status).toBe(403);
    expect(w.to("/contents")).toEqual([]);
  });

  it("ほかのサイトからは拒む", async () => {
    await w.login();
    const path = encodeURIComponent(`/repos/${REPO}/pulls`);
    expect(
      (
        await w.send(`/admin/api?path=${path}`, {
          method: "POST",
          body: "{}",
          headers: { "x-admin": "1", origin: "https://evil.example" },
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await w.send(`/admin/api?path=${path}`, {
          headers: { "x-admin": "1", "sec-fetch-site": "cross-site" },
        })
      ).status,
    ).toBe(403);
  });

  it("セッションのトークンをつけて中継する", async () => {
    await w.login();
    const body = '{"message":"m","branch":"draft/a.md"}';
    const r = await w.api("PUT", `/repos/${REPO}/contents/content/a.md`, body);
    expect(r.status).toBe(200);
    const call = w.to("/contents/content/a.md")[0];
    expect(call?.url).toBe(
      `https://api.github.com/repos/${REPO}/contents/content/a.md`,
    );
    expect(call?.headers.authorization).toBe("Bearer ghu_access1");
    expect(call?.body).toBe(body);
  });

  it("ログインしていなければ中継しない", async () => {
    expect((await w.api("GET", `/repos/${REPO}/contents/a`)).status).toBe(401);
    expect(w.to("/contents")).toEqual([]);
  });

  it("アクセストークンが切れそうなら、リフレッシュトークンで取り直す", async () => {
    await w.login();
    const start = w.now;
    // 8時間のトークンが切れる30秒前まで、セッションが切れないよう50分ごとにさわりながら進める
    while (w.now + 3000 < start + 28800 - 30) {
      w.now += 3000;
      await w.send("/admin/auth/me");
    }
    w.now = start + 28800 - 30;
    await w.api("GET", `/repos/${REPO}/contents/a`);
    const sent = new URLSearchParams(w.to("access_token")[1]?.body ?? "");
    expect(sent.get("grant_type")).toBe("refresh_token");
    expect(sent.get("refresh_token")).toBe("ghr_refresh1");
    expect(w.to("/contents/a")[0]?.headers.authorization).toBe(
      "Bearer ghu_access2",
    );
  });
});

describe("この端末で覚える", () => {
  it("覚えるときだけ、__Host-・Secure・HttpOnly・SameSite=StrictのCookieを渡す。中身はトークンではない", async () => {
    const r = await w.login(true);
    const c =
      r.headers.getSetCookie().find((x) => x.startsWith(DEVICE_COOKIE)) ?? "";
    for (const part of [
      "Secure",
      "HttpOnly",
      "SameSite=Strict",
      "Path=/",
      `Max-Age=${String(REMEMBER)}`,
    ])
      expect(c).toContain(part);
    expect(c).not.toContain("Domain");
    // 値はランダムなので、たまたま「gh」を含むことはある。トークンそのものが入っていないかを見る
    expect(c).not.toContain("ghu_access1");
    expect(c).not.toContain("ghr_refresh1");
  });

  it("セッションが切れても、覚えた端末なら入り直し、Cookieの値を新しくする", async () => {
    await w.login(true);
    const before = w.jar.get(DEVICE_COOKIE);
    w.jar.delete(SESSION_COOKIE);
    w.now += 86400;
    expect((await w.send("/admin/auth/me")).status).toBe(200);
    expect(w.jar.get(DEVICE_COOKIE)).not.toBe(before);
    expect(w.jar.has(SESSION_COOKIE)).toBe(true);
  });

  it("古いCookieの値がもう一度使われたら、盗まれたとみなして記憶を取り消す", async () => {
    await w.login(true);
    const stolen = w.jar.get(DEVICE_COOKIE) ?? "";
    w.jar.delete(SESSION_COOKIE);
    await w.send("/admin/auth/me");
    // 盗んだ人が古い値で入ろうとする
    w.jar.clear();
    w.jar.set(DEVICE_COOKIE, stolen);
    expect((await w.send("/admin/auth/me")).status).toBe(401);
    expect(w.kv.keys("device:")).toEqual([]);
    expect(w.jar.has(DEVICE_COOKIE)).toBe(false);
  });

  it("でたらめなCookieでは入れない", async () => {
    await w.login(true);
    const [id = ""] = (w.jar.get(DEVICE_COOKIE) ?? "").split(".");
    w.jar.clear();
    w.jar.set(DEVICE_COOKIE, `${id}.${"A".repeat(43)}`);
    expect((await w.send("/admin/auth/me")).status).toBe(401);
    w.jar.set(DEVICE_COOKIE, "../../etc/passwd.x");
    expect((await w.send("/admin/auth/me")).status).toBe(401);
  });

  it("30日たったら覚えていない", async () => {
    await w.login(true);
    w.jar.delete(SESSION_COOKIE);
    w.now += REMEMBER + 1;
    expect((await w.send("/admin/auth/me")).status).toBe(401);
  });

  it("入り直すときも、持ち主でなくなっていたら拒む", async () => {
    await w.login(true);
    w.jar.delete(SESSION_COOKIE);
    w.userId = 999;
    expect((await w.send("/admin/auth/me")).status).toBe(401);
    expect(w.kv.keys("device:")).toEqual([]);
  });
});

describe("ログアウト", () => {
  it("GitHubのトークン、セッション、端末の記憶を取り消す", async () => {
    await w.login(true);
    const r = await w.send("/admin/auth/logout", {
      method: "POST",
      headers: { origin: ORIGIN, "x-admin": "1" },
    });
    expect(r.status).toBe(200);
    const revoke = w.to("/applications/Iv1.client/token");
    expect(revoke).toHaveLength(1);
    expect(revoke[0]?.method).toBe("DELETE");
    expect(revoke[0]?.body).toBe('{"access_token":"ghu_access1"}');
    expect(w.kv.keys("session:")).toEqual([]);
    expect(w.kv.keys("device:")).toEqual([]);
    expect(w.jar.has(SESSION_COOKIE)).toBe(false);
    expect(w.jar.has(DEVICE_COOKIE)).toBe(false);
  });

  it("別のサイトからはログアウトさせられない", async () => {
    await w.login();
    const r = await w.send("/admin/auth/logout", {
      method: "POST",
      headers: { origin: "https://evil.example", "x-admin": "1" },
    });
    expect(r.status).toBe(403);
    expect((await w.send("/admin/auth/me")).status).toBe(200);
  });

  it("GETではログアウトしない", async () => {
    await w.login();
    expect((await w.send("/admin/auth/logout")).status).toBe(405);
  });
});

describe("返事", () => {
  it("どの返事もキャッシュさせず、リファラーを送らせない", async () => {
    const r = await w.send("/admin/auth/me");
    expect(r.headers.get("cache-control")).toBe("no-store");
    expect(r.headers.get("referrer-policy")).toBe("no-referrer");
    expect(r.headers.get("x-content-type-options")).toBe("nosniff");
  });
});
