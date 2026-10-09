# PetCare API Documentation

Base URL: `http://localhost:4000/api`

## Conventions

- Request and response media type: `application/json`
- Protected endpoints require the `petcare_session` cookie.
- `POST`, `PATCH`, and `DELETE` require a current `petcare_csrf` cookie and matching `X-CSRF-Token` header. Get one from `GET /auth/csrf` immediately before the mutation.
- Success: `{ "data": <resource> }`; HTTP 204 has no body.
- Error: `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": {} } }`
- UUID path parameters are validated. Owner IDs are never accepted from the client.

## Authentication

### `GET /auth/csrf`

Public. Sets the CSRF cookie and returns:

```json
{ "data": { "csrfToken": "random-hex-token" } }
```

### `POST /auth/register`

Public, CSRF-protected, rate-limited. Returns HTTP 201 and starts a session.

```json
{
  "fullName": "Alex Morgan",
  "email": "alex@example.com",
  "password": "StrongPass123",
  "confirmPassword": "StrongPass123"
}
```

Response data contains `id`, `fullName`, `email`, `createdAt`, and `updatedAt`. It never contains a password hash. Errors include 400 validation, 403 CSRF, 409 `EMAIL_IN_USE`, and 429 rate limit.

### `POST /auth/login`

Public, CSRF-protected, rate-limited. Body: `{ "email": "...", "password": "..." }`. Returns the public user and starts a session. Invalid credentials return 401 `INVALID_CREDENTIALS` without identifying which field was wrong.

### `POST /auth/logout`

Authentication and CSRF required. Deletes the active session and returns HTTP 204.

### `GET /auth/me`

Authentication required. Returns the public current user. Missing or expired sessions return 401 `UNAUTHENTICATED`.

## Pets

Pet data fields are `id`, `name`, `species`, `breed`, `dateOfBirth`, `gender`, `weight`, `medicalNotes`, `ownerId`, `createdAt`, and `updatedAt`. Gender is `MALE`, `FEMALE`, or `UNKNOWN`.

### `GET /pets`

Authentication required. Returns the current user's pets alphabetically, including `_count.healthRecords` and `_count.appointments`.

### `GET /pets/:id`

Authentication required. Returns an owned pet. Missing or non-owned IDs both return 404 `PET_NOT_FOUND`, preventing resource enumeration.

### `POST /pets`

Authentication and CSRF required. Returns HTTP 201.

```json
{
  "name": "Milo",
  "species": "Dog",
  "breed": "Beagle",
  "dateOfBirth": "2021-04-12",
  "gender": "MALE",
  "weight": 14.5,
  "medicalNotes": "Sensitive stomach"
}
```

`breed`, `dateOfBirth`, `weight`, and `medicalNotes` may be null. Weight must be positive and at most 500 kg.

### `PATCH /pets/:id`

Authentication, ownership, and CSRF required. Accepts one or more pet fields and returns the updated pet.

### `DELETE /pets/:id`

Authentication, ownership, and CSRF required. Permanently removes the pet and dependent records. Returns HTTP 204.

## Health records

Record types: `VACCINATION`, `MEDICAL_CHECKUP`, `TREATMENT`, `SURGERY`, `OTHER`.

### `GET /pets/:petId/health-records`

Authentication and pet ownership required. Returns the pet's records in descending `recordDate` order.

### `POST /pets/:petId/health-records`

Authentication, ownership, and CSRF required. Returns HTTP 201.

```json
{
  "recordType": "VACCINATION",
  "title": "Rabies booster",
  "description": "Three-year booster",
  "recordDate": "2026-09-15",
  "veterinarianName": "Dr. Rivera"
}
```

### `PATCH /pets/:petId/health-records/:recordId`

Authentication, ownership, and CSRF required. Accepts one or more record fields. The record must belong to the pet in the path.

### `DELETE /pets/:petId/health-records/:recordId`

Authentication, ownership, and CSRF required. Deletes the record and returns HTTP 204.

## Appointments

Statuses: `SCHEDULED`, `COMPLETED`, `CANCELLED`.

### `GET /appointments`

Authentication required. Returns all appointments belonging to the user's pets, ascending by appointment time. Each includes a public pet summary.

### `GET /appointments/:id`

Authentication and ownership required. Returns the appointment or 404 `APPOINTMENT_NOT_FOUND`.

### `POST /appointments`

Authentication, pet ownership, and CSRF required. New appointments must be in the future and are always created as `SCHEDULED`. Returns HTTP 201.

```json
{
  "petId": "7e38e342-174b-4e31-a3aa-28b76778e080",
  "appointmentDate": "2026-11-02T15:30:00-05:00",
  "providerName": "HappyPaws Clinic",
  "reason": "Annual wellness exam",
  "notes": "Bring vaccination records"
}
```

### `PATCH /appointments/:id`

Authentication, ownership, and CSRF required. Accepts one or more appointment fields, including status. If `petId` changes, the replacement pet must also be owned by the current user.

### `DELETE /appointments/:id`

Authentication, ownership, and CSRF required. Performs history-preserving cancellation by setting status to `CANCELLED`; returns the updated appointment with HTTP 200.

## Dashboard and service status

### `GET /dashboard`

Authentication required. Returns:

```json
{
  "data": {
    "petCount": 1,
    "pets": [],
    "upcomingAppointments": [],
    "recentHealthRecords": []
  }
}
```

Pets are limited to the six most recently created profiles; upcoming scheduled appointments and recent health records are limited to five each. Every query is owner-scoped.

### `GET /health`

Public service liveness endpoint. Returns `{ "data": { "status": "ok" } }`.

## Common error status codes

| Status | Meaning                                                                  |
| ------ | ------------------------------------------------------------------------ |
| 400    | Invalid body/path data                                                   |
| 401    | Missing, expired, or invalid session; or invalid login credentials       |
| 403    | Missing/mismatched CSRF token                                            |
| 404    | Route or owner-scoped resource not found                                 |
| 409    | Duplicate email or another uniqueness conflict                           |
| 429    | Authentication rate limit exceeded                                       |
| 500    | Unexpected server error; internal details are hidden outside development |
