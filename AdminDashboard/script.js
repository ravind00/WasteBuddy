// ===== DATA STORE =====
let bins = [
  {id:'Bin 1',location:'MG Road, Indore',fill:65,status:'Active',updated:'2 min ago'},
  {id:'Bin 2',location:'MG Road, Indore',fill:85,status:'Active',updated:'2 min ago'},
  {id:'Bin 3',location:'Palasia, Indore',fill:40,status:'Active',updated:'3 min ago'},
  {id:'Bin 4',location:'Vijay Nagar, Indore',fill:30,status:'Active',updated:'4 min ago'},
  {id:'Bin 5',location:'Palasia, Indore',fill:70,status:'Active',updated:'5 min ago'},
  {id:'Bin 6',location:'Bhawerkua, Indore',fill:55,status:'Active',updated:'6 min ago'},
];

let collections = [
  {id:'COL-001',route:'Route 1',driver:'Driver 1',status:'Completed',time:'Today, 09:33 AM'},
  {id:'COL-002',route:'Route 1',driver:'Driver 1',status:'Completed',time:'Today, 10:15 AM'},
  {id:'COL-003',route:'Route 3',driver:'Driver 1',status:'In Progress',time:'Today, 10:30 AM'},
  {id:'COL-004',route:'Route 1',driver:'Driver 0',status:'Completed',time:'Yesterday, 04:30 PM'},
  {id:'COL-005',route:'Route 2',driver:'Driver 2',status:'Completed',time:'Yesterday, 09:15 PM'},
];

let users = [
  {name:'Admin123',role:'Admin',phone:'9999999999',status:'Active'},
  {name:'Driver 1',role:'Driver',phone:'8888888888',status:'Active'},
  {name:'Driver 2',role:'Driver',phone:'7777777777',status:'Active'},
  {name:'Driver 3',role:'Driver',phone:'6666666666',status:'Inactive'},
  {name:'Worker 1',role:'Worker',phone:'5555555555',status:'Active'},
];

let routeData = {
  1:{bins:['Bin 2','Bin 9','Bin 7','Bin 9','Bin 11'],dist:'4.2 km',time:'28 min',fuel:'20%'},
  2:{bins:['Bin 1','Bin 3','Bin 5','Bin 8'],dist:'6.8 km',time:'35 min',fuel:'18%'},
  3:{bins:['Bin 4','Bin 6','Bin 10','Bin 12'],dist:'8.1 km',time:'42 min',fuel:'25%'},
};

let currentBinIndex = -1;

// ===== HELPERS =====
function getBinColor(fill){
  if(fill>=80) return 'red';
  if(fill>=60) return 'yellow';
  return 'green';
}
function getBinLabel(fill){
  if(fill>=80) return 'Full';
  if(fill>=60) return 'High';
  if(fill>=40) return 'Medium';
  return 'Low';
}
function showToast(msg, color='green'){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = color==='green'?'#22c55e':color==='red'?'#ef4444':'#f59e0b';
  t.classList.remove('hidden');
  setTimeout(()=>t.classList.add('hidden'),3000);
}
function formatDateTime(){
  const now = new Date();
  return now.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) +
    ' | ' + now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
}

// ===== NAVIGATION =====
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');

navItems.forEach(nav=>{
  nav.addEventListener('click',()=>{
    navItems.forEach(n=>n.classList.remove('active'));
    nav.classList.add('active');
    const target = nav.dataset.page;
    pages.forEach(p=>p.classList.remove('active-page'));
    document.getElementById(target).classList.add('active-page');
    if(target==='dashboard') renderDashboard();
    if(target==='bins') renderBinsTable();
    if(target==='collections') renderCollectionsTable(collections);
    if(target==='alerts') renderAlerts('all');
    if(target==='users') renderUsersTable(users);
    if(target==='reports') renderReportsChart();
    if(target==='routes') renderRoute(1);
  });
});

// view-all links
document.querySelectorAll('[data-page]').forEach(el=>{
  if(el.classList.contains('view-all-link')){
    el.addEventListener('click',e=>{
      e.preventDefault();
      navItems.forEach(n=>n.classList.remove('active'));
      document.getElementById('nav-'+el.dataset.page).classList.add('active');
      pages.forEach(p=>p.classList.remove('active-page'));
      document.getElementById(el.dataset.page).classList.add('active-page');
      renderAlerts('all');
    });
  }
});

