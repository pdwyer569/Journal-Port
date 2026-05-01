# Pixel 10 Journal Architecture

## System Overview

Pixel 10 Journal is an offline-first Progressive Web Application (PWA) built for secure, private journaling. It leverages a modern frontend stack combined with Firebase backend services.

**Core Technologies:**
*   **React:** UI mapping and state management.
*   **TypeScript:** Static typing for domain logic and data structures.
*   **Vite:** Build tool and development server, chosen for its fast HMR and optimized production outputs.
*   **Tailwind CSS:** Utility-first CSS framework for styling components matching the dark aesthetic.
*   **Vite PWA Plugin:** Provides offline support via Service Workers and a Web App Manifest.
*   **Firebase / Firestore:** Provides an overarching NoSQL database solution.
*   **IndexedDB (via Firebase):** Implements local caching to allow read/write operations when offline, seamlessly syncing upon network restoration.
*   **Vitest & JSDOM:** Manages unit tests, asserting accurate logic around data parsing and API error handling.

## Component Hierarchy

The application follows a flat, tab-based routing hierarchy orchestrated entirely in the browser.

```text
App
 ├── Auth (Firebase Authentication wrapper)
 │
 ├── Navigation (Internal Tab Controller)
 │    ├── Timeline (Renders chronological entries with Markdown support)
 │    ├── MoodMap (Emotional insights dashboard)
 │    │    └── ActivityHeatmap (GitHub-style 52-week entry heatmap)
 │    └── MemoriesGallery (Media-centric grid of attachments)
 │
 └── NewEntryModal (Floating action button overlay for creating entries)
```

## Data Schema

The application uses Cloud Firestore to store user entries. Data is structured sequentially under a top-level `users` collection to guarantee row-level security.

**Path Structure:** `/users/{userId}/entries/{entryId}`

**Document Structure (`JournalEntry`):**
```typescript
interface JournalEntry {
  id: string;               // Unique document ID automatically assigned by Firestore
  userId: string;           // Relation to the owner, primarily used for security
  text: string;             // Raw Markdown string containing the journal content
  moodId: string;           // Derived sentiment enum: 'positive', 'negative', 'reflective', 'neutral'
  attachments: string[];    // Array of Firebase Storage standard HTTPS URLs
  tags: string[];           // Array of parsed hashtag strings (e.g. ['#planning', '#update'])
  createdAt: Timestamp;     // Server-bound creation timestamp
  updatedAt: Timestamp;     // Server-bound modification timestamp
}
```

## Storage Protocol

Rich media (images, voice notes) are saved outside of the Firestore document size constraints using Firebase Storage.

**Object Path:** `/users/{userId}/attachments/{timestamp}_{randomId}.{extension}`

*Upload Flow:*
1. The user selects media in the `NewEntryModal`.
2. A unique filename is generated client-side.
3. The binary blob is uploaded directly to Firebase Storage.
4. An HTTPS download URL is retrieved.
5. The URL is appended to the `attachments` array in the Firestore `JournalEntry` document payload.

## Deployment Vector

The application implements a full CI/CD pipeline via GitHub Actions.

*   **Trigger:** Pushes to the `main` branch.
*   **Build Step:** Runs `npm ci` followed by `npm run build` using Node.js 20.
*   **Asset Management:** Vite compiles and bundles the React output into the `/dist` directory. The Vite PWA plugin injects the service worker logic to cache static assets aggressively while keeping index/worker logic fresh.
*   **Delivery:** Deployment uses `FirebaseExtended/action-hosting-deploy`. The `/dist` output is pushed to Firebase Hosting servers, and routing falls back to `/index.html` to support the Single Page Application routing structure.
