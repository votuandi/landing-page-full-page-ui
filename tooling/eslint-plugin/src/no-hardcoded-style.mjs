import { findHardcoded, hasExemption, isAllowlisted, messageFor } from "./matchers.mjs";

export default {
  meta: { type: "problem", schema: [], messages: { hardcoded: "{{message}}" } },
  create(context) {
    if (isAllowlisted(context.filename)) return {};
    const source = context.sourceCode;
    const comments = source.getAllComments();
    function check(node, value) {
      const parent = node.parent;
      if (parent?.type === "ImportExpression" || parent?.type === "ImportDeclaration" || (parent?.type.startsWith("Export") && parent.source === node)) return;
      if (parent?.type === "ExpressionStatement" && parent.directive) return;
      let attribute = parent;
      while (attribute && ["JSXExpressionContainer", "TemplateLiteral"].includes(attribute.type)) attribute = attribute.parent;
      if (attribute?.type === "JSXAttribute" && ["href", "id"].includes(attribute.name.name)) return;
      if (comments.some((comment) => hasExemption(comment.value) &&
        (comment.loc.start.line === node.loc.start.line || comment.loc.end.line === node.loc.start.line || comment.loc.end.line === node.loc.start.line - 1))) return;
      for (const match of findHardcoded(value)) {
        context.report({ node, messageId: "hardcoded", data: { message: messageFor(match) } });
      }
    }
    return {
      Literal(node) { if (typeof node.value === "string") check(node, node.value); },
      TemplateElement(node) { check(node, node.value.cooked ?? node.value.raw); },
    };
  },
};
