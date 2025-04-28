"use client";

import {
  BadgeCheck,
  Bell,
  Briefcase,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  MessageSquareDot,
  Newspaper,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import superjson from "superjson";
import type { Event } from "~/lib/types/events";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useSession, useUser } from "~/lib/stores/auth-store";
import {
  useConversationsFlag,
  useFeatureFlags,
  useJobsFlag,
} from "~/lib/stores/feature-flag";
import { useWebsocketStore } from "~/lib/stores/websocket-store";
import { formatName } from "~/lib/utils";

import { FeatureFlagStatus } from "@hireup/common/constants";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { FeatureBadge } from "~/components/ui/feature-badge";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";

export function Websocket() {
  const sessionId = useSession();

  const { ws, connect, disconnect } = useWebsocketStore();

  useEffect(() => {
    if (!ws) return void connect(sessionId);

    return () => {
      disconnect();
    };
  }, [ws]);

  return null;
}

export const FeedMenuButton = () => {
  const router = useRouter();

  const user = useUser();

  if (user.account === "recruiter") return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => router.push("/feed")}
          className="focus:ring-primary focus:ring-offset-background outline-none focus:ring-2 focus:ring-offset-2"
        >
          <div className="flex items-center gap-4">
            <Newspaper className="size-5" />
            Feed
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export const JobMenuButton = () => {
  const router = useRouter();
  const featureFlags = useFeatureFlags();
  const flag = useJobsFlag();

  if (featureFlags.jobs.status === "disabled" || flag.status === "disabled")
    return null;

  const isActive = getActiveState(flag.status);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          disabled={!(flag.status === "enabled" || flag.status === "beta")}
          onClick={() => router.push("/jobs")}
          className="focus:ring-primary focus:ring-offset-background justify-between focus:ring-2 focus:ring-offset-2 disabled:opacity-100 hover:disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-4">
            <Briefcase className="size-5" />
            Jobs
          </div>
          {isActive && <FeatureBadge status={flag.status} />}
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export const MessageMenuButton = () => {
  const path = usePathname();
  const router = useRouter();

  const { ws } = useWebsocketStore();

  const navigate = useCallback(() => {
    if (path === "/conversations") return;

    router.push("/conversations");
  }, [path, router]);

  const featureFlags = useFeatureFlags();
  const flag = useConversationsFlag();

  useEffect(() => {
    if (!ws) return;

    const handleMessage = async ({ data }: MessageEvent<string>) => {
      const payload = superjson.parse<Event>(data);

      if (payload.type === "sent_message") {
        if (path.includes(`/conversations/${payload.data.conversationId}`))
          return;

        return void toast(
          `${formatName(payload.data.sender.firstName, payload.data.sender.lastName)} sent you a message`,
          {
            action: {
              label: "view",
              onClick: () =>
                router.push(`/conversations/${payload.data.conversationId}`),
            },
          },
        );
      }
    };

    ws.addEventListener("message", handleMessage);

    return () => {
      ws.removeEventListener("message", handleMessage);
    };
  }, [ws]);

  if (
    featureFlags.conversations.status === "disabled" ||
    flag.status === "disabled"
  )
    return null;

  const isActive = getActiveState(featureFlags.conversations.status);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={navigate}
          className="focus:ring-primary focus:ring-offset-background justify-between focus:ring-2 focus:ring-offset-2"
        >
          <div className="flex items-center gap-4">
            <MessageSquareDot className="size-5" />
            Conversations
          </div>
          {isActive && <FeatureBadge status={flag.status} />}
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export const UserFooter = () => {
  const user = useUser();
  const { isMobile } = useSidebar();

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                <Avatar>
                  <AvatarImage
                    src=""
                    alt={`${formatName(user.firstName, user.lastName)}`}
                  />
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {formatName(user.firstName, user.lastName)}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={4}
              side={isMobile ? "bottom" : "right"}
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src=""
                      alt={formatName(user.firstName, user.lastName)}
                    />
                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {formatName(user.firstName, user.lastName)}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Sparkles />
                  Upgrade to Pro
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <BadgeCheck />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCard />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell />
                  Notifications
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      {/* <div className="peer/menu-button ring-sidebar-ring flex w-full items-center justify-between gap-2 overflow-hidden rounded-md p-2 text-left text-sm transition-[width,height,padding] outline-none group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50">
        <span>
          {user.firstName} {user.lastName}
        </span>
        <Link
          prefetch
          href="/settings"
          className={cn(
            buttonVariants({
              size: "icon",
              variant: "outline",
            }),
            "bg-accent/10 shrink-0",
          )}
        >
          <Settings className="size-4" />
        </Link>
      </div> */}
    </SidebarFooter>
  );
};

function getActiveState(flag: FeatureFlagStatus) {
  return ["enabled", "beta", "soon", "new"].includes(flag);
}
