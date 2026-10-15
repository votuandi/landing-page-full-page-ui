import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import pg from "pg";
import { tenantModels, optionalTenantModels } from "../tenantScope.ts";

const enabled = !!process.env.DATABASE_URL;
if (process.env.RLS_REQUIRED && (!enabled || !process.env.PLATFORM_DATABASE_URL || !process.env.TEST_OWNER_DATABASE_URL || !process.env.SEED_PASSWORD)) {
  throw new Error("RLS_REQUIRED needs runtime, platform, test owner URLs and SEED_PASSWORD");
}
const denied = { code: "42501" };
describe("Postgres RLS through real app_runtime connections (no repository/Prisma guard)", { skip: !enabled }, () => {
  const runtime = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  const platform = new pg.Pool({ connectionString: process.env.PLATFORM_DATABASE_URL, max: 1 });
  const owner = new pg.Pool({ connectionString: process.env.TEST_OWNER_DATABASE_URL, max: 1 });
  const a = randomUUID(), b = randomUUID(), productA = randomUUID(), productB = randomUUID();
  const userA = randomUUID(), userB = randomUUID(), admin = randomUUID(), plan = `rls-${randomUUID()}`;
  const sessions = [randomUUID(), randomUUID()], tokens = [randomUUID(), randomUUID()];
  const scoped = async <T>(tenant: string, work: (c: pg.PoolClient) => Promise<T>) => {
    const c = await runtime.connect();
    try { await c.query("BEGIN"); await c.query("SELECT set_config('app.tenant_id', $1, true)", [tenant]); const result = await work(c); await c.query("COMMIT"); return result; }
    catch (error) { await c.query("ROLLBACK"); throw error; } finally { c.release(); }
  };
  before(async () => {
    for (const [pool, role] of [[runtime, "app_runtime"], [platform, "app_platform"]] as const) {
      const { rows: [r] } = await pool.query("SELECT current_user, session_user, rolsuper, rolbypassrls FROM pg_roles WHERE rolname=current_user");
      assert.equal(r.current_user, role); assert.equal(r.session_user, role); assert.equal(r.rolsuper, false); assert.equal(r.rolbypassrls, false);
    }
    await platform.query('INSERT INTO public."Plan" (id,name,features,limits,"updatedAt") VALUES ($1,\'RLS\',\'{}\',\'{}\',now())', [plan]);
    for (const id of [a, b]) await platform.query('INSERT INTO public."Tenant" (id,name,slug,"planId","updatedAt") VALUES ($1::uuid,\'RLS\',$1::text,$2,now())', [id, plan]);
    for (const [id, tenant] of [[productA, a], [productB, b]]) await platform.query('INSERT INTO public."Product" (id,"tenantId",slug,title,"updatedAt") VALUES ($1,$2,\'shared\',\'{}\',now())', [id, tenant]);
    for (const [id, tenant] of [[userA, a], [userB, b]]) await platform.query('INSERT INTO public."SiteUser" (id,"tenantId",email,name,role,"updatedAt") VALUES ($1,$2,\'same@rls.vn\',\'RLS\',\'owner\',now())', [id, tenant]);
    await platform.query('INSERT INTO public."PlatformAdmin" (id,email,name,"passwordHash","updatedAt") VALUES ($1,$2,\'RLS\',\'secret\',now())', [admin, `${admin}@rls.vn`]);
  });
  before(async () => {
    for (const [i, tenant, user] of [[0, a, userA], [1, b, userB]] as const) {
      await platform.query('INSERT INTO public."SiteSession" (id,"tenantId","siteUserId",audience,"tokenHash","expiresAt") VALUES ($1::uuid,$2,$3,\'admin\',$1::text,now()+interval \'1 hour\')', [sessions[i], tenant, user]);
      await platform.query('INSERT INTO public."SiteToken" (id,"tenantId","siteUserId",purpose,"tokenHash","expiresAt") VALUES ($1::uuid,$2,$3,\'invite\',$1::text,now()+interval \'1 hour\')', [tokens[i], tenant, user]);
    }
  });
  after(async () => {
    try {
      await owner.query('DELETE FROM public."AuditLog" WHERE "tenantId" IN ($1,$2)', [a, b]);
      await platform.query('DELETE FROM public."Tenant" WHERE id IN ($1,$2)', [a, b]);
      await platform.query('DELETE FROM public."PlatformAdmin" WHERE id=$1', [admin]);
      await platform.query('DELETE FROM public."Plan" WHERE id=$1', [plan]);
    } finally { await Promise.all([runtime.end(), platform.end(), owner.end()]); }
  });
  test("catalog coverage: every tenant table including Tenant has FORCE and only explicit runtime/platform policies", async () => {
    const tables = [...tenantModels, ...optionalTenantModels, "Tenant"].sort();
    const { rows } = await platform.query(`SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity, r.rolname AS owner FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_roles r ON r.oid=c.relowner WHERE n.nspname='public' AND c.relname=ANY($1) ORDER BY c.relname`, [tables]);
    assert.deepEqual(rows.map(r => r.relname), tables);
    for (const row of rows) { assert.equal(row.relrowsecurity, true, row.relname); assert.equal(row.relforcerowsecurity, true); assert.equal(row.owner, "app_owner"); }
    const policies = (await platform.query("SELECT tablename,policyname,roles,permissive,cmd,qual,with_check FROM pg_policies WHERE schemaname='public' AND tablename=ANY($1) ORDER BY tablename,policyname", [tables])).rows;
    assert.deepEqual(policies, tables.flatMap(tablename => {
      const column = tablename === "Tenant" ? "id" : '"tenantId"';
      const predicate = "(" + column + " = (NULLIF(current_setting('app.tenant_id'::text, true), ''::text))::uuid)";
      return [
        { tablename, policyname: "platform_access", roles: "{app_platform}", permissive: "PERMISSIVE", cmd: "ALL", qual: "true", with_check: "true" },
        { tablename, policyname: "tenant_isolation", roles: "{app_runtime}", permissive: "PERMISSIVE", cmd: "ALL", qual: predicate, with_check: predicate },
      ];
    }));
    for (const table of tables) assert.equal((await runtime.query(`SELECT id FROM public."${table}"`)).rowCount, 0, table);
    const c = await owner.connect();
    try {
      await c.query('BEGIN'); await c.query('SET LOCAL ROLE app_owner');
      assert.equal((await c.query('SELECT id FROM public."Product"')).rowCount, 0, "FORCE applies to non-bypass owner");
    } finally { await c.query('ROLLBACK'); c.release(); }
  });
  test("effective ACL matches the table/function allowlist, including new app_owner objects", async () => {
    const crud = ["SELECT", "INSERT", "UPDATE", "DELETE"];
    const tenantTables: readonly string[] = [...tenantModels, ...optionalTenantModels];
    const tables = [...tenantTables, "Tenant", "Plan", "Customer", "PlatformAdmin", "PlatformSession", "GhostGrant", "PlatformSetting", "_prisma_migrations"];
    const { rows } = await runtime.query(`SELECT c.relname, r.role, p.privilege,
      has_table_privilege(r.role,c.oid,p.privilege) AS allowed,
      has_table_privilege(r.role,c.oid,p.privilege || ' WITH GRANT OPTION') AS grantable
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      CROSS JOIN unnest(ARRAY['app_runtime','app_platform']) r(role)
      CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) p(privilege)
      WHERE n.nspname='public' AND c.relname=ANY($1)`, [tables]);
    assert.equal(rows.length, tables.length * 2 * 7);
    for (const row of rows) {
      const allowed = row.role === "app_platform"
        ? row.relname !== "_prisma_migrations" && (row.relname === "AuditLog" ? ["SELECT", "INSERT"] : crud).includes(row.privilege)
        : (row.relname === "Plan" || row.relname === "Tenant" ? ["SELECT"]
          : row.relname === "AuditLog" ? ["SELECT", "INSERT"] : tenantTables.includes(row.relname) ? crud : []).includes(row.privilege);
      assert.equal(row.allowed, allowed, JSON.stringify(row));
      assert.equal(row.grantable, false, JSON.stringify(row));
    }
    assert.deepEqual((await runtime.query(`SELECT c.relname, acl.privilege_type FROM pg_class c
      JOIN pg_namespace n ON n.oid=c.relnamespace
      CROSS JOIN LATERAL aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) acl
      WHERE n.nspname='public' AND c.relname=ANY($1) AND acl.grantee=0`, [tables])).rows, []);
    for (const role of ["app_runtime", "app_platform"]) {
      assert.deepEqual((await runtime.query("SELECT has_schema_privilege($1,'public','USAGE') AS usage, has_schema_privilege($1,'public','CREATE') AS create", [role])).rows, [{ usage: true, create: false }]);
    }
    assert.deepEqual((await runtime.query(`SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND has_function_privilege('app_runtime',p.oid,'EXECUTE') ORDER BY p.proname`)).rows,
    [{ proname: "redeem_ghost_grant" }, { proname: "resolve_tenant_host" }]);
    const c = await owner.connect(), probe = `rls_probe_${randomUUID().replaceAll("-", "")}`;
    try {
      await c.query("BEGIN"); await c.query("SET LOCAL ROLE app_owner");
      assert.equal((await c.query("SELECT current_user")).rows[0].current_user, "app_owner");
      await c.query(`CREATE TABLE public.${probe} (id integer)`);
      await c.query(`CREATE SEQUENCE public.${probe}_seq`);
      await c.query(`CREATE FUNCTION public.${probe}() RETURNS integer LANGUAGE sql AS 'SELECT 1'`);
      assert.deepEqual((await c.query(`SELECT has_function_privilege('app_runtime',p.oid,'EXECUTE') AS runtime,
        has_function_privilege('app_platform',p.oid,'EXECUTE') AS platform,
        EXISTS (SELECT FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) acl WHERE acl.grantee=0 AND acl.privilege_type='EXECUTE') AS public
        FROM pg_proc p WHERE p.oid=$1::regprocedure`, [`public.${probe}()`])).rows,
      [{ runtime: false, platform: false, public: false }]);
      for (const role of ["app_runtime", "app_platform"]) {
        assert.equal((await c.query("SELECT has_table_privilege($1,$2,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') AS allowed", [role, `public.${probe}`])).rows[0].allowed, false);
        assert.equal((await c.query("SELECT has_sequence_privilege($1,$2,'USAGE,SELECT,UPDATE') AS allowed", [role, `public.${probe}_seq`])).rows[0].allowed, false);
      }
      assert.equal((await c.query(`SELECT count(*)::int AS count FROM pg_class c,
        LATERAL aclexplode(coalesce(c.relacl,acldefault(CASE WHEN c.relkind='S' THEN 'S'::"char" ELSE 'r'::"char" END,c.relowner))) acl
        WHERE c.oid IN ($1::regclass,$2::regclass) AND acl.grantee=0`, [`public.${probe}`, `public.${probe}_seq`])).rows[0].count, 0);
    } finally { await c.query("ROLLBACK"); c.release(); }
  });
  test("missing/empty context reads and modifies zero rows; insert is denied", async () => {
    for (const sql of ['SELECT id FROM public."Product"', 'UPDATE public."Product" SET title=\'{}\'', 'DELETE FROM public."Product"']) assert.equal((await runtime.query(sql)).rowCount, 0);
    await assert.rejects(runtime.query('INSERT INTO public."Product" (id,"tenantId",slug,title,"updatedAt") VALUES ($1,$2,\'no-context\',\'{}\',now())', [randomUUID(), a]), denied);
    for (const sql of ['SELECT id FROM public."Product"', 'UPDATE public."Product" SET title=\'{}\'', 'DELETE FROM public."Product"']) await scoped("", async c => assert.equal((await c.query(sql)).rowCount, 0));
    await assert.rejects(scoped("", c => c.query('INSERT INTO public."Product" (id,"tenantId",slug,title,"updatedAt") VALUES ($1,$2,\'empty-context\',\'{}\',now())', [randomUUID(), a])), denied);
  });
  test("unfiltered SELECT/UPDATE/DELETE only see A; B inserts and moving A to B fail WITH CHECK", async () => {
    await scoped(a, async c => {
      assert.deepEqual((await c.query('SELECT id FROM public."Product"')).rows, [{ id: productA }]);
      assert.equal((await c.query('UPDATE public."Product" SET title=\'{"vi":"A"}\'')).rowCount, 1);
      for (const verb of ['UPDATE public."Product" SET title=\'{}\'', 'DELETE FROM public."Product"']) assert.equal((await c.query(`${verb} WHERE id=$1`, [productB])).rowCount, 0);
    });
    await assert.rejects(scoped(a, c => c.query('INSERT INTO public."Product" (id,"tenantId",slug,title,"updatedAt") VALUES ($1,$2,\'foreign\',\'{}\',now())', [randomUUID(), b])), denied);
    await assert.rejects(scoped(a, c => c.query('UPDATE public."Product" SET "tenantId"=$1 WHERE id=$2', [b, productA])), denied);
    assert.deepEqual((await platform.query('SELECT title FROM public."Product" WHERE id=$1', [productB])).rows[0].title, {});
    await scoped(a, async c => assert.equal((await c.query('DELETE FROM public."Product"')).rowCount, 1));
    assert.equal((await platform.query('SELECT id FROM public."Product" WHERE id=$1', [productB])).rowCount, 1);
  });
  test("pool context clears on COMMIT, explicit ROLLBACK and SQL abort on the same backend", async () => {
    for (const finish of ["COMMIT", "ROLLBACK", "abort"]) {
      const c = await runtime.connect();
      const pid = (await c.query("SELECT pg_backend_pid() AS pid")).rows[0].pid;
      try {
        await c.query("BEGIN"); await c.query("SELECT set_config('app.tenant_id',$1,true)", [a]);
        assert.equal((await c.query('SELECT id FROM public."SiteUser"')).rowCount, 1);
        if (finish === "abort") { await assert.rejects(c.query("SELECT 1/0"), { code: "22012" }); await c.query("ROLLBACK"); } else await c.query(finish);
      } finally { c.release(); }
      const reused = await runtime.connect();
      try { assert.equal((await reused.query("SELECT pg_backend_pid() AS pid")).rows[0].pid, pid); assert.equal((await reused.query('SELECT id FROM public."SiteUser"')).rowCount, 0); } finally { reused.release(); }
      await scoped(b, async c => assert.deepEqual((await c.query('SELECT id FROM public."SiteUser"')).rows, [{ id: userB }]));
    }
  });
  test("account CRUD respects tenant context and platform tables/role/DDL remain forbidden", async () => {
    await scoped(a, async c => {
      assert.equal((await c.query('SELECT id FROM public."SiteUser" WHERE id=$1', [userB])).rowCount, 0);
      assert.equal((await c.query('UPDATE public."SiteUser" SET name=\'A\'')).rowCount, 1);
      assert.equal((await c.query('DELETE FROM public."SiteUser" WHERE id=$1', [userB])).rowCount, 0);
      const id = randomUUID();
      await c.query('INSERT INTO public."SiteUser" (id,"tenantId",email,name,role,"updatedAt") VALUES ($1,$2,\'new@rls.vn\',\'RLS\',\'owner\',now())', [id,a]);
      assert.equal((await c.query('DELETE FROM public."SiteUser" WHERE id=$1', [id])).rowCount, 1);
    });
    await assert.rejects(scoped(a, c => c.query('UPDATE public."SiteUser" SET "tenantId"=$1', [b])), denied);
    await assert.rejects(scoped(a, c => c.query('INSERT INTO public."SiteUser" (id,"tenantId",email,name,role,"updatedAt") VALUES ($1,$2,\'foreign@rls.vn\',\'RLS\',\'owner\',now())', [randomUUID(),b])), denied);
    for (const table of ["Customer", "PlatformAdmin", "PlatformSession", "GhostGrant", "PlatformSetting", "_prisma_migrations"]) await assert.rejects(runtime.query(`SELECT * FROM public."${table}"`), denied);
    for (const sql of ['SET ROLE app_owner', 'SET ROLE app_platform', 'ALTER TABLE public."Product" DISABLE ROW LEVEL SECURITY', 'ALTER TABLE public."Product" NO FORCE ROW LEVEL SECURITY', 'TRUNCATE public."Product"', 'UPDATE public."AuditLog" SET action=\'x\'', 'DELETE FROM public."AuditLog"', 'TRUNCATE public."AuditLog"']) await assert.rejects(runtime.query(sql), denied);
  });
  test("SiteSession/SiteToken SQL CRUD cannot cross tenant boundaries", async () => {
    for (const [table, ids, discriminator] of [
      ["SiteSession", sessions, "audience"], ["SiteToken", tokens, "purpose"],
    ] as const) {
      const insert = `INSERT INTO public."${table}" (id,"tenantId","siteUserId","${discriminator}","tokenHash","expiresAt")
        VALUES ($1::uuid,$2,$3,'${table === "SiteSession" ? "admin" : "invite"}',$1::text,now()+interval '1 hour')`;
      const beforeB = (await platform.query(`SELECT * FROM public."${table}" WHERE id=$1`, [ids[1]])).rows;
      await scoped(a, async c => {
        assert.deepEqual((await c.query(`SELECT id FROM public."${table}"`)).rows, [{ id: ids[0] }]);
        assert.equal((await c.query(`UPDATE public."${table}" SET "expiresAt"='2099-01-01'`)).rowCount, 1);
        for (const verb of [`UPDATE public."${table}" SET "expiresAt"='2000-01-01'`, `DELETE FROM public."${table}"`]) {
          assert.equal((await c.query(`${verb} WHERE id=$1`, [ids[1]])).rowCount, 0);
        }
        const id = randomUUID();
        await c.query(insert, [id, a, userA]);
        assert.equal((await c.query(`DELETE FROM public."${table}" WHERE id=$1`, [id])).rowCount, 1);
      });
      await assert.rejects(scoped(a, c => c.query(insert, [randomUUID(), b, userB])), denied);
      await assert.rejects(scoped(a, c => c.query(`UPDATE public."${table}" SET "tenantId"=$1,"siteUserId"=$2 WHERE id=$3`, [b, userB, ids[0]])), denied);
      await scoped(a, async c => assert.equal((await c.query(`DELETE FROM public."${table}"`)).rowCount, 1));
      assert.deepEqual((await platform.query(`SELECT * FROM public."${table}" WHERE id=$1`, [ids[1]])).rows, beforeB);
    }
  });
  test("nullable audit/outbox rows stay platform-only; runtime audit is append-only", async () => {
    for (const table of ["AuditLog", "Outbox"]) {
      const insert = table === "AuditLog" ? 'INSERT INTO public."AuditLog" (id,"tenantId",action,entity) VALUES ($1,$2,\'rls\',\'test\')' : 'INSERT INTO public."Outbox" (id,"tenantId",topic,payload,"idempotencyKey") VALUES ($1::uuid,$2,\'rls\',\'{}\',$1::text)';
      const ids = [randomUUID(), randomUUID(), randomUUID()];
      try {
        for (const [i, tenant] of [[1, b], [2, null]] as const) await platform.query(insert, [ids[i], tenant]);
        const before = (await platform.query(`SELECT * FROM public."${table}" WHERE id=ANY($1) ORDER BY id`, [ids.slice(1)])).rows;
        for (const tenant of [b, null]) await assert.rejects(scoped(a, c => c.query(insert, [randomUUID(), tenant])), denied);
        await scoped(a, async c => {
          await c.query(insert, [ids[0], a]);
          assert.deepEqual((await c.query(`SELECT id FROM public."${table}"`)).rows, [{ id: ids[0] }]);
          if (table === "Outbox") {
            assert.equal((await c.query('UPDATE public."Outbox" SET topic=\'updated\'')).rowCount, 1);
            for (const id of ids.slice(1)) {
              assert.equal((await c.query('UPDATE public."Outbox" SET topic=\'foreign\' WHERE id=$1', [id])).rowCount, 0);
              assert.equal((await c.query('DELETE FROM public."Outbox" WHERE id=$1', [id])).rowCount, 0);
            }
          }
        });
        if (table === "Outbox") {
          for (const tenant of [b, null]) await assert.rejects(scoped(a, c => c.query('UPDATE public."Outbox" SET "tenantId"=$1 WHERE id=$2', [tenant, ids[0]])), denied);
          await scoped(a, async c => assert.equal((await c.query('DELETE FROM public."Outbox"')).rowCount, 1));
        }
        assert.deepEqual((await platform.query(`SELECT * FROM public."${table}" WHERE id=ANY($1) ORDER BY id`, [ids.slice(1)])).rows, before);
      } finally { await owner.query(`DELETE FROM public."${table}" WHERE id=ANY($1)`, [ids]); }
    }
  });
  test("ghost SQL consumes once, is tenant-bound, and rolls back with its transaction", async () => {
    const token = randomUUID(), id = randomUUID();
    await platform.query('INSERT INTO public."GhostGrant" (id,"platformAdminId","targetTenantId",reason,"tokenHash","expiresAt","sessionExpiresAt") VALUES ($1,$2,$3,\'RLS\',$4,now()+interval \'1 minute\',now()+interval \'30 minutes\')',[id,admin,a,createHash("sha256").update(token).digest("hex")]);
    const redeem = (tenant: string, value: string=token) => scoped(tenant,c => c.query('SELECT * FROM public.redeem_ghost_grant($1,$2)',[value,tenant]));
    assert.equal((await redeem(b)).rowCount,0); assert.equal((await redeem(a,"wrong")).rowCount,0);
    await assert.rejects(scoped(a,async c => { assert.equal((await c.query('SELECT * FROM public.redeem_ghost_grant($1,$2)',[token,a])).rowCount,1); throw new Error("rollback"); }),/rollback/);
    const results=await Promise.all([redeem(a),redeem(a)]);
    assert.deepEqual(results.map(r=>r.rowCount).sort(),[0,1]);
  });
  test("SECURITY DEFINER bridges have fixed search paths/owners/ACL and ignore temporary table spoofing", async () => {
    const functions=(await platform.query(`SELECT p.proname,p.prosecdef,p.proconfig,r.rolname,
      EXISTS (SELECT FROM aclexplode(p.proacl) acl WHERE acl.grantee=0 AND acl.privilege_type='EXECUTE') AS public_execute
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_roles r ON r.oid=p.proowner
      WHERE n.nspname='public' AND p.proname IN ('resolve_tenant_host','redeem_ghost_grant')`)).rows;
    assert.equal(functions.length,2);
    for(const f of functions) { assert.equal(f.prosecdef,true); assert.equal(f.rolname,'app_platform'); assert.equal(f.public_execute,false); assert.deepEqual(f.proconfig,['search_path=pg_catalog, pg_temp']); }
    const token = randomUUID(), fakeToken = randomUUID(), grantId = randomUUID(), fakeGrant = randomUUID(), fakeActor = randomUUID();
    await platform.query(`INSERT INTO public."GhostGrant" (id,"platformAdminId","targetTenantId",reason,"tokenHash","expiresAt","sessionExpiresAt")
      VALUES ($1,$2,$3,'spoof-test',$4,(now() AT TIME ZONE 'UTC')+interval '1 minute',(now() AT TIME ZONE 'UTC')+interval '30 minutes')`,
    [grantId, admin, a, createHash("sha256").update(token).digest("hex")]);
    const c = await runtime.connect();
    try {
      await c.query("BEGIN");
      await c.query("SELECT set_config('app.tenant_id',$1,true)", [a]);
      await c.query('CREATE TEMP TABLE "Domain" (hostname text) ON COMMIT DROP');
      await c.query("INSERT INTO pg_temp.\"Domain\" VALUES ('spoof.localhost')");
      await c.query('CREATE TEMP TABLE "PlatformAdmin" (id uuid, status text) ON COMMIT DROP');
      await c.query('CREATE TEMP TABLE "GhostGrant" (id uuid,"platformAdminId" uuid,"targetTenantId" uuid,"tokenHash" text,"usedAt" timestamp,"revokedAt" timestamp,"expiresAt" timestamp,"sessionExpiresAt" timestamp) ON COMMIT DROP');
      await c.query(`INSERT INTO pg_temp."PlatformAdmin" VALUES ($1,'disabled'),($2,'active')`, [admin, fakeActor]);
      await c.query(`INSERT INTO pg_temp."GhostGrant" VALUES ($1,$2,$3,$4,NULL,NULL,now()+interval '1 hour',now()+interval '1 hour')`,
        [fakeGrant, fakeActor, a, createHash("sha256").update(fakeToken).digest("hex")]);
      await c.query("SET LOCAL search_path=pg_temp,public");
      assert.equal((await c.query("SELECT * FROM public.resolve_tenant_host('spoof.localhost')")).rowCount, 0);
      const row = (await c.query("SELECT * FROM public.resolve_tenant_host('t15.localhost')")).rows[0];
      assert.ok(row, "seeded host is resolvable despite spoofed Domain");
      assert.deepEqual(Object.keys(row).sort(), ['hostname','tenantId','siteId','status','isPrimary','tenantStatus','primaryHost'].sort());
      assert.equal((await c.query('SELECT * FROM public.redeem_ghost_grant($1,$2)', [fakeToken,a])).rowCount, 0);
      const redeemed = (await c.query('SELECT * FROM public.redeem_ghost_grant($1,$2)', [token,a])).rows;
      assert.equal(redeemed.length, 1);
      assert.equal(redeemed[0].grantId, grantId); assert.equal(redeemed[0].actorId, admin);
      assert.equal((await c.query('SELECT * FROM public.redeem_ghost_grant($1,$2)', [token,a])).rowCount, 0);
      assert.equal((await c.query('SELECT "usedAt" FROM pg_temp."GhostGrant" WHERE id=$1', [fakeGrant])).rows[0].usedAt, null);
      await c.query("COMMIT");
    } finally { await c.query("ROLLBACK"); c.release(); }
    assert.ok((await platform.query('SELECT "usedAt" FROM public."GhostGrant" WHERE id=$1', [grantId])).rows[0].usedAt);
    assert.equal((await platform.query('SELECT id FROM public."GhostGrant" WHERE id=$1', [fakeGrant])).rowCount, 0);
  });
  test("ghost invalid states never consume a token", async () => {
    for(const state of ['expired','session-expired','used','revoked','disabled','suspended','missing-context','wrong-target']) {
      const token=randomUUID(), id=randomUUID();
      await platform.query('INSERT INTO public."GhostGrant" (id,"platformAdminId","targetTenantId",reason,"tokenHash","expiresAt","sessionExpiresAt") VALUES ($1,$2,$3,\'RLS\',$4,(now() AT TIME ZONE \'UTC\')+interval \'1 minute\',(now() AT TIME ZONE \'UTC\')+interval \'30 minutes\')',[id,admin,a,createHash('sha256').update(token).digest('hex')]);
      if(state==='expired') await platform.query('UPDATE public."GhostGrant" SET "expiresAt"=\'2000-01-01\' WHERE id=$1',[id]);
      if(state==='session-expired') await platform.query('UPDATE public."GhostGrant" SET "sessionExpiresAt"=\'2000-01-01\' WHERE id=$1',[id]);
      if(state==='used') await platform.query('UPDATE public."GhostGrant" SET "usedAt"=now() WHERE id=$1',[id]);
      if(state==='revoked') await platform.query('UPDATE public."GhostGrant" SET "revokedAt"=now() WHERE id=$1',[id]);
      if(state==='disabled') await platform.query('UPDATE public."PlatformAdmin" SET status=\'disabled\' WHERE id=$1',[admin]);
      if(state==='suspended') await platform.query('UPDATE public."Tenant" SET status=\'suspended\' WHERE id=$1',[a]);
      try {
        if(state==='missing-context') assert.equal((await runtime.query('SELECT * FROM public.redeem_ghost_grant($1,$2)',[token,a])).rowCount,0);
        else await scoped(a,async c=>assert.equal((await c.query('SELECT * FROM public.redeem_ghost_grant($1,$2)',[token,state==='wrong-target'?b:a])).rowCount,0,state));
        if(state!=='used') assert.equal((await platform.query('SELECT "usedAt" FROM public."GhostGrant" WHERE id=$1',[id])).rows[0].usedAt,null);
      } finally {
        await platform.query('UPDATE public."PlatformAdmin" SET status=\'active\' WHERE id=$1',[admin]);
        await platform.query('UPDATE public."Tenant" SET status=\'trial\' WHERE id=$1',[a]);
      }
    }
  });
});
