// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAJKgz1fONteZPPD5T9bcIVjw3-iBUZyro",
  authDomain: "gopandacars-7085f.firebaseapp.com",
  projectId: "gopandacars-7085f",
  storageBucket: "gopandacars-7085f.appspot.com",
  messagingSenderId: "486383420605",
  appId: "1:486383420605:web:3a8c5d7f8b5d5f5c1a2e3a"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// Admin emails
const ADMIN_EMAILS = [
  'ramakrishnasaighanta@gmail.com',
  'gopandaselfdrivecars@gmail.com'
];
