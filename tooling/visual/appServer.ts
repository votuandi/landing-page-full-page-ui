/**
 * webServer command for an app. `E2E_SERVER=start` (default of `scripts/local-ci.sh e2e`) serves the production build:
 * no on-demand compile and a fraction of the memory of `next dev --webpack`, whose two servers per admin run grew to
 * 3–7 GB each and ran Windows out of commit (E11-S03: 8 VS Code OOM crashes). CI keeps `next dev` until it builds first.
 */
export const appServer = (app: "web" | "admin", port?: number) =>
  `pnpm --filter ${app} ${process.env.E2E_SERVER === "start" ? "start" : "dev"}${port ? ` --port ${port}` : ""}`;
