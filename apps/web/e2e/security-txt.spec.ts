import { expect, test } from "@playwright/test";

test("security.txtに連絡先と期限があり、期限まで30日以上ある", async ({
  request,
}) => {
  const res = await request.get("/.well-known/security.txt");
  expect(res.ok()).toBe(true);
  const text = await res.text();
  expect(text).toMatch(
    /^Contact: https:\/\/github\.com\/Aqua-218\/Portfolio\/security\/advisories\/new$/m,
  );
  const expires = /^Expires: (.+)$/m.exec(text)?.[1] ?? "";
  // 期限が近づいたら落とす。security.txtのExpiresを1年後に書き直す
  const days = (Date.parse(expires) - Date.now()) / 86_400_000;
  expect(days, `Expires(${expires})まで${days.toFixed(0)}日`).toBeGreaterThan(
    30,
  );
  // RFC 9116: 1年より先にしない
  expect(days).toBeLessThanOrEqual(366);
});
