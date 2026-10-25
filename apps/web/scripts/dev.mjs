// pnpm devの本体。Next.jsの開発サーバーと、開発モードの管理画面の相手(dev-admin.mjs)をいっしょに立てる
import { spawn } from "node:child_process";

const web = new URL("..", import.meta.url).pathname;
const children = [
  spawn(process.execPath, ["scripts/dev-admin.mjs"], {
    cwd: web,
    stdio: "inherit",
  }),
  spawn("next", ["dev", ...process.argv.slice(2)], {
    cwd: web,
    stdio: "inherit",
  }),
];
const stop = () => {
  for (const c of children) c.kill();
};
for (const c of children)
  c.on("exit", (code) => {
    stop();
    process.exit(code ?? 0);
  });
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
