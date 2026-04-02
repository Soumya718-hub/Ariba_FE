import { describe, test, expect, vi, beforeEach } from "vitest";
import customFetch from "./axios";

import {
  createBackdatedDirect,
  modifyBackdatedDirect,
  archiveBackdatedDirect,
  raiseBackdatedRequest,
  raiseModifyRequest,
  raiseArchiveRequest,
  getAllLatestBackdatedCases,
  getAllBackdatedRequests,
  getBackdatedRequestDetails,
  processBackdatedRequest,
  getArchivedCases,
} from "./backdated";

/* ---------------- MOCK AXIOS ---------------- */

vi.mock("./axios");

/* ---------------- TESTS ---------------- */

describe("Backdated API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  /* ---------- CREATE ---------- */

  test("createBackdatedDirect success", async () => {
    const payload = { caseId: "1" };

    customFetch.post.mockResolvedValue({ data: { success: true } });

    const res = await createBackdatedDirect(payload);

    expect(customFetch.post).toHaveBeenCalledWith(
      "/backdate/super-admin/backdated/create",
      payload
    );

    expect(res).toEqual({ success: true });
  });

  test("createBackdatedDirect error fallback", async () => {
    customFetch.post.mockRejectedValue({});

    const res = await createBackdatedDirect({});

    expect(res).toEqual({ success: false });
  });

  /* ---------- MODIFY ---------- */

  test("modifyBackdatedDirect success", async () => {
    customFetch.put.mockResolvedValue({ data: { success: true } });

    const res = await modifyBackdatedDirect("123", {});

    expect(customFetch.put).toHaveBeenCalledWith(
      "/backdate/super-admin/backdated/modify/123",
      {}
    );

    expect(res).toEqual({ success: true });
  });

  /* ---------- ARCHIVE ---------- */

  test("archiveBackdatedDirect success", async () => {
    customFetch.put.mockResolvedValue({ data: { success: true } });

    const res = await archiveBackdatedDirect("123", {});

    expect(customFetch.put).toHaveBeenCalledWith(
      "/backdate/super-admin/backdated/archive/123",
      {}
    );

    expect(res).toEqual({ success: true });
  });

  /* ---------- ADMIN REQUESTS ---------- */

  test("raiseBackdatedRequest success", async () => {
    customFetch.post.mockResolvedValue({ data: { success: true } });

    const res = await raiseBackdatedRequest({});

    expect(customFetch.post).toHaveBeenCalledWith(
      "/backdate/admin/requests/backdated",
      {}
    );

    expect(res).toEqual({ success: true });
  });

  test("raiseModifyRequest success", async () => {
    customFetch.post.mockResolvedValue({ data: { success: true } });

    const res = await raiseModifyRequest("123", {});

    expect(customFetch.post).toHaveBeenCalledWith(
      "/backdate/admin/requests/modify/123",
      {}
    );

    expect(res).toEqual({ success: true });
  });

  test("raiseArchiveRequest success", async () => {
    customFetch.post.mockResolvedValue({ data: { success: true } });

    const res = await raiseArchiveRequest("123", {});

    expect(customFetch.post).toHaveBeenCalledWith(
      "/backdate/admin/requests/archive/123",
      {}
    );

    expect(res).toEqual({ success: true });
  });

  /* ---------- COMMON ---------- */

  test("getAllLatestBackdatedCases success", async () => {
    customFetch.get.mockResolvedValue({ data: { cases: [] } });

    const res = await getAllLatestBackdatedCases();

    expect(customFetch.get).toHaveBeenCalledWith(
      "/backdate/all-latest-cases"
    );

    expect(res).toEqual({ cases: [] });
  });

  /* ---------- ROLE BASED ---------- */

  test("getAllBackdatedRequests uses SUPERADMIN url", async () => {
    localStorage.setItem("role", "SUPERADMIN");

    customFetch.get.mockResolvedValue({ data: {} });

    await getAllBackdatedRequests();

    expect(customFetch.get).toHaveBeenCalledWith(
      "/backdate/super-admin/getAllRequests"
    );
  });

  test("getAllBackdatedRequests uses ADMIN url", async () => {
    localStorage.setItem("role", "ADMIN");

    customFetch.get.mockResolvedValue({ data: {} });

    await getAllBackdatedRequests();

    expect(customFetch.get).toHaveBeenCalledWith(
      "/backdate/backdated-requests"
    );
  });

  /* ---------- DETAILS ---------- */

  test("getBackdatedRequestDetails success", async () => {
    customFetch.get.mockResolvedValue({ data: {} });

    await getBackdatedRequestDetails("123");

    expect(customFetch.get).toHaveBeenCalledWith(
      "/backdate/backdated-requests/123"
    );
  });

  /* ---------- PROCESS REQUEST ---------- */

  test("processBackdatedRequest without remarks", async () => {
    customFetch.put.mockResolvedValue({ data: {} });

    await processBackdatedRequest("1", "APPROVE");

    expect(customFetch.put).toHaveBeenCalledWith(
      "/backdate/super-admin/requests/1/process",
      { action: "APPROVE" }
    );
  });

  test("processBackdatedRequest with remarks", async () => {
    customFetch.put.mockResolvedValue({ data: {} });

    await processBackdatedRequest("1", "REJECT", "invalid");

    expect(customFetch.put).toHaveBeenCalledWith(
      "/backdate/super-admin/requests/1/process",
      { action: "REJECT", remarks: "invalid" }
    );
  });

  /* ---------- ARCHIVED ---------- */

  test("getArchivedCases success", async () => {
    const filters = { startDate: "2025-01-01" };

    customFetch.post.mockResolvedValue({ data: {} });

    await getArchivedCases(filters);

    expect(customFetch.post).toHaveBeenCalledWith(
      "/backdate/archived-cases",
      filters
    );
  });

  /* ---------- ERROR CASE ---------- */

  test("error returns fallback response", async () => {
    customFetch.get.mockRejectedValue({
      response: { data: { success: false } },
    });

    const res = await getAllLatestBackdatedCases();

    expect(res).toEqual({ success: false });
  });
});