import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyC7ebdSbGP1235AZ_yn6w6DJsr6-1SBUFg',
  authDomain: 'stock-recco-dashboard.firebaseapp.com',
  projectId: 'stock-recco-dashboard',
  storageBucket: 'stock-recco-dashboard.firebasestorage.app',
  messagingSenderId: '594892445150',
  appId: '1:594892445150:web:51646af970f7e059f6394f',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
