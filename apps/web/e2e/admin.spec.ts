import { readdirSync, readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

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
    let asked: { path: string | null; admin: string | undefined } | undefined;
    await page.route("**/admin/api?*", (r) => {
      asked = {
        path: new URL(r.request().url()).searchParams.get("path"),
        admin: r.request().headers()["x-admin"],
      };
      return r.fulfill({ status: 200, json: TREE });
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
    expect(asked).toEqual({
      path: "/repos/Aqua-218/Portfolio/git/trees/main?recursive=1",
      admin: "1",
    });
  });

  test("名前で絞り込める", async ({ page }) => {
    await page.route("**/admin/api?*", (r) =>
      r.fulfill({ status: 200, json: TREE }),
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

  test("ログインが切れていたら、そう出す", async ({ page }) => {
    await page.route("**/admin/api?*", (r) => r.fulfill({ status: 401 }));
    await page.goto("/admin/");
    await expect(page.locator("main").getByRole("alert")).toHaveText(
      "ログインが切れました。ログインし直してください。",
    );
  });
});
