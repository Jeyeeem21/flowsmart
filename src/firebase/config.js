// src/firebase/config.js

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBzLqYxnQmbuA2kF6jGseG6HDSA0reV3tM",
    authDomain: "fir-3x.firebaseapp.com",
    projectId: "fir-3x",
    storageBucket: "fir-3x.firebasestorage.app",
    messagingSenderId: "666603837344",
    appId: "1:666603837344:web:02274882dbcae3d14af6c5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db }; // ❗ No default export — use named import only