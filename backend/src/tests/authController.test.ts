// ─────────────────────────────────────────────────────────────────────────────
// authController.test.ts
//
// ΕΛΛΗΝΙΚΗ ΕΠΕΞΗΓΗΣΗ:
// Αυτό το αρχείο περιέχει unit tests για τις 3 συναρτήσεις του authController:
//   - signup()  → εγγραφή νέου χρήστη
//   - login()   → σύνδεση υπάρχοντος χρήστη
//   - refresh() → ανανέωση access token μέσω refresh token
//
// Χρησιμοποιούμε Jest + mock για να αποφύγουμε πραγματικές κλήσεις στη βάση
// δεδομένων και στα JWT secrets.
// ─────────────────────────────────────────────────────────────────────────────

import { signup, login, refresh, AppError } from "../controllers/authController";
import { prisma } from "../utils/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// ΓΙΑΤΙ mock το prisma:
// Δεν θέλουμε τα tests να αγγίζουν την πραγματική βάση δεδομένων.
// Το jest.mock αντικαθιστά το prisma με ένα ψεύτικο αντικείμενο
// που απλώς καταγράφει τι κλήθηκε, χωρίς να τρέχει SQL queries.
jest.mock("../utils/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(), // ψεύτικη συνάρτηση για αναζήτηση χρήστη
      create: jest.fn(),     // ψεύτικη συνάρτηση για δημιουργία χρήστη
    },
  },
}));

// ΓΙΑΤΙ mock το bcrypt:
// Το πραγματικό bcrypt.hash είναι σκόπιμα αργό (για ασφάλεια).
// Στα tests δεν μας ενδιαφέρει η ταχύτητα του hashing — θέλουμε
// απλώς να ελέγξουμε ότι καλέστηκε σωστά.
jest.mock("bcryptjs", () => ({
  hash:    jest.fn(),    // ψεύτικο hash password
  compare: jest.fn(),    // ψεύτικο σύγκριση password
}));

// ΓΙΑΤΙ mock το jsonwebtoken:
// Δεν έχουμε πραγματικά JWT_SECRET / REFRESH_SECRET στα tests.
// Το mock επιστρέφει ελεγχόμενες τιμές ώστε να μπορούμε να κάνουμε
// assert σε αυτές.
jest.mock("jsonwebtoken", () => ({
  sign:   jest.fn(),    // ψεύτικη δημιουργία token
  verify: jest.fn(),    // ψεύτικη επαλήθευση token
}));

// ─── Βοηθητικά ────────────────────────────────────────────────────────────────

// ΓΙΑΤΙ as jest.Mock:
// Το TypeScript δεν ξέρει ότι το prisma.user.findUnique είναι mock.
// Το cast σε jest.Mock μας επιτρέπει να χρησιμοποιήσουμε
// .mockResolvedValue() και παρόμοιες μεθόδους.
const mockFindUnique = prisma.user.findUnique as jest.Mock;
const mockCreate     = prisma.user.create     as jest.Mock;
const mockHash       = bcrypt.hash            as jest.Mock;
const mockCompare    = bcrypt.compare         as jest.Mock;
const mockSign       = jwt.sign               as jest.Mock;
const mockVerify     = jwt.verify             as jest.Mock;

