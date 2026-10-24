import type { Metadata } from "next";
import { Lost } from "@/components/lost/Lost";
import { SITE_NAME } from "@/lib/meta";

export const metadata: Metadata = {
  // noindexはNext.jsが入れる
  title: { absolute: `404 | ${SITE_NAME}` },
};

export default function NotFound() {
  return (
    <Lost
      code="404"
      message="このページは見つかりませんでした。猫も迷子になっちゃったみたい。"
    />
  );
}
