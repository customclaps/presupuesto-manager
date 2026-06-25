import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-10 w-full rounded-xl border border-gray-300 bg-transparent px-3 text-sm outline-none",
        "focus:ring-2 focus:ring-black/20",
        className
      )}
    />
  );
}
