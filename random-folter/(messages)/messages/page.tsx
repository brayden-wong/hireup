import { ThreadHeader } from "./_components/thread-header";
import { NewThreadForm } from "../_components/send-message-form";

const MessagesPage = async () => {
  return (
    <main className="grid h-full w-full grid-rows-[auto,1fr,auto] rounded-md bg-background p-2">
      <ThreadHeader />
      <div className="flex-1" />
      <NewThreadForm />
    </main>
  );
};

export default MessagesPage;
