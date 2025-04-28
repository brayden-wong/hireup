"use client";

import { formatDistanceToNow } from "date-fns";
import { Building, Ellipsis, MapPin, X } from "lucide-react";

import { useState } from "react";
import Link from "next/link";

import { cn } from "~/lib/utils";

import { Pill } from "../pill";
import { GetRecuiterJobs } from "@hireup/common/responses";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export const RecruiterJobCard = ({ job }: { job: GetRecuiterJobs }) => {
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
    <Card
      className={cn(
        "hover:border-primary relative h-fit max-h-40 min-h-40 overflow-hidden pb-2 transition-colors",
        focused &&
          "hover:border-card ring-primary ring-offset-background ring-2 ring-offset-2",
      )}
    >
      <CardHeader className="gap-1 pb-0">
        <div className="flex items-center justify-between gap-2">
          <Link
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            href={`/jobs/${job.slug}`}
            className="group h-fit w-fit bg-transparent p-0 outline-none hover:bg-transparent"
          >
            <CardTitle>{job.title}</CardTitle>
            <span className="absolute inset-0 rounded-lg" />
          </Link>
          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="focus-visible:ring-offset-background absolute right-0 z-20"
                >
                  <span className="sr-only">edit options</span>
                  <Ellipsis className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem>Archive</DropdownMenuItem>
                <DropdownMenuItem>Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
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
    </Card>
  );
};
