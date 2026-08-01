import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyABJ4lwdI0_D-fpmg4xri-ed9iCuI5Xb4g",
  authDomain: "ailanux-center.firebaseapp.com",
  projectId: "ailanux-center",
  storageBucket: "ailanux-center.firebasestorage.app",
  messagingSenderId: "206558404080",
  appId: "1:206558404080:web:11eb8e8cb9eff41a9b1135",
};

const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

export const auth = getAuth(app);
export default app;