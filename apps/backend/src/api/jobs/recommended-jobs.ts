import { Experience } from "@hireup/common/constants";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { database, db, schema } from "~/packages/db";

export async function getRecommendedJobs(userId: number, limit = 20) {
  // 1. Get user's profile data
  const userProfile = await database.query.profiles.findFirst({
    where: eq(schema.profiles.userId, userId),
    with: {
      user: true,
      skills: {
        with: {
          skill: true,
        },
      },
    },
  });

  if (!userProfile) {
    throw new Error("User profile not found");
  }

  // 2. Get user's skill IDs and preferences
  const userSkillIds = userProfile.skills.map((us) => us.skillId);

  // 3. Get user's job preferences (you'd need to add this to your schema)
  // For now, we'll assume preferences from previous applications
  const userPreviousApplications = await database.query.applicants.findMany({
    where: eq(schema.applicants.userId, userId),
    with: {
      job: true,
    },
  });

  // Extract preferences from previous applications
  const preferredTypes = new Set(
    userPreviousApplications.map((app) => app.job.type)
  );
  const preferredEnvironments = new Set(
    userPreviousApplications.map((app) => app.job.environment)
  );

  // 4. Get all active jobs
  const allJobs = await database.query.jobs.findMany({
    columns: {
      id: true,
      slug: true,
      type: true,
      title: true,
      company: true,
      location: true,
      salaryMax: true,
      salaryMin: true,
      environment: true,
      applicationUrl: true,
      relativeExperience: true,
      createdAt: true,
    },
    where: eq(schema.jobs.isActive, true),
    with: {
      skills: {
        with: {
          skill: true,
        },
      },
      applicants: { columns: { userId: true } },
    },
  });

  // 5. Calculate match score for each job
  const scoredJobs = allJobs.map((job) => {
    // a. Skills match score with relevance weighting (0-100)
    const jobSkillIds = job.skills.map((js) => js.skillId);
    const matchingSkills = userSkillIds.filter((skillId) =>
      jobSkillIds.includes(skillId)
    );

    // Calculate weighted skill score
    // Skills that are more rare in the job pool get higher weights
    let skillScore = 0;
    if (jobSkillIds.length > 0) {
      const skills = allJobs.reduce<number[]>(
        (acc, job) => [...acc, ...job.skills.map((js) => js.skill.id)],
        []
      );

      const skillWeights = calculateSkillWeights(jobSkillIds, skills);

      // Sum of weights for matched skills divided by sum of all weights
      const matchedWeightSum = matchingSkills.reduce(
        (sum, skillId) => sum + (skillWeights[skillId] || 1),
        0
      );
      const totalWeightSum = jobSkillIds.reduce(
        (sum, skillId) => sum + (skillWeights[skillId] || 1),
        0
      );

      skillScore = (matchedWeightSum / totalWeightSum) * 100;
    }

    // b. Experience match score (0-100)
    const experienceScore = calculateExperienceScore(
      userProfile.experience,
      job.relativeExperience ?? "none"
    );

    // // c. Location proximity score (0-100)
    // const locationScore = calculateLocationScore(
    //   userProfile.location,
    //   job.location
    // );

    // d. Job Type & Environment Preference Score (0-100)
    const typeScore = preferredTypes.has(job.type) ? 100 : 50;
    const environmentScore = preferredEnvironments.has(job.environment)
      ? 100
      : 50;
    const preferencesScore = (typeScore + environmentScore) / 2;

    // Calculate weighted total score
    // Weights: skills (40%), experience (20%), location (15%),
    // preferences (15%), collaborative (10%)
    const totalScore =
      skillScore * 0.4 + experienceScore * 0.2 + preferencesScore * 0.15;

    return {
      ...job,
      matchScore: totalScore,
      skillMatchScore: skillScore,
      experienceMatchScore: experienceScore,
      preferencesMatchScore: preferencesScore,
    };
  });

  // 6. Sort jobs by score (descending) and return top results
  return scoredJobs.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
}

// Helper function to calculate skill weights based on rarity
function calculateSkillWeights(jobSkillIds: number[], skills: number[]) {
  const skillFrequency: Record<number, number> = {};

  // Count how many jobs require each skill
  // allJobs.forEach((job) => {
  //   const skills = job.skills.map((js) => js.id) ?? [];
  //   skills.forEach((skillId) => {
  //     skillFrequency[skillId] = (skillFrequency[skillId] || 0) + 1;
  //   });
  // });

  skills.forEach((skillId) => {
    skillFrequency[skillId] = (skillFrequency[skillId] || 0) + 1;
  });

  // Calculate weights (rarer skills get higher weights)
  const weights: Record<number, number> = {};
  const totalJobs = skills.length;

  jobSkillIds.forEach((skillId) => {
    const frequency = skillFrequency[skillId] || 1;
    // Inverse document frequency approach: log(totalJobs / frequency)
    weights[skillId] = Math.log(totalJobs / frequency) + 1; // +1 to ensure minimum weight is 1
  });

  return weights;
}

// Helper function to calculate experience match score
function calculateExperienceScore(
  userExperience: Experience,
  jobExperience: Experience
): number {
  const levels: Experience[] = ["none", "junior", "mid", "senior", "manager"];

  const userLevel = levels.indexOf(userExperience);
  const jobLevel = levels.indexOf(jobExperience);

  // Perfect match
  if (userLevel === jobLevel) return 100;

  // User is overqualified
  if (userLevel > jobLevel) {
    const gap = userLevel - jobLevel;
    return Math.max(85 - gap * 5, 80); // Slight penalty for being too overqualified
  }

  // User is underqualified (score based on how close they are)
  const gap = jobLevel - userLevel;
  if (gap === 1) return 60; // Just one level below
  if (gap === 2) return 40; // Two levels below
  if (gap === 3) return 20; // Three levels below
  return 10; // More than three levels below
}
