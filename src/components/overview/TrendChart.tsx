import { useEffect, useRef, useState } from "react";
import type { SealedReport } from "../../types";

/** A small area+line sparkline showing posture score across the report history. */
export function TrendChart({ reports }: { reports: SealedReport[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 280, h: 44 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 280;
      setSize({ w: Math.max(40, w), h: 44 });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pts = [...reports].reverse().map((r) => r.score_pct);
  if (pts.length < 2) {
    return (
      <div ref={wrapRef} className="spark" aria-label="Score over the last reports">
        <svg />
      </div>
    );
  }

  const { w: W, h: H } = size;
  const lo = Math.min(...pts) - 3;
  const hi = Math.max(...pts) + 3;
  const xy = pts.map((v, i) => [((i / (pts.length - 1)) * (W - 8)) + 4, H - 4 - ((v - lo) / (hi - lo)) * (H - 8)] as const);
  const line = xy.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const last = xy[xy.length - 1];

  return (
    <div ref={wrapRef} className="spark" aria-label={`Score over the last ${pts.length} reports`}>
      <svg viewBox={`0 0 ${W} ${H + 14}`} preserveAspectRatio="none" style={{ height: H + 14 }}>
        <defs>
          <linearGradient id="sf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8b7bff" stopOpacity="0.35" />
            <stop offset="1" stopColor="#8b7bff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${line} L${last[0]} ${H} L4 ${H}Z`} fill="url(#sf)" />
        <path d={line} fill="none" stroke="#b7abff" strokeWidth="1.6" />
        <circle cx={last[0]} cy={last[1]} r="3.5" fill="#fff" />
        <text x="4" y={H + 12} fontSize="11" fill="var(--faint)">
          last {pts.length} reports
        </text>
      </svg>
    </div>
  );
}
