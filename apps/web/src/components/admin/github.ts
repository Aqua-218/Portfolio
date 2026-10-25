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
