import React from "react";

interface PageHeaderProps {
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  title: string;
  subtitle?: string;
  description?: string;
  actions?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({
  icon,
  badge,
  title,
  subtitle,
  description,
  actions,
  action,
  children,
}: PageHeaderProps) {
  const resolvedSubtitle = subtitle ?? description;
  const resolvedActions = actions ?? action;

  return (
    <header className="rounded-[18px] border border-border bg-surface p-5 sm:p-6 shadow-[var(--shadow-xs)] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          {icon && (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-accent border border-border-lavender text-primary">
              {icon}
            </span>
          )}
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground leading-tight">
                {title}
              </h1>
              {badge && (
                typeof badge === "string" ? (
                  <span className="rounded-md bg-accent border border-border-lavender px-2 py-0.5 text-[11px] font-semibold text-foreground">
                    {badge}
                  </span>
                ) : (
                  badge
                )
              )}
            </div>
            {resolvedSubtitle && (
              <p className="text-xs sm:text-sm text-foreground-secondary max-w-2xl">
                {resolvedSubtitle}
              </p>
            )}
          </div>
        </div>

        {resolvedActions && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {resolvedActions}
          </div>
        )}
      </div>

      {children && (
        <div className="pt-3.5 border-t border-border">
          {children}
        </div>
      )}
    </header>
  );
}
