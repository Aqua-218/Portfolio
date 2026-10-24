import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const counters = style({
  listStyle: "none",
  margin: "0 0 0.5rem",
  padding: 0,
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "8px",
});

export const counter = style({
  position: "relative",
  display: "grid",
  gap: "0.3rem",
  padding: "1rem 1.1rem",
  background: vars.color.ink,
  color: vars.color.paper,
  borderRadius: vars.radius.lg,
  minWidth: 0,
  "@media": {
    "(max-width: 860px)": { padding: "0.85rem 0.8rem" },
  },
});

export const cat = style({
  position: "absolute",
  top: "0.9rem",
  right: "0.95rem",
  color: vars.color.paper,
});

export const num = style({
  fontWeight: 700,
  fontSize: "clamp(2rem, 4vw, 2.75rem)",
  letterSpacing: "-0.04em",
  lineHeight: 1,
});

export const unit = style({
  fontFamily: vars.font.jp,
  fontSize: "0.875rem",
  fontWeight: 700,
  marginLeft: "0.15rem",
  letterSpacing: 0,
});

export const label = style({
  fontFamily: vars.font.jp,
  fontSize: "0.75rem",
  opacity: 0.75,
});

const narrow = "(max-width: 860px)";

export const wcards = style({
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "8px",
  "@media": {
    [narrow]: { gridTemplateColumns: "minmax(0, 1fr)" },
  },
});

export const wcard = style({
  padding: "1.1rem 1.15rem 1.2rem",
  border: `1px solid ${vars.color.line}`,
  borderRadius: vars.radius.lg,
  minWidth: 0,
  transition:
    "border-color 0.25s, translate 0.3s cubic-bezier(0.3, 1.5, 0.5, 1)",
  ":hover": {
    borderColor: vars.color.mike,
    translate: "0 -3px",
  },
});

export const chain = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "0.45rem",
  minHeight: "2rem",
});

/** アイコンは26px。Iconの大きさを上書きする */
globalStyle(`${chain} > svg, ${chain} > img`, {
  width: "26px",
  height: "26px",
  objectFit: "contain",
});

export const arr = style({
  color: vars.color.muted,
  fontSize: "0.875rem",
});

export const tchip = style({
  fontFamily: vars.font.sans,
  fontSize: "0.75rem",
  fontWeight: 700,
  lineHeight: 1,
  padding: "0.4rem 0.55rem",
  border: `1.5px solid ${vars.color.ink}`,
  borderRadius: vars.radius.md,
});

export const wTitle = style({
  margin: "0.85rem 0 0",
  fontFamily: vars.font.jp,
  fontWeight: 700,
  fontSize: "1.0625rem",
});

export const wDesc = style({
  margin: "0.3rem 0 0",
  fontFamily: vars.font.jp,
  fontSize: "0.875rem",
  color: vars.color.muted,
  lineHeight: 1.7,
});

export const tiles = style({
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(8.5rem, 1fr))",
  gap: "8px",
});

export const tile = style({
  display: "grid",
  justifyItems: "start",
  gap: "0.15rem",
  padding: "0.9rem 0.95rem",
  background: vars.color.tatami,
  borderRadius: vars.radius.lg,
  minWidth: 0,
});

globalStyle(`${tile} > svg, ${tile} > img`, {
  width: "26px",
  height: "26px",
  marginBottom: "0.45rem",
  objectFit: "contain",
});

/** Simple Icons にないものは肉球で代わりにする */
export const paw = style({
  color: vars.color.mike,
});

export const tName = style({
  fontWeight: 700,
  fontSize: "0.9375rem",
  lineHeight: 1.3,
  overflowWrap: "anywhere",
});

export const tRole = style({
  fontFamily: vars.font.jp,
  fontSize: "0.75rem",
  color: vars.color.muted,
});

/** Mermaid の図。図の中の var(--ink) などに、テーマの色を渡す */
export const mmd = style({
  margin: "0.5rem 0 0",
  padding: "1.25rem",
  border: `1px solid ${vars.color.line}`,
  borderRadius: vars.radius.lg,
  overflowX: "auto",
  vars: {
    "--paper": vars.color.paper,
    "--ink": vars.color.ink,
    "--muted": vars.color.muted,
    "--line": vars.color.line,
    "--tatami": vars.color.tatami,
    "--mike": vars.color.mike,
    "--mm-note": vars.color.note,
  },
});

