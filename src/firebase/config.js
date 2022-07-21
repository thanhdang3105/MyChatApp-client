// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: 'AIzaSyB_iqpa9W7YvCNRMr1526SSHBgR7iwHIyY',
    authDomain: 'messenger-359a9.firebaseapp.com',
    projectId: 'messenger-359a9',
    storageBucket: 'messenger-359a9.appspot.com',
    messagingSenderId: '734254494044',
    appId: '1:734254494044:web:709cce883e06fc69905199',
    measurementId: 'G-KXLK2LGK51',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
getAnalytics(app);
const auth = getAuth(app);
const storage = getStorage(app);
const fireStore = getFirestore(app);

export { auth, storage, fireStore };
