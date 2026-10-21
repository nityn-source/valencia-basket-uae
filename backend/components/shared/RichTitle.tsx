import { Fragment } from "react";

/**
 * Renders an editable heading where *starred* words are shown in the brand
 * orange, e.g. "First Steps. *Big Fun.*". A new line in the text becomes a line break.
 */
function Breaks({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, index) => (
        <Fragment key={index}>{index > 0 && <br />}{line}</Fragment>
      ))}
    </>
  );
}

export function RichTitle({ text, highlightClass = "text-primary" }: { text: string; highlightClass?: string }) {
  return (
    <>
      {text.split(/\*([^*]+)\*/g).map((part, index) =>
        index % 2 === 1 ? <span key={index} className={highlightClass}>{part}</span> : <Breaks key={index} text={part} />,
      )}
    </>
  );
}
