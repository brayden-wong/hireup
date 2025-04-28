import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

import { Label } from "./label";

type FormFieldProps = {
  name: string;
  label: string;
  children: ReactNode;
  optional?: boolean;
  error?: string;
  className?: string;
};

export const FormField = ({
  className,
  children,
  optional = false,
  ...props
}: FormFieldProps) => {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label
        htmlFor={props.name}
        className={cn(
          props.error && "text-destructive",
          "flex items-center gap-2",
        )}
      >
        {props.label}
        {optional && (
          <span className="text-muted-foreground text-xs">(optional)</span>
        )}
      </Label>
      {children}
      {props.error && <p className="text-destructive text-sm">{props.error}</p>}
    </div>
  );
};
