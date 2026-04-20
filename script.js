// script.js
// HOSPITALS DATA (with bed availability + promos)
const hospitalsData = [
  { id: 1, name: "City Central Hospital", location: "Downtown", beds: 42, totalBeds: 120, promo: "20% OFF on full body checkup + Free dental screening", availText: "High Availability" },
  { id: 2, name: "MedLife Super Specialty", location: "Westside", beds: 18, totalBeds: 85, promo: "Free teleconsultation with admission & 15% off maternity", availText: "Moderate" },
  { id: 3, name: "St. Claire's Memorial", location: "Northridge", beds: 8, totalBeds: 60, promo: "Buy 1 Health Package, Get 1 Dental Checkup Free", availText: "Limited beds" },
  { id: 4, name: "Grace Medical Center", location: "Eastbrook", beds: 55, totalBeds: 140, promo: "Weekend discounts 30% on OPD + free medicine delivery", availText: "Excellent" },
  { id: 5, name: "Hope Children's & Women's", location: "South Park", beds: 12, totalBeds: 50, promo: "Zero registration fee & 25% off on pediatric care", availText: "Few left" },
  { id: 6, name: "Greenlife Heart Institute", location: "Riverside", beds: 27, totalBeds: 95, promo: "Cardiac package: 15% off + free ECG & consultation", availText: "Good" }
];

// Helper: bed percentage & color
function getBedStatus(beds, total) {
  const percent = (beds / total) * 100;
  if (percent > 40) return { text: `✅ ${beds} beds available`, class: "bed-available" };
  if (percent > 15) return { text: `⚠️ ${beds} beds left`, class: "bed-low" };
  return { text: `🔴 Only ${beds} beds left`, class: "bed-low" };
}

// Auth & state
let currentUser = null;  // { username, favorites: [] }

// Load from localStorage
function loadSession() {
  const savedUser = localStorage.getItem("carematch_user");
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    updateAuthUI();
  } else {
    currentUser = null;
    updateAuthUI();
  }
}

function saveSession() {
  if (currentUser) localStorage.setItem("carematch_user", JSON.stringify(currentUser));
  else localStorage.removeItem("carematch_user");
}

function registerUser(username, password) {
  if (username.length < 2 || password.length < 2) return false;
  const users = JSON.parse(localStorage.getItem("carematch_users") || "{}");
  if (users[username]) return false; // exists
  users[username] = { password, favorites: [] };
  localStorage.setItem("carematch_users", JSON.stringify(users));
  currentUser = { username, favorites: [] };
  saveSession();
  return true;
}

function loginUser(username, password) {
  const users = JSON.parse(localStorage.getItem("carematch_users") || "{}");
  if (users[username] && users[username].password === password) {
    currentUser = { username, favorites: users[username].favorites || [] };
    saveSession();
    return true;
  }
  // auto-register demo ease: if not exist, create new account
  if (!users[username]) {
    users[username] = { password, favorites: [] };
    localStorage.setItem("carematch_users", JSON.stringify(users));
    currentUser = { username, favorites: [] };
    saveSession();
    return true;
  }
  return false;
}

function logout() {
  currentUser = null;
  saveSession();
  updateAuthUI();
  closeDashboard();
  renderHospitals();
  renderFavorites();
  toggleFavoriteSection();
}

function addFavorite(hospitalId) {
  if (!currentUser) return false;
  if (!currentUser.favorites.includes(hospitalId)) {
    currentUser.favorites.push(hospitalId);
    saveSession();
    // also update stored user in master users object
    const users = JSON.parse(localStorage.getItem("carematch_users") || "{}");
    if (users[currentUser.username]) users[currentUser.username].favorites = currentUser.favorites;
    localStorage.setItem("carematch_users", JSON.stringify(users));
    renderHospitals();
    renderFavorites();
    updateDashboardFavCount();
    toggleFavoriteSection();
    return true;
  }
  return false;
}

