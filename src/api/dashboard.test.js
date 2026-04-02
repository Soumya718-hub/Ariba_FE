import { describe, test, expect, vi, beforeEach } from "vitest";
import customFetch from "./axios";

import {
  getUserDashboardCounts,
  getUserFilteredCases,
  getAdminDashboardCounts,
  getWeeklySummary,
  getAdminFilteredCases,
  markForwardedAsSeen,
} from "./dashboard";

/* ---------------- MOCK AXIOS ---------------- */

vi.mock("./axios");

/* ---------------- TESTS ---------------- */

describe("Dashboard API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* ---------- USER COUNTS ---------- */

  test("getUserDashboardCounts without params", async () => {
    customFetch.get.mockResolvedValue({ data: { success: true } });

    const res = await getUserDashboardCounts();

    expect(customFetch.get).toHaveBeenCalledWith(
      "/dashboard/user/dashboard/counts"
    );

    expect(res).toEqual({ success: true });
  });

  test("getUserDashboardCounts with date params", async () => {
    customFetch.get.mockResolvedValue({ data: { success: true } });

    await getUserDashboardCounts({
      startDate: "2025-01-01",
      endDate: "2025-01-10",
    });

    expect(customFetch.get).toHaveBeenCalledWith(
      "/dashboard/user/dashboard/counts?startDate=2025-01-01&endDate=2025-01-10"
    );
  });

  test("getUserDashboardCounts error returns null", async () => {
    customFetch.get.mockRejectedValue({
      response: { data: "error" },
    });

    const res = await getUserDashboardCounts();

    expect(res).toBeNull();
  });

  /* ---------- USER FILTERED ---------- */

  test("getUserFilteredCases success", async () => {
    const payload = { cardType: "total" };

    customFetch.post.mockResolvedValue({
      data: { success: true },
    });

    const res = await getUserFilteredCases(payload);

    expect(customFetch.post).toHaveBeenCalledWith(
      "/dashboard/user/dashboard/filtered-cases",
      payload
    );

    expect(res).toEqual({ success: true });
  });

  test("getUserFilteredCases error", async () => {
    customFetch.post.mockRejectedValue({
      response: { data: "error" },
    });

    const res = await getUserFilteredCases({});

    expect(res).toBeNull();
  });

  /* ---------- ADMIN COUNTS ---------- */

  test("getAdminDashboardCounts builds query params", async () => {
    customFetch.get.mockResolvedValue({ data: {} });

    await getAdminDashboardCounts({
      startDate: "2025-01-01",
      endDate: "2025-01-10",
    });

    expect(customFetch.get).toHaveBeenCalledWith(
      "/dashboard/admin/dashboard/counts?startDate=2025-01-01&endDate=2025-01-10"
    );
  });

  test("getAdminDashboardCounts without params", async () => {
    customFetch.get.mockResolvedValue({ data: {} });

    await getAdminDashboardCounts();

    expect(customFetch.get).toHaveBeenCalledWith(
      "/dashboard/admin/dashboard/counts"
    );
  });

  /* ---------- WEEKLY SUMMARY ---------- */

  test("getWeeklySummary success", async () => {
    customFetch.get.mockResolvedValue({ data: { graph: [] } });

    const res = await getWeeklySummary();

    expect(customFetch.get).toHaveBeenCalledWith(
      "/dashboard/admin/dashboard/weekly-summary"
    );

    expect(res).toEqual({ graph: [] });
  });

  /* ---------- ADMIN FILTERED ---------- */

  test("getAdminFilteredCases success", async () => {
    const payload = { cardType: "open" };

    customFetch.post.mockResolvedValue({ data: { success: true } });

    const res = await getAdminFilteredCases(payload);

    expect(customFetch.post).toHaveBeenCalledWith(
      "/dashboard/admin/dashboard/filtered-cases",
      payload
    );

    expect(res).toEqual({ success: true });
  });

  /* ---------- MARK FORWARDED ---------- */

  test("markForwardedAsSeen success", async () => {
    const payload = { caseId: "123" };

    customFetch.post.mockResolvedValue({ data: { success: true } });

    const res = await markForwardedAsSeen(payload);

    expect(customFetch.post).toHaveBeenCalledWith(
      "/dashboard/user/forwarded/seen",
      payload
    );

    expect(res).toEqual({ success: true });
  });

  test("markForwardedAsSeen error", async () => {
    customFetch.post.mockRejectedValue({
      response: { data: "error" },
    });

    const res = await markForwardedAsSeen({});

    expect(res).toBeNull();
  });
});