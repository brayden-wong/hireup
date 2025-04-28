import { headers } from "next/headers";

import { AuthForm } from "~/components/auth/auth-form";
import { Modal } from "~/components/ui/modal";

const AuthModal = async ({
  searchParams,
}: {
  searchParams: Promise<{ signup: boolean }>;
}) => {
  const requestHeaders = await headers();

  const path = requestHeaders.get("x-pathname") ?? "/";

  return (
    <Modal>
      <AuthForm path={path} />
    </Modal>
  );
};

export default AuthModal;
