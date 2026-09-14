// Local inspired replica of secret-venice-advanture.lovable.app
// Flow: welcome -> setup -> how-it-works -> compass -> story -> progress -> ... -> complete -> album
// Original text/assets NOT copied; all copy here is original.
const store = {
  load(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const RESUME_KEY = 'vtq.replica.resume.v1';
const LIB_KEY = 'vtq.replica.library.v1';

let treasures = [];
let state = store.load(RESUME_KEY, { phase: 'welcome', index: 0, config: { duration: 'half', snacks: true }, photos: {} });

function save() { store.save(RESUME_KEY, state); }
async function init() {
  const res = await fetch('/api/treasures');
  treasures = await res.json();
  render();
}
function nav(phase, index = state.index) {
  state.phase = phase; state.index = index; save(); render();
  window.scrollTo(0, 0);
}
function el(html) {
  const app = document.getElementById('app');
  app.innerHTML = html;
  return app;
}
function topbar() {
  return `<div class="topbar">
    <button class="ghost" onclick="nav('welcome',0)">↺ Start</button>
    <button class="ghost" onclick="finishQuest()">End</button>
  </div>`;
}
function catQuote(text) {
  return `<div class="cat"><span style="font-size:28px">🐈</span><span>"${text}"<br/>— Sir Mewurisius</span></div>`;
}
function render() {
  const t = treasures[state.index];
  switch (state.phase) {
    case 'welcome': {
      const resume = store.load(RESUME_KEY, null);
      const canResume = resume && resume.phase !== 'welcome' && resume.phase !== 'complete';
      el(`<div class="welcome">
        <div class="cover">🐈‍⬛🗺️</div>
        <p class="eyebrow">Secret Venice Adventure</p>
        <h1>A Family Quest Through Hidden Venice</h1>
        <p>Narrated by Sir Mewurisius the cat. ${treasures.length} secret spots, puzzles, photos.</p>
        ${canResume ? `<button class="cta" onclick="nav('${resume.phase}',${resume.index})">Resume quest</button>` : ''}
        <button class="cta" onclick="nav('setup',0)">Let's go!</button>
        <p style="margin-top:16px"><button class="ghost" onclick="nav('album',0)">Photo album</button></p>
      </div>`);
      break;
    }
    case 'setup':
      el(`${topbar()}
        <p class="eyebrow">Setup</p><h1>Plan your quest</h1>
        <div class="card"><b>1. How long?</b><br/>
        ${['stroll','half','full'].map(d => `<label><input type="radio" name="dur" ${state.config.duration===d?'checked':''} onchange="setDur('${d}')"/> ${d}</label> `).join('')}
        </div>
        <div class="card"><b>2. Snacks?</b><br/><label><input type="checkbox" ${state.config.snacks?'checked':''} onchange="setSnacks(this.checked)"/> Yes, gelato stops!</label></div>
        <button class="cta" onclick="nav('how',0)">Continue</button>`);
      break;
    case 'how':
      el(`${topbar()}
        <p class="eyebrow">How it works</p><h1>1 → 2 → 3</h1>
        <div class="card">🧭 <b>Follow the compass</b> — find the hidden corner.</div>
        <div class="card">📖 <b>Hear the story</b> — Sir Mewurisius tells the secret.</div>
        <div class="card">📸 <b>Snap a photo</b> — save it to your album.</div>
        <button class="cta" onclick="nav('compass',0)">Start treasure 1</button>`);
      break;
    case 'compass':
      el(`${topbar()}
        <p class="eyebrow">Mission ${state.index+1} / ${treasures.length}</p>
        <h1>${t.title}</h1>
        <div class="card">📍 <b>${t.neighborhood}</b><br/><a href="${t.mapUrl}" target="_blank" rel="noopener">Open map</a><br/>~${t.distanceMeters} m away • ~${Math.max(1,Math.round(t.distanceMeters/80))} min walk</div>
        <div class="card">👀 Look for:<br/>${t.lookFor.replace(/\n/g,'<br/>')}</div>
        ${catQuote('Follow your nose, and your paws!')}
        <button class="cta" onclick="nav('story')">We found it!</button>`);
      break;
    case 'story': {
      const photo = state.photos[t.id];
      el(`${topbar()}
        <p class="eyebrow">Treasure ${String(t.ordinal).padStart(2,'0')} — ${t.neighborhood}</p>
        <h1>${t.title}</h1>
        <p style="text-align:center;font-style:italic">${t.subtitle}</p>
        <div class="card">${t.body.replace(/\n/g,'<br/><br/>')}</div>
        ${catQuote(t.catQuote)}
        <div class="card"><b>📸 Quest photo</b><br/>
        ${photo ? `<img class="preview" src="${photo}" alt="photo of ${t.title}"/><br/><button class="ghost" onclick="clearPhoto()">Remove</button>` :
          `<input type="file" accept="image/*" onchange="savePhoto(event)"/>`}
        </div>
        <button class="cta" onclick="nextFromStory()">${state.index >= treasures.length-1 ? 'Finish quest' : 'Next treasure'}</button>`);
      break;
    }
    case 'map': {
      el(`${topbar()}
        <p class="eyebrow">Our journey</p><h1>Completion map</h1>
        <p style="text-align:center">${treasures.filter(x => state.photos[x.id]).length} / ${treasures.length} spots found</p>
        <div id="quest-map" class="map"></div>
        <div class="legend"><span class="dot done"></span> found &nbsp;<span class="dot todo"></span> to find</div>
        <p style="text-align:center"><button class="cta" onclick="nav('compass',${Math.min(state.index, treasures.length-1)})">Back to quest</button></p>`);
      drawMap();
      break;
    }
    case 'progress': {
      const found = state.index; // just found index-1, now pointing at next
      const pct = Math.round(found / treasures.length * 100);
      el(`${topbar()}
        <p class="eyebrow">Journey so far</p>
        <h1>Found ${found} / ${treasures.length}!</h1>
        <div class="progressbar"><div style="width:${pct}%"></div></div>
        <div class="card">Next: <b>${t.title}</b> — ${t.neighborhood}</div>
        <button class="cta" onclick="nav('map')">🗺️ Completion map</button>
        <button class="cta" onclick="nav('compass')">Onward! 🐾</button>`);
      break;
    }
    case 'complete': {
      const lib = store.load(LIB_KEY, []);
      el(`<p class="eyebrow">Quest complete!</p>
        <h1>Purrrfect explorers! 🎉</h1>
        <p>You visited ${treasures.length} hidden corners. Saved to library (${lib.length+1}).</p>
        <ul>${treasures.map(x => `<li>${x.title} ${state.photos[x.id] ? '📸' : ''}</li>`).join('')}</ul>
        <button class="cta" onclick="nav('album',0)">View photo album</button>
        <p style="text-align:center;margin-top:12px"><button class="ghost" onclick="nav('welcome',0)">Start over</button></p>`);
      break;
    }
    case 'album': {
      const entries = treasures.filter(x => state.photos[x.id]);
      el(`${topbar()}<p class="eyebrow">Our memories</p><h1>Photo album</h1>
      ${entries.length===0 ? '<p>No photos yet. Take one at each story stop!</p>' :
        entries.map(x => `<div class="card"><b>${x.title}</b><img class="preview" src="${state.photos[x.id]}"/></div>`).join('')}
      <button class="cta" onclick="nav('compass',${Math.min(state.index, treasures.length-1)})">Back to quest</button>`);
      break;
    }
  }
}
function setDur(d) { state.config.duration = d; save(); }
function setSnacks(v) { state.config.snacks = v; save(); }
function drawMap() {
  const container = document.getElementById('quest-map');
  if (!container) return;
  const visited = new Set(Object.keys(state.photos));
  const map = L.map('quest-map', { zoomControl: true, attributionControl: true });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(map);
  treasures.forEach(t => {
    const done = visited.has(t.id);
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:28px;height:28px;border-radius:50%;background:${done ? '#3a6e3a' : '#f0e6cf'};border:3px solid ${done ? '#f0e6cf' : '#2b1a10'};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:bold;color:${done ? '#f0e6cf' : '#2b1a10'};line-height:1">${t.ordinal}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    const marker = L.marker([t.lat, t.lon], { icon }).addTo(map);
    const label = `${t.ordinal}. ${t.title}${done ? ' ✅' : ''}`;
    marker.bindPopup(`<b>${label}</b><br/><small>${t.neighborhood}</small>`);
  });
  const bounds = L.latLngBounds(treasures.map(t => [t.lat, t.lon]));
  map.fitBounds(bounds, { padding: [50, 50] });
}
function savePhoto(e) {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      state.photos[treasures[state.index].id] = c.toDataURL('image/jpeg', 0.78);
      save(); render();
    };
    img.src = r.result;
  };
  r.readAsDataURL(f);
}
function clearPhoto() { delete state.photos[treasures[state.index].id]; save(); render(); }
function nextFromStory() {
  if (state.index >= treasures.length - 1) finishQuest();
  else nav('progress', state.index + 1);
}
function finishQuest() {
  const lib = store.load(LIB_KEY, []);
  lib.unshift({ title: 'Venice Quest', finishedAt: Date.now(), photos: JSON.parse(JSON.stringify(state.photos)) });
  store.save(LIB_KEY, lib.slice(0, 20));
  nav('complete', treasures.length - 1);
}
init();
