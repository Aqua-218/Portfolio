/** 写真のアップロード。写真とcats.tomlを、1つのコミットで下書きのブランチに入れる */
import { api, draftBranch, ensureDraftBranch, readFile, REPO } from "./github";
import { addPhoto } from "./photo";

/** バイト列をbase64にする(GitHubのblobに渡す) */
function base64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000)
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await api("POST", `/repos/${REPO}${path}`, body);
  if (!res.ok) throw new Error(String(res.status));
  return (await res.json()) as T;
}

/**
 * 写真を下書きのブランチ(draft/cats/<id>.jpg)に入れる。
 * content/cats/<id>.jpg と、写真を足したcontent/cats.tomlを、1つのコミットにする。
 * jpegは、メタデータを消したもの(cleanPhoto)を渡す
 */
export async function savePhotoDraft(photo: {
  id: string;
  alt: string;
  coats: readonly string[];
  jpeg: Uint8Array;
}): Promise<void> {
  const path = `content/cats/${photo.id}.jpg`;
  const branch = draftBranch(path);
  const head = await ensureDraftBranch(branch);
  const commit = await api("GET", `/repos/${REPO}/git/commits/${head}`);
  if (!commit.ok) throw new Error(String(commit.status));
  const { tree } = (await commit.json()) as { tree: { sha: string } };

  const { text: toml } = await readFile("content/cats.toml", branch);
  const image = await post<{ sha: string }>("/git/blobs", {
    content: base64(photo.jpeg),
    encoding: "base64",
  });
  const list = await post<{ sha: string }>("/git/blobs", {
    content: addPhoto(toml, photo),
    encoding: "utf-8",
  });
  const next = await post<{ sha: string }>("/git/trees", {
    base_tree: tree.sha,
    tree: [
      { path, mode: "100644", type: "blob", sha: image.sha },
      {
        path: "content/cats.toml",
        mode: "100644",
        type: "blob",
        sha: list.sha,
      },
    ],
  });
  const made = await post<{ sha: string }>("/git/commits", {
    message: `chore(content): 写真「${photo.id}」の下書き`,
    tree: next.sha,
    parents: [head],
  });
  const moved = await api("PATCH", `/repos/${REPO}/git/refs/heads/${branch}`, {
    sha: made.sha,
  });
  if (!moved.ok) throw new Error(String(moved.status));
}
