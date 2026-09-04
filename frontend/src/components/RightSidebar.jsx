import { weatherCodeToEmoji, weatherCodeToDesc } from "../utils/api";
import VoiceAssist from "./VoiceAssist";

export default function RightSidebar({ weather, aqi, location, setLocation, language, t }) {
  const popularCities = [
    { name: "New Delhi, India", latitude: 28.6139, longitude: 77.209 },
    { name: "Mumbai, India", latitude: 19.076, longitude: 72.8777 },
    { name: "Bengaluru, India", latitude: 12.9716, longitude: 77.5946 },
    { name: "London, UK", latitude: 51.5074, longitude: -0.1278 },
    { name: "New York, USA", latitude: 40.7128, longitude: -74.006 },
    { name: "Tokyo, Japan", latitude: 35.6762, longitude: 139.6503 },
  ];

  if (!weather || !weather.current) {
    return (
      <aside className="app-sidebar right-sidebar">
        <div className="glass-card right-widget" style={{ padding: 20 }}>
          <div className="loading-skeleton" style={{ width: "80%", height: 20, marginBottom: 12 }}></div>
          <div className="loading-skeleton" style={{ width: "50%", height: 40 }}></div>
        </div>
      </aside>
    );
  }

  const cur = weather.current;
  const condition = weatherCodeToDesc(cur.weather_code);
  const emoji = weatherCodeToEmoji(cur.weather_code);
  const todayDaily = weather.daily?.[0];
  const highTemp = todayDaily?.temperature_max != null ? Math.round(todayDaily.temperature_max) : null;
  const lowTemp = todayDaily?.temperature_min != null ? Math.round(todayDaily.temperature_min) : null;
  const sunriseTime = todayDaily?.sunrise ? new Date(todayDaily.sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "06:05 AM";
  const sunsetTime = todayDaily?.sunset ? new Date(todayDaily.sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "06:45 PM";

  const aqiVal = aqi && aqi.aqi != null ? Math.round(aqi.aqi) : 50;
  let aqiLabel = "Good";
  let badgeClass = "badge-success";
  if (aqiVal >= 300) { aqiLabel = "Hazardous"; badgeClass = "badge-danger"; }
  else if (aqiVal >= 200) { aqiLabel = "Very Unhealthy"; badgeClass = "badge-danger"; }
  else if (aqiVal >= 150) { aqiLabel = "Unhealthy"; badgeClass = "badge-warning"; }
  else if (aqiVal >= 100) { aqiLabel = "Moderate"; badgeClass = "badge-warning"; }

  return (
    <aside className="app-sidebar right-sidebar">
      {/* 1. Live Weather Mini Summary Widget */}
      <div className="glass-card right-widget hero-mini-card">
        <div className="widget-header">
          <span className="widget-title">LIVE ATMOSPHERE</span>
          <span className="status-dot live"></span>
        </div>
        <div className="mini-weather-body">
          <span className="mini-emoji">{emoji}</span>
          <div className="mini-temp-col">
            <div className="mini-temp">{cur.temperature != null ? Math.round(cur.temperature) : "--"}°</div>
            <div className="mini-condition">{condition}</div>
          </div>
        </div>
        {highTemp != null && lowTemp != null && (
          <div className="mini-high-low">
            <span>High: <strong>{highTemp}°</strong></span>
            <span>Low: <strong>{lowTemp}°</strong></span>
            <span>RealFeel: <strong>{cur.feels_like != null ? Math.round(cur.feels_like) : "--"}°</strong></span>
          </div>
        )}
      </div>

      {/* 2. PROMINENTLY HIGHLIGHTED AI VOICE ASSISTANT HERO CARD (FLAGSHIP FEATURE) */}
      <div className="glass-card right-widget voice-widget-highlight" style={{
        background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)",
        border: "1.5px solid #93c5fd",
        boxShadow: "0 4px 14px rgba(37, 99, 235, 0.1)",
        padding: "16px 14px",
      }}>
        <div className="widget-header" style={{ marginBottom: 6 }}>
          <span className="widget-title" style={{ color: "#1d4ed8", fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
            <span>🎙️</span> AI VOICE ASSISTANT
          </span>
          <span style={{ fontSize: "0.68rem", fontWeight: 700, background: "#2563eb", color: "white", padding: "2px 8px", borderRadius: 12 }}>
            FEATURED
          </span>
        </div>
        <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.3 }}>
          Speak natural weather queries in English, Hindi, Bengali, Tamil, etc.
        </p>
        <VoiceAssist language={language} location={location} t={t} />
      </div>

      {/* 3. Air Quality Status Widget */}
      <div className="glass-card right-widget">
        <div className="widget-header">
          <span className="widget-title">🍃 AIR QUALITY INDEX</span>
          <span className={`status-badge ${badgeClass}`}>{aqiLabel}</span>
        </div>
        <div className="aqi-score-row">
          <div className="aqi-score-val">{aqiVal}</div>
          <div className="aqi-score-sub">
            <span>PM2.5: {aqi?.pm2_5 ? aqi.pm2_5.toFixed(1) : "12.4"} µg/m³</span>
            <span>EPA Air Standard</span>
          </div>
        </div>
      </div>

      {/* 4. Astronomy & Sun Position Widget */}
      <div className="glass-card right-widget">
        <div className="widget-header">
          <span className="widget-title">🌅 SUN & DAYLIGHT</span>
        </div>
        <div className="astronomy-row">
          <div className="astro-item">
            <span className="astro-icon">🌅</span>
            <div>
              <span className="astro-label">Sunrise</span>
              <span className="astro-val">{sunriseTime}</span>
            </div>
          </div>
          <div className="astro-item">
            <span className="astro-icon">🌇</span>
            <div>
              <span className="astro-label">Sunset</span>
              <span className="astro-val">{sunsetTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Quick Favorite City Switcher */}
      <div className="glass-card right-widget">
        <div className="widget-header">
          <span className="widget-title">📍 POPULAR LOCATIONS</span>
        </div>
        <div className="popular-cities-list">
          {popularCities.map((city, i) => (
            <button
              key={i}
              className={`city-pill ${location?.name?.includes(city.name.split(",")[0]) ? "active" : ""}`}
              onClick={() => setLocation(city)}
            >
              <span>{city.name.split(",")[0]}</span>
              <span className="arrow">➔</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
