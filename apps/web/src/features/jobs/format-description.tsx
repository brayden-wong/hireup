import { memo } from "react";

type FormattedDescriptionProps = {
  description: string;
};

export const FormattedDescription = memo(
  ({ description }: FormattedDescriptionProps) => {
    return description.split("\n").map((line, i) => (
      <p key={i} className={line.trim() === "" ? "h-4" : "mb-2"}>
        {line}
      </p>
    ));
  },
);

FormattedDescription.displayName = "FormattedDescription";
