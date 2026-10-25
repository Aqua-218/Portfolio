import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

export const form = style({
  display: "grid",
  justifyItems: "start",
  gap: "0.9rem",
});

export const row = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "1rem",
});

export const button = style({
  padding: "0.6rem 1.1rem",
  border: `1.5px solid ${vars.color.ink}`,
  borderRadius: vars.radius.md,
  background: vars.color.paper,
  color: vars.color.ink,
  fontFamily: vars.font.jp,
  fontSize: "0.9375rem",
  fontWeight: 700,
  cursor: "pointer",
  ":hover": { borderColor: vars.color.mike, color: vars.color.mike },
});

export const remember = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "0.45rem",
  fontFamily: vars.font.jp,
  fontSize: "0.875rem",
  color: vars.color.muted,
});

export const note = style({
  margin: 0,
  fontFamily: vars.font.jp,
  fontSize: "0.9375rem",
});

export const error = style({
  margin: 0,
  padding: "0.7rem 0.9rem",
  background: vars.color.tatami,
  borderLeft: `3px solid ${vars.color.mike}`,
  borderRadius: vars.radius.md,
  fontFamily: vars.font.jp,
  fontSize: "0.9375rem",
});

export const contents = style({
  display: "grid",
  gap: "1.5rem",
  marginTop: "2rem",
});

export const search = style({
  width: "100%",
  maxWidth: "24rem",
  padding: "0.55rem 0.8rem",
  border: `1px solid ${vars.color.line}`,
  borderRadius: vars.radius.md,
  background: vars.color.paper,
  color: vars.color.ink,
  fontFamily: vars.font.jp,
  fontSize: "0.9375rem",
  ":focus": { outline: `2px solid ${vars.color.mike}`, outlineOffset: "1px" },
});

export const groupTitle = style({
  display: "flex",
  alignItems: "baseline",
  gap: "0.5rem",
  margin: "0 0 0.6rem",
  fontFamily: vars.font.jp,
  fontSize: "0.875rem",
  fontWeight: 700,
});

export const count = style({
  fontSize: "0.75rem",
  fontWeight: 400,
  color: vars.color.muted,
});

export const list = style({
  listStyle: "none",
  margin: 0,
  padding: 0,
  borderTop: `1px solid ${vars.color.line}`,
  fontFamily: vars.font.jp,
  fontSize: "0.875rem",
});

globalStyle(`${list} li`, {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.5rem 0",
  borderBottom: `1px solid ${vars.color.line}`,
  overflowWrap: "anywhere",
});

export const editor = style({
  display: "grid",
  gap: "1.25rem",
  marginTop: "2rem",
});

export const path = style({
  fontFamily: vars.font.mono,
  fontSize: "0.8125rem",
  color: vars.color.muted,
  overflowWrap: "anywhere",
});

export const dirty = style({
  padding: "0.15rem 0.5rem",
  borderRadius: vars.radius.md,
  background: vars.color.tatami,
  color: vars.color.mike,
  fontFamily: vars.font.jp,
  fontSize: "0.75rem",
  fontWeight: 700,
});

/** 下書きがあることの印。「変更あり」と並ぶので、色を変える */
export const draft = style({
  padding: "0.15rem 0.5rem",
  borderRadius: vars.radius.md,
  border: `1.5px solid ${vars.color.ink}`,
  color: vars.color.ink,
  fontFamily: vars.font.jp,
  fontSize: "0.75rem",
  fontWeight: 700,
});

/** 保存のボタン。行の右の端に置く */
export const save = style([
  button,
  {
    marginLeft: "auto",
    background: vars.color.ink,
    color: vars.color.paper,
    ":hover": {
      background: vars.color.mike,
      borderColor: vars.color.mike,
      color: vars.color.paper,
    },
    ":disabled": { opacity: 0.4, cursor: "default" },
  },
]);

export const fields = style({
  display: "grid",
  gap: "1rem",
});

export const pair = style({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "1rem",
  "@media": {
    "(max-width: 640px)": { gridTemplateColumns: "minmax(0, 1fr)" },
  },
});

/** オンとオフの項目を横に並べる。狭ければ折り返す */
export const options = style({
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem 1.25rem",
});

export const option = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "0.45rem",
  fontFamily: vars.font.jp,
  fontSize: "0.875rem",
});

