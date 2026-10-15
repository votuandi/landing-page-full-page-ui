import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import { Prisma } from "../../generated/client.ts";
import { createDb, createPlatformDb } from "../client.ts";
import { tenantTransaction } from "../tenantTransaction.ts";
import { forTenant } from "../repository.ts";
import { assertRefsBelongToTenant, CrossTenantRefError } from "../refs.ts";

describe("Postgres tenant composite FKs under app_runtime", { skip: !process.env.DATABASE_URL && "DATABASE_URL missing" }, () => {
  const db=createDb({pool:2}), ops=createPlatformDb({pool:2});
  const a=randomUUID(), b=randomUUID(), categoryB=randomUUID(), mediaB=randomUUID(), siteA=randomUUID(), siteB=randomUUID(), pageB=randomUUID(), planId=`fk-${randomUUID()}`;
  before(async()=> {
    await ops.plan.create({data:{id:planId,name:"Test",features:[],limits:{}}});
    for(const id of [a,b]) await ops.tenant.create({data:{id,name:"Test",slug:id,planId}});
    await ops.productCategory.create({data:{id:categoryB,tenantId:b,slug:"category",title:{}}});
    await ops.media.create({data:{id:mediaB,tenantId:b,key:`tenants/${b}/test`,driver:"local",mime:"image/png",size:1}});
    for(const [id,tenantId] of [[siteA,a],[siteB,b]]) await ops.site.create({data:{id,tenantId,name:"Test",themeId:"t15"}});
    await ops.page.create({data:{id:pageB,tenantId:b,siteId:siteB,slug:"",sections:[]}});
  });
  after(async()=> {try {await ops.tenant.deleteMany({where:{id:{in:[a,b]}}}); await ops.plan.deleteMany({where:{id:planId}});} finally {await Promise.all([db.$disconnect(),ops.$disconnect()]);}});
  const fkError=(e:unknown)=>e instanceof Prisma.PrismaClientKnownRequestError && e.code==="P2003";
  test("unchecked scalar FK cannot reference category/media/page B",async()=> {
    await assert.rejects(forTenant(db,a).product.create({slug:"scalar",title:{},categoryId:categoryB}),fkError);
    await assert.rejects(forTenant(db,a).project.create({slug:"media",title:{},coverMediaId:mediaB}),fkError);
    await assert.rejects(forTenant(db,a).sectionContent.create({siteId:siteA,pageId:pageB,sectionId:"foreign",type:"hero",schemaVersion:1,data:{}}),fkError);
    assert.equal(await ops.product.count({where:{slug:"scalar",tenantId:{in:[a,b]}}}),0);
  });
  for(const composite of [false,true]) test(`nested connects cannot move A into B (composite=${composite})`,async()=> {
    const connect=composite?{tenantId_id:{tenantId:b,id:categoryB}}:{id:categoryB};
    await assert.rejects(tenantTransaction(db,a,tx=>tx.product.create({data:{tenant:{connect:{id:a}},category:{connect},slug:"foreign",title:{}}})), e=>e instanceof CrossTenantRefError || e instanceof Prisma.PrismaClientValidationError || fkError(e));
    await assert.rejects(tenantTransaction(db,a,tx=>tx.tenant.update({where:{id:a},data:{products:{create:{slug:"nested",title:{},category:{connect}}}}})),CrossTenantRefError);
    assert.equal(await ops.product.count({where:{tenantId:{in:[a,b]},slug:{in:["foreign","nested"]}}}),0);
  });
  test("own category connect succeeds; transaction refs see own data and reject foreign JSON refs",async()=> {
    const repo=forTenant(db,a), category=await repo.productCategory.create({slug:"local",title:{}});
    const row=await tenantTransaction(db,a,tx=>tx.product.create({data:{tenant:{connect:{id:a}},slug:"local",title:{},category:{connect:{tenantId_id:{tenantId:a,id:category.id}}}}}));
    assert.equal(row.tenantId,a); assert.equal(row.categoryId,category.id);
    await tenantTransaction(db,b,tx=>assertRefsBelongToTenant(tx,b,{media:[mediaB,"/images/x.jpg"],collections:{productCategories:[categoryB]}}));
    const absent=randomUUID();
    await tenantTransaction(db,a,async tx=>assert.rejects(assertRefsBelongToTenant(tx,a,{media:[mediaB,absent,"bad","/images/x.jpg"],collections:{productCategories:[categoryB]}}),e=> {
      assert.ok(e instanceof CrossTenantRefError); assert.deepEqual(e.missing,[{kind:"media",ids:[mediaB,absent,"bad"]},{kind:"productCategories",ids:[categoryB]}]); return true;
    }));
  });
  test("product slug uniqueness is per tenant; hostname uniqueness is global",async()=> {
    for(const id of [a,b]) await forTenant(db,id).product.create({slug:"shared",title:{}});
    await assert.rejects(forTenant(db,a).product.create({slug:"shared",title:{}}),{code:"P2002"});
    assert.equal(await forTenant(db,a).product.count({where:{slug:"shared"}}),1);
    assert.equal(await forTenant(db,b).product.count({where:{slug:"shared"}}),1);
    const hostname=`${a}.localhost`;
    await forTenant(db,a).domain.create({siteId:siteA,hostname,verificationToken:"test"});
    await assert.rejects(forTenant(db,b).domain.create({siteId:siteB,hostname,verificationToken:"test"}),{code:"P2002"});
  });
});
