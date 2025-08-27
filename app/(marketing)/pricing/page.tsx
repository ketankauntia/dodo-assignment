"use client";

import { auth, db } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  const u = cred.user;

  const ref = doc(db, "users", u.uid);
  const snap = await getDoc(ref);

  const base = {
    uid: u.uid,
    email: u.email ?? null,
    displayName: u.displayName ?? null,
    photoURL: u.photoURL ?? null,
    stripeCustomerId: null as string | null, // we’ll fill later on checkout/session
    plan: "free" as "free" | "pro",
    plan_code: "FREE",
    plan_status: "active",
    plan_start_date: serverTimestamp(),
    plan_end_date: null as any,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };

  if (!snap.exists()) {
    await setDoc(ref, base);
  } else {
    await setDoc(ref, { updatedAt: serverTimestamp() }, { merge: true });
  }

  return u;
}