globalStyle(`${mmd} > svg`, {
  display: "block",
  marginInline: "auto",
  maxWidth: "100%",
  height: "auto",
});

export const samples = style({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "8px",
  "@media": {
    [narrow]: { gridTemplateColumns: "minmax(0, 1fr)" },
  },
});

export const sample = style({
  margin: 0,
  padding: "0.9rem",
  border: `1px solid ${vars.color.line}`,
  borderRadius: vars.radius.lg,
  minWidth: 0,
  display: "grid",
  gap: "0.6rem",
  alignContent: "start",
});

globalStyle(`${sample} figcaption`, {
  fontFamily: vars.font.jp,
  fontSize: "0.75rem",
  color: vars.color.muted,
});

export const code = style({
  margin: "0 0 1rem",
  padding: "1rem 1.15rem",
  background: vars.color.tatami,
  borderRadius: vars.radius.lg,
  overflowX: "auto",
  fontSize: "0.8125rem",
  lineHeight: 1.75,
  selectors: {
    [`${sample} &`]: { margin: 0 },
  },
});

globalStyle(`${code} code`, {
  fontFamily: vars.font.mono,
  whiteSpace: "pre",
});

export const callout = style({
  display: "flex",
  gap: "0.8rem",
  alignItems: "flex-start",
  padding: "0.85rem 0.95rem",
  background: vars.color.tatami,
  borderRadius: vars.radius.md,
  fontFamily: vars.font.jp,
});

export const calloutCat = style({
  flex: "none",
  marginTop: "0.2rem",
});

globalStyle(`${callout} b`, {
  fontFamily: vars.font.sans,
  fontSize: "0.75rem",
  letterSpacing: "0.04em",
  color: vars.color.mike,
});

globalStyle(`${callout} p`, {
  margin: "0.15rem 0 0",
  fontSize: "0.9375rem",
});

/** 猫テーマのコードの色。キーワード・関数・型・コメント */
export const k = style({ color: vars.color.mike, fontWeight: 600 });
export const f = style({ color: vars.color.ink, fontWeight: 700 });
export const t = style({ color: vars.color.leaf });
export const c = style({ color: vars.color.muted, fontStyle: "italic" });

export const math = style({
  display: "grid",
  placeItems: "center",
  minHeight: "5rem",
  fontSize: "1.35rem",
});

export const lcard = style({
  display: "grid",
  gap: "0.2rem",
  padding: "0.9rem 1rem",
  border: `1px solid ${vars.color.line}`,
  borderRadius: vars.radius.lg,
  textDecoration: "none",
  transition: "border-color 0.25s",
  ":hover": { borderColor: vars.color.mike },
});

export const lcTitle = style({ fontWeight: 700 });

export const lcDesc = style({
  fontSize: "0.875rem",
  color: vars.color.muted,
});

export const lcUrl = style({
  fontSize: "0.75rem",
  color: vars.color.muted,
});

export const acc = style({
  borderTop: `1px solid ${vars.color.line}`,
  selectors: {
    "&:last-of-type": { borderBottom: `1px solid ${vars.color.line}` },
  },
});

globalStyle(`${acc} summary`, {
  cursor: "pointer",
  listStyle: "none",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingBlock: "0.9rem",
  fontFamily: vars.font.jp,
  fontWeight: 700,
});

globalStyle(`${acc} summary::-webkit-details-marker`, { display: "none" });

globalStyle(`${acc} summary::after`, {
  content: '"+"',
  fontFamily: vars.font.sans,
  fontSize: "1.25rem",
  color: vars.color.muted,
  transition: "rotate 0.25s",
});

globalStyle(`${acc}[open] summary::after`, { rotate: "45deg" });

globalStyle(`${acc} > :not(summary)`, { marginBottom: "1.25rem" });

export const value = style({
  fontFamily: vars.font.jp,
  fontSize: "0.9375rem",
  fontWeight: 500,
  lineHeight: 1.7,
});

export const para = style({
  margin: "0 0 1rem",
  fontFamily: vars.font.jp,
  fontSize: "0.9375rem",
  maxWidth: "38em",
});
