// ===== AUTH GUARD =====
if (!localStorage.getItem('admin_logged_in')) {
  window.location.href = 'index.html';
}

// ===== ADMIN INFO =====
const adminName  = localStorage.getItem('admin_name')  || 'Admin123';
const adminEmail = localStorage.getItem('admin_email') || 'admin@wastebuddy.com';
document.getElementById('sidebarAdminName').textContent = adminName;
document.getElementById('dashGreeting').textContent     = `Welcome back, ${adminName} 👋`;
document.getElementById('profileNameLg').textContent    = adminName;
document.getElementById('profileEmail').textContent     = adminEmail;

// ===================================================
//  BHOPAL MAP & ROUTE DATA
// ===================================================

// Bhopal locations split across 10 areas, each bin assigned a driver
const BHOPAL_BINS = [
  // Area 1: MP Nagar
  { id:'B-01', name:'MP Nagar Zone 1',       lat:23.2302, lng:77.4343, fill:82, area:1, driver:1 },
  { id:'B-02', name:'MP Nagar Zone 2',       lat:23.2325, lng:77.4350, fill:65, area:1, driver:1 },
  { id:'B-03', name:'DB Mall Square',        lat:23.2283, lng:77.4381, fill:90, area:1, driver:2 },
  // Area 2: New Market
  { id:'B-04', name:'New Market TT Nagar',   lat:23.2395, lng:77.4143, fill:71, area:2, driver:1 },
  { id:'B-05', name:'Roshanpura Square',     lat:23.2420, lng:77.4110, fill:55, area:2, driver:2 },
  { id:'B-06', name:'GTB Complex',           lat:23.2380, lng:77.4130, fill:88, area:2, driver:1 },
  // Area 3: Minal Residency
  { id:'B-07', name:'Minal Gate 1',          lat:23.2651, lng:77.4703, fill:78, area:3, driver:1 },
  { id:'B-08', name:'Minal Mall',            lat:23.2665, lng:77.4720, fill:60, area:3, driver:2 },
  { id:'B-09', name:'JK Road Junction',      lat:23.2680, lng:77.4680, fill:92, area:3, driver:1 },
  // Area 4: Arera Colony
  { id:'B-10', name:'Arera Colony E-5',      lat:23.2150, lng:77.4423, fill:45, area:4, driver:1 },
  { id:'B-11', name:'Arera Colony E-3',      lat:23.2200, lng:77.4350, fill:85, area:4, driver:2 },
  // Area 5: Kolar Road
  { id:'B-12', name:'Kolar Road Sq.',        lat:23.1948, lng:77.4451, fill:40, area:5, driver:1 },
  { id:'B-13', name:'Chuna Bhatti',          lat:23.2050, lng:77.4250, fill:75, area:5, driver:2 },
  // Area 6: Bairagarh
  { id:'B-14', name:'Bairagarh Chichli',     lat:23.2781, lng:77.3710, fill:50, area:6, driver:1 },
  { id:'B-15', name:'Halalpura Bus Stand',   lat:23.2820, lng:77.3800, fill:68, area:6, driver:2 },
  // Area 7: Govindpura
  { id:'B-16', name:'Govindpura Industrial', lat:23.2500, lng:77.4600, fill:88, area:7, driver:1 },
  { id:'B-17', name:'Chetak Bridge',         lat:23.2350, lng:77.4550, fill:55, area:7, driver:2 },
  // Area 8: Awadhpuri
  { id:'B-18', name:'Awadhpuri Square',      lat:23.2300, lng:77.4900, fill:35, area:8, driver:1 },
  { id:'B-19', name:'Khajuri Kalan',         lat:23.2400, lng:77.4950, fill:95, area:8, driver:2 },
  // Area 9: BHEL / Piplani
  { id:'B-20', name:'Piplani Sector C',      lat:23.2271, lng:77.5067, fill:82, area:9, driver:1 },
  { id:'B-21', name:'Jubilee Gate',          lat:23.2450, lng:77.4800, fill:60, area:9, driver:2 },
  // Area 10: Indrapuri
  { id:'B-22', name:'Indrapuri Sector A',    lat:23.2550, lng:77.4750, fill:72, area:10, driver:1 },
  { id:'B-23', name:'BHEL Sangam',           lat:23.2600, lng:77.4850, fill:48, area:10, driver:2 },
];

const AREA_NAMES = {
  1:'MP Nagar', 2:'New Market', 3:'Minal Residency',
  4:'Arera Colony', 5:'Kolar Road', 6:'Bairagarh',
  7:'Govindpura', 8:'Awadhpuri', 9:'BHEL / Piplani', 10:'Indrapuri'
};

