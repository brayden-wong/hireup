"use client";

import { toast } from "sonner";
import { z } from "zod";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import { createFeatureFlag } from "~/server/mutations/feature-flag";

import { useMutation } from "~/lib/hooks/use-mutation";
import { useSetFeatureFlag } from "~/lib/stores/feature-flag";

import { FEATURE_FLAG_STATUS } from "@hireup/common/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { SubmitButton } from "~/components/ui/submit-button";

const FeatureFlagSchema = z.object({
  flagName: z
    .string()
    .min(3, { message: "Flag must be at least 3 characters long" })
    .max(64, { message: "Flag can be at most 64 characters long" })
    .regex(/^[a-z0-9-]+$/, {
      message: "Flag can only contain lowercase letters, numbers, and hypens",
    }),
  status: z.enum(FEATURE_FLAG_STATUS),
});

export const CreateFeatureFlag = ({
  existingFlags,
}: {
  existingFlags: string[];
}) => {
  const router = useRouter();
  const setFlag = useSetFeatureFlag();

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof FeatureFlagSchema>) => {
      const response = await createFeatureFlag({
        name: data.flagName,
        status: data.status,
      });

      if (!response.success) throw new Error(response.error);

      return response.data;
    },
    onSuccess: (data) => {
      toast("Feature flag created");

      setFlag(data.name, data.status);
    },
    onError: (error) => {
      if (error.message === "An unknown error occurred")
        return void toast(error.message);

      return void router.replace("/auth");
    },
  });

  const form = useForm<z.infer<typeof FeatureFlagSchema>>({
    resolver: zodResolver(FeatureFlagSchema),
    defaultValues: {
      flagName: "",
      status: "disabled",
    },
  });

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-2"
        onSubmit={form.handleSubmit((data) => mutate(data))}
      >
        <FormField
          name="flagName"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Feature Flag Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                Use lowercase letters, numbers, and hypens only.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="status"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Initial Status</FormLabel>
              <Select defaultValue={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-36">
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
              <FormDescription>
                Determines the initial status of the feature flag.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <SubmitButton className="w-40" isPending={isPending}>
          Create Feature Flag
        </SubmitButton>
      </form>
    </Form>
  );
};
