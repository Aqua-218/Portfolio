import { globalStyle, keyframes, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

const still = "(prefers-reduced-motion: reduce)";

/** 猫たちが乗る地面。下に細い線を引く */
export const ground = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "flex-end",
  // 地面の端から端まで、散らばって遊ぶ
  justifyContent: "space-around",
  gap: "0.75rem 0",
  paddingBottom: "0.25rem",
  borderBottom: `1px dashed ${vars.color.line}`,
  overflow: "hidden",
});

export const actor = style({
  position: "relative",
  display: "inline-flex",
  alignItems: "flex-end",
  gap: "0.15rem",
});

const run = keyframes({
  "0%": { transform: "translateX(0)" },
  "50%": { transform: "translateX(4rem)" },
  "100%": { transform: "translateX(0)" },
});

/** 追いかけっこ。2匹が少し離れて、行ったり来たりする */
export const chase = style([
  actor,
  {
    gap: "1.75rem",
    animation: `${run} 6s ease-in-out infinite`,
    "@media": { [still]: { animation: "none" } },
  },
]);

const roll = keyframes({
  "0%, 100%": { transform: "translateX(0) rotate(0deg)" },
  "70%": { transform: "translateX(0) rotate(0deg)" },
  "85%": { transform: "translateX(0.6rem) rotate(90deg)" },
});

/** 毛玉。猫が飛びつくころに、ころっと転がる */
export const yarn = style({
  marginBottom: "1px",
  animation: `${roll} 2.86s steps(4) infinite`,
  "@media": { [still]: { animation: "none" } },
});

export const yarnBall = style({ fill: vars.color.mike });
export const yarnLine = style({ fill: vars.color.ink, opacity: 0.35 });

const float = keyframes({
  "0%": { opacity: 0, transform: "translate(0, 0)" },
  "30%": { opacity: 1 },
  "100%": { opacity: 0, transform: "translate(0.5rem, -1rem)" },
});

/** 寝ている猫のz */
export const zzz = style({
  position: "absolute",
  top: "-0.9rem",
  right: "-0.2rem",
  display: "flex",
  gap: "0.1rem",
  fontFamily: vars.font.mono,
  fontSize: "0.6875rem",
  color: vars.color.muted,
});

globalStyle(`${zzz} span`, {
  animation: `${float} 2.4s ease-out infinite`,
  "@media": { [still]: { animation: "none", opacity: 0.8 } },
});

globalStyle(`${zzz} span:nth-child(2)`, {
  animationDelay: "1.2s",
  fontSize: "0.8125rem",
});