const AREA_DRIVERS = {
  1:[{id:1,name:'Rajesh Kumar'},{id:2,name:'Amit Verma'}],
  2:[{id:1,name:'Sunil Sharma'},{id:2,name:'Vikash Pal'}],
  3:[{id:1,name:'Deepak Joshi'},{id:2,name:'Ramesh Yadav'}],
  4:[{id:1,name:'Manoj Singh'},{id:2,name:'Ravi Tiwari'}],
  5:[{id:1,name:'Sanjay Patel'},{id:2,name:'Kiran Dubey'}],
  6:[{id:1,name:'Prakash Nair'},{id:2,name:'Vikas Chouhan'}],
  7:[{id:1,name:'Arun Mishra'},{id:2,name:'Dinesh Rawat'}],
  8:[{id:1,name:'Suresh Gupta'},{id:2,name:'Mohan Thakur'}],
  9:[{id:1,name:'Naveen Pandey'},{id:2,name:'Ashok Meena'}],
  10:[{id:1,name:'Vivek Saxena'},{id:2,name:'Rahul Bhatt'}],
};

function getAreaColor(num) {
  const colors = ['#22c55e','#3b82f6','#f59e0b','#ec4899','#8b5cf6','#06b6d4','#eab308','#ef4444','#14b8a6','#6366f1'];
  return colors[(num - 1) % colors.length];
}
const DEPOT = { lat:23.2599, lng:77.4126, name:'Depot (Smart City HQ)' };

let routeMap       = null;
let routePolyline  = null;
let truckMarker    = null;
let animFrameId    = null;
let binMarkers     = [];
let depotMarker    = null;
let selectedArea   = 1;
let selectedDriver = 1;
let routeRunning   = false;

// ===== HAVERSINE DISTANCE (km) =====
function haversine(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const s = Math.sin(dLat/2)*Math.sin(dLat/2) +
            Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*
            Math.sin(dLng/2)*Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1-s));
}

// ===== NEAREST-NEIGHBOUR TSP =====
function nearestNeighbour(points, start) {
  const unvisited = [...points];
  const route     = [start];
  let   current   = start;
  while (unvisited.length) {
    let nearest = null, minDist = Infinity;
    unvisited.forEach(p => {
      const d = haversine(current, p);
      if (d < minDist) { minDist = d; nearest = p; }
    });
    route.push(nearest);
    unvisited.splice(unvisited.indexOf(nearest), 1);
    current = nearest;
  }
  route.push(start); // return to depot
  return route;
}

// ===== INIT LEAFLET MAP =====
function initRouteMap() {
  if (routeMap) return; // already initialised
  routeMap = L.map('bhopalRouteMap', {
    center: [23.2599, 77.4126],
    zoom:   12,
    zoomControl: true,
    attributionControl: false
  });

  // Dark tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap © CARTO'
  }).addTo(routeMap);

  // Depot marker
  const depotIcon = L.divIcon({
    html: `<div style="background:#fff;border:3px solid #22c55e;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:13px">🏠</div>`,
    className:'', iconSize:[28,28], iconAnchor:[14,14]
  });
  depotMarker = L.marker([DEPOT.lat, DEPOT.lng], {icon:depotIcon})
    .addTo(routeMap)
    .bindPopup(`<b>${DEPOT.name}</b><br><small>Collection Start / End Point</small>`);

  // Add all bin markers
  renderBinMarkers();
}

function getBinIcon(bin) {
  const c   = bin.fill >= 80 ? '#ef4444' : bin.fill >= 60 ? '#f59e0b' : '#22c55e';
  const sym = bin.fill >= 80 ? '🗑️' : '♻️';
  return L.divIcon({
    html: `
      <div style="
        background:${c};border-radius:10px 10px 14px 10px;
        width:32px;height:38px;display:flex;flex-direction:column;
        align-items:center;justify-content:center;
        box-shadow:0 3px 10px rgba(0,0,0,.5);
        border:2px solid rgba(255,255,255,.3);
        cursor:pointer;
      ">
        <span style="font-size:14px;line-height:1">${sym}</span>
        <span style="font-size:8px;color:#fff;font-weight:700;line-height:1.2">${bin.fill}%</span>
      </div>`,
    className:'', iconSize:[32,38], iconAnchor:[16,38], popupAnchor:[0,-38]
  });
}

function renderBinMarkers() {
  // Clear old markers
  binMarkers.forEach(m => routeMap.removeLayer(m));
  binMarkers = [];

  BHOPAL_BINS.forEach(bin => {
    const m = L.marker([bin.lat, bin.lng], { icon: getBinIcon(bin) })
      .addTo(routeMap)
      .bindPopup(`
        <div style="font-family:Inter,sans-serif;min-width:160px">
          <b style="font-size:13px">${bin.id} — ${bin.name}</b><br>
          <span style="color:#64748b;font-size:11px">Area ${bin.area}</span><br>
          <div style="margin-top:6px;background:#e2e8f0;border-radius:4px;height:8px;overflow:hidden">
            <div style="height:100%;width:${bin.fill}%;background:${bin.fill>=80?'#ef4444':bin.fill>=60?'#f59e0b':'#22c55e'};border-radius:4px"></div>
          </div>
          <small style="font-weight:700;color:${bin.fill>=80?'#ef4444':bin.fill>=60?'#f59e0b':'#22c55e'}">${bin.fill}% Full</small>
        </div>`);
    binMarkers.push(m);
  });
}

