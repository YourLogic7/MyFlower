import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase.js';

const flowers = [
  { id: 'sunflower', name: 'Matahari', emoji: '🌻', petal: '#f5c64c', light: '#ffe78a', dark: '#bd7834', center: '#754b35' },
  { id: 'rose', name: 'Mawar', emoji: '🌹', petal: '#e96d79', light: '#ff9a9e', dark: '#b8455a', center: '#743c49' },
  { id: 'tulip', name: 'Tulip', emoji: '🌷', petal: '#f087a1', light: '#ffc0cb', dark: '#c65679', center: '#8b4857' },
  { id: 'daisy', name: 'Aster', emoji: '🌼', petal: '#fff3d4', light: '#fffaf0', dark: '#dcc98f', center: '#eab94c' },
  { id: 'hibiscus', name: 'Kembang sepatu', emoji: '🌺', petal: '#ef777f', light: '#ffa19b', dark: '#c34a62', center: '#f2c65a' },
  { id: 'cherry', name: 'Sakura', emoji: '🌸', petal: '#f4a8c2', light: '#ffd0dd', dark: '#d2769d', center: '#e9b64d' },
  { id: 'lavender', name: 'Lavender', emoji: '🪻', petal: '#a991d8', light: '#d1bbee', dark: '#7963aa', center: '#e4c881' },
  { id: 'lily', name: 'Bakung', emoji: '🤍', petal: '#fff8e9', light: '#ffffff', dark: '#e4d7b8', center: '#eab84d' },
  { id: 'chrysanthemum', name: 'Krisan', emoji: '🏵️', petal: '#edaa59', light: '#ffd27c', dark: '#c47745', center: '#935240' },
  { id: 'poppy', name: 'Poppy', emoji: '🌺', petal: '#ef695f', light: '#ff9a7a', dark: '#bd484c', center: '#443d38' },
];

