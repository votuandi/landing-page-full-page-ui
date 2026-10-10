import { Fragment, type ReactNode } from "react";
import type { RichTextInline, RichTextText, RichTextValue } from "../fields/richText";
import type { Locale } from "../site";
import { SectionLink } from "./SectionLink";

function renderText(node: RichTextText): ReactNode {
  if (node.type !== "text") return null;
  let content: ReactNode = node.text;
  if (node.bold) content = <strong>{content}</strong>;
  if (node.italic) content = <em>{content}</em>;
  return content;
}

function renderInline(nodes: RichTextInline[], locale: Locale): ReactNode {
  return nodes.map((node, index) => {
    switch (node.type) {
      case "text": return <Fragment key={index}>{renderText(node)}</Fragment>;
      case "link": return (
        <SectionLink key={index} link={node.link} locale={locale}>
          {node.children.map((child, childIndex) => <Fragment key={childIndex}>{renderText(child)}</Fragment>)}
        </SectionLink>
      );
      default: return null;
    }
  });
}

export function RichText({ value, locale }: { value: RichTextValue; locale: Locale }) {
  const blocks = locale === "en" && value.en?.length ? value.en : value.vi;
  return <>{blocks.map((node, index) => {
    switch (node.type) {
      case "paragraph": return <p key={index}>{renderInline(node.children, locale)}</p>;
      case "heading": {
        const content = renderInline(node.children, locale);
        switch (node.level) {
          case 2: return <h2 key={index} className="font-heading">{content}</h2>;
          case 3: return <h3 key={index} className="font-heading">{content}</h3>;
          case 4: return <h4 key={index} className="font-heading">{content}</h4>;
          default: return null;
        }
      }
      case "list": {
        const items = node.items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item, locale)}</li>);
        return node.ordered ? <ol key={index} className="list-decimal pl-6">{items}</ol> : <ul key={index} className="list-disc pl-6">{items}</ul>;
      }
      default: return null;
    }
  })}</>;
}
