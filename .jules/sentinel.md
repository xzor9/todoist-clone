## 2024-05-24 - Input Validation Gap in Firestore App
**Vulnerability:** Input validation for user generated content (Tasks, Projects) was missing on the client-side. While Firestore rules ensure ownership, they didn't enforce length limits, allowing potential DoS or UI breaking via massive strings.
**Learning:** Client-side validation is a crucial first line of defense ("Defense in Depth"), even if backend rules exist. It improves UX by preventing bad requests.
**Prevention:** Always implement length limits and type checking on the client side before sending data to Firebase.
