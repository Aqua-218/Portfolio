"use client";

/**
 * 管理画面のグラフ。外のスクリプトは使わず、SVGで描く(CSPを広げない)。
 * 線は2px、棒の先は4pxの角丸、棒と棒の間は2px。軸と目盛りは控えめにし、数はホバーで出す。
 * どのグラフにも「表で見る」をつける(色だけに頼らない)
 */
import { useState } from "react";
import * as s from "./admin.css";

/** 1つの点(週など) */
export interface Point {
  /** 横軸の名前(10/20 など) */
  label: string;
  /** ホバーで出す名前(10/20の週 など) */
  long: string;
  value: number;
}

const W = 640;
const H = 220;
const PAD = { top: 12, right: 12, bottom: 28, left: 32 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

/** 縦軸のいちばん上。きりのいい数にする */
export function niceMax(max: number): number {
  if (max <= 4) return 4;
  const step = 10 ** Math.floor(Math.log10(max));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * step >= max) return m * step;
  return 10 * step;
}

/** 横軸の名前を、間引いて出す(重ならないよう、多くて6つ) */
function every(count: number): number {
  return Math.max(1, Math.ceil(count / 6));
}

function YAxis({ max }: { max: number }) {
  const ticks = [0, max / 2, max];
  return (
    <g>
      {ticks.map((t) => {
        const y = PAD.top + PLOT_H - (t / max) * PLOT_H;
        return (
          <g key={t}>
            <line
              className={s.grid}
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y}
              y2={y}
            />
            <text
              className={s.tick}
              x={PAD.left - 6}
              y={y + 4}
              textAnchor="end"
            >
              {Number.isInteger(t) ? t : t.toFixed(1)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function XLabels({ labels }: { labels: string[] }) {
  const n = labels.length;
  const step = every(n);
  return (
    <g>
      {labels.map((l, i) =>
        i % step === 0 || i === n - 1 ? (
          <text
            key={`${l}-${String(i)}`}
            className={s.tick}
            x={PAD.left + ((i + 0.5) / n) * PLOT_W}
            y={H - 8}
            textAnchor="middle"
          >
            {l}
          </text>
        ) : null,
      )}
    </g>
  );
}

/** ホバーで出す吹き出し。点の上に置く */
function Tip({ x, children }: { x: number; children: React.ReactNode }) {
  return (
    <div
      className={s.tip}
      role="status"
      style={{ left: `${String((x / W) * 100)}%` }}
    >
      {children}
    </div>
  );
}

/** 表で見る。読み上げや、色の見分けにくい人のため */
function Table({
  caption,
  head,
  rows,
}: {
  caption: string;
  head: string[];
  rows: (string | number)[][];
}) {
  return (
    <details className={s.tableView}>
      <summary>表で見る</summary>
      <table>
        <caption className={s.srOnly}>{caption}</caption>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={String(r[0])}>
              {r.map((c, i) => (
                <td key={i}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

/** 時間とともにどう変わったか。1本の折れ線 */
export function LineChart({
  title,
  unit,
  points,
}: {
  title: string;
  unit: string;
  points: Point[];
}) {
  const [hover, setHover] = useState<number | null>(null);
  const n = points.length;
  const max = niceMax(Math.max(0, ...points.map((p) => p.value)));
  const x = (i: number) => PAD.left + ((i + 0.5) / n) * PLOT_W;
  const y = (v: number) => PAD.top + PLOT_H - (v / max) * PLOT_H;
  const path = points
    .map(
      (p, i) => `${i === 0 ? "M" : "L"}${String(x(i))},${String(y(p.value))}`,
    )
    .join(" ");
  const shown = hover === null ? undefined : points[hover];
  return (
    <figure className={s.chart}>
      <div className={s.plot}>
        <svg
          viewBox={`0 0 ${String(W)} ${String(H)}`}
          role="img"
          aria-label={`${title}。${points.map((p) => `${p.long} ${String(p.value)}${unit}`).join("、")}`}
          onMouseLeave={() => {
            setHover(null);
          }}
        >
          <YAxis max={max} />
          <XLabels labels={points.map((p) => p.label)} />
          <path className={s.line} d={path} />
          {points.map((p, i) => (
            <g key={p.long}>
              {hover === i && (
                <line
                  className={s.crosshair}
                  x1={x(i)}
                  x2={x(i)}
                  y1={PAD.top}
                  y2={PAD.top + PLOT_H}
                />
              )}
              <circle
                className={hover === i ? s.dotActive : s.dot}
                cx={x(i)}
                cy={y(p.value)}
                r={hover === i ? 5 : 3}
              />
              {/* 点より広い、ホバーの当たり */}
              <rect
                className={s.hit}
                x={PAD.left + (i / n) * PLOT_W}
                y={PAD.top}
                width={PLOT_W / n}
                height={PLOT_H}
                onMouseEnter={() => {
                  setHover(i);
                }}
              />
            </g>
          ))}
        </svg>
        {shown && hover !== null && (
          <Tip x={x(hover)}>
            <span className={s.tipLabel}>{shown.long}</span>
            <strong>
              {shown.value}
              {unit}
            </strong>
          </Tip>
        )}
      </div>
      <Table
        caption={title}
        head={["週", `数(${unit})`]}
        rows={points.map((p) => [p.long, p.value])}
      />
    </figure>
  );
}

/** 成功と失敗を積んだ棒。凡例つき */
export function StackedBars({
  title,
  points,
}: {
  title: string;
  points: { label: string; long: string; ok: number; ng: number }[];
}) {
  const [hover, setHover] = useState<number | null>(null);
  const n = points.length;
  const max = niceMax(Math.max(0, ...points.map((p) => p.ok + p.ng)));
  const slot = PLOT_W / n;
  const bar = Math.min(28, slot * 0.6);
  const h = (v: number) => (v / max) * PLOT_H;
  const base = PAD.top + PLOT_H;
  const shown = hover === null ? undefined : points[hover];
  return (
    <figure className={s.chart}>
      <ul className={s.legend}>
        <li>
          <span className={s.keyOk} aria-hidden="true" />
          成功
        </li>
        <li>
          <span className={s.keyNg} aria-hidden="true" />
          失敗
        </li>
      </ul>
      <div className={s.plot}>
        <svg
          viewBox={`0 0 ${String(W)} ${String(H)}`}
          role="img"
          aria-label={`${title}。${points.map((p) => `${p.long} 成功${String(p.ok)}回・失敗${String(p.ng)}回`).join("、")}`}
          onMouseLeave={() => {
            setHover(null);
          }}
        >
          <YAxis max={max} />
          <XLabels labels={points.map((p) => p.label)} />
          {points.map((p, i) => {
            const cx = PAD.left + (i + 0.5) * slot;
            const okH = h(p.ok);
            // 失敗は成功の上に、2pxあけて積む
            const ngH = Math.max(0, h(p.ng) - (p.ok > 0 ? 2 : 0));
            return (
              <g
                key={p.long}
                opacity={hover === null || hover === i ? 1 : 0.55}
              >
                {p.ok > 0 && (
                  <path
                    className={s.barOk}
                    d={roundTop(
                      cx - bar / 2,
                      base - okH,
                      bar,
                      okH,
                      p.ng > 0 ? 0 : 4,
                    )}
                  />
                )}
                {p.ng > 0 && (
                  <path
                    className={s.barNg}
                    d={roundTop(
                      cx - bar / 2,
                      base - okH - (p.ok > 0 ? 2 : 0) - ngH,
                      bar,
                      ngH,
                      4,
                    )}
                  />
                )}
                <rect
                  className={s.hit}
                  x={PAD.left + i * slot}
                  y={PAD.top}
                  width={slot}
                  height={PLOT_H}
                  onMouseEnter={() => {
                    setHover(i);
                  }}
                />
              </g>
            );
          })}
        </svg>
        {shown && hover !== null && (
          <Tip x={PAD.left + (hover + 0.5) * slot}>
            <span className={s.tipLabel}>{shown.long}</span>
            <span>
              成功 <strong>{shown.ok}</strong>・失敗 <strong>{shown.ng}</strong>
            </span>
          </Tip>
        )}
      </div>
      <Table
        caption={title}
        head={["週", "成功", "失敗"]}
        rows={points.map((p) => [p.long, p.ok, p.ng])}
      />
    </figure>
  );
}

/** 上だけ角を丸めた棒(下は軸につける) */
function roundTop(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h);
  return `M${String(x)},${String(y + h)} V${String(y + rr)} Q${String(x)},${String(y)} ${String(x + rr)},${String(y)} H${String(x + w - rr)} Q${String(x + w)},${String(y)} ${String(x + w)},${String(y + rr)} V${String(y + h)} Z`;
}

/** 小さな折れ線。数のカードにつける。最後の点だけ差し色 */
export function Sparkline({
  values,
  label,
}: {
  values: number[];
  label: string;
}) {
  const w = 96;
  const h = 28;
  const max = Math.max(1, ...values);
  const x = (i: number) => 2 + (i / Math.max(1, values.length - 1)) * (w - 4);
  const y = (v: number) => h - 3 - (v / max) * (h - 6);
  const last = values.length - 1;
  return (
    <svg
      className={s.spark}
      viewBox={`0 0 ${String(w)} ${String(h)}`}
      role="img"
      aria-label={label}
    >
      <polyline
        className={s.sparkLine}
        points={values
          .map((v, i) => `${String(x(i))},${String(y(v))}`)
          .join(" ")}
      />
      {last >= 0 && (
        <circle
          className={s.dotActive}
          cx={x(last)}
          cy={y(values[last] ?? 0)}
          r={3}
        />
      )}
    </svg>
  );
}

/** 全体のうちの割合。地は同じ色の薄いもの */
export function Meter({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: "ok" | "ng" | "muted";
}) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div className={s.meter}>
      <div className={s.meterHead}>
        <span>{label}</span>
        <span className={s.meterValue}>
          {value}
          <span className={s.count}> / {total}</span>
        </span>
      </div>
      <div
        className={s.meterTrack}
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={value}
      >
        <div
          className={
            tone === "ok" ? s.meterOk : tone === "ng" ? s.meterNg : s.meterMuted
          }
          style={{ width: `${String(pct)}%` }}
        />
      </div>
    </div>
  );
}
