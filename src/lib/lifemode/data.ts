import type {
  LifeMode,
} from "./types";

export const lifeModes: LifeMode[] = [
  {
    id: "student",
    name: "Student",
    focus: "Solo focus, AI coach, selective partners only where useful.",
    tools: ["Goals", "Notes", "Proof", "Exam plan"],
    allowedIntents: ["private", "accountability", "mentor"],
  },
  {
    id: "gym",
    name: "Gym",
    focus: "Workout proof, streaks, trainer discovery, optional meet mode.",
    tools: ["Routine", "Photos", "Streaks", "Challenges"],
    allowedIntents: [
      "private",
      "accountability",
      "practice_partner",
      "mentor",
      "collaborator",
      "professional_network",
      "dating",
    ],
  },
  {
    id: "career",
    name: "Career",
    focus: "Applications, portfolio proof, mock interviews, referrals.",
    tools: ["Jobs", "Resume", "Interview", "Tracker"],
    allowedIntents: [
      "private",
      "practice_partner",
      "mentor",
      "professional_network",
    ],
  },
  {
    id: "business",
    name: "Business",
    focus: "Pitch practice, co-founder search, sales roleplay, execution logs.",
    tools: ["Ideas", "Tasks", "Pitch", "Network"],
    allowedIntents: [
      "private",
      "practice_partner",
      "mentor",
      "collaborator",
      "professional_network",
    ],
  },
  {
    id: "law",
    name: "Law",
    focus: "Case discussion, debate practice, internships, research logs.",
    tools: ["Cases", "Debate", "Mentors", "Internships"],
    allowedIntents: [
      "private",
      "practice_partner",
      "mentor",
      "collaborator",
      "professional_network",
    ],
  },
  {
    id: "creator",
    name: "Creator",
    focus: "Content ideas, posting rhythm, collaborations, growth proof.",
    tools: ["Scripts", "Calendar", "Collabs", "Stats"],
    allowedIntents: [
      "private",
      "accountability",
      "mentor",
      "collaborator",
      "professional_network",
    ],
  },
];
