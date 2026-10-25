import assert from "node:assert/strict";
import net from "node:net";
import test from "node:test";
import { checkConnection, createDb } from "../index.ts";

test("fresh health checks detect a DB outage after readiness and recover", { skip: !process.env.DATABASE_URL }, async () => {
  const upstream = new URL(process.env.DATABASE_URL!);
  const upstreamHost = upstream.hostname, upstreamPort = Number(upstream.port || 5432);
  const sockets = new Set<net.Socket>();
  const proxy = net.createServer(socket => {
    const peer = net.connect(upstreamPort, upstreamHost);
    for (const connection of [socket, peer]) {
      sockets.add(connection);
      connection.on("error", () => { socket.destroy(); peer.destroy(); });
      connection.on("close", () => sockets.delete(connection));
    }
    socket.pipe(peer).pipe(socket);
  });
  const listen = (port: number) => new Promise<void>(resolve => proxy.listen(port, "127.0.0.1", resolve));
  const stop = () => new Promise<void>((resolve, reject) => {
    proxy.close(error => error ? reject(error) : resolve());
    for (const socket of sockets) socket.destroy();
  });
  await listen(0);
  const port = (proxy.address() as net.AddressInfo).port;
  upstream.hostname = "127.0.0.1";
  upstream.port = String(port);
  const db = createDb({ url: upstream.href, pool: 1 });
  try {
    await assert.doesNotReject(checkConnection(db), "initial readiness through proxy");
    await stop();
    // Cached role readiness is deliberately unchanged for existing repository callers.
    await checkConnection(db);
    await assert.rejects(checkConnection(db, { fresh: true }));
    await listen(port);
    await assert.doesNotReject(checkConnection(db, { fresh: true }), "recovery through proxy");
  } finally {
    await db.$disconnect();
    if (proxy.listening) await stop();
  }
});
