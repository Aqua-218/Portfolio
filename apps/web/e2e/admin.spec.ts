import { readdirSync, readFileSync } from "node:fs";
import { expect, type Page, test } from "@playwright/test";

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

  test.describe("公開", () => {
    const DRAFT = EVENT.replace(
      "セキュリティ・キャンプ全国大会",
      "セキュキャン(下書き)",
    );
    const repo = "/repos/Aqua-218/Portfolio";
    const branch = "draft/events/2026-08-10-seccamp.md";
    const ok = (name: string) => ({
      name,
      status: "completed",
      conclusion: "success",
    });

    /** 下書きがあり、PRはまだない。PRを作ると#12になる */
    async function mock(
      page: Page,
      opts: { pulls?: unknown[]; checks?: unknown[] } = {},
    ) {
      const calls: { method: string; path: string; body: unknown }[] = [];
      await page.route("**/admin/api?*", (r) => {
        const req = r.request();
        const path = new URL(req.url()).searchParams.get("path") ?? "";
        const body: unknown = req.postData() ? req.postDataJSON() : null;
        calls.push({ method: req.method(), path, body });
        if (path.includes(`seccamp.md?ref=${branch}`))
          return r.fulfill({ json: { content: b64(DRAFT), sha: "d1" } });
        if (path.startsWith(`${repo}/pulls?`))
          return r.fulfill({ json: opts.pulls ?? [] });
        if (req.method() === "POST" && path === `${repo}/pulls`)
          return r.fulfill({
            status: 201,
            json: {
              number: 12,
              title: (body as { title: string }).title,
              html_url: "https://github.com/Aqua-218/Portfolio/pull/12",
              head: { sha: "h1" },
            },
          });
        if (path.includes("/check-runs"))
          return r.fulfill({
            json: { check_runs: opts.checks ?? [ok("build"), ok("vrt")] },
          });
        if (req.method() === "PUT" && path.endsWith("/merge"))
          return r.fulfill({ json: { sha: "m9", merged: true } });
        if (path.includes("/actions/runs?head_sha=m9"))
          return r.fulfill({
            json: { workflow_runs: [{ ...ok("CI"), status: "in_progress" }] },
          });
        return r.fallback();
      });
      return calls;
    }

    test("変わるところとタイトルを確かめてPRを作り、チェックが通ったらマージする", async ({
      page,
    }) => {
      const calls = await mock(page);
      await page.getByRole("button", { name: "2026-08-10-seccamp.md" }).click();
      const publish = page.getByRole("region", { name: "公開" });
      await publish
        .getByRole("button", { name: "この下書きを公開する" })
        .click();

      const diff = publish.getByRole("list", { name: "変わるところ" });
      await expect(diff).toContainText(
        "- title: セキュリティ・キャンプ全国大会",
      );
      await expect(diff).toContainText("+ title: セキュキャン(下書き)");
      const title = publish.getByLabel(/^PRのタイトル/);
      await expect(title).toHaveValue(
        "content: イベント「セキュキャン(下書き)」を更新する",
      );
      // 種類のないタイトルではPRを作れない
      await title.fill("セキュキャンを直す");
      await expect(publish.getByRole("alert")).toHaveText(
        "「content: 」のように、種類から書いてください。",
      );
      await expect(
        publish.getByRole("button", { name: "PRを作る" }),
      ).toBeDisabled();
      await title.fill("content: セキュキャンを直す");
      await publish.getByRole("button", { name: "PRを作る" }).click();

      await expect(publish).toContainText(
        "PR #12のチェックがすべて通りました。",
      );
      await publish.getByRole("button", { name: "マージして公開する" }).click();
      await expect(publish.getByRole("status")).toHaveText(
        "マージしました。mainで走るものを待っています…",
      );
      await expect(
        publish.getByRole("listitem").filter({ hasText: "CI" }),
      ).toContainText("動いています");

      expect(calls).toContainEqual({
        method: "POST",
        path: `${repo}/pulls`,
        body: {
          title: "content: セキュキャンを直す",
          head: branch,
          base: "main",
          body: "管理画面から `content/events/2026-08-10-seccamp.md` を変える。",
        },
      });
      expect(calls).toContainEqual({
        method: "PUT",
        path: `${repo}/pulls/12/merge`,
        body: {
          merge_method: "squash",
          commit_title: "content: セキュキャンを直す (#12)",
          sha: "h1",
        },
      });
    });

    test("もうPRがあれば、そのチェックを出す。落ちていればマージさせない", async ({
      page,
    }) => {
      await mock(page, {
        pulls: [
          {
            number: 7,
            title: "content: 前に作ったPR",
            html_url: "https://github.com/Aqua-218/Portfolio/pull/7",
            head: { ref: branch, sha: "h7" },
          },
        ],
        checks: [
          ok("build"),
          { name: "vrt", status: "completed", conclusion: "failure" },
        ],
      });
      await page.getByRole("button", { name: "2026-08-10-seccamp.md" }).click();
      const publish = page.getByRole("region", { name: "公開" });
      await expect(publish).toContainText(
        "PR #7のチェックで、落ちたものがあります。PRで理由を見てください。",
      );
      await expect(
        publish.getByRole("listitem").filter({ hasText: "vrt" }),
      ).toContainText("落ちました");
      await expect(
        publish.getByRole("button", { name: "マージして公開する" }),
      ).toBeDisabled();
    });

    test("保存していない変更があれば、公開の前に保存させる", async ({
      page,
    }) => {
      await mock(page);
      await page.getByRole("button", { name: "2026-08-10-seccamp.md" }).click();
      await page.getByLabel("タイトル").fill("まだ保存していない");
      await expect(
        page.getByText("公開するには、先に下書きに保存してください。"),
      ).toBeVisible();
      await expect(page.getByRole("region", { name: "公開" })).toHaveCount(0);
    });
  });

  test("写真は開けない(アップロードで扱う)", async ({ page }) => {
    await expect(page.getByText("kuro.jpg")).toBeVisible();
    await expect(page.getByRole("button", { name: "kuro.jpg" })).toHaveCount(0);
  });
});

