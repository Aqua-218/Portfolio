import Link from "next/link";
import { PxCat, type PxCatProps } from "@/components/px-cat/PxCat";
import { more } from "@/components/section/section.css";
import * as s from "./lost.css";

export type LostCat = Pick<PxCatProps, "frames" | "coat" | "motion">;

/** なければ、座る黒猫 */
const SIT: LostCat = { frames: ["sitA", "sitB"], coat: "kuro", motion: "sit" };

interface LostProps {
  code: string;
  message: string;
  cat?: LostCat;
}

/** 迷子の猫のいるエラーの画面。404とほかのエラーで使う */
export function Lost({ code, message, cat = SIT }: LostProps) {
  return (
    <section className={s.lost} aria-labelledby="lost-code">
      <PxCat className={s.cat} pixel={6} {...cat} />
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
