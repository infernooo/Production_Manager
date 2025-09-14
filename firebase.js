import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyActYsnQktojYMDPVrqvE1NnEpdB9sliew",
  authDomain: "production-manager-47c05.firebaseapp.com",
  projectId: "production-manager-47c05",
  storageBucket: "production-manager-47c05.firebasestorage.app",
  messagingSenderId: "1008287831874",
  appId: "1:1008287831874:web:e30fb7fc9b178575019adb",
  measurementId: "G-WPS9JRF4BL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

// Initialize Analytics only if supported
let analytics = null;
isSupported().then(yes => {
  if (yes) {
    analytics = getAnalytics(app);
  }
}).catch(console.error);

export { analytics };
export default app;
