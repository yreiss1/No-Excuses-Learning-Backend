import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { LessonCache } from "../store/lessons";

const router = Router();


router.get("/today", requireAuth, (_req, res) => {
  const { date, lessons } = LessonCache.getToday();
  res.json({ date, lessons });
});

router.get("/all", requireAuth, (_req, res) => {
    const lessons = LessonCache.getAll();
    res.json(lessons);
  });

export const challengesRouter = router;