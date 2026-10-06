"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export type Option = { id: number; name: string; nameBn?: string | null; hint?: string | null };

type Props = {
  label: string;
  options: Option[];
  value: Option | null;
  onChange: (option: Option | null) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  requiredMessage: string;
};

const labelOf = (o: Option) => (o.nameBn ? `${o.name} (${o.nameBn})` : o.name);

export function SearchableSelect({
  label, options, value, onChange, placeholder = "Type to search…",
  disabled, loading, error, requiredMessage,
}: Props) {
  const uid = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  // The browser refuses to submit the form until an option is picked
  useEffect(() => {
    inputRef.current?.setCustomValidity(value ? "" : requiredMessage);
  }, [value, requiredMessage]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.name.toLowerCase().includes(q) || (o.nameBn ?? "").includes(q));
  }, [options, query]);

  const choose = (o: Option) => {
    onChange(o);
    setOpen(false);
    setQuery("");
  };

  const move = (next: number) => {
    if (!filtered.length) return;
    const i = (next + filtered.length) % filtered.length;
    setActive(i);
    document.getElementById(`${uid}-opt-${i}`)?.scrollIntoView({ block: "nearest" });
  };

  return (
    <div className="relative">
      <label htmlFor={`${uid}-input`} className="font-bn mb-1 block text-sm font-medium text-stone-800">
        {label} <span className="text-red-600">*</span>
      </label>
      <input
        ref={inputRef}
        id={`${uid}-input`}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-expanded={open}
        aria-controls={`${uid}-list`}
        aria-autocomplete="list"
        aria-activedescendant={open && filtered[active] ? `${uid}-opt-${active}` : undefined}
        aria-invalid={!!error}
        disabled={disabled}
        placeholder={loading ? "Loading…" : placeholder}
        value={open ? query : value ? labelOf(value) : ""}
        onFocus={() => { setOpen(true); setQuery(""); setActive(0); }}
        onBlur={() => { setOpen(false); setQuery(""); }}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
          if (value) onChange(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); if (open) move(active + 1); else setOpen(true); }
          else if (e.key === "ArrowUp") { e.preventDefault(); move(active - 1); }
          else if (e.key === "Enter" && open) { e.preventDefault(); if (filtered[active]) choose(filtered[active]); }
          else if (e.key === "Escape") { setOpen(false); setQuery(""); }
        }}
        className={`font-bn w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#12392f] focus:ring-2 focus:ring-[#12392f]/15 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400 ${
          error ? "border-red-500" : "border-stone-300"
        }`}
      />

      {open && !disabled && (
        <ul id={`${uid}-list`} role="listbox" className="font-bn absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
          {loading && <li className="px-3 py-2 text-sm text-stone-500">Loading…</li>}
          {!loading && filtered.length === 0 && <li className="px-3 py-2 text-sm text-stone-500">No match found</li>}
          {!loading && filtered.map((o, i) => (
            <li
              key={o.id}
              id={`${uid}-opt-${i}`}
              role="option"
              aria-selected={o.id === value?.id}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(o)}
              className={`flex cursor-pointer items-center justify-between px-3 py-2.5 text-sm ${
                i === active ? "bg-[#12392f] text-white" : "text-stone-800"
              }`}
            >
              <span>{labelOf(o)}</span>
              {o.hint && <span className="text-xs opacity-70">{o.hint}</span>}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