export const settings = style({
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "grid",
  gap: "1.25rem",
});

export const setting = style({
  display: "grid",
  gap: "0.5rem",
});

export const field = style({
  display: "grid",
  gap: "0.35rem",
  fontFamily: vars.font.jp,
  fontSize: "0.8125rem",
  color: vars.color.muted,
});

export const input = style({
  padding: "0.55rem 0.75rem",
  border: `1px solid ${vars.color.line}`,
  borderRadius: vars.radius.md,
  background: vars.color.paper,
  color: vars.color.ink,
  fontFamily: vars.font.jp,
  fontSize: "0.9375rem",
  ":focus": { outline: `2px solid ${vars.color.mike}`, outlineOffset: "1px" },
});

export const textarea = style([
  input,
  {
    resize: "vertical",
    lineHeight: 1.8,
  },
]);

export const code = style({
  fontFamily: vars.font.mono,
  fontSize: "0.8125rem",
  lineHeight: 1.7,
});

export const item = style({
  flex: 1,
  padding: 0,
  border: 0,
  background: "none",
  color: vars.color.ink,
  font: "inherit",
  textAlign: "left",
  cursor: "pointer",
  ":hover": { color: vars.color.mike },
});

export const fieldError = style({
  color: vars.color.mike,
  fontSize: "0.8125rem",
  fontWeight: 700,
});

export const problems = style({
  margin: 0,
  paddingLeft: "1.2em",
  fontFamily: vars.font.jp,
  fontSize: "0.875rem",
  color: vars.color.mike,
});

export const preview = style({
  padding: "1.25rem",
  border: `1px dashed ${vars.color.line}`,
  borderRadius: vars.radius.lg,
});

export const tabs = style({
  display: "flex",
  gap: "0.5rem",
});

export const tab = style([
  button,
  {
    selectors: {
      '&[aria-pressed="true"]': {
        background: vars.color.ink,
        color: vars.color.paper,
      },
    },
  },
]);

/** 公開(PRを作ってマージする)のまとまり */
export const publish = style({
  display: "grid",
  justifyItems: "start",
  gap: "0.9rem",
  paddingTop: "1.25rem",
  borderTop: `1.5px solid ${vars.color.ink}`,
});

export const subTitle = style({
  margin: 0,
  fontFamily: vars.font.jp,
  fontSize: "0.9375rem",
  fontWeight: 700,
});

/** 変わるところ。消えた行と増えた行に色をつける */
export const diff = style({
  width: "100%",
  margin: 0,
  padding: "0.75rem",
  listStyle: "none",
  overflowX: "auto",
  borderRadius: vars.radius.md,
  background: vars.color.tatami,
  fontFamily: vars.font.mono,
  fontSize: "0.8125rem",
  lineHeight: 1.7,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
});

export const diffAdd = style({ color: vars.color.leaf, fontWeight: 700 });

export const diffRemove = style({
  color: vars.color.mike,
  textDecoration: "line-through",
});

export const diffGap = style({ color: vars.color.muted });

/** チェックや、mainで走るものの一覧 */
export const checks = style({
  width: "100%",
  margin: 0,
  padding: 0,
  listStyle: "none",
  fontFamily: vars.font.jp,
  fontSize: "0.875rem",
});

globalStyle(`${checks} li`, {
  display: "flex",
  justifyContent: "space-between",
  gap: "1rem",
  padding: "0.35rem 0",
  borderBottom: `1px solid ${vars.color.line}`,
});

export const checkState = style({ color: vars.color.muted });

export const checkFailed = style({ color: vars.color.mike, fontWeight: 700 });
/** 写真を足す */
export const upload = style({
  display: "grid",
  gap: "0.9rem",
  marginBottom: "1.25rem",
});

/** ドロップするところ */
export const drop = style({
  display: "grid",
  justifyItems: "start",
  gap: "0.6rem",
  padding: "1rem",
  border: `1.5px dashed ${vars.color.ink}`,
  borderRadius: vars.radius.md,
});

/** 見せないが、ラベルから押せる入力(ファイルを選ぶ) */
export const hidden = style({
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clipPath: "inset(50%)",
});

export const photo = style({
  maxWidth: "min(100%, 320px)",
  height: "auto",
  borderRadius: vars.radius.md,
});

