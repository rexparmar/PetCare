export type Gender = "MALE" | "FEMALE" | "UNKNOWN";
export type HealthRecordType =
  "VACCINATION" | "MEDICAL_CHECKUP" | "TREATMENT" | "SURGERY" | "OTHER";
export type AppointmentStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";
export type ActivityType =
  "WALK" | "PLAY" | "FEEDING" | "GROOMING" | "TRAINING" | "OTHER";
export type MedicationFrequency =
  "ONCE_DAILY" | "TWICE_DAILY" | "THREE_TIMES_DAILY" | "AS_NEEDED";

export interface User {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  dateOfBirth: string | null;
  gender: Gender;
  weight: number | null;
  medicalNotes: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { healthRecords: number; appointments: number };
}

export interface HealthRecord {
  id: string;
  petId: string;
  recordType: HealthRecordType;
  title: string;
  description: string | null;
  recordDate: string;
  veterinarianName: string | null;
  createdAt: string;
  updatedAt: string;
  pet?: Pick<Pet, "id" | "name" | "species">;
}

export interface Medication {
  id: string;
  petId: string;
  name: string;
  dosage: string;
  frequency: MedicationFrequency;
  timesOfDay: string[];
  startDate: string;
  endDate: string | null;
  instructions: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PetActivity {
  id: string;
  petId: string;
  activityType: ActivityType;
  activityDate: string;
  durationMinutes: number | null;
  distanceKm: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PetPhoto {
  id: string;
  petId: string;
  caption: string | null;
  width: number;
  height: number;
  sizeBytes: number;
  createdAt: string;
}

export type NotificationType = "MEDICATION" | "APPOINTMENT" | "CLINIC";

export interface NotificationItem {
  id: string;
  petId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  dueAt: string;
  readAt: string | null;
  createdAt: string;
  pet: { id: string; name: string } | null;
}

export interface NotificationList {
  items: NotificationItem[];
  unreadCount: number;
}

export interface NotificationPreferences {
  timeZone: string | null;
  medicationReminders: boolean;
  appointmentReminders: boolean;
  appointmentLeadHours: number;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  acceptsAfterReview: boolean;
}

export interface PetClinicLink {
  clinic: Clinic | null;
  linkedAt: string;
  lastSharedAt: string | null;
  lastSharedCount: number;
}

export type ClinicRequestStatus = "PENDING" | "CONFIRMED" | "DECLINED";

export interface ClinicRequest {
  id: string;
  appointmentId: string;
  clinicId: string;
  externalReference: string;
  status: ClinicRequestStatus;
  message: string | null;
  submittedAt: string;
  updatedAt: string;
}

export interface RecordsReceipt {
  receiptId: string;
  sharedCount: number;
  sharedAt: string;
}

export interface Appointment {
  id: string;
  petId: string;
  appointmentDate: string;
  providerName: string;
  reason: string;
  notes: string | null;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
  pet: Pick<Pet, "id" | "name" | "species">;
}

export interface DashboardData {
  petCount: number;
  pets: Pet[];
  upcomingAppointments: Appointment[];
  recentHealthRecords: HealthRecord[];
}

export interface ApiErrorShape {
  error: { code: string; message: string; details?: unknown };
}
