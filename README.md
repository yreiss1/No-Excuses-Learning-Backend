# Node.js + TypeScript Backend Boilerplate (with JWT Auth & Firebase)

Production-ready Express server in TypeScript with:
- JWT authentication (traditional email/password + Firebase)
- Firebase Authentication (email/password + Google OAuth)
- Zod request validation middleware (`validate({ body, query, params })`)
- Env validation with Zod
- Pino logging
- Jest + Supertest
- ESLint + Prettier
- Docker

> Users are stored in-memory for demo purposes. Swap in a real DB (e.g., Prisma + Postgres) for production.

## Quick Start
```bash
npm install
cp .env.example .env
# set Firebase configuration in .env (see Firebase Setup below)
npm run dev
```

## Firebase Setup
1. Create a Firebase project at https://console.firebase.google.com/
2. Go to Project Settings > Service Accounts
3. Click "Generate new private key" to download your service account JSON
4. Add the following to your `.env` file:
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

## Auth Endpoints

### Traditional Email/Password
- `POST /api/auth/register` `{ name, email, password }` (min password length 8) → `{ user, accessToken }`
- `POST /api/auth/login` `{ email, password }` → `{ user, accessToken }`

### Firebase Authentication
- `POST /api/auth/firebase/email-password` `{ email, password }` → `{ user, accessToken }`
- `POST /api/auth/firebase/google` `{ idToken }` → `{ user, accessToken }`

### User Info
- `GET /api/users/me` (Bearer token) → current user

## Example (with curl)
```bash
# Traditional Register
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"password123"}'

# Traditional Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}' | jq -r .accessToken)

# Firebase Email/Password (requires Firebase client SDK on frontend)
curl -s -X POST http://localhost:3000/api/auth/firebase/email-password \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}'

# Firebase Google (requires Firebase client SDK on frontend)
curl -s -X POST http://localhost:3000/api/auth/firebase/google \
  -H "Content-Type: application/json" \
  -d '{"idToken":"firebase-id-token-from-client"}'

# Who am I
curl -s http://localhost:3000/api/users/me -H "Authorization: Bearer $TOKEN"
```

## Request Validation
Use the `validate` middleware with Zod schemas:
```ts
import { z } from "zod";
import { validate } from "../middleware/validate";

const createThing = z.object({ title: z.string().min(1) });
router.post("/things", validate({ body: createThing }), (req, res) => {
  // req.body is parsed/validated
  res.status(201).json({ ok: true });
});
```

## Protected Routes
Protect any route with `requireAuth`:
```ts
import { requireAuth } from "../middleware/auth";
router.get("/secret", requireAuth, (_req, res) => res.json({ secret: 42 }));
```

## Testing
```bash
npm test
```

## Docker
```bash
docker compose up --build
# open http://localhost:3000/health
```

## Next Steps (optional)
- Replace in-memory store with Prisma + Postgres
- Add refresh tokens & role-based access control
- Add rate limiting and CORS origin allowlist
- Add CI (GitHub Actions) and OpenAPI docs
