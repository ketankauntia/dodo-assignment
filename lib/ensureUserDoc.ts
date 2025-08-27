"use client";

import { db } from "@/lib/firebase";
import { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

export async function ensureUserDoc(u: User) {
  const ref = doc(db, "users", u.uid);
  const snap = await getDoc(ref);

  const base = {
    uid: u.uid,
    email: u.email ?? null,
    displayName: u.displayName ?? null,
    photoURL: u.photoURL ?? null,
    stripeCustomerId: null as string | null,
    plan: "free" as const,
    plan_code: "FREE",
    plan_status: "active",
    plan_start_date: serverTimestamp(),
    plan_end_date: null as any,
    payment_channel: null as any,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };

  if (!snap.exists()) {
    await setDoc(ref, base);
  } else {
    await setDoc(ref, { updatedAt: serverTimestamp() }, { merge: true });
  }
}