// ===== GLOBAL AREA CHANGE (from Dashboard dropdown) =====
function changeArea(num) {
  if (!num) return;
  selectedArea = num;
  selectedDriver = 1;

  // Sync the dashboard dropdown
  const dd = document.getElementById('globalAreaDropdown');
  if (dd && dd.value != num) dd.value = num;

  // Update route page header
  const rn = document.getElementById('routeAreaName');
  if (rn) rn.textContent = AREA_NAMES[num];

  // Refresh all visible pages with new area data
  renderDashboard();
  renderBinsTable();
  renderAlerts('all');

  // If route map is initialised, update it too
  if (routeMap) {
    populateDriverSelector();
    selectDriver(1);
  }

  showToast(`Switched to ${AREA_NAMES[num]}`);
}

// ===== POPULATE DRIVER SELECTOR (Routes page) =====
function populateDriverSelector() {
  const container = document.getElementById('driverSelectorContainer');
  if (!container) return;
  const drivers = AREA_DRIVERS[selectedArea] || [];
  const driverColors = ['#22c55e','#3b82f6','#f59e0b'];
  container.innerHTML = drivers.map((d, i) => {
    const color = driverColors[i % driverColors.length];
    return `<div class="driver-opt ${d.id === selectedDriver ? 'selected' : ''}"
                 data-driver="${d.id}" onclick="selectDriver(${d.id})">
      <span class="dot" style="background:${color}"></span>
      <i class="fas fa-truck" style="color:${color}"></i> ${d.name}
    </div>`;
  }).join('');
}

// ===== SELECT DRIVER (Routes page) =====
function selectDriver(num) {
  if (!num) return;
  selectedDriver = num;

  // Highlight selected driver button
  document.querySelectorAll('.driver-opt').forEach(el => {
    el.classList.toggle('selected', parseInt(el.dataset.driver) === num);
  });

  const drivers = AREA_DRIVERS[selectedArea] || [];
  const dInfo = drivers.find(d => d.id === num);
  const label = document.getElementById('routeDriverLabel');
  if (label) label.textContent = dInfo ? dInfo.name : `Driver ${num}`;

  // Filter bins for this area + driver
  const driverBins = BHOPAL_BINS.filter(b => b.area === selectedArea && b.driver === num);
  const color = getAreaColor(selectedArea);

  if (driverBins.length > 0) {
    const totalDist = calcTotalDist(nearestNeighbour(driverBins, DEPOT));
    const estMin = Math.round(totalDist / 30 * 60);
    document.getElementById('routeDist').textContent = totalDist.toFixed(1)+' km';
    document.getElementById('routeTime').textContent = estMin+' min';
    document.getElementById('routeFuel').textContent = (Math.random()*8+14).toFixed(0)+'%';
  } else {
    document.getElementById('routeDist').textContent = '—';
    document.getElementById('routeTime').textContent = '—';
    document.getElementById('routeFuel').textContent = '—';
  }

  // Render sidebar bin list for this driver
  const listEl = document.getElementById('binStopList');
  listEl.innerHTML = driverBins.map((b,i) => {
    const chipClass = b.fill>=80?'red-chip':b.fill>=60?'yel-chip':'grn-chip';
    return `<div class="bin-stop">
      <div class="stop-num" style="background:${color}">${i+1}</div>
      <div style="flex:1">
        <div style="font-weight:600">${b.id}</div>
        <div style="color:var(--muted);font-size:11px">${b.name}</div>
      </div>
      <span class="fill-chip ${chipClass}">${b.fill}%</span>
    </div>`;
  }).join('') || '<p style="color:var(--muted);font-size:12px;text-align:center;padding:10px">No bins for this driver</p>';

  // Fit bounds to driver bins but keep ALL markers on map
  if (routeMap && driverBins.length > 0) {
    const latlngs = driverBins.map(b => [b.lat, b.lng]);
    latlngs.push([DEPOT.lat, DEPOT.lng]);
    routeMap.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40], maxZoom: 15 });
  }

  // Highlight driver's bins on map
  binMarkers.forEach((m, i) => {
    const bin = BHOPAL_BINS[i];
    m.setZIndexOffset(bin.area === selectedArea && bin.driver === num ? 1000 : 0);
  });

  // Reset route if running
  if (routeRunning) stopRoute();
}

function calcTotalDist(route) {
  let d = 0;
  for (let i = 1; i < route.length; i++) d += haversine(route[i-1], route[i]);
  return d;
}

// ===== TRUCK ANIMATION =====
const truckIcon = L.divIcon({
  html: `<div style="background:#22c55e;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 6px rgba(34,197,94,.25);font-size:18px;animation:truckPulse 1s ease infinite">🚛</div>`,
  className:'', iconSize:[36,36], iconAnchor:[18,18]
});

