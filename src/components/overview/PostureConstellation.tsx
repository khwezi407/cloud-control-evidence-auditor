import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RULES, RULE_IDS } from "../../data/rules";
import { SEVERITY_COLORS } from "../../lib/helpers";
import { prefersReducedMotion } from "../../lib/helpers";
import { useStore } from "../../store/useStore";
import type { Finding, Severity } from "../../types";

const C = 160; // center
const R = 58; // score ring radius
const RN = 128; // node orbit radius

interface Props {
  score: number;
  open: Finding[];
}

/** The signature visualization: a posture score ring with the seven controls
 * arranged around it like a constellation. Lit spokes have open findings;
 * click a node to see them. */
export function PostureConstellation({ score, open }: Props) {
  const navigate = useNavigate();
  const setQuery = useStore((s) => s.setQuery);
  const arcRef = useRef<SVGCircleElement>(null);
  const numRef = useRef<SVGTextElement>(null);
  const [animatedScore, setAnimatedScore] = useState(prefersReducedMotion ? score : 0);

  // Animate the arc and count-up once on mount / when score changes.
  useEffect(() => {
    if (prefersReducedMotion) {
      setAnimatedScore(score);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 1000);
      const e = 1 - (1 - k) ** 3;
      setAnimatedScore(score * e);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  // Animate the arc stroke-dasharray to the final value.
  useEffect(() => {
    if (!arcRef.current) return;
    const c = 2 * Math.PI * R;
    if (prefersReducedMotion) {
      arcRef.current.setAttribute("stroke-dasharray", `${(c * score) / 100} ${c}`);
      return;
    }
    arcRef.current.setAttribute("stroke-dasharray", `0 ${c}`);
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (arcRef.current) arcRef.current.setAttribute("stroke-dasharray", `${(c * score) / 100} ${c}`);
      }),
    );
    return () => cancelAnimationFrame(id);
  }, [score]);

  const c = 2 * Math.PI * R;
  const ids = RULE_IDS;
  const worst = (id: string) =>
    open
      .filter((f) => f.rule_id === id)
      .sort((a, b) => sevRank(a.severity) - sevRank(b.severity))[0];

  function sevRank(s: Severity) {
    return { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }[s];
  }

  function go(ruleId: string) {
    setQuery(ruleId.toLowerCase());
    navigate("/findings");
  }

  return (
    <div className="constel" role="img" aria-label={`Posture score ${score.toFixed(1)} percent with the seven controls around it`}>
      <svg viewBox="0 0 320 320">
        <defs>
          <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#d9d2ff" />
            <stop offset="1" stopColor="#7563f2" />
          </linearGradient>
          <radialGradient id="core">
            <stop offset="0" stopColor="#8b7bff" stopOpacity="0.28" />
            <stop offset="1" stopColor="#8b7bff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx={C} cy={C} r="150" fill="url(#core)" />
        <circle cx={C} cy={C} r={RN} fill="none" stroke="rgb(255 255 255 / 0.06)" strokeDasharray="1 6" />
        <circle cx={C} cy={C} r={R} fill="none" stroke="rgb(255 255 255 / 0.07)" strokeWidth="9" />
        <circle
          ref={arcRef}
          cx={C}
          cy={C}
          r={R}
          fill="none"
          stroke="url(#rg)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${(c * score) / 100} ${c}`}
          transform={`rotate(-90 ${C} ${C})`}
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.2,.8,.2,1)", filter: "drop-shadow(0 0 10px rgb(139 123 255 / .6))" }}
        />
        <text
          ref={numRef}
          x={C}
          y={C + 12}
          textAnchor="middle"
          fontFamily="'Instrument Serif', Georgia, serif"
          fontSize="46"
          fill="var(--ink)"
        >
          {animatedScore.toFixed(1)}
        </text>
        <text x={C} y={C + 32} textAnchor="middle" fontSize="11" fill="var(--muted)">
          posture score
        </text>

        {ids.map((id, i) => {
          const a = (-Math.PI / 2) + (i * 2 * Math.PI) / ids.length;
          const x = C + RN * Math.cos(a);
          const y = C + RN * Math.sin(a);
          const sx = C + (R + 12) * Math.cos(a);
          const sy = C + (R + 12) * Math.sin(a);
          const ex = C + (RN - 20) * Math.cos(a);
          const ey = C + (RN - 20) * Math.sin(a);
          const w = worst(id);
          const n = open.filter((f) => f.rule_id === id).length;
          const col = w ? SEVERITY_COLORS[w.severity] : "rgb(61 220 151 / .9)";
          const bx = x + 13;
          const by = y - 13;
          return (
            <g
              key={id}
              className="node"
              tabIndex={0}
              role="button"
              aria-label={`${RULES[id].name}: ${n ? n + " open" : "passing"}`}
              onClick={() => go(id)}
              onKeyDown={(e) => e.key === "Enter" && go(id)}
            >
              <title>
                {id} {RULES[id].name}: {n ? `${n} open finding${n > 1 ? "s" : ""}` : "passing"}
              </title>
              <line
                x1={sx}
                y1={sy}
                x2={ex}
                y2={ey}
                stroke={w ? col : "rgb(255 255 255 / .12)"}
                strokeWidth={w ? 2 : 1}
                style={w ? { filter: `drop-shadow(0 0 6px ${col})` } : { strokeDasharray: "2 4" }}
              />
              <circle cx={x} cy={y} r="20" fill={w ? col : "transparent"} opacity="0.12" />
              <circle className="body" cx={x} cy={y} r="17" fill="#0e0d16" stroke={col} strokeWidth="1.5" />
              <text x={x} y={y + 4} textAnchor="middle" fontFamily="'Geist Mono', monospace" fontSize="10.5" fill={w ? "#fff" : "var(--muted)"}>
                {id}
              </text>
              {n ? (
                <>
                  <circle cx={bx} cy={by} r="8" fill={col} />
                  <text x={bx} y={by + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#0b0a12">
                    {n}
                  </text>
                </>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
