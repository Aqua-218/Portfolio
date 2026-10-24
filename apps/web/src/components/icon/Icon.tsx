import * as simpleIcons from "simple-icons";
import * as s from "./icon.css";

interface SimpleIcon {
  slug: string;
  path: string;
  hex: string;
}

const bySlug = new Map<string, SimpleIcon>(
  Object.values(simpleIcons as unknown as Record<string, SimpleIcon>)
    .filter((i) => typeof i === "object" && "slug" in i)
    .map((i) => [i.slug, i]),
);

/** 黒一色のロゴ(local:)。ダークでは反転する */
const MONO = new Set(["lean", "agda"]);

/** 相対輝度。黒っぽいブランド色は、文字の色で描く(モックと同じ) */
function luminance(hex: string): number {
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

/** `simpleicons:<slug>`か`local:<名前>`のアイコン1つ。 */
export function Icon({ icon }: { icon: string }) {
  const [kind, name = ""] = icon.split(":");
  if (kind === "local") {
    return (
      <img
        className={MONO.has(name) ? `${s.img} ${s.mono}` : s.img}
        src={`/icons/${name}.svg`}
        alt=""
        width={24}
        height={24}
      />
    );
  }
  const si = bySlug.get(name);
  if (!si) throw new Error(`Simple Icons に ${name} がありません`);
  const fill = luminance(si.hex) < 0.05 ? "currentColor" : `#${si.hex}`;
  return (
    <svg
      className={s.ic}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path fill={fill} d={si.path} />
    </svg>
  );
}

/** アイコンを並べる。なければ何も出さない。 */
export function Icons({ icons }: { icons: readonly string[] }) {
  if (icons.length === 0) return null;
  return (
    <span className={s.ics}>
      {icons.map((i) => (
        <Icon key={i} icon={i} />
      ))}
    </span>
  );
}
