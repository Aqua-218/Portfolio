import { style } from "@vanilla-extract/css";

const ease = "cubic-bezier(0.2, 0.7, 0.2, 1)";

export const rv = style({
  "@media": {
    "(prefers-reduced-motion: no-preference)": {
      transition: `opacity 0.75s ${ease}, translate 0.75s ${ease}, scale 0.75s ${ease}, rotate 0.5s cubic-bezier(0.3, 1.6, 0.5, 1)`,
      transitionDelay: "var(--rd, 0s)",
    },
  },
});

/** まだ出ていない。画面に入ったら外す */
export const pre = style({
  "@media": {
    "(prefers-reduced-motion: no-preference)": {
      opacity: 0,
      translate: "0 26px",
    },
  },
});

export const left = style({
  selectors: {
    [`&${pre}`]: {
      "@media": {
        "(prefers-reduced-motion: no-preference)": {
          translate: "-28px 0",
        },
      },
    },
  },
});

export const pop = style({
  selectors: {
    [`&${pre}`]: {
      "@media": {
        "(prefers-reduced-motion: no-preference)": {
          translate: "0 18px",
          scale: "0.9",
          rotate: "3deg",
        },
      },
    },
  },
});
