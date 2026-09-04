/**
 * WeatherGPT — API Client
 * Connects frontend to FastAPI backend
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const API_BASE = `${BASE_URL.replace(/\/$/, "")}/api`;

async function fetchJSON(url, options = {}) {
  const resp = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!resp.ok) {
    throw new Error(`API Error: ${resp.status} ${resp.statusText}`);
  }
  return resp.json();
}

/** Health check */
export async function checkHealth() {
  return fetchJSON(`${API_BASE}/health`);
}

/** Geocode location by name */
export async function geocodeLocation(query) {
  return fetchJSON(`${API_BASE}/weather/geocode?query=${encodeURIComponent(query)}`);
}

/** Get current weather + forecast */
export async function getCurrentWeather(lat, lon, locationName = "") {
  const safeLat = (lat != null && !isNaN(lat)) ? lat : 28.6139;
  const safeLon = (lon != null && !isNaN(lon)) ? lon : 77.209;
  const params = new URLSearchParams({ lat: safeLat, lon: safeLon });
  if (locationName) params.append("location_name", locationName);
  return fetchJSON(`${API_BASE}/weather/current?${params}`);
}

/** Get air quality */
export async function getAirQuality(lat, lon) {
  const safeLat = (lat != null && !isNaN(lat)) ? lat : 28.6139;
  const safeLon = (lon != null && !isNaN(lon)) ? lon : 77.209;
  return fetchJSON(`${API_BASE}/weather/air-quality?lat=${safeLat}&lon=${safeLon}`);
}

/** Get NWP model data */
export async function getNWPData(lat, lon) {
  const safeLat = (lat != null && !isNaN(lat)) ? lat : 28.6139;
  const safeLon = (lon != null && !isNaN(lon)) ? lon : 77.209;
  return fetchJSON(`${API_BASE}/weather/nwp?lat=${safeLat}&lon=${safeLon}`);
}

/** Get weather alerts */
export async function getAlerts(lat, lon, locationName = "") {
  const safeLat = (lat != null && !isNaN(lat)) ? lat : 28.6139;
  const safeLon = (lon != null && !isNaN(lon)) ? lon : 77.209;
  const params = new URLSearchParams({ lat: safeLat, lon: safeLon });
  if (locationName) params.append("location_name", locationName);
  return fetchJSON(`${API_BASE}/alerts/?${params}`);
}

/** Get sector advisory */
export async function getAdvisory(lat, lon, sector, locationName = "") {
  const safeLat = (lat != null && !isNaN(lat)) ? lat : 28.6139;
  const safeLon = (lon != null && !isNaN(lon)) ? lon : 77.209;
  const params = new URLSearchParams({ lat: safeLat, lon: safeLon, sector });
  if (locationName) params.append("location_name", locationName);
  return fetchJSON(`${API_BASE}/advisories/?${params}`);
}

/** Get climate history */
export async function getClimateHistory(lat, lon, startYear = 2000, endYear = 2025, locationName = "") {
  const safeLat = (lat != null && !isNaN(lat)) ? lat : 28.6139;
  const safeLon = (lon != null && !isNaN(lon)) ? lon : 77.209;
  const params = new URLSearchParams({ lat: safeLat, lon: safeLon, start_year: startYear, end_year: endYear });
  if (locationName) params.append("location_name", locationName);
  return fetchJSON(`${API_BASE}/climate/history?${params}`);
}

/** Send chat message */
export async function sendChatMessage(message, language = "en", lat = null, lon = null, locationName = null) {
  const body = { message, language };
  if (lat !== null) body.latitude = lat;
  if (lon !== null) body.longitude = lon;
  if (locationName) body.location_name = locationName;
  return fetchJSON(`${API_BASE}/chat`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Get supported languages */
export async function getSupportedLanguages() {
  return fetchJSON(`${API_BASE}/languages`);
}

/** Weather code to emoji mapping */
export function weatherCodeToEmoji(code) {
  const map = {
    0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
    45: "🌫️", 48: "🌫️",
    51: "🌦️", 53: "🌦️", 55: "🌧️",
    56: "🌧️", 57: "🌧️",
    61: "🌧️", 63: "🌧️", 65: "🌧️",
    66: "🌨️", 67: "🌨️",
    71: "❄️", 73: "❄️", 75: "❄️", 77: "❄️",
    80: "🌦️", 81: "🌧️", 82: "⛈️",
    85: "🌨️", 86: "🌨️",
    95: "⛈️", 96: "⛈️", 99: "⛈️",
  };
  return map[code] || "🌡️";
}

/** Weather code to description */
export function weatherCodeToDesc(code) {
  const map = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Drizzle", 55: "Dense drizzle",
    61: "Light rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains",
    80: "Rain showers", 81: "Moderate showers", 82: "Heavy showers",
    95: "Thunderstorm", 96: "T-storm with hail", 99: "Severe T-storm",
  };
  return map[code] || "Unknown";
}
