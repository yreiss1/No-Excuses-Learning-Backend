import { parentPort } from "worker_threads";
import { randomUUID } from "crypto";
import { Level, Genre, Skill } from "../types/types";

type QuestionOption = {
  text: string;
  isCorrect: boolean;
};

type Lesson = {
  id: string;
  type: string;
  title: string;
  summary: string;
  options: QuestionOption[];
  difficulty: number;
  level: Level;
  genres: Genre[];
  skills: Skill[];
};

const lessonTypes = ["LickLearn", "IntervalTraining", "ImprovTraining", "RhythmTraining"] as const;
const levels: Level[] = [
  "beginner",
  "late-beginner",
  "intermediate",
  "late-intermediate",
  "advanced",
  "pro",
];
const genres: Genre[] = [
  "jazz",
  "blues",
  "rock",
  "funk",
  "latin",
  "pop",
  "metal",
  "classical",
  "country",
  "reggae",
  "soul",
  "hip-hop",
  "folk",
];
const skills: Skill[] = ["theory", "improvisation", "rhythm", "ear-training"];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sample<T>(arr: T[], count: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < count && copy.length) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

function createOptions(): QuestionOption[] {
  const correctIndex = randomInt(0, 3);
  return new Array(4).fill(null).map((_, idx) => ({
    text: `Option ${idx + 1}`,
    isCorrect: idx === correctIndex,
  }));
}

function generateLesson(i: number): Lesson {
  const type = pick(lessonTypes);
  const difficulty = randomInt(1, 10);
  const level = pick(levels);
  const g = sample([...genres], randomInt(1, 3));
  return {
    id: randomUUID(),
    type,
    title: `${type} #${i + 1}`,
    summary: `Daily ${type} challenge`,
    options: createOptions(),
    difficulty,
    level,
    genres: g,
    skills: sample([...skills], randomInt(1, 3)),
  };
}

function generateDailyLessons(): { date: string; lessons: Lesson[] } {
  const date = new Date().toISOString().slice(0, 10);
  const count = 6;
  const lessons = new Array(count).fill(null).map((_, i) => generateLesson(i));
  return { date, lessons };
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runForever() {
  // On start, generate immediately
  post(generateDailyLessons());

  while (true) {
    const now = new Date();
    const next = new Date(now);
    next.setUTCHours(24, 0, 0, 0); // next UTC midnight
    const waitMs = next.getTime() - now.getTime();
    await sleep(waitMs);
    post(generateDailyLessons());
  }
}

function post(payload: { date: string; lessons: Lesson[] }) {
  parentPort?.postMessage({ type: "daily-lessons", payload });
}

runForever().catch((err) => {
  parentPort?.postMessage({ type: "error", error: { message: String(err?.message ?? err) } });
});


