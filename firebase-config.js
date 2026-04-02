// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA8azNy6GEgD190y_fW91ahUbKa1w5veik",
  authDomain: "aawards.firebaseapp.com",
  databaseURL: "https://aawards-default-rtdb.firebaseio.com",
  projectId: "aawards",
  storageBucket: "aawards.firebasestorage.app",
  messagingSenderId: "839334918366",
  appId: "1:839334918366:web:454a259fa3e2665b46ea4f",
  measurementId: "G-NLLMB9THVX"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = typeof firebase.auth === 'function' ? firebase.auth() : null;
