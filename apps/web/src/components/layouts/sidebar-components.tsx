"use client";

import {
  BadgeCheck,
  Bell,
  Briefcase,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Settings,
  MessageSquareDot,
  Newspaper,
  Sparkles,
  ChevronRight,
  Flag,
} from "lucide-react";
import { toast } from "sonner";
import superjson from "superjson";
import type { Event } from "~/lib/types/events";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useSession, useUser } from "~/lib/stores/auth-store";
import { useFeatureFlag } from "~/lib/stores/feature-flag";
import { useWebsocketStore } from "~/lib/stores/websocket-store";
import { formatName } from "~/lib/utils";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import {
  FEATURE_FLAG_STATUS,
  FeatureFlagStatus,
} from "@hireup/common/constants";
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
  const user = useUser();

  if (user.account === "recruiter") return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className="focus:ring-primary focus:ring-offset-background outline-none focus:ring-2 focus:ring-offset-2"
        >
          <Link href="/feed">
            <div className="flex items-center gap-2">
              <Newspaper className="size-4" />
              Feed
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export const AdminSidebarButton = () => {
  const [open, onOpenChange] = useState(false);

  const user = useUser();

  if (user.account !== "admin") return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Collapsible open={open} onOpenChange={onOpenChange}>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Settings className="size-4" />
                Admin Config
              </span>
              <ChevronRight
                data-state={open ? "open" : "closed"}
                className="size-4 transition-transform duration-300 data-[state=closed]:rotate-0 data-[state=open]:rotate-90"
              />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent className="border-border mt-1 ml-2 border-l-2 pl-2">
            <SidebarMenuButton asChild>
              <Link href="/feature-flags">
                <Flag className="size-4" />
                Feature Flags
              </Link>
            </SidebarMenuButton>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export const JobMenuButton = () => {
  const flag = useFeatureFlag("jobs");

  if (flag === "disabled") return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          disabled={!(flag === "enabled" || flag === "beta")}
          className="focus:ring-primary focus:ring-offset-background justify-between focus:ring-2 focus:ring-offset-2 disabled:opacity-100 hover:disabled:cursor-not-allowed"
        >
          <Link href="/jobs">
            <div className="flex items-center gap-2">
              <Briefcase className="size-4" />
              Jobs
            </div>
            <FeatureBadge status={flag} />
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export const MessageMenuButton = () => {
  const path = usePathname();
  const router = useRouter();

  const { ws } = useWebsocketStore();

  const navigate = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();

      if (path === "/conversations") return;

      router.push("/conversations");
    },
    [path, router],
  );

  const flag = useFeatureFlag("conversations");

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

  if (flag === "disabled") return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className="focus:ring-primary focus:ring-offset-background justify-between focus:ring-2 focus:ring-offset-2"
        >
          <Link href="/conversations" onClick={navigate}>
            <div className="flex items-center gap-2">
              <MessageSquareDot className="size-4" />
              Conversations
            </div>
            <FeatureBadge status={flag} />
          </Link>
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
