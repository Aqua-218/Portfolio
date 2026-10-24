import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const top = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "1rem",
  paddingBlock: "1.25rem",
  "@media": {
    "(max-width: 640px)": {
      flexWrap: "wrap",
      rowGap: "0.75rem",
    },
  },
});

export const logo = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "0.5rem",
  textDecoration: "none",
  lineHeight: 0,
});

export const logoTxt = style({
  fontFamily: vars.font.jp,
  fontWeight: 700,
  fontSize: "0.8125rem",
  lineHeight: 1,
  letterSpacing: "0.04em",
  transition: "color 0.25s",
  selectors: {
    [`${logo}:hover &, ${logo}:focus-visible &`]: {
      color: vars.color.mike,
    },
  },
});

export const logoCat = style({
  transition: "translate 0.35s cubic-bezier(0.3, 1.6, 0.5, 1)",
  selectors: {
    [`${logo}:hover &, ${logo}:focus-visible &`]: {
      translate: "0 -4px",
    },
  },
});

export const nav = style({
  display: "flex",
  gap: "clamp(1rem, 3vw, 2.25rem)",
  "@media": {
    "(max-width: 640px)": {
      width: "100%",
      gap: "1.1rem",
      overflowX: "auto",
      scrollbarWidth: "none",
      paddingBottom: "6px",
      marginBottom: "-6px",
    },
  },
});

globalStyle(`${nav}::-webkit-scrollbar`, {
  display: "none",
});

export const navLink = style({
  position: "relative",
  textDecoration: "none",
  fontSize: "0.9375rem",
  fontWeight: 500,
  "@media": {
    "(max-width: 640px)": {
      whiteSpace: "nowrap",
      fontSize: "0.8125rem",
    },
  },
  "::after": {
    content: '""',
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "-3px",
    height: "2px",
    background: vars.color.mike,
    borderRadius: vars.radius.sm,
    transform: "scaleX(0)",
    transformOrigin: "right",
    transition: "transform 0.35s cubic-bezier(0.2, 0.7, 0.2, 1)",
  },
  selectors: {
    '&:hover::after, &:focus-visible::after, &[aria-current="page"]::after': {
      transform: "scaleX(1)",
      transformOrigin: "left",
    },
  },
});