test.describe("写真を足す", () => {
  const repo = "/repos/Aqua-218/Portfolio";
  const TOML = '[[photo]]\nid = "kuro"\nalt = "黒猫"\ncoats = ["kuro"]\n';

  /** content/cats/の写真のSOIのすぐあとに、位置情報(GPS)を書いたEXIFを差し込む */
  function withGps(): Buffer {
    const jpeg = readFileSync(
      new URL("../../../content/cats/futari.jpg", import.meta.url),
    );
    const body = Buffer.concat([
      Buffer.from("Exif\0\0MM\0*", "latin1"),
      Buffer.from("GPSLatitude 36.5551N GPSLongitude 139.8828E", "latin1"),
    ]);
    const head = Buffer.from([0xff, 0xe1, 0, 0]);
    head.writeUInt16BE(body.length + 2, 2);
    return Buffer.concat([jpeg.subarray(0, 2), head, body, jpeg.subarray(2)]);
  }

  /** JPEGの中の、メタデータの種類(SOSまでを見る) */
  function metadata(jpeg: Buffer): string[] {
    const found: string[] = [];
    let i = 2;
    while (i + 4 <= jpeg.length && jpeg[i] === 0xff) {
      const marker = jpeg[i + 1] ?? 0;
      if (marker === 0xda) break;
      const len = jpeg.readUInt16BE(i + 2);
      const body = jpeg.subarray(i + 4, i + 2 + len).toString("latin1");
      if (marker === 0xe1) found.push(body.slice(0, 4));
      if (marker === 0xed) found.push("IPTC");
      i += 2 + len;
    }
    return found;
  }

  test("位置情報を消してから、写真とcats.tomlを1つのコミットで下書きに入れる", async ({
    page,
  }) => {
    const calls: { method: string; path: string; body: unknown }[] = [];
    await page.route("**/admin/auth/me", (r) =>
      r.fulfill({ status: 200, json: { login: "neko" } }),
    );
    await page.route("**/admin/api?*", (r) => {
      const req = r.request();
      const path = new URL(req.url()).searchParams.get("path") ?? "";
      const body: unknown = req.postData() ? req.postDataJSON() : null;
      calls.push({ method: req.method(), path, body });
      if (path.includes("/git/matching-refs/")) return r.fulfill({ json: [] });
      if (path.includes("/git/trees/main"))
        return r.fulfill({
          json: { tree: [{ path: "content/cats/kuro.jpg", type: "blob" }] },
        });
      if (path.endsWith("/git/ref/heads/main"))
        return r.fulfill({ json: { object: { sha: "m1" } } });
      if (path.endsWith("/git/commits/m1"))
        return r.fulfill({ json: { tree: { sha: "t1" } } });
      if (path.includes("cats.toml?ref=draft/cats/tama.jpg"))
        return r.fulfill({
          json: { content: Buffer.from(TOML).toString("base64"), sha: "x" },
        });
      if (req.method() === "POST" && path.endsWith("/git/refs"))
        return r.fulfill({ status: 201, json: {} });
      if (req.method() === "POST" && path.endsWith("/git/blobs"))
        return r.fulfill({
          status: 201,
          json: { sha: `blob${String(calls.length)}` },
        });
      if (req.method() === "POST" && path.endsWith("/git/trees"))
        return r.fulfill({ status: 201, json: { sha: "t2" } });
      if (req.method() === "POST" && path.endsWith("/git/commits"))
        return r.fulfill({ status: 201, json: { sha: "c2" } });
      if (req.method() === "PATCH") return r.fulfill({ json: {} });
      return r.fulfill({ status: 404 });
    });
    await page.goto("/admin/");
    await page.locator("summary", { hasText: "写真を足す" }).click();

    const gps = withGps();
    expect(metadata(gps)).toContain("Exif");
    await page.getByLabel("写真を選ぶ").setInputFiles({
      name: "IMG_0001.jpg",
      mimeType: "image/jpeg",
      buffer: gps,
    });
    await expect(page.getByRole("img", { name: "足す写真" })).toBeVisible({
      timeout: WASM,
    });

    // もうある名前は使えない
    await page.getByLabel(/^ファイル名/).fill("kuro");
    await expect(
      page.getByText("同じ名前の写真がもうあります。").first(),
    ).toBeVisible();
    await page.getByLabel(/^ファイル名/).fill("tama");
    await page.getByLabel(/^説明/).fill('寝ている"たま"');
    await page.getByLabel("三毛").check();
    await page.getByRole("button", { name: "下書きに保存" }).click();
    await expect(page.getByRole("status")).toHaveText(
      "写真「tama」を下書きに保存しました。まだ公開していません。",
    );

    // コミットする写真には、メタデータも位置情報の文字も残っていない
    const blobs = calls.filter((c) => c.path.endsWith("/git/blobs"));
    const image = blobs.find(
      (c) => (c.body as { encoding: string }).encoding === "base64",
    );
    const sent = Buffer.from(
      (image?.body as { content: string }).content,
      "base64",
    );
    expect([...sent.subarray(0, 2)]).toEqual([0xff, 0xd8]);
    expect(metadata(sent)).toEqual([]);
    expect(sent.includes(Buffer.from("GPS"))).toBe(false);

    const toml = blobs.find(
      (c) => (c.body as { encoding: string }).encoding === "utf-8",
    );
    expect((toml?.body as { content: string }).content).toBe(
      `${TOML}\n[[photo]]\nid = "tama"\nalt = "寝ている\\"たま\\""\ncoats = ["mike"]\n`,
    );

    // 写真とcats.tomlを1つのコミットにして、下書きのブランチを進める
    const tree = calls.find((c) => c.path.endsWith("/git/trees"));
    expect(tree?.body).toMatchObject({
      base_tree: "t1",
      tree: [
        { path: "content/cats/tama.jpg", mode: "100644", type: "blob" },
        { path: "content/cats.toml", mode: "100644", type: "blob" },
      ],
    });
    expect(calls).toContainEqual({
      method: "POST",
      path: `${repo}/git/commits`,
      body: {
        message: "chore(content): 写真「tama」の下書き",
        tree: "t2",
        parents: ["m1"],
      },
    });
    expect(calls).toContainEqual({
      method: "PATCH",
      path: `${repo}/git/refs/heads/draft/cats/tama.jpg`,
      body: { sha: "c2" },
    });
  });

  test("足した写真の下書きを開き、cats.tomlの違いを確かめて公開する", async ({
    page,
  }) => {
    const DRAFT_TOML = `${TOML}\n[[photo]]\nid = "tama"\nalt = "寝ている三毛猫"\ncoats = ["mike"]\n`;
    const photo = readFileSync(
      new URL("../../../content/cats/futari.jpg", import.meta.url),
    );
    const calls: { method: string; path: string; body: unknown }[] = [];
    await page.route("**/admin/auth/me", (r) =>
      r.fulfill({ status: 200, json: { login: "neko" } }),
    );
    await page.route("**/admin/api?*", (r) => {
      const req = r.request();
      const path = new URL(req.url()).searchParams.get("path") ?? "";
      const body: unknown = req.postData() ? req.postDataJSON() : null;
      calls.push({ method: req.method(), path, body });
      const b64 = (t: string | Buffer) => Buffer.from(t).toString("base64");
      if (path.includes("/git/matching-refs/"))
        return r.fulfill({ json: [{ ref: "refs/heads/draft/cats/tama.jpg" }] });
      if (path.includes("/git/trees/main"))
        return r.fulfill({
          json: { tree: [{ path: "content/cats/kuro.jpg", type: "blob" }] },
        });
      if (path.includes("tama.jpg?ref=draft/cats/tama.jpg"))
        return r.fulfill({ json: { sha: "p1" } });
      if (path.endsWith("/git/blobs/p1"))
        return r.fulfill({ json: { content: b64(photo) } });
      if (path.includes("cats.toml?ref=draft/cats/tama.jpg"))
        return r.fulfill({ json: { content: b64(DRAFT_TOML), sha: "d" } });
      if (path.includes("cats.toml?ref=main"))
        return r.fulfill({ json: { content: b64(TOML), sha: "m" } });
      if (path.startsWith(`${repo}/pulls?`)) return r.fulfill({ json: [] });
      if (req.method() === "POST" && path === `${repo}/pulls`)
        return r.fulfill({
          status: 201,
          json: {
            number: 20,
            title: (body as { title: string }).title,
            html_url: "https://github.com/Aqua-218/Portfolio/pull/20",
            head: { sha: "h20" },
          },
        });
      if (path.includes("/check-runs"))
        return r.fulfill({ json: { check_runs: [] } });
      return r.fulfill({ status: 404 });
    });
    await page.goto("/admin/");
    const list = page.getByRole("region", { name: "content/ の一覧" });
    await expect(
      list.getByRole("heading", { name: /^足した写真の下書き/ }),
    ).toBeVisible();
    await list.getByRole("button", { name: "tama.jpg" }).click();

    const view = page.getByRole("region", { name: "写真「tama」の下書き" });
    await expect(view.getByRole("img", { name: "写真「tama」" })).toBeVisible();
    const publish = view.getByRole("region", { name: "公開" });
    await publish.getByRole("button", { name: "この下書きを公開する" }).click();
    await expect(publish).toContainText("足すファイル: content/cats/tama.jpg");
    const diff = publish.getByRole("list", { name: "変わるところ" });
    await expect(diff).toContainText('+ id = "tama"');
    await expect(diff).not.toContainText("- ");
    await expect(publish.getByLabel(/^PRのタイトル/)).toHaveValue(
      "content: 写真「tama」を足す",
    );
    await publish.getByRole("button", { name: "PRを作る" }).click();
    await expect(publish).toContainText("PR #20");
    expect(calls).toContainEqual(
      expect.objectContaining({
        method: "POST",
        path: `${repo}/pulls`,
        body: expect.objectContaining({
          head: "draft/cats/tama.jpg",
          base: "main",
        }),
      }),
    );
  });

  test("読めない写真は、そう出す", async ({ page }) => {
    await page.route("**/admin/auth/me", (r) =>
      r.fulfill({ status: 200, json: { login: "neko" } }),
    );
    await page.route("**/admin/api?*", (r) =>
      r.fulfill({
        json: r.request().url().includes("matching-refs") ? [] : { tree: [] },
      }),
    );
    await page.goto("/admin/");
    await page.locator("summary", { hasText: "写真を足す" }).click();
    await page.getByLabel("写真を選ぶ").setInputFiles({
      name: "a.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("not a photo"),
    });
    await expect(page.locator("details").getByRole("alert")).toHaveText(
      "この写真は読めませんでした。JPEGかPNGにしてください。",
    );
  });
});

