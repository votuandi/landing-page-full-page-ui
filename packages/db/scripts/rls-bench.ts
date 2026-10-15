import { createHash, randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client.ts";
import { createTenantRepo } from "../src/repository.ts";

// Operator-only, disposable schemas: never disable policy on application tables.
for (const key of ["DATABASE_URL", "TEST_OWNER_DATABASE_URL"]) if (!process.env[key]) throw new Error(`${key} is required`);
const owner = new pg.Pool({ connectionString: process.env.TEST_OWNER_DATABASE_URL, max: 1 });
const runtime = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const suffix = randomUUID().replaceAll("-", ""), schemas = [`bench_base_${suffix}`, `bench_rls_${suffix}`];
const tenant = "00000000-0000-0000-0000-000000000001";
const samples = 1000, warmup = 100;
const percentile = (values: number[], p: number) => [...values].sort((a,b)=>a-b)[Math.floor((values.length-1)*p)];
const report: Record<string, unknown> = { samples, warmup, node: process.version, workloads: [] };
let failed = false;
try {
  const role = (await runtime.query("SELECT current_user,session_user,rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user")).rows[0];
  if (role.current_user !== "app_runtime" || role.session_user !== "app_runtime" || role.rolsuper || role.rolbypassrls) throw new Error("Benchmark requires real app_runtime");
  report.environment = (await owner.query("SELECT version(),current_setting('shared_buffers') AS shared_buffers,current_setting('jit') AS jit")).rows[0];
  for (const [index, schema] of schemas.entries()) {
    await owner.query(`CREATE SCHEMA "${schema}"; GRANT USAGE ON SCHEMA "${schema}" TO app_runtime`);
    for (const table of ["Product", "ProductCategory", "SiteUser"]) {
      await owner.query(`CREATE TABLE "${schema}"."${table}" (LIKE public."${table}" INCLUDING ALL); GRANT SELECT ON "${schema}"."${table}" TO app_runtime`);
      if (index) await owner.query(`ALTER TABLE "${schema}"."${table}" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE "${schema}"."${table}" FORCE ROW LEVEL SECURITY;
        CREATE POLICY tenant_isolation ON "${schema}"."${table}" TO app_runtime
          USING ("tenantId"=nullif(current_setting('app.tenant_id',true),'')::uuid)
          WITH CHECK ("tenantId"=nullif(current_setting('app.tenant_id',true),'')::uuid)`);
    }
    await owner.query(`INSERT INTO "${schema}"."ProductCategory" (id,"tenantId",slug,title,"updatedAt")
      SELECT md5('cat'||t)::uuid, lpad(t::text,32,'0')::uuid,'category','{}',now() FROM generate_series(1,20) t`);
    await owner.query(`INSERT INTO "${schema}"."Product" (id,"tenantId",slug,title,"categoryId",status,"updatedAt")
      SELECT md5(t||'product'||p)::uuid,lpad(t::text,32,'0')::uuid,'product-'||p,'{}',md5('cat'||t)::uuid,'published',now()
      FROM generate_series(1,20) t CROSS JOIN generate_series(1,1000) p`);
    await owner.query(`INSERT INTO "${schema}"."SiteUser" (id,"tenantId",email,name,role,"updatedAt")
      SELECT md5(t||'user'||p)::uuid,lpad(t::text,32,'0')::uuid,'user'||p||'@bench.vn','Test','owner',now()
      FROM generate_series(1,20) t CROSS JOIN generate_series(1,1000) p`);
    for (const table of ["Product", "ProductCategory", "SiteUser"]) await owner.query(`ANALYZE "${schema}"."${table}"`);
  }
  const workloads = {
    get: (s: string) => `SELECT id,title FROM "${s}"."Product" WHERE "tenantId"=$1 AND id=md5('1product500')::uuid`,
    list: (s: string) => `SELECT id,title FROM "${s}"."Product" WHERE "tenantId"=$1 AND status='published' ORDER BY "order",id LIMIT 30`,
    join: (s: string) => `SELECT p.id,c.slug FROM "${s}"."Product" p JOIN "${s}"."ProductCategory" c ON c."tenantId"=p."tenantId" AND c.id=p."categoryId" WHERE p."tenantId"=$1 ORDER BY p.id LIMIT 30`,
    login: (s: string) => `SELECT id,name FROM "${s}"."SiteUser" WHERE "tenantId"=$1 AND email='user500@bench.vn'`,
  };
  for (const [name, sql] of Object.entries(workloads)) {
    const times: number[][] = [[],[]], wall: number[][] = [[],[]], plans: unknown[] = [];
    for (let n=-warmup;n<samples;n++) {
      // Alternate order to avoid attributing thermal/cache drift to RLS.
      for (const index of n%2 ? [1,0] : [0,1]) {
        const start=performance.now(), c=await runtime.connect();
        try {
          await c.query("BEGIN"); await c.query("SELECT set_config('app.tenant_id',$1,true)",[tenant]);
          // Disable per-node clock reads: RLS adds a Result node, whose instrumentation otherwise skews microsecond queries.
          const result=await c.query(`EXPLAIN (ANALYZE,BUFFERS,TIMING OFF,FORMAT JSON) ${sql(schemas[index])}`,[tenant]);
          await c.query("COMMIT");
          const plan=result.rows[0]["QUERY PLAN"][0];
          if(n>=0) { times[index].push(plan["Execution Time"]); wall[index].push(performance.now()-start); }
          if(n===0) plans[index]=plan;
        } finally { c.release(); }
      }
    }
    const median=times.map(t=>percentile(t,0.5)), p95=times.map(t=>percentile(t,0.95));
    const overhead=(median[1]/median[0]-1)*100;
    const overheadMs=median[1]-median[0];
    const result={name,medianMs:median,p95Ms:p95,overheadPercent:overhead,overheadMs,wallMedianMs:wall.map(t=>percentile(t,0.5)),plans,samplesMs:times};
    (report.workloads as unknown[]).push(result);
    console.log(`${name}: execution median baseline=${median[0]}ms RLS=${median[1]}ms overhead=${overhead.toFixed(2)}% (${overheadMs.toFixed(3)}ms); p95=${p95.join('/')}ms; wall median=${result.wallMedianMs.map(n=>n.toFixed(3)).join('/')}ms`);
    // Fail only when both limits are exceeded; compare medians to keep inclusive boundaries stable.
    if(median[1]>median[0]*1.1 && median[1]>median[0]+0.02) failed=true;
  }
  // Separate repository round trips from server execution (same SQL and filtered data).
  const wall: number[][]=[[],[]];
  for(let n=-warmup;n<samples;n++) for(const index of n%2?[1,0]:[0,1]) {
    const start=performance.now(), c=await runtime.connect();
    try {
      if(index) { await c.query('BEGIN'); await c.query("SELECT set_config('app.tenant_id',$1,true)",[tenant]); }
      await c.query(workloads.get(schemas[index]),[tenant]);
      if(index) await c.query('COMMIT');
      if(n>=0) wall[index].push(performance.now()-start);
    } finally {c.release();}
  }
  report.autocommitVsTransactionWallMs=wall.map(t=>({median:percentile(t,0.5),p95:percentile(t,0.95)}));
  const prisma=schemas.map(schema=>new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL,max:1},{schema})}));
  const repositoryWall: number[][]=[[],[]];
  const id=createHash('md5').update('1product500').digest('hex');
  const productId=`${id.slice(0,8)}-${id.slice(8,12)}-${id.slice(12,16)}-${id.slice(16,20)}-${id.slice(20)}`;
  try {
    for(let n=-warmup;n<samples;n++) for(const index of n%2?[1,0]:[0,1]) {
      const start=performance.now();
      // Same production repository builder; baseline models its previous autocommit lifecycle.
      const row=index ? await prisma[index].$transaction(async tx=> {
        await tx.$queryRaw`SELECT pg_catalog.set_config('app.tenant_id', ${tenant}, true)`;
        return createTenantRepo(tx as unknown as Parameters<typeof createTenantRepo>[0],tenant).product.get(productId);
      }) : await createTenantRepo(prisma[index] as unknown as Parameters<typeof createTenantRepo>[0],tenant).product.get(productId);
      if(row?.id!==productId) throw new Error('Repository benchmark must return the same fixture in both schemas');
      if(n>=0) repositoryWall[index].push(performance.now()-start);
    }
    report.repositoryWallMs=repositoryWall.map(t=>({median:percentile(t,0.5),p95:percentile(t,0.95)}));
  } finally {await Promise.all(prisma.map(client=>client.$disconnect()));}
  report.passed=!failed;
  const output=process.env.RLS_BENCH_OUTPUT;
  if(output) writeFileSync(output,JSON.stringify(report,null,2)+"\n");
  console.log(JSON.stringify({passed:!failed,autocommitVsTransactionWallMs:report.autocommitVsTransactionWallMs,repositoryWallMs:report.repositoryWallMs}));
} finally {
  // Only identifiers created by this invocation, below the dedicated bench_ namespace.
  for(const schema of schemas) await owner.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await Promise.all([runtime.end(),owner.end()]);
}
if(failed) process.exitCode=1;
