import { initializeApp } from 'firebase/app';
import { FieldValue } from 'firebase/firestore';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, FacebookAuthProvider } from "firebase/auth"; 

const firebaseConfig = {
  apiKey: "AIzaSyBXNKn7FuIPVS8BLv3w0MHXJ_gAQj_ovDs",
  authDomain: "abdu-instagram-a34b0.firebaseapp.com",
  projectId: "abdu-instagram-a34b0",
  storageBucket: "abdu-instagram-a34b0.appspot.com",
  messagingSenderId: "1010788337758",
  appId: "1:1010788337758:web:f78e0e3299f21967bb8ccf"
};

const firebaseApp = initializeApp(firebaseConfig);
const { value } = new FieldValue();
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
export const auth = getAuth(firebaseApp);
export const facebookProvider = new FacebookAuthProvider();

export { firebaseApp, value };
