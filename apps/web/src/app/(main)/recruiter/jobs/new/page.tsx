import { BackButton } from "./_components/back-button";
import { JobForm } from "./job-form";

export const metadata = {
  title: "Create Job Listing",
  description: "Post a new job listing",
};

export default function NewJobPage() {
  return (
    <div className="flex h-full w-full items-start justify-center gap-2 overflow-hidden py-2 pr-2 md:justify-start">
      <BackButton />
      <div className="container flex w-full flex-1 items-center justify-center">
        <div className="flex w-full max-w-3xl flex-col">
          <div className="pb-2">
            <h1 className="text-3xl font-bold">Create Job Listing</h1>
            <p className="text-muted-foreground mt-2">
              Fill out the form below to post a new job listing
            </p>
          </div>
          <div className="h-[calc(100vh-10rem)]">
            <JobForm />
          </div>
        </div>
      </div>
    </div>
  );
}
