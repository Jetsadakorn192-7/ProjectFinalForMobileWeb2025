// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
//import { getFirestore, doc, setDoc ,getDoc ,getDocs} from "firebase/firestore";
import { ref } from "firebase/storage";

// แทนที่ค่าด้านล่างด้วย Firebase Config ของคุณ
const firebaseConfig = {
    apiKey: "AIzaSyC5-rP8Y58aNy42NWkaIguYqhcsRS6-Ies",
    authDomain: "projectfinalwebapplication2025.firebaseapp.com",
    projectId: "projectfinalwebapplication2025",
    storageBucket: "projectfinalwebapplication2025.firebasestorage.app",
    messagingSenderId: "208273531610",
    appId: "1:208273531610:web:9e63062d6509fb92da7be3",
    measurementId: "G-TPXDL65PBG"
};

// เริ่มต้น Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {
  firebaseConfig, // ส่งออก firebaseConfig เพื่อให้ส่งเป็น prop ให้ FirebaseRecaptchaVerifierModal ในคอมโพเนนต์ OTP ของคุณ
  auth,
  db,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs
};