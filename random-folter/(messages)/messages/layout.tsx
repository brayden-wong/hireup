import type { PropsWithChildren } from "react";
import { ContainerHeader } from "../../_components/container";
import { ThreadList } from "./_components/thread-list";

export const revalidate = 60;

const MessageLayout = async ({ children }: PropsWithChildren) => {
  return (
    <>
      {/* <ContentHeader>
        <div className="flex items-center justify-center gap-4">
          <h1 className="text-lg font-medium">Messages</h1>
        </div>
      </ContentHeader> */}
      <div className="flex flex-1 gap-2 overflow-hidden rounded-md bg-neutral-100/10 p-2">
        <ThreadList />
        {children}
      </div>
    </>
  );
};

export default MessageLayout;
