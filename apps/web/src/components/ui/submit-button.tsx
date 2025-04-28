import { cn } from "~/lib/utils";

import { Button, ButtonProps } from "./button";
import { LoadingSpinner } from "./loading-spinner";

export type SubmitButtonProps = Omit<ButtonProps, "type"> & {
  isPending?: boolean;
};

export const SubmitButton = ({
  children,
  disabled,
  isPending,
  className,
  ...props
}: SubmitButtonProps) => (
  <Button
    {...props}
    type="submit"
    disabled={disabled || isPending}
    className={cn("min-w-24", className)}
  >
    {isPending ? <LoadingSpinner className="text-neutral-100" /> : children}
  </Button>
);
