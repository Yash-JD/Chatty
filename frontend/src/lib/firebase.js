import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
// Replace with your actual config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDkS15uPFVvjTak7eETbs7c_SWiDC1Vcjc",
  authDomain: "chatty-4c0b2.firebaseapp.com",
  projectId: "chatty-4c0b2",
  storageBucket: "chatty-4c0b2.firebasestorage.app",
  messagingSenderId: "945764351258",
  appId: "1:945764351258:web:4bd43fbc92b956ac7140a3",
  measurementId: "G-0L7DV7EYT9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
