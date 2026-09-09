import React from "react";
import { Star } from "lucide-react";
import { cn } from "../../lib/cn";
import { Avatar } from "./Avatar";
import { clientProfile } from "../../mock/data";

const KEYLINE: Record<string, string> = {
  amber: "border-l-warning-400",
  indigo: "border-l-primary-500",
  teal: "border-l-secondary-500",
};

type ClientProfile = typeof clientProfile;

export const ClientProfileHeader: React.FC<{ client?: ClientProfile }> = ({
  client = clientProfile,
}) => {
  const c = client;
  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
      {/* identity */}
      <div className="max-w-md">
        <div className="flex items-center gap-3">
          <Avatar src={c.avatar} name={c.name} size={52} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-jakarta text-[22px] font-bold text-neutral-900">{c.name}</h2>
              <span className="inline-flex items-center gap-1 rounded-md bg-warning-50 px-2 py-0.5 font-jakarta text-[13px] font-semibold text-neutral-800">
                <Star className="h-3.5 w-3.5 fill-warning-400 text-warning-400" />
                {c.rating}
              </span>
            </div>
            <p className="font-outfit text-[14px] text-neutral-500">
              {c.role} <span className="text-neutral-300">|</span> {c.org}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {c.topics.map((t) => (
            <span
              key={t}
              className="rounded-md bg-secondary-50 px-2.5 py-1 font-outfit text-[13px] text-secondary-700"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="mt-3 inline-flex items-center gap-3 rounded-md border border-neutral-100 px-4 py-2 font-outfit text-[14px] text-neutral-600">
          <span>
            Sessions attended:{" "}
            <span className="font-semibold text-primary-600">{c.sessionsAttended}</span>
          </span>
          <span className="text-neutral-200">|</span>
          <span>
            Last session:{" "}
            <span className="font-semibold text-primary-600">{c.lastSession}</span>
          </span>
        </div>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {c.stats.map((s) => (
          <div
            key={s.key}
            className={cn(
              "min-w-[168px] rounded-md border border-neutral-100 border-l-[3px] p-4",
              KEYLINE[s.tone],
            )}
          >
            <p className="font-jakarta text-[12px] font-medium uppercase tracking-wide text-neutral-500">
              {s.label}
            </p>
            <p className="mt-2 font-jakarta text-[24px] font-bold text-neutral-900">{s.value}</p>
            <p className="mt-1 font-outfit text-[12px] text-neutral-400">{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
