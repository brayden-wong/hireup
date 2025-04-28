import {
  FeedMenuButton,
  JobMenuButton,
  MessageMenuButton,
  UserFooter,
  Websocket,
} from "./sidebar-components";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
} from "~/components/ui/sidebar";

const AppSidebar = () => (
  <>
    <Sidebar collapsible="icon" variant="floating">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <div className="flex flex-col gap-2">
            <FeedMenuButton />
            <JobMenuButton />
            <MessageMenuButton />
          </div>
        </SidebarGroup>
      </SidebarContent>
      <UserFooter />
    </Sidebar>
    <Websocket />
  </>
);

export { AppSidebar as Sidebar };
