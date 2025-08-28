import request from "supertest";
import { createServer } from "../src/server";

process.env.JWT_SECRET = "test_secret_1234567890";
const app = createServer();

describe("Auth flow", () => {
  it("registers and logs in", async () => {
    const unique = Date.now();
    const email = `alice+${unique}@example.com`;
    const password = "password123";
    const name = "Alice";

    const reg = await request(app).post("/api/auth/register").send({ email, password, name });
    expect(reg.status).toBe(201);
    expect(reg.body).toHaveProperty("accessToken");

    const token = reg.body.accessToken as string;

    const me = await request(app).get("/api/users/me").set("Authorization", `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(email);

    const login = await request(app).post("/api/auth/login").send({ email, password });
    expect(login.status).toBe(200);
    expect(login.body).toHaveProperty("accessToken");
  });

  it("Firebase endpoints respond appropriately depending on configuration", async () => {
    const firebaseEmailResponse = await request(app)
      .post("/api/auth/firebase/email-password")
      .send({ email: "test@example.com", password: "password123" });

    // If Firebase is not configured → 503, otherwise an auth error → 401
    expect([401, 503]).toContain(firebaseEmailResponse.status);

    const firebaseGoogleResponse = await request(app)
      .post("/api/auth/firebase/google")
      .send({ idToken: "fake-token" });

    expect([401, 503]).toContain(firebaseGoogleResponse.status);
  });
});
