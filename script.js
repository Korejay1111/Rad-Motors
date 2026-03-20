// ============================================================
//  RadMotors — script.js
//  Data is now loaded from Sanity CMS via the public CDN API.
//  ⚠️  Replace the two values below with your actual credentials
// ============================================================

const SANITY_PROJECT_ID = 'jwyoiwam';  // e.g. 'abc123de'
const SANITY_DATASET = 'production';          // usually 'production'

// Builds a Sanity image URL from a Sanity image reference object
function buildImageUrl(imageRef) {
  if (!imageRef || !imageRef.asset || !imageRef.asset._ref) return '';
  // _ref format: "image-<id>-<dimensions>-<format>"
  const ref = imageRef.asset._ref;
  const parts = ref.replace('image-', '').split('-');
  const fmt = parts.pop();              // e.g. 'jpeg'
  const dims = parts.pop();             // e.g. '800x600'
  const id = parts.join('-');         // the actual asset id
  return `https://cdn.sanity.io/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${id}-${dims}.${fmt}`;
}

// Fetches all car listings from Sanity using GROQ
async function fetchCarsFromSanity() {
  const query = encodeURIComponent(`*[_type == "car"] | order(_createdAt desc) {
    _id,
    name,
    brand,
    year,
    price,
    fuel,
    transmission,
    bodyType,
    engine,
    interior,
    safety,
    exterior,
    infotainment,
    description,
    status,
    badges,
    whyGet,
    images[] {
      asset,
      alt
    }
  }`);

 const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${SANITY_DATASET}?query=${query}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Sanity fetch failed: ${response.status}`);

  const data = await response.json();

  // Normalise the Sanity result into the same shape the rest of
  // the code expects (including converting image refs → URLs)
  return (data.result || []).map((car, index) => ({
    id: car._id,
    name: car.name || '',
    brand: car.brand || '',
    year: car.year || '',
    price: car.price || 0,
    fuel: car.fuel || '',
    transmission: car.transmission || '',
    bodyType: car.bodyType || '',
    engine: car.engine || '',
    interior: car.interior || '',
    safety: car.safety || '',
    exterior: car.exterior || '',
    infotainment: car.infotainment || '',
    description: car.description || '',
    status: car.status || 'In Stock',
    badges: car.badges || [],
    whyGet: car.whyGet || [],
    images: (car.images || []).map(img => buildImageUrl(img)),
  }));
}

// ===== Global State =====
let carsData = [];
let filteredCars = [];
let recentlyViewed = [];
let favorites = [];
let compareList = JSON.parse(localStorage.getItem('compareList')) || [];
let currentModalCar = null;
let currentImageIndex = 0;

// ===== DOM Elements =====
const carsGrid = document.getElementById('carsGrid');
const noResults = document.getElementById('noResults');
const searchInput = document.getElementById('searchInput');
const brandFilter = document.getElementById('brandFilter');
const priceRange = document.getElementById('priceRange');
const priceValue = document.getElementById('priceValue');
const yearFilter = document.getElementById('yearFilter');
const fuelFilter = document.getElementById('fuelFilter');
const transmissionFilter = document.getElementById('transmissionFilter');
const bodyTypeFilter = document.getElementById('bodyTypeFilter');
const sortFilter = document.getElementById('sortFilter');
const clearFiltersBtn = document.getElementById('clearFilters');
const carModal = document.getElementById('carModal');
const modalClose = document.getElementById('modalClose');
const scrollTopBtn = document.getElementById('scrollTop');
const scrollBottomBtn = document.getElementById('scrollBottom');
const recentlyViewedSection = document.getElementById('recentlyViewedSection');
const recentlyViewedGrid = document.getElementById('recentlyViewedGrid');
const compareSection = document.getElementById('compareSection');
const compareContainer = document.getElementById('compareContainer');
const favoritesSection = document.getElementById('favoritesSection');
const favoritesGrid = document.getElementById('favoritesGrid');
const clearCompareBtn = document.getElementById('clearCompare');

// ===== Show a loading spinner while data loads =====
function showLoading() {
  if (carsGrid) {
    carsGrid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:60px 0; color:#888;">
        <i class="fas fa-spinner fa-spin" style="font-size:2rem; margin-bottom:12px; display:block;"></i>
        Loading cars from CMS…
      </div>`;
  }
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', async () => {
  localStorage.removeItem('recentlyViewed');
  localStorage.removeItem('favorites');

  showLoading();

  try {
    carsData = await fetchCarsFromSanity();
  } catch (err) {
    console.error('Failed to load cars from Sanity:', err);
    if (carsGrid) {
      carsGrid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:60px 0; color:#e74c3c;">
          <i class="fas fa-exclamation-triangle" style="font-size:2rem; margin-bottom:12px; display:block;"></i>
          Could not load car listings. Please check your Sanity project ID.<br>
          <small style="color:#999;">Open the browser console for details.</small>
        </div>`;
    }
    return;
  }

  filteredCars = [...carsData];

  renderCars();
  updateRecentlyViewed();
  updateCompareSection();
  updateFavoritesSection();
  animateStatistics();
  setupEventListeners();
  setupScrollButtons();
});

// ===== Event Listeners =====
function setupEventListeners() {
  searchInput.addEventListener('input', filterCars);
  brandFilter.addEventListener('change', filterCars);
  priceRange.addEventListener('input', (e) => {
    priceValue.textContent = `#${parseInt(e.target.value).toLocaleString()}`;
    filterCars();
  });
  yearFilter.addEventListener('change', filterCars);
  fuelFilter.addEventListener('change', filterCars);
  transmissionFilter.addEventListener('change', filterCars);
  bodyTypeFilter.addEventListener('change', filterCars);
  sortFilter.addEventListener('change', filterCars);
  clearFiltersBtn.addEventListener('click', clearFilters);

  modalClose.addEventListener('click', closeModal);
  carModal.addEventListener('click', (e) => { if (e.target === carModal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  document.getElementById('galleryPrev').addEventListener('click', () => navigateGallery(-1));
  document.getElementById('galleryNext').addEventListener('click', () => navigateGallery(1));

  clearCompareBtn.addEventListener('click', clearCompare);
  document.getElementById('mobileMenuBtn').addEventListener('click', toggleMobileMenu);
}

// ===== Render Cars =====
function renderCars() {
  if (filteredCars.length === 0) {
    carsGrid.style.display = 'none';
    noResults.style.display = 'block';
    return;
  }
  carsGrid.style.display = 'grid';
  noResults.style.display = 'none';
  carsGrid.innerHTML = filteredCars.map(car => createCarCard(car)).join('');
}

function createCarCard(car) {
  const isFavorite = favorites.includes(car.id);
  const isCompare = compareList.includes(car.id);
  const badges = (car.badges || []).map(badge =>
    `<span class="badge ${badge}">${badge}</span>`
  ).join('');

  const firstImage = car.images && car.images[0] ? car.images[0] : '';

  return `
    <div class="car-card" data-id="${car.id}">
      <div class="car-image">
        <img src="${firstImage}" alt="${car.name}" loading="lazy">
        <div class="car-badges">${badges}</div>
        <div class="car-actions">
          <button class="car-action-btn ${isFavorite ? 'active' : ''}" onclick="toggleFavorite('${car.id}')" title="Save to Favorites">
            <i class="fas fa-heart"></i>
          </button>
          <button class="car-action-btn ${isCompare ? 'active' : ''}" onclick="toggleCompare('${car.id}')" title="Compare">
            <i class="fas fa-balance-scale"></i>
          </button>
        </div>
      </div>
      <div class="car-info">
        <h3 class="car-name">${car.name}</h3>
        <p class="car-year">${car.year}</p>
        <p class="car-price">#${car.price.toLocaleString()}</p>
        <p class="car-description">${car.description}</p>
        <div class="car-buttons">
          <button class="btn-view-details" onclick="openModal('${car.id}')">View Details</button>
          <a href="https://wa.me/2349061957126?text=Hello, I'm interested in the ${car.year} ${car.name} listed on your website. Please send more details."
             class="btn-whatsapp-quick" target="_blank" rel="noopener noreferrer" title="Chat on WhatsApp">
            <i class="fab fa-whatsapp"></i>
          </a>
        </div>
      </div>
    </div>
  `;
}

// ===== Filter Cars =====
function filterCars() {
  const searchTerm = searchInput.value.toLowerCase();
  const brand = brandFilter.value;
  const maxPrice = parseInt(priceRange.value);
  const year = yearFilter.value;
  const fuel = fuelFilter.value;
  const transmission = transmissionFilter.value;
  const bodyType = bodyTypeFilter.value;
  const sort = sortFilter.value;

  filteredCars = carsData.filter(car => {
    const matchesSearch = car.name.toLowerCase().includes(searchTerm) || car.description.toLowerCase().includes(searchTerm);
    const matchesBrand = !brand || car.brand === brand;
    const matchesPrice = car.price <= maxPrice;
    const matchesYear = !year || car.year.toString() === year;
    const matchesFuel = !fuel || car.fuel === fuel;
    const matchesTransmission = !transmission || car.transmission === transmission;
    const matchesBodyType = !bodyType || car.bodyType === bodyType;
    return matchesSearch && matchesBrand && matchesPrice && matchesYear && matchesFuel && matchesTransmission && matchesBodyType;
  });

  if (sort === 'price-low') filteredCars.sort((a, b) => a.price - b.price);
  if (sort === 'price-high') filteredCars.sort((a, b) => b.price - a.price);
  if (sort === 'newest') filteredCars.sort((a, b) => b.year - a.year);

  renderCars();
}

function clearFilters() {
  searchInput.value = '';
  brandFilter.value = '';
  priceRange.value = 200000;
  priceValue.textContent = '$200,000';
  yearFilter.value = '';
  fuelFilter.value = '';
  transmissionFilter.value = '';
  bodyTypeFilter.value = '';
  sortFilter.value = 'default';
  filterCars();
}

// ===== Modal =====
function openModal(carId) {
  const car = carsData.find(c => c.id === carId);
  if (!car) return;

  currentModalCar = car;
  currentImageIndex = 0;

  document.getElementById('modalCarName').textContent = car.name;
  document.getElementById('modalYear').textContent = car.year;
  document.getElementById('modalPrice').textContent = `#${car.price.toLocaleString()}`;
  document.getElementById('modalStatus').textContent = car.status;
  document.getElementById('modalStatus').className = `modal-status ${car.status === 'In Stock' ? 'in-stock' : 'sold'}`;
  document.getElementById('modalEngine').textContent = car.engine;
  document.getElementById('modalTransmission').textContent = car.transmission;
  document.getElementById('modalMileage').textContent = car.mileage || '—';
  document.getElementById('modalFuel').textContent = car.fuel;
  document.getElementById('modalInterior').textContent = car.interior;
  document.getElementById('modalSafety').textContent = car.safety;
  document.getElementById('modalExterior').textContent = car.exterior;
  document.getElementById('modalInfotainment').textContent = car.infotainment;

  const whatsappBtn = document.getElementById('modalWhatsappBtn');
  whatsappBtn.href = `https://wa.me/2349061957126?text=Hello, I'm interested in the ${car.year} ${car.name} listed on your website. Please send more details.`;

  const whyGetList = document.getElementById('modalWhyGet');
  whyGetList.innerHTML = (car.whyGet || []).map(item => `
    <div class="why-get-item">
      <i class="fas fa-check-circle"></i>
      <span>${item}</span>
    </div>
  `).join('');

  updateGallery();
  addToRecentlyViewed(carId);
  carModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  carModal.classList.remove('active');
  document.body.style.overflow = '';
  currentModalCar = null;
}

function updateGallery() {
  if (!currentModalCar) return;
  const mainImage = document.getElementById('modalMainImage');
  const thumbnailSlider = document.getElementById('thumbnailSlider');
  mainImage.src = currentModalCar.images[currentImageIndex] || '';
  thumbnailSlider.innerHTML = (currentModalCar.images || []).map((img, index) => `
    <img src="${img}" alt="Thumbnail ${index + 1}"
         class="thumbnail ${index === currentImageIndex ? 'active' : ''}"
         onclick="selectImage(${index})">
  `).join('');
}

function selectImage(index) {
  currentImageIndex = index;
  updateGallery();
}

function navigateGallery(direction) {
  if (!currentModalCar) return;
  currentImageIndex += direction;
  if (currentImageIndex < 0) currentImageIndex = currentModalCar.images.length - 1;
  else if (currentImageIndex >= currentModalCar.images.length) currentImageIndex = 0;
  updateGallery();
}

// ===== Recently Viewed =====
function addToRecentlyViewed(carId) {
  recentlyViewed = recentlyViewed.filter(id => id !== carId);
  recentlyViewed.unshift(carId);
  recentlyViewed = recentlyViewed.slice(0, 6);
  localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
  updateRecentlyViewed();
}

function updateRecentlyViewed() {
  if (recentlyViewed.length === 0) { recentlyViewedSection.style.display = 'none'; return; }
  recentlyViewedSection.style.display = 'block';
  const viewedCars = recentlyViewed.map(id => carsData.find(c => c.id === id)).filter(Boolean);
  recentlyViewedGrid.innerHTML = viewedCars.map(car => createCarCard(car)).join('');
}

// ===== Favorites =====
function toggleFavorite(carId) {
  const index = favorites.indexOf(carId);
  if (index > -1) favorites.splice(index, 1);
  else favorites.push(carId);
  localStorage.setItem('favorites', JSON.stringify(favorites));
  renderCars();
  updateFavoritesSection();
}

function updateFavoritesSection() {
  if (favorites.length === 0) { favoritesSection.style.display = 'none'; return; }
  favoritesSection.style.display = 'block';
  const favoriteCars = favorites.map(id => carsData.find(c => c.id === id)).filter(Boolean);
  favoritesGrid.innerHTML = favoriteCars.map(car => createCarCard(car)).join('');
}

// ===== Compare =====
function toggleCompare(carId) {
  const index = compareList.indexOf(carId);
  if (index > -1) compareList.splice(index, 1);
  else {
    if (compareList.length >= 3) { alert('You can compare up to 3 cars at a time'); return; }
    compareList.push(carId);
  }
  localStorage.setItem('compareList', JSON.stringify(compareList));
  renderCars();
  updateCompareSection();
}

function updateCompareSection() {
  if (compareList.length === 0) { compareSection.style.display = 'none'; return; }
  compareSection.style.display = 'block';
  const compareCars = compareList.map(id => carsData.find(c => c.id === id)).filter(Boolean);
  compareContainer.innerHTML = compareCars.map(car => createCarCard(car)).join('');
}

function clearCompare() {
  compareList = [];
  localStorage.setItem('compareList', JSON.stringify(compareList));
  renderCars();
  updateCompareSection();
}

// ===== Scroll Buttons =====
function setupScrollButtons() {
  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    scrollTop > 300 ? scrollTopBtn.classList.add('visible') : scrollTopBtn.classList.remove('visible');
    scrollTop < scrollHeight - 300 ? scrollBottomBtn.classList.add('visible') : scrollBottomBtn.classList.remove('visible');
  });
  scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  scrollBottomBtn.addEventListener('click', () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
}

// ===== Statistics Animation =====
function animateStatistics() {
  const statNumbers = document.querySelectorAll('.stat-number');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateNumber(entry.target, parseInt(entry.target.getAttribute('data-target')));
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  statNumbers.forEach(stat => observer.observe(stat));
}

function animateNumber(element, target) {
  let current = 0;
  const increment = target / 50;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) { element.textContent = target + '+'; clearInterval(timer); }
    else element.textContent = Math.floor(current);
  }, 30);
}

// ===== Mobile Menu =====
function toggleMobileMenu() {
  const navLinks = document.querySelector('.nav-links');
  navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
  navLinks.style.flexDirection = 'column';
  navLinks.style.position = 'absolute';
  navLinks.style.top = '100%';
  navLinks.style.left = '0';
  navLinks.style.right = '0';
  navLinks.style.background = 'rgba(10, 10, 10, 0.98)';
  navLinks.style.padding = '20px';
  navLinks.style.borderTop = '1px solid rgba(212, 175, 55, 0.3)';
}

// ===== Theme Toggle =====
function toggleTheme() {
  const html = document.documentElement;
  const icon = document.getElementById('theme-icon');
  if (html.getAttribute('data-theme') === 'light') {
    html.setAttribute('data-theme', 'dark');
    icon.classList.replace('fa-moon', 'fa-sun');
    localStorage.setItem('theme', 'dark');
  } else {
    html.setAttribute('data-theme', 'light');
    icon.classList.replace('fa-sun', 'fa-moon');
    localStorage.setItem('theme', 'light');
  }
}

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme);
  const icon = document.getElementById('theme-icon');
  if (icon && savedTheme === 'dark') icon.classList.replace('fa-moon', 'fa-sun');
}
