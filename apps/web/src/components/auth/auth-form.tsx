"use client";

import { toast } from "sonner";
import { z } from "zod";
import type { SignInResponse } from "~/app/api/auth/sign-in/route";
import type { SignUpResponse } from "~/app/api/auth/sign-up/route";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";

import { TypedError } from "~/lib/data/error";
import { useIsMobile } from "~/lib/hooks/use-mobile";
import { useMutation } from "~/lib/hooks/use-mutation";
import { useUserStore } from "~/lib/stores/auth-store";
import { clientRequest } from "~/lib/utils";

import { Button } from "../ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "../ui/drawer";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { SubmitButton } from "../ui/submit-button";
import { ProfileDialog } from "./profile-form";
import { zodResolver } from "@hookform/resolvers/zod";

type AuthFormProps = {
  path: string;
};

export const AuthForm = ({ path }: AuthFormProps) => {
  const searchParams = useSearchParams();

  const [signup, setSignUp] = useState(() => {
    const signup = searchParams.get("signup");

    console.log("SIGNUP", signup);

    return signup === "true";
  });

  const changeForm = useCallback(() => {
    setSignUp(!signup);
  }, [signup]);

  if (signup) return <SignUpForm changeForm={changeForm} />;

  return <SignInForm path={path} changeForm={changeForm} />;
};

const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const SignInForm = ({
  path,
  changeForm,
}: {
  path: string;
  changeForm: () => void;
}) => {
  const router = useRouter();
  const [open, onOpenChange] = useState(false);

  const isMobile = useIsMobile();
  const { setStatus } = useUserStore();

  const form = useForm<z.infer<typeof SignInSchema>>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: signIn,
    onError: (err) => toast(err.message),
    onSuccess: ({ sessionId, ...user }) => {
      setStatus({
        user,
        sessionId,
        authenticated: true,
      });

      if (!user.profile) return void onOpenChange(true);

      if (path !== "/") {
        router.back();

        return void setTimeout(() => {
          router.push(path);
          router.refresh();
        }, 1);
      }

      router.back();
    },
  });

  const handleSubmit = async (data: z.infer<typeof SignInSchema>) => {
    mutate(data);
  };

  const FormData = (
    <Form {...form}>
      <form
        className="flex flex-col gap-2"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <FormField
          name="email"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} autoFocus />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          name="password"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input {...field} type="password" />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex w-full flex-col items-end gap-2">
          <SubmitButton isPending={isPending} className="w-full">
            Sign In
          </SubmitButton>
          <div>
            <Button
              type="button"
              onClick={changeForm}
              className="h-6 w-fit py-0 text-neutral-100"
              variant="link"
            >
              Have an account? Sign Up!
            </Button>
            <Button className="h-6 w-fit py-0 text-neutral-100" variant="link">
              Forgot Password?
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );

  if (isMobile) {
    <>
      {open && <ProfileDialog />}
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Welcome back!</DrawerTitle>
          <DrawerDescription>Please sign in to continue!</DrawerDescription>
        </DrawerHeader>
        {FormData}
      </DrawerContent>
    </>;
  }

  return (
    <>
      {open && <ProfileDialog />}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Welcome back!</DialogTitle>
          <DialogDescription>Please sign in to continue!</DialogDescription>
        </DialogHeader>
        {FormData}
      </DialogContent>
    </>
  );
};

const SignUpSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email(),
  account: z.union([z.literal("user"), z.literal("recruiter")]),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character",
    ),
});

const SignUpForm = ({ changeForm }: { changeForm: () => void }) => {
  const isMobile = useIsMobile();

  const text = {
    title: "Hi There!",
    description:
      "Currently Hireup is free to use for all users. Come and explore the platform at this time(this may change in the future).",
  };

  const form = useForm<z.infer<typeof SignUpSchema>>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      account: "user",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: signUp,
    onSuccess: () => {
      toast("Successfully registered account!");
      changeForm();
    },
  });

  const handleSubmit = async (data: z.infer<typeof SignUpSchema>) => {
    mutate(data);
  };

  const FormData = (
    <Form {...form}>
      <form
        className="flex flex-col gap-2"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <div className="flex w-full gap-2">
          <FormField
            name="firstName"
            control={form.control}
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} autoFocus />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            name="lastName"
            control={form.control}
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <FormField
          name="email"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          name="password"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input {...field} type="password" />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          name="account"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Type</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex items-center justify-start gap-2"
                >
                  <FormItem className="flex flex-row items-center gap-2">
                    <FormControl>
                      <RadioGroupItem value="user" />
                    </FormControl>
                    <FormLabel className="font-normal">User</FormLabel>
                  </FormItem>
                  <FormItem className="flex flex-row items-center gap-2">
                    <FormControl>
                      <RadioGroupItem value="recruiter" />
                    </FormControl>
                    <FormLabel className="font-normal">Recruiter</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex w-full flex-col items-end gap-2">
          <SubmitButton isPending={isPending} className="w-full">
            Sign Up
          </SubmitButton>
          <Button
            type="button"
            onClick={changeForm}
            variant="link"
            className="text-neutral-100"
          >
            Already have an account? Sign In!
          </Button>
        </div>
      </form>
    </Form>
  );

  if (isMobile)
    return (
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{text.title}</DrawerTitle>
          <DrawerDescription>{text.description}</DrawerDescription>
        </DrawerHeader>
        {FormData}
      </DrawerContent>
    );

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{text.title}</DialogTitle>
        <DialogDescription>{text.description}</DialogDescription>
      </DialogHeader>
      {FormData}
    </DialogContent>
  );
};

async function signIn(payload: z.infer<typeof SignInSchema>) {
  const response = await clientRequest<SignInResponse>("/api/auth/sign-in", {
    method: "POST",
    superjson: false,
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.success) throw new TypedError(response.error);

  return response.data;
}

async function signUp(payload: z.infer<typeof SignUpSchema>) {
  const response = await clientRequest<SignUpResponse>("/api/auth/sign-up", {
    method: "POST",
    superjson: false,
    credentials: "omit",
    body: JSON.stringify(payload),
  });

  if (!response.success) throw new TypedError(response.error);

  return response.data;
}
