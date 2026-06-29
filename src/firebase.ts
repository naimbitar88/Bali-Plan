import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'

/**
 * Firebase is optional. When the VITE_FIREBASE_* env vars are present the app runs in
 * live real-time mode (all three travellers share one plan). When they're absent the app
 * falls back to local-only mode so it still works for trying things out / screenshots.
 */
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseEnabled = Boolean(config.apiKey && config.projectId)

let app: FirebaseApp | undefined
let db: Firestore | undefined

if (firebaseEnabled) {
  app = initializeApp(config)
  db = getFirestore(app)
}

export { db }

/** Single shared trip the three of you collaborate on. */
export const TRIP_ID = 'bali-2026'
