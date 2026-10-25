import { PxCat } from "@/components/px-cat/PxCat";
import * as s from "./play.css";
import { type Actor, POSES, scene } from "./scene";

/** 毛玉。ドット絵で、三毛の茶で塗る */
function Yarn() {
  // 7×7のマス。#は毛玉、-は巻いた糸、~は垂れた糸
  const rows = [
    "..###..",
    ".#-###.",
    "##-#-##",
    "#-#-#-#",
    "##-#-##",
    ".###-#.",
    "..###~~",
  ];
  return (
    <svg
      className={s.yarn}
      viewBox="0 0 7 7"
      width={21}
      height={21}
      shapeRendering="crispEdges"
    >
      {rows.flatMap((row, y) =>
        Array.from({ length: row.length }, (_, x) => row.charAt(x)).map(
          (c, x) =>
            c === "." ? null : (
              <rect
                key={`${String(x)}-${String(y)}`}
                className={c === "#" ? s.yarnBall : s.yarnLine}
                x={x}
                y={y}
                width={1}
                height={1}
              />
            ),
        ),
      )}
    </svg>
  );
}

function One({ actor, pixel }: { actor: Actor; pixel: number }) {
  const pose = POSES[actor.act];
  const cat = (coat: (typeof actor.coats)[number], key?: string) => (
    <PxCat
      key={key}
      frames={pose.frames}
      coat={coat}
      pixel={pixel}
      {...(pose.motion ? { motion: pose.motion } : {})}
    />
  );
  return (
    <span
      className={actor.act === "chase" ? s.chase : s.actor}
      style={{ marginLeft: `${String(actor.gap)}rem` }}
      data-act={actor.act}
    >
      {actor.act === "chase"
        ? actor.coats.map((c, i) => cat(c, String(i)))
        : actor.coats[0] && cat(actor.coats[0])}
      {actor.act === "pounce" && <Yarn />}
      {actor.act === "sleep" && (
        <span className={s.zzz}>
          <span>z</span>
          <span>z</span>
        </span>
      )}
    </span>
  );
}

/**
 * ドット絵の猫たちが遊んでいるところ。ページごとに顔ぶれと遊び方が違う(種から決める)。
 * 飾りなので読み上げには出さない。動きを減らす設定では止まる
 */
export function Playground({
  seed,
  count,
  pixel = 3,
  className,
}: {
  seed: string;
  count: number;
  pixel?: number;
  className?: string;
}) {
  const actors = scene(seed, count);
  return (
    <div
      className={className ? `${s.ground} ${className}` : s.ground}
      aria-hidden="true"
      data-playground={seed}
    >
      {actors.map((a) => (
        <One key={a.act} actor={a} pixel={pixel} />
      ))}
    </div>
  );
}