// ===== LOGIN =====
document.getElementById('loginForm').addEventListener('submit',e=>{
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPassword').value;
  if(email && pass){
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('featureBar').classList.remove('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    renderDashboard();
    renderBinsTable();
    renderCollectionsTable(collections);
    renderAlerts('all');
    renderUsersTable(users);
    renderRoute(1);
    setInterval(()=>{
      document.getElementById('datetimeDisplay').textContent = formatDateTime();
    },1000);
    document.getElementById('datetimeDisplay').textContent = formatDateTime();
  } else {
    showToast('Please enter email and password','red');
  }
});

// ===== FORGOT PASSWORD =====
document.getElementById('openForgotPwd').addEventListener('click',e=>{
  e.preventDefault();
  document.getElementById('forgotModal').classList.remove('hidden');
});
document.getElementById('closeForgotModal').addEventListener('click',()=>{
  document.getElementById('forgotModal').classList.add('hidden');
});
document.getElementById('backToLogin').addEventListener('click',e=>{
  e.preventDefault();
  document.getElementById('forgotModal').classList.add('hidden');
});
document.getElementById('sendResetBtn').addEventListener('click',()=>{
  const email = document.getElementById('forgotEmail').value;
  if(email){ showToast('Reset link sent to '+email); document.getElementById('forgotModal').classList.add('hidden');}
  else showToast('Enter your email address','red');
});

// ===== LOGOUT =====
document.getElementById('logoutBtn').addEventListener('click',()=>{
  if(confirm('Are you sure you want to logout?')){
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('featureBar').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
  }
});

// ===== PROFILE =====
document.getElementById('openProfileBtn').addEventListener('click',()=>{
  document.getElementById('profileModal').classList.remove('hidden');
});
document.getElementById('closeProfile').addEventListener('click',()=>{
  document.getElementById('profileModal').classList.add('hidden');
});
document.getElementById('editProfileBtn').addEventListener('click',()=>{
  showToast('Profile editing coming soon!','yellow');
});

// ===== DASHBOARD =====
function renderDashboard(){
  // Stats
  const criticalBins = bins.filter(b=>b.fill>=60);
  document.getElementById('statTotalBins').textContent = bins.length;
  document.getElementById('statActiveAlerts').textContent = criticalBins.length;
  document.getElementById('statTotalCollections').textContent = collections.length;
  const avg = Math.round(bins.reduce((s,b)=>s+b.fill,0)/bins.length);
  document.getElementById('statAvgFill').textContent = avg+'%';
  document.getElementById('alertBadge').textContent = criticalBins.length;

  // Bin mini grid
  const grid = document.getElementById('dashboardBinGrid');
  grid.innerHTML = '';
  bins.forEach((bin,i)=>{
    const c = getBinColor(bin.fill);
    grid.innerHTML += `
      <div class="bin-mini-card" onclick="openBinDetails(${i})">
        <div class="bin-mini-id">${bin.id}</div>
        <div class="bin-mini-fill ${c}-t">${bin.fill}%</div>
        <div class="mini-bar"><div class="mini-bar-fill ${c}" style="width:${bin.fill}%"></div></div>
        <div class="bin-mini-status ${c}">${getBinLabel(bin.fill)}</div>
      </div>`;
  });

  // Recent alerts
  const da = document.getElementById('dashboardAlerts');
  da.innerHTML = '';
  criticalBins.slice(0,3).forEach(bin=>{
    const c = bin.fill>=80?'red':'yellow';
    da.innerHTML += `
      <div class="alert-item ${c==='yellow'?'warning':''}">
        <div class="alert-dot ${c}"><i class="fas fa-exclamation"></i></div>
        <div class="alert-content">
          <strong>${bin.id} is ${bin.fill}% full</strong>
          <p>${bin.location}</p>
        </div>
        <span class="alert-time">${bin.updated}</span>
      </div>`;
  });
  if(!criticalBins.length) da.innerHTML = '<p style="color:var(--muted);font-size:13px;">No active alerts 🎉</p>';
}

// ===== BIN DETAILS MODAL =====
function openBinDetails(i){
  currentBinIndex = i;
  const bin = bins[i];
  const c = getBinColor(bin.fill);
  document.getElementById('detailBinId').textContent = bin.id;
  document.getElementById('detailStatus').textContent = getBinLabel(bin.fill);
  document.getElementById('detailStatus').className = 'status-badge '+c;
  document.getElementById('detailFillBar').style.width = bin.fill+'%';
  document.getElementById('detailFillPct').textContent = bin.fill+'%';
  document.getElementById('detailFillPct').style.color = c==='red'?'var(--red)':c==='yellow'?'var(--yellow)':'var(--green)';
  document.getElementById('detailLastUpdated').textContent = bin.updated;
  document.getElementById('detailLocation').textContent = bin.location;
  const banner = document.getElementById('detailAlertBanner');
  banner.style.display = bin.fill>=80?'flex':'none';
  document.getElementById('binDetailsModal').classList.remove('hidden');
}
document.getElementById('closeBinDetails').addEventListener('click',()=>{
  document.getElementById('binDetailsModal').classList.add('hidden');
});
document.getElementById('detailMarkCollected').addEventListener('click',()=>{
  if(currentBinIndex>=0){
    bins[currentBinIndex].fill = 10;
    bins[currentBinIndex].updated = 'Just now';
    showToast(bins[currentBinIndex].id+' marked as collected!');
    document.getElementById('binDetailsModal').classList.add('hidden');
    renderDashboard();
    renderBinsTable();
  }
});

// ===== BINS TABLE =====
function renderBinsTable(data){
  const d = data || bins;
  const tbody = document.getElementById('binsTableBody');
  tbody.innerHTML = '';
  d.forEach((bin,i)=>{
    const c = getBinColor(bin.fill);
    tbody.innerHTML += `
      <tr>
        <td><strong>${bin.id}</strong></td>
        <td><i class="fas fa-map-marker-alt" style="color:var(--green);margin-right:6px;"></i>${bin.location}</td>
        <td>
          <span class="fill-bar"><span class="fill-bar-inner ${c}-bar" style="width:${bin.fill}%;height:6px;border-radius:3px;background:${c==='red'?'var(--red)':c==='yellow'?'var(--yellow)':'var(--green)'};display:block;"></span></span>
          <strong style="color:${c==='red'?'var(--red)':c==='yellow'?'var(--yellow)':'var(--green)'};">${bin.fill}%</strong>
        </td>
        <td><span class="status-badge ${c}">${getBinLabel(bin.fill)}</span></td>
        <td style="color:var(--muted);">${bin.updated}</td>
        <td>
          <button class="icon-btn" style="margin-right:6px;" onclick="openBinDetails(${i})" title="View"><i class="fas fa-eye"></i></button>
          <button class="icon-btn" onclick="editBin(${i})" title="Edit"><i class="fas fa-pen"></i></button>
        </td>
      </tr>`;
  });
}
document.getElementById('binSearch').addEventListener('input',function(){
  const v = this.value.toLowerCase();
  renderBinsTable(bins.filter(b=>b.id.toLowerCase().includes(v)||b.location.toLowerCase().includes(v)));
});
document.getElementById('binStatusFilter').addEventListener('change',function(){
  const v = this.value;
  if(v==='all') renderBinsTable();
  else if(v==='critical') renderBinsTable(bins.filter(b=>b.fill>=80));
  else if(v==='high') renderBinsTable(bins.filter(b=>b.fill>=60&&b.fill<80));
  else if(v==='medium') renderBinsTable(bins.filter(b=>b.fill>=40&&b.fill<60));
  else renderBinsTable(bins.filter(b=>b.fill<40));
});

// ===== ADD BIN MODAL =====
document.getElementById('openAddBinBtn').addEventListener('click',()=>{
  document.getElementById('addBinTitle').textContent = 'Add New Bin';
  document.getElementById('addBinForm').reset();
  document.getElementById('addBinModal').classList.remove('hidden');
});
document.getElementById('closeAddBin').addEventListener('click',()=>{
  document.getElementById('addBinModal').classList.add('hidden');
});
document.getElementById('addBinForm').addEventListener('submit',e=>{
  e.preventDefault();
  bins.push({
    id: document.getElementById('formBinId').value,
    location: document.getElementById('formBinLocation').value,
    fill: 0,
    status: document.getElementById('formBinStatus').value,
    updated: 'Just now'
  });
  document.getElementById('addBinModal').classList.add('hidden');
  renderBinsTable();
  renderDashboard();
  showToast('Bin added successfully!');
});

function editBin(i){
  document.getElementById('addBinTitle').textContent = 'Edit Bin';
  document.getElementById('formBinId').value = bins[i].id;
  document.getElementById('formBinLocation').value = bins[i].location;
  document.getElementById('formBinStatus').value = bins[i].status;
  document.getElementById('addBinModal').classList.remove('hidden');
  currentBinIndex = i;
}

// ===== COLLECTIONS TABLE =====
function renderCollectionsTable(data){
  const tbody = document.getElementById('collectionsTableBody');
  tbody.innerHTML = '';
  data.forEach(item=>{
    const sc = item.status==='Completed'?'green':item.status==='In Progress'?'yellow':'blue';
    tbody.innerHTML += `
      <tr>
        <td><strong>${item.id}</strong></td>
        <td>${item.route}</td>
        <td>${item.driver}</td>
        <td><span class="status-badge ${sc}">${item.status}</span></td>
        <td style="color:var(--muted);">${item.time}</td>
        <td><button class="icon-btn"><i class="fas fa-eye"></i></button></td>
      </tr>`;
  });
}
document.getElementById('collectionSearch').addEventListener('input',function(){
  const v = this.value.toLowerCase();
  renderCollectionsTable(collections.filter(c=>c.id.toLowerCase().includes(v)||c.driver.toLowerCase().includes(v)));
});
document.getElementById('collectionStatusFilter').addEventListener('change',function(){
  const v = this.value;
  if(v==='all') renderCollectionsTable(collections);
  else renderCollectionsTable(collections.filter(c=>c.status.toLowerCase().includes(v)));
});
document.getElementById('openNewCollectionBtn').addEventListener('click',()=>{
  const num = String(collections.length+1).padStart(3,'0');
  collections.unshift({id:'COL-'+num,route:'Route 1',driver:'Driver 1',status:'Pending',time:'Just now'});
  renderCollectionsTable(collections);
  showToast('New collection created!');
});

// ===== ROUTES =====
function renderRoute(driverNum){
  const data = routeData[driverNum];
  document.getElementById('routeDriverLabel').textContent = 'Driver '+driverNum;
  document.getElementById('routeDist').textContent = data.dist;
  document.getElementById('routeTime').textContent = data.time;
  document.getElementById('routeFuel').textContent = data.fuel;
  const seq = document.getElementById('routeSequence');
  seq.innerHTML = data.bins.map((b,i)=>
    `<span class="route-seq-item">${b}</span>${i<data.bins.length-1?'<span class="route-seq-arrow">→</span>':''}`
  ).join('');
}
document.getElementById('driverSelect').addEventListener('change',function(){
  renderRoute(parseInt(this.value));
});
document.getElementById('startRouteBtn').addEventListener('click',()=>{
  showToast('Route started for '+document.getElementById('routeDriverLabel').textContent+'!');
});

// ===== ALERTS =====
const alertsData = [
  {bin:'Bin 2',fill:85,loc:'MG Road, Indore',time:'3 min ago',type:'critical'},
  {bin:'Bin 5',fill:70,loc:'Palasia, Indore',time:'15 min ago',type:'warning'},
  {bin:'Bin 6',fill:80,loc:'Bhawerkua, Indore',time:'25 min ago',type:'critical'},
  {bin:'Bin 1',fill:65,loc:'MG Road, Indore',time:'33 min ago',type:'warning'},
  {bin:'COL-003',fill:0,loc:'Route 5',time:'35 min ago',type:'info',msg:'Collection COL-003 in progress'},
];
function renderAlerts(filter){
  const container = document.getElementById('alertsList');
  container.innerHTML = '';
  let data = filter==='all'?alertsData:alertsData.filter(a=>a.type===filter);
  if(!data.length){ container.innerHTML='<p style="color:var(--muted);padding:20px;text-align:center;">No alerts found.</p>'; return; }
  data.forEach(a=>{
    const c = a.type==='critical'?'red':a.type==='warning'?'yellow':'blue';
    const ic = a.type==='critical'?'fa-fire':a.type==='warning'?'fa-exclamation-triangle':'fa-info-circle';
    const msg = a.msg || (a.bin+' is '+a.fill+'% full');
    container.innerHTML += `
      <div class="alert-item ${a.type==='warning'?'warning':a.type==='info'?'info':''}">
        <div class="alert-dot ${c}"><i class="fas ${ic}"></i></div>
        <div class="alert-content">
          <strong>${msg}</strong>
          <p>${a.loc}</p>
        </div>
        <span class="alert-time">${a.time}</span>
      </div>`;
  });
}
document.querySelectorAll('.tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active-tab'));
    tab.classList.add('active-tab');
    renderAlerts(tab.dataset.filter);
  });
});

