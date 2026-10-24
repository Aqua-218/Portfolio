import { globalStyle, style } from "@vanilla-extract/css";

export const ics = style({
  display: "inline-flex",
  gap: "0.3em",
  marginRight: "0.45em",
  verticalAlign: "-0.17em",
});

export const ic = style({
  width: "1.1em",
  height: "1.1em",
  flex: "none",
});

export const img = style({
  width: "auto",
  height: "1.1em",
  objectFit: "contain",
  flex: "none",
});

/** 黒一色のロゴ。ダークでは白く反転する */
export const mono = style({
  "@media": {
    "(prefers-color-scheme: dark)": {
      selectors: {
        ':root:not([data-theme="light"]) &': { filter: "invert(1)" },
      },
    },
  },
  selectors: {
    ':root[data-theme="dark"] &': { filter: "invert(1)" },
  },
});

globalStyle(`${ics} > *`, {
  display: "block",
});
