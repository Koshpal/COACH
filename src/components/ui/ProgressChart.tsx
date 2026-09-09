import React, { useMemo } from "react";
import { format } from "date-fns";
import type { ApiSession } from "../../services/adapters";

const W = 1000;
const H = 340;
const PAD_L = 40;
const PAD_R = 16;
const PAD_T = 24;
const PAD_B = 44;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;
const BAR_W = 12;
const BAR_GAP = 4;
const MONTHS_BACK = 9;

const SERIES = [
  { key: "Completed", color: "#4CAF50", match: (s: ApiSession) => s.status === "COMPLETED" },
  { key: "Upcoming", color: "#334EAC", match: (s: ApiSession) => s.status === "CONFIRMED" },
  { key: "Cancelled", color: "#F44336", match: (s: ApiSession) => s.status === "CANCELLED" },
];

/** Real per-month session activity for one client. */
export const ProgressChart: React.FC<{ sessions?: ApiSession[] }> = ({
  sessions = [],
}) => {
  const { buckets, maxV } = useMemo(() => {
    const now = new Date();
    const keys: { key: string; label: string }[] = [];
    for (let i = MONTHS_BACK - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: format(d, "MMM") });
    }
    const map = new Map(
      keys.map((k) => [k.key, [0, 0, 0] as [number, number, number]]),
    );
    for (const s of sessions) {
      const d = new Date(s.startTime);
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      const row = map.get(k);
      if (!row) continue;
      SERIES.forEach((ser, i) => {
        if (ser.match(s)) row[i] += 1;
      });
    }
    const b = keys.map((k) => ({ label: k.label, vals: map.get(k.key)! }));
    const maxV = Math.max(3, ...b.map((x) => Math.max(...x.vals)));
    return { buckets: b, maxV };
  }, [sessions]);

  const groupW = PLOT_W / buckets.length;
  const ticks = Array.from({ length: 4 }, (_, i) => Math.round((maxV / 3) * i));
  const y = (v: number) => PAD_T + PLOT_H * (1 - v / maxV);

  return (
    <section className="rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-6 shadow-[var(--shadow-drop-low)]">
      <h3 className="mb-4 font-jakarta text-[18px] font-semibold text-[var(--color-text-primary)]">
        Session activity
      </h3>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Session activity chart">
        {ticks.map((v) => (
          <g key={v}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y(v)} y2={y(v)} stroke="#F1F2F4" strokeWidth={1} />
            <text
              x={PAD_L - 10}
              y={y(v) + 4}
              textAnchor="end"
              fontSize={12}
              fill="#919191"
              fontFamily="Outfit, sans-serif"
            >
              {v}
            </text>
          </g>
        ))}

        {buckets.map((b, gi) => {
          const gx = PAD_L + gi * groupW;
          const clusterW = SERIES.length * BAR_W + (SERIES.length - 1) * BAR_GAP;
          const startX = gx + (groupW - clusterW) / 2;
          return (
            <g key={gi}>
              <title>
                {b.label}: {b.vals[0]} completed · {b.vals[1]} upcoming · {b.vals[2]} cancelled
              </title>
              {b.vals.map((v, si) => {
                const bx = startX + si * (BAR_W + BAR_GAP);
                const bh = v > 0 ? Math.max(3, (PLOT_H * v) / maxV) : 0;
                return (
                  <rect
                    key={si}
                    x={bx}
                    y={PAD_T + PLOT_H - bh}
                    width={BAR_W}
                    height={bh}
                    rx={3}
                    fill={SERIES[si].color}
                  />
                );
              })}
              <text
                x={gx + groupW / 2}
                y={H - PAD_B + 20}
                textAnchor="middle"
                fontSize={12}
                fill="#919191"
                fontFamily="Outfit, sans-serif"
              >
                {b.label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-3 flex items-center justify-center gap-6">
        {SERIES.map((s) => (
          <span
            key={s.key}
            className="flex items-center gap-2 font-outfit text-[13px] text-[var(--color-text-secondary)]"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            {s.key}
          </span>
        ))}
      </div>
    </section>
  );
};
