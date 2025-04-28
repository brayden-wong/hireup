"use client";

import Link from "next/link";
import { buttonVariants } from "./button";
import { ArrowRight } from "lucide-react";
import { SignedIn, SignedOut } from "~/lib/contexts/user-context";

export const Navigation = () => {
  return (
    <nav className="flex w-full items-center justify-between p-4">
      <Link href="/" className="text-2xl font-semibold tracking-wide">
        Hire<span className="text-3xl font-bold text-primary">UP</span>
      </Link>
      <div className="flex items-center gap-2">
        <SignedOut>
          <>
            <Link href="/auth?signup=true" className={buttonVariants()}>
              Sign Up
            </Link>
            <Link
              href="/auth"
              className={buttonVariants({ variant: "outline" })}
            >
              Sign In
            </Link>
          </>
        </SignedOut>
        <SignedIn>
          <Link
            href="/feed"
            className={buttonVariants({ className: "rounded-lg" })}
          >
            Dashboard <ArrowRight className="size-4" />
          </Link>
        </SignedIn>
      </div>
    </nav>
  );
};
