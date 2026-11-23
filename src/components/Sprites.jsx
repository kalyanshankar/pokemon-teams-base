import { useEffect, useRef, useState } from 'react';
import { portraitUrl, spriteBase, itemIconStyle, speciesName, itemName } from '../lib/dex.js';

export function Portrait({ speciesId, size = 64, title }) {
  const url = portraitUrl(speciesId);
  const [failed, setFailed] = useState(false);
  const label = title || speciesName(speciesId);
  return (
    <span className="portrait" style={{ width: size, height: size }} title={label}>
      {url && !failed ? (
        <img src={url} alt={label} width={size} height={size} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <span className="portrait-fallback" aria-label={label}>{label.slice(0, 2)}</span>
      )}
    </span>
  );
}

export function ItemIcon({ item, showName = false }) {
  if (!item) return null;
  const style = itemIconStyle(item);
  return (
    <span className="item" title={itemName(item)}>
      {style ? <span className="item-icon" style={style} aria-hidden="true" /> : <span className="item-icon item-unknown" aria-hidden="true">?</span>}
      {showName && <span>{itemName(item)}</span>}
    </span>
  );
}

// ---- Animated PMD idle sprite (falls back to the portrait) ----
const animCache = new Map();

async function loadIdle(base) {
  if (animCache.has(base)) return animCache.get(base);
  const p = fetch(`${base}/AnimData.xml`)
    .then((r) => (r.ok ? r.text() : Promise.reject(new Error('no anim'))))
    .then((xml) => {
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      const anims = [...doc.querySelectorAll('Anim')];
      const find = (name) => anims.find((a) => a.querySelector('Name')?.textContent === name);
      let idle = find('Idle');
      const copy = idle?.querySelector('CopyOf')?.textContent;
      if (copy) idle = find(copy);
      if (!idle) throw new Error('no idle');
      const name = idle.querySelector('Name').textContent;
      return {
        img: `${base}/${name}-Anim.png`,
        w: Number(idle.querySelector('FrameWidth').textContent),
        h: Number(idle.querySelector('FrameHeight').textContent),
        durations: [...idle.querySelectorAll('Duration')].map((d) => Number(d.textContent)),
      };
    });
  animCache.set(base, p);
  p.catch(() => animCache.delete(base));
  return p;
}

export function AnimatedSprite({ speciesId, scale = 2 }) {
  const base = spriteBase(speciesId);
  const [anim, setAnim] = useState(null);
  const [failed, setFailed] = useState(!base);
  const [frame, setFrame] = useState(0);
  const timer = useRef();

  useEffect(() => {
    let alive = true;
    setAnim(null); setFrame(0); setFailed(!base);
    if (base) loadIdle(base).then((a) => alive && setAnim(a)).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [base]);

  useEffect(() => {
    if (!anim) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || anim.durations.length < 2) return;
    let i = 0;
    const tick = () => {
      i = (i + 1) % anim.durations.length;
      setFrame(i);
      timer.current = setTimeout(tick, (anim.durations[i] / 60) * 1000);
    };
    timer.current = setTimeout(tick, (anim.durations[0] / 60) * 1000);
    return () => clearTimeout(timer.current);
  }, [anim]);

  if (failed) return <Portrait speciesId={speciesId} size={80} />;
  if (!anim) return <span className="sprite-stage" style={{ width: 80, height: 80 }} />;
  return (
    <span className="sprite-stage" style={{ width: Math.max(80, anim.w * scale), height: Math.max(80, anim.h * scale) }}>
      <span
        role="img"
        aria-label={speciesName(speciesId)}
        className="sprite"
        style={{
          width: anim.w * scale,
          height: anim.h * scale,
          backgroundImage: `url(${anim.img})`,
          backgroundRepeat: 'no-repeat',
          // Sheet: one column per frame, row 0 faces the viewer. Scale the whole sheet so pixels stay crisp.
          backgroundSize: `${anim.durations.length * anim.w * scale}px auto`,
          backgroundPosition: `${-frame * anim.w * scale}px 0px`,
        }}
      />
    </span>
  );
}
