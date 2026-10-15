import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import test from "node:test";
import pg from "pg";
import { createDb, createPlatformDb, internalClient } from "../client.ts";
import { forTenant, forPlatform, type TenantRepo } from "../repository.ts";
import { withTenantTransaction } from "../tenantTransaction.ts";
import { redeemGhostGrant } from "../ghost.ts";

test("unawaited operations settle inside the runtime transaction without crashing Node", { skip: !process.env.DATABASE_URL }, () => {
  // A separate process makes Node's default unhandled-rejection exit observable.
  const result = spawnSync(process.execPath, ["--unhandled-rejections=strict", "--import", "tsx", "--input-type=module", "--eval", `
    import assert from 'node:assert/strict';
    import { randomUUID } from 'node:crypto';
    import { setTimeout as delay } from 'node:timers/promises';
    import { createDb, createPlatformDb } from ${JSON.stringify(new URL("../client.ts", import.meta.url).href)};
    import { forTenant } from ${JSON.stringify(new URL("../repository.ts", import.meta.url).href)};
    import { withTenantTransaction } from ${JSON.stringify(new URL("../tenantTransaction.ts", import.meta.url).href)};
    const db=createDb({pool:1}), ops=createPlatformDb({pool:1});
    const tenant=randomUUID(), plan='pending-'+randomUUID();
    try {
      await ops.plan.create({data:{id:plan,name:'Test',features:[],limits:{}}});
      await ops.tenant.create({data:{id:tenant,slug:tenant,name:'Test',planId:plan}});
      await withTenantTransaction(db,tenant,async repo=>{
        void repo.project.create({slug:'success',title:{}});
      });
      assert.equal(await forTenant(db,tenant).project.count(),1);
      for(const mode of ['early-rejection','sql-rejection','late-rejection','callback-throw','both','immediate-both']) {
        const callbackError=new Error('callback failed');
        let pendingSettled=false;
        await assert.rejects(withTenantTransaction(db,tenant,async repo=>{
          const write=repo.project.create({slug:mode,title:{}});
          if(mode==='callback-throw') void write.then(()=>{pendingSettled=true},()=>{pendingSettled=true});
          if(mode==='sql-rejection'||mode==='late-rejection'||mode==='immediate-both') void repo.project.create({slug:'success',title:{}});
          if(mode==='early-rejection'||mode==='both') void repo.sectionContent.update(randomUUID(),{type:'other'});
          // Let the rejection occur while the callback is still running.
          if(mode!=='callback-throw'&&mode!=='late-rejection'&&mode!=='immediate-both') await delay(25);
          if(mode==='callback-throw'||mode==='both'||mode==='immediate-both') throw callbackError;
        }), mode==='early-rejection'?/immutable/:mode==='sql-rejection'||mode==='late-rejection'
          ?error=>error.code==='P2002':error=>error===callbackError);
        if(mode==='callback-throw') assert.equal(pendingSettled,true,'drain pending operation before returning callback error');
        assert.equal(await forTenant(db,tenant).project.count(),1,'pending writes must roll back: '+mode);
      }
      await delay(25);
      console.log('pending runtime cases passed');
    } finally {
      await ops.tenant.deleteMany({where:{id:tenant}});
      await ops.plan.deleteMany({where:{id:plan}});
      await Promise.all([db.$disconnect(),ops.$disconnect()]);
    }
  `], { encoding: "utf8", timeout: 60_000 });
  assert.equal(result.error, undefined);
  assert.equal(result.signal, null);
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.match(result.stdout, /pending runtime cases passed/);
});

