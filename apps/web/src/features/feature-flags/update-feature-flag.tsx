"use client";

import { toast } from "sonner";
import { z } from "zod";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import { updateFeatureFlag } from "~/server/mutations/feature-flag";

import { useMutation } from "~/lib/hooks/use-mutation";
import { useSetFeatureFlag } from "~/lib/stores/feature-flag";

import {
  FEATURE_FLAG_STATUS,
  FeatureFlagStatus,
} from "@hireup/common/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

type Props = {
  name: string;
  status: FeatureFlagStatus;
};

const FeatureFlagSchema = z.object({
  name: z.string(),
  status: z.enum(FEATURE_FLAG_STATUS),
});

type FeatureFlagSchema = z.infer<typeof FeatureFlagSchema>;

export const UpdateFeatureFlag = ({ name, status }: Props) => {
  const router = useRouter();

  const setFlag = useSetFeatureFlag();

  const form = useForm<FeatureFlagSchema>({
    resolver: zodResolver(FeatureFlagSchema),
    defaultValues: {
      name,
      status,
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: FeatureFlagSchema) => {
      const response = await updateFeatureFlag(data);

      if (!response.success) throw new Error(response.error);

      return response.data;
    },
    onSuccess: (data) => {
      toast("Feature flag updated");

      setFlag(data.name, data.status);
    },
    onError: (error) => {
      if (error.message === "An unknown error occurred")
        return void toast(error.message);

      return void router.replace("/auth");
    },
  });

  const updatedStatus = form.watch("status");

  const onSubmit = form.handleSubmit((data) => mutate(data));

  useEffect(() => {
    if (status === updatedStatus) return;

    onSubmit();
  }, [updatedStatus]);

  return (
    <Form {...form}>
      <form className="flex w-40 items-center gap-2" onSubmit={onSubmit}>
        <FormField
          name="status"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel aria-hidden className="sr-only">
                Status
              </FormLabel>
              <Select defaultValue={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-36" disabled={isPending}>
                    {isPending && <LoadingSpinner />}
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {FEATURE_FLAG_STATUS.map((status) => (
                    <SelectItem value={status} key={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};
