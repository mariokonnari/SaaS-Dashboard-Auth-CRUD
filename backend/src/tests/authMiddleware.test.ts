// ─────────────────────────────────────────────────────────────────────────────
// authMiddleware.test.ts
//
// ΕΛΛΗΝΙΚΗ ΕΠΕΞΗΓΗΣΗ:
// Αυτό το αρχείο περιέχει unit tests για τα 2 middlewares:
//   - requireAuth    → ελέγχει αν υπάρχει έγκυρο JWT token
//   - requireRole    → ελέγχει αν ο χρήστης έχει το σωστό role
//
// ΠΩΣ ΔΟΚΙΜΑΖΟΥΜΕ MIDDLEWARE:
// Ένα Express middleware είναι απλώς μια συνάρτηση με 3 παραμέτρους:
//   (req, res, next)
// Για να το δοκιμάσουμε, φτιάχνουμε ψεύτικα (mock) αντικείμενα για
// τα req, res, και next — και ελέγχουμε τι κάλεσε το middleware.
// ─────────────────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { requireAuth, requireRole } from "../middleware/authMiddleware";

// ─── Mock του jsonwebtoken ────────────────────────────────────────────────────
// ΓΙΑΤΙ mock το jwt:
// Δεν έχουμε πραγματικό JWT_SECRET στα tests.
// Θέλουμε να ελέγχουμε εμείς τι επιστρέφει το jwt.verify
// (έγκυρο payload ή error) για κάθε test.
jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

const mockVerify = jest.mocked(jwt.verify);

// ─── Helper: φτιάχνει ψεύτικο req ────────────────────────────────────────────
// ΓΙΑΤΙ helper συνάρτηση:
// Κάθε test χρειάζεται ένα req object. Αντί να το γράφουμε από την αρχή
// σε κάθε test, το φτιάχνουμε με μια βοηθητική συνάρτηση.
// Το `as unknown as Request` είναι απαραίτητο γιατί δεν φτιάχνουμε
// πλήρες Express Request — μόνο τα πεδία που χρειαζόμαστε.
const makeReq = (authHeader?: string): Request =>
  ({
    headers: {
      authorization: authHeader,
    },
    user: undefined,
  } as unknown as Request);

// ─── Helper: φτιάχνει ψεύτικο res ────────────────────────────────────────────
// ΓΙΑΤΙ mock το res:
// Θέλουμε να ελέγξουμε αν το middleware κάλεσε res.status(...).json(...)
// με τα σωστά arguments. Χρησιμοποιούμε jest.fn() για κάθε method,
// και το status() επιστρέφει το ίδιο το res ώστε να δουλεύει το
// method chaining: res.status(401).json({...})
const makeRes = (): Response => {
  const res = {
    status: jest.fn().mockReturnThis(), // .mockReturnThis() → επιστρέφει το ίδιο res
    json:   jest.fn().mockReturnThis(), // ώστε να δουλεύει res.status(401).json(...)
  };
  return res as unknown as Response;
};

// ─── Helper: φτιάχνει ψεύτικο next ───────────────────────────────────────────
// ΓΙΑΤΙ mock το next:
// Το next() καλείται όταν το middleware περνάει τον έλεγχο στο επόμενο.
// Ελέγχουμε αν κλήθηκε (επιτυχία) ή ΔΕΝ κλήθηκε (αποτυχία).
const makeNext = (): NextFunction => jest.fn();

