let portsData = [];
let map = null;
let markers = [];
let currentResults = [];

// DOM Elements
const searchForm = document.getElementById('searchForm');
const latInput = document.getElementById('latitude');
const lonInput = document.getElementById('longitude');
const plusCodeInput = document.getElementById('plusCode');
const radiusInput = document.getElementById('radius');
const useLocationBtn = document.getElementById('useLocationBtn');
const searchBtn = document.getElementById('searchBtn');
const errorMessage = document.getElementById('errorMessage');
const resultsSection = document.getElementById('resultsSection');
const resultsMeta = document.getElementById('resultsMeta');
const loadingSection = document.getElementById('loadingSection');

// Tabs
const tabTable = document.getElementById('tabTable');
const tabMap = document.getElementById('tabMap');
const panelTable = document.getElementById('panelTable');
const panelMap = document.getElementById('panelMap');

// Results
const tableBody = document.getElementById('tableBody');
const emptyTable = document.getElementById('emptyTable');
const emptyMap = document.getElementById('emptyMap');
const mapContainer = document.getElementById('mapContainer');

// Initialization
async function init() {
  try {
    const response = await fetch('./data/ports.json?v=' + new Date().getTime());
    if (!response.ok) throw new Error('Failed to load ports data');
    portsData = await response.json();
    
    // Check URL params
    checkUrlParams();
    
    // Setup event listeners
    setupEventListeners();
  } catch (error) {
    showError('Failed to initialize application. Please try refreshing the page.');
    console.error('Init error:', error);
  }
}

function setupEventListeners() {
  searchForm.addEventListener('submit', handleSearch);
  useLocationBtn.addEventListener('click', getUserLocation);
  
  tabTable.addEventListener('click', () => switchTab('table'));
  tabMap.addEventListener('click', () => switchTab('map'));
  
  // Clear plus code if lat/lon changes
  latInput.addEventListener('input', () => { if(latInput.value) plusCodeInput.value = ''; });
  lonInput.addEventListener('input', () => { if(lonInput.value) plusCodeInput.value = ''; });
}

function checkUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const lat = urlParams.get('lat');
  const lon = urlParams.get('lon');
  const radius = urlParams.get('radius');
  
  if (lat && lon) {
    latInput.value = lat;
    lonInput.value = lon;
    if (radius) radiusInput.value = radius;
    handleSearch(new Event('submit'));
  }
}

function updateUrlParams(lat, lon, radius) {
  const url = new URL(window.location);
  url.searchParams.set('lat', lat);
  url.searchParams.set('lon', lon);
  url.searchParams.set('radius', radius);
  window.history.pushState({}, '', url);
}

function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.style.display = 'block';
  setTimeout(() => {
    errorMessage.style.display = 'none';
  }, 5000);
}

function getUserLocation() {
  if (!navigator.geolocation) {
    showError('Geolocation is not supported by your browser');
    return;
  }
  
  useLocationBtn.disabled = true;
  const originalText = useLocationBtn.innerHTML;
  useLocationBtn.innerHTML = '<span>Locating...</span>';
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      latInput.value = position.coords.latitude.toFixed(6);
      lonInput.value = position.coords.longitude.toFixed(6);
      plusCodeInput.value = '';
      useLocationBtn.disabled = false;
      useLocationBtn.innerHTML = originalText;
      // Trigger search automatically
      handleSearch(new Event('submit'));
    },
    (error) => {
      showError('Unable to retrieve your location');
      useLocationBtn.disabled = false;
      useLocationBtn.innerHTML = originalText;
    }
  );
}

// Load Open Location Code dynamically if needed
async function loadPlusCodeLib() {
  if (window.OpenLocationCode) return true;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/open-location-code@1.0.4/open-location-code.min.js';
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Plus Code library'));
    document.head.appendChild(script);
  });
}

async function handleSearch(e) {
  if (e && e.preventDefault) e.preventDefault();
  
  // If plus code is entered, decode it
  if (plusCodeInput.value.trim()) {
    try {
      await loadPlusCodeLib();
      const code = plusCodeInput.value.trim();
      const decoded = OpenLocationCode.decode(code);
      latInput.value = decoded.latitudeCenter.toFixed(6);
      lonInput.value = decoded.longitudeCenter.toFixed(6);
    } catch (err) {
      showError('Invalid Plus Code or library failed to load');
      return;
    }
  }
  
  if (!searchForm.checkValidity()) {
    searchForm.reportValidity();
    return;
  }
  
  const lat = parseFloat(latInput.value);
  const lon = parseFloat(lonInput.value);
  const radius = parseFloat(radiusInput.value) || 5;
  
  updateUrlParams(lat, lon, radius);
  
  // UI state
  loadingSection.hidden = false;
  resultsSection.hidden = true;
  searchBtn.disabled = true;
  
  // Simulate network/processing delay for UI feedback
  setTimeout(() => {
    performSearch(lat, lon, radius);
    loadingSection.hidden = true;
    resultsSection.hidden = false;
    searchBtn.disabled = false;
  }, 400);
}

