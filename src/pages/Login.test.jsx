import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import Login from "./Login";
import { login } from "../api/auth";

/* ---------------- MOCKS ---------------- */

vi.mock("../api/auth", () => ({
    login: vi.fn()
}));

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

/* ---------------- TESTS ---------------- */

describe("Login Page", () => {

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    test("renders login form elements", () => {
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );

        expect(screen.getByText(/login/i)).toBeInTheDocument();

        expect(
            screen.getByPlaceholderText(/admin@company.com/i)
        ).toBeInTheDocument();

        expect(
            screen.getByPlaceholderText(/enter password/i)
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: /log into account/i })
        ).toBeInTheDocument();
    });

    test("allows typing email and password", async () => {
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );

        const emailInput = screen.getByPlaceholderText(/admin@company.com/i);
        const passwordInput = screen.getByPlaceholderText(/enter password/i);

        await userEvent.type(emailInput, "admin@test.com");
        await userEvent.type(passwordInput, "password123");

        expect(emailInput.value).toBe("admin@test.com");
        expect(passwordInput.value).toBe("password123");
    });

    test("toggles password visibility", async () => {
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );

        const passwordInput = screen.getByPlaceholderText(/enter password/i);

        const toggleButton = screen.getAllByRole("button")[0];

        expect(passwordInput.type).toBe("password");

        fireEvent.click(toggleButton);

        await waitFor(() => {
            expect(passwordInput.type).toBe("text");
        });
    });

    test("shows error for invalid login", async () => {

        login.mockResolvedValue({
            success: false,
            message: "Invalid credentials"
        });

        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );

        const emailInput = screen.getByPlaceholderText(/admin@company.com/i);
        const passwordInput = screen.getByPlaceholderText(/enter password/i);
        const button = screen.getByRole("button", { name: /log into account/i });

        await userEvent.type(emailInput, "wrong@test.com");
        await userEvent.type(passwordInput, "wrongpass");

        fireEvent.click(button);

        const errorMessage = await screen.findByText(/invalid credentials/i);
        expect(errorMessage).toBeInTheDocument();

    });

    test("successful login navigates to dashboard", async () => {

        login.mockResolvedValue({
            success: true,
            token: "fake-token",
            data: {
                emp_id: "123",
                role: ["SUPERADMIN"]
            }
        });

        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );

        const emailInput = screen.getByPlaceholderText(/admin@company.com/i);
        const passwordInput = screen.getByPlaceholderText(/enter password/i);
        const button = screen.getByRole("button", { name: /log into account/i });

        await userEvent.type(emailInput, "admin@test.com");
        await userEvent.type(passwordInput, "password123");

        fireEvent.click(button);

        await waitFor(() => {
            expect(login).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith("/superadmin/dashboard");
        });

        expect(localStorage.getItem("token")).toBe("fake-token");
    });

});