function animateTruck(routePoints, color) {
  let segIdx   = 0;
  let prevSeg  = -1;
  let progress = 0;
  const SPEED  = 0.0008; // slower — 5× the original speed

  if (truckMarker) routeMap.removeLayer(truckMarker);
  truckMarker = L.marker([routePoints[0].lat, routePoints[0].lng], {icon: truckIcon, zIndexOffset:2000})
    .addTo(routeMap);

  function step() {
    if (segIdx >= routePoints.length - 1) {
      // Reached end — truck arrived back at depot
      document.getElementById('routeStatusText').textContent = '✅ Route complete! All bins emptied.';
      return;
    }
    progress += SPEED;
    if (progress >= 1) {
      progress = 0;
      segIdx++;

      // When truck arrives at a waypoint that is a real bin (has an id), empty it
      if (segIdx < routePoints.length) {
        const arrived = routePoints[segIdx];
        if (arrived.id) { // real bin, not depot
          // 1. Update BHOPAL_BINS fill
          const binRef = BHOPAL_BINS.find(b => b.id === arrived.id);
          if (binRef) {
            binRef.fill = 5; // nearly empty

            // 2. Update the Leaflet marker icon
            const mIdx = BHOPAL_BINS.indexOf(binRef);
            if (binMarkers[mIdx]) {
              binMarkers[mIdx].setIcon(getBinIcon(binRef));
              binMarkers[mIdx].getPopup() && binMarkers[mIdx].setPopupContent(`
                <div style="font-family:Inter,sans-serif;min-width:160px">
                  <b style="font-size:13px">${binRef.id} — ${binRef.name}</b><br>
                  <span style="color:#64748b;font-size:11px">Area ${binRef.area} Route</span><br>
                  <div style="margin-top:6px;background:#e2e8f0;border-radius:4px;height:8px;overflow:hidden">
                    <div style="height:100%;width:5%;background:#22c55e;border-radius:4px"></div>
                  </div>
                  <small style="font-weight:700;color:#22c55e">5% — Emptied ✅</small>
                </div>`);
            }

            // 3. Sync the bins table entry if it exists
            const tableEntry = bins.find(b => b.id === binRef.id || b.location.includes(binRef.name));
            if (tableEntry) {
              tableEntry.fill    = 5;
              tableEntry.updated = 'Just now';
            }

            // 4. Refresh the bins table + dashboard silently
            renderBinsTable();
            renderDashboard();
          }
        }
      }
    }
    if (segIdx >= routePoints.length - 1) return;

    const from = routePoints[segIdx];
    const to   = routePoints[segIdx + 1];
    const lat  = from.lat + (to.lat - from.lat) * progress;
    const lng  = from.lng + (to.lng - from.lng) * progress;
    truckMarker.setLatLng([lat, lng]);

    // Update status text
    const visited = segIdx + 1;
    const total   = routePoints.length - 2; // excl depot start/end
    document.getElementById('routeStatusText').textContent =
      `🚛 Visiting stop ${Math.min(visited, total)} of ${total}…`;

    animFrameId = requestAnimationFrame(step);
  }
  animFrameId = requestAnimationFrame(step);
}

// ===== START / STOP ROUTE =====
function startRoute() {
  const driverBins = BHOPAL_BINS.filter(b => b.area === selectedArea && b.driver === selectedDriver && b.fill >= 60);

  if (driverBins.length === 0) {
    showToast('No alerted bins (>=60% full) for this driver!', 'yellow');
    return;
  }

  const color = getAreaColor(selectedArea);
  const optimal = nearestNeighbour(driverBins, DEPOT);
  const latlngs = optimal.map(p => [p.lat, p.lng]);

  if (routePolyline) routeMap.removeLayer(routePolyline);

  L.polyline(latlngs, { color:'#000', weight:8, opacity:.2 }).addTo(routeMap);
  routePolyline = L.polyline(latlngs, {
    color, weight: 4, opacity: 0.9, dashArray: '10,6', lineJoin: 'round'
  }).addTo(routeMap);

  routeMap.fitBounds(routePolyline.getBounds(), { padding:[40,40] });

  const seq = document.getElementById('routeSequence');
  seq.innerHTML = optimal.map((p, i) => {
    const label = p.id ? p.id : 'Depot';
    const isDepot = !p.id;
    return [
      `<span class="route-seq-item" style="background:${isDepot?'rgba(255,255,255,.1)':color+'22'};border-color:${isDepot?'var(--border)':color};color:${isDepot?'var(--muted)':color};font-weight:600">${isDepot?'🏠 Depot':label}</span>`,
      i < optimal.length-1 ? `<span class="route-seq-arrow" style="color:${color}">→</span>` : ''
    ].join('');
  }).join('');

  document.getElementById('routeSeqStatus').textContent = `${driverBins.length} stops — optimised`;

  const bar = document.getElementById('routeStatusBar');
  bar.className = 'route-status-bar running';
  bar.querySelector('.truck-pulse').style.background = color;
  document.getElementById('routeStatusText').textContent = '🚛 Route started!';

  animateTruck(optimal, color);

  const btn = document.getElementById('startRouteBtn');
  btn.className  = 'btn-stop-route mt-16';
  btn.innerHTML  = '<i class="fas fa-stop"></i> Stop Route';
  btn.onclick    = stopRoute;
  routeRunning   = true;

  const drivers = AREA_DRIVERS[selectedArea] || [];
  const dName = (drivers.find(d=>d.id===selectedDriver)||{}).name || 'Driver';
  showToast(`${dName}'s route started! ${driverBins.length} stops.`);
}

