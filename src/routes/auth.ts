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

// Firebase email/password authentication
router.post("/firebase/email-password", validate({ body: firebaseEmailPasswordSchema }), async (req, res) => {
  const { email, password } = req.body as z.infer<typeof firebaseEmailPasswordSchema>;
  
  if (!firebaseAuth) {
    return res.status(503).json({ error: "Firebase authentication not configured" });
  }
  
  try {
    // Sign in with Firebase
    const userRecord = await firebaseAuth.getUserByEmail(email);
    
    // For Firebase email/password auth, we need to verify the password
    // This would typically be done on the client side with Firebase Auth SDK
    // Here we'll just check if the user exists in Firebase
    let user = await UserStore.findByEmail(email);
    
    if (!user) {
      // Create user in our local store if they don't exist
      const id = crypto.randomUUID();
      user = await UserStore.create({ 
        id, 
        name: userRecord.displayName || email.split('@')[0], 
        email, 
        passwordHash: "" // Firebase handles password verification
      });
    }
    
    const accessToken = signToken(user.id, user.email, user.name);
    res.json({ user: { id: user.id, name: user.name, email: user.email }, accessToken });
  } catch (error) {
    console.error('Firebase email/password auth error:', error);
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Firebase Google authentication
router.post("/firebase/google", validate({ body: firebaseGoogleSchema }), async (req, res) => {
  const { idToken } = req.body as z.infer<typeof firebaseGoogleSchema>;
  
  if (!firebaseAuth) {
    return res.status(503).json({ error: "Firebase authentication not configured" });
  }
  
  try {
    // Verify the Firebase ID token
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    const { email, name } = decodedToken as { email?: string; name?: string };
    
    if (!email) {
      return res.status(400).json({ error: "Google token missing email" });
    }
    
    let user = await UserStore.findByEmail(email);
    if (!user) {
      // Create user in our local store if they don't exist
      const id = crypto.randomUUID();
      user = await UserStore.create({ 
        id, 
        name: name || email.split('@')[0], 
        email, 
        passwordHash: "" // Google OAuth doesn't use password
      });
    }
    
    const accessToken = signToken(user.id, user.email, user.name);
    res.json({ user: { id: user.id, name: user.name, email: user.email }, accessToken });
  } catch (error) {
    console.error('Firebase Google auth error:', error);
    res.status(401).json({ error: "Invalid Google token" });
  }
});

export const authRouter = router;
