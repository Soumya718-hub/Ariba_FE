import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import AddEntry from "./AddEntry";

/* ---------------- MOCKS ---------------- */

vi.mock("../../api/case", () => ({
  getAllClients: vi.fn(() =>
    Promise.resolve({
      success: true,
      data: [{ ClientID: 1, ClientName: "Infosys" }],
    }),
  ),

  createCase: vi.fn(),
  updateCase: vi.fn(),

  getAllCallTypes: vi.fn(() =>
    Promise.resolve({
      success: true,
      data: [{ callType: "REQ" }],
    }),
  ),

  getAllCallModes: vi.fn(() =>
    Promise.resolve({
      success: true,
      data: [{ callMode: "Email" }],
    }),
  ),

  getLatestCaseDetails: vi.fn(),

  // ✅ IMPORTANT FIX (match component)
  getAllEmployees: vi.fn(() =>
    Promise.resolve([
      { emp_id: "123", emp_name: "Self User" },
      { emp_id: "456", emp_name: "Other User" },
    ]),
  ),

  getAllEmployees: vi.fn(() =>
    Promise.resolve([
      { emp_id: "123", emp_name: "Self User" },
      { emp_id: "456", emp_name: "Other User" },
    ]),
  ),
}));

/* ---------- react-select mock ---------- */

vi.mock("react-select", () => ({
  default: ({ options, onChange, placeholder }) => (
    <select
      data-testid={placeholder || "Select"}
      onChange={(e) => {
        const selected = options.find(
          (opt) => String(opt.value) === e.target.value,
        );
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

/* ---------- DatePicker mock ---------- */

vi.mock("antd", () => ({
  DatePicker: ({ onChange }) => (
    <input
      data-testid="date-picker"
      onChange={(e) => onChange({ format: () => e.target.value })}
    />
  ),
}));

/* ---------- router mock ---------- */

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({}),
  };
});

/* ---------------- TESTS ---------------- */

describe("AddEntry Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("emp_id", "123");
  });

  /* ---------- RENDER ---------- */

  test("renders Add Entry page", async () => {
    render(
      <BrowserRouter>
        <AddEntry role="USER" />
      </BrowserRouter>,
    );

    expect(await screen.findByText(/add new entry/i)).toBeInTheDocument();
  });

  /* ---------- INPUT ---------- */

  test("allows typing name", async () => {
    render(
      <BrowserRouter>
        <AddEntry role="USER" />
      </BrowserRouter>,
    );

    const input = screen.getByPlaceholderText(/enter contact name/i);
    await userEvent.type(input, "John");

    expect(input.value).toBe("John");
  });

  /* ---------- VALIDATION ---------- */

  test("shows validation errors on empty submit", async () => {
    render(
      <BrowserRouter>
        <AddEntry role="USER" />
      </BrowserRouter>,
    );

    const button = screen.getByRole("button", { name: /save entry/i });
    button.removeAttribute("disabled");

    fireEvent.click(button);

    expect(await screen.findByText(/client is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
  });

  /* ---------- SUCCESS ---------- */

  test("submits form successfully", async () => {
    const { createCase } = await import("../../api/case");

    createCase.mockResolvedValue({
      success: true,
      message: "Entry created successfully!",
    });

    render(
      <BrowserRouter>
        <AddEntry role="USER" />
      </BrowserRouter>,
    );

    const client = await screen.findByTestId("Select Client");

    await userEvent.selectOptions(client, "1");

    await userEvent.type(
      screen.getByPlaceholderText(/enter contact name/i),
      "John",
    );

    const selects = screen.getAllByTestId("Select");

    await userEvent.selectOptions(selects[0], "REQ");
    await userEvent.selectOptions(selects[1], "Email");
    await userEvent.selectOptions(selects[2], "high");
    await userEvent.selectOptions(selects[3], "Open");

    const button = screen.getByRole("button", { name: /save entry/i });
    button.removeAttribute("disabled");

    fireEvent.click(button);

    await waitFor(() => {
      expect(createCase).toHaveBeenCalled();
    });

    expect(
      await screen.findByText(/entry created successfully/i),
    ).toBeInTheDocument();
  });

  /* ---------- API FAIL ---------- */

  test("shows error on API failure", async () => {
    const { createCase } = await import("../../api/case");

    createCase.mockResolvedValue({
      success: false,
      message: "Something went wrong",
    });

    render(
      <BrowserRouter>
        <AddEntry role="USER" />
      </BrowserRouter>,
    );

    const client = await screen.findByTestId("Select Client");

    await userEvent.selectOptions(client, "1");

    await userEvent.type(
      screen.getByPlaceholderText(/enter contact name/i),
      "John",
    );

    const selects = screen.getAllByTestId("Select");

    await userEvent.selectOptions(selects[0], "REQ");
    await userEvent.selectOptions(selects[1], "Email");
    await userEvent.selectOptions(selects[2], "high");
    await userEvent.selectOptions(selects[3], "Open");

    const button = screen.getByRole("button", { name: /save entry/i });
    button.removeAttribute("disabled");

    fireEvent.click(button);

    expect(
      await screen.findByText(/something went wrong/i),
    ).toBeInTheDocument();
  });

  /* ---------- FOLLOW UP ---------- */

  test("shows date picker when status is Follow_up", async () => {
    render(
      <BrowserRouter>
        <AddEntry role="USER" />
      </BrowserRouter>,
    );

    const selects = screen.getAllByTestId("Select");

    await userEvent.selectOptions(selects[3], "Follow_up");

    expect(await screen.findByTestId("date-picker")).toBeInTheDocument();
  });

  /* ---------- FORWARD SELF ---------- */

  test("prevents forwarding to self", async () => {
    render(
      <BrowserRouter>
        <AddEntry role="USER" />
      </BrowserRouter>,
    );

    const client = await screen.findByTestId("Select Client");

    await userEvent.selectOptions(client, "1");

    await userEvent.type(
      screen.getByPlaceholderText(/enter contact name/i),
      "John",
    );

    const selects = screen.getAllByTestId("Select");

    await userEvent.selectOptions(selects[0], "REQ");
    await userEvent.selectOptions(selects[1], "Email");
    await userEvent.selectOptions(selects[2], "high");
    await userEvent.selectOptions(selects[3], "Open");

    // wait employees load
    await waitFor(() => {
      expect(selects[4].options.length).toBeGreaterThan(1);
    });

    await userEvent.selectOptions(selects[4], "123");

    const button = screen.getByRole("button", { name: /save entry/i });
    button.removeAttribute("disabled");

    fireEvent.click(button);

    expect(
      await screen.findByText(/cannot forward case to yourself/i),
    ).toBeInTheDocument();
  });
});
