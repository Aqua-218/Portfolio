import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

// 左下にはNext.jsの開発用のバッジが出て、ボタンにかぶさって押せなくなるので、右下に置く
export const menu = style({
  position: "fixed",
  right: "1rem",
  bottom: "1rem",
  zIndex: 1000,
  fontFamily: vars.font.jp,
  fontSize: "0.8125rem",
});

export const toggle = style({
  padding: "0.4rem 0.8rem",
  border: `1.5px solid ${vars.color.ink}`,
  borderRadius: vars.radius.md,
  background: vars.color.mike,
  color: vars.color.paper,
  fontFamily: vars.font.jp,
  fontWeight: 700,
  cursor: "pointer",
});

export const panel = style({
  position: "absolute",
  right: 0,
  bottom: "calc(100% + 0.5rem)",
  width: "16rem",
  maxHeight: "70vh",
  overflowY: "auto",
  padding: "0.9rem 1rem",
  border: `1.5px solid ${vars.color.ink}`,
  borderRadius: vars.radius.md,
  background: vars.color.paper,
});

export const note = style({ margin: "0 0 0.6rem", color: vars.color.muted });

export const title = style({
  margin: "0.6rem 0 0.3rem",
  fontSize: "0.8125rem",
  fontWeight: 700,
});

export const list = style({
  display: "flex",
  flexWrap: "wrap",
  gap: "0.3rem 0.8rem",
  margin: 0,
  padding: 0,
  listStyle: "none",
});

globalStyle(`${list} a:hover`, { color: vars.color.mikeText });
