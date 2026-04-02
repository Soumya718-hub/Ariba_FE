import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Dashboard from "./Dashboard";

/* ---------------- MOCKS ---------------- */

vi.mock("../../api/dashboard", () => ({
  getUserDashboardCounts: vi.fn(() =>
    Promise.resolve({
      success: true,
      data: {
        counts: {
          total_calls: 10,
          open_calls: 3,
          resolved_calls: 2,
          pending_updates_calls: 1,
          follow_up_calls: 2,
          closed_calls: 2,
          forwarded: 4,
        },
        notification: {
          has_unseen: true,
          unseen_count: 2,
          total_forwarded: 4,
          recent_unseen: [],
        },
      },
    }),
  ),

  getUserFilteredCases: vi.fn(() =>
    Promise.resolve({
      success: true,
      data: {
        cases: [
          {
            CaseID: "C001",
            ClientName: "Infosys",
            CallType: "REQ",
            Priority: "high",
            Status: "Open",
          },
        ],
      },
    }),
  ),

  markForwardedAsSeen: vi.fn(() => Promise.resolve({ success: true })),
}));

/* ---------- antd mock ---------- */

vi.mock("antd", () => ({
  DatePicker: {
    RangePicker: ({ onChange }) => (
      <input
        data-testid="range-picker"
        onChange={() =>
          onChange([
            { toDate: () => new Date("2025-01-01") },
            { toDate: () => new Date("2025-01-10") },
          ])
        }
      />
    ),
  },
}));

/* ---------------- TESTS ---------------- */

describe("Dashboard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* ---------- RENDER ---------- */

  test("renders dashboard page", async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );

    expect(await screen.findByText(/dashboard overview/i)).toBeInTheDocument();
  });

  /* ---------- COUNTS ---------- */

  test("displays dashboard counts", async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );

    expect(await screen.findByText("10")).toBeInTheDocument(); // total
    expect(screen.getByText("3")).toBeInTheDocument(); // open
  });

  /* ---------- TABLE DATA ---------- */

  test("displays table data", async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );

    expect(await screen.findByText("C001")).toBeInTheDocument();
    expect(screen.getByText("Infosys")).toBeInTheDocument();
  });

  /* ---------- CARD CLICK ---------- */

  test("filters data when card clicked", async () => {
    const { getUserFilteredCases } = await import("../../api/dashboard");

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );

    const openCard = await screen.findByText(/open calls/i);
    fireEvent.click(openCard);

    await waitFor(() => {
      expect(getUserFilteredCases).toHaveBeenCalled();
    });
  });

  /* ---------- FORWARDED CLICK ---------- */

  test("marks forwarded as seen when forwarded card clicked", async () => {
    const { markForwardedAsSeen } = await import("../../api/dashboard");

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );

    const forwardedCard = await screen.findByText(/forwarded/i);
    fireEvent.click(forwardedCard);

    await waitFor(() => {
      expect(markForwardedAsSeen).toHaveBeenCalled();
    });
  });

  /* ---------- EMPTY STATE ---------- */

  test("shows no records when API returns empty", async () => {
    const { getUserFilteredCases } = await import("../../api/dashboard");

    getUserFilteredCases.mockResolvedValue({
      success: true,
      data: { cases: [] },
    });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );

    expect(await screen.findByText(/no records found/i)).toBeInTheDocument();
  });

  /* ---------- DATE RANGE ---------- */

test("changes data on date range selection", async () => {
  const { getUserDashboardCounts } = await import("../../api/dashboard");

  render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  );

  const button = screen.getByText(/date range/i);
  fireEvent.click(button);

  const rangeInput = await screen.findByTestId("range-picker");

  fireEvent.change(rangeInput);

  await waitFor(() => {
    expect(getUserDashboardCounts).toHaveBeenCalled();
  });
});
});
