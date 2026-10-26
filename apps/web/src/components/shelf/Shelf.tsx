import type { ShelfKind, ShelfWork } from "@portfolio/content-types";
import { Reveal } from "@/components/reveal/Reveal";
import { groupHeading } from "@/components/section/section.css";
import { site } from "@/lib/content";
import * as s from "./shelf.css";

const KINDS: readonly { kind: ShelfKind; label: string; note?: string }[] = [
  { kind: "drama", label: "ドラマ" },
  { kind: "anime", label: "アニメ", note: "うろ覚え" },
  { kind: "book", label: "漫画・小説" },
];

function Works({ works }: { works: readonly ShelfWork[] }) {
  return (
    <ul className={s.works}>
      {works.map((w, i) => (
        <Reveal
          as="li"
          key={`${w.kind}-${w.title}`}
          kind="left"
          delay={0.05 + i * 0.02}
          className={s.work}
        >
          {w.title}
        </Reveal>
      ))}
    </ul>
  );
}

const count = (kind: ShelfKind) =>
  site().shelf.filter((w) => w.kind === kind).length;

/** Homeの抜粋。件数の見出しと、pickの作品だけ。 */
export function ShelfPicks() {
  return (
    <>
      <h3 className={groupHeading}>
        ドラマ {count("drama")}・アニメ {count("anime")}・漫画と小説{" "}
        {count("book")}（一部だけ表示）
      </h3>
      <Works works={site().shelf.filter((w) => w.pick)} />
    </>
  );
}

/** Shelfのページ。種類ごとの一覧と、表紙を載せられなかった理由。 */
export function Shelf() {
  return (
    <>
      {KINDS.map(({ kind, label, note }) => {
        const works = site().shelf.filter((w) => w.kind === kind);
        return (
          <div key={kind} className={s.block} id={`shelf-${kind}`}>
            <Reveal as="h2" className={s.heading}>
              {label}
              <small>{works.length}作品</small>
              {note && <small>{note}</small>}
            </Reveal>
            <Works works={works} />
          </div>
        );
      })}
      <aside className={s.grr}>
        <p>
          ほんとは表紙とかKVとかのせたかったんだけど、著作権的に無理だったのでやむをえず…
        </p>
        <p className={s.shout}>ちくしょうめぇ！！</p>
      </aside>
    </>
  );
}
