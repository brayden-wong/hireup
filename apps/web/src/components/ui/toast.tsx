"use client";

import { toast } from "sonner";

import { useEffect } from "react";

type Props = {
  text: string;
};

export const Toast = ({ text }: Props) => {
  useEffect(() => {
    toast(text);
  }, []);

  return null;
};
