# Veterinary clinic interface

PetCare reaches clinics only through the `ClinicGateway` interface in `apps/api/src/services/clinic-gateway.ts`. The rest of the API (`clinic.service.ts`) never knows which clinic system is behind it.

Risk R4 in the project plan covers the case where a real clinic interface is unavailable or undocumented: *implement a simulated service with the same contract so the feature can still be demonstrated and tested*. The `SimulatedClinicGateway` in the same file is that service.

## Contract

| Method | Purpose |
| --- | --- |
| `listClinics()` | Returns the clinics a pet can be linked to. |
| `getClinic(clinicId)` | Returns one clinic, or `null` when it does not exist. |
| `submitAppointment(clinicId, payload)` | Sends an appointment request. Returns an `externalReference`, a `status` (`PENDING`, `CONFIRMED`, or `DECLINED`), and a human-readable `message`. |
| `checkRequest(clinicId, externalReference, context, now?)` | Asks the clinic for the current status of an earlier request. PetCare calls it for requests that are still `PENDING`. |
| `receiveRecords(clinicId, payload)` | Delivers a pet's health records and returns a receipt (`receiptId`, `receivedCount`, `receivedAt`). |

## Simulated behaviour

* **Directory:** four fictional clinics, each with opening days and hours in the `America/Toronto` time zone.
* **Appointment requests:** a request for a time inside the clinic's opening hours is confirmed; a request outside them is declined with a message that includes the opening hours.
* **Staff review:** Riverside Veterinary Hospital answers `PENDING` first and confirms the request after 60 seconds (`REVIEW_DELAY_MS`), which lets the application exercise the asynchronous path.
* **Records:** every delivery is acknowledged with a receipt.
* Every simulated request reference starts with `SIM-` and every records receipt with `REC-`.

## Replacing the simulation

1. Write a class that implements `ClinicGateway` and calls the real clinic API (for example with `fetch`).
2. Export an instance of it as `clinicGateway` instead of `new SimulatedClinicGateway()`.
3. Keep `clinic.service.ts`, the routes, and the web pages unchanged. If the real system uses its own clinic identifiers, store them in `ClinicLink.clinicId`.

The unit tests in `apps/api/tests/rules.test.ts` describe the expected behaviour of any gateway implementation.