function stopRoute() {
  if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
  if (truckMarker) { routeMap.removeLayer(truckMarker); truckMarker = null; }

  const bar = document.getElementById('routeStatusBar');
  bar.className = 'route-status-bar idle';
  bar.querySelector('.truck-pulse').style.background = 'var(--muted)';
  document.getElementById('routeStatusText').textContent = 'Route stopped';

  const btn = document.getElementById('startRouteBtn');
  btn.className = 'btn-start-route mt-16';
  btn.innerHTML = '<i class="fas fa-play"></i> Start Route';
  btn.onclick   = startRoute;
  routeRunning  = false;

  showToast('Route stopped.', 'yellow');
}

// Set backend URL in settings
document.addEventListener('DOMContentLoaded', () => {
  const bField = document.getElementById('settingsBackend');
  if (bField) bField.value = BACKEND_URL;
  const bk = document.getElementById('lastBackupField');
  if (bk) bk.value = new Date().toLocaleString('en-IN');
  const dr = document.getElementById('reportDateRange');
  if (dr) dr.textContent = new Date().toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'});
});

// ===== DATA STORE — bins mirror BHOPAL_BINS locations =====
let bins = BHOPAL_BINS.map(b => ({
  id: b.id,
  location: b.name + ', Bhopal',
  fill: b.fill,
  status: 'Active',
  area: b.area,
  updated: Math.floor(Math.random() * 15 + 1) + ' min ago'
}));

let collections = [
  {id:'COL-001',route:'Route 1',driver:'Driver 1',status:'Completed',time:'Today, 09:33 AM'},
  {id:'COL-002',route:'Route 1',driver:'Driver 1',status:'Completed',time:'Today, 10:15 AM'},
  {id:'COL-003',route:'Route 3',driver:'Driver 1',status:'In Progress',time:'Today, 10:30 AM'},
  {id:'COL-004',route:'Route 1',driver:'Driver 0',status:'Completed',time:'Yesterday, 04:30 PM'},
  {id:'COL-005',route:'Route 2',driver:'Driver 2',status:'Completed',time:'Yesterday, 09:15 PM'},
];

// Generate alerts dynamically from bin data
const alertsData = BHOPAL_BINS.filter(b => b.fill >= 60).map(b => ({
  bin: b.id, fill: b.fill, loc: b.name+', Bhopal',
  time: Math.floor(Math.random()*40+1)+' min ago',
  type: b.fill >= 80 ? 'critical' : 'warning',
  area: b.area
}));

let currentBinIndex = -1;

// ===== HELPERS =====
const getBinColor = f => f>=80?'red':f>=60?'yellow':'green';
const getBinLabel = f => f>=80?'Full':f>=60?'High':f>=40?'Medium':'Low';

function showToast(msg, color='green') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = color==='green'?'#22c55e':color==='red'?'#ef4444':'#f59e0b';
  t.classList.remove('hidden');
  setTimeout(()=>t.classList.add('hidden'), 3000);
}

function formatDateTime() {
  const now = new Date();
  return now.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) +
    ' | ' + now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
}

// ===== LIVE BACKEND STATS =====
async function loadLiveStats() {
  try {
    const res  = await fetch(`${BACKEND_URL}/admin/get_stats`);
    const data = await res.json();
    if (data.success) {
      document.getElementById('statTotalUsers').textContent = data.total_users;
      document.getElementById('statTotalScans').textContent = data.total_scans;
      document.getElementById('statVerified').textContent   = data.total_verified;
      document.getElementById('statPoints').textContent     = data.total_points_given;
    }
  } catch(e) {
    ['statTotalUsers','statTotalScans','statVerified','statPoints'].forEach(id => {
      document.getElementById(id).textContent = 'N/A';
    });
  }
}

// ===== LOAD REAL APP USERS =====
let allAppUsers = [];

async function loadAppUsers() {
  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--muted)"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
  try {
    const res  = await fetch(`${BACKEND_URL}/admin/get_all_users`);
    const data = await res.json();
    if (data.success) {
      allAppUsers = data.users;
      renderAppUsers(allAppUsers);
    } else {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--muted)">Failed to load users.</td></tr>';
    }
  } catch(e) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--red)"><i class="fas fa-exclamation-circle"></i> Cannot connect to backend (${BACKEND_URL})</td></tr>`;
  }
}

function renderAppUsers(data) {
  const tbody = document.getElementById('usersTableBody');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--muted)">No users found.</td></tr>';
    return;
  }
  tbody.innerHTML = data.map((u,i) => `
    <tr>
      <td><strong>${u.name}</strong></td>
      <td style="color:var(--muted);font-size:12px">${u.email}</td>
      <td>${u.mobile || '—'}</td>
      <td><strong style="color:var(--green)">${u.points}</strong></td>
      <td>${u.total_scans}</td>
      <td>${u.verified_count}</td>
      <td style="color:var(--muted);font-size:12px">${u.join_date || 'N/A'}</td>
      <td>
        <button class="icon-btn" style="color:var(--red)" onclick="deleteUser('${u.email}')" title="Delete User"><i class="fas fa-trash-alt"></i></button>
      </td>
    </tr>`).join('');
}

