"use client";

import { formatDistanceToNow } from "date-fns";
import { Building, MapPin } from "lucide-react";

import { useState } from "react";
import Link from "next/link";

import { Pill } from "../pill";
import { UserRecommendedJobs } from "@hireup/common/responses";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export const UserJobCard = ({ job }: { job: UserRecommendedJobs }) => {
  const [focused, setFocused] = useState(false);

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

  const time = formatDistanceToNow(job.createdAt, { addSuffix: true }).replace(
    "about",
    "",
  );

  return (
    <Card className="relative h-40 min-w-full shrink-0 gap-1 overflow-hidden pb-2">
      <CardHeader>
        <Link
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          href={`/jobs/${job.slug}`}
          className="group h-fit w-fit bg-transparent p-0 outline-none hover:bg-transparent"
        >
          <CardTitle>{job.title}</CardTitle>
          <span className="absolute inset-0 rounded-lg" />
        </Link>

        <CardDescription className="flex flex-col items-start justify-start gap-2">
          {job.company && (
            <span className="mt-1 flex items-center gap-2">
              <Building className="size-4" /> {job.company}
            </span>
          )}
          <span className="flex items-center gap-2">
            <span className="flex items-center gap-2">
              <MapPin className="size-4" />
              {job.location}
            </span>
            <Pill>{job.applicants.length} Applicants</Pill>
            <Pill>{job.environment}</Pill>
            <Pill>{job.type}</Pill>
          </span>
          <span className="text-sm font-medium">{formatSalary()}</span>
          <span className="text-primary font-semibold">{time}</span>
        </CardDescription>
      </CardHeader>
      <Button className="absolute top-2 right-2">Apply</Button>
    </Card>
  );
};
