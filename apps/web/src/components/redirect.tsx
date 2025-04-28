"use client";

import { PropsWithChildren } from "react";

import { useAuthRedirect } from "~/lib/hooks/use-auth-redirect";

type Props = PropsWithChildren<{ error?: string; redirect: boolean }>;

export const AuthRedirect = (props: Props) => {
  useAuthRedirect(props);

  return null;
};
