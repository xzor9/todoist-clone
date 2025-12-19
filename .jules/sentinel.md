## 2025-12-17 - Error Boundary Information Disclosure
**Vulnerability:** The application was exposing full stack traces in the UI when an error occurred, even in production environments.
**Learning:** Developers often leave debug information in error boundaries for convenience, but this leaks internal path structures and dependency versions to potential attackers.
**Prevention:** Use `import.meta.env.DEV` (or equivalent environment checks) to conditionally render stack traces only in development environments, showing generic messages in production.

## 2025-12-17 - Insecure Task Ownership Transfer
**Vulnerability:** Firestore rules allowed `update` operations on tasks/projects solely based on ownership of the *existing* document. This meant a user could send an update changing the `userId` field to another user's ID, effectively transferring the task (and potentially spamming the other user) while losing access themselves.
**Learning:** Checking `isOwner(resource.data.userId)` is sufficient for read/delete, but for updates, you must also verify that critical fields like `userId` are not being modified to bypass future ownership checks or inject data into other users' scopes.
**Prevention:** Enforce immutability of the `userId` field in Firestore rules by adding `request.resource.data.userId == resource.data.userId` to update conditions.
