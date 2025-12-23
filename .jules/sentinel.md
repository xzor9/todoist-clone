## 2025-12-17 - Error Boundary Information Disclosure
**Vulnerability:** The application was exposing full stack traces in the UI when an error occurred, even in production environments.
**Learning:** Developers often leave debug information in error boundaries for convenience, but this leaks internal path structures and dependency versions to potential attackers.
**Prevention:** Use `import.meta.env.DEV` (or equivalent environment checks) to conditionally render stack traces only in development environments, showing generic messages in production.

## 2025-01-20 - Firestore Document Ownership Integrity
**Vulnerability:** Firestore rules relied on `isOwner` checks for updates but failed to prevent the modification of the `userId` field itself. This allowed authenticated owners to effectively transfer ownership or orphan documents by changing the `userId` to another value.
**Learning:** Checking `isOwner(resource.data.userId)` on update only verifies the *requester* owns the *current* document. It does not validate the integrity of the *new* data.
**Prevention:** Explicitly enforce immutability of critical ownership fields using `request.resource.data.userId == resource.data.userId` in security rules.

## 2025-02-14 - Schema Validation in Firestore Rules
**Vulnerability:** The lack of schema validation in Firestore rules allowed authenticated users to inject arbitrary fields, use incorrect data types, or store excessively large strings, potentially leading to data corruption or denial of service.
**Learning:** relying solely on client-side validation is insufficient. Security rules must act as the final gatekeeper for data integrity.
**Prevention:** Implement `hasOnly()` checks in Firestore rules to strictly enforce allowlisted fields and validate data types and constraints (e.g., string length) for all write operations.
