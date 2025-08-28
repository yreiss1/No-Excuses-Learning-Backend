import path from "path";
import { Worker } from "worker_threads";
import logger from "../modules/logger";
import { LessonCache, Lesson } from "../store/lessons";

function resolveWorkerPath() {
  // In dev we run ts-node-dev, so use the TS file; in prod, use dist
  const isTs = __filename.endsWith(".ts") || process.env.TS_NODE_DEV;
  if (isTs) return path.join(process.cwd(), "src", "worker", "dailyLessons.worker.ts");
  return path.join(process.cwd(), "dist", "worker", "dailyLessons.worker.js");
}

export function startDailyLessonsWorker() {
  const workerPath = resolveWorkerPath();
  const worker = new Worker(workerPath);

  worker.on("message", (msg: any) => {
    if (msg?.type === "daily-lessons") {
      const { date, lessons } = msg.payload as { date: string; lessons: Lesson[] };
      LessonCache.set(date, lessons);
      logger.info({ date, count: lessons.length }, "Daily lessons updated");
    } else if (msg?.type === "error") {
      logger.error({ err: msg.error }, "Daily lessons worker error");
    }
  });

  worker.on("error", (err) => {
    logger.error({ err }, "Daily lessons worker crashed");
  });

  worker.on("exit", (code) => {
    if (code !== 0) {
      logger.warn({ code }, "Daily lessons worker exited unexpectedly; restarting in 5s");
      setTimeout(() => startDailyLessonsWorker(), 5000);
    }
  });

  return worker;
}