// ===== USERS TABLE =====
function renderUsersTable(data){
  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = '';
  data.forEach((u,i)=>{
    const sc = u.status==='Active'?'green':'red';
    tbody.innerHTML += `
      <tr>
        <td><strong>${u.name}</strong></td>
        <td>${u.role}</td>
        <td>${u.phone}</td>
        <td><span class="status-badge ${sc}">${u.status}</span></td>
        <td><button class="icon-btn" onclick="editUser(${i})"><i class="fas fa-pen"></i></button></td>
      </tr>`;
  });
}
document.getElementById('userSearch').addEventListener('input',function(){
  const v = this.value.toLowerCase();
  renderUsersTable(users.filter(u=>u.name.toLowerCase().includes(v)||u.role.toLowerCase().includes(v)));
});
document.getElementById('openAddUserBtn').addEventListener('click',()=>{
  document.getElementById('addUserTitle').textContent = 'Add New User';
  document.getElementById('addUserForm').reset();
  document.getElementById('addUserModal').classList.remove('hidden');
});
document.getElementById('closeAddUser').addEventListener('click',()=>{
  document.getElementById('addUserModal').classList.add('hidden');
});
document.getElementById('addUserForm').addEventListener('submit',e=>{
  e.preventDefault();
  users.push({
    name:   document.getElementById('formUserName').value,
    role:   document.getElementById('formUserRole').value,
    phone:  document.getElementById('formUserPhone').value,
    status: document.getElementById('formUserStatus').value
  });
  document.getElementById('addUserModal').classList.add('hidden');
  renderUsersTable(users);
  showToast('User added successfully!');
});
function editUser(i){
  document.getElementById('addUserTitle').textContent = 'Edit User';
  document.getElementById('formUserName').value = users[i].name;
  document.getElementById('formUserRole').value = users[i].role;
  document.getElementById('formUserPhone').value = users[i].phone;
  document.getElementById('formUserStatus').value = users[i].status;
  document.getElementById('addUserModal').classList.remove('hidden');
}

