"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { ensureUserDoc } from "@/lib/ensureUserDoc";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [user, setUser] = useState<any>(null);

  // Track auth state
  useState(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  });

  async function signup() {
    setMsg("");
    const cred = await createUserWithEmailAndPassword(auth, email, pw);
    await ensureUserDoc(cred.user); // <-- writes plan: "free"
    setMsg("Signed up + user doc ensured.");
  }

  async function login() {
    setMsg("");
    const cred = await signInWithEmailAndPassword(auth, email, pw);
    await ensureUserDoc(cred.user); // in case the doc didn't exist yet
    setMsg("Logged in + user doc ensured.");
  }

  async function logout() {
    await signOut(auth);
    setMsg("Signed out.");
  }

  return (
    <main style={{ maxWidth: 360, margin: "40px auto", padding: 16 }}>
      <h1>Email Login (Firebase)</h1>

      <label>Email</label>
      <input
        value={email}
        onChange={e => setEmail(e.target.value)}
        type="email"
        placeholder="you@example.com"
        style={{ width: "100%", marginBottom: 8 }}
      />

      <label>Password</label>
      <input
        value={pw}
        onChange={e => setPw(e.target.value)}
        type="password"
        placeholder="at least 6 chars"
        style={{ width: "100%", marginBottom: 12 }}
      />

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={signup}>Sign up</button>
        <button onClick={login}>Log in</button>
        <button onClick={logout} disabled={!user}>Log out</button>
      </div>

      <p style={{ marginTop: 12, fontSize: 12, opacity: 0.8 }}>
        {user ? `Signed in as ${user.email}` : "Not signed in"}
      </p>
      <p style={{ color: "limegreen" }}>{msg}</p>
    </main>
  );
}
