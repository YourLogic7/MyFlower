import React from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/react';
import App from './App.jsx';
import '../style.css';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const root = createRoot(document.getElementById('root'));

if (publishableKey) {
  root.render(
    <ClerkProvider publishableKey={publishableKey}>
      <App />
    </ClerkProvider>,
  );
} else {
  root.render(
    <main className="page-shell">
      <section className="game-shell setup-notice">
        <span className="eyebrow">KONFIGURASI DIPERLUKAN</span>
        <h1>Hubungkan akun kebunmu</h1>
        <p>Tambahkan <code>VITE_CLERK_PUBLISHABLE_KEY</code> di file <code>.env.local</code> untuk menjalankan aplikasi.</p>
      </section>
    </main>,
  );
}
