"use client";
import { useEffect, useState, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";


// ProfileSettings component for updating email/password
function ProfileSettings({ user }: { user: { email: string, id?: string } | null }) {
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEmail(user?.email ?? "");
  }, [user]);

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    let errorMsg = "";
    if (email !== user?.email) {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) errorMsg += error.message + " ";
    }
    if (password) {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) errorMsg += error.message + " ";
    }
    setSaving(false);
    setMsg(errorMsg ? errorMsg : "Profile updated!");
    if (!errorMsg && email !== user?.email) {
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  return (
    <form onSubmit={handleUpdate} style={{ marginTop: 12 }}>
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'block', marginBottom: 4 }}>Email:</label>
        <input
          ref={emailRef}
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #cbd5e1' }}
          required
        />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'block', marginBottom: 4 }}>New Password:</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #cbd5e1' }}
          placeholder="Leave blank to keep current"
        />
      </div>
      <button type="submit" disabled={saving} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, cursor: 'pointer' }}>
        {saving ? 'Saving...' : 'Update Profile'}
      </button>
      {msg && <div style={{ marginTop: 8, color: msg.includes('updated') ? '#16a34a' : '#dc2626' }}>{msg}</div>}
    </form>
  );
}


export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string, id?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<string | null>(null);
  const [template, setTemplate] = useState<{ subject: string; body: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<{ carts: number; recoveries: number; revenue: number } | null>(null);

  useEffect(() => {
    const getUserAndShopAndTemplate = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        // Edge case: session expired or direct access
        router.push("/auth");
        setLoading(false);
        return;
      }
      if (data.user.email_confirmed_at === null) {
        router.push("/unconfirmed");
        setLoading(false);
        return;
      }
      setUser({ email: data.user.email ?? "", id: data.user.id });
      // Fetch connected Shopify shop for this user
      const { data: shopData } = await supabase
        .from('shopify_shops')
        .select('shop_domain')
        .eq('user_id', data.user.id)
        .single();
      setShop(shopData?.shop_domain ?? null);
      // Fetch recovery template for this user
      const { data: templateData } = await supabase
        .from('recovery_templates')
        .select('subject, body')
        .eq('user_id', data.user.id)
        .single();
      setTemplate(templateData ?? null);
      // Fetch analytics for this shop
      if (shopData?.shop_domain) {
        const { count: carts } = await supabase
          .from('abandoned_checkouts')
          .select('*', { count: 'exact', head: true })
          .eq('shop_domain', shopData.shop_domain);
        // Placeholder: recoveries and revenue (to be implemented)
        setAnalytics({ carts: carts || 0, recoveries: 0, revenue: 0 });
      } else {
        setAnalytics(null);
      }
      setLoading(false);
    };
    getUserAndShopAndTemplate();
  }, [router]);

  const [logoutMsg, setLogoutMsg] = useState<string | null>(null);
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setLogoutMsg('Signed out successfully!');
      setTimeout(() => {
        setLogoutMsg(null);
        router.push("/auth");
      }, 1200);
    } catch (err) {
      setLogoutMsg('Error signing out. Please try again.');
    }
  };

  if (loading) return <div style={{ color: "#111", padding: 32 }}>Loading...</div>;
  if (logoutMsg) return <div style={{ color: logoutMsg.includes('success') ? '#16a34a' : '#dc2626', padding: 32 }}>{logoutMsg}</div>;

  // Onboarding checklist
  const checklist = [
    { label: "Connect your Shopify store", done: !!shop },
    { label: "Set up your recovery message", done: !!template },
    { label: "Start recovering lost sales!", done: !!shop && !!template }
  ];

  // Save recovery template
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !template) return;
    setSaving(true);
    setSaveMsg(null);
    const { error } = await supabase.from('recovery_templates').upsert({
      user_id: user.id,
      subject: template.subject,
      body: template.body
    });
    setSaving(false);
  setSaveMsg(error ? `Failed to save template: ${error.message}` : 'Template saved!');
  };

  return (
    <div style={{ maxWidth: 500, margin: "60px auto", padding: 32, background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px #0001", color: "#111" }}>
  <h2 style={{ fontSize: "1.5rem", marginBottom: 16 }}>Welcome{user?.email ? `, ${user.email}` : ''}!</h2>
      <div style={{ marginBottom: 16 }}>
        <strong>Email:</strong> {user?.email}
      </div>
      <div style={{ marginBottom: 20 }}>
        <strong>Onboarding Checklist:</strong>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          {checklist.map((item, i) => (
            <li key={i} style={{ color: item.done ? '#16a34a' : '#64748b', fontWeight: item.done ? 600 : 400, marginBottom: 4 }}>
              {item.done ? '✅' : '⬜'} {item.label}
            </li>
          ))}
        </ul>
        {!shop && (
          <button
            style={{ marginTop: 12, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}
            onClick={e => {
              e.preventDefault();
              const shop = prompt("Enter your Shopify store domain (e.g. mystore.myshopify.com):");
              if (shop) window.location.href = `/shopify?shop=${encodeURIComponent(shop)}`;
            }}
          >
            Connect your Shopify store
          </button>
        )}
      </div>
      {shop ? (
        <>
          <div style={{ marginBottom: 16, color: '#16a34a' }}>
            Connected shop: <strong>{shop}</strong>
          </div>
          {analytics && (
            <div style={{ marginBottom: 24, background: '#f1f5f9', borderRadius: 8, padding: 16 }}>
              <strong>Analytics</strong>
              <div style={{ marginTop: 8 }}>
                <div>Abandoned Carts: <strong>{analytics.carts}</strong></div>
                <div>Recoveries: <strong>{analytics.recoveries}</strong></div>
                <div>Revenue Recovered: <strong>${analytics.revenue.toFixed(2)}</strong></div>
              </div>
            </div>
          )}
        </>
      ) : (
        <a
          href="/shopify?shop="
          style={{
            display: "inline-block",
            marginBottom: 16,
            padding: "10px 20px",
            background: "#16a34a",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 600,
            textDecoration: "none"
          }}
          onClick={e => {
            e.preventDefault();
            const shop = prompt("Enter your Shopify store domain (e.g. mystore.myshopify.com):");
            if (shop) window.location.href = `/shopify?shop=${encodeURIComponent(shop)}`;
          }}
        >
          Connect your Shopify store
        </a>
      )}
      <div style={{ margin: '32px 0' }}>
        <strong>Customize Recovery Message:</strong>
        <form onSubmit={handleSaveTemplate} style={{ marginTop: 12 }}>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Subject:</label>
            <input
              type="text"
              value={template?.subject ?? ''}
              onChange={e => setTemplate(t => ({ subject: e.target.value, body: t?.body ?? "" }))}
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #cbd5e1' }}
              required
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Body:</label>
            <textarea
              value={template?.body ?? ''}
              onChange={e => setTemplate(t => ({ subject: t?.subject ?? "", body: e.target.value }))}
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #cbd5e1', minHeight: 80 }}
              required
            />
            <div style={{ fontSize: '0.95em', color: '#64748b', marginTop: 4 }}>
              Use <code>{'{{customer}}'}</code> for the customer name and <code>{'{{checkout_url}}'}</code> for the recovery link.
            </div>
          </div>
          <button type="submit" disabled={saving} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, cursor: 'pointer' }}>
            {saving ? 'Saving...' : 'Save Template'}
          </button>
          {saveMsg && <div style={{ marginTop: 8, color: saveMsg.includes('Failed') ? '#dc2626' : '#16a34a' }}>{saveMsg}</div>}
        </form>
      </div>

      {/* User Profile/Settings */}
      <div style={{ margin: '32px 0', background: '#f8fafc', borderRadius: 8, padding: 20 }}>
        <strong>Profile & Settings</strong>
        <ProfileSettings user={user} />
      </div>


      <button onClick={handleSignOut} style={{ padding: 10, background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
        Sign Out
      </button>
    </div>
  );
}
// ...existing code...