async function deleteUser(email) {
  if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
  try {
    const res  = await fetch(`${BACKEND_URL}/admin/delete_user`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({email})
    });
    const data = await res.json();
    if (data.success) { showToast('User deleted!'); loadAppUsers(); }
    else showToast(data.message || 'Failed to delete', 'red');
  } catch(e) { showToast('Server error!', 'red'); }
}

document.getElementById('userSearch').addEventListener('input', function() {
  const v = this.value.toLowerCase();
  renderAppUsers(allAppUsers.filter(u =>
    u.name.toLowerCase().includes(v) || u.email.toLowerCase().includes(v)
  ));
});

document.getElementById('refreshUsersBtn').addEventListener('click', loadAppUsers);

// ===== NAVIGATION =====
const navItems = document.querySelectorAll('.nav-item');
const pages    = document.querySelectorAll('.page');

navItems.forEach(nav => {
  nav.addEventListener('click', () => {
    navItems.forEach(n => n.classList.remove('active'));
    nav.classList.add('active');
    const target = nav.dataset.page;
    pages.forEach(p => p.classList.remove('active-page'));
    document.getElementById(target).classList.add('active-page');
    if (target==='dashboard')   { renderDashboard(); loadLiveStats(); }
    if (target==='bins')        renderBinsTable();
    if (target==='collections') renderCollectionsTable(collections);
    if (target==='alerts')      renderAlerts('all');
    if (target==='users')       loadAppUsers();
    if (target==='reports')     renderReportsChart();
    if (target==='routes')      { initRouteMap(); populateDriverSelector(); selectDriver(selectedDriver); routeMap.invalidateSize(); }
  });
});

document.querySelectorAll('[data-page]').forEach(el => {
  if (el.classList.contains('view-all-link')) {
    el.addEventListener('click', e => {
      e.preventDefault();
      navItems.forEach(n=>n.classList.remove('active'));
      document.getElementById('nav-'+el.dataset.page).classList.add('active');
      pages.forEach(p=>p.classList.remove('active-page'));
      document.getElementById(el.dataset.page).classList.add('active-page');
      renderAlerts('all');
    });
  }
});

// ===== LOGOUT =====
document.getElementById('logoutBtn').addEventListener('click', () => {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('admin_logged_in');
    localStorage.removeItem('admin_name');
    localStorage.removeItem('admin_email');
    window.location.href = 'index.html';
  }
});

// ===== PROFILE =====
document.getElementById('openProfileBtn').addEventListener('click', () =>
  document.getElementById('profileModal').classList.remove('hidden'));
document.getElementById('closeProfile').addEventListener('click', () =>
  document.getElementById('profileModal').classList.add('hidden'));
document.getElementById('editProfileBtn').addEventListener('click', () =>
  showToast('Profile editing — coming soon!', 'yellow'));

// ===== DASHBOARD =====
function renderDashboard() {
  const areaBins = bins.filter(b => b.area === selectedArea);
  const criticalBins = areaBins.filter(b=>b.fill>=60);
  document.getElementById('statTotalBins').textContent       = areaBins.length;
  document.getElementById('statActiveAlerts').textContent    = criticalBins.length;
  document.getElementById('statTotalCollections').textContent= collections.length;
  const avg = areaBins.length ? Math.round(areaBins.reduce((s,b)=>s+b.fill,0)/areaBins.length) : 0;
  document.getElementById('statAvgFill').textContent = avg+'%';
  document.getElementById('alertBadge').textContent  = criticalBins.length;

  const grid = document.getElementById('dashboardBinGrid');
  grid.innerHTML = '';
  areaBins.forEach((bin) => {
    const realIdx = bins.indexOf(bin);
    const c = getBinColor(bin.fill);
    grid.innerHTML += `
      <div class="bin-mini-card" onclick="openBinDetails(${realIdx})">
        <div class="bin-mini-id">${bin.id}</div>
        <div class="bin-mini-fill ${c}-t">${bin.fill}%</div>
        <div class="mini-bar"><div class="mini-bar-fill ${c}" style="width:${bin.fill}%"></div></div>
        <div class="bin-mini-status ${c}">${getBinLabel(bin.fill)}</div>
      </div>`;
  });

  const da = document.getElementById('dashboardAlerts');
  da.innerHTML = '';
  criticalBins.slice(0,3).forEach(bin => {
    const c = bin.fill>=80?'red':'yellow';
    da.innerHTML += `
      <div class="alert-item ${c==='yellow'?'warning':''}">
        <div class="alert-dot ${c}"><i class="fas fa-exclamation"></i></div>
        <div class="alert-content"><strong>${bin.id} is ${bin.fill}% full</strong><p>${bin.location}</p></div>
        <span class="alert-time">${bin.updated}</span>
      </div>`;
  });
  if (!criticalBins.length) da.innerHTML = '<p style="color:var(--muted);font-size:13px">No active alerts 🎉</p>';
}