function performSearch(lat, lon, radius) {
  // Filter and calculate distance
  const results = portsData.map(port => {
    const distance = calculateDistance(lat, lon, port.lat, port.lon);
    return { ...port, distance };
  }).filter(port => port.distance <= radius);
  
  // Sort by distance
  results.sort((a, b) => a.distance - b.distance);
  
  currentResults = results.slice(0, 50); // Limit to top 50
  
  resultsMeta.textContent = `Found ${results.length} ports within ${radius}km. Showing top ${currentResults.length}.`;
  
  renderTable();
  if (tabMap.classList.contains('active')) {
    renderMap(lat, lon, radius);
  } else {
    // Map needs to be rendered but invalidatesize should be called when shown
    // We'll initialize it but it might not show correctly until tab is clicked
    if (!map) initMap();
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

function renderTable() {
  tableBody.innerHTML = '';
  
  if (currentResults.length === 0) {
    emptyTable.hidden = false;
    tableBody.parentElement.hidden = true;
    return;
  }
  
  emptyTable.hidden = true;
  tableBody.parentElement.hidden = false;
  
  currentResults.forEach((port, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${port.unlocode ? `<div class="port-unlocode" style="margin-top: 0;">${port.unlocode}</div>` : '-'}</td>
      <td>
        <div class="port-name">${port.name}</div>
      </td>
      <td>
        <div>${port.address || port.country}</div>
      </td>
      <td style="font-family: monospace; font-size: 0.8rem;">
        ${port.lat.toFixed(4)}, ${port.lon.toFixed(4)}
      </td>
      <td>
        <span class="distance-badge">${port.distance.toFixed(1)} km</span>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

function initMap() {
  map = L.map('mapContainer').setView([0, 0], 2);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);
}

let searchCircle = null;
let centerMarker = null;

function renderMap(lat, lon, radius) {
  if (!map) initMap();
  
  // Clear previous markers
  markers.forEach(m => map.removeLayer(m));
  markers = [];
  if (searchCircle) map.removeLayer(searchCircle);
  if (centerMarker) map.removeLayer(centerMarker);
  
  if (currentResults.length === 0) {
    emptyMap.hidden = false;
    document.getElementById('mapContainer').style.opacity = '0.3';
    map.setView([lat, lon], 10);
    return;
  }
  
  emptyMap.hidden = true;
  document.getElementById('mapContainer').style.opacity = '1';
  
  // Draw search center
  centerMarker = L.circleMarker([lat, lon], {
    color: '#ef4444',
    fillColor: '#ef4444',
    fillOpacity: 1,
    radius: 6
  }).addTo(map).bindPopup('Search Center');
  
  // Draw search radius
  searchCircle = L.circle([lat, lon], {
    color: '#3b82f6',
    fillColor: '#3b82f6',
    fillOpacity: 0.1,
    radius: radius * 1000
  }).addTo(map);
  
  const bounds = L.latLngBounds();
  bounds.extend([lat, lon]);
  
  // Add port markers
  currentResults.forEach(port => {
    const marker = L.marker([port.lat, port.lon]).addTo(map);
    marker.bindPopup(`
      <strong>${port.name}</strong><br>
      ${port.unlocode ? `UN/LOCODE: ${port.unlocode}<br>` : ''}
      Distance: ${port.distance.toFixed(1)} km
    `);
    markers.push(marker);
    bounds.extend([port.lat, port.lon]);
  });
  
  // Fit map to show all results and search center
  map.fitBounds(bounds, { padding: [50, 50] });
  setTimeout(() => map.invalidateSize(), 100);
}

function switchTab(tabId) {
  if (tabId === 'table') {
    tabTable.classList.add('active');
    tabMap.classList.remove('active');
    tabTable.setAttribute('aria-selected', 'true');
    tabMap.setAttribute('aria-selected', 'false');
    
    panelTable.classList.add('active');
    panelTable.hidden = false;
    panelMap.classList.remove('active');
    panelMap.hidden = true;
  } else {
    tabMap.classList.add('active');
    tabTable.classList.remove('active');
    tabMap.setAttribute('aria-selected', 'true');
    tabTable.setAttribute('aria-selected', 'false');
    
    panelMap.classList.add('active');
    panelMap.hidden = false;
    panelTable.classList.remove('active');
    panelTable.hidden = true;
    
    if (!map) initMap();
    setTimeout(() => {
      map.invalidateSize();
      if (latInput.value && lonInput.value) {
        renderMap(parseFloat(latInput.value), parseFloat(lonInput.value), parseFloat(radiusInput.value) || 5);
      }
    }, 100);
  }
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
