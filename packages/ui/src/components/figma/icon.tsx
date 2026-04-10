import { Info, type LucideProps, Plus, Star } from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, ComponentType<LucideProps>> = {
  plus: Plus,
  info: Info,
  star: Star,
};

export interface IconProps extends LucideProps {
  iconName: string;
  spin?: boolean;
}

export function Icon({ iconName, spin, className, ...props }: IconProps) {
  const LucideIcon = iconMap[iconName];
  if (!LucideIcon) return null;
  return <LucideIcon className={cn("size-4", spin && "animate-spin", className)} {...props} />;
}
