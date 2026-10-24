import { Photo } from "@/components/photo/Photo";
import { site } from "@/lib/content";
import * as s from "./mosaic.css";
import { Parallax } from "./Parallax";

const TILES = [s.a, s.b, s.c, s.d];
/** 表示する幅の目安。PCでは列の数、スマホでは2列のグリッドから決めた */
const SIZES = [
  "(max-width: 640px) 100vw, 40vw",
  "(max-width: 640px) 50vw, 25vw",
  "(max-width: 640px) 50vw, 33vw",
  "(max-width: 640px) 100vw, 58vw",
];

/** Homeのいちばん上の、写真4枚のモザイク。 */
export function Mosaic() {
  const ids = site().cats.mosaic;
  return (
    <Parallax className={s.mosaic}>
      {ids.map((id, i) => (
        <figure key={id} className={`${s.tile} ${TILES[i] ?? ""}`}>
          {/* いちばん上に見えるので、遅らせずに読む */}
          <Photo id={id} sizes={SIZES[i] ?? "50vw"} loading="eager" />
        </figure>
      ))}
    </Parallax>
  );
}
