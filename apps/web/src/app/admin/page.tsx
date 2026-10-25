import type { Metadata } from "next";
import { Login } from "@/components/admin/Login";
import { page } from "@/components/admin/admin.css";
import { SITE_NAME } from "@/lib/meta";

export const metadata: Metadata = {
  title: { absolute: `Admin | ${SITE_NAME}` },
  // 管理画面は検索に載せない。サイトのどこからもリンクしない
  robots: { index: false, follow: false },
};

/**
 * 管理画面。content/をブラウザから編集して、GitHubにコミットする。
 * ほかのページと違い、見出しの列を置かず、横いっぱいを管理画面に使う
 */
export default function Admin() {
  return (
    <div className={page}>
      <Login />
    </div>
  );
}
