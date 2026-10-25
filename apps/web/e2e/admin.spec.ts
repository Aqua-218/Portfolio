import { readdirSync, readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

/** Wasmや大きなモジュールを初めて読み込むのを待つ時間。e2eを並べて走らせると、読み込みが遅くなる */
const WASM = 15_000;

test("管理画面は検索に載せない", async ({ page }) => {
  await page.goto("/admin/");
  await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
});

test("サイトのどのページからも管理画面へリンクしない", () => {
  const out = new URL("../out/", import.meta.url).pathname;
  const pages = readdirSync(out, { recursive: true, encoding: "utf8" }).filter(
    (f) => f.endsWith(".html") && !f.startsWith("admin/"),
  );
  expect(pages.length).toBeGreaterThan(0);
  for (const f of pages) {
    expect(readFileSync(out + f, "utf8"), f).not.toMatch(/href="\/admin/);
  }
});

test.describe("ログイン", () => {
  test("ログインしていなければ、GitHubでログインのボタンと「この端末で覚える」が出る", async ({
    page,
  }) => {
    await page.route("**/admin/auth/me", (r) =>
      r.fulfill({ status: 401, json: { error: "ログインしていません" } }),
    );
    await page.goto("/admin/");
    const form = page.locator('form[action="/admin/auth/login"]');
    await expect(form).toHaveAttribute("method", "get");
    await expect(
      form.getByRole("button", { name: "GitHub でログイン" }),
    ).toBeVisible();
    await expect(
      form.getByRole("checkbox", { name: "この端末で覚える(30日)" }),
    ).not.toBeChecked();
  });

  test("ボタンを押すと、Workerのログインへ行く。覚えるときはremember=1をつける", async ({
    page,
  }) => {
    await page.route("**/admin/auth/me", (r) => r.fulfill({ status: 401 }));
    await page.route("**/admin/auth/login?*", (r) =>
      r.fulfill({ status: 200, body: "login" }),
    );
    await page.goto("/admin/");
    await page
      .getByRole("checkbox", { name: "この端末で覚える(30日)" })
      .check();
    await page.getByRole("button", { name: "GitHub でログイン" }).click();
    await expect(page).toHaveURL("/admin/auth/login?remember=1");
  });

  test("Workerへの呼び出しには独自ヘッダーをつける", async ({ page }) => {
    let header: string | undefined;
    await page.route("**/admin/auth/me", (r) => {
      header = r.request().headers()["x-admin"];
      return r.fulfill({ status: 401 });
    });
    await page.goto("/admin/");
    await expect(
      page.getByRole("button", { name: "GitHub でログイン" }),
    ).toBeVisible();
    expect(header).toBe("1");
  });

  test("ログインしていれば名前とログアウトが出て、ログアウトはPOSTで送る", async ({
    page,
  }) => {
    let loggedIn = true;
    let method: string | undefined;
    await page.route("**/admin/auth/me", (r) =>
      loggedIn
        ? r.fulfill({ status: 200, json: { login: "neko" } })
        : r.fulfill({ status: 401 }),
    );
    await page.route("**/admin/auth/logout", (r) => {
      method = r.request().method();
      loggedIn = false;
      return r.fulfill({ status: 200, json: { ok: true } });
    });
    await page.goto("/admin/");
    await expect(page.getByText("neko でログインしています")).toBeVisible();
    await page.getByRole("button", { name: "ログアウト" }).click();
    await expect(
      page.getByRole("button", { name: "GitHub でログイン" }),
    ).toBeVisible();
    expect(method).toBe("POST");
  });

  test("失敗の記号は決まった文にし、URLから消す", async ({ page }) => {
    await page.route("**/admin/auth/me", (r) => r.fulfill({ status: 401 }));
    await page.goto("/admin/?error=owner");
    await expect(page.locator("main").getByRole("alert")).toHaveText(
      "この管理画面に入れるのは持ち主だけです。",
    );
    await expect(page).toHaveURL("/admin/");
  });

  test("知らない記号や文は出さない", async ({ page }) => {
    await page.route("**/admin/auth/me", (r) => r.fulfill({ status: 401 }));
    await page.goto(
      `/admin/?error=${encodeURIComponent("パスワードを入力してください")}`,
    );
    await expect(
      page.getByRole("button", { name: "GitHub でログイン" }),
    ).toBeVisible();
    await expect(page.locator("main").getByRole("alert")).toHaveCount(0);
    await expect(page.getByText("パスワード")).toHaveCount(0);
  });
});

test.describe("守りのヘッダー", () => {
  test("CSPなどのヘッダーがつき、CSPの下でも画面が動く", async ({ page }) => {
    const refused: string[] = [];
    page.on("console", (m) => {
      if (m.text().includes("Content Security Policy")) refused.push(m.text());
    });
    page.on("pageerror", (e) => {
      refused.push(e.message);
    });
    await page.route("**/admin/auth/me", (r) =>
      r.fulfill({ status: 200, json: { login: "neko" } }),
    );
    const res = await page.goto("/admin/");
    const headers = res?.headers() ?? {};
    expect(headers["content-security-policy"]).toContain("default-src 'none'");
    expect(headers["content-security-policy"]).toContain(
      "frame-ancestors 'none'",
    );
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("no-referrer");
    // ハイドレーションして、ログインの状態が出る(インラインのスクリプトがハッシュで許されている)
    await expect(page.getByText("neko でログインしています")).toBeVisible();
    // ロゴのドット猫(WebAssembly)も描ける
    await expect(page.locator("header svg.px-svg")).toBeAttached();
    expect(refused).toEqual([]);
  });

  test("CSPは外のスクリプトを読ませない", async ({ page }) => {
    await page.route("**/admin/auth/me", (r) => r.fulfill({ status: 401 }));
    await page.goto("/admin/");
    const ran = await page.evaluate(
      () =>
        new Promise<boolean>((resolve) => {
          const s = document.createElement("script");
          s.src = "https://evil.example/x.js";
          s.onload = () => {
            resolve(true);
          };
          s.onerror = () => {
            resolve(false);
          };
          document.head.append(s);
        }),
    );
    expect(ran).toBe(false);
  });
});

test.describe("content/の一覧", () => {
  const TREE = {
    tree: [
      { path: "content", type: "tree" },
      { path: "content/events/2026-08-10-seccamp.md", type: "blob" },
      { path: "content/events/2025-11-30-u22-final.md", type: "blob" },
      { path: "content/profile.toml", type: "blob" },
      { path: "content/cats/kuro.jpg", type: "blob" },
      { path: "content/.cache/ogp.json", type: "blob" },
      { path: "apps/web/package.json", type: "blob" },
    ],
  };

  test.beforeEach(async ({ page }) => {
    await page.route("**/admin/auth/me", (r) =>
      r.fulfill({ status: 200, json: { login: "neko" } }),
    );
  });

  test("ログインすると、Workerを通してmainのファイルを読み、種類ごとに出す", async ({
    page,
  }) => {
    const asked: { path: string | null; admin: string | undefined }[] = [];
    await page.route("**/admin/api?*", (r) => {
      const path = new URL(r.request().url()).searchParams.get("path");
      asked.push({ path, admin: r.request().headers()["x-admin"] });
      return r.fulfill({
        status: 200,
        json: path?.includes("/matching-refs/") ? [] : TREE,
      });
    });
    await page.goto("/admin/");
    const list = page.getByRole("region", { name: "content/ の一覧" });
    await expect(
      list.getByRole("heading", { name: /^イベント/ }),
    ).toBeVisible();
    await expect(list.getByRole("heading", { name: /^ページ/ })).toBeVisible();
    await expect(list.getByText("プロフィール")).toBeVisible();
    await expect(list.getByText("kuro.jpg")).toBeVisible();
    // content/の外と.cacheは出さない
    await expect(list.getByText("package.json")).toHaveCount(0);
    await expect(list.getByText("ogp.json")).toHaveCount(0);
    // mainのファイルと、下書きのブランチを読む
    expect(asked).toEqual(
      expect.arrayContaining([
        {
          path: "/repos/Aqua-218/Portfolio/git/trees/main?recursive=1",
          admin: "1",
        },
        {
          path: "/repos/Aqua-218/Portfolio/git/matching-refs/heads/draft/",
          admin: "1",
        },
      ]),
    );
  });

  test("名前で絞り込める", async ({ page }) => {
    await page.route("**/admin/api?*", (r) =>
      r.fulfill({
        status: 200,
        json: r.request().url().includes("matching-refs") ? [] : TREE,
      }),
    );
    await page.goto("/admin/");
    const list = page.getByRole("region", { name: "content/ の一覧" });
    await list
      .getByRole("searchbox", { name: "名前で絞り込む" })
      .fill("seccamp");
    await expect(list.getByText("2026-08-10-seccamp.md")).toBeVisible();
    await expect(list.getByText("2025-11-30-u22-final.md")).toHaveCount(0);
    await expect(list.getByRole("heading", { name: /^ページ/ })).toHaveCount(0);
    await list.getByRole("searchbox", { name: "名前で絞り込む" }).fill("nyan");
    await expect(list.getByText("見つかりません")).toBeVisible();
  });

  test("下書きのあるファイルに「下書き」と出す", async ({ page }) => {
    await page.route("**/admin/api?*", (r) =>
      r.fulfill({
        status: 200,
        json: r.request().url().includes("matching-refs")
          ? [{ ref: "refs/heads/draft/events/2026-08-10-seccamp.md" }]
          : TREE,
      }),
    );
    await page.goto("/admin/");
    const list = page.getByRole("region", { name: "content/ の一覧" });
    await expect(
      list.getByRole("listitem").filter({ hasText: "2026-08-10-seccamp.md" }),
    ).toContainText("下書き");
    await expect(
      list.getByRole("listitem").filter({ hasText: "2025-11-30-u22-final.md" }),
    ).not.toContainText("下書き");
  });

  test("ログインが切れていたら、そう出す", async ({ page }) => {
    await page.route("**/admin/api?*", (r) => r.fulfill({ status: 401 }));
    await page.goto("/admin/");
    await expect(page.locator("main").getByRole("alert")).toHaveText(
      "ログインが切れました。ログインし直してください。",
    );
  });
});

test.describe("編集", () => {
  const EVENT = `---
title: セキュリティ・キャンプ全国大会
date: 2026-08-10
end: 2026-08-15
venue: 多摩 LINK FOREST
tags: [Z1ゼミ]
---

いやぁ〜〜楽しかったですよ、ほんとに。
`;
  const TOML = 'name = "小峯 圭也"\n';
  const b64 = (t: string) => Buffer.from(t, "utf8").toString("base64");

  test.beforeEach(async ({ page }) => {
    await page.route("**/admin/auth/me", (r) =>
      r.fulfill({ status: 200, json: { login: "neko" } }),
    );
    await page.route("**/admin/api?*", (r) => {
      const path = new URL(r.request().url()).searchParams.get("path") ?? "";
      if (path.includes("/git/matching-refs/")) return r.fulfill({ json: [] });
      if (path.includes("/git/trees/")) {
        return r.fulfill({
          json: {
            tree: [
              { path: "content/events/2026-08-10-seccamp.md", type: "blob" },
              { path: "content/profile.toml", type: "blob" },
              { path: "content/cats/kuro.jpg", type: "blob" },
            ],
          },
        });
      }
      if (path.includes("seccamp.md?ref=main")) {
        return r.fulfill({ json: { content: b64(EVENT), sha: "a1" } });
      }
      if (path.includes("profile.toml?ref=main")) {
        return r.fulfill({ json: { content: b64(TOML), sha: "b2" } });
      }
      return r.fulfill({ status: 404 });
    });
    await page.goto("/admin/");
  });

  test("イベントを開くと、項目がフォームに、本文がMarkdownで入る", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "2026-08-10-seccamp.md" }).click();
    const editor = page.getByRole("region", {
      name: "content/events/2026-08-10-seccamp.md の編集",
    });
    await expect(editor.getByLabel("タイトル")).toHaveValue(
      "セキュリティ・キャンプ全国大会",
    );
    await expect(editor.getByLabel("開始日")).toHaveValue("2026-08-10");
    await expect(editor.getByLabel(/^最終日/)).toHaveValue("2026-08-15");
    await expect(editor.getByLabel(/^会場/)).toHaveValue("多摩 LINK FOREST");
    await expect(editor.getByLabel(/^タグ/)).toHaveValue("Z1ゼミ");
    await expect(editor.getByLabel("本文(Markdown)")).toHaveValue(
      "いやぁ〜〜楽しかったですよ、ほんとに。\n",
    );
    await expect(editor.getByText("変更あり")).toHaveCount(0);
  });

  test("書き換えると「変更あり」になり、戻るときに確かめる", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "2026-08-10-seccamp.md" }).click();
    await page.getByLabel("タイトル").fill("セキュキャン");
    await expect(page.getByText("変更あり")).toBeVisible();
    // 「やめる」を選ぶと、編集を続ける
    page.once("dialog", (d) => void d.dismiss());
    await page.getByRole("button", { name: "一覧へ戻る" }).click();
    await expect(page.getByLabel("タイトル")).toHaveValue("セキュキャン");
    // 元に戻すと「変更あり」は消える
    await page.getByLabel("タイトル").fill("セキュリティ・キャンプ全国大会");
    await expect(page.getByText("変更あり")).toHaveCount(0);
    await page.getByRole("button", { name: "一覧へ戻る" }).click();
    await expect(
      page.getByRole("searchbox", { name: "名前で絞り込む" }),
    ).toBeVisible();
  });

  test("TOMLはそのままの文字で編集する", async ({ page }) => {
    await page.getByRole("button", { name: "プロフィール" }).click();
    await expect(page.getByLabel("中身")).toHaveValue(TOML);
  });

  test("書いている途中で、ビルドと同じ検証をして、間違いのある欄に理由を出す", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "2026-08-10-seccamp.md" }).click();
    // 最初の検証は、検証のWasmを読み込んでからなので時間がかかる
    await expect(
      page.getByText("ビルドと同じ検証で、間違いはありません。"),
    ).toBeVisible({ timeout: WASM });
    await page.getByLabel("タイトル").fill("");
    await expect(page.getByText("間違いが 1 件あります。")).toBeVisible();
    // タイトルの欄の中に、理由が出る
    await expect(
      page.locator("label", { hasText: "タイトル" }).getByRole("alert"),
    ).toContainText("title");
    await page.getByLabel("タイトル").fill("セキュキャン");
    await expect(
      page.getByText("ビルドと同じ検証で、間違いはありません。"),
    ).toBeVisible();
  });

  test("TOMLの間違いは、行番号つきで出す", async ({ page }) => {
    await page.getByRole("button", { name: "プロフィール" }).click();
    await page.getByLabel("中身").fill('name = "小峯 圭也"\nname = 2\n');
    await expect(page.locator("main ul[role=alert]")).toContainText("行目", {
      timeout: WASM,
    });
  });

  test("プレビューは本番と同じ見た目で、書き換えたものを出す", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => {
      errors.push(e.message);
    });
    await page.getByRole("button", { name: "2026-08-10-seccamp.md" }).click();
    await page.getByLabel("タイトル").fill("セキュキャン");
    await page
      .getByLabel("本文(Markdown)")
      .fill("> [!NOTE]\n> 猫は液体です。\n\n```rust\nfn main() {}\n```\n");
    await page.getByRole("button", { name: "プレビュー" }).click();
    const preview = page.getByRole("region", { name: "プレビュー" });
    // Markdownの処理(Shikiなど)とドット猫のWasmは、プレビューを開いてから読み込む
    await expect(preview.locator("time")).toHaveText("8/10–15", {
      timeout: WASM,
    });
    await expect(preview.getByText("セキュキャン")).toBeVisible();
    await expect(preview.getByText("@ 多摩 LINK FOREST")).toBeVisible();
    // アラートの猫(Wasm)とコードの色(Shiki)も本番と同じ
    await expect(preview.locator(".callout svg.px-svg")).toBeAttached();
    await expect(preview.locator("pre.shiki")).toBeVisible();
    // 編集に戻ると、書いたものが残っている
    await page.getByRole("button", { name: "編集" }).click();
    await expect(page.getByLabel("タイトル")).toHaveValue("セキュキャン");
    expect(errors).toEqual([]);
  });

  test("TOMLにはプレビューがない", async ({ page }) => {
    await page.getByRole("button", { name: "プロフィール" }).click();
    await expect(page.getByLabel("中身")).toBeVisible();
    await expect(page.getByRole("button", { name: "プレビュー" })).toHaveCount(
      0,
    );
  });

  test("下書きに保存すると、mainからdraft/のブランチを作って、そこにコミットする", async ({
    page,
  }) => {
    const calls: { method: string; path: string; body: unknown }[] = [];
    await page.route("**/admin/api?*", (r) => {
      const req = r.request();
      const path = new URL(req.url()).searchParams.get("path") ?? "";
      const body: unknown = req.postData() ? req.postDataJSON() : null;
      calls.push({ method: req.method(), path, body });
      if (path.endsWith("/git/ref/heads/main"))
        return r.fulfill({ json: { object: { sha: "m1" } } });
      if (req.method() === "POST" && path.endsWith("/git/refs"))
        return r.fulfill({ status: 201, json: {} });
      if (req.method() === "PUT") return r.fulfill({ json: {} });
      return r.fallback();
    });
    await page.getByRole("button", { name: "2026-08-10-seccamp.md" }).click();
    const save = page.getByRole("button", { name: "下書きに保存" });
    // 変えていなければ押せない
    await expect(save).toBeDisabled();
    await page.getByLabel("タイトル").fill("セキュキャン");
    await save.click();
    await expect(page.getByRole("status")).toHaveText(
      "下書きに保存しました。まだ公開していません。",
    );
    await expect(page.getByText("変更あり")).toHaveCount(0);
    await expect(
      page.locator("main").getByText("下書き", { exact: true }),
    ).toBeVisible();

    const repo = "/repos/Aqua-218/Portfolio";
    const branch = "draft/events/2026-08-10-seccamp.md";
    expect(calls).toContainEqual({
      method: "POST",
      path: `${repo}/git/refs`,
      body: { ref: `refs/heads/${branch}`, sha: "m1" },
    });
    const put = calls.find((c) => c.method === "PUT");
    expect(put?.path).toBe(
      `${repo}/contents/content/events/2026-08-10-seccamp.md`,
    );
    const sent = put?.body as { branch: string; content: string; sha?: string };
    expect(sent.branch).toBe(branch);
    // 下書きのブランチにまだファイルがないので、shaはつけない
    expect(sent.sha).toBeUndefined();
    expect(Buffer.from(sent.content, "base64").toString("utf8")).toContain(
      "title: セキュキャン",
    );
    // mainには書かない
    expect(
      calls.filter(
        (c) => c.method !== "GET" && JSON.stringify(c.body).includes('"main"'),
      ),
    ).toEqual([]);
  });

  test("下書きがあれば、下書きを開く", async ({ page }) => {
    const DRAFT = EVENT.replace(
      "セキュリティ・キャンプ全国大会",
      "セキュキャン(下書き)",
    );
    await page.route("**/admin/api?*", (r) => {
      const path = new URL(r.request().url()).searchParams.get("path") ?? "";
      if (path.includes("seccamp.md?ref=draft/events/2026-08-10-seccamp.md"))
        return r.fulfill({ json: { content: b64(DRAFT), sha: "d1" } });
      return r.fallback();
    });
    await page.getByRole("button", { name: "2026-08-10-seccamp.md" }).click();
    await expect(page.getByLabel("タイトル")).toHaveValue(
      "セキュキャン(下書き)",
    );
    await expect(
      page.getByText("下書きを開いています。まだ公開していません。"),
    ).toBeVisible();
  });

  test("保存に失敗したら、理由を出して、変更は残す", async ({ page }) => {
    await page.route("**/admin/api?*", (r) => {
      const path = new URL(r.request().url()).searchParams.get("path") ?? "";
      if (path.endsWith("/git/ref/heads/draft/events/2026-08-10-seccamp.md"))
        return r.fulfill({ json: { object: { sha: "d0" } } });
      if (r.request().method() === "PUT") return r.fulfill({ status: 409 });
      return r.fallback();
    });
    await page.getByRole("button", { name: "2026-08-10-seccamp.md" }).click();
    await page.getByLabel("タイトル").fill("セキュキャン");
    await page.getByRole("button", { name: "下書きに保存" }).click();
    await expect(page.locator("main").getByRole("alert").first()).toHaveText(
      "下書きがほかで書き換えられています。一覧へ戻って開き直してください。",
    );
    await expect(page.getByText("変更あり")).toBeVisible();
  });

  test("写真は開けない(アップロードで扱う)", async ({ page }) => {
    await expect(page.getByText("kuro.jpg")).toBeVisible();
    await expect(page.getByRole("button", { name: "kuro.jpg" })).toHaveCount(0);
  });
});
