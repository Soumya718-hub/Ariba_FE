import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AppLayout from "./AppLayout";

/* ---------------- MOCK CHILD COMPONENTS ---------------- */

vi.mock("./Navbar", () => ({
  default: ({ collapsed }) => (
    <div data-testid="navbar">Navbar - {collapsed ? "collapsed" : "expanded"}</div>
  ),
}));

vi.mock("./Sidebar", () => ({
  default: ({ collapsed }) => (
    <div data-testid="sidebar">Sidebar - {collapsed ? "collapsed" : "expanded"}</div>
  ),
}));

/* ---------------- MOCK OUTLET ---------------- */

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet">Page Content</div>,
  };
});

/* ---------------- TESTS ---------------- */

describe("AppLayout Component", () => {

  test("renders Navbar, Sidebar and Outlet", () => {
    render(
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    );

    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("outlet")).toBeInTheDocument();
  });

  test("default state is not collapsed", () => {
    render(
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    );

    expect(screen.getByText(/expanded/i)).toBeInTheDocument();
  });

  test("layout structure renders correctly", () => {
    render(
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    );

    const navbar = screen.getByTestId("navbar");
    const sidebar = screen.getByTestId("sidebar");
    const outlet = screen.getByTestId("outlet");

    expect(navbar).toBeInTheDocument();
    expect(sidebar).toBeInTheDocument();
    expect(outlet).toBeInTheDocument();
  });

});