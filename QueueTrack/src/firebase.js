import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDx2IY-qP0TrRMyKpDo_Hkm714Xhi7xGEE",
  authDomain: "queuetrack-36c42.firebaseapp.com",
  databaseURL: "https://queuetrack-36c42-default-rtdb.firebaseio.com",
  projectId: "queuetrack-36c42",
  storageBucket: "queuetrack-36c42.firebasestorage.app",
  messagingSenderId: "134903723433",
  appId: "1:134903723433:web:617f97d3db539b5c9e00b8",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
