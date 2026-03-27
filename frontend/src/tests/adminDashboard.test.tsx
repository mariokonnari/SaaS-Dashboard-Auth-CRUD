// AdminDashboard.test.tsx

import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import AdminDashboard from "../pages/AdminDashboard";
import api from "../api/axios";

// Mock the api module to avoid real HTTP requests in tests
vi.mock("../api/axios", () => ({
  default: { get: vi.fn() },
}));

// Mock Supabase — the dashboard subscribes to realtime changes,
// but we don't want a live DB connection in tests
vi.mock("../config/supabase", () => ({
  supabase: {
    channel: vi.fn(() => ({
      on:        vi.fn().mockReturnThis(), // supports .on().on().subscribe() chaining
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
  },
}));

// Replace Recharts with lightweight stubs — SVG rendering in jsdom is unreliable.
// data-testid attributes let us still assert the charts are mounted.
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart:           ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  BarChart:            ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  PieChart:            ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Line: () => null, Bar: () => null, Pie: () => null, Cell: () => null,
  XAxis: () => null, YAxis: () => null, Tooltip: () => null,
  Legend: () => null, CartesianGrid: () => null,
}));

// Replace framer-motion with plain HTML elements — animations cause issues in jsdom
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    tr:  ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
  },
}));

// Return the translation key as-is — we're testing logic, not translations
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// LiveActivityFeed has its own dependencies — isolate it with a stub
vi.mock("../components/LiveActivityFeed", () => ({
  default: () => <div data-testid="live-activity-feed" />,
}));

// Fake data

const fakeUsers = [
  { id: "user-1", email: "alice@example.com", role: "USER" },
  { id: "user-2", email: "bob@example.com",   role: "USER" },
];

const fakeProducts = [
  { id: "prod-1", name: "Product A", price: 10 },
  { id: "prod-2", name: "Product B", price: 20 },
  { id: "prod-3", name: "Product C", price: 30 },
];

const fakeInvoices = [
  {
    id: "inv-1", amount: 100, description: "Invoice one",
    createdAt: "2024-01-15T10:00:00Z",
    user: { id: "user-1", email: "alice@example.com" },
  },
  {
    // amount is a string here — verifies the Number() fix prevents $NaN
    id: "inv-2", amount: "200", description: "Invoice two",
    createdAt: "2024-01-16T10:00:00Z",
    user: { id: "user-2", email: "bob@example.com" },
  },
];

const mockApi = api.get as ReturnType<typeof vi.fn>;

describe("AdminDashboard component", () => {

  beforeEach(() => {
    vi.clearAllMocks();
    // The useEffect fires Promise.all with 3 parallel api.get calls:
    //   1. /admin/users  2. /admin/products  3. /admin/invoices
    // mockResolvedValueOnce returns a different value per call, in order
    mockApi
      .mockResolvedValueOnce({ data: fakeUsers })
      .mockResolvedValueOnce({ data: fakeProducts })
      .mockResolvedValueOnce({ data: fakeInvoices });
  });

  // KPI Cards

  it("displays the correct user count", async () => {
    render(<AdminDashboard />);
    // Data loads asynchronously inside useEffect — waitFor until it appears in the DOM
    await waitFor(() => expect(screen.getByText("2")).toBeInTheDocument());
  });

  it("displays the correct product count", async () => {
    render(<AdminDashboard />);
    await waitFor(() => expect(screen.getByText("3")).toBeInTheDocument());
  });

  it("displays the correct invoice count", async () => {
    render(<AdminDashboard />);
    await waitFor(() => expect(screen.getByText("2")).toBeInTheDocument());
  });

  it("calculates totalRevenue correctly even when amounts are strings", async () => {
    render(<AdminDashboard />);
    // Without Number(): 100 + "200" = "100200" (string concatenation) → displays $NaN
    // With Number():    100 + 200   = 300 → displays $300.00
    // This test guards against that regression
    await waitFor(() => expect(screen.getByText("$300.00")).toBeInTheDocument());
  });

  // Recent Invoices Table

  it("renders the recent invoices in the table", async () => {
    render(<AdminDashboard />);
    await waitFor(() => {
      expect(screen.getByText("alice@example.com")).toBeInTheDocument();
      expect(screen.getByText("bob@example.com")).toBeInTheDocument();
      expect(screen.getByText("Invoice one")).toBeInTheDocument();
      expect(screen.getByText("Invoice two")).toBeInTheDocument();
    });
  });

  it("formats invoice amounts correctly in the table", async () => {
    render(<AdminDashboard />);
    await waitFor(() => {
      expect(screen.getByText("$100.00")).toBeInTheDocument();
      expect(screen.getByText("$200.00")).toBeInTheDocument();
    });
  });

  it("renders the empty state when there are no invoices", async () => {
    mockApi
      .mockResolvedValueOnce({ data: fakeUsers })
      .mockResolvedValueOnce({ data: fakeProducts })
      .mockResolvedValueOnce({ data: [] });

    render(<AdminDashboard />);
    await waitFor(() => expect(screen.getByText("No recent invoices")).toBeInTheDocument());
  });

  // Charts

  it("renders all three chart components", async () => {
    render(<AdminDashboard />);
    await waitFor(() => {
      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
      expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    });
  });

  // API calls

  it("fetches users, products, and invoices on mount", async () => {
    render(<AdminDashboard />);
    await waitFor(() => {
      // Guards against accidental endpoint URL changes
      expect(mockApi).toHaveBeenCalledWith("/admin/users");
      expect(mockApi).toHaveBeenCalledWith("/admin/products");
      expect(mockApi).toHaveBeenCalledWith("/admin/invoices");
    });
  });

  it("renders the LiveActivityFeed component", async () => {
    render(<AdminDashboard />);
    await waitFor(() => expect(screen.getByTestId("live-activity-feed")).toBeInTheDocument());
  });
});