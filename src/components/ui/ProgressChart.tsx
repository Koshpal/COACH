import React from "react";
import { progressChart } from "../../mock/data";

const W = 1000;
const H = 360;
const PAD_L = 44;
const PAD_R = 16;
const PAD_T = 24;
const PAD_B = 44;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;
const BAR_W = 9;
const BAR_GAP = 4;

export const ProgressChart: React.FC = () => {
  const { series, months, data, tooltip } = progressChart;
  const groupW = PLOT_W / months.length;
  const y = (v: number) => PAD_T + PLOT_H * (1 - v / 100);

  return (
    <section className="rounded-lg border border-neutral-100 bg-white p-6 shadow-low">
      <h3 className="mb-4 font-jakarta text-[18px] font-semibold text-neutral-900">Progress</h3>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Progress chart">
        {/* gridlines + y labels */}
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={y(v)}
              y2={y(v)}
              stroke="#F1F2F4"
              strokeWidth={1}
            />
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

        {/* bars */}
        {data.map((vals, gi) => {
          const gx = PAD_L + gi * groupW;
          const clusterW = series.length * BAR_W + (series.length - 1) * BAR_GAP;
          const startX = gx + (groupW - clusterW) / 2;
          return (
            <g key={gi}>
              {vals.map((v, si) => {
                const bx = startX + si * (BAR_W + BAR_GAP);
                const bh = Math.max(2, (PLOT_H * v) / 100);
                return (
                  <rect
                    key={si}
                    x={bx}
                    y={PAD_T + PLOT_H - bh}
                    width={BAR_W}
                    height={bh}
                    rx={4}
                    fill={series[si].color}
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
                {months[gi]}
              </text>
            </g>
          );
        })}

        {/* tooltip */}
        {(() => {
          const gx = PAD_L + tooltip.at * groupW + groupW / 2;
          const tw = 118;
          const th = 46;
          const tx = gx - tw / 2;
          const ty = PAD_T + 24;
          return (
            <g>
              <rect
                x={tx}
                y={ty}
                width={tw}
                height={th}
                rx={8}
                fill="#FFFFFF"
                stroke="#E4E4E4"
              />
              <text x={tx + 12} y={ty + 18} fontSize={11} fill="#919191" fontFamily="Outfit">
                Progress
              </text>
              <text x={tx + 12} y={ty + 36} fontSize={13} fill="#181818" fontFamily="Outfit" fontWeight={600}>
                {tooltip.progress}
              </text>
              <text x={tx + 66} y={ty + 18} fontSize={11} fill="#919191" fontFamily="Outfit">
                Goal
              </text>
              <text x={tx + 66} y={ty + 36} fontSize={13} fill="#181818" fontFamily="Outfit" fontWeight={600}>
                {tooltip.goal}
              </text>
            </g>
          );
        })()}
      </svg>

      <div className="mt-3 flex items-center justify-center gap-6">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-2 font-outfit text-[13px] text-neutral-600">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            {s.key}
          </span>
        ))}
      </div>
    </section>
  );
};
