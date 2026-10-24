import { style } from "@vanilla-extract/css";

/** `<picture>`は箱を作らず、中の`<img>`が親いっぱいに広がるようにする。 */
export const picture = style({
  display: "contents",
});
