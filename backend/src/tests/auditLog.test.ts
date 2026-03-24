import { logAction } from "../utils/auditLog";
import { prisma } from "../utils/prisma";

// WHY mock prisma:
// We don't want tests hitting the real database.
// jest.mock replaces prisma with a fake version that
// records what was called without actually running queries.
jest.mock("../utils/prisma", () => ({
  prisma: {
    auditLog: {
      create: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}));

describe("logAction", () => {
  // Reset mock call history before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call prisma.auditLog.create with correct data", async () => {
    // Arrange — set up what the mock should return
    (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

    // Act — call the function we're testing
    await logAction("CREATE", "Invoice", "invoice-123", "user-456", { amount: 99.99 });

    // Assert — verify prisma was called with the right arguments
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        action: "CREATE",
        entity: "Invoice",
        entityId: "invoice-123",
        userId: "user-456",
        meta: { amount: 99.99 },
      },
    });
  });

  it("should not throw if prisma.auditLog.create fails", async () => {
    //Silence the expected console.error for this test
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // Arrange — simulate a database failure
    (prisma.auditLog.create as jest.Mock).mockRejectedValue(
      new Error("DB connection failed")
    );

    // Act + Assert — logAction should swallow the error silently
    // WHY: audit logging should never crash the main request
    await expect(
      logAction("DELETE", "Product", "product-123")
    ).resolves.not.toThrow();

    //Restore console.error after the test
    consoleSpy.mockRestore();
  });

  it("should work without optional parameters", async () => {
    (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

    await logAction("CREATE", "Invoice");

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        action: "CREATE",
        entity: "Invoice",
        entityId: undefined,
        userId: undefined,
        meta: undefined,
      },
    });
  });
});