test.describe("ブログ", () => {
  const ID = "0123456789abcdef0123";
  const POST = `---
title: Rustで猫を描く
tags:
  - Rust
private: false
updated_at: ''
id: null
organization_url_name: null
slide: false
ignorePublish: false
---
:::note info
猫は液体です。
:::
`;
  const b64 = (t: string) => Buffer.from(t, "utf8").toString("base64");
  /** 下書きのブランチに書いたもの */
  let saved: string[];
  /** Qiitaへの中継に来たもの */
  let qiita: { method: string; path: string; body: unknown }[];

  test.beforeEach(async ({ page }) => {
    saved = [];
    qiita = [];
    await page.route("**/admin/auth/me", (r) =>
      r.fulfill({ status: 200, json: { login: "neko" } }),
    );
    await page.route("**/admin/api?*", (r) => {
      const req = r.request();
      const path = new URL(req.url()).searchParams.get("path") ?? "";
      if (path.includes("/git/matching-refs/")) return r.fulfill({ json: [] });
      if (path.includes("/git/trees/"))
        return r.fulfill({
          json: { tree: [{ path: "content/blog/cat.md", type: "blob" }] },
        });
      if (path.endsWith("/blog/cat.md?ref=main"))
        return r.fulfill({ json: { content: b64(POST), sha: "a1" } });
      if (path.endsWith("/git/ref/heads/main"))
        return r.fulfill({ json: { object: { sha: "m1" } } });
      if (req.method() === "POST" && path.endsWith("/git/refs"))
        return r.fulfill({ status: 201, json: {} });
      if (req.method() === "PUT") {
        const { content } = req.postDataJSON() as { content: string };
        saved.push(Buffer.from(content, "base64").toString("utf8"));
        return r.fulfill({ json: {} });
      }
      return r.fulfill({ status: 404 });
    });
    await page.goto("/admin/");
  });

  /** Qiitaの代わり。itemsは自分の記事 */
  async function fakeQiita(
    page: Page,
    items: { id: string; title: string; body: string; updated_at: string }[],
  ) {
    await page.route("**/admin/qiita?*", (r) => {
      const req = r.request();
      const path = new URL(req.url()).searchParams.get("path") ?? "";
      const body: unknown = req.postData() ? req.postDataJSON() : null;
      qiita.push({ method: req.method(), path, body });
      const full = (i: (typeof items)[number]) => ({
        ...i,
        private: false,
        tags: [{ name: "Rust" }],
        url: `https://qiita.com/neko/items/${i.id}`,
      });
      if (path.startsWith("/api/v2/authenticated_user/items"))
        return r.fulfill({ json: items.map(full) });
      if (req.method() === "POST")
        return r.fulfill({
          status: 201,
          json: full({
            id: ID,
            title: "Rustで猫を描く",
            body: "",
            updated_at: "2026-10-25T10:00:00+09:00",
          }),
        });
      const found = items.find((i) => path.endsWith(i.id));
      return found
        ? r.fulfill({ json: full(found) })
        : r.fulfill({ status: 404, json: {} });
    });
  }

  test("記事の項目がフォームに、本文がMarkdownで入る。プレビューはQiitaの記法で、本番の記事と同じ見た目", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "cat.md" }).click();
    await expect(page.getByLabel("タイトル")).toHaveValue("Rustで猫を描く");
    await expect(page.getByLabel(/^タグ/)).toHaveValue("Rust");
    await expect(page.getByLabel("Qiitaには出さない")).not.toBeChecked();
    await expect(page.getByLabel(/^本文/)).toHaveValue(
      ":::note info\n猫は液体です。\n:::\n",
    );
    await expect(page.getByText("変更あり")).toHaveCount(0);
    await page.getByRole("button", { name: "プレビュー" }).click();
    const preview = page.getByRole("region", { name: "プレビュー" });
    await expect(
      preview.getByRole("heading", { level: 1, name: "Rustで猫を描く" }),
    ).toBeVisible({ timeout: WASM });
    // Qiitaの注意書き(:::note)が、サイトの注意書きになる
    await expect(preview.locator('[data-note="info"]')).toContainText(
      "猫は液体です。",
    );
  });

  test("新しい記事は、ファイル名を決めて空の記事から書く", async ({ page }) => {
    const name = page.getByLabel(/^新しい記事のファイル名/);
    await name.fill("cat");
    await expect(
      page.getByText("その名前の記事はもうあります。"),
    ).toBeVisible();
    await name.fill("new-cat");
    await page.getByRole("button", { name: "書き始める" }).click();
    const editor = page.getByRole("region", {
      name: "content/blog/new-cat.md の編集",
    });
    await expect(editor.getByLabel("タイトル")).toHaveValue("");
    await expect(editor.getByText("変更あり")).toBeVisible();
    await editor.getByLabel("タイトル").fill("新しい猫");
    await editor.getByLabel(/^タグ/).fill("Cat");
    await editor.getByLabel(/^本文/).fill("にゃー\n");
    await editor.getByRole("button", { name: "下書きに保存" }).click();
    await expect(editor.getByText("下書きに保存しました。")).toBeVisible();
    expect(saved[0]).toContain("title: 新しい猫\ntags:\n  - Cat\n");
  });

  test("「Qiitaに出す」で投稿し、もらったidと日時を下書きに書き戻す", async ({
    page,
  }) => {
    await fakeQiita(page, []);
    await page.getByRole("button", { name: "cat.md" }).click();
    await page.getByRole("button", { name: "Qiitaに出す" }).click();
    // 押しただけでは出さない。Qiitaの様子を見てから、もう一度確かめる
    await expect(
      page.getByText("Qiitaに新しく投稿します(公開)。"),
    ).toBeVisible();
    expect(qiita.filter((c) => c.method !== "GET")).toEqual([]);
    await page.getByRole("button", { name: "投稿する" }).click();
    await expect(
      page.getByText("idと日時を下書きに書き戻しました。", { exact: false }),
    ).toBeVisible();
    const sent = qiita.find((c) => c.method === "POST");
    expect(sent?.path).toBe("/api/v2/items");
    expect(sent?.body).toEqual({
      title: "Rustで猫を描く",
      body: ":::note info\n猫は液体です。\n:::\n",
      tags: [{ name: "Rust", versions: [] }],
      private: false,
      slide: false,
    });
    expect(saved).toHaveLength(1);
    expect(saved[0]).toContain(
      `updated_at: '2026-10-25T10:00:00+09:00'\nid: ${ID}\n`,
    );
    await expect(
      page.getByRole("link", { name: "Qiitaで見る" }),
    ).toHaveAttribute("href", `https://qiita.com/neko/items/${ID}`);
  });

  test("Qiitaのほうが新しく直されていれば、聞いてから上書きする", async ({
    page,
  }) => {
    await fakeQiita(page, [
      {
        id: "fedcba9876543210fedc",
        title: "Rustで猫を描く",
        body: "Qiitaで直した",
        updated_at: "2026-10-20T10:00:00+09:00",
      },
    ]);
    await page.getByRole("button", { name: "cat.md" }).click();
    await page.getByRole("button", { name: "Qiitaに出す" }).click();
    await expect(
      page.getByText("同じタイトルの記事がもうQiitaにあります", {
        exact: false,
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: "やめる" }).click();
    expect(qiita.filter((c) => c.method !== "GET")).toEqual([]);
    expect(saved).toEqual([]);
  });

  test("保存していない変更があれば、Qiitaには出さない", async ({ page }) => {
    await page.getByRole("button", { name: "cat.md" }).click();
    await page.getByLabel("タイトル").fill("書きかけ");
    await expect(
      page.getByText("Qiitaに出すには、先に下書きに保存してください。"),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Qiitaに出す" })).toHaveCount(
      0,
    );
  });
});

