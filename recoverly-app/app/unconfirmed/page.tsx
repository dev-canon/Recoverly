"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Unconfirmed() {
  const router = useRouter();
  useEffect(() => {
    // Optionally, auto-refresh or provide a resend link
  }, []);
  return (
    <div style={{ maxWidth: 500, margin: "60px auto", padding: 32, background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px #0001", color: "#111" }}>
      <h2 style={{ color: '#dc2626' }}>Please Confirm Your Email</h2>
      <p>
        You must confirm your email address before accessing the dashboard.<br />
        Check your inbox for a confirmation link.
      </p>
      <button style={{ marginTop: 24, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontWeight: 600, cursor: 'pointer' }}
        onClick={() => router.push("/auth")}
      >Back to Login</button>
    </div>
  );
}
