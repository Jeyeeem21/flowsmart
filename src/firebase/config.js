// src/firebase/config.js

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDf4_P0mvZ_ai3Ruf7AyPN9qrqwexJGkEk",
    authDomain: "flowsmart2x.firebaseapp.com",
    projectId: "flowsmart2x",
    storageBucket: "flowsmart2x.firebasestorage.app",
    messagingSenderId: "588707160909",
    appId: "1:588707160909:web:19c5adf94f6a78c5fb0d04"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db }; // ❗ No default export — use named import only