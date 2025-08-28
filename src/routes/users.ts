import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import admin, { firebaseDb } from "../modules/firebase";

const router = Router();

const upsertUserSchema = z.object({
  fullName: z.string().min(3),
  birthday: z.string().optional(), // ISO date string (YYYY-MM-DD) optional
  skill: z.string().optional(),
  goals: z.array(z.string()).optional(),
  genres: z.array(z.string()).optional()
});

const idParam = z.object({ id: z.string().min(1) }); // uid

// Demo protected route to get current user (from token)
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

function ensureDb(res: any) {
  if (!firebaseDb) {
    res.status(503).json({ error: "Firebase not configured" });
    return null;
  }
  return firebaseDb;
}

// List all users
router.get("/", requireAuth, async (_req, res) => {
  const db = ensureDb(res);
  if (!db) return;
  const snap = await db.collection("users").get();
  const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  res.json({ users });
});

// Create or update current user's profile in Firestore
router.post("/", requireAuth, validate({ body: upsertUserSchema }), async (req, res) => {
  const db = ensureDb(res);
  if (!db) return;

  const { fullName, birthday, skill, goals, genres } = req.body as z.infer<typeof upsertUserSchema>;
  const uid = req.user?.id;
  if (!uid) return res.status(401).json({ error: "Unauthorized" });

  const birthdayValue = birthday ? new Date(birthday) : null;

  const docRef = db.collection("users").doc(uid);
  const data: Record<string, unknown> = {
    uid,
    fullName,
    birthday: birthdayValue,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (typeof skill !== "undefined") data.skill = skill;
  if (typeof goals !== "undefined") data.goals = goals;
  if (typeof genres !== "undefined") data.genres = genres;

  await docRef.set(data, { merge: true });
  const saved = await docRef.get();
  res.status(201).json({ user: { id: saved.id, ...saved.data() } });
});

// Get a user by uid
router.get("/:id", requireAuth, validate({ params: idParam }), async (req, res) => {
  const db = ensureDb(res);
  if (!db) return;
  const uid = req.params.id;
  const doc = await db.collection("users").doc(uid).get();
  if (!doc.exists) return res.status(404).json({ error: "Not found" });
  res.json({ user: { id: doc.id, ...doc.data() } });
});

// Delete a user by uid
router.delete("/:id", requireAuth, validate({ params: idParam }), async (req, res) => {
  const db = ensureDb(res);
  if (!db) return;
  const uid = req.params.id;
  const docRef = db.collection("users").doc(uid);
  const doc = await docRef.get();
  if (!doc.exists) return res.status(404).json({ error: "Not found" });
  await docRef.delete();
  res.status(204).send();
});

export const usersRouter = router;
