"use client";

import { Building, MapPin, X } from "lucide-react";

import { useRouter } from "next/navigation";

import { useIsMobile } from "~/lib/hooks/use-mobile";

import { FormattedDescription } from "../format-description";
import { Pill } from "../pill";
import { GetRecuiterJobs } from "@hireup/common/responses";
import { Button } from "~/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "~/components/ui/drawer";

export const UserJob = ({ job }: { job: GetRecuiterJobs }) => {
  const router = useRouter();

  const isMobile = useIsMobile();

  const back = () => router.back();

  const formatSalary = () => {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });

    const minSalary = formatter.format(job.salaryMin);
    const maxSalary = job.salaryMax ? formatter.format(job.salaryMax) : null;

    return maxSalary ? `${minSalary} - ${maxSalary}` : `${minSalary}+`;
  };

  if (isMobile) {
    return (
      <DrawerContent>
        <DrawerHeader className="gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <DrawerTitle>{job.title}</DrawerTitle>
            <Button onClick={back} variant="ghost">
              <X className="size-4" />
            </Button>
          </div>
          <DrawerDescription>
            {job.company && (
              <span className="flex items-center gap-2">
                <Building className="size-4" /> {job.company}
              </span>
            )}
            <span className="mt-2 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-2">
                <MapPin className="size-4" />
                {job.location}
              </span>
              <Pill>{job.applicants.length} Applicants</Pill>
              <Pill>{job.environment}</Pill>
              <Pill>{job.type}</Pill>
            </span>
            <span className="mt-2 font-medium">{formatSalary()}</span>
          </DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto p-4">
          <h3 className="text-lg font-medium">Job Description</h3>
          <div className="prose prose-sm text-muted-foreground max-w-none">
            <FormattedDescription description={job.description} />
          </div>
        </div>
      </DrawerContent>
    );
  }

  return (
    <DialogContent className="flex max-h-[90%] flex-col overflow-hidden sm:max-w-3xl">
      <DialogHeader className="gap-1.5">
        <DialogTitle>{job.title}</DialogTitle>
        <DialogDescription>
          {job.company && (
            <span className="flex items-center gap-2">
              <Building className="size-4" /> {job.company}
            </span>
          )}
          <span className="mt-2 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-2">
              <MapPin className="size-4" />
              {job.location}
            </span>
            <Pill>{job.applicants.length} Applicants</Pill>
            <Pill>{job.environment}</Pill>
            <Pill>{job.type}</Pill>
          </span>
          <span className="mt-2 font-medium">{formatSalary()}</span>
        </DialogDescription>
      </DialogHeader>
      <div className="overflow-y-auto">
        <h3 className="text-lg font-medium">Job Description</h3>
        <div className="prose prose-sm text-muted-foreground max-w-none">
          <FormattedDescription description={job.description} />
        </div>
      </div>
    </DialogContent>
  );
};
