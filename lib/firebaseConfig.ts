import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCXkSK9gub8IjVjnnziW6DlSrTsQWMcp-0", // New API key
  authDomain: "fir-projecteyes.firebaseapp.com", // Updated domain based on projectId
  databaseURL:
    "https://fir-projecteyes-default-rtdb.asia-southeast1.firebasedatabase.app", // New DB URL
  projectId: "fir-projecteyes", // New Project ID
  storageBucket: "fir-projecteyes.firebasestorage.app", // New storage bucket
  messagingSenderId: "1013754864605", // From project_number or get your real sender ID
  appId: "1:1013754864605:android:your_app_id_here", // Update if you have new appId from Firebase Console
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const database = getDatabase(app);
const auth = getAuth(app);

export { app, database, auth };
