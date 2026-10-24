import Link from "next/link";
import { PxCat } from "@/components/px-cat/PxCat";
import { more } from "@/components/section/section.css";
import * as s from "./lost.css";

const SIT = ["sitA", "sitB"] as const;

/** 迷子の猫のいるエラーの画面。404のほかのエラーにも使う(#165) */
export function Lost({ code, message }: { code: string; message: string }) {
  return (
    <section className={s.lost} aria-labelledby="lost-code">
      <PxCat
        className={s.cat}
        frames={SIT}
        coat="kuro"
        pixel={6}
        motion="sit"
      />
      <h1 className={s.code} id="lost-code">
        {code}
      </h1>
      <p className={s.message}>
        {/* 文の途中で折り返さないよう、文ごとにまとめる */}
        {message.split(/(?<=。)/).map((sentence) => (
          <span key={sentence} className={s.sentence}>
            {sentence}
          </span>
        ))}
      </p>
      <Link className={more} href="/">
        とっぷへ
      </Link>
    </section>
  );
}
