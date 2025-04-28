import { X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import type { Variants } from "motion/react";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { notFound, useRouter } from "next/navigation";

import { createProfile } from "~/server/mutations/profile";
import { deleteFiles } from "~/server/mutations/uploadthing";

import { useDebounce } from "~/lib/hooks/use-debounce";
import { useMutation } from "~/lib/hooks/use-mutation";
import { cn } from "~/lib/utils";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { SubmitButton } from "../ui/submit-button";
import { Textarea } from "../ui/textarea";
import { UploadButton } from "../ui/uploadthing";
import { EXPERIENCE, PREDEFINED_SKILLS } from "@hireup/common/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "motion/react";

const ProfileSchema = z.object({
  bio: z.string().max(500, { message: "bio cannot exceed 500 caharacters" }),
  experience: z.union([z.enum(EXPERIENCE), z.literal("")]),
  location: z
    .string()
    .max(64, { message: "location cannot exceed 64 characters" }),
  skills: z.array(z.string()),
  portfolioUrl: z.string().url().or(z.literal("")),
  resume: z
    .object({
      key: z.string(),
      name: z.string(),
      url: z.string().url(),
    })
    .optional(),
});

export type Profile = z.infer<typeof ProfileSchema>;

const MAX_BIO_LENGTH = 500;

export const ProfileDialog = () => {
  const router = useRouter();

  const skip = useCallback(() => {
    router.back();

    return void setTimeout(() => router.push("/feed"), 0);
  }, []);

  const form = useForm<Profile>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      bio: "",
      skills: [],
      location: "",
      experience: "",
      portfolioUrl: "",
      resume: undefined,
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: Profile) => {
      const result = await createProfile(data);

      if (!result.success) throw new Error(result.error);

      return result.data;
    },
    onError: (err) => toast(err.message),
    onSuccess: (data) => {
      toast(data);

      skip();
    },
  });

  const handleSubmit = async (data: Profile) => {
    await mutate(data);
  };

  return (
    <AlertDialog defaultOpen>
      <AlertDialogContent className="max-h-[90%] overflow-x-hidden overflow-y-auto sm:max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Profile Setup</AlertDialogTitle>
          <AlertDialogDescription>
            Please complete your profile setup to continue
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Form {...form}>
          <form
            className="flex flex-col gap-2"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <FormField
              name="bio"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Tell us about yourself"
                      className="max-h-56 min-h-[120px]"
                      maxLength={MAX_BIO_LENGTH}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum {MAX_BIO_LENGTH} characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="experience"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Experience</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
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
              name="location"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Your location" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="portfolioUrl"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://johndoe.me" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="resume"
              control={form.control}
              render={({ field }) => (
                <FormItem className="group items-start">
                  {!field.value && (
                    <FormControl>
                      <UploadButton
                        endpoint="resumeUploader"
                        content={{ button: "Upload Resume" }}
                        appearance={{
                          allowedContent: "hidden",
                          container: "items-start -z-10 group-hover:z-0",
                          button:
                            "outline-none focus-within:ring-primary focus-within:ring-offset-background data-[state=disabled]:bg-primary/50 data-[state=uploading]:after:bg-primary data-[state=ready]:bg-primary data-[state=uploading]:bg-primary data-[state=readying]:bg-primary",
                        }}
                        config={{ cn: cn, mode: "auto" }}
                        onClientUploadComplete={(files) => {
                          const file = files[0];

                          if (!file) return;

                          field.onChange({
                            key: file.key,
                            name: file.name,
                            url: file.ufsUrl,
                          });
                        }}
                      />
                    </FormControl>
                  )}
                  {!!field.value && (
                    <FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-fit transition-colors"
                        onClick={async () => {
                          await deleteFiles([field.value!.key]);

                          field.onChange(undefined);
                        }}
                      >
                        {field.value.name} <X className="size-4" />
                      </Button>
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <AlertDialogFooter className="sm:justify-between">
              <SubmitButton isPending={isPending}>Continue</SubmitButton>
              <Button
                type="button"
                variant="link"
                onClick={skip}
                className="text-muted-foreground transition-colors duration-300 hover:text-neutral-100"
              >
                skip
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
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
        e.preventDefault(); // Prevent cursor move
        setActive((prev) => (prev + 1) % suggestions.length);
        break;
      case "ArrowUp":
        e.preventDefault(); // Prevent cursor move
        setActive(
          (prev) => (prev - 1 + suggestions.length) % suggestions.length,
        );
        break;
      case "Enter":
        e.preventDefault(); // Prevent form submit if any
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

    console.log(debounceInput.length > 0 && suggestions.length === 0);

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
    <div>
      <div className="relative mt-2 w-full">
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
          className="focus-visible:ring-0 focus-visible:ring-offset-0"
        />
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
      </div>
      {skills.length > 0 && (
        <div className="mt-2 flex flex-wrap items-start justify-start gap-2">
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
