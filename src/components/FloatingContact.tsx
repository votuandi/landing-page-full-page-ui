"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  PhoneIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { CONVERSION_COPY as c, SITE_CONFIG } from "@/content/site";
import { useSegment } from "./template10/SegmentContext";
import Modal from "./template10/Modal";
import LeadForm from "./LeadForm";

export default function FloatingContact() {
  const [expanded, setExpanded] = useState(false);
  const [view, setView] = useState<"chat" | "form" | "messenger" | null>(null);
  const [topic, setTopic] = useState<number | null>(null);
  const { segment, select } = useSegment();
  const pathname = usePathname();
  useEffect(() => {
    setExpanded(window.matchMedia("(min-width: 768px)").matches);
  }, []);
  useEffect(() => {
    setView(null);
    setTopic(null);
  }, [pathname]);
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, []);
  // Chỉ mở trang Messenger thật khi đã cấu hình đường dẫn m.me.
  const messenger = /^https:\/\/m\.me\/[a-zA-Z0-9_.-]+\/?$/.test(
    SITE_CONFIG.contact.messenger,
  )
    ? SITE_CONFIG.contact.messenger
    : null;
  const open = (next: "chat" | "form" | "messenger") => {
    setTopic(null);
    setView(next);
  };
  const channelLinks = (
    <div className="mt-6 flex flex-wrap gap-3">
      <a
        className="t5-button t5-button-primary"
        href={SITE_CONFIG.contact.zalo}
        target="_blank"
        rel="noopener noreferrer"
      >
        {c.zalo}
      </a>
      <a
        className="t5-button t5-button-secondary"
        href={`tel:${SITE_CONFIG.contact.phoneRaw}`}
      >
        {c.call} · {SITE_CONFIG.contact.phone}
      </a>
    </div>
  );
  return (
    <>
      <aside className="floating-contact" aria-label={c.label}>
        <nav
          id="quick-contact-actions"
          className="floating-actions"
          hidden={!expanded}
          aria-label={c.label}
        >
          <button className="floating-action" onClick={() => open("chat")}>
            <ChatBubbleLeftRightIcon aria-hidden="true" />
            {c.chat}
          </button>
          <button
            className="floating-action is-green"
            onClick={() => open("form")}
          >
            <DocumentTextIcon aria-hidden="true" />
            {c.form}
          </button>
          <a
            className="floating-action"
            href={`tel:${SITE_CONFIG.contact.phoneRaw}`}
          >
            <PhoneIcon aria-hidden="true" />
            {c.call}
          </a>
          <a
            className="floating-action is-green"
            href={SITE_CONFIG.contact.zalo}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ChatBubbleOvalLeftEllipsisIcon aria-hidden="true" />
            {c.zalo}
          </a>
          {messenger ? (
            <a
              className="floating-action"
              href={messenger}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ChatBubbleLeftRightIcon aria-hidden="true" />
              {c.messenger}
            </a>
          ) : (
            <button
              className="floating-action"
              onClick={() => open("messenger")}
            >
              <ChatBubbleLeftRightIcon aria-hidden="true" />
              {c.messenger}
            </button>
          )}
        </nav>
        <button
          className="floating-toggle"
          aria-controls="quick-contact-actions"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <XMarkIcon aria-hidden="true" />
          ) : (
            <ChatBubbleLeftRightIcon aria-hidden="true" />
          )}
          {expanded ? c.collapse : c.toggle}
        </button>
      </aside>
      <Modal
        open={view !== null}
        onClose={() => setView(null)}
        title={
          view === "form"
            ? c.formTitle
            : view === "messenger"
              ? c.messengerTitle
              : c.chatTitle
        }
      >
        {view === "form" && <LeadForm defaultSegment={segment} />}
        {view === "chat" && (
          <>
            <p className="text-sm leading-7 text-slate-600">{c.chatIntro}</p>
            <div
              className="mt-5 grid gap-3"
              role="group"
              aria-label={c.questionLabel}
            >
              {c.questions.map((q, i) => (
                <button
                  key={q.question}
                  className={`chat-question ${topic === i ? "is-selected" : ""}`}
                  aria-pressed={topic === i}
                  onClick={() => setTopic(i)}
                >
                  {q.question}
                  <span aria-hidden="true">↗</span>
                </button>
              ))}
            </div>
            <div aria-live="polite" aria-atomic="true">
              {topic !== null && (
                <div className="mt-5 rounded-2xl bg-emerald-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                    {c.answerLabel}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-700">
                    {c.questions[topic].answer}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className="t5-button t5-button-primary"
                onClick={() => open("form")}
              >
                {c.form}
              </button>
              <Link
                className="t5-button t5-button-secondary"
                href={`/?${segment ? `segment=${segment}` : ""}#may-tinh`}
                onClick={() => {
                  select(segment);
                  setView(null);
                }}
              >
                {c.calculator}
              </Link>
            </div>
            {channelLinks}
          </>
        )}
        {view === "messenger" && (
          <>
            <p className="text-sm leading-7 text-slate-600">
              {c.messengerUnavailable}
            </p>
            {channelLinks}
          </>
        )}
      </Modal>
    </>
  );
}
