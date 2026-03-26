// ─────────────────────────────────────────────────────────────────────────────
// authRoutes.test.ts
//
// ΕΛΛΗΝΙΚΗ ΕΠΕΞΗΓΗΣΗ:
// Αυτό το αρχείο περιέχει integration tests για τα 3 endpoints του authRoutes:
//   - POST /auth/signup
//   - POST /auth/login
//   - POST /auth/refresh
//
// ΔΙΑΦΟΡΑ από τα unit tests του controller:
//   - Εδώ δοκιμάζουμε ολόκληρο το HTTP layer (routes + error handling).
//   - Χρησιμοποιούμε supertest για να κάνουμε πραγματικά HTTP requests
//     στον Express router, χωρίς να ανοίξουμε αληθινό server.
//   - Κάνουμε mock ΜΟΝΟ τον controller — οι routes δεν χρειάζεται να
//     ξέρουν πώς δουλεύει ο controller εσωτερικά.
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest"; // κάνει HTTP requests χωρίς πραγματικό server
import express from "express";
import authRouter from "../routes/authRoutes";
import * as authController from "../controllers/authController";
import { AppError } from "../controllers/authController";

// ─── Mock του controller ──────────────────────────────────────────────────────
// ΓΙΑΤΙ mock τον controller εδώ:
// Τα route tests ελέγχουν ΜΟΝΟ τη συμπεριφορά του router:
//   - Σωστά HTTP status codes;
//   - Σωστό JSON response;
//   - Σωστός χειρισμός errors;
// Δεν μας ενδιαφέρει η λογική του controller — αυτή δοκιμάζεται στο
// authController.test.ts. Διαχωρίζουμε ευθύνες.
jest.mock("../controllers/authController", () => ({
  signup:   jest.fn(),
  login:    jest.fn(),
  refresh:  jest.fn(),
  AppError: jest.requireActual("../controllers/authController").AppError,
  // ΓΙΑΤΙ requireActual για AppError:
  // Το AppError χρησιμοποιείται μέσα στον handleError του router.
  // Αν το κάνουμε mock, ο router δεν θα μπορεί να κάνει
  // `err instanceof AppError` σωστά.
}));

// ─── Ρύθμιση Express app για tests ───────────────────────────────────────────
// ΓΙΑΤΙ φτιάχνουμε mini Express app:
// Δεν θέλουμε να τρέξουμε ολόκληρο το index.ts με middlewares, DB connections κλπ.
// Φτιάχνουμε ελάχιστο app με μόνο τον auth router.
const app = express();
app.use(express.json());           // middleware για να διαβάζει JSON body από requests
app.use("/auth", authRouter);      // συνδέουμε τον router στο path /auth

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockSignup  = authController.signup  as jest.Mock;
const mockLogin   = authController.login   as jest.Mock;
const mockRefresh = authController.refresh as jest.Mock;

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/signup
// ─────────────────────────────────────────────────────────────────────────────

