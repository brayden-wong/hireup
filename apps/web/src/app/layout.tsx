import "~/styles/globals.css";
import type { ToasterProps } from "sonner";

import { PropsWithChildren } from "react";
import { type Metadata } from "next";

import { getAuth } from "~/server/data/cache/auth";

import { UserContextProvider } from "~/lib/contexts/user-context";

import { GeistSans } from "geist/font/sans";
import { Toaster } from "~/components/ui/sonner";
import { env } from "~/env";

export const metadata: Metadata = {
  title: "Hireup",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const TOASTER_PROPS = {
  duration: 4_000,
  position: "bottom-right",
} satisfies ToasterProps;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode; modal: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      {env.REACT_SCAN && (
        <head>
          <script
            crossOrigin="anonymous"
            src="//unpkg.com/react-scan/dist/auto.global.js"
          />
        </head>
      )}
      <body>
        <LoadUser>
          {children}
          {/* {modal} */}
          <Toaster {...TOASTER_PROPS} />
        </LoadUser>
      </body>
    </html>
  );
}

const LoadUser = async ({ children }: PropsWithChildren) => {
  const auth = await getAuth();

  return <UserContextProvider user={auth}>{children}</UserContextProvider>;
};
