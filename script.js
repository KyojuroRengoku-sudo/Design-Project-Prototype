// script.js - carousel auto-slide every 3 seconds, no featured deal logic
const hospitalsData = [
  { id: 1, name: "City Central Hospital", location: "Downtown", beds: 42, totalBeds: 120, promo: "20% OFF full body checkup + Free dental screening", originalPrice: "$199", salePrice: "$159", image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&h=400&fit=crop", scarcity: 85, featured: true, promoType: "discount" },
  { id: 2, name: "MedLife Super Specialty", location: "Westside", beds: 18, totalBeds: 85, promo: "Free teleconsultation + 15% off maternity", originalPrice: "$299", salePrice: "$254", image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=400&fit=crop", scarcity: 65, featured: false, promoType: "discount" },
  { id: 3, name: "St. Claire's Memorial", location: "Northridge", beds: 8, totalBeds: 60, promo: "Buy 1 Health Package, Get 1 Dental Checkup Free", originalPrice: "$149", salePrice: "$149 (BOGO)", image: "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600&h=400&fit=crop", scarcity: 30, featured: false, promoType: "bogo" },
  { id: 4, name: "Grace Medical Center", location: "Eastbrook", beds: 55, totalBeds: 140, promo: "Weekend discounts 30% on OPD", originalPrice: "$120", salePrice: "$84", image: "https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=600&h=400&fit=crop", scarcity: 92, featured: false, promoType: "discount" },
  { id: 5, name: "Hope Children's & Women's", location: "South Park", beds: 12, totalBeds: 50, promo: "Zero registration fee & 25% off pediatric care", originalPrice: "$99", salePrice: "$74", image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&h=400&fit=crop", scarcity: 45, featured: false, promoType: "free" },
  { id: 6, name: "Greenlife Heart Institute", location: "Riverside", beds: 27, totalBeds: 95, promo: "Cardiac package: 15% off + free ECG", originalPrice: "$350", salePrice: "$297", image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop", scarcity: 55, featured: false, promoType: "discount" }
];

function getBedStatus(beds, total) {
  const percent = (beds / total) * 100;
  if (percent > 40) return { text: `✅ ${beds} beds available`, class: "bed-available" };
  if (percent > 15) return { text: `⚠️ ${beds} beds left`, class: "bed-low" };
  return { text: `🔴 Only ${beds} beds left`, class: "bed-low" };
}

let currentUser = null;
let currentFilter = "all";
let currentSearch = "";

// Auth functions
function loadSession() { const saved = localStorage.getItem("carematch_user"); currentUser = saved ? JSON.parse(saved) : null; updateAuthUI(); }
function saveSession() { if (currentUser) localStorage.setItem("carematch_user", JSON.stringify(currentUser)); else localStorage.removeItem("carematch_user"); }
function registerUser(u, p) { if (u.length < 2 || p.length < 2) return false; const users = JSON.parse(localStorage.getItem("carematch_users") || "{}"); if (users[u]) return false; users[u] = { password: p, favorites: [] }; localStorage.setItem("carematch_users", JSON.stringify(users)); currentUser = { username: u, favorites: [] }; saveSession(); return true; }
function loginUser(u, p) { const users = JSON.parse(localStorage.getItem("carematch_users") || "{}"); if (users[u] && users[u].password === p) { currentUser = { username: u, favorites: users[u].favorites || [] }; saveSession(); return true; } if (!users[u]) { users[u] = { password: p, favorites: [] }; localStorage.setItem("carematch_users", JSON.stringify(users)); currentUser = { username: u, favorites: [] }; saveSession(); return true; } return false; }
function logout() { currentUser = null; saveSession(); updateAuthUI(); closeDashboard(); applyFilterAndSearch(); renderFavorites(); toggleFavoriteSection(); }
function addFavorite(id) { if (!currentUser) return false; if (!currentUser.favorites.includes(id)) { currentUser.favorites.push(id); saveSession(); const users = JSON.parse(localStorage.getItem("carematch_users") || "{}"); if (users[currentUser.username]) users[currentUser.username].favorites = currentUser.favorites; localStorage.setItem("carematch_users", JSON.stringify(users)); applyFilterAndSearch(); renderFavorites(); updateDashboardFavCount(); toggleFavoriteSection(); } }
function removeFavorite(id) { if (!currentUser) return; currentUser.favorites = currentUser.favorites.filter(fid => fid !== id); saveSession(); const users = JSON.parse(localStorage.getItem("carematch_users") || "{}"); if (users[currentUser.username]) users[currentUser.username].favorites = currentUser.favorites; localStorage.setItem("carematch_users", JSON.stringify(users)); applyFilterAndSearch(); renderFavorites(); updateDashboardFavCount(); toggleFavoriteSection(); }
function isFavorite(id) { return currentUser && currentUser.favorites.includes(id); }

function filterHospitals() {
  return hospitalsData.filter(h => {
    const matchesSearch = currentSearch === "" || h.name.toLowerCase().includes(currentSearch) || h.location.toLowerCase().includes(currentSearch);
    let matchesPromo = true;
    if (currentFilter === "discount") matchesPromo = h.promo.toLowerCase().includes("off") || h.promo.toLowerCase().includes("%");
    else if (currentFilter === "free") matchesPromo = h.promo.toLowerCase().includes("free");
    else if (currentFilter === "bogo") matchesPromo = h.promo.toLowerCase().includes("buy 1") || h.promo.toLowerCase().includes("bogo");
    return matchesSearch && matchesPromo;
  });
}

function applyFilterAndSearch() {
  const filtered = filterHospitals();
  renderHospitals(filtered);
}

function renderHospitals(hospitalsArray = null) {
  const grid = document.getElementById("hospitalGrid");
  if (!grid) return;
  const data = hospitalsArray || hospitalsData;
  if (data.length === 0) { grid.innerHTML = `<div class="no-results">No hospitals match your criteria.</div>`; return; }
  grid.innerHTML = data.map(h => {
    const bed = getBedStatus(h.beds, h.totalBeds);
    const favActive = isFavorite(h.id);
    let priceHtml = '';
    if (h.originalPrice && h.salePrice && h.salePrice !== h.originalPrice) {
      priceHtml = `<div class="price-cross">${h.originalPrice}</div> <span class="sale-price">${h.salePrice}</span>`;
    }
    return `
      <div class="hospital-card">
        <img src="${h.image}" alt="${h.name}" class="card-img" loading="lazy">
        <div class="card-content">
          <div class="hospital-name">
            ${h.name} ${h.featured ? '<span style="background:#f97316; color:white; font-size:12px; padding:2px 10px; border-radius:20px;">⭐ FEATURED</span>' : ''}
            <i class="fas fa-heart fav-icon ${favActive ? 'active' : ''}" data-id="${h.id}"></i>
          </div>
          <div class="location"><i class="fas fa-map-marker-alt"></i> ${h.location}</div>
          <div class="bed-status"><span class="${bed.class}"><i class="fas fa-bed"></i> ${bed.text}</span> <small>(indicative)</small></div>
          <div class="promo-tag">
            <span class="promo-badge-label"><i class="fas fa-gift"></i> OFFER</span>
            <span>✨ ${h.promo}</span>
            ${priceHtml ? `<div style="margin-left: auto;">${priceHtml}</div>` : ''}
          </div>
          <div class="small-progress"><div class="small-progress-fill" style="width: ${h.scarcity}%;"></div></div>
          <div class="call-note"><i class="fas fa-phone-alt"></i> No online booking – call hospital to confirm</div>
        </div>
      </div>
    `;
  }).join("");
  attachFavoriteListeners();
  attachPromoClaimListeners();
}

function attachFavoriteListeners() { document.querySelectorAll('.fav-icon').forEach(icon => { icon.removeEventListener('click', favClickHandler); icon.addEventListener('click', favClickHandler); }); }
function favClickHandler(e) { e.stopPropagation(); const id = parseInt(e.currentTarget.dataset.id); if (!currentUser) { openAuthModal(); alert("Login to save favorites"); return; } if (isFavorite(id)) removeFavorite(id); else addFavorite(id); }
function attachPromoClaimListeners() { document.querySelectorAll('[data-offer]').forEach(el => { el.removeEventListener('click', promoClaimHandler); el.addEventListener('click', promoClaimHandler); }); }
function promoClaimHandler(e) { e.stopPropagation(); const offer = e.currentTarget.getAttribute('data-offer'); alert(`📞 To claim "${offer}", please call the hospital directly. This is an informational platform – no online bookings.`); }

function renderFavorites() {
  const favGrid = document.getElementById("favGrid");
  const section = document.getElementById("favoriteSection");
  if (!favGrid) return;
  if (!currentUser || currentUser.favorites.length === 0) { if (section) section.style.display = "none"; return; }
  const favHospitals = hospitalsData.filter(h => currentUser.favorites.includes(h.id));
  if (favHospitals.length === 0) { if (section) section.style.display = "none"; return; }
  if (section) section.style.display = "block";
  favGrid.innerHTML = favHospitals.map(h => {
    const bed = getBedStatus(h.beds, h.totalBeds);
    return `
      <div class="hospital-card fav-card">
        <img src="${h.image}" alt="${h.name}" class="card-img" loading="lazy">
        <div class="card-content">
          <div class="hospital-name">${h.name}</div>
          <div class="location"><i class="fas fa-map-marker-alt"></i> ${h.location}</div>
          <div class="bed-status"><span class="${bed.class}">${bed.text}</span></div>
          <div class="promo-tag"><span class="promo-badge-label">PROMO</span> 🎯 ${h.promo}</div>
          <button class="remove-fav-btn" data-id="${h.id}" style="margin-top:12px; background:#fee2e2; border:none; padding:6px 12px; border-radius:40px; cursor:pointer;">Remove</button>
        </div>
      </div>
    `;
  }).join("");
  document.querySelectorAll('.remove-fav-btn').forEach(btn => { btn.removeEventListener('click', removeFavHandler); btn.addEventListener('click', removeFavHandler); });
}
function removeFavHandler(e) { const id = parseInt(e.currentTarget.dataset.id); removeFavorite(id); }

function updateAuthUI() {
  const authBtn = document.getElementById("authNavBtn");
  const accBtn = document.getElementById("accountDashboardBtn");
  if (currentUser) {
    if (authBtn) authBtn.style.display = "none";
    if (accBtn) { accBtn.style.display = "inline-block"; accBtn.innerText = `👤 ${currentUser.username}`; }
    document.getElementById("dashboardUsername").innerText = currentUser.username;
    updateDashboardFavCount();
  } else { if (authBtn) authBtn.style.display = "inline-block"; if (accBtn) accBtn.style.display = "none"; }
  toggleFavoriteSection();
}
function updateDashboardFavCount() { const span = document.getElementById("favCountDashboard"); if (span && currentUser) span.innerText = currentUser.favorites.length; else if (span) span.innerText = "0"; }
function toggleFavoriteSection() { const sec = document.getElementById("favoriteSection"); if (sec && currentUser && currentUser.favorites.length > 0) sec.style.display = "block"; else if (sec) sec.style.display = "none"; }

function renderAllPromos() {
  const promosGrid = document.getElementById("promosGrid");
  if (!promosGrid) return;
  promosGrid.innerHTML = hospitalsData.map(h => `
    <div class="promo-card">
      <div class="promo-icon"><i class="fas fa-tag"></i></div>
      <h4>${h.name}</h4>
      <p>${h.promo}</p>
      <button class="claim-promo-card" data-offer="${h.promo.replace(/"/g, '&quot;')}">Claim Offer →</button>
    </div>
  `).join("");
  document.querySelectorAll('.claim-promo-card').forEach(btn => { btn.removeEventListener('click', promoCardHandler); btn.addEventListener('click', promoCardHandler); });
}
function promoCardHandler(e) { const offer = e.currentTarget.getAttribute('data-offer'); alert(`📞 To claim "${offer}", please call the hospital directly. No online booking.`); }

// ========== CAROUSEL LOGIC (3 seconds interval) ==========
let currentIndex = 0;
let carouselInterval;
const track = document.getElementById('carouselTrack');
const slides = document.querySelectorAll('.carousel-slide');
const dotsContainer = document.getElementById('carouselDots');
let slideCount = slides.length;

function updateCarousel() {
  if (!track) return;
  track.style.transform = `translateX(-${currentIndex * 100}%)`;
  document.querySelectorAll('.dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === currentIndex);
  });
}

function nextSlide() { if (slideCount > 0) currentIndex = (currentIndex + 1) % slideCount; updateCarousel(); }
function prevSlide() { if (slideCount > 0) currentIndex = (currentIndex - 1 + slideCount) % slideCount; updateCarousel(); }

function startCarouselAuto() {
  if (carouselInterval) clearInterval(carouselInterval);
  carouselInterval = setInterval(nextSlide, 3000); // 3 seconds
}
function stopCarouselAuto() { if (carouselInterval) clearInterval(carouselInterval); }

function initCarousel() {
  if (!track || slides.length === 0) return;
  slideCount = slides.length;
  dotsContainer.innerHTML = '';
  for (let i = 0; i < slideCount; i++) {
    const dot = document.createElement('div');
    dot.classList.add('dot');
    if (i === currentIndex) dot.classList.add('active');
    dot.addEventListener('click', () => { currentIndex = i; updateCarousel(); stopCarouselAuto(); startCarouselAuto(); });
    dotsContainer.appendChild(dot);
  }
  updateCarousel();
  startCarouselAuto();
  const container = document.querySelector('.carousel-container');
  if (container) {
    container.addEventListener('mouseenter', stopCarouselAuto);
    container.addEventListener('mouseleave', startCarouselAuto);
  }
  const prevBtn = document.querySelector('.carousel-prev');
  const nextBtn = document.querySelector('.carousel-next');
  if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); stopCarouselAuto(); startCarouselAuto(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); stopCarouselAuto(); startCarouselAuto(); });
  slides.forEach(slide => {
    const offer = slide.getAttribute('data-offer');
    if (offer) {
      slide.style.cursor = 'pointer';
      slide.addEventListener('click', () => promoClaimHandler({ currentTarget: { getAttribute: () => offer }, stopPropagation: () => {} }));
    }
  });
}