const petalShapes = {
  sunflower: [[7, 2], [8, 2], [5, 3], [6, 3], [9, 3], [10, 3], [4, 4], [5, 4], [10, 4], [11, 4], [4, 5], [5, 5], [10, 5], [11, 5], [5, 6], [6, 6], [9, 6], [10, 6], [6, 7], [7, 7], [8, 7], [9, 7]],
  rose: [[7, 2], [8, 2], [6, 3], [7, 3], [8, 3], [9, 3], [5, 4], [6, 4], [9, 4], [10, 4], [5, 5], [6, 5], [9, 5], [10, 5], [6, 6], [7, 6], [8, 6], [9, 6], [6, 7], [7, 7], [8, 7], [9, 7]],
  tulip: [[7, 2], [8, 2], [6, 3], [7, 3], [8, 3], [9, 3], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [6, 5], [7, 5], [8, 5], [9, 5], [7, 6], [8, 6]],
  lavender: [[7, 2], [8, 2], [6, 3], [7, 3], [8, 3], [9, 3], [7, 4], [8, 4], [6, 5], [7, 5], [8, 5], [9, 5], [7, 6], [8, 6]],
  lily: [[7, 2], [8, 2], [6, 3], [9, 3], [5, 4], [6, 4], [9, 4], [10, 4], [4, 5], [5, 5], [10, 5], [11, 5], [5, 6], [6, 6], [9, 6], [10, 6], [6, 7], [7, 7], [8, 7], [9, 7]],
};

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dayNumber(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

function daysBetween(from, to = localDateKey()) {
  return Math.max(0, dayNumber(to) - dayNumber(from));
}

function loadLegacyGarden() {
  try {
    const saved = JSON.parse(localStorage.getItem('kebun-kecil-v1'));
    if (!saved || typeof saved !== 'object' || !flowers.some((flower) => flower.id === saved.flowerId)) return null;
    if (typeof saved.name !== 'string' || typeof saved.plantedAt !== 'string' || typeof saved.lastWatered !== 'string') return null;
    saved.waterDates = Array.isArray(saved.waterDates) ? saved.waterDates.filter((date) => typeof date === 'string') : [saved.lastWatered];
    return saved;
  } catch (error) {
    console.error('Progres kebun tidak dapat dibaca dari penyimpanan browser.', error);
    return null;
  }
}

async function requestProgress(method, token, body, signal) {
  const response = await fetch('/api/progress', {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `Permintaan gagal (${response.status}).`);
  return result;
}

function getCondition(garden, today) {
  const age = daysBetween(garden.plantedAt, today);
  const dryDays = daysBetween(garden.lastWatered, today);
  return {
    age,
    dryDays,
    dead: dryDays >= 4,
    wilted: dryDays >= 2 && dryDays < 4,
    grown: age >= 14,
  };
}

function calculateStreak(garden) {
  const dates = new Set(garden.waterDates);
  let cursor = garden.lastWatered;
  let streak = 0;
  while (dates.has(cursor)) {
    streak += 1;
    const [year, month, day] = cursor.split('-').map(Number);
    const previous = new Date(Date.UTC(year, month - 1, day - 1));
    cursor = `${previous.getUTCFullYear()}-${String(previous.getUTCMonth() + 1).padStart(2, '0')}-${String(previous.getUTCDate()).padStart(2, '0')}`;
  }
  return streak;
}

function getFlowerPixels(flower, stage, condition) {
  const pixels = [];
  const put = (x, y, color) => pixels.push([x, y, color]);
  const soil = condition.dead ? '#7c6757' : '#9a7656';
  const soilLight = condition.dead ? '#8a786a' : '#b28a61';

  [[5, 13], [6, 13], [7, 13], [8, 13], [9, 13], [10, 13],
    [4, 14], [5, 14], [6, 14], [7, 14], [8, 14], [9, 14], [10, 14], [11, 14],
    [5, 15], [6, 15], [7, 15], [8, 15], [9, 15], [10, 15]].forEach(([x, y]) => put(x, y, soil));
  [[5, 13], [6, 13], [9, 13], [10, 13], [5, 14], [10, 14]].forEach(([x, y]) => put(x, y, soilLight));

  if (stage === 'seed') {
    [[7, 12], [8, 12], [7, 11]].forEach(([x, y]) => put(x, y, '#a4763c'));
    put(7, 11, '#d6a757');
    return pixels;
  }

  const stemColor = condition.dead ? '#89745c' : '#56844d';
  const leafColor = condition.dead ? '#9a876e' : '#79a85f';
  const stemTop = stage === 'sprout' ? 8 : stage === 'bud' ? 5 : 4;
  for (let y = stemTop + 1; y <= 12; y += 1) put(7, y, stemColor);
  [[6, 10], [5, 9], [6, 9], [8, 11], [9, 10]].forEach(([x, y]) => put(x, y, leafColor));

  if (stage === 'sprout') {
    [[7, 8], [6, 7], [5, 7], [8, 7], [9, 7], [7, 6]].forEach(([x, y]) => put(x, y, leafColor));
    return pixels;
  }
  if (stage === 'bud') {
    [[7, 5], [8, 5], [6, 4], [7, 4], [8, 4], [9, 4], [7, 3], [8, 3]].forEach(([x, y]) => put(x, y, flower.light));
    [[6, 6], [9, 6]].forEach(([x, y]) => put(x, y, stemColor));
    return pixels;
  }

  const petals = petalShapes[flower.id] || [
    [7, 3], [8, 3], [6, 4], [7, 4], [8, 4], [9, 4],
    [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5],
    [5, 6], [6, 6], [9, 6], [10, 6],
    [6, 7], [7, 7], [8, 7], [9, 7],
  ];
  const expandedPetals = stage === 'bloom' && !['tulip', 'lavender'].includes(flower.id)
    ? petals.concat([[7, 1], [8, 1], [4, 4], [11, 4], [4, 5], [11, 5], [6, 8], [9, 8]])
    : petals;
  expandedPetals.forEach(([x, y], index) => put(x, y, index % 4 === 0 ? flower.light : flower.petal));
  [[7, 5], [8, 5], [7, 6], [8, 6]].forEach(([x, y]) => put(x, y, flower.center));
  [[7, 5], [8, 5]].forEach(([x, y]) => put(x, y, flower.dark));
  put(7, 6, flower.light);
  if (!condition.dead) {
    put(7, 5, '#fffdf0');
    put(8, 5, '#fffdf0');
    put(7, 6, '#624b3c');
    put(8, 6, '#624b3c');
  }
  return pixels;
}

function PixelFlower({ flower, stage, condition }) {
  return (
    <svg viewBox="0 0 128 128" role="img" aria-label={`${flower.name} pixel-art yang sedang tumbuh`}>
      {getFlowerPixels(flower, stage, condition).map(([x, y, color], index) => (
        <rect key={index} x={x * 8} y={y * 8} width="8" height="8" fill={color} />
      ))}
    </svg>
  );
}

function Topbar({ currentDate, greeting, onSignOut }) {
  return (
    <header className="topbar">
      <a className="brand" href="#" aria-label="Kebun Kecil, beranda">
        <span className="brand-mark" aria-hidden="true">✿</span>
        <span>kebun kecil<span className="brand-period">.</span></span>
      </a>
      <div className="top-note"><span className="online-dot" /> kebunmu, ruang kecil untuk tumbuh</div>
      <div className="topbar-right">
        {greeting && <span className="account-greeting">Hai, {greeting}</span>}
        {greeting && <button className="text-button" type="button" onClick={onSignOut}>Keluar</button>}
        <div className="day-chip" aria-live="polite">{currentDate}</div>
      </div>
    </header>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [garden, setGarden] = useState(null);
  const [selectedFlower, setSelectedFlower] = useState(null);
  const [flowerName, setFlowerName] = useState('Bubu');
  const [today, setToday] = useState(localDateKey);
  const [toast, setToast] = useState(null);
  const [celebrating, setCelebrating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retryLoad, setRetryLoad] = useState(0);
  const [loadedUserId, setLoadedUserId] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [saveVersion, setSaveVersion] = useState(0);
  const [deletingGarden, setDeletingGarden] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const toastTimer = useRef(null);
  const celebrateTimer = useRef(null);
  const savePromiseRef = useRef(null);
  const getTokenRef = useRef(null);
  const hydrated = useRef(false);
  const isSignedIn = Boolean(session);
  const user = session?.user;
  const userId = user?.id;

  const getAccessToken = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session?.access_token || null;
  }, []);
  getTokenRef.current = getAccessToken;

  const showToast = useCallback((message, error = false) => {
    setToast({ message, error });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setToday(localDateKey()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession);
        setIsLoaded(true);
      }
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        console.error('Sesi Supabase tidak dapat dimuat.', error);
        setAuthError('Sesi masuk tidak dapat diperiksa. Muat ulang halaman untuk mencoba lagi.');
      }
      setSession(data.session);
      setIsLoaded(true);
    }).catch((error) => {
      if (!active) return;
      console.error('Sesi Supabase tidak dapat dimuat.', error);
      setAuthError('Sesi masuk tidak dapat diperiksa. Muat ulang halaman untuk mencoba lagi.');
      setIsLoaded(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return undefined;
    if (!isSignedIn || !userId) {
      hydrated.current = false;
      setGarden(null);
      setLoadedUserId(null);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    hydrated.current = false;
    setLoading(true);
    setLoadError('');
    setGarden(null);
    setLoadedUserId(null);
    setSaveVersion(0);

    async function loadProgress() {
      try {
        const token = await getTokenRef.current();
        if (!token) throw new Error('Sesi masuk tidak tersedia. Coba masuk kembali.');
        const result = await requestProgress('GET', token);
        let savedGarden = result.garden;

        if (!savedGarden) {
          const legacyGarden = loadLegacyGarden();
          if (legacyGarden && window.confirm(`Impor progres lokal “${legacyGarden.name}” ke akun ini?`)) {
            await requestProgress('PUT', token, legacyGarden);
            savedGarden = legacyGarden;
            try {
              localStorage.removeItem('kebun-kecil-v1');
            } catch (error) {
              console.warn('Progres lokal lama tidak dapat dihapus.', error);
            }
          }
        }

        if (!cancelled) {
          setGarden(savedGarden);
          setLoadedUserId(userId);
          setSaveStatus('saved');
          hydrated.current = true;
          setLoading(false);
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Progres kebun tidak dapat dimuat dari akun.', error);
        setLoadError(error.message || 'Progres kebun gagal dimuat.');
        setLoadedUserId(userId);
        setLoading(false);
      }
    }

    loadProgress();
    return () => {
      cancelled = true;
      hydrated.current = false;
    };
  }, [isLoaded, isSignedIn, userId, retryLoad]);

  useEffect(() => {
    if (
      !hydrated.current || !isLoaded || !isSignedIn || !userId
      || loading || loadError || !garden || saveVersion === 0
    ) return undefined;

    const controller = new AbortController();
    setSaveStatus('saving');
    const savePromise = (async () => {
      try {
        const token = await getTokenRef.current();
        if (!token) throw new Error('Sesi masuk tidak tersedia. Coba masuk kembali.');
        await requestProgress('PUT', token, garden, controller.signal);
        if (!controller.signal.aborted) setSaveStatus('saved');
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Progres kebun tidak dapat disimpan ke akun.', error);
        setSaveStatus('error');
        showToast(error.message || 'Progres tidak dapat disimpan. Coba lagi.', true);
      }
    })();
    savePromiseRef.current = savePromise;
    savePromise.then(
      () => {
        if (savePromiseRef.current === savePromise) savePromiseRef.current = null;
      },
      () => {
        if (savePromiseRef.current === savePromise) savePromiseRef.current = null;
      },
    );

    return () => {
      controller.abort();
    };
  }, [garden, saveVersion, loading, loadError, isLoaded, isSignedIn, userId, showToast]);

  useEffect(() => () => {
    window.clearTimeout(toastTimer.current);
    window.clearTimeout(celebrateTimer.current);
  }, []);

  function markGardenChanged(nextGarden) {
    setGarden(nextGarden);
    setSaveVersion((version) => version + 1);
    setSaveStatus('saving');
  }

  async function submitAuth(event) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError('');
    setAuthMessage('');

    try {
      const result = authMode === 'signup'
        ? await supabase.auth.signUp({ email: authEmail.trim(), password: authPassword })
        : await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword });
      if (result.error) throw result.error;
      setAuthPassword('');
      if (authMode === 'signup' && !result.data.session) {
        setAuthMessage('Akun berhasil dibuat. Periksa email untuk mengonfirmasi pendaftaran.');
      }
    } catch (error) {
      console.error('Autentikasi Supabase gagal.', error);
      setAuthError(error.message || 'Autentikasi gagal. Coba lagi.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Tidak dapat keluar dari akun Supabase.', error);
      showToast(error.message || 'Tidak dapat keluar dari akun.', true);
    }
  }

  function plantFlower() {
    const name = flowerName.trim().slice(0, 18);
    if (!selectedFlower || !name) return;
    const date = localDateKey();
    markGardenChanged({
      flowerId: selectedFlower.id,
      name,
      plantedAt: date,
      lastWatered: date,
      waterDates: [date],
    });
    showToast(`${name} sudah ditanam dan mendapat siraman pertama! Yuk tumbuh bersama 🌱💧`);
  }

  function waterFlower() {
    if (!garden) return;
    const condition = getCondition(garden, today);
    if (condition.dead) return;
    if (garden.lastWatered === today) {
      showToast('Cukup satu kali sehari—bungamu sudah kenyang air! 💧');
      return;
    }

    markGardenChanged((current) => ({
      ...current,
      lastWatered: today,
      waterDates: current.waterDates.includes(today) ? current.waterDates : [...current.waterDates, today],
    }));
    setCelebrating(true);
    window.clearTimeout(celebrateTimer.current);
    celebrateTimer.current = window.setTimeout(() => setCelebrating(false), 800);
    showToast(`Yay! ${garden.name} jadi segar lagi berkat kamu 💧`);
  }

  async function resetGarden() {
    if (!garden || deletingGarden) return;
    const condition = getCondition(garden, today);
    const message = condition.dead
      ? `Tanam bunga baru di kebunmu? Progres ${garden.name} akan dihapus.`
      : `Mulai kebun baru? Perjalanan ${garden.name} akan dihapus.`;
    if (!window.confirm(message)) return;

    setDeletingGarden(true);
    try {
      if (savePromiseRef.current) await savePromiseRef.current;
      const token = await getTokenRef.current();
      if (!token) throw new Error('Sesi masuk tidak tersedia. Coba masuk kembali.');
      await requestProgress('DELETE', token);
      setGarden(null);
      setSelectedFlower(null);
      setFlowerName('Bubu');
      setSaveVersion(0);
      setSaveStatus('saved');
    } catch (error) {
      console.error('Progres kebun tidak dapat dihapus dari akun.', error);
      showToast(error.message || 'Progres tidak dapat dihapus. Coba lagi.', true);
    } finally {
      setDeletingGarden(false);
    }
  }

  function renameFlower() {
    if (!garden) return;
    const nextName = window.prompt('Mau beri nama apa untuk bungamu?', garden.name);
    if (nextName === null) return;
    const name = nextName.trim().slice(0, 18);
    if (!name) {
      showToast('Nama bunga tidak boleh kosong, ya.', true);
      return;
    }
    markGardenChanged((current) => ({ ...current, name }));
    showToast(`Halo lagi, ${name}! 🌼`);
  }

  const flower = garden ? flowers.find((item) => item.id === garden.flowerId) : null;
  const condition = garden ? getCondition(garden, today) : null;
  const stage = condition?.dead ? 'dead' : condition?.age >= 14 ? 'bloom' : condition?.age >= 5 ? 'bud' : condition?.age >= 2 ? 'sprout' : 'seed';
  const wateredToday = garden?.lastWatered === today;
  const currentDate = new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${today}T12:00:00`));
  const greeting = isSignedIn
    ? user?.user_metadata?.first_name
      || user?.user_metadata?.name
      || user?.email?.split('@')[0]
      || 'teman'
    : '';

  let mood = 'Segar dan bahagia';
  let sceneCaption = stage === 'seed' ? 'semua bunga berawal dari benih kecil' : 'pelan-pelan, kamu tumbuh dengan baik';
  if (condition?.dead) {
    mood = 'Perlu awal yang baru';
    sceneCaption = 'terima kasih sudah tumbuh bersama ♡';
  } else if (condition?.wilted) {
    mood = 'Agak haus dan layu';
    sceneCaption = 'sedikit air bisa membuatnya segar lagi';
  } else if (condition?.grown) {
    mood = 'Mekar sempurna!';
    sceneCaption = 'lihat, hasil perhatianmu mekar! ✦';
  }

  const growth = condition ? Math.min(condition.age + 1, 15) : 0;
  const dailyTip = condition?.dead
    ? 'Bunga baru berarti kesempatan baru. Yuk mulai lagi saat kamu siap.'
    : condition?.wilted
      ? 'Bungamu sudah menunggu air. Siram hari ini agar kembali segar.'
      : condition?.grown
        ? 'Kamu berhasil! Bunga mekar berkat perhatian kecilmu setiap hari.'
        : garden
          ? `Sedikit air dan perhatian darimu bikin ${garden.name} lebih cerah.`
          : '';

  if (!isLoaded) {
    return <main className="page-shell"><Topbar currentDate={currentDate} /><div className="auth-message">Menyiapkan kebunmu...</div></main>;
  }

  if (!isSignedIn) {
    return (
      <main className="page-shell">
        <Topbar currentDate={currentDate} />
        <section className="intro">
        <div className="eyebrow"><span aria-hidden="true">✦</span> TAMAN MINI PRIBADIMU</div>
        <h1>Hal kecil yang<br /><span>tumbuh besar.</span></h1>
        <p>Masuk agar progres bungamu tersimpan di akun dan bisa dibuka dari perangkat lain.</p>
        </section>
        <section className="game-shell auth-card">
        <span className="brand-mark" aria-hidden="true">✿</span>
        <h2>Siap merawat teman kecilmu?</h2>
        <p>{authMode === 'signup' ? 'Buat akun dengan email untuk mulai menanam dan menyimpan progres kebunmu.' : 'Masuk dengan akunmu untuk melanjutkan atau mulai menanam.'}</p>
        <form className="auth-form" onSubmit={submitAuth}>
          <label className="name-field">
            <span className="field-label">Email</span>
            <span className="input-wrap"><input type="email" autoComplete="email" required value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} /></span>
          </label>
          <label className="name-field">
            <span className="field-label">Kata sandi</span>
            <span className="input-wrap"><input type="password" autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} minLength={6} required value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} /></span>
          </label>
          {authError && <p className="auth-error" role="alert">{authError}</p>}
          {authMessage && <p className="auth-success" role="status">{authMessage}</p>}
          <button className="primary-button" type="submit" disabled={authBusy}>
            {authBusy ? 'Tunggu sebentar...' : authMode === 'signup' ? 'Daftar' : 'Masuk'}
          </button>
        </form>
        <button
          className="text-button auth-toggle"
          type="button"
          disabled={authBusy}
          onClick={() => {
            setAuthMode((mode) => mode === 'signin' ? 'signup' : 'signin');
            setAuthError('');
            setAuthMessage('');
          }}
        >
          {authMode === 'signup' ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
        </button>
        </section>
      </main>
    );
  }

  if (loading || loadedUserId !== userId) {
    return <main className="page-shell"><Topbar currentDate={currentDate} greeting={greeting} onSignOut={signOut} /><div className="auth-message">Memuat progres akunmu...</div></main>;
  }

  if (loadError) {
    return (
      <main className="page-shell">
        <Topbar currentDate={currentDate} greeting={greeting} onSignOut={signOut} />
        <section className="game-shell auth-message error-message">
        <h2>Progres belum bisa dimuat</h2>
        <p>{loadError}</p>
        <button className="primary-button" type="button" onClick={() => setRetryLoad((attempt) => attempt + 1)}>Coba lagi</button>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <Topbar currentDate={currentDate} greeting={greeting} onSignOut={signOut} />

      <section className="intro">
        <div className="eyebrow"><span aria-hidden="true">✦</span> TAMAN MINI PRIBADIMU</div>
        <h1>Hal kecil yang<br /><span>tumbuh besar.</span></h1>
        <p>Satu bunga, sedikit perhatian setiap hari. Yuk, mulai kebun kecilmu sendiri.</p>
      </section>

      <section className="game-shell" aria-label="Permainan merawat bunga">
        <div className="game-heading">
          <div>
            <span className="section-kicker">{garden ? condition.dead ? 'KEBUN BUTUH AWAL BARU' : 'LANGKAH 02 / RAWAT SETIAP HARI' : 'LANGKAH 01 / PILIH TEMAN'}</span>
            <h2>{garden ? condition.dead ? 'Terima kasih sudah merawatnya.' : 'Teman kecilmu sedang tumbuh.' : 'Siapa yang mau kamu rawat?'}</h2>
          </div>
          <span className="one-flower-note"><span aria-hidden="true">♡</span> satu bunga saja, ya</span>
        </div>

        {!garden ? (
          <div>
            <div className="flower-grid" aria-label="Pilihan bunga">
              {flowers.map((item) => (
                <button
                  className={`flower-choice${selectedFlower?.id === item.id ? ' selected' : ''}`}
                  key={item.id}
                  type="button"
                  aria-pressed={selectedFlower?.id === item.id}
                  onClick={() => setSelectedFlower(item)}
                >
                  <span className="flower-emoji" aria-hidden="true">{item.emoji}</span>
                  <span className="flower-choice-name">{item.name}</span>
                  {selectedFlower?.id === item.id && <span className="selected-check" aria-hidden="true">✓</span>}
                </button>
              ))}
            </div>
            <div className="setup-footer">
              <label className="name-field">
                <span className="field-label">Nama bungamu</span>
                <span className="input-wrap">
                  <span aria-hidden="true">✎</span>
                  <input
                    maxLength={18}
                    value={flowerName}
                    onChange={(event) => setFlowerName(event.target.value)}
                    aria-label="Nama bunga"
                    autoComplete="off"
                    placeholder="contoh: Bubu"
                  />
                </span>
              </label>
              <button className="primary-button" type="button" disabled={!selectedFlower || !flowerName.trim()} onClick={plantFlower}>
                Tanam benih <span aria-hidden="true">→</span>
              </button>
            </div>
            <p className="tiny-note"><span aria-hidden="true">☼</span> Bunga tumbuh sempurna dalam 15 hari. Jangan lupa menyiram, ya!</p>
          </div>
        ) : (
          <div className="garden-view">
            <div className="garden-main">
              <div className={`scene${celebrating ? ' celebrate' : ''}`}>
                <div className="scene-sun" aria-hidden="true" />
                <div className="scene-cloud cloud-one" aria-hidden="true" />
                <div className="scene-cloud cloud-two" aria-hidden="true" />
                <span className="scene-sparkle sparkle-one" aria-hidden="true">✦</span>
                <span className="scene-sparkle sparkle-two" aria-hidden="true">✧</span>
                <div className={`flower-art${condition.wilted ? ' is-wilted' : ''}${condition.dead ? ' is-dead' : ''}`}>
                  <PixelFlower flower={flower} stage={stage} condition={condition} />
                </div>
                <div className="ground" />
                <div className="scene-caption">{sceneCaption}</div>
              </div>
              <div className="flower-summary">
                <div>
                  <div className="mood-label">
                    <span className={`mood-dot${condition.dead ? ' dead' : condition.wilted ? ' wilted' : ''}`} />
                    <span>{mood}</span>
                  </div>
                  <h3>{garden.name}</h3>
                  <p>{flower.name} · hari ke-{condition.age + 1}</p>
                </div>
                <button className="text-button" type="button" aria-label="Ganti nama bunga" onClick={renameFlower}>✎ ganti nama</button>
              </div>
            </div>

            <aside className="care-panel">
              <div className="care-title">
                <span className="care-icon" aria-hidden="true">♧</span>
                <div><span className="section-kicker">PERAWATAN HARI INI</span><h3>Bagaimana kabarnya?</h3></div>
              </div>
              <div className="water-card">
                <div className="water-card-top">
                  <span className="water-drop" aria-hidden="true">💧</span>
                  <div><strong>Waktunya minum!</strong><span>{condition.dead ? 'Saatnya menanam bunga baru' : wateredToday ? 'Terima kasih sudah merawatnya ♡' : condition.wilted ? 'Dia sangat haus, siram sekarang!' : 'Siram agar tetap ceria'}</span></div>
                </div>
                <button className="water-button" type="button" disabled={wateredToday || condition.dead} onClick={waterFlower}>
                  <span aria-hidden="true">💧</span> <span>{condition.dead ? 'Bunganya sudah beristirahat' : wateredToday ? 'Sudah disiram hari ini!' : 'Siram bungaku'}</span>
                </button>
              </div>

              <div className="growth-block">
                <div className="growth-heading"><span>Perjalanan tumbuh</span><strong>{growth} / 15 hari</strong></div>
                <div className="progress-track" role="progressbar" aria-label="Perjalanan tumbuh" aria-valuemin={0} aria-valuemax={15} aria-valuenow={growth}><span style={{ width: `${(growth / 15) * 100}%` }} /></div>
                <div className="milestones"><span>🌱 Benih</span><span>🌼 Mekar</span></div>
              </div>

              <div className="care-stats">
                <div className="stat"><span className="stat-icon">☀</span><span><strong>{calculateStreak(garden)} hari</strong><small>rajin menyiram</small></span></div>
                <div className="stat"><span className="stat-icon">♡</span><span><strong>{condition.dryDays} hari</strong><small>tanpa air</small></span></div>
              </div>

              <div className="daily-tip"><span aria-hidden="true">✦</span><p>{dailyTip}</p></div>
              <div className={`save-status ${saveStatus}`} role="status" aria-live="polite">
                <span>{saveStatus === 'saving' ? 'Menyimpan ke akun...' : saveStatus === 'error' ? 'Progres belum tersimpan' : 'Tersimpan di akunmu'}</span>
                {saveStatus === 'error' && <button type="button" onClick={() => setSaveVersion((version) => version + 1)}>Coba lagi</button>}
              </div>
              <button className="reset-button" type="button" disabled={deletingGarden} onClick={resetGarden}>{deletingGarden ? 'Menghapus progres...' : 'Mulai kebun baru'}</button>
            </aside>
          </div>
        )}
        {toast && <div className={`toast visible${toast.error ? ' error' : ''}`} role="status" aria-live="polite">{toast.message}</div>}
      </section>

      <footer className="footer"><span>dibuat dengan <span className="heart">♥</span> dan sedikit sinar matahari</span><span>tak perlu buru-buru — semua tumbuh pada waktunya</span></footer>
    </main>
  );
}

export default App;
