/**
 * SiteLedgers — Firebase Initialization
 * Initializes Firebase once and exports the service instances.
 * Every other module imports from here — never initializes Firebase directly.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/11.7.1/firebase-storage.js';
import firebaseConfig from './firebase-config.js';

// Initialize Firebase app (runs once on import)
const app = initializeApp(firebaseConfig);

// Export service instances — used by auth.js, api.js, storage.js
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
