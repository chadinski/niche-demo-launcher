import type { ReactNode } from "react";

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        {eyebrow ? (
          <p className="mb-2 text-[0.68rem] font-bold tracking-[0.16em] text-brand-600 uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-[clamp(1.8rem,4vw,2.6rem)] leading-none font-extrabold tracking-[-0.055em] text-ink-950">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#70778b] sm:text-[0.95rem]">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
