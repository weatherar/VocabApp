import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
	apiKey: "AIzaSyCYN4bcud2PfDy-ZMQRLAppfoiGowxb1po",
	authDomain: "englishapp-c8e22.firebaseapp.com",
	projectId: "englishapp-c8e22",
	storageBucket: "englishapp-c8e22.firebasestorage.app",
	messagingSenderId: "1009496283352",
	appId: "1:1009496283352:web:a17972c1af3e6c213d1fad",
	measurementId: "G-SD8YQJ7M2S",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