// ─────────────────────────────────────────────────────────────────────────────
// requireAuth TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe("requireAuth", () => {

  beforeEach(() => jest.clearAllMocks());

  it("καλεί next() με έγκυρο Bearer token", () => {
    // Arrange — jwt.verify επιστρέφει έγκυρο decoded payload
    mockVerify.mockReturnValue({ id: "user-1", role: "USER" } as never);

    const req  = makeReq("Bearer valid_token_123");
    const res  = makeRes();
    const next = makeNext();

    // Act
    requireAuth(req, res, next);

    // Assert — το next() πρέπει να κληθεί για να προχωρήσει το request
    expect(next).toHaveBeenCalledTimes(1);

    // Επαλήθευση ότι το req.user έχει οριστεί σωστά
    expect(req.user).toEqual({ id: "user-1", role: "USER" });

    // Επαλήθευση ότι ΔΕΝ επιστράφηκε κανένα error response
    expect(res.status).not.toHaveBeenCalled();
  });

  it("επιστρέφει 401 αν δεν υπάρχει Authorization header", () => {
    // Arrange — κανένα header
    const req  = makeReq(undefined);
    const res  = makeRes();
    const next = makeNext();

    // Act
    requireAuth(req, res, next);

    // Assert — 401 Unauthenticated, όχι 403
    // ΓΙΑΤΙ 401 και ΟΧΙ 403:
    // 401 = "Δεν ξέρω ποιος είσαι" (δεν έχεις στείλει credentials)
    // 403 = "Ξέρω ποιος είσαι, αλλά δεν έχεις δικαίωμα"
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "No token provided." });

    // Επαλήθευση ότι το next() ΔΕΝ κλήθηκε — το request σταμάτησε εδώ
    expect(next).not.toHaveBeenCalled();
  });

  it("επιστρέφει 401 αν το header δεν αρχίζει με 'Bearer '", () => {
    // ΓΙΑΤΙ αυτό το test:
    // Κάποιος μπορεί να στείλει το token χωρίς το "Bearer " prefix.
    // Π.χ. Authorization: "token abc123" ή Authorization: "abc123"
    // Ο controller ελέγχει authHeader?.startsWith("Bearer ") — αυτό το test το επαληθεύει.
    const req  = makeReq("Basic some_other_token");
    const res  = makeRes();
    const next = makeNext();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "No token provided." });
    expect(next).not.toHaveBeenCalled();
  });

  it("επιστρέφει 401 αν το token είναι expired ή invalid", () => {
    // Arrange — jwt.verify πετάει error (π.χ. TokenExpiredError)
    mockVerify.mockImplementation(() => {
      throw new Error("jwt expired");
    });

    const req  = makeReq("Bearer expired_token");
    const res  = makeRes();
    const next = makeNext();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Token is invalid or expired." });
    expect(next).not.toHaveBeenCalled();
  });

  it("ορίζει σωστά το req.user από το decoded JWT payload", () => {
    // ΓΙΑΤΙ αυτό το test:
    // Το req.user χρησιμοποιείται από το requireRole και τα routes.
    // Πρέπει να βεβαιωθούμε ότι περνάει ακριβώς το payload που επιστρέφει το jwt.verify.
    mockVerify.mockReturnValue({ id: "admin-99", role: "ADMIN" } as never);

    const req  = makeReq("Bearer some_admin_token");
    const res  = makeRes();
    const next = makeNext();

    requireAuth(req, res, next);

    expect(req.user).toEqual({ id: "admin-99", role: "ADMIN" });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// requireRole TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe("requireRole", () => {

  beforeEach(() => jest.clearAllMocks());

  it("καλεί next() αν ο χρήστης έχει το σωστό role", () => {
    // Arrange — req.user έχει ήδη οριστεί από το requireAuth
    const req = {
      user: { id: "user-1", role: "ADMIN" },
    } as unknown as Request;
    const res  = makeRes();
    const next = makeNext();

    // Act — requireRole επιστρέφει middleware, οπότε το καλούμε αμέσως
    requireRole("ADMIN")(req, res, next);

    // Assert
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("επιστρέφει 403 αν ο χρήστης έχει διαφορετικό role", () => {
    // ΓΙΑΤΙ 403 και ΟΧΙ 401:
    // Ο χρήστης είναι authenticated (ξέρουμε ποιος είναι — req.user υπάρχει)
    // αλλά δεν είναι authorized (δεν έχει το σωστό role).
    // 403 = Forbidden.
    const req = {
      user: { id: "user-1", role: "USER" }, // είναι USER, όχι ADMIN
    } as unknown as Request;
    const res  = makeRes();
    const next = makeNext();

    requireRole("ADMIN")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "You do not have permission to access this resource.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("επιστρέφει 401 αν το req.user δεν υπάρχει (requireAuth παραλείφθηκε)", () => {
    // ΓΙΑΤΙ αυτό το test:
    // Το requireRole πρέπει να τρέχει ΜΕΤΑ το requireAuth.
    // Αν κάποιος βάλει requireRole χωρίς requireAuth στη middleware chain,
    // το req.user θα είναι undefined. Αυτό το test ελέγχει την defensive λογική.
    const req = {
      user: undefined, // δεν έχει οριστεί από requireAuth
    } as unknown as Request;
    const res  = makeRes();
    const next = makeNext();

    requireRole("ADMIN")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Not authenticated." });
    expect(next).not.toHaveBeenCalled();
  });

  it("λειτουργεί σωστά για role USER", () => {
    // Επαλήθευση ότι το requireRole δουλεύει και για USER, όχι μόνο ADMIN
    const req = {
      user: { id: "user-2", role: "USER" },
    } as unknown as Request;
    const res  = makeRes();
    const next = makeNext();

    requireRole("USER")(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("επιστρέφει 403 αν ο ADMIN προσπαθεί να μπει σε USER-only route", () => {
    // ΓΙΑΤΙ αυτό το test:
    // Το requireRole κάνει strict equality check (role !== requiredRole).
    // Ένας ADMIN δεν πρέπει αυτόματα να έχει πρόσβαση σε USER routes
    // αν το σύστημα το έχει σχεδιαστεί έτσι.
    const req = {
      user: { id: "admin-1", role: "ADMIN" },
    } as unknown as Request;
    const res  = makeRes();
    const next = makeNext();

    requireRole("USER")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});