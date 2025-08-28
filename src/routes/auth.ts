import bcrypt from "bcryptjs";
import { Router } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { env } from "../modules/env";
import { firebaseAuth } from "../modules/firebase";
import { UserStore } from "../store/users";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const firebaseEmailPasswordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const firebaseGoogleSchema = z.object({
  idToken: z.string().min(10),
});

function signToken(id: string, email: string, name: string) {
  return jwt.sign({ email, name }, env.JWT_SECRET, {
    subject: id,
    expiresIn: env.JWT_EXPIRES_IN,
  } as SignOptions);
}

// Traditional email/password registration
router.post("/register", validate({ body: registerSchema }), async (req, res) => {
  const { name, email, password } = req.body as z.infer<typeof registerSchema>;
  if (await UserStore.findByEmail(email)) {
    return res.status(409).json({ error: "Email already registered" });
  }
  const id = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await UserStore.create({ id, name, email, passwordHash });
  const accessToken = signToken(user.id, user.email, user.name);
  res.status(201).json({ user: { id, name, email }, accessToken });
});

// Traditional email/password login
router.post("/login", validate({ body: loginSchema }), async (req, res) => {
  const { email, password } = req.body as z.infer<typeof loginSchema>;
  const user = await UserStore.findByEmail(email);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const accessToken = signToken(user.id, user.email, user.name);
  res.json({ user: { id: user.id, name: user.name, email: user.email }, accessToken });
});

export const authRouter = router;
