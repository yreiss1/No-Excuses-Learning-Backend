import request from "supertest";
import { createServer } from "../src/server";

process.env.JWT_SECRET = "test_secret_1234567890";

const collectionMock = jest.fn();
const docMock = jest.fn();
const getMock = jest.fn();
const setMock = jest.fn();
const deleteMock = jest.fn();

jest.mock("../src/modules/firebase", () => {
  return {
    __esModule: true,
    firebaseAuth: { verifyIdToken: jest.fn().mockResolvedValue({ uid: "uid_1", email: "t@example.com", name: "T" }) },
    firebaseDb: {
      collection: (name: string) => collectionMock(name)
    },
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

beforeEach(() => {
  jest.clearAllMocks();

  // Collection mock
  collectionMock.mockReturnValue({
    doc: (id: string) => docMock(id),
    get: () => getMock(),
  });

  // Doc mock
  docMock.mockReturnValue({
    get: () => getMock(),
    set: (data: any, _opts?: any) => setMock(data),
    delete: () => deleteMock(),
  });
});

describe("Firestore users routes", () => {
  it("creates/updates current user via POST", async () => {
    // After set, handler reads the saved doc once
    getMock.mockResolvedValueOnce({ exists: true, id: "uid_1", data: () => ({ uid: "uid_1", fullName: "Test", createdAt: "SERVER_TS", updatedAt: "SERVER_TS" }) });

    const res = await request(app)
      .post("/api/users")
      .set("Authorization", "Bearer firebase_token")
      .send({ fullName: "Test", goals: ["a"], genres: ["b"] });

    expect(res.status).toBe(201);
    expect(setMock).toHaveBeenCalled();
    expect(res.body.user).toMatchObject({ id: "uid_1" });
  });

  it("lists users via GET /api/users", async () => {
    getMock.mockResolvedValueOnce({ docs: [ { id: "u1", data: () => ({ fullName: "T1" }) } ] });

    const res = await request(app)
      .get("/api/users")
      .set("Authorization", "Bearer firebase_token");

    expect(res.status).toBe(200);
    expect(res.body.users.length).toBe(1);
    expect(res.body.users[0]).toMatchObject({ id: "u1", fullName: "T1" });
  });

  it("gets user by id", async () => {
    getMock.mockResolvedValueOnce({ exists: true, id: "u1", data: () => ({ fullName: "T1" }) });

    const res = await request(app)
      .get("/api/users/u1")
      .set("Authorization", "Bearer firebase_token");

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe("u1");
  });

  it("deletes user by id", async () => {
    // First get to check existence
    getMock.mockResolvedValueOnce({ exists: true, id: "u1", data: () => ({ fullName: "T1" }) });

    const res = await request(app)
      .delete("/api/users/u1")
      .set("Authorization", "Bearer firebase_token");

    expect(res.status).toBe(204);
    expect(deleteMock).toHaveBeenCalled();
  });
});
