import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "node:test";
import ts from "typescript";
import { PERMISSIONS } from "@solar/auth";

const publicActions = new Set(["loginAction", "loginTotpAction", "forgotPasswordAction", "requestMagicAction", "resetPasswordAction", "acceptInviteAction", "magicLoginAction", "magicTotpAction"]);
function exportsOf(source: string, wrapper: "action" | "route") {
  const file = ts.createSourceFile("check.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const exports: { name: string; permission: string }[] = [];
  function visit(node: ts.Node) {
    // Inline Server Actions cannot escape the module export audit.
    if (ts.isFunctionLike(node) && node.getText(file).includes('"use server"')) throw new Error("Inline action must move to an audited use server module");
    ts.forEachChild(node, visit);
  }
  visit(file);
  for (const node of file.statements) {
    if (!ts.canHaveModifiers(node) || !ts.getModifiers(node)?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
      assert.equal(ts.isExportDeclaration(node) || ts.isExportAssignment(node), false, "Re-exports/default exports are unaudited");
      continue;
    }
    assert.ok(ts.isVariableStatement(node), "Every export must be a wrapped action/route");
    for (const declaration of node.declarationList.declarations) {
      assert.ok(ts.isIdentifier(declaration.name));
      const call = declaration.initializer;
      assert.ok(call && ts.isCallExpression(call) && ts.isIdentifier(call.expression) && call.expression.text === wrapper, "Missing permission wrapper");
      assert.ok(ts.isStringLiteral(call.arguments[0]), "Permission must be explicit");
      const name = declaration.name.text, permission = call.arguments[0].text;
      assert.ok(PERMISSIONS.includes(permission as typeof PERMISSIONS[number]) || wrapper === "action" && permission === "public" && publicActions.has(name) || wrapper === "action" && permission === "session" && name === "logoutAction", "Permission is unknown or public/session exemption is not allowlisted");
      exports.push({ name, permission });
    }
  }
  return exports;
}
function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? entry.name === "__tests__" ? [] : files(resolve(directory, entry.name)) : /\.tsx?$/.test(entry.name) ? [resolve(directory, entry.name)] : []);
}
test("every server export and route method has real permission metadata", async () => {
  let count = 0;
  for (const file of files(resolve("src"))) {
    const source = readFileSync(file, "utf8");
    const isRoute = /[/\\]route\.ts$/.test(file);
    const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const serverModule = parsed.statements.some(node => ts.isExpressionStatement(node) && ts.isStringLiteral(node.expression) && node.expression.text === "use server");
    if (!isRoute && !serverModule) {
      // Catch both quote styles for inline actions, even outside use-server files.
      assert.doesNotMatch(source, /["']use server["']/);
      continue;
    }
    const expected = exportsOf(source, isRoute ? "route" : "action");
    const actual = await import(pathToFileURL(file).href);
    assert.deepEqual(Object.keys(actual).filter(key => key !== "default").sort(), expected.map(e => e.name).sort());
    for (const entry of expected) {
      assert.equal(typeof actual[entry.name], "function");
      assert.equal(actual[entry.name].permission, entry.permission, `${file}:${entry.name}`);
      count++;
    }
  }
  assert.ok(count >= 14, "Audit must discover the app's real actions and route");
});
test("audit fails for bare exports, re-exports, unknown permissions and public privilege escalation", () => {
  for (const source of [
    '"use server"; export async function unsafe() {}',
    '"use server"; export const unsafe = async () => {};',
    '"use server"; export { unsafe } from "./other";',
    '"use server"; export default async function unsafe() {}',
    '"use server"; export const unsafe = action("public", schema, handler);',
    '"use server"; export const unsafe = action("session", schema, handler);',
    '"use server"; export const unsafe = action("users.superadmin", schema, handler);',
  ]) assert.throws(() => exportsOf(source, "action"), source);
  assert.throws(() => exportsOf('export const GET = async () => Response.json({});', "route"));
});
