"use client";

import { ArrowLeft, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createJob } from "~/server/mutations/jobs";

import { useDebounce } from "~/lib/hooks/use-debounce";
import { useIsMobile } from "~/lib/hooks/use-mobile";
import { useMutation } from "~/lib/hooks/use-mutation";
import { useRevalidate } from "~/lib/hooks/use-revalidate";
import { useSession } from "~/lib/stores/auth-store";

import {
  EXPERIENCE,
  JOB_ENVIRONMENTS,
  JOB_TYPES,
  PREDEFINED_SKILLS,
} from "@hireup/common/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, Variants } from "motion/react";
import { Button, buttonVariants } from "~/components/ui/button";
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
import { Textarea } from "~/components/ui/textarea";
import { JOBS } from "~/constants/revalidate";

const NewJobSchema = z
  .object({
    title: z
      .string()
      .min(1, { message: "Title is required" })
      .max(64, { message: "Title is too long" }),
    company: z
      .literal("")
      .or(z.string().min(1, { message: "Company is required" })),
    description: z.string().min(1, { message: "Description is required" }),
    location: z.string().min(1, { message: "Location is required" }),
    type: z.enum(JOB_TYPES),
    skills: z.array(z.string()),
    relativeExperience: z.enum(EXPERIENCE),
    environment: z.enum(JOB_ENVIRONMENTS),
    salaryMin: z.number().min(1, { message: "Salary is required" }),
    salaryMax: z.number().min(0).optional(),
    applicationUrl: z.union([z.string().url(), z.literal("")]),
  })
  .refine(
    (value) => {
      return value.salaryMax !== undefined &&
        value.salaryMax > 0 &&
        value.salaryMax < value.salaryMin
        ? false
        : true;
    },
    { message: "Salary max must be greater than salary min" },
  );

export type NewJob = z.infer<typeof NewJobSchema>;