export const coats = style({
  display: "flex",
  flexWrap: "wrap",
  gap: "0.9rem",
  margin: 0,
  padding: 0,
  border: 0,
  fontFamily: vars.font.jp,
  fontSize: "0.875rem",
});

// ---- 管理画面の枠(左にメニュー、上に検索) ----

/** 管理画面のページ。見出しの列を置かず、横いっぱいに使う */
export const page = style({
  paddingBlock: "clamp(1rem, 3vw, 2rem) clamp(2rem, 5vw, 3.5rem)",
});

/** ログインの前 */
export const gate = style({
  display: "grid",
  gap: "1rem",
  maxWidth: "28rem",
  marginInline: "auto",
  paddingBlock: "clamp(2rem, 6vw, 4rem)",
});

export const gateTitle = style({
  margin: 0,
  fontSize: "clamp(1.375rem, 2vw, 1.625rem)",
  fontWeight: 700,
});

/** グラフの色。成功と失敗(色の見分けにくい人でも分かれる組。テーマのsoraとkaki) */
const ok = vars.color.sora;
const ng = vars.color.kaki;

export const shell = style({
  display: "grid",
  gridTemplateColumns: "13rem minmax(0, 1fr)",
  minHeight: "70vh",
  border: `1px solid ${vars.color.line}`,
  borderRadius: vars.radius.lg,
  overflow: "hidden",
  background: vars.color.tatami,
  "@media": {
    "(max-width: 860px)": { gridTemplateColumns: "minmax(0, 1fr)" },
  },
});

export const side = style({
  display: "grid",
  alignContent: "start",
  gap: "1rem",
  padding: "1.25rem 0.75rem",
  // 明るいときも暗いときも、地(paper)の上にメニュー。真ん中は一段沈んだ畳(tatami)
  background: vars.color.paper,
  color: vars.color.ink,
  borderRight: `1px solid ${vars.color.line}`,
  "@media": {
    "(max-width: 860px)": { padding: "0.75rem" },
  },
});

export const brand = style({
  margin: "0 0.6rem",
  fontWeight: 700,
  fontSize: "1.25rem",
  "@media": {
    "(max-width: 860px)": { display: "none" },
  },
});

export const menu = style({
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "grid",
  gap: "0.2rem",
  "@media": {
    // 狭い画面では、上に横並びにして、はみ出たら横に送る
    "(max-width: 860px)": {
      display: "flex",
      overflowX: "auto",
      gap: "0.25rem",
    },
  },
});

export const menuItem = style({
  display: "flex",
  alignItems: "center",
  gap: "0.65rem",
  width: "100%",
  padding: "0.55rem 0.7rem",
  border: 0,
  borderRadius: vars.radius.md,
  background: "none",
  font: "inherit",
  fontFamily: vars.font.jp,
  fontSize: "0.875rem",
  textAlign: "left",
  whiteSpace: "nowrap",
  cursor: "pointer",
  color: vars.color.muted,
  ":hover": { color: vars.color.ink, background: vars.color.tatami },
  selectors: {
    '&[aria-current="page"]': {
      background: vars.color.tatami,
      color: vars.color.ink,
      fontWeight: 700,
      boxShadow: `inset 3px 0 0 ${vars.color.mike}`,
    },
  },
});

export const menuCount = style({
  marginLeft: "auto",
  fontSize: "0.75rem",
  fontWeight: 700,
});

export const icon = style({
  flexShrink: 0,
  width: "1.15rem",
  height: "1.15rem",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
});

export const mainArea = style({
  display: "grid",
  alignContent: "start",
  minWidth: 0,
});

export const topbar = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.75rem",
  padding: "0.75rem 1.25rem",
  background: vars.color.paper,
  borderBottom: `1px solid ${vars.color.line}`,
});

export const topSearch = style({
  flex: "1 1 14rem",
  maxWidth: "22rem",
  padding: "0.5rem 0.9rem",
  border: `1px solid ${vars.color.line}`,
  borderRadius: vars.radius.lg,
  background: vars.color.tatami,
  color: vars.color.ink,
  font: "inherit",
  fontFamily: vars.font.jp,
  fontSize: "0.875rem",
  ":focus-visible": { outline: `2px solid ${vars.color.mike}` },
});

