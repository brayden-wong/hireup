import Link from "next/link";

import { getMyJobs } from "~/server/data/cache/jobs";

import {
  Container,
  ContainerContent,
  ContainerHeader,
} from "~/components/layouts/container";
import { AuthRedirect } from "~/components/redirect";
import { buttonVariants } from "~/components/ui/button";
import { Toast } from "~/components/ui/toast";
import { RecruiterJobCard } from "~/features/jobs/recruiter/recruiter-job-card";

export default async function RecruiterJobsPage() {
  const jobs = await getMyJobs();

  if (!jobs || typeof jobs === "string") return <AuthRedirect redirect />;

  return (
    <Container className="py-2 pr-2">
      <ContainerHeader>
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center justify-center gap-4">
            <h1 className="text-lg font-medium">Jobs</h1>
          </div>
          <Link href="/jobs/new" className={buttonVariants()}>
            Create Listing
          </Link>
        </div>
      </ContainerHeader>
      <ContainerContent className="p-2">
        <div className="grid w-full grid-cols-1 content-start gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {typeof jobs === "string" ? (
            <Toast text={jobs} />
          ) : (
            jobs.map((job) => <RecruiterJobCard key={job.id} job={job} />)
          )}
        </div>
      </ContainerContent>
    </Container>
  );
}
