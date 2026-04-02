import { describe, test, expect, beforeEach } from "vitest";
import customFetch from "./axios";

/* ---------------- TESTS ---------------- */

describe("Axios Interceptor", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("adds Authorization header when token exists", async () => {
    // Arrange
    localStorage.setItem("token", "abc123");

    const handler =
      customFetch.interceptors.request.handlers[0].fulfilled;

    const config = {
      headers: {},
    };

    // Act
    const updatedConfig = await handler(config);

    // Assert
    expect(updatedConfig.headers.Authorization).toBe("Bearer abc123");
  });

  test("does not add Authorization header when token is missing", async () => {
    const handler =
      customFetch.interceptors.request.handlers[0].fulfilled;

    const config = {
      headers: {},
    };

    const updatedConfig = await handler(config);

    expect(updatedConfig.headers.Authorization).toBeUndefined();
  });

  test("passes through config unchanged except headers", async () => {
    localStorage.setItem("token", "xyz789");

    const handler =
      customFetch.interceptors.request.handlers[0].fulfilled;

    const config = {
      headers: {},
      url: "/test-url",
      method: "get",
    };

    const updatedConfig = await handler(config);

    expect(updatedConfig.url).toBe("/test-url");
    expect(updatedConfig.method).toBe("get");
    expect(updatedConfig.headers.Authorization).toBe("Bearer xyz789");
  });

  test("reject handler returns error", async () => {
    const rejectHandler =
      customFetch.interceptors.request.handlers[0].rejected;

    const error = new Error("Request error");

    await expect(rejectHandler(error)).rejects.toThrow("Request error");
  });
});