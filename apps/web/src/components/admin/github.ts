/** 管理画面からGitHubを触る。Worker(/admin/api)を通すので、トークンはここには来ない */

/** 触るリポジトリ。Workerの許可リストと同じ */
export const REPO = "Aqua-218/Portfolio";

/** Workerを通してGitHub APIを呼ぶ。独自ヘッダーX-Adminで、このサイトの画面からだと伝える */
export function api(
  method: "GET" | "POST" | "PUT" | "PATCH",
  path: string,
  body?: unknown,
): Promise<Response> {
  return fetch(`/admin/api?path=${encodeURIComponent(path)}`, {
    method,
    credentials: "same-origin",
    headers: {
      "X-Admin": "1",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

/** mainのファイルのうち、content/の中のもの(.cacheは除く) */
export async function contentFiles(): Promise<string[]> {
  const res = await api("GET", `/repos/${REPO}/git/trees/main?recursive=1`);
  if (!res.ok) throw new Error(String(res.status));
  const { tree } = (await res.json()) as {
    tree: { path: string; type: string }[];
  };
  return tree
    .filter(
      (e) =>
        e.type === "blob" &&
        e.path.startsWith("content/") &&
        !e.path.startsWith("content/.cache/"),
    )
    .map((e) => e.path);
}

/** base64(GitHubのcontentsの中身)をUTF-8の文字にする */
function decode(base64: string): string {
  const bin = atob(base64.replace(/\s/g, ""));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/** UTF-8の文字を、GitHubのcontentsに書くbase64にする */
function encode(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

/** 下書きのブランチの名前。content/の中のパスをそのまま続ける。Workerは draft/ にしか書かせない */
export function draftBranch(path: string): string {
  return `draft/${path.replace(/^content\//, "")}`;
}

/** 下書きのあるファイル(content/からのパス) */
export async function drafts(): Promise<Set<string>> {
  const res = await api("GET", `/repos/${REPO}/git/matching-refs/heads/draft/`);
  if (!res.ok) throw new Error(String(res.status));
  const refs = (await res.json()) as { ref: string }[];
  return new Set(
    refs.map((r) => `content/${r.ref.slice("refs/heads/draft/".length)}`),
  );
}

/** ファイルを読む。refはブランチ。shaは、あとで書き換えるときに要る */
export async function readFile(
  path: string,
  ref = "main",
): Promise<{ text: string; sha: string }> {
  const res = await api("GET", `/repos/${REPO}/contents/${path}?ref=${ref}`);
  if (!res.ok) throw new Error(String(res.status));
  const { content, sha } = (await res.json()) as {
    content: string;
    sha: string;
  };
  return { text: decode(content), sha };
}

/** 下書きがあれば下書きを、なければmainのファイルを読む */
export async function readLatest(
  path: string,
): Promise<{ text: string; draft: boolean }> {
  try {
    const { text } = await readFile(path, draftBranch(path));
    return { text, draft: true };
  } catch (e) {
    if (!(e instanceof Error) || e.message !== "404") throw e;
  }
  const { text } = await readFile(path);
  return { text, draft: false };
}

/**
 * 下書きのブランチに保存する。ブランチがなければmainから作る。
 * mainには書かない(PRを作って公開するのは #87)
 */
export async function saveDraft(path: string, text: string): Promise<void> {
  const branch = draftBranch(path);
  const ref = await api("GET", `/repos/${REPO}/git/ref/heads/${branch}`);
  if (ref.status === 404) {
    const main = await api("GET", `/repos/${REPO}/git/ref/heads/main`);
    if (!main.ok) throw new Error(String(main.status));
    const { object } = (await main.json()) as { object: { sha: string } };
    const made = await api("POST", `/repos/${REPO}/git/refs`, {
      ref: `refs/heads/${branch}`,
      sha: object.sha,
    });
    if (!made.ok) throw new Error(String(made.status));
  } else if (!ref.ok) {
    throw new Error(String(ref.status));
  }
  // 下書きのブランチにあるファイルを書き換えるには、そのshaが要る
  const current = await api(
    "GET",
    `/repos/${REPO}/contents/${path}?ref=${branch}`,
  );
  if (!current.ok && current.status !== 404)
    throw new Error(String(current.status));
  const sha = current.ok
    ? ((await current.json()) as { sha: string }).sha
    : undefined;
  const res = await api("PUT", `/repos/${REPO}/contents/${path}`, {
    message: `chore(content): ${path.replace(/^content\//, "")}の下書き`,
    content: encode(text),
    branch,
    ...(sha === undefined ? {} : { sha }),
  });
  if (!res.ok) throw new Error(String(res.status));
}

/** 下書きから作った、開いているPR */
export interface Pull {
  number: number;
  /** PRの先頭のコミット。チェックはこれに付く */
  sha: string;
  title: string;
  url: string;
}

/** 下書きのブランチから作った、開いているPR。なければnull */
export async function findPull(path: string): Promise<Pull | null> {
  const branch = draftBranch(path);
  const res = await api(
    "GET",
    `/repos/${REPO}/pulls?state=open&base=main&per_page=100`,
  );
  if (!res.ok) throw new Error(String(res.status));
  const pulls = (await res.json()) as {
    number: number;
    title: string;
    html_url: string;
    head: { ref: string; sha: string };
  }[];
  const p = pulls.find((x) => x.head.ref === branch);
  return p
    ? { number: p.number, sha: p.head.sha, title: p.title, url: p.html_url }
    : null;
}

/** 下書きのブランチからmainへのPRを作る。マージはチェックが通ってから(mergePull) */
export async function openPull(path: string, title: string): Promise<Pull> {
  const res = await api("POST", `/repos/${REPO}/pulls`, {
    title,
    head: draftBranch(path),
    base: "main",
    body: `管理画面から \`${path}\` を変える。`,
  });
  if (!res.ok) throw new Error(String(res.status));
  const p = (await res.json()) as {
    number: number;
    title: string;
    html_url: string;
    head: { sha: string };
  };
  return { number: p.number, sha: p.head.sha, title: p.title, url: p.html_url };
}

/** チェック1つの様子 */
export interface Check {
  name: string;
  /** queued・in_progressはまだ。completedなら、conclusionで結果を見る */
  status: string;
  conclusion: string | null;
}

/** コミットに付いたチェック */
export async function checks(sha: string): Promise<Check[]> {
  const res = await api(
    "GET",
    `/repos/${REPO}/commits/${sha}/check-runs?per_page=100`,
  );
  if (!res.ok) throw new Error(String(res.status));
  const { check_runs } = (await res.json()) as { check_runs: Check[] };
  return check_runs.map(({ name, status, conclusion }) => ({
    name,
    status,
    conclusion,
  }));
}

/** PRをまとめて(squash)マージする。必須のチェックが通っていなければGitHubが断る。マージのコミットを返す */
export async function mergePull(pull: Pull): Promise<string> {
  const res = await api(
    "PUT",
    `/repos/${REPO}/pulls/${String(pull.number)}/merge`,
    {
      merge_method: "squash",
      commit_title: `${pull.title} (#${String(pull.number)})`,
      // 下書きを保存したあとに変わっていたら、マージしない
      sha: pull.sha,
    },
  );
  if (!res.ok) throw new Error(String(res.status));
  return ((await res.json()) as { sha: string }).sha;
}

/** コミットで走ったActions(マージのあとの公開など) */
export async function runs(sha: string): Promise<Check[]> {
  const res = await api("GET", `/repos/${REPO}/actions/runs?head_sha=${sha}`);
  if (!res.ok) throw new Error(String(res.status));
  const { workflow_runs } = (await res.json()) as {
    workflow_runs: Check[];
  };
  return workflow_runs.map(({ name, status, conclusion }) => ({
    name,
    status,
    conclusion,
  }));
}
