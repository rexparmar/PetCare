import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../components/ui/Toast";
import { ActivitiesPage } from "../pages/ActivitiesPage";
import { ClinicPage } from "../pages/ClinicPage";
import { MedicationsPage } from "../pages/MedicationsPage";
import { NotificationsPage } from "../pages/NotificationsPage";
import { PhotosPage } from "../pages/PhotosPage";
import { api, apiBlob } from "../services/api";

vi.mock("../services/api", () => ({ api: vi.fn(), apiBlob: vi.fn() }));

const pet = {
  id: "p1",
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
};

function mockApi(extra: Record<string, unknown>) {
  vi.mocked(api).mockImplementation(async (path: string) => {
    if (path === "/pets/p1") return pet;
    if (path in extra) return extra[path];
    throw new Error(`Unexpected request: ${path}`);
  });
}

function renderAt(path: string, route: string, element: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path={route} element={element} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe("care pages", () => {
  beforeEach(() => {
    vi.mocked(api).mockReset();
    vi.mocked(apiBlob).mockReset();
  });

  it("lists medications and validates the add form", async () => {
    const user = userEvent.setup();
    mockApi({
      "/pets/p1/medications": [
        {
          id: "m1",
          petId: "p1",
          name: "Amoxicillin",
          dosage: "1 tablet",
          frequency: "TWICE_DAILY",
          timesOfDay: ["08:00", "20:00"],
          startDate: "2026-11-01T00:00:00.000Z",
          endDate: null,
          instructions: null,
          isActive: true,
          createdAt: "",
          updatedAt: "",
        },
      ],
    });
    renderAt(
      "/pets/p1/medications",
      "/pets/:petId/medications",
      <MedicationsPage />,
    );

    expect(await screen.findByText("Amoxicillin")).toBeInTheDocument();
    expect(screen.getByText("1 tablet")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /add medication/i }));
    await user.click(screen.getByRole("button", { name: /save medication/i }));
    expect(
      await screen.findByText("Medication name is required."),
    ).toBeInTheDocument();
    expect(screen.getByText("Dosage is required.")).toBeInTheDocument();
  });

  it("shows logged activities with a weekly summary", async () => {
    mockApi({
      "/pets/p1/activities": [
        {
          id: "a1",
          petId: "p1",
          activityType: "WALK",
          activityDate: new Date().toISOString(),
          durationMinutes: 45,
          distanceKm: 3.2,
          notes: "Park loop",
          createdAt: "",
          updatedAt: "",
        },
      ],
    });
    renderAt(
      "/pets/p1/activities",
      "/pets/:petId/activities",
      <ActivitiesPage />,
    );

    expect(await screen.findByText("Park loop")).toBeInTheDocument();
    expect(screen.getByText("Last 7 days")).toBeInTheDocument();
    expect(screen.getAllByText("45 min").length).toBeGreaterThan(0);
    expect(screen.getAllByText("3.2 km").length).toBeGreaterThan(0);
  });

  it("shows the photo gallery and an empty state", async () => {
    vi.mocked(apiBlob).mockRejectedValue(new Error("offline"));
    mockApi({
      "/pets/p1/photos": [
        {
          id: "ph1",
          petId: "p1",
          caption: "Sunny day",
          width: 800,
          height: 600,
          sizeBytes: 1000,
          createdAt: "2026-11-10T12:00:00.000Z",
        },
      ],
    });
    const first = renderAt(
      "/pets/p1/photos",
      "/pets/:petId/photos",
      <PhotosPage />,
    );
    expect(
      await screen.findByRole("button", { name: /view sunny day/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 of 50 photos/i)).toBeInTheDocument();
    first.unmount();

    mockApi({ "/pets/p1/photos": [] });
    renderAt("/pets/p1/photos", "/pets/:petId/photos", <PhotosPage />);
    expect(await screen.findByText("No photos yet")).toBeInTheDocument();
  });
  it("shows reminders and marks one as read", async () => {
    const user = userEvent.setup();
    mockApi({
      "/notifications": {
        unreadCount: 1,
        items: [
          {
            id: "n1",
            petId: "p1",
            type: "MEDICATION",
            title: "Milo: time for Amoxicillin",
            message: "Give 1 tablet (08:00).",
            dueAt: "2026-11-19T13:00:00.000Z",
            readAt: null,
            createdAt: "2026-11-19T13:00:00.000Z",
            pet: { id: "p1", name: "Milo" },
          },
        ],
      },
      "/notifications/preferences": {
        timeZone: "America/Toronto",
        medicationReminders: true,
        appointmentReminders: true,
        appointmentLeadHours: 24,
      },
      "/notifications/n1/read": {},
    });
    renderAt("/notifications", "/notifications", <NotificationsPage />);

    expect(
      await screen.findByText("Milo: time for Amoxicillin"),
    ).toBeInTheDocument();
    expect(screen.getByText("Give 1 tablet (08:00).")).toBeInTheDocument();
    expect(await screen.findByText(/America\/Toronto/)).toBeInTheDocument();
    expect(screen.getByLabelText("Remind me about appointments")).toHaveValue(
      "24",
    );

    await user.click(
      screen.getByRole("button", {
        name: /mark "milo: time for amoxicillin" as read/i,
      }),
    );
    expect(api).toHaveBeenCalledWith("/notifications/n1/read", {
      method: "POST",
    });
  });

  it("shows the linked clinic, request status, and shares records", async () => {
    const user = userEvent.setup();
    const clinic = {
      id: "happypaws-downtown",
      name: "HappyPaws Downtown Clinic",
      address: "120 Bank Street, Ottawa, ON",
      phone: "(613) 555-0101",
      email: "downtown@happypaws.example",
      hours: "Mon-Fri 9:00 a.m. - 5:00 p.m.",
      acceptsAfterReview: false,
    };
    mockApi({
      "/pets/p1/clinic": {
        clinic,
        linkedAt: "2026-11-19T12:00:00.000Z",
        lastSharedAt: null,
        lastSharedCount: 0,
      },
      "/clinics": [clinic],
      "/appointments": [
        {
          id: "a1",
          petId: "p1",
          appointmentDate: new Date(Date.now() + 3 * 86_400_000).toISOString(),
          providerName: "HappyPaws Clinic",
          reason: "Annual exam",
          notes: null,
          status: "SCHEDULED",
          createdAt: "",
          updatedAt: "",
          pet: { id: "p1", name: "Milo", species: "Dog" },
        },
      ],
      "/pets/p1/clinic/requests": [
        {
          id: "r1",
          appointmentId: "a1",
          clinicId: clinic.id,
          externalReference: "SIM-1234ABCD",
          status: "CONFIRMED",
          message: "Confirmed by HappyPaws Downtown Clinic.",
          submittedAt: "",
          updatedAt: "",
        },
      ],
      "/pets/p1/clinic/share-records": {
        receiptId: "REC-1",
        sharedCount: 2,
        sharedAt: "2026-11-19T13:00:00.000Z",
      },
    });
    renderAt("/pets/p1/clinic", "/pets/:petId/clinic", <ClinicPage />);

    expect(await screen.findByText(/demo clinic network/i)).toBeInTheDocument();
    expect(
      screen.getAllByText("HappyPaws Downtown Clinic").length,
    ).toBeGreaterThan(1);
    expect(screen.getByText("Annual exam")).toBeInTheDocument();
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send again/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Linked" })).toBeDisabled();

    await user.click(
      screen.getByRole("button", { name: /share health records/i }),
    );
    expect(api).toHaveBeenCalledWith("/pets/p1/clinic/share-records", {
      method: "POST",
    });
  });
});
