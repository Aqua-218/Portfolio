import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

/** 太線の下に、細線で区切った行を並べる一覧 */
export const rows = style({
  listStyle: "none",
  margin: 0,
  padding: 0,
  borderTop: `2px solid ${vars.color.ink}`,
});

export const row = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "1.5rem",
  paddingBlock: "1.1rem",
  borderBottom: `1px solid ${vars.color.line}`,
  "@media": {
    "(max-width: 640px)": {
      flexDirection: "column",
      alignItems: "flex-start",
      gap: "0.5rem",
    },
  },
});

/** 会社名などの大きなリンク */
export const co = style({
  fontWeight: 700,
  fontSize: "clamp(1.25rem, 2vw, 1.5rem)",
  letterSpacing: "-0.02em",
  lineHeight: 1.2,
  minWidth: 0,
  overflowWrap: "anywhere",
  textDecoration: "none",
});

export const coName = style({
  textDecoration: "underline",
  textDecorationColor: vars.color.line,
  textDecorationThickness: "2px",
  textUnderlineOffset: "6px",
  transition: "text-decoration-color 0.25s",
  selectors: {
    [`${co}:hover &`]: {
      textDecorationColor: vars.color.mike,
    },
  },
});

globalStyle(`${co} small`, {
  display: "block",
  fontFamily: vars.font.jp,
  fontWeight: 400,
  fontSize: "0.75rem",
  letterSpacing: 0,
  color: vars.color.muted,
  marginBottom: "0.3rem",
});

/** 小さなラベル */
export const tag = style({
  flex: "none",
  fontFamily: vars.font.jp,
  fontSize: "0.75rem",
  fontWeight: 700,
  lineHeight: 1,
  background: vars.color.tatami,
  padding: "0.45rem 0.65rem",
  borderRadius: vars.radius.md,
  whiteSpace: "nowrap",
});
