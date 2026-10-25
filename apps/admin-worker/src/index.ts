import { Admin, importKey } from "./admin";

/** Worker の設定。秘密の値(GITHUB_CLIENT_SECRET・KEY)は wrangler secret で入れる */
interface Env {
  ADMIN_KV: KVNamespace;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  OWNER_ID: string;
  REPO: string;
  ORIGIN: string;
  KEY: string;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const admin = new Admin({
      config: {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        ownerId: Number(env.OWNER_ID),
        repo: env.REPO,
        origin: env.ORIGIN,
        key: await importKey(env.KEY),
      },
      store: env.ADMIN_KV,
      fetch: (input, init) => fetch(input, init),
      now: () => Math.floor(Date.now() / 1000),
    });
    return admin.handle(req);
  },
} satisfies ExportedHandler<Env>;
