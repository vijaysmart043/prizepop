import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBZx4Z6RFa7b87X4bI39YFrsNpX2W1E2xQ",
  authDomain: "studio-172156836-6d1aa.firebaseapp.com",
  projectId: "studio-172156836-6d1aa",
  storageBucket: "studio-172156836-6d1aa.firebasestorage.app",
  messagingSenderId: "385810912741",
  appId: "1:385810912741:web:3131cea0693fb69a45cb0c"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);