# Inertie

**Inertie** is a modern productivity application designed to help you maintain momentum. Built with React, Vite, and Firebase.

## Features
- **Capture**: Quick add for tasks to get ideas out of your head.
- **Organize**: Drag-and-drop tasks into custom projects.
- **Recurring Work**: Robust support for daily, weekly, and monthly storage.
- **Focus**: "Today" and "Upcoming" views to keep you on track.
- **Mobile Ready**: Responsive design ready for mobile packaging with Capacitor.

## Setup

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env.local` file with your Firebase configuration:
    ```
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```

## Build

To build for production:
```bash
npm run build
```


