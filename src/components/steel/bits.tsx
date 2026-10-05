import type { ReactNode } from "react";

export function Btn({
  children,
  onClick,
  kind = "ghost",
  disabled,
  testid,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?: "primary" | "ghost" | "quiet";
  disabled?: boolean;
  testid?: string;
  type?: "button" | "submit";
}) {
  const look =
    kind === "primary"
      ? "bg-accent text-accent-fg"
      : kind === "quiet"
        ? "bg-transparent text-muted"
        : "border border-line bg-elevated text-fg";
  return (
    <button
      type={type}
      data-testid={testid}
      disabled={disabled}
      onClick={onClick}
      className={`min-h-11 rounded-lg px-4 text-sm font-medium transition-opacity duration-150 disabled:opacity-40 ${look}`}
    >
      {children}
    </button>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-line bg-surface p-4 ${className}`}>{children}</section>;
}

export function Field({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="min-w-16">
      <div className="text-xs text-subtle">{k}</div>
      <div className="font-mono text-sm tabular-nums text-fg">{v}</div>
    </div>
  );
}
