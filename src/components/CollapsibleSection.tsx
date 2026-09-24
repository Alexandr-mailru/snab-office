"use client";

import { useState, type ReactNode } from "react";

type CollapsibleSectionProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: ReactNode;
  className?: string;
};

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  badge,
  className = "",
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <details
      className={`filter-collapse ${className}`.trim()}
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="filter-collapse-trigger">
        <span className="filter-collapse-title">
          {title}
          {badge ? <span className="filter-collapse-badge">{badge}</span> : null}
        </span>
        <span className="filter-collapse-chevron" aria-hidden>
          ▾
        </span>
      </summary>
      <div className="filter-collapse-inner">{children}</div>
    </details>
  );
}
