/**
 * src/features/auth/AuthTestPage.jsx
 * Temporary dev-only page for testing all Supabase auth endpoints.
 * Tests both client-side (supabase-js SDK) and backend API (/auth/me).
 * Remove or gate behind an env flag once auth is production-ready.
 */
import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import axios from 'axios';

const API = 'http://localhost:8000';

const Field = ({ label, type = 'text', value, onChange, placeholder }) => (
  <div style={{ marginBottom: '12px' }}>
    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '10px 14px', background: 'rgba(15,23,42,0.6)',
        border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px',
        color: '#e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
      }}
    />
  </div>
);

const Chip = ({ color, children }) => {
  const colors = { green: '#10b981', red: '#f43f5e', blue: '#6366f1', amber: '#f59e0b' };
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: '999px',
      background: `${colors[color]}22`, color: colors[color],
      fontSize: '11px', fontWeight: '700', border: `1px solid ${colors[color]}44`
    }}>{children}</span>
  );
};

const Panel = ({ title, children, accentColor = '#6366f1' }) => (
  <div style={{
    background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(20px)',
    border: `1px solid ${accentColor}33`, borderRadius: '20px',
    padding: '24px', marginBottom: '16px',
  }}>
    <h3 style={{ margin: '0 0 18px 0', fontSize: '13px', fontWeight: '800', color: accentColor, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</h3>
    {children}
  </div>
);

const Btn = ({ onClick, disabled, loading, color = '#6366f1', children }) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    style={{
      width: '100%', padding: '11px', borderRadius: '10px', border: 'none',
      background: disabled || loading ? 'rgba(99,102,241,0.3)' : color,
      color: '#fff', fontWeight: '700', fontSize: '13px', cursor: disabled || loading ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s',
    }}
  >
    {loading ? '⏳ Working...' : children}
  </button>
);

const ResultBox = ({ result }) => {
  if (!result) return null;
  const isError = result.type === 'error';
  return (
    <div style={{
      marginTop: '12px', padding: '12px', borderRadius: '10px',
      background: isError ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)',
      border: `1px solid ${isError ? '#f43f5e44' : '#10b98144'}`,
      fontFamily: 'monospace', fontSize: '12px', color: isError ? '#f43f5e' : '#10b981',
      whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '180px', overflowY: 'auto',
    }}>
      {typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}
    </div>
  );
};

export default function AuthTestPage() {
  const { user, session, register, login, logout } = useAuth();

  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regResult, setRegResult] = useState(null);
  const [regLoading, setRegLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginResult, setLoginResult] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [meResult, setMeResult] = useState(null);
  const [meLoading, setMeLoading] = useState(false);

  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleRegister = async () => {
    setRegLoading(true); setRegResult(null);
    try {
      const data = await register(regEmail, regPass);
      setRegResult({ type: 'success', data: { user: data.user?.email, id: data.user?.id } });
    } catch (e) {
      setRegResult({ type: 'error', data: e.message });
    } finally { setRegLoading(false); }
  };

  const handleLogin = async () => {
    setLoginLoading(true); setLoginResult(null);
    try {
      const data = await login(loginEmail, loginPass);
      setLoginResult({ type: 'success', data: { user: data.user?.email, access_token: data.session?.access_token?.slice(0, 40) + '...' } });
    } catch (e) {
      setLoginResult({ type: 'error', data: e.message });
    } finally { setLoginLoading(false); }
  };

  const handleMe = async () => {
    setMeLoading(true); setMeResult(null);
    try {
      const token = session?.access_token;
      if (!token) throw new Error('No active session — login first');
      const res = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMeResult({ type: 'success', data: res.data });
    } catch (e) {
      setMeResult({ type: 'error', data: e.response?.data?.detail || e.message });
    } finally { setMeLoading(false); }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try { await logout(); } catch (e) { console.error(e); }
    finally { setLogoutLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0f1e',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '40px 16px', fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px', maxWidth: '560px' }}>
        <div style={{
          display: 'inline-block', padding: '4px 16px', borderRadius: '999px',
          background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)',
          fontSize: '11px', fontWeight: '700', color: '#818cf8', letterSpacing: '0.15em',
          textTransform: 'uppercase', marginBottom: '12px'
        }}>🔐 Auth Test Panel</div>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: '#f1f5f9' }}>
          Supabase Auth <span style={{ color: '#818cf8' }}>Testing</span>
        </h1>
        <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>
          Temporary panel — tests register, login, /auth/me, and logout endpoints
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: '560px' }}>

        {/* Session Status */}
        <Panel title="Session Status" accentColor="#10b981">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Current User</div>
              <div style={{ color: '#e2e8f0', fontWeight: '600', fontSize: '15px' }}>
                {user ? user.email : <span style={{ color: '#475569' }}>Not logged in</span>}
              </div>
              {user && <div style={{ color: '#475569', fontSize: '11px', marginTop: '2px' }}>{user.id}</div>}
            </div>
            {user ? <Chip color="green">Active Session</Chip> : <Chip color="red">No Session</Chip>}
          </div>
          {user && (
            <div style={{ marginTop: '16px' }}>
              <Btn onClick={handleLogout} loading={logoutLoading} color="#f43f5e">🚪 Logout</Btn>
            </div>
          )}
        </Panel>

        {/* Register */}
        <Panel title="Register" accentColor="#f59e0b">
          <Field label="Email" type="email" value={regEmail} onChange={setRegEmail} placeholder="new@user.com" />
          <Field label="Password" type="password" value={regPass} onChange={setRegPass} placeholder="Min 6 chars" />
          <Btn onClick={handleRegister} loading={regLoading} color="#d97706">✨ Register via Supabase SDK</Btn>
          <ResultBox result={regResult} />
        </Panel>

        {/* Login */}
        <Panel title="Login" accentColor="#6366f1">
          <Field label="Email" type="email" value={loginEmail} onChange={setLoginEmail} placeholder="user@email.com" />
          <Field label="Password" type="password" value={loginPass} onChange={setLoginPass} placeholder="Password" />
          <Btn onClick={handleLogin} loading={loginLoading}>🔑 Login via Supabase SDK</Btn>
          <ResultBox result={loginResult} />
        </Panel>

        {/* Backend /auth/me */}
        <Panel title="Backend — GET /auth/me" accentColor="#22d3ee">
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: 0, marginBottom: '14px' }}>
            Calls your FastAPI <code style={{ background: 'rgba(34,211,238,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#22d3ee' }}>/auth/me</code> endpoint with the current session token. Requires an active login.
          </p>
          <Btn onClick={handleMe} loading={meLoading} color="#0891b2">🛰 Test /auth/me (Backend)</Btn>
          <ResultBox result={meResult} />
        </Panel>

      </div>
    </div>
  );
}
