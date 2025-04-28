import { PropsWithChildren } from "react";

import { getFeatureFlags } from "~/server/data/cache/feature-flags";
import { verifySession } from "~/server/utils/verify-session";

import { CreateMessageProvider } from "~/lib/contexts/create-message-context";
import { FeatureFlagProvider } from "~/lib/contexts/feature-flag-context";
import { SignedIn } from "~/lib/contexts/user-context";
import { WebsocketProvider } from "~/lib/contexts/websocket-context";

import { Sidebar } from "../../components/layouts/sidebar";
import { ourFileRouter } from "../api/uploadthing/core";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { AuthRedirect } from "~/components/redirect";
import { SidebarProvider } from "~/components/ui/sidebar";

const MainLayout = async ({ children }: PropsWithChildren) => {
  const session = await verifySession();

  if (!session) return <AuthRedirect redirect />;

  const flags = await getFeatureFlags();

  if (!flags) return <AuthRedirect redirect />;

  return (
    <SignedIn>
      <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
      <WebsocketProvider>
        <FeatureFlagProvider {...flags}>
          <CreateMessageProvider>
            <SidebarProvider>
              <Sidebar />
              <div className="flex max-h-screen w-full flex-1 flex-col gap-2">
                {children}
              </div>
            </SidebarProvider>
          </CreateMessageProvider>
        </FeatureFlagProvider>
      </WebsocketProvider>
    </SignedIn>
  );
};

export default MainLayout;
