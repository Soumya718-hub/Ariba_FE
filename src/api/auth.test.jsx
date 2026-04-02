import { describe, test, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { login } from "./auth";

/* ---------------- MOCK AXIOS ---------------- */

const mockPost = vi.fn();

vi.mock("axios", () => {
  return {
    default: {
      create: () => ({
        post: mockPost,
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      }),
    },
  };
});

/* ---------------- TESTS ---------------- */

describe("Auth API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* ---------- SUCCESS ---------- */

  test("login success returns response data", async () => {
    const mockResponse = {
      success: true,
      token: "fake-token",
      data: { emp_id: "123" },
    };

    mockPost.mockResolvedValueOnce({ data: mockResponse });

    const res = await login({
      email: "test@mail.com",
      password: "password123",
    });

    expect(mockPost).toHaveBeenCalledWith(
      "/api/auth/login",
      {
        email: "test@mail.com",
        password: "password123",
      },
      {}
    );

    expect(res).toEqual(mockResponse);
  });

  /* ---------- FAILURE ---------- */

  test("login failure throws error", async () => {
    mockPost.mockRejectedValueOnce({
      response: { data: "Invalid credentials" },
    });

    await expect(
      login({ email: "wrong@mail.com", password: "wrongpass" })
    ).rejects.toBeDefined();
  });

  /* ---------- EMPTY INPUT ---------- */

  test("login handles empty values", async () => {
    mockPost.mockResolvedValueOnce({
      data: { success: false },
    });

    const res = await login({});

    expect(mockPost).toHaveBeenCalledWith(
      "/api/auth/login",
      {},
      {}
    );

    expect(res).toEqual({ success: false });
  });

  /* ---------- ERROR WITHOUT RESPONSE ---------- */

  test("login handles unknown error", async () => {
    mockPost.mockRejectedValueOnce(new Error("Network Error"));

    await expect(
      login({ email: "test@mail.com", password: "123" })
    ).rejects.toBeDefined();
  });
});