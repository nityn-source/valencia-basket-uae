"use client";

import { useId, useState } from "react";

interface Option {
  id: string;
  label: string;
  url: string;
}

interface Props {
  options: Option[];
  label: string;
  placeholder: string;
  button: string;
  error: string;
}

/** One required dropdown, then straight to Classcard in the same tab (no data is collected here). */
export function CampRegisterForm({ options, label, placeholder, button, error }: Props) {
  const [value, setValue] = useState("");
  const [showError, setShowError] = useState(false);
  const selectId = useId();
  const errorId = `${selectId}-error`;

  function go() {
    const option = options.find((o) => o.id === value);
    if (!option) {
      setShowError(true);
      return;
    }
    window.location.assign(option.url);
  }

  return (
    <div>
      <label htmlFor={selectId} className="mb-2 block text-xs font-extrabold uppercase tracking-widest">
        {label}
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setShowError(false);
        }}
        aria-required="true"
        aria-invalid={showError}
        aria-describedby={showError ? errorId : undefined}
        data-testid="select-camp-programme"
        className={`w-full border-2 bg-white p-4 text-base font-bold text-black ${showError ? "border-red-400" : "border-white"}`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <p id={errorId} role="alert" className="mb-3 mt-2 min-h-[20px] text-sm font-bold text-red-300">
        {showError ? error : ""}
      </p>
      <button
        type="button"
        onClick={go}
        data-testid="button-camp-continue"
        className="w-full bg-primary px-7 py-4 text-sm font-extrabold uppercase tracking-widest text-white transition-colors hover:bg-orange-600"
      >
        {button}
      </button>
    </div>
  );
}
