import { Router } from "express";
import { authRouter } from "./auth";
import { usersRouter } from "./users";
import { challengesRouter } from "./challenges";

const router = Router();

router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/challenges", challengesRouter);

export const routes = router;