// ===== BIN DETAILS MODAL =====
function openBinDetails(i) {
  currentBinIndex = i;
  const bin = bins[i], c = getBinColor(bin.fill);
  document.getElementById('detailBinId').textContent   = bin.id;
  document.getElementById('detailStatus').textContent  = getBinLabel(bin.fill);
  document.getElementById('detailStatus').className    = 'status-badge '+c;
  document.getElementById('detailFillBar').style.width = bin.fill+'%';
  document.getElementById('detailFillPct').textContent = bin.fill+'%';
  document.getElementById('detailLastUpdated').textContent = bin.updated;
  document.getElementById('detailLocation').textContent    = bin.location;
  document.getElementById('detailAlertBanner').style.display = bin.fill>=80?'flex':'none';
  document.getElementById('binDetailsModal').classList.remove('hidden');
}
document.getElementById('closeBinDetails').addEventListener('click', () =>
  document.getElementById('binDetailsModal').classList.add('hidden'));
document.getElementById('detailMarkCollected').addEventListener('click', () => {
  if (currentBinIndex>=0) {
    bins[currentBinIndex].fill    = 10;
    bins[currentBinIndex].updated = 'Just now';
    showToast(bins[currentBinIndex].id+' marked as collected!');
    document.getElementById('binDetailsModal').classList.add('hidden');
    renderDashboard(); renderBinsTable();
  }
});

// ===== BINS TABLE =====
function renderBinsTable(data) {
  const d = data || bins.filter(b => b.area === selectedArea);
  document.getElementById('binsTableBody').innerHTML = d.map((bin) => {
    const realIdx = bins.indexOf(bin);
    const c = getBinColor(bin.fill);
    return `<tr>
      <td><strong>${bin.id}</strong></td>
      <td><i class="fas fa-map-marker-alt" style="color:var(--green);margin-right:6px"></i>${bin.location}</td>
      <td>
        <span class="fill-bar"><span style="width:${bin.fill}%;height:6px;border-radius:3px;background:${c==='red'?'var(--red)':c==='yellow'?'var(--yellow)':'var(--green)'};display:block"></span></span>
        <strong style="color:${c==='red'?'var(--red)':c==='yellow'?'var(--yellow)':'var(--green)'}">${bin.fill}%</strong>
      </td>
      <td><span class="status-badge ${c}">${getBinLabel(bin.fill)}</span></td>
      <td style="color:var(--muted)">${bin.updated}</td>
      <td>
        <button class="icon-btn" style="margin-right:6px" onclick="openBinDetails(${realIdx})" title="View"><i class="fas fa-eye"></i></button>
        <button class="icon-btn" onclick="editBin(${realIdx})" title="Edit"><i class="fas fa-pen"></i></button>
      </td>
    </tr>`;
  }).join('');
}

document.getElementById('binSearch').addEventListener('input', function() {
  const v = this.value.toLowerCase();
  renderBinsTable(bins.filter(b=>b.area===selectedArea && (b.id.toLowerCase().includes(v)||b.location.toLowerCase().includes(v))));
});
document.getElementById('binStatusFilter').addEventListener('change', function() {
  const v = this.value;
  const ab = bins.filter(b=>b.area===selectedArea);
  if(v==='all') renderBinsTable(ab);
  else if(v==='critical') renderBinsTable(ab.filter(b=>b.fill>=80));
  else if(v==='high') renderBinsTable(ab.filter(b=>b.fill>=60&&b.fill<80));
  else if(v==='medium') renderBinsTable(ab.filter(b=>b.fill>=40&&b.fill<60));
  else renderBinsTable(ab.filter(b=>b.fill<40));
});

document.getElementById('openAddBinBtn').addEventListener('click', () => {
  document.getElementById('addBinTitle').textContent = 'Add New Bin';
  document.getElementById('addBinForm').reset();
  document.getElementById('addBinModal').classList.remove('hidden');
});
document.getElementById('closeAddBin').addEventListener('click', () =>
  document.getElementById('addBinModal').classList.add('hidden'));
document.getElementById('addBinForm').addEventListener('submit', e => {
  e.preventDefault();
  bins.push({
    id:document.getElementById('formBinId').value,
    location:document.getElementById('formBinLocation').value,
    fill:0, status:document.getElementById('formBinStatus').value, updated:'Just now'
  });
  document.getElementById('addBinModal').classList.add('hidden');
  renderBinsTable(); renderDashboard(); showToast('Bin added successfully!');
});

function editBin(i) {
  document.getElementById('addBinTitle').textContent = 'Edit Bin';
  document.getElementById('formBinId').value       = bins[i].id;
  document.getElementById('formBinLocation').value = bins[i].location;
  document.getElementById('formBinStatus').value   = bins[i].status;
  document.getElementById('addBinModal').classList.remove('hidden');
  currentBinIndex = i;
}

