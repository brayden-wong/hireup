"use client";

import { Trash2 } from "lucide-react";

import { useRouter } from "next/navigation";

import { deleteFeatureFlag } from "~/server/mutations/feature-flag";

import { Button } from "~/components/ui/button";
import { DeleteModal } from "~/components/ui/delete-modal";

export const DeleteFeatureFlag = ({ flag }: { flag: string }) => {
  const router = useRouter();

  return (
    <DeleteModal
      title="Delete Feature Flag"
      description="Are you sure you want to delete this feature flag? Once deleted, it cannot be recovered."
      itemTitle={flag}
      confirm="Delete Feature Flag"
      action={async () => {
        const response = await deleteFeatureFlag(flag);

        if (!response.success) throw new Error(response.error);

        return response.data;
      }}
      trigger={
        <Button variant="outline" className="hover:bg-background size-9 p-0">
          <Trash2 className="size-4" />
        </Button>
      }
    />
  );
};
