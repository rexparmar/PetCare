import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardPage } from "../pages/DashboardPage";
import { api } from "../services/api";

vi.mock("../services/api", () => ({ api: vi.fn() }));
vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: { fullName: "Alex Morgan", email: "alex@example.com" },
  }),
}));

function renderDashboard() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("DashboardPage", () => {
  beforeEach(() => vi.mocked(api).mockReset());

  it("shows a loading state while dashboard data is pending", () => {
    vi.mocked(api).mockImplementation(
      () =>
        new Promise((resolve) =>
          window.setTimeout(
            () =>
              resolve({
                petCount: 0,
                pets: [],
                upcomingAppointments: [],
                recentHealthRecords: [],
              }),
            50,
          ),
        ),
    );
    renderDashboard();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Preparing your care overview",
    );
  });

  it("renders database-backed dashboard data", async () => {
    vi.mocked(api).mockResolvedValue({
      petCount: 1,
      pets: [
        {
          id: "1",
          name: "Milo",
          species: "Dog",
          breed: "Beagle",
          gender: "MALE",
          weight: 12,
          dateOfBirth: null,
          medicalNotes: null,
          ownerId: "owner",
          createdAt: "",
          updatedAt: "",
          _count: { healthRecords: 2, appointments: 1 },
        },
      ],
      upcomingAppointments: [],
      recentHealthRecords: [],
    });
    renderDashboard();
    expect(await screen.findByText(/welcome back, alex/i)).toBeInTheDocument();
    expect(screen.getAllByText("Milo").length).toBeGreaterThan(0);
    expect(screen.getByText("2 records")).toBeInTheDocument();
  });
});