// Mid-scroll insert
let midScrollObserver = null;
function checkMidScrollInsert() {
  const grid = document.getElementById("hospitalGrid");
  const insertDiv = document.getElementById("midScrollPromo");
  if (!grid || !insertDiv || insertDiv.style.display === 'block') return;
  if (midScrollObserver) midScrollObserver.disconnect();
  midScrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting && insertDiv.style.display !== 'block') { insertDiv.style.display = 'block'; midScrollObserver.disconnect(); } });
  }, { threshold: 0.3 });
  const thirdCard = grid.children[2];
  if (thirdCard) midScrollObserver.observe(thirdCard);
}

// Countdown
function startCountdown() {
  const target = new Date(2026, 3, 30, 23, 59, 59).getTime();
  setInterval(() => {
    const now = new Date().getTime();
    const diff = target - now;
    if (diff <= 0) {
      document.getElementById("days").innerText = "00"; document.getElementById("hours").innerText = "00";
      document.getElementById("minutes").innerText = "00"; document.getElementById("seconds").innerText = "00";
      if(document.getElementById("bannerCountdown")) document.getElementById("bannerCountdown").innerText = "00:00:00";
      return;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    document.getElementById("days").innerText = days.toString().padStart(2,'0');
    document.getElementById("hours").innerText = hours.toString().padStart(2,'0');
    document.getElementById("minutes").innerText = minutes.toString().padStart(2,'0');
    document.getElementById("seconds").innerText = seconds.toString().padStart(2,'0');
    const bannerTimer = document.getElementById("bannerCountdown");
    if (bannerTimer) bannerTimer.innerText = `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
  }, 1000);
}

// Back to top
function initBackToTop() {
  const btn = document.getElementById("backToTop");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) btn.classList.add("show");
    else btn.classList.remove("show");
  });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

// Hamburger
function initHamburger() {
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("navLinks");
  hamburger.addEventListener("click", () => navLinks.classList.toggle("active"));
  document.addEventListener("click", (e) => {
    if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) navLinks.classList.remove("active");
  });
}

// Modal handlers
const modal = document.getElementById("authModal");
function openAuthModal() { if (modal) modal.style.display = "flex"; }
function closeAuthModal() { if (modal) modal.style.display = "none"; }
function openDashboard() { const panel = document.getElementById("dashboardPanel"); if (!currentUser) { openAuthModal(); return; } if (panel) panel.style.display = "block"; updateDashboardFavCount(); }
function closeDashboard() { const panel = document.getElementById("dashboardPanel"); if (panel) panel.style.display = "none"; }
function closeStickyBanner() { const banner = document.getElementById("stickyBanner"); if (banner) { banner.style.display = "none"; const navbar = document.querySelector(".navbar"); if (navbar) navbar.style.top = "0"; } }

document.addEventListener("DOMContentLoaded", () => {
  loadSession();
  setTimeout(() => {
    applyFilterAndSearch();
    renderFavorites();
    renderAllPromos();
    checkMidScrollInsert();
  }, 100);
  startCountdown();
  initCarousel();
  initBackToTop();
  initHamburger();
  
  document.getElementById("closeBanner")?.addEventListener("click", closeStickyBanner);
  const navPromos = document.getElementById("navPromos");
  const allPromosSec = document.getElementById("allPromosSection");
  if (navPromos && allPromosSec) {
    navPromos.addEventListener("click", (e) => { e.preventDefault(); if (allPromosSec.style.display === "none" || !allPromosSec.style.display) { allPromosSec.style.display = "block"; allPromosSec.scrollIntoView({ behavior: "smooth" }); } else { allPromosSec.style.display = "none"; } });
  }
  document.getElementById("authNavBtn")?.addEventListener("click", (e) => { e.preventDefault(); openAuthModal(); });
  document.getElementById("accountDashboardBtn")?.addEventListener("click", (e) => { e.preventDefault(); openDashboard(); });
  document.getElementById("closeDashboardBtn")?.addEventListener("click", closeDashboard);
  document.getElementById("logoutDashboardBtn")?.addEventListener("click", () => { logout(); closeDashboard(); });
  document.querySelector(".close-modal")?.addEventListener("click", closeAuthModal);
  window.addEventListener("click", (e) => { if (e.target === modal) closeAuthModal(); });
  
  const loginTab = document.getElementById("loginTabBtn");
  const regTab = document.getElementById("registerTabBtn");
  const loginForm = document.getElementById("loginForm");
  const regForm = document.getElementById("registerForm");
  if (loginTab && regTab) {
    loginTab.addEventListener("click", () => { loginTab.classList.add("active"); regTab.classList.remove("active"); loginForm.style.display = "block"; regForm.style.display = "none"; });
    regTab.addEventListener("click", () => { regTab.classList.add("active"); loginTab.classList.remove("active"); loginForm.style.display = "none"; regForm.style.display = "block"; });
  }
  document.getElementById("loginForm")?.addEventListener("submit", (e) => { e.preventDefault(); const u = document.getElementById("loginUsername").value.trim(); const p = document.getElementById("loginPassword").value.trim(); if (loginUser(u, p)) { closeAuthModal(); applyFilterAndSearch(); renderFavorites(); updateAuthUI(); } else alert("Login failed"); });
  document.getElementById("registerForm")?.addEventListener("submit", (e) => { e.preventDefault(); const u = document.getElementById("regUsername").value.trim(); const p = document.getElementById("regPassword").value.trim(); if (registerUser(u, p)) { closeAuthModal(); applyFilterAndSearch(); renderFavorites(); updateAuthUI(); } else alert("Username exists or invalid"); });
  document.getElementById("scrollToHospitals")?.addEventListener("click", () => { document.querySelector(".hospital-grid")?.scrollIntoView({ behavior: "smooth" }); });
  document.getElementById("navAbout")?.addEventListener("click", (e) => { e.preventDefault(); alert("CareMatch helps you discover hospital promotions and bed availability. No online bookings – call hospitals directly."); });
  document.getElementById("navContact")?.addEventListener("click", (e) => { e.preventDefault(); alert("📞 +1 (555) 789-2344 | promos@carematch.com\nInformational only – no bookings."); });
  
  const searchInput = document.getElementById("searchInput");
  const filterSelect = document.getElementById("filterPromo");
  if (searchInput) searchInput.addEventListener("input", (e) => { currentSearch = e.target.value.toLowerCase(); applyFilterAndSearch(); });
  if (filterSelect) filterSelect.addEventListener("change", (e) => { currentFilter = e.target.value; applyFilterAndSearch(); });
  
  attachPromoClaimListeners();
});