export const user = style({
  display: "flex",
  alignItems: "center",
  gap: "0.6rem",
});

export const avatar = style({
  display: "grid",
  placeItems: "center",
  width: "2rem",
  height: "2rem",
  borderRadius: vars.radius.round,
  background: vars.color.mike,
  color: vars.color.ink,
  fontWeight: 800,
  fontSize: "0.875rem",
});

export const crumbs = style({
  margin: 0,
  padding: "0.9rem 1.25rem 0",
  fontFamily: vars.font.jp,
  fontSize: "0.75rem",
  color: vars.color.muted,
});

export const view = style({
  minWidth: 0,
  padding: "1rem 1.25rem 1.5rem",
});

/** 画面の中で、まとまりを縦に並べる */
export const stack = style({
  display: "grid",
  gap: "1rem",
});

/** 白い板。ホーム以外の画面のまとまり */
export const panel = style({
  display: "grid",
  gap: "1rem",
  minWidth: 0,
  padding: "1.1rem 1.25rem",
  borderRadius: vars.radius.lg,
  background: vars.color.paper,
  boxShadow: `0 1px 0 ${vars.color.line}`,
});

// ---- ホーム ----

export const home = style({
  display: "grid",
  gap: "1rem",
});

export const stats = style({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 8.5rem), 1fr))",
  gap: "1rem",
});

export const stat = style([
  panel,
  {
    gap: "0.3rem",
    alignContent: "start",
    border: 0,
    color: vars.color.ink,
    font: "inherit",
    textAlign: "left",
    selectors: {
      "button&": { cursor: "pointer" },
      "button&:hover": { outline: `2px solid ${vars.color.mike}` },
    },
  },
]);

export const statLabel = style({
  fontFamily: vars.font.jp,
  fontSize: "0.8125rem",
  color: vars.color.muted,
});

export const statValue = style({
  fontSize: "2rem",
  fontWeight: 700,
  lineHeight: 1.1,
});

export const statSub = style({
  fontFamily: vars.font.jp,
  fontSize: "0.75rem",
  color: vars.color.muted,
});

export const spark = style({
  width: "6rem",
  height: "1.75rem",
  marginTop: "0.25rem",
});

export const sparkLine = style({
  fill: "none",
  stroke: vars.color.muted,
  strokeWidth: 2,
  strokeLinejoin: "round",
  strokeLinecap: "round",
});

/** 真ん中に広いグラフ、横に細いカード */
export const homeGrid = style({
  display: "grid",
  gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
  gap: "1rem",
  "@media": {
    "(max-width: 1080px)": { gridTemplateColumns: "minmax(0, 1fr)" },
  },
});

export const card = style([panel, { alignContent: "start", gap: "0.75rem" }]);
export const cardWide = style([card]);
export const cardSide = style([card]);

export const cardTitle = style({
  margin: 0,
  fontFamily: vars.font.jp,
  fontSize: "0.875rem",
  fontWeight: 700,
});

export const meters = style({
  display: "grid",
  gap: "0.9rem",
});

export const meter = style({
  display: "grid",
  gap: "0.35rem",
  fontFamily: vars.font.jp,
  fontSize: "0.8125rem",
});

export const meterHead = style({
  display: "flex",
  justifyContent: "space-between",
});

export const meterValue = style({ fontWeight: 700 });

export const meterTrack = style({
  height: "0.5rem",
  borderRadius: vars.radius.md,
  background: vars.color.tatami,
  overflow: "hidden",
});

const meterFill = style({
  height: "100%",
  borderRadius: vars.radius.md,
});

export const meterOk = style([meterFill, { background: ok }]);
export const meterNg = style([meterFill, { background: ng }]);
export const meterMuted = style([meterFill, { background: vars.color.muted }]);

export const warnItem = style({
  padding: "0.5rem 0.7rem",
  border: 0,
  borderLeft: `3px solid ${vars.color.mike}`,
  background: vars.color.note,
  color: vars.color.ink,
  font: "inherit",
  fontFamily: vars.font.jp,
  fontSize: "0.8125rem",
  textAlign: "left",
  cursor: "pointer",
});

export const feed = style({
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "grid",
  gap: "0.8rem",
  fontFamily: vars.font.jp,
  fontSize: "0.8125rem",
});