describe("POST /auth/signup", () => {

  beforeEach(() => jest.clearAllMocks());

  it("επιστρέφει 201 και τα στοιχεία του νέου χρήστη επί επιτυχίας", async () => {
    // Arrange — ο controller επιστρέφει τον νέο χρήστη
    mockSignup.mockResolvedValue({
      id:    "user-1",
      email: "new@example.com",
      role:  "USER",
    });

    // Act — στέλνουμε POST request με supertest
    const res = await request(app)
      .post("/auth/signup")
      .send({ email: "new@example.com", password: "secret123" });

    // Assert
    expect(res.status).toBe(201); // 201 Created — σωστό για δημιουργία χρήστη
    expect(res.body).toEqual({ id: "user-1", email: "new@example.com", role: "USER" });
  });

  it("επιστρέφει 409 αν το email υπάρχει ήδη", async () => {
    // Arrange — ο controller πετάει AppError 409
    mockSignup.mockRejectedValue(new AppError("Email already registered.", 409));

    const res = await request(app)
      .post("/auth/signup")
      .send({ email: "taken@example.com", password: "secret123" });

    // Assert — ο handleError πρέπει να διαβάσει το status από το AppError
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ message: "Email already registered." });
  });

  it("επιστρέφει 400 αν ο κωδικός είναι πολύ μικρός", async () => {
    mockSignup.mockRejectedValue(
      new AppError("Password must be at least 6 characters.", 400)
    );

    const res = await request(app)
      .post("/auth/signup")
      .send({ email: "test@example.com", password: "abc" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/6 characters/); // ελέγχουμε αν περιέχει "6 characters"
  });

  it("επιστρέφει 500 για απροσδόκητο σφάλμα", async () => {
    // ΓΙΑΤΙ αυτό το test:
    // Ο handleError έχει fallback για μη-AppError exceptions.
    // Π.χ. αν η βάση δεδομένων είναι κάτω, ο χρήστης πρέπει να πάρει 500.
    mockSignup.mockRejectedValue(new Error("Database connection lost"));

    const res = await request(app)
      .post("/auth/signup")
      .send({ email: "test@example.com", password: "secret123" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "An unexpected error occurred." });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/login
// ─────────────────────────────────────────────────────────────────────────────

describe("POST /auth/login", () => {

  beforeEach(() => jest.clearAllMocks());

  it("επιστρέφει 200 και tokens επί επιτυχίας", async () => {
    mockLogin.mockResolvedValue({
      accessToken:  "access_abc",
      refreshToken: "refresh_xyz",
      user: { id: "user-1", email: "test@example.com", role: "USER" },
    });

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@example.com", password: "secret123" });

    // ΓΙΑΤΙ 200 και ΟΧΙ 201:
    // Login ΔΕΝ δημιουργεί νέο resource — απλώς επαληθεύει ταυτότητα.
    // Το 201 είναι λάθος εδώ (bug που είχε διορθωθεί στο authRoutes).
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBe("access_abc");
    expect(res.body.refreshToken).toBe("refresh_xyz");
    expect(res.body.user.email).toBe("test@example.com");
  });

  it("επιστρέφει 401 για λανθασμένα credentials", async () => {
    mockLogin.mockRejectedValue(
      new AppError("Invalid email or password.", 401)
    );

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@example.com", password: "wrong" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Invalid email or password." });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/refresh
// ─────────────────────────────────────────────────────────────────────────────

describe("POST /auth/refresh", () => {

  beforeEach(() => jest.clearAllMocks());

  it("επιστρέφει 200 και νέο accessToken με έγκυρο refresh token", async () => {
    mockRefresh.mockResolvedValue({ accessToken: "new_access_token" });

    const res = await request(app)
      .post("/auth/refresh")
      .send({ refreshToken: "valid_refresh_token" });

    expect(res.status).toBe(200); // 200 ΟΧΙ 201 — δεν δημιουργείται resource
    expect(res.body).toEqual({ accessToken: "new_access_token" });

    // ΓΙΑΤΙ ελέγχουμε το argument του mockRefresh:
    // Η διόρθωση στο authRoutes ήταν να περνάει ΜΟΝΟ το token string
    // και ΟΧΙ ολόκληρο το req.body. Αυτό το test το επαληθεύει.
    expect(mockRefresh).toHaveBeenCalledWith("valid_refresh_token");
  });

  it("επιστρέφει 401 αν δεν σταλεί refresh token", async () => {
    mockRefresh.mockRejectedValue(
      new AppError("No refresh token provided.", 401)
    );

    const res = await request(app)
      .post("/auth/refresh")
      .send({}); // άδειο body — δεν στέλνουμε refreshToken

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "No refresh token provided." });
  });

  it("επιστρέφει 401 αν το token είναι expired", async () => {
    mockRefresh.mockRejectedValue(
      new AppError("Refresh token is invalid or expired.", 401)
    );

    const res = await request(app)
      .post("/auth/refresh")
      .send({ refreshToken: "expired_token_abc" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Refresh token is invalid or expired.");
  });
});