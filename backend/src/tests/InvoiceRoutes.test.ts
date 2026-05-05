// invoiceRoutes.test.ts
//
// ΕΛΛΗΝΙΚΗ ΕΠΕΞΗΓΗΣΗ:
// Αυτό το αρχείο περιέχει integration tests για τα 2 invoice routers:
// - adminInvoiceRoutes → ADMIN-only CRUD (GET all, GET by user, POST, PUT, DELETE)
// - userInvoiceRoutes  → User CRUD για τα δικά του invoices
//
// ΣΤΡΑΤΗΓΙΚΗ:
// Κάνουμε mock το prisma, το authMiddleware, και το logAction.
// Έτσι τα tests ελέγχουν ΜΟΝΟ τη λογική των routes:
// - status codes;
// - JSON response;
// - χρήση prisma methods;
// - έλεγχοι authorization (π.χ. μόνο τα δικά σου invoices);

import request from "supertest";
import express from "express";
import adminInvoiceRouter from "../routes/adminInvoiceRoutes";
import userInvoiceRouter  from "../routes/userInvoiceRoutes";
import { prisma }         from "../utils/prisma";
import * as auditLog      from "../utils/auditLog";

// Mock prisma
jest.mock("../utils/prisma", () => ({
  prisma: {
    invoice: {
      findMany:   jest.fn(),
      findUnique: jest.fn(),
      create:     jest.fn(),
      update:     jest.fn(),
      delete:     jest.fn(),
    },
  },
}));

// Mock auditLog
// ΓΙΑΤΙ mock το logAction:
// Το logAction κάνει DB call εσωτερικά. Δεν θέλουμε τα route tests να εξαρτώνται από τη λογική του auditLog — αυτή δοκιμάζεται στο δικό του test αρχείο (auditLog.test.ts).
jest.mock("../utils/auditLog", () => ({
  logAction: jest.fn(),
}));

// Mock authMiddleware
// ΓΙΑΤΙ mock το middleware:
// Το requireAuth και requireRole δοκιμάζονται στο authMiddleware.test.ts. Εδώ θέλουμε να παρακάμψουμε τον έλεγχο JWT και να ορίσουμε εμείς το req.user για κάθε test.
jest.mock("../middleware/authMiddleware", () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { id: "admin-1", role: "ADMIN" }; // default: ADMIN user
    next();
  },
  requireRole: (_role: string) => (_req: any, _res: any, next: any) => next(),
  // ΓΙΑΤΙ requireRole πάντα καλεί next():
  // Το role checking δοκιμάζεται στο authMiddleware.test.ts. Εδώ θέλουμε να φτάνουμε πάντα στη λογική του route.
}));

// Helpers

const mockFindMany   = prisma.invoice.findMany   as jest.Mock;
const mockFindUnique = prisma.invoice.findUnique as jest.Mock;
const mockCreate     = prisma.invoice.create     as jest.Mock;
const mockUpdate     = prisma.invoice.update     as jest.Mock;
const mockDelete     = prisma.invoice.delete     as jest.Mock;
const mockLogAction  = auditLog.logAction        as jest.Mock;

// Express apps για tests
const adminApp = express();
adminApp.use(express.json());
adminApp.use("/admin/invoices", adminInvoiceRouter);

const userApp = express();
userApp.use(express.json());
userApp.use("/invoices", userInvoiceRouter);

// ADMIN INVOICE ROUTES

