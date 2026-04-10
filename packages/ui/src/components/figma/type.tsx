import type React from "react";
import { cn } from "@/lib/utils";

const sizeMap = {
  xsmall: "text-[11px]",
  small: "text-[12px]",
  large: "text-[13px]",
  xlarge: "text-[14px]",
} as const;

const weightMap = {
  normal: "font-normal",
  medium: "font-medium",
  bold: "font-semibold",
} as const;

interface TypeProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: keyof typeof sizeMap;
  weight?: keyof typeof weightMap;
  children: React.ReactNode;
}

export function Type({
  children,
  size = "small",
  weight = "normal",
  className,
  ...props
}: TypeProps) {
  return (
    <p className={cn(sizeMap[size], weightMap[weight], "font-sans", className)} {...props}>
      {children}
    </p>
  );
}