test("real runtime transaction: atomic references, rollback, context concurrency, expired facade, credential checks and ghost session", { skip: !process.env.DATABASE_URL }, async () => {
  const db = createDb({ pool: 3 }), ops = createPlatformDb({ pool: 2 });
  const a = randomUUID(), b = randomUUID(), plan = `tx-${randomUUID()}`, adminId = randomUUID();
  const wrongRuntime = createDb({ url: process.env.PLATFORM_DATABASE_URL, pool: 1 });
  const wrongPlatform = createPlatformDb({ url: process.env.DATABASE_URL, pool: 1 });
  const ownerRuntime = createDb({ url: process.env.TEST_OWNER_DATABASE_URL, pool: 1 });
  const single = createPlatformDb({ pool: 1 });
  try {
    await ops.plan.create({ data: { id: plan, name: "Test", features: [], limits: {} } });
    for (const id of [a,b]) await ops.tenant.create({ data: { id, slug: id, name: "Test", planId: plan } });
    assert.ok(await single.$transaction(tx=>tx.plan.count())>0, "first operation may be a transaction on a one-slot pool");
    const reloaded: typeof import("../client.ts") = await import(new URL("../client.ts?reload=rls-test", import.meta.url).href);
    await reloaded.checkConnection(db);
    await assert.rejects(forTenant(wrongRuntime,a).project.list(),/app_runtime credentials/);
    await assert.rejects(forTenant(ownerRuntime,a).project.list(),/app_runtime credentials/);
    await assert.rejects(forPlatform(wrongPlatform).platformAdmin.count(),/app_platform credentials/);
    await assert.rejects(withTenantTransaction(db,"invalid",async()=>null),/UUID/);
    let escaped!: TenantRepo;
    await withTenantTransaction(db,a,async repo=> {
      escaped=repo;
      const media=await repo.media.create({ key:`tenants/${a}/atomic`,driver:"local",mime:"image/png",size:1 });
      const project=await repo.project.create({ slug:"atomic",title:{},data:{image:{id:media.id}} });
      assert.equal((await repo.project.get(project.id))?.tenantId,a);
    });
    await assert.rejects(escaped.project.list(),/ended/);
    await assert.rejects(withTenantTransaction(db,b,async repo=> {
      await repo.project.create({slug:"rollback",title:{}});
      await repo.outbox.create({topic:"rls",payload:{},idempotencyKey:randomUUID()});
      await repo.auditLog.create({action:"rls",entity:"project"});
      throw new Error("rollback");
    }),/rollback/);
    assert.equal(await forTenant(db,b).project.count(),0);
    assert.equal(await forTenant(db,b).outbox.count(),0);
    assert.equal(await forTenant(db,b).auditLog.count(),0);
    const parallel=await Promise.all(Array.from({length:12},(_,i)=>withTenantTransaction(db,i%2?a:b,async repo=> {
      const row=await repo.project.create({slug:`parallel-${i}`,title:{}});
      assert.equal((await repo.project.get(row.id))?.tenantId,i%2?a:b);
      return repo.project.count();
    })));
    assert.ok(parallel.every(n=>n>0));
    assert.equal((await internalClient(db).$queryRaw<{count:bigint}[]>`SELECT count(*) FROM public."Project"`)[0].count,0n);
    await ops.platformAdmin.create({ data:{id:adminId,email:`${adminId}@tx.vn`,name:"Test",passwordHash:"secret"} });
    const token=randomUUID();
    const grant=await ops.ghostGrant.create({data:{platformAdminId:adminId,targetTenantId:a,reason:"test",tokenHash:createHash("sha256").update(token).digest("hex"),expiresAt:new Date(Date.now()+60_000),sessionExpiresAt:new Date(Date.now()+1_800_000)}});
    await assert.rejects(redeemGhostGrant(db,b,token),/Invalid ghost grant/);
    // Simulate a real session-write failure after consumption; the grant must become redeemable again.
    const operator=new pg.Pool({connectionString:process.env.TEST_OWNER_DATABASE_URL,max:1});
    const constraint=`ghost_failure_${adminId.replaceAll("-","")}`;
    try {
      await operator.query(`ALTER TABLE public."SiteSession" ADD CONSTRAINT "${constraint}" CHECK ("ghostGrantId" IS DISTINCT FROM '${grant.id}'::uuid) NOT VALID`);
      await assert.rejects(redeemGhostGrant(db,a,token),new RegExp(constraint));
    } finally {
      await operator.query(`ALTER TABLE public."SiteSession" DROP CONSTRAINT IF EXISTS "${constraint}"`);
      await operator.end();
    }
    assert.equal((await ops.ghostGrant.findUniqueOrThrow({where:{id:grant.id}})).usedAt,null);
    const results=await Promise.allSettled([redeemGhostGrant(db,a,token),redeemGhostGrant(db,a,token)]);
    assert.equal(results.filter(r=>r.status==="fulfilled").length,1);
    const result=results.find(r=>r.status==="fulfilled")!;
    if(result.status==="fulfilled") {
      const session=await forTenant(db,a).siteSession.get(result.value.sessionId);
      assert.equal(session?.kind,"ghost"); assert.equal(session?.audience,"admin");
      assert.equal(session?.tokenHash,createHash("sha256").update(result.value.token).digest("hex"));
      assert.ok(session!.expiresAt<=grant.sessionExpiresAt);
    }
  } finally {
    await ops.tenant.deleteMany({where:{id:{in:[a,b]}}});
    await ops.platformAdmin.deleteMany({where:{id:adminId}});
    await ops.plan.deleteMany({where:{id:plan}});
    await Promise.all([db,ops,wrongRuntime,wrongPlatform,ownerRuntime,single].map(c=>c.$disconnect()));
  }
});
