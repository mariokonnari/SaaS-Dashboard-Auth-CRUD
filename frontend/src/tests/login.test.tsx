// Login.test.tsx

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";
import Login from "../pages/Login";
import api from "../api/axios";

// Mock the api module to avoid real HTTP requests in tests
vi.mock("../api/axios", () => ({
  default: { post: vi.fn() },
}));

// Mock useNavigate so we can assert redirect behavior without a real router
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

// Replace framer-motion with plain HTML elements — animations cause issues in jsdom
vi.mock("framer-motion", () => ({
  motion: {
    form:   ({ children, ...props }: any) => <form {...props}>{children}</form>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    p:      ({ children, ...props }: any) => <p {...props}>{children}</p>,
    div:    ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Wrap in MemoryRouter because Login uses <Link> and useNavigate,
// both of which require a router context to work
const renderLogin = () => render(<MemoryRouter><Login /></MemoryRouter>);

const mockApi = api.post as ReturnType<typeof vi.fn>;

describe("Login component", () => {

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // Rendering

  it("renders the main UI elements", () => {
    renderLogin();
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("renders the demo shortcut buttons", () => {
    renderLogin();
    expect(screen.getByText(/admin demo/i)).toBeInTheDocument();
    expect(screen.getByText(/user demo/i)).toBeInTheDocument();
  });

  it("renders a link to the signup page", () => {
    renderLogin();
    // <Link to="/signup"> renders as an <a> tag — query it by role
    expect(screen.getByRole("link", { name: /create one/i })).toBeInTheDocument();
  });

  // Form interaction

  it("updates input fields as the user types", async () => {
    renderLogin();
    const user = userEvent.setup();
    const emailInput    = screen.getByPlaceholderText("you@example.com");
    const passwordInput = screen.getByPlaceholderText("••••••••");
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "secret123");
    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("secret123");
  });

  it("fills in admin credentials when the Admin demo button is clicked", async () => {
    renderLogin();
    const user = userEvent.setup();
    await user.click(screen.getByText(/admin demo/i));
    expect(screen.getByPlaceholderText("you@example.com")).toHaveValue("admin@demo.com");
    expect(screen.getByPlaceholderText("••••••••")).toHaveValue("admin");
  });

  it("fills in user credentials when the User demo button is clicked", async () => {
    renderLogin();
    const user = userEvent.setup();
    await user.click(screen.getByText(/user demo/i));
    expect(screen.getByPlaceholderText("you@example.com")).toHaveValue("user@demo.com");
    expect(screen.getByPlaceholderText("••••••••")).toHaveValue("user");
  });

  // Successful login

  it("redirects to /admin/dashboard for ADMIN users", async () => {
    mockApi.mockResolvedValue({ data: { accessToken: "fake_token", user: { role: "ADMIN" } } });
    renderLogin();
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("you@example.com"), "admin@demo.com");
    await user.type(screen.getByPlaceholderText("••••••••"), "admin");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    // handleLogin is async — wait for the api call to resolve before asserting
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/admin/dashboard"));
  });

  it("redirects to /user/dashboard for USER accounts", async () => {
    mockApi.mockResolvedValue({ data: { accessToken: "fake_token", user: { role: "USER" } } });
    renderLogin();
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("you@example.com"), "user@demo.com");
    await user.type(screen.getByPlaceholderText("••••••••"), "user");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/user/dashboard"));
  });

  it("stores the token and role in localStorage after a successful login", async () => {
    mockApi.mockResolvedValue({ data: { accessToken: "my_access_token", user: { role: "ADMIN" } } });
    renderLogin();
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("you@example.com"), "admin@demo.com");
    await user.type(screen.getByPlaceholderText("••••••••"), "admin");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    // The token and role are read throughout the app for auth — if they stop
    // being stored, the user will be immediately logged out on every page
    await waitFor(() => {
      expect(localStorage.getItem("token")).toBe("my_access_token");
      expect(localStorage.getItem("role")).toBe("ADMIN");
    });
  });

  // Failed login

  it("displays the error message returned by the API on failure", async () => {
    mockApi.mockRejectedValue({ response: { data: { message: "Invalid email or password." } } });
    renderLogin();
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("you@example.com"), "wrong@example.com");
    await user.type(screen.getByPlaceholderText("••••••••"), "wrongpass");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(screen.getByText("Invalid email or password.")).toBeInTheDocument());
  });

  it("displays a fallback error message when there is no API response (e.g. network down)", async () => {
    // If the network is down, err.response is undefined — the ?? operator
    // ensures we fall back to a generic message instead of crashing
    mockApi.mockRejectedValue(new Error("Network Error"));
    renderLogin();
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com");
    await user.type(screen.getByPlaceholderText("••••••••"), "pass");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(screen.getByText("Login failed. Please try again.")).toBeInTheDocument());
  });

  // Loading state

  it("disables the submit button while the login request is in flight", async () => {
    // Never-resolving promise keeps the request pending so we can assert
    // the loading UI before the response arrives
    mockApi.mockImplementation(() => new Promise(() => {}));
    renderLogin();
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com");
    await user.type(screen.getByPlaceholderText("••••••••"), "secret123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    // disabled={loading} prevents double submissions during the request
    await waitFor(() => expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled());
  });
});