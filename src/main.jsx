import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { supabase } from './supabase.js';
import '../style.css';

const root = createRoot(document.getElementById('root'));

if (supabase) {
  root.render(<App />);
} else {
  root.render(
    <main className="page-shell">
      <section className="game-shell setup-notice">
        <span className="eyebrow">KONFIGURASI DIPERLUKAN</span>
        <h1>Hubungkan akun kebunmu</h1>
        <p>Tambahkan <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code> di file <code>.env.local</code> untuk menjalankan aplikasi.</p>
      </section>
    </main>,
  );
}
