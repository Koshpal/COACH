import React from "react";
import { Star } from "lucide-react";
import { Avatar } from "./Avatar";
import type { MockClient } from "../../mock/data";

export const ClientCard: React.FC<{
  client: MockClient;
  onView?: (c: MockClient) => void;
}> = ({ client, onView }) => (
  <article className="rounded-lg border border-neutral-100 bg-white p-5 shadow-low">
    <div className="flex items-start gap-3">
      <Avatar src={client.avatar} name={client.name} size={52} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate font-jakarta text-[18px] font-bold text-neutral-900">
            {client.name}
          </h3>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-neutral-50 px-2 py-0.5 font-jakarta text-[13px] font-semibold text-neutral-700">
            <Star className="h-3.5 w-3.5 fill-warning-400 text-warning-400" />
            {client.rating}
          </span>
        </div>
        <p className="font-outfit text-[14px] text-neutral-500">
          {client.role} <span className="text-neutral-300">|</span> {client.org}
        </p>
      </div>
    </div>

    <div className="mt-3 flex gap-2 overflow-hidden">
      {client.topics.map((t) => (
        <span
          key={t}
          className="whitespace-nowrap rounded-md bg-secondary-50 px-2.5 py-1 font-outfit text-[12px] text-secondary-700"
        >
          {t}
        </span>
      ))}
    </div>

    <button
      onClick={() => onView?.(client)}
      className="mt-4 w-full rounded-md border border-primary-200 py-2.5 font-jakarta text-[14px] font-semibold text-primary-600 transition-colors hover:bg-primary-50"
    >
      View Profile
    </button>
  </article>
);