export const JobForm = () => {
  const router = useRouter();
  const session = useSession();
  const isMobile = useIsMobile();
  const { revalidate } = useRevalidate();

  const form = useForm<NewJob>({
    resolver: zodResolver(NewJobSchema),
    mode: "onBlur",
    defaultValues: {
      title: "",
      company: "",
      description: "",
      location: "",
      type: "full-time",
      environment: "on-site",
      relativeExperience: "none",
      skills: [],
      salaryMin: 0,
      salaryMax: 0,
      applicationUrl: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (job: NewJob) => {
      const response = await createJob({ job });

      if (response instanceof Error) throw response;

      return response;
    },
    onError: (err) => toast(err.message),
    onSuccess: async (data) => {
      toast(data);

      await revalidate({ tags: [`${JOBS}:${session}`] });

      return void router.back();
    },
  });

  const onSubmit = async (data: NewJob) => {
    mutate({
      ...data,
      salaryMax: data.salaryMax === 0 ? undefined : data.salaryMax,
    });
  };

  return (
    <main className="bg-card flex h-full w-full flex-1 flex-col gap-4 rounded-md border pt-4">
      <Form {...form}>
        <form
          className="flex h-full flex-col"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
            <FormField
              name="title"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. Senior Software Engineer"
                    />
                  </FormControl>
                  <FormDescription>
                    The title of the position you are hiring for.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="company"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Company{" "}
                    <span className="text-muted-foreground text-xs">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Acme Inc." />
                  </FormControl>
                  <FormDescription>
                    The name of your company or organization.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="location"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. San Francsico, CA" />
                  </FormControl>
                  <FormDescription>Where the job is located.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
              <FormField
                name="type"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Type</FormLabel>
                    <FormControl>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {JOB_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>The type of employment.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="relativeExperience"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relative Experience</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select your experience level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EXPERIENCE.map((experience) => (
                          <SelectItem key={experience} value={experience}>
                            {experience.charAt(0).toUpperCase() +
                              experience.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The relative amount of experience required for the
                      candidate to succeed for this role.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              name="environment"
              control={form.control}
              render={({ field }) => (
                <FormItem className="">
                  <FormLabel>Job Environment</FormLabel>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-background w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {JOB_ENVIRONMENTS.map((environment) => (
                        <SelectItem key={environment} value={environment}>
                          {environment}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The work environment for this position.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="salaryMin"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Min Salary</FormLabel>
                    <FormControl>
                      <Input
                        min="0"
                        {...field}
                        type="number"
                        value={value || ""}
                        placeholder="e.g. 75000"
                        onChange={(e) => {
                          const val = e.target.value;
                          onChange(val ? Number(val) : undefined);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      The minimum annual salary for this position.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salaryMax"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel className="justify-start">
                      <span>Max Salary</span>
                      <span className="text-muted-foreground text-[14px]">
                        (Optional)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        value={value || ""}
                        placeholder="e.g. 90000"
                        min={form.getValues("salaryMin")}
                        onChange={(e) => {
                          const val = e.target.value;
                          onChange(val ? Number(val) : undefined);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      The maximum annual salary for this position.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              name="applicationUrl"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Application URL</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. https://company.com/careers/apply"
                    />
                  </FormControl>
                  <FormDescription>
                    A direct link where candidates can apply for this position.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="skills"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skills</FormLabel>
                  <SkillInput
                    skills={field.value}
                    addSkill={(skill) => {
                      if (field.value.includes(skill.toLowerCase().trim()))
                        return;

                      field.onChange([
                        ...field.value,
                        skill.toLowerCase().trim(),
                      ]);
                    }}
                    removeSkill={(skill) => {
                      if (!field.value.includes(skill.toLowerCase().trim()))
                        return;

                      field.onChange(
                        field.value.filter(
                          (s) => s !== skill.toLowerCase().trim(),
                        ),
                      );
                    }}
                  />
                </FormItem>
              )}
            />
            <FormField
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="bg-background whitespace-pre-wrap"
                      placeholder="Describe the role, responsibilities, requirements, benefits, etc."
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a detailed description of the job and its
                    requirements.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex items-center justify-end gap-2 border-t p-6">
            {isMobile && (
              <Link
                href="/jobs"
                className={buttonVariants({
                  variant: "outline",
                  className: "border-none",
                })}
              >
                <ArrowLeft /> Back
              </Link>
            )}
            <SubmitButton className="w-28" isPending={isPending}>
              Create Job
            </SubmitButton>
          </div>
        </form>
      </Form>
    </main>
  );
};

type SkillsInputProps = {
  skills: string[];
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
};

const SkillInput = ({ skills, addSkill, removeSkill }: SkillsInputProps) => {
  const [active, setActive] = useState<number>(-1);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const listBoxId = useId();

  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const notFoundRef = useRef<HTMLButtonElement>(null);

  const activeDescendantId = active >= 0 ? `skill-option-${active}` : undefined;

  const debounceInput = useDebounce(input, 250);

  const handleSelectSkill = (skill: string) => {
    addSkill(skill);
    setIsOpen(false);
    setInput("");
    setActive(-1);

    inputRef.current?.focus();
  };

  const suggestions = useMemo(() => {
    if (debounceInput.length < 1) return [];

    const input = debounceInput.toLowerCase();

    return PREDEFINED_SKILLS.filter(
      (skill) => skill.toLowerCase().includes(input) && !skills.includes(skill),
    );
  }, [skills, debounceInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((prev) => (prev + 1) % suggestions.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive(
          (prev) => (prev - 1 + suggestions.length) % suggestions.length,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (active >= 0 && active < suggestions.length) {
          handleSelectSkill(suggestions[active]!);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setActive(-1);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    setIsOpen(debounceInput.length > 0);

    if (debounceInput.length > 0 && suggestions.length === 0) {
      notFoundRef.current?.focus();

      return void setActive(-1);
    }

    if (active >= suggestions.length) return void setActive(0);

    return;
  }, [suggestions, debounceInput, active]);

  useEffect(() => {
    if (isOpen && active >= 0 && listboxRef.current) {
      const activeOptionElement = document.getElementById(
        `skill-option-${active}`,
      );

      if (activeOptionElement) {
        activeOptionElement.scrollIntoView({
          block: "nearest",
        });
      }
    }
  }, [active, isOpen]);

  return (
    <div className="relative">
      <div className="bg-background border-input relative flex w-full flex-col gap-2 rounded-md border">
        {skills.length > 0 && (
          <div className="flex flex-wrap items-start justify-start gap-2 px-2 pt-2">
            {skills.map((skill) => (
              <Button
                key={skill}
                type="button"
                variant="secondary"
                onClick={() => removeSkill(skill)}
                className="items-center justify-between"
              >
                {skill} <X className="size-4" />
              </Button>
            ))}
          </div>
        )}
        <Input
          value={input}
          ref={inputRef}
          role="combobox"
          onKeyDown={handleKeyDown}
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={listBoxId}
          placeholder="Type a skill..."
          aria-activedescendant={activeDescendantId}
          onChange={(e) => setInput(e.target.value)}
          className="border-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            exit="exit"
            role="listbox"
            ref={listboxRef}
            initial="initial"
            animate="animate"
            variants={variants}
            onMouseDown={(e) => e.preventDefault()}
            className="bg-card border-input absolute flex max-h-72 w-full flex-col gap-1 overflow-y-auto rounded-md border p-2"
            transition={{ type: "spring", duration: 0.25, bounce: 0 }}
          >
            {suggestions.length < 1 ? (
              <Button
                type="button"
                role="option"
                variant="ghost"
                ref={notFoundRef}
                className="hover:bg-primary w-full justify-start text-left transition-colors duration-200"
                tabIndex={-1}
                onClick={() => handleSelectSkill(input)} // Add onClick handler
              >
                Add "{debounceInput.trim()}" as a skill
              </Button>
            ) : (
              suggestions.map((sug, i) => (
                <Button
                  key={i}
                  type="button"
                  role="option"
                  tabIndex={-1}
                  variant="ghost"
                  id={`skill-option-${i}`}
                  aria-selected={i === active}
                  className={`hover:bg-primary w-full justify-start text-left transition-colors duration-200 ${
                    i === active ? "bg-primary" : ""
                  }`}
                  onClick={() => handleSelectSkill(sug)}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(-1)}
                >
                  {sug}
                </Button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <FormDescription className="mt-2">
        Enter skills that are relavent to the job. You can add as many skills
        that are required for the role.
      </FormDescription>
    </div>
  );
};

const variants: Variants = {
  initial: {
    y: 5,
    opacity: 0,
  },
  animate: {
    y: 10,
    opacity: 1,
  },
  exit: {
    y: 5,
    opacity: 0,
    transition: {
      duration: 0.1,
    },
  },
};