// ===== REPORTS CHART =====
let chartInstance = null;
function renderReportsChart(){
  if(chartInstance) chartInstance.destroy();
  const ctx = document.getElementById('collectionsChart').getContext('2d');
  chartInstance = new Chart(ctx,{
    type:'line',
    data:{
      labels:['1 May','2 May','3 May','4 May','5 May','6 May','7 May'],
      datasets:[{
        label:'Collections',
        data:[4,6,5,8,7,9,6],
        borderColor:'#22c55e',
        backgroundColor:'rgba(34,197,94,0.08)',
        borderWidth:2,
        pointBackgroundColor:'#22c55e',
        pointRadius:5,
        tension:0.4,
        fill:true,
      }]
    },
    options:{
      responsive:true,
      plugins:{legend:{display:false}},
      scales:{
        x:{grid:{color:'rgba(255,255,255,0.05)'},ticks:{color:'#64748b'}},
        y:{grid:{color:'rgba(255,255,255,0.05)'},ticks:{color:'#64748b'},beginAtZero:true}
      }
    }
  });
}
document.getElementById('exportReportBtn').addEventListener('click',()=>showToast('Report exported!'));

// ===== SETTINGS TABS =====
document.querySelectorAll('.settings-nav').forEach(nav=>{
  nav.addEventListener('click',()=>{
    document.querySelectorAll('.settings-nav').forEach(n=>n.classList.remove('active-settings'));
    nav.classList.add('active-settings');
    const target = nav.dataset.settings;
    document.querySelectorAll('.settings-panel').forEach(p=>p.classList.remove('active-panel'));
    document.getElementById('settings-'+target).classList.add('active-panel');
  });
});
document.getElementById('saveSettingsBtn').addEventListener('click',()=>showToast('Settings saved!'));

// ===== CLOSE MODALS ON OVERLAY CLICK =====
document.querySelectorAll('.modal-overlay').forEach(overlay=>{
  overlay.addEventListener('click',e=>{
    if(e.target===overlay) overlay.classList.add('hidden');
  });
});

// ===== INIT =====
renderBinsTable();
renderCollectionsTable(collections);