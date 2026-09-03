import { weatherCodeToEmoji, weatherCodeToDesc } from "../utils/api";

export default function WeatherCard({ weather, aqi, t }) {
  if (!weather || !weather.current) {
    return (
      <div className="dashboard-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
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

  const metrics = [
    {
      cls: "temp",
      icon: "🌡️",
      label: t.currentWeather,
      value: `${cur.temperature ?? "--"}°C`,
      sub: `${t.feelsLike}: ${cur.feels_like ?? "--"}°C • ${emoji} ${condition}`,
    },
    {
      cls: "humidity",
      icon: "💧",
      label: t.humidity,
      value: `${cur.humidity ?? "--"}%`,
      sub: cur.cloud_cover != null ? `${t.cloudCover}: ${cur.cloud_cover}%` : "",
    },
    {
      cls: "wind",
      icon: "💨",
      label: t.wind,
      value: `${cur.wind_speed ?? "--"} km/h`,
      sub: cur.wind_gusts ? `Gusts: ${cur.wind_gusts} km/h • ${cur.wind_direction ?? 0}°` : `Direction: ${cur.wind_direction ?? 0}°`,
    },
    {
      cls: "pressure",
      icon: "📊",
      label: t.pressure,
      value: `${cur.pressure ?? "--"} hPa`,
      sub: cur.pressure > 1020 ? "High pressure system" : cur.pressure < 1005 ? "Low pressure system" : "Normal range",
    },
    {
      cls: "uv",
      icon: "☀️",
      label: t.uvIndex,
      value: cur.uv_index != null ? cur.uv_index.toFixed(0) : "--",
      sub: cur.uv_index >= 11 ? "Extreme — avoid outdoors" : cur.uv_index >= 8 ? "Very High — wear protection" : cur.uv_index >= 6 ? "High" : cur.uv_index >= 3 ? "Moderate" : "Low",
    },
    {
      cls: "rain",
      icon: "🌧️",
      label: t.precipitation,
      value: `${cur.precipitation ?? 0} mm`,
      sub: cur.precipitation > 10 ? "Heavy rainfall" : cur.precipitation > 0 ? "Light rainfall" : "No precipitation",
    },
  ];

  // Add AQI card if available
  if (aqi && aqi.aqi != null) {
    const aqiLevel = aqi.aqi >= 300 ? "Hazardous" : aqi.aqi >= 200 ? "Very Unhealthy" : aqi.aqi >= 150 ? "Unhealthy" : aqi.aqi >= 100 ? "Moderate" : "Good";
    metrics.push({
      cls: "pressure",
      icon: "😷",
      label: "Air Quality (AQI)",
      value: aqi.aqi.toFixed(0),
      sub: `${aqiLevel} • PM2.5: ${aqi.pm2_5 ?? "--"} µg/m³`,
    });
  }

  return (
    <>
      {weather.location_name && (
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: "2.5rem" }}>{emoji}</span>
          <div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, letterSpacing: "-0.5px" }}>
              {weather.location_name}
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
              {condition} • {cur.temperature}°C • {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
        </div>
      )}
      <div className="dashboard-grid">
        {metrics.map((m, i) => (
          <div key={i} className={`glass-card metric-card ${m.cls}`}>
            <div className="metric-icon">{m.icon}</div>
            <div className="metric-label">{m.label}</div>
            <div className="metric-value">{m.value}</div>
            <div className="metric-sub">{m.sub}</div>
          </div>
        ))}
      </div>
    </>
  );
}
