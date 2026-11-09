(() => {
  const STORAGE_KEY = 'kebun-kecil-v1';
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

  const $ = (selector) => document.querySelector(selector);
  const setupView = $('#setup-view');
  const gardenView = $('#garden-view');
  const flowerGrid = $('#flower-grid');
  const nameInput = $('#flower-name');
  const plantButton = $('#plant-button');
  let selectedFlower = null;
  let state = loadState();
  let toastTimer;

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

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || typeof saved !== 'object' || !flowers.some((flower) => flower.id === saved.flowerId)) return null;
      if (typeof saved.name !== 'string' || typeof saved.plantedAt !== 'string' || typeof saved.lastWatered !== 'string') return null;
      saved.waterDates = Array.isArray(saved.waterDates) ? saved.waterDates.filter((date) => typeof date === 'string') : [saved.lastWatered];
      return saved;
    } catch (error) {
      console.error('Progres kebun tidak dapat dibaca dari penyimpanan browser.', error);
      return null;
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Progres kebun tidak dapat disimpan di browser.', error);
      showToast('Progres tidak bisa disimpan. Periksa ruang penyimpanan browser.', true);
    }
  }

  function activeFlower() {
    return flowers.find((flower) => flower.id === state?.flowerId);
  }

  function getCondition() {
    const age = daysBetween(state.plantedAt);
    const dryDays = daysBetween(state.lastWatered);
    return {
      age,
      dryDays,
      dead: dryDays >= 4,
      wilted: dryDays >= 2 && dryDays < 4,
      grown: age >= 14,
    };
  }

  function calculateStreak() {
    const dates = new Set(state.waterDates);
    let cursor = state.lastWatered;
    let streak = 0;
    while (dates.has(cursor)) {
      streak += 1;
      const [year, month, day] = cursor.split('-').map(Number);
      const previous = new Date(Date.UTC(year, month - 1, day - 1));
      cursor = `${previous.getUTCFullYear()}-${String(previous.getUTCMonth() + 1).padStart(2, '0')}-${String(previous.getUTCDate()).padStart(2, '0')}`;
    }
    return streak;
  }

  function renderFlowerChoices() {
    flowerGrid.innerHTML = '';
    flowers.forEach((flower) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'flower-choice';
      button.setAttribute('aria-pressed', 'false');
      button.innerHTML = `<span class="flower-emoji" aria-hidden="true">${flower.emoji}</span><span class="flower-choice-name">${flower.name}</span>`;
      button.addEventListener('click', () => {
        selectedFlower = flower;
        [...flowerGrid.children].forEach((choice) => {
          const isSelected = choice === button;
          choice.classList.toggle('selected', isSelected);
          choice.setAttribute('aria-pressed', String(isSelected));
          choice.querySelector('.selected-check')?.remove();
          if (isSelected) {
            const check = document.createElement('span');
            check.className = 'selected-check';
            check.setAttribute('aria-hidden', 'true');
            check.textContent = '✓';
            choice.append(check);
          }
        });
        plantButton.disabled = !nameInput.value.trim();
      });
      flowerGrid.append(button);
    });
  }

  function plantFlower() {
    const name = nameInput.value.trim().slice(0, 18);
    if (!selectedFlower || !name) return;
    const today = localDateKey();
    state = {
      flowerId: selectedFlower.id,
      name,
      plantedAt: today,
      lastWatered: today,
      waterDates: [today],
    };
    saveState();
    render();
    showToast(`${name} sudah ditanam dan mendapat siraman pertama! Yuk tumbuh bersama 🌱💧`);
  }

  function pixel(x, y, color) {
    return `<rect x="${x * 8}" y="${y * 8}" width="8" height="8" fill="${color}"/>`;
  }

  function flowerSvg(flower, stage, condition) {
    const pixels = [];
    const put = (x, y, color) => pixels.push(pixel(x, y, color));
    const soil = condition.dead ? '#7c6757' : '#9a7656';
    const soilLight = condition.dead ? '#8a786a' : '#b28a61';
    [[5, 13], [6, 13], [7, 13], [8, 13], [9, 13], [10, 13],
      [4, 14], [5, 14], [6, 14], [7, 14], [8, 14], [9, 14], [10, 14], [11, 14],
      [5, 15], [6, 15], [7, 15], [8, 15], [9, 15], [10, 15]].forEach(([x, y]) => put(x, y, soil));
    [[5, 13], [6, 13], [9, 13], [10, 13], [5, 14], [10, 14]].forEach(([x, y]) => put(x, y, soilLight));

    if (stage === 'seed') {
      [[7, 12], [8, 12], [7, 11]].forEach(([x, y]) => put(x, y, '#a4763c'));
      put(7, 11, '#d6a757');
      return `<svg viewBox="0 0 128 128" role="img" aria-label="Benih kecil yang baru ditanam">${pixels.join('')}</svg>`;
    }
    const stemColor = condition.dead ? '#89745c' : '#56844d';
    const leafColor = condition.dead ? '#9a876e' : '#79a85f';
    const stemTop = stage === 'sprout' ? 8 : stage === 'bud' ? 5 : 4;
    for (let y = stemTop + 1; y <= 12; y++) put(7, y, stemColor);
    [[6, 10], [5, 9], [6, 9], [8, 11], [9, 10]].forEach(([x, y]) => put(x, y, leafColor));
    if (stage === 'sprout') {
      [[7, 8], [6, 7], [5, 7], [8, 7], [9, 7], [7, 6]].forEach(([x, y]) => put(x, y, leafColor));
      return `<svg viewBox="0 0 128 128" role="img" aria-label="Tunas hijau yang baru tumbuh">${pixels.join('')}</svg>`;
    }
    if (stage === 'bud') {
      [[7, 5], [8, 5], [6, 4], [7, 4], [8, 4], [9, 4], [7, 3], [8, 3]].forEach(([x, y]) => put(x, y, flower.light));
      [[6, 6], [9, 6]].forEach(([x, y]) => put(x, y, stemColor));
      return `<svg viewBox="0 0 128 128" role="img" aria-label="Kuncup bunga mulai muncul">${pixels.join('')}</svg>`;
    }

    const bloomSize = stage === 'bloom';
    const petalShapes = {
      sunflower: [[7, 2], [8, 2], [5, 3], [6, 3], [9, 3], [10, 3], [4, 4], [5, 4], [10, 4], [11, 4], [4, 5], [5, 5], [10, 5], [11, 5], [5, 6], [6, 6], [9, 6], [10, 6], [6, 7], [7, 7], [8, 7], [9, 7]],
      rose: [[7, 2], [8, 2], [6, 3], [7, 3], [8, 3], [9, 3], [5, 4], [6, 4], [9, 4], [10, 4], [5, 5], [6, 5], [9, 5], [10, 5], [6, 6], [7, 6], [8, 6], [9, 6], [6, 7], [7, 7], [8, 7], [9, 7]],
      tulip: [[7, 2], [8, 2], [6, 3], [7, 3], [8, 3], [9, 3], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [6, 5], [7, 5], [8, 5], [9, 5], [7, 6], [8, 6]],
      lavender: [[7, 2], [8, 2], [6, 3], [7, 3], [8, 3], [9, 3], [7, 4], [8, 4], [6, 5], [7, 5], [8, 5], [9, 5], [7, 6], [8, 6]],
      lily: [[7, 2], [8, 2], [6, 3], [9, 3], [5, 4], [6, 4], [9, 4], [10, 4], [4, 5], [5, 5], [10, 5], [11, 5], [5, 6], [6, 6], [9, 6], [10, 6], [6, 7], [7, 7], [8, 7], [9, 7]],
    };
    const petals = petalShapes[flower.id] || [
      [7, 3], [8, 3], [6, 4], [7, 4], [8, 4], [9, 4],
      [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5],
      [5, 6], [6, 6], [9, 6], [10, 6],
      [6, 7], [7, 7], [8, 7], [9, 7],
    ];
    const expandedPetals = bloomSize && !['tulip', 'lavender'].includes(flower.id)
      ? petals.concat([[7, 1], [8, 1], [4, 4], [11, 4], [4, 5], [11, 5], [6, 8], [9, 8]])
      : petals;
    expandedPetals.forEach(([x, y], index) => put(x, y, index % 4 === 0 ? flower.light : flower.petal));
    [[7, 5], [8, 5], [7, 6], [8, 6]].forEach(([x, y]) => put(x, y, flower.center));
    [[7, 5], [8, 5]].forEach(([x, y]) => put(x, y, flower.dark));
    [[7, 6]].forEach(([x, y]) => put(x, y, flower.light));
    if (!condition.dead) {
      put(7, 5, '#fffdf0');
      put(8, 5, '#fffdf0');
      put(7, 6, '#624b3c');
      put(8, 6, '#624b3c');
    }
    return `<svg viewBox="0 0 128 128" role="img" aria-label="${condition.dead ? 'Bunga yang sudah layu dan mati' : `${flower.name} pixel-art yang sedang tumbuh`}">${pixels.join('')}</svg>`;
  }

  function renderGarden() {
    const flower = activeFlower();
    const condition = getCondition();
    setupView.hidden = true;
    gardenView.hidden = false;
    $('#section-kicker').textContent = condition.dead ? 'KEBUN BUTUH AWAL BARU' : 'LANGKAH 02 / RAWAT SETIAP HARI';
    $('#section-title').textContent = condition.dead ? 'Terima kasih sudah merawatnya.' : 'Teman kecilmu sedang tumbuh.';
    $('#active-flower-name').textContent = state.name;
    const stage = condition.dead ? 'dead' : condition.age >= 14 ? 'bloom' : condition.age >= 5 ? 'bud' : condition.age >= 2 ? 'sprout' : 'seed';
    const art = $('#flower-art');
    art.className = `flower-art${condition.wilted ? ' is-wilted' : ''}${condition.dead ? ' is-dead' : ''}`;
    art.innerHTML = flowerSvg(flower, stage, condition);
    art.setAttribute('aria-label', `${flower.name} bernama ${state.name}`);
    $('#active-flower-kind').textContent = `${flower.name} · hari ke-${condition.age + 1}`;
    const mood = $('#mood-text');
    const moodDot = $('#mood-dot');
    const sceneCaption = $('#scene-caption');

    if (condition.dead) {
      mood.textContent = 'Perlu awal yang baru';
      moodDot.className = 'mood-dot dead';
      sceneCaption.textContent = 'terima kasih sudah tumbuh bersama ♡';
    } else if (condition.wilted) {
      mood.textContent = 'Agak haus dan layu';
      moodDot.className = 'mood-dot wilted';
      sceneCaption.textContent = 'sedikit air bisa membuatnya segar lagi';
    } else if (condition.grown) {
      mood.textContent = 'Mekar sempurna!';
      moodDot.className = 'mood-dot';
      sceneCaption.textContent = 'lihat, hasil perhatianmu mekar! ✦';
    } else {
      mood.textContent = 'Segar dan bahagia';
      moodDot.className = 'mood-dot';
      sceneCaption.textContent = stage === 'seed' ? 'semua bunga berawal dari benih kecil' : 'pelan-pelan, kamu tumbuh dengan baik';
    }

    const wateredToday = state.lastWatered === localDateKey();
    const waterButton = $('#water-button');
    waterButton.disabled = wateredToday || condition.dead;
    $('#water-button-label').textContent = condition.dead ? 'Mulai kebun baru' : wateredToday ? 'Sudah disiram hari ini!' : 'Siram bungaku';
    $('#water-status').textContent = condition.dead ? 'Saatnya menanam bunga baru' : wateredToday ? 'Terima kasih sudah merawatnya ♡' : condition.wilted ? 'Dia sangat haus, siram sekarang!' : 'Siram agar tetap ceria';

    const growth = Math.min(condition.age + 1, 15);
    $('#growth-count').textContent = `${growth} / 15 hari`;
    $('#growth-bar').style.width = `${(growth / 15) * 100}%`;
    $('#growth-progress').setAttribute('aria-valuenow', String(growth));
    $('#streak-count').textContent = `${calculateStreak()} hari`;
    $('#dry-count').textContent = `${condition.dryDays} hari`;
    $('#daily-tip').textContent = condition.dead
      ? 'Bunga baru berarti kesempatan baru. Yuk mulai lagi saat kamu siap.'
      : condition.wilted
        ? 'Bungamu sudah menunggu air. Siram hari ini agar kembali segar.'
        : condition.grown
          ? 'Kamu berhasil! Bunga mekar berkat perhatian kecilmu setiap hari.'
          : `Sedikit air dan perhatian darimu bikin ${state.name} lebih cerah.`;
    $('#today-label').textContent = new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date());
  }

  function render() {
    $('#today-label').textContent = new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date());
    if (state) renderGarden();
    else {
      setupView.hidden = false;
      gardenView.hidden = true;
      $('#section-kicker').textContent = 'LANGKAH 01 / PILIH TEMAN';
      $('#section-title').textContent = 'Siapa yang mau kamu rawat?';
    }
  }

  function waterFlower() {
    if (!state || getCondition().dead) return;
    const today = localDateKey();
    if (state.lastWatered === today) {
      showToast('Cukup satu kali sehari—bungamu sudah kenyang air! 💧');
      return;
    }
    state.lastWatered = today;
    if (!state.waterDates.includes(today)) state.waterDates.push(today);
    saveState();
    render();
    $('#scene').classList.remove('celebrate');
    requestAnimationFrame(() => $('#scene').classList.add('celebrate'));
    showToast(`Yay! ${state.name} jadi segar lagi berkat kamu 💧`);
  }

  function resetGarden() {
    const message = getCondition().dead
      ? `Tanam bunga baru di kebunmu? Progres ${state.name} akan dihapus.`
      : `Mulai kebun baru? Perjalanan ${state.name} akan dihapus.`;
    if (!window.confirm(message)) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Progres kebun tidak dapat dihapus dari penyimpanan browser.', error);
      showToast('Progres tidak dapat dihapus. Coba lagi di browser ini.', true);
      return;
    }
    state = null;
    selectedFlower = null;
    nameInput.value = 'Bubu';
    plantButton.disabled = true;
    renderFlowerChoices();
    render();
  }

  function renameFlower() {
    const nextName = window.prompt('Mau beri nama apa untuk bungamu?', state.name);
    if (nextName === null) return;
    const name = nextName.trim().slice(0, 18);
    if (!name) {
      showToast('Nama bunga tidak boleh kosong, ya.', true);
      return;
    }
    state.name = name;
    saveState();
    render();
    showToast(`Halo lagi, ${name}! 🌼`);
  }

  function showToast(message, error = false) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.toggle('error', error);
    toast.classList.add('visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 3000);
  }

  renderFlowerChoices();
  render();
  let renderedDate = localDateKey();
  nameInput.addEventListener('input', () => {
    plantButton.disabled = !selectedFlower || !nameInput.value.trim();
  });
  plantButton.addEventListener('click', plantFlower);
  $('#water-button').addEventListener('click', waterFlower);
  $('#reset-button').addEventListener('click', resetGarden);
  $('#rename-button').addEventListener('click', renameFlower);
  window.setInterval(() => {
    const today = localDateKey();
    if (today !== renderedDate) {
      renderedDate = today;
      render();
    }
  }, 60000);
})();
