// import { initializeApp } from "firebase/app";
// import { getAuth } from "firebase/auth";
// import { getStorage } from "firebase/storage";
// import { getFirestore } from "firebase/firestore";

// const firebaseConfig = {
//   apiKey: "AIzaSyAIHv06jUlv9ngx4iGN70WIDZ_yJ4vGdB4",
//   authDomain: "project01-cfdc9.firebaseapp.com",
//   projectId: "project01-cfdc9",
//   storageBucket: "project01-cfdc9.appspot.com",
//   messagingSenderId: "534970389297",
//   appId: "1:534970389297:web:9269613a760f5dc3751610",
//   measurementId: "G-HQY99BP8M6",
// };

// const app1 = initializeApp(firebaseConfig);
// export const storage = getStorage(app1);

// const firebaseConfig1 = {
//   apiKey: "AIzaSyDzGN0AkleFrD09DKReI2D1RSrkVKbVL-I",
//   authDomain: "birinji-3da17.firebaseapp.com",
//   projectId: "birinji-3da17",
//   storageBucket: "birinji-3da17.firebasestorage.app",
//   messagingSenderId: "791090032293",
//   appId: "1:791090032293:web:e54e5132c9f92d7b67274c",
//   measurementId: "G-V7PZT8EYP0"
// };

// export const app = initializeApp(firebaseConfig1);
// export const db = getFirestore(app);
// export const auth = getAuth(app);

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// First Firebase project (only for storage)
const firebaseConfig1 = {
  apiKey: "AIzaSyAIHv06jUlv9ngx4iGN70WIDZ_yJ4vGdB4",
  authDomain: "project01-cfdc9.firebaseapp.com",
  projectId: "project01-cfdc9",
  storageBucket: "project01-cfdc9.appspot.com",
  messagingSenderId: "534970389297",
  appId: "1:534970389297:web:9269613a760f5dc3751610",
  measurementId: "G-HQY99BP8M6",
};

// Second Firebase project (main)
const firebaseConfig2 = {
  apiKey: "AIzaSyDzGN0AkleFrD09DKReI2D1RSrkVKbVL-I",
  authDomain: "birinji-3da17.firebaseapp.com",
  projectId: "birinji-3da17",
  storageBucket: "birinji-3da17.firebasestorage.app",
  messagingSenderId: "791090032293",
  appId: "1:791090032293:web:e54e5132c9f92d7b67274c",
  measurementId: "G-V7PZT8EYP0"
};

// Ensure only one instance for storage
const storageApp = getApps().find(app => app.name === "storageApp") || initializeApp(firebaseConfig1, "storageApp");
export const storage = getStorage(storageApp);

// Initialize only the second project and export it
const app = getApps().find(app => app.name === "mainApp") || initializeApp(firebaseConfig2, "mainApp");
export const db = getFirestore(app);
export const auth = getAuth(app);

export { app };
