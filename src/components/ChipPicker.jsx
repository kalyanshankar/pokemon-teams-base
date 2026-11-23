import { useId, useMemo, useState } from 'react';

/**
 * Multi-select with type-ahead.
 * options: [{ value, n }]  (n = how many saved teams use it)
 * labelOf(value) -> display text, iconOf(value) -> optional JSX
 */
export default function ChipPicker({ label, hint, values, onChange, options, labelOf = (v) => v, iconOf, tone }) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const id = useId();

  const matches = useMemo(() => {
    const t = text.trim().toLowerCase();
    return options
      .filter((o) => !values.includes(o.value))
      .filter((o) => !t || labelOf(o.value).toLowerCase().includes(t))
      .slice(0, 8);
  }, [text, options, values, labelOf]);

  const add = (v) => { onChange([...values, v]); setText(''); setCursor(0); };
  const remove = (v) => onChange(values.filter((x) => x !== v));

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setCursor((c) => Math.min(c + 1, matches.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
    else if (e.key === 'Enter' && matches[cursor]) { e.preventDefault(); add(matches[cursor].value); }
    else if (e.key === 'Backspace' && !text && values.length) remove(values[values.length - 1]);
    else if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div className={`picker ${tone ? 'picker-' + tone : ''}`}>
      <label htmlFor={id}>{label}</label>
      {hint && <p className="hint">{hint}</p>}
      <div className="picker-box">
        {values.map((v) => (
          <button type="button" key={v} className="chip" onClick={() => remove(v)} title={`Remove ${labelOf(v)}`}>
            {iconOf?.(v)}<span>{labelOf(v)}</span><span aria-hidden="true">×</span>
          </button>
        ))}
        <input
          id={id}
          value={text}
          placeholder={values.length ? '' : 'Type to search'}
          onChange={(e) => { setText(e.target.value); setOpen(true); setCursor(0); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKey}
          autoComplete="off"
          role="combobox"
          aria-expanded={open && matches.length > 0}
          aria-controls={`${id}-list`}
        />
      </div>
      {open && matches.length > 0 && (
        <ul className="picker-list" id={`${id}-list`} role="listbox">
          {matches.map((o, i) => (
            <li key={o.value} role="option" aria-selected={i === cursor}>
              <button type="button" className={i === cursor ? 'is-cursor' : ''} onMouseDown={(e) => { e.preventDefault(); add(o.value); }}>
                {iconOf?.(o.value)}<span>{labelOf(o.value)}</span>{o.n != null && <small>{o.n}</small>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
