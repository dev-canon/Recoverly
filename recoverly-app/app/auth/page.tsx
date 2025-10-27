"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";


export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(error.message);
        setIsError(true);
      } else {
        setMessage("Check your email to confirm your account.");
        setTimeout(() => {
          setIsSignUp(false);
          setMessage("");
        }, 2500);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
        setIsError(true);
      } else {
        setMessage("Signed in! Redirecting...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      }
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 400, margin: "60px auto", padding: 32, background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px #0001", color: "#111" }}>
      <h2 style={{ fontSize: "1.5rem", marginBottom: 16, color: "#111" }}>{isSignUp ? "Sign Up" : "Sign In"}</h2>
      <form onSubmit={handleAuth}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ width: "100%", padding: 12, marginBottom: 12, borderRadius: 6, border: "1px solid #cbd5e1", color: "#111", background: "#f8fafc" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ width: "100%", padding: 12, marginBottom: 12, borderRadius: 6, border: "1px solid #cbd5e1", color: "#111", background: "#f8fafc" }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", padding: 12, background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: "1rem", cursor: "pointer" }}
        >
          {loading ? (isSignUp ? "Signing up..." : "Signing in...") : (isSignUp ? "Sign Up" : "Sign In")}
        </button>
      </form>
      {message && (
        <div style={{ marginTop: 16, color: isError ? "#dc2626" : "#2563eb", fontWeight: isError ? 600 : 400 }}>
          {message}
        </div>
      )}
      <div style={{ marginTop: 24, fontSize: "0.98em", color: "#111" }}>
        {isSignUp ? "Already have an account?" : "Don't have an account?"}
        <button
          onClick={() => { setIsSignUp(!isSignUp); setMessage(""); setIsError(false); }}
          style={{ marginLeft: 8, color: "#2563eb", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
        >
          {isSignUp ? "Sign In" : "Sign Up"}
        </button>
      </div>
    </div>
  );
}
