import type { ReactNode } from "react";
import type { Locale } from "../site";
import { resolveLink, type Link } from "../fields/link";
import { pickLocale } from "../fields/localized";
import { CalculatorLink } from "./CalculatorLink";

export function SectionLink({ link, locale, className, children }: {
  link: Link;
  locale: Locale;
  className?: string;
  children?: ReactNode;
}) {
  const resolved = resolveLink(link);
  const content = children ?? pickLocale(link.label, locale);
  if (resolved.calculator) {
    return <CalculatorLink href={resolved.href} prefill={resolved.calculator} className={className}>{content}</CalculatorLink>;
  }
  return (
    <a href={resolved.href} className={className}
      target={resolved.external ? "_blank" : undefined} rel={resolved.external ? "noopener noreferrer" : undefined}>
      {content}
    </a>
  );
}
