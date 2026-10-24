import { keyframes, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

const pop = keyframes({
  "0%": { opacity: 0, scale: "0.3" },
  "18%": { opacity: 0.95, scale: "1.1" },
  "30%": { scale: "1" },
  "100%": { opacity: 0, scale: "1" },
});

export const paw = style({
  position: "absolute",
  width: "28px",
  height: "28px",
  margin: "-14px 0 0 -14px",
  pointerEvents: "none",
  color: vars.color.mike,
  zIndex: 50,
  animation: `${pop} 1.1s ease-out forwards`,
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      display: "none",
    },
  },
});

/** あちこちの足跡。文字や写真の邪魔をしないよう、薄く、押せなくする */
export const trail = style({
  display: "block",
  color: vars.color.muted,
  fill: "currentColor",
  opacity: 0.22,
  pointerEvents: "none",
  userSelect: "none",
});
