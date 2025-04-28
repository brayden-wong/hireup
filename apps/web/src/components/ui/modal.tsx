"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";

import { useRouter } from "next/navigation";

import { useMediaQuery } from "~/lib/hooks/use-media-query";
import { useIsMobile } from "~/lib/hooks/use-mobile";

import { Dialog } from "./dialog";
import { Drawer } from "./drawer";

interface ModalProps {
  children?: ReactNode;
  neverClose?: boolean;
  open?: boolean;
  onOpenChange?: Dispatch<SetStateAction<boolean>>;
  onClose?: () => void;
  desktopOnly?: boolean;
  preventDefaultClose?: boolean;
}

export const Modal = ({
  children,
  desktopOnly,
  onClose,
  neverClose = false,
  preventDefaultClose,
  onOpenChange,
  open: showModal,
}: ModalProps) => {
  const router = useRouter();
  const isMobile = useIsMobile();

  const closeModal = ({ dragged }: { dragged?: boolean }) => {
    if (neverClose) return;

    if (preventDefaultClose && !dragged) {
      return;
    }

    if (onClose) onClose();

    if (onOpenChange) {
      onOpenChange(false);
    }

    router.back();
  };

  if (isMobile && !desktopOnly) {
    return (
      <Drawer
        open={onOpenChange ? showModal : true}
        onOpenChange={(open) => {
          if (!open) return void closeModal({ dragged: true });

          return void router.back();
        }}
      >
        {children}
      </Drawer>
    );
  }

  return (
    <Dialog
      open={onOpenChange ? showModal : true}
      onOpenChange={(open) => {
        if (!open) return void closeModal({ dragged: true });

        return void router.back();
      }}
    >
      {children}
    </Dialog>
  );
};
