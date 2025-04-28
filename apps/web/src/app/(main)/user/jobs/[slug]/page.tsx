import { notFound } from "next/navigation";

import { getJob, getRecuiterJob } from "~/server/data/cache/jobs";

import { AuthRedirect } from "~/components/redirect";
import { Modal } from "~/components/ui/modal";
import { RecruiterJob } from "~/features/jobs/recruiter/recruiter-job";
import { UserJob } from "~/features/jobs/user/user-job";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function RecruiterJobPage({ params }: Props) {
  const { slug } = await params;

  const job = await getJob(slug);

  if (!job || (typeof job === "string" && job !== "Job not found"))
    return <AuthRedirect redirect />;

  if (job === "Job not found") return notFound();

  return (
    <Modal>
      <UserJob job={job} />
    </Modal>
  );
}
