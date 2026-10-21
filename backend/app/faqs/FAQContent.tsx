"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { FAQ_SECTIONS, parseFaqAnswer, type FaqInline, type FaqItem } from "@/lib/content/faq";

const linkClass = "text-primary hover:underline font-medium";

function Inline({ parts }: { parts: FaqInline[] }) {
  return (
    <>
      {parts.map((part, index) => {
        if (part.type === "text") return <Fragment key={index}>{part.text}</Fragment>;
        if (part.href.startsWith("/") || part.href.startsWith("#")) {
          return <Link key={index} href={part.href} className={linkClass}>{part.text}</Link>;
        }
        const external = /^https?:/i.test(part.href);
        return (
          <a key={index} href={part.href} className={linkClass} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {part.text}
          </a>
        );
      })}
    </>
  );
}

function Answer({ answer }: { answer: string }) {
  const blocks = parseFaqAnswer(answer);
  return (
    <>
      {blocks.map((block, index) => {
        const spacing = index < blocks.length - 1 ? "mb-3" : "";
        if (block.type === "paragraph") {
          return (
            <p key={index} className={spacing}>
              {block.lines.map((line, lineIndex) => (
                <Fragment key={lineIndex}>
                  {lineIndex > 0 && <br />}
                  <Inline parts={line} />
                </Fragment>
              ))}
            </p>
          );
        }
        const List = block.type === "ordered" ? "ol" : "ul";
        return (
          <List key={index} className={`${block.type === "ordered" ? "list-decimal" : "list-disc"} list-outside ml-5 space-y-1 ${spacing}`}>
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}><Inline parts={item} /></li>
            ))}
          </List>
        );
      })}
    </>
  );
}

function AccordionItem({ item, isOpen, onToggle }: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full text-left flex items-center justify-between gap-4 px-4 py-5 hover:bg-gray-50 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-bold text-gray-900 text-base leading-snug pr-2">{item.question}</span>
        <ChevronDown
          className={`shrink-0 h-5 w-5 text-primary transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="px-4 pb-6 pt-1">
          <div className="text-gray-600 leading-relaxed text-sm md:text-base">
            <Answer answer={item.answer} />
          </div>
        </div>
      )}
    </div>
  );
}

export function FAQContent({ items }: { items: FaqItem[] }) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-14">
      {FAQ_SECTIONS.map((cat) => ({ cat, items: items.filter((item) => item.section === cat.id) })).filter(({ items }) => items.length > 0).map(({ cat, items }) => (
        <section key={cat.id}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-primary shrink-0" />
            <h2 className="text-lg font-black uppercase tracking-tight text-gray-900">
              {cat.title}
            </h2>
          </div>
          <div className="border border-gray-200 rounded-none divide-y divide-gray-100">
            {items.map((item) => (
              <AccordionItem
                key={item.slug}
                item={item}
                isOpen={openItems.has(item.slug)}
                onToggle={() => toggle(item.slug)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
