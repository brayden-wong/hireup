import {
  FEATURE_FLAGS,
  FeatureFlag,
  FeatureFlagStatus,
  PREDEFINED_SKILLS,
} from "@hireup/common/constants";

import { schema, database as db } from "~/packages/db";

export async function main() {
  const data = await db.query.featureFlags.findMany();
  const existingSkills = await db.query.skills.findMany({
    where: (skills, { eq }) => eq(skills.predefined, true),
  });

  if (
    data.length === FEATURE_FLAGS.length &&
    existingSkills.length === PREDEFINED_SKILLS.length
  )
    return true;

  await db.transaction(async (tx) => {
    await tx
      .insert(schema.featureFlags)
      .values(
        FEATURE_FLAGS.map((flag) => ({
          name: flag,
          status: getStatus(flag),
        }))
      )
      .onConflictDoNothing();

    await tx
      .insert(schema.skills)
      .values(
        Array.from(new Set(PREDEFINED_SKILLS)).map((skill) => ({
          name: skill.toLowerCase().trim(),
          predefined: true,
        }))
      )
      .onConflictDoNothing();
  });
}

await main();

function getStatus(flag: FeatureFlag): FeatureFlagStatus {
  switch (flag) {
    case "conversations":
      return "enabled";
    case "jobs":
      return "soon";
    default:
      return "disabled";
  }
}
