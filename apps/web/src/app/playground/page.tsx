"use client";

import { X } from "lucide-react";
import type { Variants } from "motion/react";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { useDebounce } from "~/lib/hooks/use-debounce";

import { PREDEFINED_SKILLS } from "@hireup/common/constants";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export default function PlaygroundPage() {
  return (
    <main className="flex min-h-screen w-full flex-col gap-2 overflow-y-auto p-2">
      <SkillInput />
    </main>
  );
}

const SkillInput = () => {
  const [skills, setSkills] = useState<string[]>([]);
  const [active, setActive] = useState<number>(-1);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const listBoxId = useId();

  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  const activeDescendantId = active >= 0 ? `skill-option-${active}` : undefined;

  const debounceInput = useDebounce(input, 250);

  const handleSelectSkill = (skill: string) => {
    setSkills((prev) => [...prev, skill]);
    setInput(""); // Clear input after selection
    setIsOpen(false);
    setActive(-1);
    inputRef.current?.focus(); // Return focus to input
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

    if (debounceInput.length > 0 && suggestions.length === 0)
      return void setActive(-1);

    if (active >= suggestions.length) return void setActive(-1);

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
      {skills.length > 0 && (
        <div className="flex flex-wrap items-start justify-start gap-2">
          {skills.map((skill) => (
            <Button key={skill} variant="secondary">
              {skill} <X className="size-4" />
            </Button>
          ))}
        </div>
      )}
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
                <div>Not Found</div>
              ) : (
                suggestions.map((sug, i) => (
                  <Button
                    key={i}
                    id={`skill-option-${i}`}
                    role="option"
                    aria-selected={i === active}
                    variant="ghost"
                    className={`hover:bg-primary w-full justify-start text-left transition-colors duration-200 ${
                      i === active ? "bg-primary" : ""
                    }`}
                    tabIndex={-1}
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
