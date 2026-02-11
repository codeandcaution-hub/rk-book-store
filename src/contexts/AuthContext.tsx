/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, db } from "@/integrations/firebase/config";
import { getDoc, doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  profile: { full_name: string; address_line1: string; city: string; state: string; pincode: string; phone: string } | null;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);

  const fetchUserRole = async (userId: string) => {
    try {
      const userRolesRef = collection(db, "user_roles");
      const q = query(userRolesRef, where("user_id", "==", userId));
      const querySnapshot = await getDocs(q);
      const isUserAdmin = !querySnapshot.empty && querySnapshot.docs.some((doc) => doc.data().role === "admin");
      setIsAdmin(isUserAdmin);
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const profileDoc = await getDoc(doc(db, "profiles", userId));
      if (profileDoc.exists()) {
        setProfile(profileDoc.data() as AuthContextType["profile"]);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserRole(currentUser.uid);
        await fetchProfile(currentUser.uid);
      } else {
        setIsAdmin(false);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignUp = async (email: string, password: string, fullName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Create profile document
      await setDoc(doc(db, "profiles", userCredential.user.uid), {
        full_name: fullName,
        address_line1: "",
        city: "",
        state: "",
        pincode: "",
        phone: "",
        email: email,
        created_at: new Date().toISOString(),
      });
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, profile, signUp: handleSignUp, signIn: handleSignIn, signOut: handleSignOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
