## 2025-12-17 - Error Boundary Information Disclosure
**Vulnerability:** The application was exposing full stack traces in the UI when an error occurred, even in production environments.
**Learning:** Developers often leave debug information in error boundaries for convenience, but this leaks internal path structures and dependency versions to potential attackers.
**Prevention:** Use `import.meta.env.DEV` (or equivalent environment checks) to conditionally render stack traces only in development environments, showing generic messages in production.

## 2025-01-20 - Firestore Document Ownership Integrity
**Vulnerability:** Firestore rules relied on `isOwner` checks for updates but failed to prevent the modification of the `userId` field itself. This allowed authenticated owners to effectively transfer ownership or orphan documents by changing the `userId` to another value.
**Learning:** Checking `isOwner(resource.data.userId)` on update only verifies the *requester* owns the *current* document. It does not validate the integrity of the *new* data.
**Prevention:** Explicitly enforce immutability of critical ownership fields using `request.resource.data.userId == resource.data.userId` in security rules.