globalStyle(`${feed} li`, {
  display: "grid",
  gap: "0.2rem",
  paddingBottom: "0.8rem",
  borderBottom: `1px solid ${vars.color.line}`,
});

export const feedHead = style({
  display: "flex",
  justifyContent: "space-between",
  gap: "0.5rem",
});

export const feedTitle = style({
  overflowWrap: "anywhere",
});

// ---- グラフ ----

export const chart = style({
  display: "grid",
  gap: "0.5rem",
  margin: 0,
});

export const plot = style({
  position: "relative",
});

globalStyle(`${plot} svg`, {
  display: "block",
  width: "100%",
  height: "auto",
});

export const grid = style({
  stroke: vars.color.line,
  strokeWidth: 1,
});

export const tick = style({
  fill: vars.color.muted,
  fontSize: "11px",
  fontVariantNumeric: "tabular-nums",
});

export const line = style({
  fill: "none",
  stroke: vars.color.mike,
  strokeWidth: 2,
  strokeLinejoin: "round",
  strokeLinecap: "round",
});

export const dot = style({
  fill: vars.color.mike,
  stroke: vars.color.paper,
  strokeWidth: 2,
});

export const dotActive = style([dot, { stroke: vars.color.paper }]);

export const crosshair = style({
  stroke: vars.color.muted,
  strokeWidth: 1,
  strokeDasharray: "3 3",
});

/** ホバーの当たり。見えない */
export const hit = style({
  fill: "transparent",
});

export const barOk = style({ fill: ok });
export const barNg = style({ fill: ng });

export const legend = style({
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  gap: "1rem",
  fontFamily: vars.font.jp,
  fontSize: "0.75rem",
  color: vars.color.muted,
});

globalStyle(`${legend} li`, {
  display: "flex",
  alignItems: "center",
  gap: "0.35rem",
});

const key = style({
  width: "0.7rem",
  height: "0.7rem",
  borderRadius: vars.radius.sm,
});

export const keyOk = style([key, { background: ok }]);
export const keyNg = style([key, { background: ng }]);

export const tip = style({
  position: "absolute",
  top: 0,
  transform: "translateX(-50%)",
  display: "grid",
  gap: "0.1rem",
  padding: "0.4rem 0.6rem",
  borderRadius: vars.radius.md,
  background: vars.color.ink,
  color: vars.color.paper,
  fontFamily: vars.font.jp,
  fontSize: "0.75rem",
  whiteSpace: "nowrap",
  pointerEvents: "none",
});

export const tipLabel = style({ opacity: 0.75 });

export const tableView = style({
  fontFamily: vars.font.jp,
  fontSize: "0.75rem",
  color: vars.color.muted,
});

globalStyle(`${tableView} table`, {
  marginTop: "0.5rem",
  borderCollapse: "collapse",
  fontVariantNumeric: "tabular-nums",
});

globalStyle(`${tableView} th, ${tableView} td`, {
  padding: "0.2rem 0.75rem 0.2rem 0",
  textAlign: "left",
});

export const srOnly = style({
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
});

export const badge = style({
  flexShrink: 0,
  // 縦に並べたとき(最近の動き)に、横いっぱいに伸びないように
  justifySelf: "start",
  padding: "0.1rem 0.5rem",
  border: `1px solid ${vars.color.line}`,
  borderRadius: vars.radius.lg,
  color: vars.color.muted,
  fontFamily: vars.font.jp,
  fontSize: "0.75rem",
  whiteSpace: "nowrap",
});

export const badgePassed = style([
  badge,
  { borderColor: ok, color: vars.color.ink },
]);

export const badgeFailed = style([
  badge,
  { borderColor: vars.color.mike, color: vars.color.ink, fontWeight: 700 },
]);

/** よく使う操作のうち、いちばん使うもの。保存のボタンと同じ色で、左に寄せる */
export const primary = style([save, { marginLeft: 0 }]);

// ---- Qiitaから取り込む ----

export const importer = style({
  display: "grid",
  gap: "0.75rem",
  marginTop: "0.75rem",
});

export const importList = style({
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "grid",
  borderTop: `1px solid ${vars.color.line}`,
});

globalStyle(`${importList} li`, {
  display: "grid",
  gap: "0.5rem",
  padding: "0.6rem 0",
  borderBottom: `1px solid ${vars.color.line}`,
});