function removeFavorite(hospitalId) {
  if (!currentUser) return;
  currentUser.favorites = currentUser.favorites.filter(id => id !== hospitalId);
  saveSession();
  const users = JSON.parse(localStorage.getItem("carematch_users") || "{}");
  if (users[currentUser.username]) users[currentUser.username].favorites = currentUser.favorites;
  localStorage.setItem("carematch_users", JSON.stringify(users));
  renderHospitals();
  renderFavorites();
  updateDashboardFavCount();
  toggleFavoriteSection();
}

function isFavorite(hospitalId) {
  return currentUser && currentUser.favorites.includes(hospitalId);
}

// Render all hospitals with PROMO HIGHLIGHT (badge + icon)
function renderHospitals() {
  const grid = document.getElementById("hospitalGrid");
  if (!grid) return;
  grid.innerHTML = hospitalsData.map(hospital => {
    const bedInfo = getBedStatus(hospital.beds, hospital.totalBeds);
    const favActive = isFavorite(hospital.id);
    return `
      <div class="hospital-card">
        <div class="hospital-name">
          ${hospital.name}
          <i class="fas fa-heart fav-icon ${favActive ? 'active' : ''}" data-id="${hospital.id}"></i>
        </div>
        <div class="location"><i class="fas fa-map-marker-alt"></i> ${hospital.location}</div>
        <div class="bed-status">
          <span class="${bedInfo.class}"><i class="fas fa-bed"></i> ${bedInfo.text}</span>
          <small style="font-size:11px; opacity:0.7;">(indicative)</small>
        </div>
        <div class="promo-tag">
          <span class="promo-badge-label"><i class="fas fa-gift"></i> HOT OFFER</span>
          <span class="promo-text-highlight">✨ ${hospital.promo}</span>
        </div>
        <small>Total beds: ${hospital.totalBeds} | Available: ${hospital.beds}</small>
      </div>
    `;
  }).join("");
  // attach favorite listeners
  document.querySelectorAll('.fav-icon').forEach(icon => {
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      const hospId = parseInt(icon.dataset.id);
      if (!currentUser) {
        openAuthModal();
        alert("Please login/register to save favorite hospitals!");
        return;
      }
      if (isFavorite(hospId)) removeFavorite(hospId);
      else addFavorite(hospId);
    });
  });
}

function renderFavorites() {
  const favGrid = document.getElementById("favGrid");
  const section = document.getElementById("favoriteSection");
  if (!favGrid) return;
  if (!currentUser || currentUser.favorites.length === 0) {
    if (section) section.style.display = "none";
    return;
  }
  const favHospitals = hospitalsData.filter(h => currentUser.favorites.includes(h.id));
  if (favHospitals.length === 0) {
    if (section) section.style.display = "none";
    return;
  }
  if (section) section.style.display = "block";
  favGrid.innerHTML = favHospitals.map(hospital => {
    const bedInfo = getBedStatus(hospital.beds, hospital.totalBeds);
    return `
      <div class="hospital-card fav-card">
        <div class="hospital-name">${hospital.name}</div>
        <div class="location"><i class="fas fa-map-marker-alt"></i> ${hospital.location}</div>
        <div class="bed-status"><span class="${bedInfo.class}">${bedInfo.text}</span></div>
        <div class="promo-tag">
          <span class="promo-badge-label"><i class="fas fa-fire"></i> PROMO</span>
          <span>🎯 ${hospital.promo}</span>
        </div>
        <button class="remove-fav-btn" data-id="${hospital.id}" style="margin-top:12px; background:#fee2e2; border:none; padding:6px 12px; border-radius:40px; cursor:pointer;">Remove from favorites</button>
      </div>
    `;
  }).join("");
  document.querySelectorAll('.remove-fav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(btn.dataset.id);
      removeFavorite(id);
    });
  });
}

function updateAuthUI() {
  const authBtn = document.getElementById("authNavBtn");
  const accountBtn = document.getElementById("accountDashboardBtn");
  if (currentUser) {
    if (authBtn) authBtn.style.display = "none";
    if (accountBtn) {
      accountBtn.style.display = "inline-block";
      accountBtn.innerText = `👤 ${currentUser.username}`;
    }
    // update dashboard if open
    const dashUsername = document.getElementById("dashboardUsername");
    if (dashUsername) dashUsername.innerText = currentUser.username;
    updateDashboardFavCount();
  } else {
    if (authBtn) authBtn.style.display = "inline-block";
    if (accountBtn) accountBtn.style.display = "none";
  }
  toggleFavoriteSection();
}