test.describe("設定", () => {
  const TOKEN = "0123456789abcdef0123456789abcdef01234567";
  const info = (source: "admin" | "secret" | null) => ({
    settings: [
      {
        name: "qiita",
        label: "Qiitaのトークン",
        source,
        last4: source === null ? null : source === "admin" ? "4567" : "beef",
        at: source === "admin" ? 1_800_000_000 : null,
        by: source === "admin" ? "neko" : null,
      },
    ],
    changes:
      source === "admin"
        ? [{ name: "qiita", action: "set", at: 1_800_000_000, by: "neko" }]
        : [],
  });

  test.beforeEach(async ({ page }) => {
    await page.route("**/admin/auth/me", (r) =>
      r.fulfill({ status: 200, json: { login: "neko" } }),
    );
    await page.route("**/admin/api?*", (r) => {
      const path = new URL(r.request().url()).searchParams.get("path") ?? "";
      if (path.includes("/git/matching-refs/")) return r.fulfill({ json: [] });
      return r.fulfill({ json: { tree: [] } });
    });
    await page.goto("/admin/");
  });

  test("Qiitaのトークンを入れ替える。値は送るだけで、画面には最後の4字しか出さない", async ({
    page,
  }) => {
    const sent: { method: string; body: unknown }[] = [];
    await page.route("**/admin/settings*", (r) => {
      const req = r.request();
      sent.push({
        method: req.method(),
        body: req.postData() ? req.postDataJSON() : null,
      });
      return r.fulfill({
        json: info(req.method() === "PUT" ? "admin" : "secret"),
      });
    });
    await page.getByRole("button", { name: "設定" }).click();
    const region = page.getByRole("region", { name: "設定" });
    await expect(
      region.getByText("wrangler secret のもの(…beef)"),
    ).toBeVisible();
    const input = region.getByLabel(/^新しい値/);
    await expect(input).toHaveAttribute("type", "password");
    await input.fill(TOKEN);
    await region.getByRole("button", { name: "入れ替える" }).click();
    await expect(region.getByText("入れ替えました。")).toBeVisible();
    await expect(region.getByText(/管理画面で入れたもの\(…4567/)).toBeVisible();
    await expect(input).toHaveValue("");
    expect(sent.at(-1)).toEqual({ method: "PUT", body: { value: TOKEN } });
    await expect(page.locator("body")).not.toContainText(TOKEN);
    await expect(region.getByText("Qiitaのトークンを入れ替えた")).toBeVisible();
    // Actionsのものは、GitHubの画面へ案内するだけ
    await expect(
      region.getByRole("link", { name: "GitHubでActionsのsecretsを開く" }),
    ).toHaveAttribute(
      "href",
      "https://github.com/Aqua-218/Portfolio/settings/secrets/actions",
    );
  });

  test("Qiitaが受けつけなければ、理由を出す", async ({ page }) => {
    await page.route("**/admin/settings*", (r) =>
      r.request().method() === "PUT"
        ? r.fulfill({
            status: 422,
            json: { error: "Qiitaがこのトークンを受けつけません" },
          })
        : r.fulfill({ json: info(null) }),
    );
    await page.getByRole("button", { name: "設定" }).click();
    await expect(page.getByText("入っていません")).toBeVisible();
    await page.getByLabel(/^新しい値/).fill("f".repeat(40));
    await page.getByRole("button", { name: "入れ替える" }).click();
    await expect(
      page.getByRole("region", { name: "設定" }).getByRole("alert"),
    ).toHaveText("Qiitaがこのトークンを受けつけません。");
  });
});

test.describe("ダッシュボード", () => {
  const b64 = (t: string) => Buffer.from(t, "utf8").toString("base64");
  const ID = "0123456789abcdef0123";

  test("下書き・公開待ち・最近の公開・ブログのQiitaへの出し具合・中身の数を出す", async ({
    page,
  }) => {
    await page.route("**/admin/auth/me", (r) =>
      r.fulfill({ status: 200, json: { login: "neko" } }),
    );
    await page.route("**/admin/api?*", (r) => {
      const path = new URL(r.request().url()).searchParams.get("path") ?? "";
      if (path.includes("/git/matching-refs/"))
        return r.fulfill({
          json: [{ ref: "refs/heads/draft/events/2026-08-10-seccamp.md" }],
        });
      if (path.includes("/git/trees/"))
        return r.fulfill({
          json: {
            tree: [
              { path: "content/events/2026-08-10-seccamp.md", type: "blob" },
              { path: "content/blog/cat.md", type: "blob" },
              { path: "content/profile.toml", type: "blob" },
            ],
          },
        });
      if (path.includes("/pulls?"))
        return r.fulfill({
          json: [
            {
              number: 7,
              title: "content: イベント「セキュキャン」を更新する",
              html_url: "https://github.com/x/pull/7",
              head: {
                ref: "draft/events/2026-08-10-seccamp.md",
                sha: "p7",
              },
            },
          ],
        });
      if (path.includes("/commits/p7/check-runs"))
        return r.fulfill({
          json: {
            check_runs: [
              { name: "build", status: "completed", conclusion: "failure" },
            ],
          },
        });
      if (path.includes("/actions/runs?branch=main"))
        return r.fulfill({
          json: {
            workflow_runs: [
              {
                name: "deploy",
                display_title: "公開",
                status: "completed",
                conclusion: "success",
                created_at: "2026-10-25T05:00:00Z",
              },
            ],
          },
        });
      if (path.includes("blog/cat.md?ref=main"))
        return r.fulfill({
          json: {
            content: b64(
              `---\ntitle: 猫\ntags:\n  - Rust\nprivate: false\nupdated_at: '2026-10-01T00:00:00+09:00'\nid: ${ID}\norganization_url_name: null\nslide: false\nignorePublish: false\n---\n本文\n`,
            ),
            sha: "c1",
          },
        });
      return r.fulfill({ status: 404 });
    });
    await page.route("**/admin/qiita?*", (r) =>
      r.fulfill({
        json: [{ id: ID, updated_at: "2026-10-05T00:00:00+09:00" }],
      }),
    );
    await page.goto("/admin/");

    const drafts = page.getByRole("region", { name: "下書き" });
    await expect(drafts.getByRole("heading")).toContainText("1");
    await drafts
      .getByRole("button", { name: "events/2026-08-10-seccamp.md" })
      .isVisible();
    const pulls = page.getByRole("region", { name: "公開待ち" });
    await expect(
      pulls.getByRole("button", {
        name: "content: イベント「セキュキャン」を更新する",
      }),
    ).toBeVisible();
    await expect(pulls.getByText("落ちました")).toBeVisible();
    const runs = page.getByRole("region", { name: "最近の公開" });
    await expect(runs.getByText("deploy")).toBeVisible();
    await expect(runs.getByText("通りました")).toBeVisible();
    const blog = page.getByRole("region", { name: "ブログとQiita" });
    await expect(blog.getByText("Qiitaのほうが新しい")).toBeVisible();
    await expect(
      blog.getByText("「猫」はQiitaのほうが新しく直されています。"),
    ).toBeVisible();
    const content = page.getByRole("region", { name: "中身" });
    await expect(content.getByRole("heading")).toContainText("3");

    // 「新しい記事を書く」で、記事のファイル名の欄へ
    await page.getByRole("button", { name: "新しい記事を書く" }).click();
    await expect(page.getByLabel(/^新しい記事のファイル名/)).toBeFocused();
    // 「写真を足す」で、写真の入口を開く
    await page.getByRole("button", { name: "写真を足す" }).click();
    await expect(page.locator("#admin-upload")).toHaveAttribute("open", "");
    // 下書きを押すと開く
    await drafts
      .getByRole("button", { name: "events/2026-08-10-seccamp.md" })
      .click();
    await expect(
      page.getByRole("region", {
        name: "content/events/2026-08-10-seccamp.md の編集",
      }),
    ).toBeVisible();
  });
});
