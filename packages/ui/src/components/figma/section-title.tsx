import { cn } from "@/lib/utils";
import type React from "react";

interface SectionTitleProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export function SectionTitle({
  children,
  className,
  ...props
}: SectionTitleProps) {
  return (
    <p
      className={cn(
        "text-[11px] font-semibold uppercase text-muted-foreground tracking-wider",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}
