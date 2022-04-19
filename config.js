// Import the functions you need from the SDKs you need
//import { initializeApp } from "firebase/app";
import firebase from "firebase/compat/app"
import "firebase/compat/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBB6uA7j9csaBs2gZSzNOd3lrtY0yyUv9E",
  authDomain: "e-library-5618f.firebaseapp.com",
  projectId: "e-library-5618f",
  storageBucket: "e-library-5618f.appspot.com",
  messagingSenderId: "683403220139",
  appId: "1:683403220139:web:079fe72f059b83243d93ee"
};

// Initialize Firebase
 firebase.initializeApp(firebaseConfig);
 export default firebase.firestore()