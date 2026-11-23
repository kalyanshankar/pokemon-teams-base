import { useEffect, useRef } from 'react';

export default function Modal({ title, onClose, children, wide }) {
  const ref = useRef();
  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`window modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
