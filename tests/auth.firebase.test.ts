import request from "supertest";
import { createServer } from "../src/server";

process.env.JWT_SECRET = "test_secret_1234567890";

type VerifyIdTokenMock = (token: string) => Promise<any>;

const verifyIdTokenMock: jest.MockedFunction<VerifyIdTokenMock> = jest.fn();

jest.mock("../src/modules/firebase", () => {
  return {
    __esModule: true,
    firebaseAuth: { verifyIdToken: (token: string) => verifyIdTokenMock(token) },
    firebaseDb: null,
    default: {
      firestore: {
        FieldValue: {
          serverTimestamp: () => "SERVER_TS"
        }
      }
    }
  };
});

const app = createServer();

describe("Firebase auth middleware", () => {
  it("accepts a Firebase bearer token and sets req.user", async () => {
    verifyIdTokenMock.mockResolvedValueOnce({ uid: "uid_123", email: "test@example.com", name: "Tester" });
    const res = await request(app).get("/api/users/me").set("Authorization", "Bearer firebase_token");
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: "uid_123", email: "test@example.com", name: "Tester" });
  });
});

describe("Firebase auth routes", () => {
  it("/api/auth/firebase/google returns JWT when Firebase token valid", async () => {
    verifyIdTokenMock.mockResolvedValueOnce({ uid: "uid_google", email: "g@example.com", name: "G User" });
    const res = await request(app)
      .post("/api/auth/firebase/google")
      .send({ idToken: "valid_firebase_token" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body.user).toMatchObject({ email: "g@example.com", name: "G User" });
  });
});
