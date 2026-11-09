import React, { useCallback, useEffect, useRef, useState } from 'react';

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

const potTypes = [
  { id: 'classic', name: 'Klasik' },
  { id: 'round', name: 'Bulat' },
  { id: 'square', name: 'Kotak' },
];

const potColors = [
  { id: 'terracotta', name: 'Terakota', main: '#c97851', light: '#e69b70', shadow: '#96533e' },
  { id: 'mint', name: 'Mint', main: '#72a77b', light: '#a5ce9e', shadow: '#4f7d5b' },
  { id: 'lavender', name: 'Lavender', main: '#9a82be', light: '#c1ace0', shadow: '#705c94' },
  { id: 'sky', name: 'Biru langit', main: '#69a8be', light: '#a4d5e0', shadow: '#457487' },
  { id: 'butter', name: 'Kuning lembut', main: '#d8b456', light: '#f0d47a', shadow: '#a58036' },
  { id: 'rose', name: 'Merah muda', main: '#d88796', light: '#f2b1ba', shadow: '#a85f70' },
];

const accessories = [
  { id: 'none', name: 'Tanpa aksesori', emoji: '—' },
  { id: 'bow', name: 'Pita', emoji: '🎀' },
  { id: 'crown', name: 'Mahkota', emoji: '👑' },
  { id: 'flower-clip', name: 'Jepit bunga', emoji: '🌼' },
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
    saved.potType = potTypes.some((pot) => pot.id === saved.potType) ? saved.potType : 'classic';
    saved.potColor = potColors.some((color) => color.id === saved.potColor) ? saved.potColor : 'terracotta';
    saved.accessory = accessories.some((item) => item.id === saved.accessory) ? saved.accessory : 'none';
    saved.faceEnabled = typeof saved.faceEnabled === 'boolean' ? saved.faceEnabled : true;
    return saved;
  } catch (error) {
    console.error('Progres kebun tidak dapat dibaca dari penyimpanan browser.', error);
    return null;
  }
}

async function readJsonResponse(response) {
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error || `Permintaan gagal (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return result;
}

async function requestProgress(method, body, signal) {
  const response = await fetch('/api/progress', {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal,
  });
  return readJsonResponse(response);
}

async function requestAuth(action, body) {
  const response = await fetch(`/api/auth/${action}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
  });
  return readJsonResponse(response);
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

function getFlowerPixels(flower, stage, condition, garden) {
  const pixels = [];
  const put = (x, y, color) => pixels.push([x, y, color]);
  const potColor = potColors.find((item) => item.id === garden.potColor) || potColors[0];
  const potRows = garden.potType === 'round'
    ? [[5, 10], [4, 11], [5, 10]]
    : garden.potType === 'square'
      ? [[4, 11], [4, 11], [4, 11]]
      : [[4, 11], [5, 10], [6, 9]];

  potRows.forEach(([start, end], row) => {
    for (let x = start; x <= end; x += 1) {
      const edge = x === start || x === end;
      const color = row === 0 ? potColor.light : edge || row === 2 ? potColor.shadow : potColor.main;
      put(x, 13 + row, color);
    }
  });

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
  return pixels;
}

