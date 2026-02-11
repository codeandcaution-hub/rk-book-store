import * as React from "react";
import { cn } from "@/lib/utils";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, children, ...props }: LabelProps) {
  return (
    <label className={cn("block text-sm font-medium leading-6", className)} {...props}>
      {children}
    </label>
  );
}
