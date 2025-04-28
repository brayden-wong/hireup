import { ChevronLeft, ChevronRight } from "lucide-react";

import { getRecommendedJobs } from "~/server/data/get-recommended-jobs";

import {
  Container,
  ContainerContent,
  ContainerHeader,
} from "~/components/layouts/container";
import { AuthRedirect } from "~/components/redirect";
import { SuggestedJobCarousel } from "~/features/jobs/user/suggested-jobs";

const UserJobsPage = async () => {
  const jobs = await getRecommendedJobs();

  if (!jobs || typeof jobs === "string") return <AuthRedirect redirect />;

  console.log(jobs);

  return (
    <Container className="py-2">
      <ContainerHeader>
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center justify-center gap-4">
            <h1 className="text-lg font-medium">Jobs</h1>
          </div>
        </div>
      </ContainerHeader>
      <ContainerContent className="flex flex-col gap-2 px-2">
        <SuggestedJobCarousel jobs={jobs} />
        <div className="flex-1 bg-blue-900">content</div>
      </ContainerContent>
    </Container>
  );
};

export default UserJobsPage;
