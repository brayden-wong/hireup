"use client";

import { ChevronLeft, ChevronRight, Building } from "lucide-react";

import { useState, useEffect } from "react";
import Link from "next/link";

import { useIsMobile } from "~/lib/hooks/use-mobile";

import { UserJobCard } from "./user-job-card";
import { UserRecommendedJobs } from "@hireup/common/responses";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/ui/carousel";

type JobCarouselProps = {
  jobs: UserRecommendedJobs[];
};

export const SuggestedJobCarousel = ({ jobs }: JobCarouselProps) => {
  return (
    <Carousel
      className="flex w-full flex-col gap-2"
      opts={{ align: "start", loop: true }}
    >
      <div className="flex items-center justify-between gap-2">
        <h2>Suggested Jobs</h2>
        <div className="flex gap-2">
          <CarouselPrevious />
          <CarouselNext />
        </div>
      </div>
      <CarouselContent>
        {jobs.map((job) => (
          <CarouselItem
            key={job.slug}
            className="min-w-[26rem] basis-full sm:basis-1/2 lg:basis-1/3 2xl:basis-1/4"
          >
            <UserJobCard job={job} />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
};
