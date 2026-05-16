import { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface UserProfile {
  email: string;
  isAdmin: boolean;
  createdAt: any;
}

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const docRef = doc(db, 'users', u.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // Create user profile
            const profileData = {
              email: u.email || '',
              isAdmin: u.email === 'pimo1999loko@gmail.com' || u.email === 'tangierdrive40@gmail.com',
              createdAt: serverTimestamp()
            };
            await setDoc(docRef, profileData);
            setProfile({ email: profileData.email, isAdmin: profileData.isAdmin, createdAt: new Date() });
          }
        } catch (err) {
          console.error("Error fetching user profile", err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        console.error(`This domain (${currentDomain}) is not authorized in your Firebase project (tng-drive).`);
        alert('خطأ: هذا النطاق غير مصرح به. يرجى إضافة النطاق الحالي إلى Authorized Domains في إعدادات Firebase.');
      } else if (err.code === 'auth/operation-not-allowed') {
        console.error("Google Sign-In is not enabled in Firebase Console.");
        alert('خطأ: تسجيل الدخول عبر جوجل غير مفعل. يرجى تفعيل "Google" من قائمة Sign-in method في Firebase Console.');
      }
      throw err;
    }
  };
  const logout = () => signOut(auth);

  return { user, profile, loading, login, logout };
}
