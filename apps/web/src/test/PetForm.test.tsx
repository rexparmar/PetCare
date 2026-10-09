import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PetForm } from "../components/pets/PetForm";

describe("PetForm", () => {
  it("shows client-side validation and does not submit invalid data", async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    render(<PetForm onSubmit={submit} />);

    await user.click(
      screen.getByRole("button", { name: /create pet profile/i }),
    );

    expect(
      await screen.findByText("Pet name is required."),
    ).toBeInTheDocument();
    expect(screen.getByText("Species is required.")).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });

  it("submits normalized valid form values", async () => {
    const user = userEvent.setup();
    const submit = vi.fn().mockResolvedValue(undefined);
    render(<PetForm onSubmit={submit} />);

    await user.type(screen.getByLabelText(/pet name/i), "Milo");
    await user.type(screen.getByLabelText(/species/i), "Dog");
    await user.type(screen.getByLabelText(/weight/i), "12.5");
    await user.click(
      screen.getByRole("button", { name: /create pet profile/i }),
    );

    expect(submit.mock.calls[0][0]).toEqual(
      expect.objectContaining({ name: "Milo", species: "Dog", weight: 12.5 }),
    );
  });
});
