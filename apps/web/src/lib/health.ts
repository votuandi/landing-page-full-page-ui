type Check = () => Promise<unknown>;

export async function healthResponse(checks: { db: Check; redis?: Check }) {
  const run = async (name: "db" | "redis") => {
    const check = checks[name];
    if (!check) return "skipped";
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        Promise.resolve().then(check),
        new Promise((_, reject) => { timer = setTimeout(() => reject(Error("timeout")), 2000); }),
      ]);
      return "ok";
    } catch {
      console.error(`[health] ${name} error`);
      return "error";
    } finally { clearTimeout(timer); }
  };
  const [db, redis] = await Promise.all([run("db"), run("redis")]);
  const ok = db === "ok" && redis !== "error";
  return Response.json({ status: ok ? "ok" : "error", db, redis }, {
    status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" },
  });
}