describe("GET /admin/invoices", () => {

  beforeEach(() => jest.clearAllMocks());

  it("returns 200 and all invoices", async () => {
    const fakeInvoices = [
      { id: "inv-1", amount: 100, description: "Test", userId: "user-1" },
      { id: "inv-2", amount: 200, description: "Test 2", userId: "user-2" },
    ];
    mockFindMany.mockResolvedValue(fakeInvoices);

    const res = await request(adminApp).get("/admin/invoices");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeInvoices);

    // Επαλήθευση ότι το prisma κλήθηκε με include και orderBy
    expect(mockFindMany).toHaveBeenCalledWith({
      include: { user: { select: { id: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
    });
  });

  it("returns 500 if prisma fails", async () => {
    mockFindMany.mockRejectedValue(new Error("DB error"));

    const res = await request(adminApp).get("/admin/invoices");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Failed to fetch invoices");
  });
});

describe("GET /admin/invoices/user/:userId", () => {

  beforeEach(() => jest.clearAllMocks());

  it("returns invoice for a specific userId", async () => {
    const fakeInvoices = [{ id: "inv-1", amount: 99, userId: "user-42" }];
    mockFindMany.mockResolvedValue(fakeInvoices);

    const res = await request(adminApp).get("/admin/invoices/user/user-42");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeInvoices);

    // Επαλήθευση ότι το where φιλτράρει με το σωστό userId
    expect(mockFindMany).toHaveBeenCalledWith({
      where:   { userId: "user-42" },
      orderBy: { createdAt: "desc" },
    });
  });

  it("returns 500 if prisma fails", async () => {
    mockFindMany.mockRejectedValue(new Error("DB error"));

    const res = await request(adminApp).get("/admin/invoices/user/user-42");

    expect(res.status).toBe(500);
  });
});

describe("POST /admin/invoices", () => {

  beforeEach(() => jest.clearAllMocks());

  it("creates invoice and calls logAction", async () => {
    const fakeInvoice = { id: "inv-new", userId: "user-1", amount: 150, description: "New" };
    mockCreate.mockResolvedValue(fakeInvoice);
    mockLogAction.mockResolvedValue(undefined);

    const res = await request(adminApp)
      .post("/admin/invoices")
      .send({ userId: "user-1", amount: 150, description: "New" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Invoice created", invoice: fakeInvoice });

    // Επαλήθευση ότι το logAction κλήθηκε με τα σωστά arguments
    // ΓΙΑΤΙ αυτό το test:
    // Το audit log είναι κρίσιμο για ασφάλεια — πρέπει να καταγράφεται κάθε CREATE action με τα σωστά δεδομένα.
    expect(mockLogAction).toHaveBeenCalledWith(
      "CREATE", "Invoice", "inv-new", "user-1", { amount: 150, description: "New" }
    );
  });

  it("returns 500 if prisma fails", async () => {
    mockCreate.mockRejectedValue(new Error("DB error"));

    const res = await request(adminApp)
      .post("/admin/invoices")
      .send({ userId: "user-1", amount: 150, description: "New" });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Failed to create invoice");
  });
});

describe("PUT /admin/invoices/:id", () => {

  beforeEach(() => jest.clearAllMocks());

  it("updates invoice and calls logAction", async () => {
    const updatedInvoice = { id: "inv-1", userId: "user-1", amount: 999, description: "Updated" };
    mockUpdate.mockResolvedValue(updatedInvoice);
    mockLogAction.mockResolvedValue(undefined);

    const res = await request(adminApp)
      .put("/admin/invoices/inv-1")
      .send({ userId: "user-1", amount: 999, description: "Updated" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Invoice updated", invoice: updatedInvoice });

    expect(mockLogAction).toHaveBeenCalledWith(
      "UPDATE", "Invoice", "inv-1", "user-1", { amount: 999, description: "Updated" }
    );
  });

  it("returns 500 if prisma fails", async () => {
    mockUpdate.mockRejectedValue(new Error("DB error"));

    const res = await request(adminApp)
      .put("/admin/invoices/inv-1")
      .send({ userId: "user-1", amount: 999, description: "Updated" });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Failed to update invoice");
  });
});

describe("DELETE /admin/invoices/:id", () => {

  beforeEach(() => jest.clearAllMocks());

  it("deletes invoice and calls logAction", async () => {
    mockDelete.mockResolvedValue({});
    mockLogAction.mockResolvedValue(undefined);

    const res = await request(adminApp).delete("/admin/invoices/inv-1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Invoice deleted" });

    expect(mockLogAction).toHaveBeenCalledWith(
      "DELETE", "Invoice", "inv-1", "admin-1" // adminId από req.user.id
    );
  });

  it("returns 500 if prisma fails", async () => {
    mockDelete.mockRejectedValue(new Error("DB error"));

    const res = await request(adminApp).delete("/admin/invoices/inv-1");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Failed to delete invoices");
  });
});

// USER INVOICE ROUTES

describe("GET /invoices (user)", () => {

  beforeEach(() => jest.clearAllMocks());

  it("returns invoices of the logged-in user only", async () => {
    const fakeInvoices = [{ id: "inv-1", userId: "admin-1", amount: 50 }];
    mockFindMany.mockResolvedValue(fakeInvoices);

    const res = await request(userApp).get("/invoices");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeInvoices);

    // ΓΙΑΤΙ αυτό το test είναι σημαντικό:
    // Ο user πρέπει να βλέπει ΜΟΝΟ τα δικά του invoices. Το where: { userId } διασφαλίζει αυτό — αν αφαιρεθεί κατά λάθος, το test αποτυγχάνει και προστατεύει από data leak.
    expect(mockFindMany).toHaveBeenCalledWith({
      where:   { userId: "admin-1" }, // το req.user.id από το mock middleware
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });
  });

  it("returns 500 if prisma fails", async () => {
    mockFindMany.mockRejectedValue(new Error("DB error"));

    const res = await request(userApp).get("/invoices");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Failed to fetch invoices");
  });
});

describe("POST /invoices (user)", () => {

  beforeEach(() => jest.clearAllMocks());

  it("creates invoice for logged-in user only", async () => {
    const fakeInvoice = { id: "inv-new", userId: "admin-1", amount: 75, description: "Work" };
    mockCreate.mockResolvedValue(fakeInvoice);

    const res = await request(userApp)
      .post("/invoices")
      .send({ amount: 75, description: "Work" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(fakeInvoice);

    // Επαλήθευση ότι το amount μετατράπηκε σε Number
    // ΓΙΑΤΙ Number(amount):
    // Το body από HTTP request μπορεί να φτάσει ως string ("75"). Ο κώδικας κάνει Number(amount) για να αποφύγει type mismatch στη βάση.
    expect(mockCreate).toHaveBeenCalledWith({
      data: { userId: "admin-1", amount: 75, description: "Work" },
    });
  });

  it("returns 400 if amount or description is missing", async () => {
    // ΓΙΑΤΙ αυτό το test:
    // Ο userInvoiceRoutes έχει validation που λείπει από τον adminInvoiceRoutes. Πρέπει να βεβαιωθούμε ότι δουλεύει σωστά.
    const res = await request(userApp)
      .post("/invoices")
      .send({ amount: 75 }); // λείπει το description

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Amount and description are required");

    // Επαλήθευση ότι το prisma.create ΔΕΝ κλήθηκε — σταματάμε νωρίς
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 if amount is missing", async () => {
    const res = await request(userApp)
      .post("/invoices")
      .send({ description: "Work" }); // λείπει το amount

    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 500 if prisma fails", async () => {
    mockCreate.mockRejectedValue(new Error("DB error"));

    const res = await request(userApp)
      .post("/invoices")
      .send({ amount: 75, description: "Work" });

    expect(res.status).toBe(500);
  });
});

describe("PUT /invoices/:id (user)", () => {

  beforeEach(() => jest.clearAllMocks());

  it("updates user invoice", async () => {
    // Arrange — το invoice ανήκει στον logged-in user (admin-1)
    mockFindUnique.mockResolvedValue({ id: "inv-1", userId: "admin-1", amount: 50 });
    const updatedInvoice = { id: "inv-1", userId: "admin-1", amount: 200, description: "Updated" };
    mockUpdate.mockResolvedValue(updatedInvoice);

    const res = await request(userApp)
      .put("/invoices/inv-1")
      .send({ amount: 200, description: "Updated" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updatedInvoice);
  });

  it("returns 404 if invoice belongs to other user", async () => {
    // ΓΙΑΤΙ αυτό το test είναι κρίσιμο για ασφάλεια:
    // Ένας user ΔΕΝ πρέπει να μπορεί να επεξεργαστεί invoice άλλου user. Ο κώδικας ελέγχει invoice.userId !== userId — αυτό το test το επαληθεύει.
    mockFindUnique.mockResolvedValue({
      id:     "inv-1",
      userId: "other-user-99", // διαφορετικός user!
      amount: 50,
    });

    const res = await request(userApp)
      .put("/invoices/inv-1")
      .send({ amount: 200, description: "Updated" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Invoice not found or not authorized");

    // Επαλήθευση ότι το update ΔΕΝ έγινε
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 if invoice doesn't exist", async () => {
    mockFindUnique.mockResolvedValue(null); // δεν βρέθηκε

    const res = await request(userApp)
      .put("/invoices/nonexistent-id")
      .send({ amount: 200, description: "Updated" });

    expect(res.status).toBe(404);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("DELETE /invoices/:id (user)", () => {

  beforeEach(() => jest.clearAllMocks());

  it("deletes user invoice", async () => {
    mockFindUnique.mockResolvedValue({ id: "inv-1", userId: "admin-1" });
    mockDelete.mockResolvedValue({});

    const res = await request(userApp).delete("/invoices/inv-1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Invoice deleted successfully" });
  });

  it("returns 404 if invoice belongs to another user", async () => {
    // ΓΙΑΤΙ αυτό το test είναι κρίσιμο για ασφάλεια:
    // Ένας user ΔΕΝ πρέπει να μπορεί να διαγράψει invoice άλλου user.
    mockFindUnique.mockResolvedValue({
      id:     "inv-1",
      userId: "other-user-99", // διαφορετικός user!
    });

    const res = await request(userApp).delete("/invoices/inv-1");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Invoice not found or not authorized");

    // Επαλήθευση ότι το delete ΔΕΝ έγινε
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("returns 404 if invoice doesn't exist", async () => {
    mockFindUnique.mockResolvedValue(null);

    const res = await request(userApp).delete("/invoices/nonexistent-id");

    expect(res.status).toBe(404);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("returns 500 if prisma fails", async () => {
    mockFindUnique.mockRejectedValue(new Error("DB error"));

    const res = await request(userApp).delete("/invoices/inv-1");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Failed to delete invoice");
  });
});