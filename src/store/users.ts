export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  level?: string;
  genres?: string[];
  goals?: string[];
  skills?: object;
};

import { firebaseDb } from "../modules/firebase";

const users = new Map<string, User>();

const COLLECTION_NAME = "users";

async function getCollection() {
  return firebaseDb?.collection(COLLECTION_NAME) ?? null;
}

export const UserStore = {
  async findByEmail(email: string): Promise<User | undefined> {
    const col = await getCollection();
    if (!col) {
      for (const u of users.values()) if (u.email.toLowerCase() === email.toLowerCase()) return u;
      return undefined;
    }
    const snap = await col.where("email", "==", email).limit(1).get();
    if (snap.empty) return undefined;
    const doc = snap.docs[0];
    return { id: doc.id, ...(doc.data() as Omit<User, "id">) } as User;
  },
  async findById(id: string): Promise<User | undefined> {
    const col = await getCollection();
    if (!col) {
      return users.get(id);
    }
    const doc = await col.doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...(doc.data() as Omit<User, "id">) } as User;
  },
  async all(): Promise<Omit<User, "passwordHash">[]> {
    const col = await getCollection();
    if (!col) {
      return Array.from(users.values()).map(({ passwordHash, ...u }) => u);
    }
    const snap = await col.get();
    return snap.docs.map((d) => {
      const { passwordHash, ...rest } = d.data() as User;
      const { id: _omitId, ...restNoId } = rest as any;
      return { id: d.id, ...restNoId } as Omit<User, "passwordHash">;
    });
  },
  async create(u: User): Promise<User> {
    const col = await getCollection();
    if (!col) {
      users.set(u.id, u);
      return u;
    }
    const docData: Record<string, unknown> = {
      name: u.name,
      email: u.email,
      passwordHash: u.passwordHash,
    };
    if (typeof u.level !== "undefined") docData.level = u.level;
    if (typeof u.genres !== "undefined") docData.genres = u.genres;
    if (typeof u.goals !== "undefined") docData.goals = u.goals;
    if (typeof u.skills !== "undefined") docData.skills = u.skills;

    await col.doc(u.id).set(docData);
    return u;
  },
  async delete(id: string): Promise<boolean> {
    const col = await getCollection();
    if (!col) {
      return users.delete(id);
    }
    await col.doc(id).delete();
    return true;
  },
};
