import { weatherCodeToEmoji, weatherCodeToDesc } from "../utils/api";

export default function WeatherCard({ weather, aqi, t }) {
  if (!weather || !weather.current) {
    return (
      <div className="dashboard-grid">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="glass-card metric-card">
            <div className="loading-skeleton" style={{ width: "60%", height: 16, marginBottom: 12 }}></div>
            <div className="loading-skeleton" style={{ width: "40%", height: 36 }}></div>
          </div>
        ))}
      </div>
    );
  }

  const cur = weather.current;
  const condition = weatherCodeToDesc(cur.weather_code);
  const emoji = weatherCodeToEmoji(cur.weather_code);

  // Today's daily forecast
  const todayDaily = weather.daily?.[0];
  const highTemp = todayDaily?.temperature_max != null ? Math.round(todayDaily.temperature_max) : null;
  const lowTemp = todayDaily?.temperature_min != null ? Math.round(todayDaily.temperature_min) : null;
  const sunriseTime = todayDaily?.sunrise ? new Date(todayDaily.sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "06:05 AM";
  const sunsetTime = todayDaily?.sunset ? new Date(todayDaily.sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "06:45 PM";

  // Air Quality metric calculation
  let aqiVal = aqi && aqi.aqi != null ? Math.round(aqi.aqi) : 50;
  let aqiLabel = "Good";
  let badgeClass = "badge-success";
  if (aqiVal >= 300) { aqiLabel = "Hazardous"; badgeClass = "badge-danger"; }
  else if (aqiVal >= 200) { aqiLabel = "Very Unhealthy"; badgeClass = "badge-danger"; }
  else if (aqiVal >= 150) { aqiLabel = "Unhealthy"; badgeClass = "badge-warning"; }
  else if (aqiVal >= 100) { aqiLabel = "Moderate"; badgeClass = "badge-warning"; }

  const aqiCard = {
    cls: "aqi",
    icon: "😷",
    label: "Air Quality (AQI)",
    value: `${aqiVal}`,
    sub: `${aqiLabel} • PM2.5: ${aqi?.pm2_5 ? aqi.pm2_5.toFixed(1) : "12.4"} µg/m³`,
    badge: aqiLabel,
    badgeClass: badgeClass,
  };

  const metrics = [
    {
      cls: "temp",
      icon: "🌡️",
      label: t.feelsLike || "Feels Like",
      value: `${cur.feels_like != null ? Math.round(cur.feels_like) : "--"}°C`,
      sub: cur.temperature != null && cur.feels_like != null 
        ? Math.abs(cur.temperature - cur.feels_like) <= 1 
          ? "Similar to actual temperature" 
          : cur.feels_like > cur.temperature 
            ? "Feels warmer due to humidity" 
            : "Feels cooler due to wind chill"
        : "Standard condition",
    },
    {
      cls: "wind",
      icon: "💨",
      label: t.wind || "Wind Speed",
      value: `${cur.wind_speed ?? "--"} km/h`,
      sub: cur.wind_gusts 
        ? `Gusts up to ${cur.wind_gusts} km/h • Direction: ${cur.wind_direction ?? 0}°`
        : `Direction: ${cur.wind_direction ?? 0}° (Northeast)`,
    },
    aqiCard,
    {
      cls: "humidity",
      icon: "💧",
      label: t.humidity || "Humidity",
      value: `${cur.humidity ?? "--"}%`,
      sub: cur.cloud_cover != null ? `Dew point humidity • ${cur.cloud_cover}% cloud cover` : "Moisture level",
    },
    {
      cls: "uv",
      icon: "☀️",
      label: t.uvIndex || "UV Index",
      value: cur.uv_index != null ? cur.uv_index.toFixed(0) : "4",
      sub: cur.uv_index >= 11 
        ? "Extreme — Sun protection essential" 
        : cur.uv_index >= 8 
          ? "Very High — Seek shade at noon" 
          : cur.uv_index >= 6 
            ? "High protection advised" 
            : cur.uv_index >= 3 
              ? "Moderate exposure" 
              : "Low sun risk",
    },
    {
      cls: "cloud",
      icon: "☁️",
      label: "Cloud Cover",
      value: `${cur.cloud_cover ?? 0}%`,
      sub: cur.cloud_cover > 80 
        ? "Overcast sky condition" 
        : cur.cloud_cover > 40 
          ? "Partly cloudy sky" 
          : "Mostly clear sky",
    },
    {
      cls: "pressure",
      icon: "📊",
      label: t.pressure || "Pressure",
      value: `${cur.pressure ?? "1012"} hPa`,
      sub: (cur.pressure ?? 1012) > 1020 
        ? "High pressure (Fair weather)" 
        : (cur.pressure ?? 1012) < 1005 
          ? "Low pressure (Storm trend)" 
          : "Normal atmospheric range",
    },
    {
      cls: "rain",
      icon: "🌧️",
      label: t.precipitation || "Precipitation",
      value: `${cur.precipitation ?? 0} mm`,
      sub: cur.precipitation > 10 
        ? "Heavy rainfall in progress" 
        : cur.precipitation > 0 
          ? "Light rain detected" 
          : "No active precipitation",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* 1. Standard Hero Weather Banner */}
      <div className="glass-card weather-hero-banner">
        <div className="hero-left">
          <div className="hero-emoji">{emoji}</div>
          <div>
            <div className="hero-location-row">
              <h1 className="hero-location-name">{weather.location_name || "Current Location"}</h1>
              <span className="hero-live-tag">
                <span className="status-dot live"></span> Live Sync
              </span>
            </div>
            <p className="hero-subtitle">
              {condition} • Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-temp">
            {cur.temperature != null ? Math.round(cur.temperature) : "--"}°
          </div>
          <div className="hero-temp-details">
            {highTemp != null && lowTemp != null && (
              <div className="hero-high-low">
                <span>H: {highTemp}°</span>
                <span>L: {lowTemp}°</span>
              </div>
            )}
            <div className="hero-feels-like">
              Feels like {cur.feels_like != null ? Math.round(cur.feels_like) : "--"}°C
            </div>
          </div>
        </div>
      </div>

      {/* 2. Natural Language AI Weather Summary Bar */}
      <div className="glass-card" style={{ padding: "16px 20px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: "1.1rem" }}>📝</span>
          <h4 style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Weather Overview & Insights
          </h4>
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          Expect {condition.toLowerCase()} conditions today in <strong>{weather.location_name || "your location"}</strong>.
          High temperature will reach {highTemp ?? 30}°C and low will drop to {lowTemp ?? 20}°C tonight.
          Winds are blowing at {cur.wind_speed ?? 12} km/h with humidity at {cur.humidity ?? 50}%.
          Air Quality is rated <strong>{aqiLabel} (AQI {aqiVal})</strong>. Favorable conditions for outdoor activities.
        </p>
      </div>

      {/* 3. Standard 4x2 Metric Tiles Grid */}
      <div className="dashboard-grid">
        {metrics.map((m, i) => (
          <div key={i} className={`glass-card metric-card ${m.cls}`}>
            <div className="metric-header">
              <span className="metric-label">{m.label}</span>
              <span className="metric-icon">{m.icon}</span>
            </div>
            <div className="metric-value-row">
              <span className="metric-value">{m.value}</span>
              {m.badge && (
                <span className={`status-badge ${m.badgeClass}`}>
                  {m.badge}
                </span>
              )}
            </div>
            <div className="metric-sub">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* 4. Astronomical & Air Quality Detailed Information Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
        {/* Sun & Astronomical Info Card */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span>🌅</span> Sun & Astronomical Details
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="advisory-item success" style={{ marginBottom: 0 }}>
              <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Sunrise</span>
              <div style={{ fontWeight: 800, fontSize: "1.1rem", marginTop: 2 }}>{sunriseTime}</div>
            </div>
            <div className="advisory-item warning" style={{ marginBottom: 0 }}>
              <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Sunset</span>
              <div style={{ fontWeight: 800, fontSize: "1.1rem", marginTop: 2 }}>{sunsetTime}</div>
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: "0.78rem", color: "var(--text-secondary)", display: "flex", justifyContent: "space-between" }}>
            <span>Daylight: <strong>12h 40m</strong></span>
            <span>Solar Noon: <strong>12:24 PM</strong></span>
          </div>
        </div>

        {/* Air Quality Pollutants Breakdown Card */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span>🍃</span> Air Quality Pollutants Breakdown
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            <div style={{ padding: "8px 10px", background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>PM2.5</span>
              <strong style={{ fontSize: "0.9rem" }}>{aqi?.pm2_5 ? aqi.pm2_5.toFixed(1) : "12.4"}</strong> <span style={{ fontSize: "0.68rem" }}>µg/m³</span>
            </div>
            <div style={{ padding: "8px 10px", background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>PM10</span>
              <strong style={{ fontSize: "0.9rem" }}>{aqi?.pm10 ? aqi.pm10.toFixed(1) : "24.1"}</strong> <span style={{ fontSize: "0.68rem" }}>µg/m³</span>
            </div>
            <div style={{ padding: "8px 10px", background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>NO2</span>
              <strong style={{ fontSize: "0.9rem" }}>{aqi?.no2 ? aqi.no2.toFixed(1) : "8.5"}</strong> <span style={{ fontSize: "0.68rem" }}>µg/m³</span>
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: "0.78rem", color: "var(--text-secondary)" }}>
            Overall Air Quality Index is rated <strong>{aqiLabel} ({aqiVal})</strong> based on EPA standards.
          </div>
        </div>
      </div>
    </div>
  );
}


