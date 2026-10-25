import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

/** ノードに乗っている図。つながっていないものを薄くする */
export const lit = style({});

/** 光らせるノードと線 */
export const on = style({});

globalStyle(`${lit} :is(g.node, [data-et="edge"]):not(${on})`, {
  opacity: 0.3,
});

globalStyle(`${lit} [data-et="edge"]${on}`, {
  stroke: `${vars.color.mike} !important`,
  strokeWidth: "2px !important",
});

globalStyle(`${lit} g.node${on} :is(rect, polygon, circle, path)`, {
  stroke: `${vars.color.mike} !important`,
});

globalStyle(`:is(g.node, [data-et="edge"])`, {
  transition: "opacity 0.2s",
});

/** 拡大と移動ができる図 */
export const zoomable = style({
  position: "relative",
  // 右上のボタンが図に重ならないよう、上を空ける
  paddingTop: "2.75rem !important",
});

globalStyle(`${zoomable} > svg`, {
  cursor: "grab",
  touchAction: "pinch-zoom",
});

globalStyle(`${zoomable} > svg:active`, {
  cursor: "grabbing",
});

export const bar = style({
  position: "absolute",
  top: "0.5rem",
  right: "0.5rem",
  display: "flex",
  gap: "4px",
});

export const button = style({
  width: "1.75rem",
  height: "1.75rem",
  padding: 0,
  border: `1px solid ${vars.color.line}`,
  borderRadius: vars.radius.md,
  background: vars.color.paper,
  color: vars.color.ink,
  font: "inherit",
  lineHeight: 1,
  cursor: "pointer",
  ":hover": { borderColor: vars.color.mike },
});
