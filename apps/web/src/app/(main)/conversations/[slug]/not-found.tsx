import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-background flex h-full min-h-[400px] w-full flex-col items-center justify-center rounded-md p-6 text-white">
      <div className="max-w-md text-center">
        <h2 className="mb-2 text-xl font-medium">Thread not found</h2>
        <Link
          href="/messages"
          className="inline-flex items-center text-sm text-zinc-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Go back to safety
        </Link>
      </div>
    </div>
  );
}