// ─────────────────────────────────────────────────────────────────────────────
// SIGNUP TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe("signup()", () => {

  // ΓΙΑΤΙ beforeEach + clearAllMocks:
  // Πριν από κάθε test, σβήνουμε το ιστορικό κλήσεων όλων των mocks.
  // Έτσι ένα test δεν «μολύνει» τα δεδομένα του επόμενου.
  beforeEach(() => jest.clearAllMocks());

  it("δημιουργεί χρήστη επιτυχώς με έγκυρα στοιχεία", async () => {
    // Arrange — ρυθμίζουμε τι επιστρέφουν τα mocks
    mockFindUnique.mockResolvedValue(null);       // δεν υπάρχει ήδη ο χρήστης
    mockHash.mockResolvedValue("hashed_password"); // το hash επιστρέφει αυτό
    mockCreate.mockResolvedValue({
      id:    "user-1",
      email: "test@example.com",
      role:  "USER",
    });

    // Act — καλούμε την signup με έγκυρα δεδομένα
    const result = await signup({ email: "test@example.com", password: "secret123" });

    // Assert — ελέγχουμε ότι το αποτέλεσμα είναι σωστό
    expect(result).toEqual({ id: "user-1", email: "test@example.com", role: "USER" });

    // Επαλήθευση ότι η bcrypt.hash κλήθηκε με το σωστό password και SALT_ROUNDS=10
    expect(mockHash).toHaveBeenCalledWith("secret123", 10);

    // Επαλήθευση ότι η prisma.user.create κλήθηκε με τα σωστά δεδομένα
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        email:    "test@example.com",
        password: "hashed_password",
        role:     "USER",
      },
    });
  });

  it("ρίχνει AppError 409 αν το email υπάρχει ήδη", async () => {
    // Arrange — προσομοιώνουμε ότι ο χρήστης ΗΔΗ υπάρχει στη βάση
    mockFindUnique.mockResolvedValue({ id: "existing-user" });

    // Act + Assert — περιμένουμε AppError με status 409
    await expect(
      signup({ email: "taken@example.com", password: "secret123" })
    ).rejects.toThrow(AppError);

    await expect(
      signup({ email: "taken@example.com", password: "secret123" })
    ).rejects.toMatchObject({ status: 409, message: "Email already registered." });
  });

  it("ρίχνει AppError 400 αν λείπει email ή password", async () => {
    // Δεν χρειάζεται να ρυθμίσουμε mocks — η validation γίνεται πριν το DB call
    await expect(
      signup({ email: "", password: "secret123" })
    ).rejects.toMatchObject({ status: 400 });

    await expect(
      signup({ email: "test@example.com", password: "" })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("ρίχνει AppError 400 αν ο κωδικός είναι πολύ μικρός (< 6 χαρακτήρες)", async () => {
    await expect(
      signup({ email: "test@example.com", password: "abc" })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("χρησιμοποιεί role USER αν δεν δοθεί role", async () => {
    // ΓΙΑΤΙ αυτό το test:
    // Ο controller χρησιμοποιεί nullish coalescing (role ?? "USER").
    // Θέλουμε να βεβαιωθούμε ότι αν δεν περαστεί role, μπαίνει "USER".
    mockFindUnique.mockResolvedValue(null);
    mockHash.mockResolvedValue("hashed_password");
    mockCreate.mockResolvedValue({ id: "u1", email: "x@x.com", role: "USER" });

    await signup({ email: "x@x.com", password: "password123" });

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ role: "USER" }),
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe("login()", () => {

  beforeEach(() => jest.clearAllMocks());

  it("επιστρέφει tokens και user info με σωστά credentials", async () => {
    // Arrange
    mockFindUnique.mockResolvedValue({
      id:       "user-1",
      email:    "test@example.com",
      password: "hashed_password",
      role:     "USER",
    });
    mockCompare.mockResolvedValue(true);          // ο κωδικός ταιριάζει
    mockSign
      .mockReturnValueOnce("access_token_123")   // πρώτη κλήση → access token
      .mockReturnValueOnce("refresh_token_456"); // δεύτερη κλήση → refresh token

    // Act
    const result = await login({ email: "test@example.com", password: "secret123" });

    // Assert
    expect(result).toEqual({
      accessToken:  "access_token_123",
      refreshToken: "refresh_token_456",
      user: { id: "user-1", email: "test@example.com", role: "USER" },
    });
  });

  it("ρίχνει AppError 401 αν το email δεν υπάρχει", async () => {
    // ΓΙΑΤΙ αυτό το test — security best practice:
    // Ο server δεν πρέπει να αποκαλύπτει αν το email δεν υπάρχει.
    // Το μήνυμα "Invalid email or password" είναι σκόπιμα ασαφές.
    mockFindUnique.mockResolvedValue(null); // χρήστης δεν βρέθηκε

    await expect(
      login({ email: "nobody@example.com", password: "secret123" })
    ).rejects.toMatchObject({ status: 401, message: "Invalid email or password." });
  });

  it("ρίχνει AppError 401 αν ο κωδικός είναι λανθασμένος", async () => {
    mockFindUnique.mockResolvedValue({
      id:       "user-1",
      email:    "test@example.com",
      password: "hashed_password",
      role:     "USER",
    });
    mockCompare.mockResolvedValue(false); // ο κωδικός ΔΕΝ ταιριάζει

    await expect(
      login({ email: "test@example.com", password: "wrong_password" })
    ).rejects.toMatchObject({ status: 401, message: "Invalid email or password." });

    // ΣΗΜΑΝΤΙΚΟ: το μήνυμα είναι ΙΔΙΟ είτε το email δεν υπάρχει,
    // είτε ο κωδικός είναι λάθος — αυτό είναι σκόπιμο για ασφάλεια.
  });

  it("καλεί jwt.sign 2 φορές (access + refresh token)", async () => {
    mockFindUnique.mockResolvedValue({
      id: "u1", email: "a@a.com", password: "h", role: "ADMIN",
    });
    mockCompare.mockResolvedValue(true);
    mockSign.mockReturnValue("some_token");

    await login({ email: "a@a.com", password: "pass" });

    // ΓΙΑΤΙ toHaveBeenCalledTimes(2):
    // Ο controller πρέπει να παράγει ΔΥΟN tokens: access + refresh.
    // Αν αλλάξει κάποιος την υλοποίηση και βγάλει ένα token, το test αποτυγχάνει.
    expect(mockSign).toHaveBeenCalledTimes(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// REFRESH TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe("refresh()", () => {

  beforeEach(() => jest.clearAllMocks());

  it("επιστρέφει νέο accessToken με έγκυρο refresh token", async () => {
    // Arrange — jwt.verify επιστρέφει decoded payload
    mockVerify.mockReturnValue({ id: "user-1", role: "USER" });
    mockSign.mockReturnValue("new_access_token_789");

    // Act
    const result = await refresh("valid_refresh_token");

    // Assert
    expect(result).toEqual({ accessToken: "new_access_token_789" });

    // Επαλήθευση ότι το jwt.verify κλήθηκε με το σωστό token
    expect(mockVerify).toHaveBeenCalledWith(
      "valid_refresh_token",
      process.env.REFRESH_SECRET
    );
  });

  it("ρίχνει AppError 401 αν δεν δοθεί token", async () => {
    // ΓΙΑΤΙ αυτό το test:
    // Αν δεν σταλεί refreshToken στο body, περνάει undefined.
    // Ο controller ελέγχει αυτό πριν καλέσει jwt.verify.
    await expect(refresh("")).rejects.toMatchObject({
      status: 401,
      message: "No refresh token provided.",
    });
  });

  it("ρίχνει AppError 401 αν το token είναι expired ή invalid", async () => {
    // Arrange — jwt.verify πετάει error (π.χ. TokenExpiredError)
    mockVerify.mockImplementation(() => {
      throw new Error("jwt expired");
    });

    await expect(refresh("expired_token")).rejects.toMatchObject({
      status:  401,
      message: "Refresh token is invalid or expired.",
    });
  });
});