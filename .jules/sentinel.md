## 2024-05-22 - Missing Service-Layer Input Validation
**Vulnerability:** Input validation was missing in the service layer (`src/services/todo.js`), relying solely on frontend constraints or assumed good behavior. This could allow malicious actors to store excessively large data (DoS) or invalid content.
**Learning:** Even with Firebase rules, application-level validation is crucial for data integrity and resource protection. "Defense in Depth" requires validation at the entry point of business logic, not just the UI.
**Prevention:** Always implement a dedicated validation utility (like `src/utils/validation.js`) and enforce it in all service methods before interacting with the database.
