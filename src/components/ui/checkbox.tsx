import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  id?: string;
  className?: string;
};

export function Checkbox({ checked, onCheckedChange, id, className }: Props) {
  return (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className={cn("h-4 w-4 accent-black", className)}
    />
  );
}
