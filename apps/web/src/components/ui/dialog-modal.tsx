import type { JSX, ReactNode } from "react";

import { useIsMobile } from "~/lib/hooks/use-mobile";

import { AlertDialog } from "./alert-dialog";
import { Dialog } from "./dialog";
import { Drawer } from "./drawer";

type Props = {
  dialog: () => JSX.Element;
  drawer: () => JSX.Element;
  alert?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const ModalDialog = ({
  open,
  onOpenChange,
  dialog,
  drawer,
  alert = false,
}: Props) => {
  const isMobile = useIsMobile();

  if (isMobile)
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {drawer()}
      </Drawer>
    );

  if (alert)
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        {dialog()}
      </AlertDialog>
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {dialog()}
    </Dialog>
  );
};