// ===== COLLECTIONS TABLE =====
function renderCollectionsTable(data) {
  document.getElementById('collectionsTableBody').innerHTML = data.map(item => {
    const sc = item.status==='Completed'?'green':item.status==='In Progress'?'yellow':'blue';
    return `<tr>
      <td><strong>${item.id}</strong></td>
      <td>${item.route}</td><td>${item.driver}</td>
      <td><span class="status-badge ${sc}">${item.status}</span></td>
      <td style="color:var(--muted)">${item.time}</td>
      <td><button class="icon-btn"><i class="fas fa-eye"></i></button></td>
    </tr>`;
  }).join('');
}
document.getElementById('collectionSearch').addEventListener('input', function() {
  const v = this.value.toLowerCase();
  renderCollectionsTable(collections.filter(c=>c.id.toLowerCase().includes(v)||c.driver.toLowerCase().includes(v)));
});
document.getElementById('collectionStatusFilter').addEventListener('change', function() {
  const v = this.value;
  if(v==='all') renderCollectionsTable(collections);
  else renderCollectionsTable(collections.filter(c=>c.status.toLowerCase().includes(v)));
});
document.getElementById('openNewCollectionBtn').addEventListener('click', () => {
  const num = String(collections.length+1).padStart(3,'0');
  collections.unshift({id:'COL-'+num,route:'Route 1',driver:'Driver 1',status:'Pending',time:'Just now'});
  renderCollectionsTable(collections); showToast('New collection created!');
});

// ===== ROUTES — now handled by Leaflet map (see initRouteMap / selectDriver / startRoute above) =====
// Init map when routes nav is clicked (handled in navItems listener below).
// Start button
document.getElementById('startRouteBtn').addEventListener('click', startRoute);

// ===== ALERTS =====
function renderAlerts(filter) {
  const container = document.getElementById('alertsList');
  let data = alertsData.filter(a => a.area === selectedArea);
  if (filter !== 'all') data = data.filter(a=>a.type===filter);
  if (!data.length) { container.innerHTML='<p style="color:var(--muted);padding:20px;text-align:center">No alerts found.</p>'; return; }
  container.innerHTML = data.map(a => {
    const c  = a.type==='critical'?'red':'yellow';
    const ic = a.type==='critical'?'fa-fire':'fa-exclamation-triangle';
    const msg = a.bin+' is '+a.fill+'% full';
    return `<div class="alert-item ${a.type==='warning'?'warning':''}">
      <div class="alert-dot ${c}"><i class="fas ${ic}"></i></div>
      <div class="alert-content"><strong>${msg}</strong><p>${a.loc}</p></div>
      <span class="alert-time">${a.time}</span>
    </div>`;
  }).join('');
}
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active-tab'));
    tab.classList.add('active-tab');
    renderAlerts(tab.dataset.filter);
  });
});

// ===== REPORTS CHART =====
let chartInstance = null;
function renderReportsChart() {
  if (chartInstance) chartInstance.destroy();
  const ctx = document.getElementById('collectionsChart').getContext('2d');
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['1 May','2 May','3 May','4 May','5 May','6 May','7 May'],
      datasets: [{
        label: 'Collections', data: [4,6,5,8,7,9,6],
        borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.08)',
        borderWidth: 2, pointBackgroundColor: '#22c55e', pointRadius: 5, tension: 0.4, fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid:{color:'rgba(255,255,255,0.05)'}, ticks:{color:'#64748b'} },
        y: { grid:{color:'rgba(255,255,255,0.05)'}, ticks:{color:'#64748b'}, beginAtZero:true }
      }
    }
  });
}
document.getElementById('exportReportBtn').addEventListener('click', () => showToast('Report exported!'));

// ===== SETTINGS TABS =====
document.querySelectorAll('.settings-nav').forEach(nav => {
  nav.addEventListener('click', () => {
    document.querySelectorAll('.settings-nav').forEach(n=>n.classList.remove('active-settings'));
    nav.classList.add('active-settings');
    const target = nav.dataset.settings;
    document.querySelectorAll('.settings-panel').forEach(p=>p.classList.remove('active-panel'));
    document.getElementById('settings-'+target).classList.add('active-panel');
  });
});
document.getElementById('saveSettingsBtn').addEventListener('click', () => showToast('Settings saved!'));

// Change admin password
document.getElementById('changePwBtn').addEventListener('click', async () => {
  const newPw = document.getElementById('newAdminPw').value.trim();
  if (!newPw || newPw.length < 6) { showToast('Password must be at least 6 characters', 'red'); return; }
  try {
    const res  = await fetch(`${BACKEND_URL}/admin/update_credentials`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({login_id: adminEmail, new_password: newPw})
    });
    const data = await res.json();
    showToast(data.success ? 'Password updated!' : (data.message||'Failed'), data.success?'green':'red');
    if (data.success) document.getElementById('newAdminPw').value = '';
  } catch(e) { showToast('Server error!','red'); }
});

// ===== CLOSE MODALS =====
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.add('hidden');
  });
});

// ===== DATETIME =====
setInterval(() => {
  document.getElementById('datetimeDisplay').textContent = formatDateTime();
}, 1000);

// ===== INIT =====
renderDashboard();
renderBinsTable();
renderCollectionsTable(collections);
renderAlerts('all');
loadLiveStats();
document.getElementById('datetimeDisplay').textContent = formatDateTime();

