import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const form = style({
  display: "grid",
  justifyItems: "start",
  gap: "0.9rem",
});

export const row = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "1rem",
});

export const button = style({
  padding: "0.6rem 1.1rem",
  border: `1.5px solid ${vars.color.ink}`,
  borderRadius: vars.radius.md,
  background: vars.color.paper,
  color: vars.color.ink,
  fontFamily: vars.font.jp,
  fontSize: "0.9375rem",
  fontWeight: 700,
  cursor: "pointer",
  ":hover": { borderColor: vars.color.mike, color: vars.color.mike },
});

export const remember = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "0.45rem",
  fontFamily: vars.font.jp,
  fontSize: "0.875rem",
  color: vars.color.muted,
});

export const note = style({
  margin: 0,
  fontFamily: vars.font.jp,
  fontSize: "0.9375rem",
});

export const error = style({
  margin: 0,
  padding: "0.7rem 0.9rem",
  background: vars.color.tatami,
  borderLeft: `3px solid ${vars.color.mike}`,
  borderRadius: vars.radius.md,
  fontFamily: vars.font.jp,
  fontSize: "0.9375rem",
});

export const contents = style({
  display: "grid",
  gap: "1.5rem",
  marginTop: "2rem",
});

export const search = style({
  width: "100%",
  maxWidth: "24rem",
  padding: "0.55rem 0.8rem",
  border: `1px solid ${vars.color.line}`,
  borderRadius: vars.radius.md,
  background: vars.color.paper,
  color: vars.color.ink,
  fontFamily: vars.font.jp,
  fontSize: "0.9375rem",
  ":focus": { outline: `2px solid ${vars.color.mike}`, outlineOffset: "1px" },
});

export const groupTitle = style({
  display: "flex",
  alignItems: "baseline",
  gap: "0.5rem",
  margin: "0 0 0.6rem",
  fontFamily: vars.font.jp,
  fontSize: "0.875rem",
  fontWeight: 700,
});

export const count = style({
  fontSize: "0.75rem",
  fontWeight: 400,
  color: vars.color.muted,
});

export const list = style({
  listStyle: "none",
  margin: 0,
  padding: 0,
  borderTop: `1px solid ${vars.color.line}`,
  fontFamily: vars.font.jp,
  fontSize: "0.875rem",
});

globalStyle(`${list} li`, {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.5rem 0",
  borderBottom: `1px solid ${vars.color.line}`,
  overflowWrap: "anywhere",
});

export const editor = style({
  display: "grid",
  gap: "1.25rem",
  marginTop: "2rem",
});

export const path = style({
  fontFamily: vars.font.mono,
  fontSize: "0.8125rem",
  color: vars.color.muted,
  overflowWrap: "anywhere",
});

export const dirty = style({
  padding: "0.15rem 0.5rem",
  borderRadius: vars.radius.md,
  background: vars.color.tatami,
  color: vars.color.mike,
  fontFamily: vars.font.jp,
  fontSize: "0.75rem",
  fontWeight: 700,
});

/** 下書きがあることの印。「変更あり」と並ぶので、色を変える */
export const draft = style({
  padding: "0.15rem 0.5rem",
  borderRadius: vars.radius.md,
  border: `1.5px solid ${vars.color.ink}`,
  color: vars.color.ink,
  fontFamily: vars.font.jp,
  fontSize: "0.75rem",
  fontWeight: 700,
});

/** 保存のボタン。行の右の端に置く */
export const save = style([
  button,
  {
    marginLeft: "auto",
    background: vars.color.ink,
    color: vars.color.paper,
    ":hover": {
      background: vars.color.mike,
      borderColor: vars.color.mike,
      color: vars.color.paper,
    },
    ":disabled": { opacity: 0.4, cursor: "default" },
  },
]);

export const fields = style({
  display: "grid",
  gap: "1rem",
});

export const pair = style({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "1rem",
  "@media": {
    "(max-width: 640px)": { gridTemplateColumns: "minmax(0, 1fr)" },
  },
});

export const field = style({
  display: "grid",
  gap: "0.35rem",
  fontFamily: vars.font.jp,
  fontSize: "0.8125rem",
  color: vars.color.muted,
});

export const input = style({
  padding: "0.55rem 0.75rem",
  border: `1px solid ${vars.color.line}`,
  borderRadius: vars.radius.md,
  background: vars.color.paper,
  color: vars.color.ink,
  fontFamily: vars.font.jp,
  fontSize: "0.9375rem",
  ":focus": { outline: `2px solid ${vars.color.mike}`, outlineOffset: "1px" },
});

export const textarea = style([
  input,
  {
    resize: "vertical",
    lineHeight: 1.8,
  },
]);

export const code = style({
  fontFamily: vars.font.mono,
  fontSize: "0.8125rem",
  lineHeight: 1.7,
});

export const item = style({
  flex: 1,
  padding: 0,
  border: 0,
  background: "none",
  color: vars.color.ink,
  font: "inherit",
  textAlign: "left",
  cursor: "pointer",
  ":hover": { color: vars.color.mike },
});

export const fieldError = style({
  color: vars.color.mike,
  fontSize: "0.8125rem",
  fontWeight: 700,
});

export const problems = style({
  margin: 0,
  paddingLeft: "1.2em",
  fontFamily: vars.font.jp,
  fontSize: "0.875rem",
  color: vars.color.mike,
});

export const preview = style({
  padding: "1.25rem",
  border: `1px dashed ${vars.color.line}`,
  borderRadius: vars.radius.lg,
});

export const tabs = style({
  display: "flex",
  gap: "0.5rem",
});

export const tab = style([
  button,
  {
    selectors: {
      '&[aria-pressed="true"]': {
        background: vars.color.ink,
        color: vars.color.paper,
      },
    },
  },
]);

/** 公開(PRを作ってマージする)のまとまり */
export const publish = style({
  display: "grid",
  justifyItems: "start",
  gap: "0.9rem",
  paddingTop: "1.25rem",
  borderTop: `1.5px solid ${vars.color.ink}`,
});

export const subTitle = style({
  margin: 0,
  fontFamily: vars.font.jp,
  fontSize: "0.9375rem",
  fontWeight: 700,
});

/** 変わるところ。消えた行と増えた行に色をつける */
export const diff = style({
  width: "100%",
  margin: 0,
  padding: "0.75rem",
  listStyle: "none",
  overflowX: "auto",
  borderRadius: vars.radius.md,
  background: vars.color.tatami,
  fontFamily: vars.font.mono,
  fontSize: "0.8125rem",
  lineHeight: 1.7,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
});

export const diffAdd = style({ color: vars.color.leaf, fontWeight: 700 });

export const diffRemove = style({
  color: vars.color.mike,
  textDecoration: "line-through",
});

export const diffGap = style({ color: vars.color.muted });

/** チェックや、mainで走るものの一覧 */
export const checks = style({
  width: "100%",
  margin: 0,
  padding: 0,
  listStyle: "none",
  fontFamily: vars.font.jp,
  fontSize: "0.875rem",
});

globalStyle(`${checks} li`, {
  display: "flex",
  justifyContent: "space-between",
  gap: "1rem",
  padding: "0.35rem 0",
  borderBottom: `1px solid ${vars.color.line}`,
});

export const checkState = style({ color: vars.color.muted });

export const checkFailed = style({ color: vars.color.mike, fontWeight: 700 });
