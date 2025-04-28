import "client-only";
import { toast } from "sonner";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
  error?: string;
  redirect: boolean;
};

export function useAuthRedirect({ redirect, error }: Props) {
  const router = useRouter();

  useEffect(() => {
    console.log("ERROR", error);
    if (error) toast(error);

    if (redirect) router.push("/auth");
  }, [error, redirect, router]);

  return null;
}