function PixelFlower({ flower, stage, condition, garden, petting }) {
  const showFace = !condition.dead && stage === 'bloom' && (garden.faceEnabled !== false || petting);
  return (
    <svg viewBox="0 0 128 128" role="img" aria-label={`${flower.name} pixel-art yang sedang tumbuh`}>
      {getFlowerPixels(flower, stage, condition, garden).map(([x, y, color], index) => (
        <rect key={index} x={x * 8} y={y * 8} width="8" height="8" fill={color} />
      ))}
      {showFace && (
        <g className={`flower-face${petting ? ' laughing' : ''}`} aria-hidden="true">
          {petting ? (
            <>
              <path d="M55 44 Q59 40 63 44 M65 44 Q69 40 73 44" fill="none" stroke="#49352d" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M59 51 Q64 60 69 51 Q64 54 59 51Z" fill="#8f3f53" stroke="#49352d" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M62 55 Q64 57 66 55" fill="none" stroke="#f4a1a0" strokeWidth="1.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="59" cy="44" rx="3.3" ry="4.3" fill="#fffdf0" />
              <ellipse cx="69" cy="44" rx="3.3" ry="4.3" fill="#fffdf0" />
              <circle className="eye-pupil" cx="60" cy="45" r="1.7" fill="#49352d" />
              <circle className="eye-pupil" cx="70" cy="45" r="1.7" fill="#49352d" />
              <path d="M60 52 Q64 56 68 52 Q64 54 60 52Z" fill="#c65b66" stroke="#49352d" strokeWidth="1" strokeLinejoin="round" />
            </>
          )}
        </g>
      )}
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
  const [user, setUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [garden, setGarden] = useState(null);
  const [selectedFlower, setSelectedFlower] = useState(null);
  const [flowerName, setFlowerName] = useState('Bubu');
  const [wateringMode, setWateringMode] = useState(false);
  const [pettingMode, setPettingMode] = useState(false);
  const [petting, setPetting] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [today, setToday] = useState(() => localDateKey());
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
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const toastTimer = useRef(null);
  const celebrateTimer = useRef(null);
  const petTimer = useRef(null);
  const flowerArtRef = useRef(null);
  const savePromiseRef = useRef(null);
  const hydrated = useRef(false);
  const isSignedIn = Boolean(user);
  const userId = user?.id;

  const showToast = useCallback((message, error = false) => {
    setToast({ message, error });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now);
      setToday(localDateKey(now));
    };
    const interval = window.setInterval(updateTime, 60000);
    window.addEventListener('focus', updateTime);
    document.addEventListener('visibilitychange', updateTime);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', updateTime);
      document.removeEventListener('visibilitychange', updateTime);
    };
  }, []);

  useEffect(() => {
    let active = true;
    requestAuth('me').then((result) => {
      if (!active) return;
      setUser(result.user);
      setIsLoaded(true);
    }).catch((error) => {
      if (!active) return;
      if (error.status !== 401) {
        console.error('Sesi akun tidak dapat dimuat.', error);
        setAuthError(error.message || 'Sesi masuk tidak dapat diperiksa. Muat ulang halaman untuk mencoba lagi.');
      }
      setIsLoaded(true);
    });

    return () => {
      active = false;
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
        const result = await requestProgress('GET');
        let savedGarden = result.garden;

        if (!savedGarden) {
          const legacyGarden = loadLegacyGarden();
          if (legacyGarden && window.confirm(`Impor progres lokal “${legacyGarden.name}” ke akun ini?`)) {
            await requestProgress('PUT', legacyGarden);
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
        await requestProgress('PUT', garden, controller.signal);
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
    window.clearTimeout(petTimer.current);
  }, []);

  function markGardenChanged(nextGarden) {
    setGarden(nextGarden);
    setSaveVersion((version) => version + 1);
    setSaveStatus('saving');
  }

  function updateCustomization(key, value) {
    markGardenChanged((current) => ({ ...current, [key]: value }));
  }

  function trackFlowerPointer(event) {
    const flowerArt = flowerArtRef.current;
    if (!flowerArt) return;
    const bounds = flowerArt.getBoundingClientRect();
    const horizontal = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const vertical = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    flowerArt.style.setProperty('--look-x', `${Math.max(-2.2, Math.min(2.2, horizontal * 2.5))}px`);
    flowerArt.style.setProperty('--look-y', `${Math.max(-2, Math.min(2, vertical * 2))}px`);
  }

  function resetFlowerGaze() {
    flowerArtRef.current?.style.setProperty('--look-x', '0px');
    flowerArtRef.current?.style.setProperty('--look-y', '0px');
  }

  function interactWithFlower() {
    if (wateringMode) {
      waterFlower();
      return;
    }
    if (!pettingMode) return;
    setPetting(true);
    window.clearTimeout(petTimer.current);
    petTimer.current = window.setTimeout(() => setPetting(false), 850);
  }

  async function submitAuth(event) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError('');

    try {
      const result = await requestAuth(authMode === 'signup' ? 'register' : 'login', {
        username: authUsername.trim(),
        password: authPassword,
      });
      setUser(result.user);
      setAuthPassword('');
      setAuthError('');
    } catch (error) {
      setAuthError(error.message || 'Autentikasi gagal. Coba lagi.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function signOut() {
    try {
      await requestAuth('logout', {});
      setUser(null);
      setWateringMode(false);
      setPettingMode(false);
    } catch (error) {
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
      potType: 'classic',
      potColor: 'terracotta',
      accessory: 'none',
      faceEnabled: true,
    });
    setWateringMode(false);
    setPettingMode(false);
    showToast(`${name} sudah ditanam dan mendapat siraman pertama! Yuk tumbuh bersama 🌱💧`);
  }

  function waterFlower() {
    if (!garden) return;
    const condition = getCondition(garden, today);
    if (condition.dead) return;
    if (garden.lastWatered === today) {
      showToast('Cukup satu kali sehari—bungamu sudah kenyang air! 💧');
      setWateringMode(false);
      return;
    }

    markGardenChanged((current) => ({
      ...current,
      lastWatered: today,
      waterDates: current.waterDates.includes(today) ? current.waterDates : [...current.waterDates, today],
    }));
    setCelebrating(true);
    setWateringMode(false);
    setPettingMode(false);
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
      await requestProgress('DELETE');
      setGarden(null);
      setWateringMode(false);
      setPettingMode(false);
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
  const isNight = currentTime.getHours() < 6 || currentTime.getHours() >= 18;
  const currentDate = new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${today}T12:00:00`));
  const greeting = isSignedIn
    ? user?.username || 'teman'
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
        <p>{authMode === 'signup' ? 'Buat nama pengguna dan kata sandi untuk mulai menanam.' : 'Masuk dengan nama pengguna dan kata sandi untuk melanjutkan.'}</p>
        <form className="auth-form" onSubmit={submitAuth}>
          <label className="name-field">
            <span className="field-label">Nama pengguna</span>
            <span className="input-wrap"><input type="text" autoComplete="username" minLength={3} maxLength={24} pattern="[A-Za-z0-9_.-]{3,24}" required value={authUsername} onChange={(event) => setAuthUsername(event.target.value)} /></span>
          </label>
          <label className="name-field">
            <span className="field-label">Kata sandi</span>
            <span className="input-wrap"><input type="password" autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} minLength={authMode === 'signup' ? 12 : undefined} required value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} /></span>
          </label>
          {authError && <p className="auth-error" role="alert">{authError}</p>}
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
              <div
                className={`scene${isNight ? ' time-night' : ' time-day'}${celebrating ? ' celebrate' : ''}${wateringMode ? ' is-watering' : ''}${pettingMode ? ' is-petting' : ''}${petting ? ' petting' : ''}`}
                onPointerMove={trackFlowerPointer}
                onPointerLeave={resetFlowerGaze}
              >
                <div className="scene-sun" aria-hidden="true" />
                <div className="scene-moon" aria-hidden="true">☾</div>
                <div className="scene-cloud cloud-one" aria-hidden="true" />
                <div className="scene-cloud cloud-two" aria-hidden="true" />
                <span className="scene-sparkle sparkle-one" aria-hidden="true">✦</span>
                <span className="scene-sparkle sparkle-two" aria-hidden="true">✧</span>
                {isNight && (
                  <>
                    <span className="scene-star star-one" aria-hidden="true">✦</span>
                    <span className="scene-star star-two" aria-hidden="true">✧</span>
                    <span className="scene-star star-three" aria-hidden="true">·</span>
                  </>
                )}
                {(wateringMode || pettingMode) && (
                  <span className="watering-hint">{wateringMode ? 'Klik bunganya untuk menyiram' : 'Arahkan kursor, lalu elus bunganya'}</span>
                )}
                {petting && <span className="pet-reaction">Hehe! ♡</span>}
                <button
                  ref={flowerArtRef}
                  className={`flower-art${condition.wilted ? ' is-wilted' : ''}${condition.dead ? ' is-dead' : ''}${wateringMode ? ' is-watering' : ''}${pettingMode ? ' is-petting' : ''}${petting ? ' just-petted' : ''}`}
                  type="button"
                  disabled={!wateringMode && (!pettingMode || condition.dead)}
                  aria-label={wateringMode ? `Siram ${garden.name}` : `Elus ${garden.name}`}
                  onClick={interactWithFlower}
                >
                  <PixelFlower flower={flower} stage={stage} condition={condition} garden={garden} petting={petting} />
                  {garden.accessory && garden.accessory !== 'none' && (
                    <span className={`flower-accessory accessory-${garden.accessory}`} aria-hidden="true">
                      {accessories.find((item) => item.id === garden.accessory)?.emoji}
                    </span>
                  )}
                </button>
                <div className="ground" />
                <div className="scene-caption"><span aria-hidden="true">{isNight ? '☾' : '☀'}</span> {isNight ? 'Malam' : 'Siang'} · {sceneCaption}</div>
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
                  <img className="water-drop" src="/watering-can.svg" alt="" />
                  <div><strong>{wateringMode ? 'Pot siram siap!' : 'Waktunya minum!'}</strong><span>{wateringMode ? 'Klik bunganya di gambar' : condition.dead ? 'Saatnya menanam bunga baru' : wateredToday ? 'Terima kasih sudah merawatnya ♡' : condition.wilted ? 'Dia sangat haus, siram sekarang!' : 'Siram agar tetap ceria'}</span></div>
                </div>
                <button
                  className={`water-button${wateringMode ? ' is-active' : ''}`}
                  type="button"
                  disabled={!wateringMode && (wateredToday || condition.dead)}
                  aria-pressed={wateringMode}
                  onClick={() => {
                    const nextMode = !wateringMode;
                    setWateringMode(nextMode);
                    setPettingMode(false);
                    if (nextMode) showToast('Klik bunganya untuk menyiram 💧');
                  }}
                >
                  <img src="/watering-can.svg" alt="" />
                  <span>{condition.dead ? 'Bunganya sudah beristirahat' : wateredToday ? 'Sudah disiram hari ini!' : wateringMode ? 'Batalkan menyiram' : 'Ambil pot siram'}</span>
                </button>
              </div>

              <section className="customize-panel" aria-label="Kustomisasi bunga">
                <h4>Hias bungamu <span aria-hidden="true">✦</span></h4>
                <div className="customize-group">
                  <span className="customize-label">Jenis pot</span>
                  <div className="pot-type-options">
                    {potTypes.map((pot) => (
                      <button
                        key={pot.id}
                        className={`pot-type-option${(garden.potType || 'classic') === pot.id ? ' selected' : ''}`}
                        type="button"
                        aria-pressed={(garden.potType || 'classic') === pot.id}
                        onClick={() => updateCustomization('potType', pot.id)}
                      >
                        <span className={`pot-type-preview pot-preview-${pot.id}`} aria-hidden="true" />
                        {pot.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="customize-group">
                  <span className="customize-label">Warna pot</span>
                  <div className="pot-color-options">
                    {potColors.map((color) => (
                      <button
                        key={color.id}
                        className={`pot-color-option${(garden.potColor || 'terracotta') === color.id ? ' selected' : ''}`}
                        type="button"
                        aria-label={color.name}
                        aria-pressed={(garden.potColor || 'terracotta') === color.id}
                        title={color.name}
                        onClick={() => updateCustomization('potColor', color.id)}
                      >
                        <span style={{ backgroundColor: color.main }} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="customize-group">
                  <span className="customize-label">Aksesori</span>
                  <div className="accessory-options">
                    {accessories.map((item) => (
                      <button
                        key={item.id}
                        className={`accessory-option${(garden.accessory || 'none') === item.id ? ' selected' : ''}`}
                        type="button"
                        aria-pressed={(garden.accessory || 'none') === item.id}
                        onClick={() => updateCustomization('accessory', item.id)}
                      >
                        <span aria-hidden="true">{item.emoji}</span>{item.name}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  className={`face-toggle${garden.faceEnabled !== false ? ' selected' : ''}`}
                  type="button"
                  aria-pressed={garden.faceEnabled !== false}
                  onClick={() => updateCustomization('faceEnabled', garden.faceEnabled === false)}
                >
                  <span aria-hidden="true">{garden.faceEnabled !== false ? '😊' : '🌼'}</span>
                  {garden.faceEnabled !== false ? 'Mata & senyum aktif' : 'Tambahkan mata & senyum'}
                </button>
              </section>

              <button
                className={`water-button pet-button${pettingMode ? ' is-active' : ''}`}
                type="button"
                disabled={condition.dead}
                aria-pressed={pettingMode}
                onClick={() => {
                  const nextMode = !pettingMode;
                  setPettingMode(nextMode);
                  setWateringMode(false);
                  if (nextMode) showToast('Arahkan ke bunga, lalu klik untuk mengelus 🌷');
                }}
              >
                <span aria-hidden="true">☝️</span>
                <span>{condition.dead ? 'Bunganya sedang beristirahat' : pettingMode ? 'Selesai mengelus' : 'Elus bunganya'}</span>
              </button>

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
