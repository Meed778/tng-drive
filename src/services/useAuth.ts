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
      if (err.code === 'auth/unauthorized-domain') {
        alert('خطأ: هذا النطاق (Domain) غير مصرح به في Firebase. يرجى إضافة meed778.github.io إلى قائمة Authorized Domains في إعدادات Firebase Authentication.');
      } else {
        console.error("Login error:", err);
      }
      throw err;
    }
  };
  const logout = () => signOut(auth);

  return { user, profile, loading, login, logout };
}
