import { PropsWithChildren } from "react";
import { ContainerHeader } from "~/app/(main)/_components/container";
import { ArchivedThreadList } from "./_components/archived-thread-list";

export const revalidate = 60;

const ArchivedThreadsLayout = ({ children }: PropsWithChildren) => (
  <>
    <ContainerHeader>
      <div className="flex items-center justify-center gap-4">
        <h1 className="text-lg font-medium">Archived Messages</h1>
      </div>
    </ContainerHeader>
    <div className="flex flex-1 gap-2 overflow-hidden rounded-md bg-neutral-100/10 p-2">
      <ArchivedThreadList />
      {children}
    </div>
  </>
);

export default ArchivedThreadsLayout;
