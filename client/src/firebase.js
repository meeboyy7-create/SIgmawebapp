import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBEchkbvf6sn_Q-Ak0OhIti3RIztanoPOs',
  authDomain: 'sigmav-a2958.firebaseapp.com',
  projectId: 'sigmav-a2958',
  storageBucket: 'sigmav-a2958.appspot.com',
  messagingSenderId: '191703709876',
  appId: '1:191703709876:web:569743bc4a50c7d2b77fe1',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
