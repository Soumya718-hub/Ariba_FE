import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import LoggedCalls from "./LoggedCalls";

/* ---------------- MOCKS ---------------- */

vi.mock("../../api/case", () => ({
  getLoggedCalls: vi.fn(() =>
    Promise.resolve({
      success: true,
      data: [
        {
          CaseID: "C001",
          ClientName: "Infosys",
          name: "John",
          CallType: "REQ",
          CallMode: "Email",
          Priority: "high",
          Status: "Open",
          LogDate: "2025-01-01",
          forwarded_to_name: "User A",
          ForwardedToUserID: "456",
        },
      ],
    }),
  ),

  transferCase: vi.fn(() => Promise.resolve({ success: true })),

  getAllAribaEmp: vi.fn(() =>
    Promise.resolve({
      success: true,
      data: [
        { emp_id: "123", emp_name: "Self User" },
        { emp_id: "456", emp_name: "Other User" },
      ],
    }),
  ),
}));

vi.mock("../../api/hrms", () => ({
  getAllEmployees: vi.fn(() =>
    Promise.resolve([
      { emp_id: "123", emp_name: "Self User" },
      { emp_id: "456", emp_name: "Other User" },
    ]),
  ),
}));

/* ---------- react-select mock ---------- */

vi.mock("react-select", () => ({
  default: ({ options, onChange }) => (
    <select
      data-testid="select"
      onChange={(e) => {
        const selected = options.find((opt) => opt.value === e.target.value);
        onChange(selected);
      }}
    >
      <option value="">Select</option>
      {options.map((opt, i) => (
        <option key={i} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
}));

/* ---------- antd mock ---------- */

vi.mock("antd", () => ({
  DatePicker: {
    RangePicker: ({ onChange }) => (
      <input
        data-testid="range-picker"
        onChange={(e) =>
          onChange([{ toDate: () => new Date() }, { toDate: () => new Date() }])
        }
      />
    ),
  },
  message: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

/* ---------- router mock ---------- */

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

/* ---------------- TESTS ---------------- */

describe("LoggedCalls Component", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    localStorage.setItem("emp_id", "123");
    localStorage.setItem("role", "USER");

    const { getLoggedCalls } = await import("../../api/case");

    getLoggedCalls.mockResolvedValue({
      success: true,
      data: [
        {
          CaseID: "C001",
          ClientName: "Infosys",
          name: "John",
          CallType: "REQ",
          CallMode: "Email",
          Priority: "high",
          Status: "Open",
          LogDate: "2025-01-01",
          forwarded_to_name: "User A",
          ForwardedToUserID: "456",
        },
      ],
    });
  });

  /* ---------- RENDER ---------- */

  test("renders logged calls page", async () => {
    render(
      <BrowserRouter>
        <LoggedCalls />
      </BrowserRouter>,
    );

    expect(await screen.findByText(/logged calls/i)).toBeInTheDocument();
  });

  /* ---------- TABLE DATA ---------- */

  test("displays fetched data in table", async () => {
    render(
      <BrowserRouter>
        <LoggedCalls />
      </BrowserRouter>,
    );

    expect(await screen.findByText("C001")).toBeInTheDocument();
    expect(screen.getByText("Infosys")).toBeInTheDocument();
    expect(screen.getByText("John")).toBeInTheDocument();
  });

  /* ---------- SEARCH ---------- */

  test("filters data using search", async () => {
    render(
      <BrowserRouter>
        <LoggedCalls />
      </BrowserRouter>,
    );

    const searchInput =
      await screen.findByPlaceholderText(/search by case id/i);

    await userEvent.type(searchInput, "C001");

    expect(await screen.findByText("C001")).toBeInTheDocument();
  });

  /* ---------- EMPTY STATE ---------- */

  test("shows no data message when API returns empty", async () => {
    const { getLoggedCalls } = await import("../../api/case");

    getLoggedCalls.mockResolvedValue({
      success: true,
      data: [],
    });

    render(
      <BrowserRouter>
        <LoggedCalls />
      </BrowserRouter>,
    );

    expect(await screen.findByText(/no data found/i)).toBeInTheDocument();
  });

  /* ---------- ROW SELECT ---------- */

  test("allows selecting a row", async () => {
    render(
      <BrowserRouter>
        <LoggedCalls />
      </BrowserRouter>,
    );

    const checkbox = await screen.findByRole("checkbox");

    fireEvent.click(checkbox);

    expect(checkbox.checked).toBe(true);
  });

  /* ---------- OPEN TRANSFER MODAL ---------- */

  test("opens transfer modal when button clicked", async () => {
    render(
      <BrowserRouter>
        <LoggedCalls />
      </BrowserRouter>,
    );

    const checkbox = await screen.findByRole("checkbox");
    fireEvent.click(checkbox);

    const button = screen.getByText(/transfer cases/i);
    fireEvent.click(button);
    expect(
      await screen.findByText("Transfer Case", { selector: "h2" }),
    ).toBeInTheDocument();
  });

  /* ---------- TRANSFER SUCCESS ---------- */

  test("transfers case successfully", async () => {
    const { transferCase } = await import("../../api/case");

    render(
      <BrowserRouter>
        <LoggedCalls />
      </BrowserRouter>,
    );

    // select row
    const checkbox = await screen.findByRole("checkbox");
    fireEvent.click(checkbox);

    // open modal
    fireEvent.click(screen.getByText(/transfer cases/i));

    // select user
    const select = await screen.findByTestId("select");

    await userEvent.selectOptions(select, "456");

    // click transfer
    const button = screen.getByText(/transfer now/i);
    fireEvent.click(button);

    await waitFor(() => {
      expect(transferCase).toHaveBeenCalled();
    });
  });

  /* ---------- PREVENT SELF TRANSFER ---------- */

  test("prevents transferring to self", async () => {
    const { message } = await import("antd");

    render(
      <BrowserRouter>
        <LoggedCalls />
      </BrowserRouter>,
    );

    const checkbox = await screen.findByRole("checkbox");
    fireEvent.click(checkbox);

    fireEvent.click(screen.getByText(/transfer cases/i));

    const select = await screen.findByTestId("select");

    await userEvent.selectOptions(select, "123"); // self

    fireEvent.click(screen.getByText(/transfer now/i));

    await waitFor(() => {
      expect(message.error).toHaveBeenCalled();
    });
  });
});
