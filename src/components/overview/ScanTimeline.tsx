import { useRef, useState, useEffect } from "react";
import { Card } from "../common/Card";
import type { SealedReport } from "../../types";
import { hhmm } from "../../lib/helpers";

interface Props { reports: SealedReport[]; }

/** Full-width area chart showing posture score and open findings across all
 *  sealed reports. Hover scrubs the timeline and shows a tooltip. */
export function ScanTimeline({ reports }: Props) {
  const wrapRef  = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(800);
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((e) => setW(Math.max(200, e[0]?.contentRect.width ?? 800)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pts = [...reports].reverse(); // oldest first for the chart
  if (pts.length < 2) return null;

  const H   = 110;
  const PAD = { l: 32, r: 16, t: 14, b: 24 };
  const CW  = W - PAD.l - PAD.r;
  const CH  = H - PAD.t - PAD.b;

  const scores  = pts.map((r) => r.score_pct);
  const lo      = Math.max(0, Math.min(...scores) - 5);
  const hi      = Math.min(100, Math.max(...scores) + 5);

  const sx = (i: number) => PAD.l + (i / (pts.length - 1)) * CW;
  const sy = (v: number) => PAD.t + CH - ((v - lo) / (hi - lo)) * CH;

  const linePath = pts.map((r, i) => `${i ? "L" : "M"}${sx(i).toFixed(1)} ${sy(r.score_pct).toFixed(1)}`).join(" ");
  const areaPath = linePath + ` L${sx(pts.length - 1).toFixed(1)} ${(PAD.t + CH).toFixed(1)} L${PAD.l} ${(PAD.t + CH).toFixed(1)}Z`;

  // Annotation dots: big jumps
  const annotations = pts.filter((r, i) => {
    if (i === 0) return false;
    return Math.abs(r.score_pct - pts[i - 1].score_pct) >= 2.5;
  });

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - rect.left - PAD.l;
    const idx   = Math.min(pts.length - 1, Math.max(0, Math.round((relX / CW) * (pts.length - 1))));
    setHover({ i: idx, x: sx(idx), y: sy(pts[idx].score_pct) });
  };

  const hd = hover ? pts[hover.i] : null;

  return (
    <Card style={{ padding: "20px 24px 14px" }} animateDelay={0.3}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h3 style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Scan history — {pts.length} daily reports
        </h3>
        {hd && (
          <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "'Geist Mono', monospace" }}>
            #{hd.sequence} · {hhmm(hd.generated_at)} · {hd.score_pct}% · {hd.open_findings} open
          </span>
        )}
      </div>

      <div ref={wrapRef} style={{ width: "100%", height: H }}>
        <svg width={W} height={H} onMouseMove={handleMouseMove} onMouseLeave={() => setHover(null)}
          style={{ display: "block", cursor: "crosshair" }}>
          <defs>
            <linearGradient id="tl-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0"   stopColor="var(--accent)" stopOpacity="0.28" />
              <stop offset="1"   stopColor="var(--accent)" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="tl-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0"   stopColor="var(--accent)" stopOpacity="0.6" />
              <stop offset="1"   stopColor="var(--accent-2)" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Y grid */}
          {[lo, (lo + hi) / 2, hi].map((v) => (
            <g key={v}>
              <line x1={PAD.l} x2={W - PAD.r} y1={sy(v)} y2={sy(v)} stroke="var(--glass-border)" strokeDasharray="2 4" />
              <text x={PAD.l - 4} y={sy(v) + 4} textAnchor="end" fontSize="10" fill="var(--faint)">{Math.round(v)}%</text>
            </g>
          ))}

          {/* Area fill */}
          <path d={areaPath} fill="url(#tl-area)" />

          {/* Line */}
          <path d={linePath} fill="none" stroke="url(#tl-line)" strokeWidth="2"
            style={{ filter: "drop-shadow(0 0 6px var(--glow))" }} />

          {/* Delta annotations */}
          {annotations.map((r, i) => {
            const idx = pts.indexOf(r);
            const delta = r.score_pct - pts[idx - 1].score_pct;
            return (
              <g key={i}>
                <circle cx={sx(idx)} cy={sy(r.score_pct)} r="4" fill={delta > 0 ? "var(--ok)" : "var(--crit)"}
                  style={{ filter: `drop-shadow(0 0 5px ${delta > 0 ? "var(--ok)" : "var(--crit)"})` }} />
                <text x={sx(idx)} y={sy(r.score_pct) - 8} textAnchor="middle" fontSize="10"
                  fill={delta > 0 ? "var(--ok)" : "var(--crit)"}>
                  {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* X axis labels */}
          {pts.filter((_, i) => i === 0 || i === pts.length - 1 || (pts.length > 6 && i % Math.floor(pts.length / 4) === 0)).map((r) => {
            const idx = pts.indexOf(r);
            return (
              <text key={idx} x={sx(idx)} y={H - 4} textAnchor="middle" fontSize="10" fill="var(--faint)">
                #{r.sequence}
              </text>
            );
          })}

          {/* Hover scrubber */}
          {hover && (
            <g>
              <line x1={hover.x} x2={hover.x} y1={PAD.t} y2={PAD.t + CH}
                stroke="var(--accent-2)" strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />
              <circle cx={hover.x} cy={hover.y} r="5" fill="var(--accent-2)"
                style={{ filter: "drop-shadow(0 0 8px var(--glow))" }} />
            </g>
          )}
        </svg>
      </div>
    </Card>
  );
}

