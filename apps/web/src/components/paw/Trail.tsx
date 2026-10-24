import * as s from "./paw.css";

/** 文字列から決まる0以上1未満の数の列。同じ種からは、いつも同じ列が出る */
function random(seed: string): () => number {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ (ch.codePointAt(0) ?? 0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

const SIZE = 14;
const STRIDE = 26;
const SPREAD = 9;

/** 足跡を置く位置と向き。左右の足を交互に、少しずつ揺らして進む */
function walk(seed: string, angle: number, steps: number, wobble: number) {
  const rand = random(seed);
  const prints: { x: number; y: number; rotate: number }[] = [];
  let heading = angle;
  let x = 0;
  let y = 0;
  for (let i = 0; i < steps; i++) {
    heading += (rand() - 0.5) * wobble;
    const rad = (heading * Math.PI) / 180;
    x += Math.cos(rad) * STRIDE;
    y += Math.sin(rad) * STRIDE;
    // 左右の足は、進む向きと直角にずらす
    const side = i % 2 === 0 ? -1 : 1;
    prints.push({
      x: x - Math.sin(rad) * SPREAD * side,
      y: y + Math.cos(rad) * SPREAD * side,
      // つま先を進む向きに。肉球は上向きなので90度足す
      rotate: heading + 90,
    });
  }
  return prints;
}

interface TrailProps {
  /** 足跡の形を決める種。ページごとに変えると、ページごとに違う形になる */
  seed: string;
  /** 進む向き(度)。0で右、90で下 */
  angle: number;
  steps: number;
  /** 1歩ごとに向きが揺れる幅(度) */
  wobble?: number;
  className?: string;
}

/** 猫が歩いていったような足跡。種が同じなら、いつも同じ形になる。 */
export function Trail({
  seed,
  angle,
  steps,
  wobble = 16,
  className,
}: TrailProps) {
  const prints = walk(seed, angle, steps, wobble);
  const xs = prints.map((p) => p.x);
  const ys = prints.map((p) => p.y);
  const left = Math.min(...xs) - SIZE;
  const top = Math.min(...ys) - SIZE;
  const width = Math.max(...xs) + SIZE - left;
  const height = Math.max(...ys) + SIZE - top;
  const r = (n: number) => Math.round(n * 10) / 10;

  return (
    <svg
      className={className ? `${s.trail} ${className}` : s.trail}
      viewBox={`${String(r(left))} ${String(r(top))} ${String(r(width))} ${String(r(height))}`}
      width={Math.round(width)}
      height={Math.round(height)}
      aria-hidden="true"
      focusable="false"
    >
      {prints.map((p, i) => (
        <g
          key={i}
          transform={`translate(${String(r(p.x))} ${String(r(p.y))}) rotate(${String(r(p.rotate))})`}
        >
          <ellipse cx="0" cy="2.4" rx="3.2" ry="2.7" />
          <ellipse cx="-4.2" cy="-1.4" rx="1.3" ry="1.6" />
          <ellipse cx="-1.6" cy="-3.8" rx="1.3" ry="1.65" />
          <ellipse cx="1.6" cy="-3.8" rx="1.3" ry="1.65" />
          <ellipse cx="4.2" cy="-1.4" rx="1.3" ry="1.6" />
        </g>
      ))}
    </svg>
  );
}
