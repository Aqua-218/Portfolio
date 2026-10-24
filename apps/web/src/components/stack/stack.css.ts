import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const counters = style({
  listStyle: "none",
  margin: "0 0 0.5rem",
  padding: 0,
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "8px",
});

export const counter = style({
  position: "relative",
  display: "grid",
  gap: "0.3rem",
  padding: "1rem 1.1rem",
  background: vars.color.ink,
  color: vars.color.paper,
  borderRadius: vars.radius.lg,
  minWidth: 0,
  "@media": {
    "(max-width: 860px)": { padding: "0.85rem 0.8rem" },
  },
});

export const cat = style({
  position: "absolute",
  top: "0.9rem",
  right: "0.95rem",
  color: vars.color.paper,
});

export const num = style({
  fontWeight: 700,
  fontSize: "clamp(2rem, 4vw, 2.75rem)",
  letterSpacing: "-0.04em",
  lineHeight: 1,
});

export const unit = style({
  fontFamily: vars.font.jp,
  fontSize: "0.875rem",
  fontWeight: 700,
  marginLeft: "0.15rem",
  letterSpacing: 0,
});

export const label = style({
  fontFamily: vars.font.jp,
  fontSize: "0.75rem",
  opacity: 0.75,
});