function updateDashboardFavCount() {
  const countSpan = document.getElementById("favCountDashboard");
  if (countSpan && currentUser) countSpan.innerText = currentUser.favorites.length;
  else if (countSpan) countSpan.innerText = "0";
}

function toggleFavoriteSection() {
  const favSec = document.getElementById("favoriteSection");
  if (favSec && currentUser && currentUser.favorites.length > 0) favSec.style.display = "block";
  else if (favSec) favSec.style.display = "none";
}

// MODAL handling
const modal = document.getElementById("authModal");
function openAuthModal() { if (modal) modal.style.display = "flex"; }
function closeAuthModal() { if (modal) modal.style.display = "none"; }

function openDashboard() {
  const panel = document.getElementById("dashboardPanel");
  if (!panel) return;
  if (!currentUser) { openAuthModal(); return; }
  panel.style.display = "block";
  updateDashboardFavCount();
}
function closeDashboard() {
  const panel = document.getElementById("dashboardPanel");
  if (panel) panel.style.display = "none";
}

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  loadSession();
  renderHospitals();
  renderFavorites();

  // Auth modal triggers
  const authNav = document.getElementById("authNavBtn");
  if (authNav) authNav.addEventListener("click", (e) => { e.preventDefault(); openAuthModal(); });
  const accountDashBtn = document.getElementById("accountDashboardBtn");
  if (accountDashBtn) accountDashBtn.addEventListener("click", (e) => { e.preventDefault(); openDashboard(); });
  document.getElementById("closeDashboardBtn")?.addEventListener("click", closeDashboard);
  document.getElementById("logoutDashboardBtn")?.addEventListener("click", () => { logout(); closeDashboard(); });

  document.querySelector(".close-modal")?.addEventListener("click", closeAuthModal);
  window.addEventListener("click", (e) => { if (e.target === modal) closeAuthModal(); });

  // Tabs login/register
  const loginTab = document.getElementById("loginTabBtn");
  const regTab = document.getElementById("registerTabBtn");
  const loginForm = document.getElementById("loginForm");
  const regForm = document.getElementById("registerForm");
  loginTab?.addEventListener("click", () => {
    loginTab.classList.add("active"); regTab.classList.remove("active");
    loginForm.style.display = "block"; regForm.style.display = "none";
  });
  regTab?.addEventListener("click", () => {
    regTab.classList.add("active"); loginTab.classList.remove("active");
    loginForm.style.display = "none"; regForm.style.display = "block";
  });

  document.getElementById("loginForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const user = document.getElementById("loginUsername").value.trim();
    const pwd = document.getElementById("loginPassword").value.trim();
    if (loginUser(user, pwd)) {
      closeAuthModal();
      renderHospitals();
      renderFavorites();
      updateAuthUI();
    } else alert("Login failed");
  });
  document.getElementById("registerForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const user = document.getElementById("regUsername").value.trim();
    const pwd = document.getElementById("regPassword").value.trim();
    if (registerUser(user, pwd)) {
      closeAuthModal();
      renderHospitals();
      renderFavorites();
      updateAuthUI();
    } else alert("Username already exists or invalid");
  });
  document.getElementById("scrollToHospitals")?.addEventListener("click", () => {
    document.querySelector(".hospital-grid")?.scrollIntoView({ behavior: "smooth" });
  });
  
  // Updated About/Contact alerts to clarify no bookings
  document.getElementById("navAbout")?.addEventListener("click", (e) => { 
    e.preventDefault(); 
    alert("CareMatch is an informational platform to help you discover hospital promotions and bed availability. No direct bookings — please contact hospitals directly for appointments."); 
  });
  document.getElementById("navContact")?.addEventListener("click", (e) => { 
    e.preventDefault(); 
    alert("📞 +1 (555) 789-2345 | care@carematch.com\n\nThis is not a booking service. For emergencies, please call your local emergency number."); 
  });
});