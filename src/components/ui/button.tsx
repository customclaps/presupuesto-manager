import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline";
  size?: "default" | "sm" | "icon";
};

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: Props) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center rounded-xl text-sm font-medium transition",
        "focus:outline-none focus:ring-2 focus:ring-black/20 disabled:opacity-50 disabled:pointer-events-none",
        size === "default" ? "h-10 px-4" : size === "sm" ? "h-9 px-3 rounded-lg" : "h-9 w-9 rounded-lg",
        variant === "default"
          ? "bg-black text-white hover:opacity-90"
          : "border border-gray-300 hover:bg-black/5",
        className
      )}
    />
  );
}
