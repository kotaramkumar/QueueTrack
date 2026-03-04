import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBk40AJ8M1SRIukvN8JPW_G_YfhZXC8T0k",
  authDomain: "queuetrack-36c42-15050.firebaseapp.com",
  databaseURL: "https://queuetrack-36c42-15050-default-rtdb.firebaseio.com",
  projectId: "queuetrack-36c42-15050",
  storageBucket: "queuetrack-36c42-15050.firebasestorage.app",
  messagingSenderId: "712114617864",
  appId: "1:712114617864:web:48bc0396220f45bda09bbd",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
