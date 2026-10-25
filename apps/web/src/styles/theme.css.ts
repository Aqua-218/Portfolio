import { dark, light, toCss, type Palette } from "@portfolio/design";
import {
  assignVars,
  createGlobalTheme,
  createThemeContract,
  globalStyle,
} from "@vanilla-extract/css";

export const vars = createThemeContract({
  color: {
    paper: null,
    ink: null,
    muted: null,
    line: null,
    tatami: null,
    mike: null,
    mikeText: null,
    pxline: null,
    note: null,
    leaf: null,
    sora: null,
    kaki: null,
  },
  font: {
    sans: null,
    jp: null,
    mono: null,
  },
  space: {
    xs: null,
    sm: null,
    md: null,
    lg: null,
    xl: null,
    xxl: null,
    gutter: null,
  },
  radius: {
    sm: null,
    md: null,
    lg: null,
    round: null,
  },
});

function colors(palette: Palette) {
  return {
    paper: toCss(palette.paper),
    ink: toCss(palette.ink),
    muted: toCss(palette.muted),
    line: toCss(palette.line),
    tatami: toCss(palette.tatami),
    mike: toCss(palette.mike),
    mikeText: toCss(palette.mikeText),
    pxline: toCss(palette.pxline),
    note: toCss(palette.note),
    leaf: toCss(palette.leaf),
    sora: toCss(palette.sora),
    kaki: toCss(palette.kaki),
  };
}

createGlobalTheme(":root", vars, {
  color: colors(light),
  font: {
    sans: '"Geist", "LINE Seed JP", "Helvetica Neue", Arial, "Hiragino Sans", "Yu Gothic", sans-serif',
    jp: '"LINE Seed JP", "Hiragino Sans", "Yu Gothic", sans-serif',
    mono: '"Geist Mono", ui-monospace, "SFMono-Regular", Menlo, monospace',
  },
  space: {
    xs: "0.5rem",
    sm: "1rem",
    md: "1.25rem",
    lg: "1.5rem",
    xl: "2rem",
    xxl: "2.75rem",
    gutter: "20px",
  },
  radius: {
    sm: "2px",
    md: "4px",
    lg: "6px",
    round: "50%",
  },
});

// OSがダークのとき。ただしdata-theme="light"なら明るいまま
globalStyle(':root:not([data-theme="light"])', {
  "@media": {
    "(prefers-color-scheme: dark)": {
      vars: assignVars(vars.color, colors(dark)),
      colorScheme: "dark",
    },
  },
});

globalStyle(':root[data-theme="dark"]', {
  vars: assignVars(vars.color, colors(dark)),
  colorScheme: "dark",
});
