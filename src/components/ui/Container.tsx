import type { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: "narrow" | "default" | "wide" | "full";
}

const SIZE_MAP = {
  narrow: "max-w-xl",
  default: "max-w-4xl",
  wide: "max-w-7xl",
  full: "max-w-full",
};

export function Container({
  children,
  className = "",
  size = "wide",
}: ContainerProps) {
  return (
    <div className={`mx-auto w-full ${SIZE_MAP[size]} ${className}`}>
      {children}
    </div>
  );
}
