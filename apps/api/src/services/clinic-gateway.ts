import { randomUUID } from "node:crypto";
import { localClock, localWeekday, timeToMinutes } from "../utils/time.js";

// The contract every clinic system must satisfy. PetCare only talks to
// clinics through this interface, so the simulated implementation below can be
// replaced by a real integration without changing the rest of the application.

export type ClinicSummary = {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  acceptsAfterReview: boolean;
};

export type ClinicRequestState = "PENDING" | "CONFIRMED" | "DECLINED";

export type ClinicRequestResult = {
  externalReference: string;
  status: ClinicRequestState;
  message: string;
};

export type AppointmentPayload = {
  petName: string;
  species: string;
  reason: string;
  scheduledAt: Date;
  ownerName: string;
};

export type RecordsPayload = {
  petName: string;
  species: string;
  breed: string | null;
  records: Array<{
    type: string;
    title: string;
    date: string;
    veterinarian: string | null;
    description: string | null;
  }>;
};

export type RecordsReceipt = {
  receiptId: string;
  receivedCount: number;
  receivedAt: Date;
};

export interface ClinicGateway {
  listClinics(): Promise<ClinicSummary[]>;
  getClinic(clinicId: string): Promise<ClinicSummary | null>;
  submitAppointment(
    clinicId: string,
    payload: AppointmentPayload,
  ): Promise<ClinicRequestResult>;
  checkRequest(
    clinicId: string,
    externalReference: string,
    context: { submittedAt: Date; scheduledAt: Date },
    now?: Date,
  ): Promise<ClinicRequestResult>;
  receiveRecords(
    clinicId: string,
    payload: RecordsPayload,
  ): Promise<RecordsReceipt>;
}

type SimulatedClinic = ClinicSummary & {
  timeZone: string;
  weekdays: number[];
  opens: string;
  closes: string;
};

const clinics: SimulatedClinic[] = [
  {
    id: "happypaws-downtown",
    name: "HappyPaws Downtown Clinic",
    address: "120 Bank Street, Ottawa, ON",
    phone: "(613) 555-0101",
    email: "downtown@happypaws.example",
    hours: "Mon-Fri 9:00 a.m. - 5:00 p.m.",
    acceptsAfterReview: false,
    timeZone: "America/Toronto",
    weekdays: [1, 2, 3, 4, 5],
    opens: "09:00",
    closes: "17:00",
  },
  {
    id: "happypaws-westend",
    name: "HappyPaws West End Clinic",
    address: "45 Richmond Road, Ottawa, ON",
    phone: "(613) 555-0102",
    email: "westend@happypaws.example",
    hours: "Mon-Sat 8:00 a.m. - 6:00 p.m.",
    acceptsAfterReview: false,
    timeZone: "America/Toronto",
    weekdays: [1, 2, 3, 4, 5, 6],
    opens: "08:00",
    closes: "18:00",
  },
  {
    id: "riverside-vet",
    name: "Riverside Veterinary Hospital",
    address: "900 Riverside Drive, Ottawa, ON",
    phone: "(613) 555-0103",
    email: "reception@riverside.example",
    hours: "Mon-Fri 8:00 a.m. - 8:00 p.m. (requests reviewed by staff)",
    acceptsAfterReview: true,
    timeZone: "America/Toronto",
    weekdays: [1, 2, 3, 4, 5],
    opens: "08:00",
    closes: "20:00",
  },
  {
    id: "greenbelt-animal-care",
    name: "Greenbelt Animal Care",
    address: "310 Woodroffe Avenue, Nepean, ON",
    phone: "(613) 555-0104",
    email: "hello@greenbelt.example",
    hours: "Tue-Sun 10:00 a.m. - 4:00 p.m.",
    acceptsAfterReview: false,
    timeZone: "America/Toronto",
    weekdays: [2, 3, 4, 5, 6, 7],
    opens: "10:00",
    closes: "16:00",
  },
];

// How long the simulated "staff review" takes before a request is answered.
export const REVIEW_DELAY_MS = 60_000;

export function isOpenAt(clinic: SimulatedClinic, instant: Date) {
  const clock = localClock(instant, clinic.timeZone);
  return (
    clinic.weekdays.includes(localWeekday(instant, clinic.timeZone)) &&
    clock.minutes >= timeToMinutes(clinic.opens) &&
    clock.minutes < timeToMinutes(clinic.closes)
  );
}

const publicClinic = ({
  id,
  name,
  address,
  phone,
  email,
  hours,
  acceptsAfterReview,
}: SimulatedClinic): ClinicSummary => ({
  id,
  name,
  address,
  phone,
  email,
  hours,
  acceptsAfterReview,
});

function answer(
  clinic: SimulatedClinic,
  scheduledAt: Date,
  waitedLongEnough: boolean,
): Pick<ClinicRequestResult, "status" | "message"> {
  if (!isOpenAt(clinic, scheduledAt))
    return {
      status: "DECLINED",
      message: `${clinic.name} is closed at that time (open ${clinic.hours}). Please pick another time.`,
    };
  if (clinic.acceptsAfterReview && !waitedLongEnough)
    return {
      status: "PENDING",
      message: "Waiting for clinic staff to review the request.",
    };
  return {
    status: "CONFIRMED",
    message: clinic.acceptsAfterReview
      ? "Confirmed after staff review."
      : `Confirmed by ${clinic.name}.`,
  };
}

export class SimulatedClinicGateway implements ClinicGateway {
  async listClinics() {
    return clinics.map(publicClinic);
  }

  async getClinic(clinicId: string) {
    const clinic = clinics.find((item) => item.id === clinicId);
    return clinic ? publicClinic(clinic) : null;
  }

  private find(clinicId: string) {
    const clinic = clinics.find((item) => item.id === clinicId);
    if (!clinic) throw new Error(`Unknown clinic: ${clinicId}`);
    return clinic;
  }

  async submitAppointment(clinicId: string, payload: AppointmentPayload) {
    const clinic = this.find(clinicId);
    return {
      externalReference: `SIM-${randomUUID().slice(0, 8).toUpperCase()}`,
      ...answer(clinic, payload.scheduledAt, false),
    };
  }

  async checkRequest(
    clinicId: string,
    externalReference: string,
    context: { submittedAt: Date; scheduledAt: Date },
    now = new Date(),
  ) {
    const clinic = this.find(clinicId);
    const waited =
      now.getTime() - context.submittedAt.getTime() >= REVIEW_DELAY_MS;
    return {
      externalReference,
      ...answer(clinic, context.scheduledAt, waited),
    };
  }

  async receiveRecords(clinicId: string, payload: RecordsPayload) {
    this.find(clinicId);
    return {
      receiptId: `REC-${randomUUID().slice(0, 8).toUpperCase()}`,
      receivedCount: payload.records.length,
      receivedAt: new Date(),
    };
  }
}

export const clinicGateway: ClinicGateway = new SimulatedClinicGateway();
