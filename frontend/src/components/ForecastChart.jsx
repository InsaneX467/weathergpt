import { useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";
import { weatherCodeToEmoji, weatherCodeToDesc } from "../utils/api";

export default function ForecastChart({ weather, t }) {
  const [chartType, setChartType] = useState("hourly");

  if (!weather) return null;

  // Hourly data (starts from current hour going forward 24 hours)
  const allHourly = weather.hourly || [];
  const nowTs = Date.now();
  let startIdx = allHourly.findIndex(
    (h) => new Date(h.time).getTime() >= nowTs - 3500000
  );
  if (startIdx < 0) startIdx = 0;

  const hourlyRaw = allHourly.slice(startIdx, startIdx + 24);
  const hourlyData = hourlyRaw.map((h) => ({
    time: new Date(h.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    temp: h.temperature != null ? Math.round(h.temperature) : null,
    humidity: h.humidity,
    rain: h.precipitation,
    rainProb: h.precipitation_probability,
    wind: h.wind_speed,
    emoji: weatherCodeToEmoji(h.weather_code),
    desc: weatherCodeToDesc(h.weather_code),
  }));

  // Daily data
  const dailyRaw = weather.daily || [];
  const minOverall = Math.min(...dailyRaw.map(d => d.temperature_min ?? 0));
  const maxOverall = Math.max(...dailyRaw.map(d => d.temperature_max ?? 40));
  const tempSpan = Math.max(1, maxOverall - minOverall);

  const dailyData = dailyRaw.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
    max: d.temperature_max != null ? Math.round(d.temperature_max) : null,
    min: d.temperature_min != null ? Math.round(d.temperature_min) : null,
    rain: d.precipitation_sum,
    wind: d.wind_speed_max,
    emoji: weatherCodeToEmoji(d.weather_code),
    desc: weatherCodeToDesc(d.weather_code),
    uv: d.uv_index_max,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="custom-chart-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, margin: "2px 0" }}>
            {p.name}: <strong>{p.value}{p.name.includes("Temp") || p.name.includes("max") || p.name.includes("min") ? "°C" : p.name.includes("Rain") ? " mm" : p.name.includes("Wind") ? " km/h" : "%"}</strong>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* 24-Hour Forecast Horizontal Scroll Strip */}
      <div className="glass-card forecast-strip-card">
        <div className="forecast-card-header">
          <h3>🕒 Hourly Forecast (Next 24 Hours)</h3>
          <span className="text-muted" style={{ fontSize: "0.8rem" }}>Scroll horizontally ➔</span>
        </div>
        <div className="hourly-scroll-strip">
          {hourlyData.map((h, i) => (
            <div key={i} className="hourly-item-pill">
              <span className="hourly-time">{i === 0 ? "Now" : h.time}</span>
              <span className="hourly-icon">{h.emoji}</span>
              <span className="hourly-temp">{h.temp}°</span>
              {h.rainProb != null && h.rainProb > 0 ? (
                <span className="hourly-rain-tag">💧 {h.rainProb}%</span>
              ) : (
                <span className="hourly-rain-tag empty">—</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="glass-card chart-container">
        <div className="forecast-card-header">
          <h3>📈 {chartType === "hourly" ? "24-Hour Temperature & Humidity" : chartType === "daily" ? "7-Day Temperature Trend" : "Precipitation & Rain Risk"}</h3>
          <div className="chart-toggle-group">
            <button className={`chart-toggle ${chartType === "hourly" ? "active" : ""}`} onClick={() => setChartType("hourly")}>Hourly</button>
            <button className={`chart-toggle ${chartType === "daily" ? "active" : ""}`} onClick={() => setChartType("daily")}>7-Day</button>
            <button className={`chart-toggle ${chartType === "rain" ? "active" : ""}`} onClick={() => setChartType("rain")}>Rainfall</button>
          </div>
        </div>

        <div className="chart-wrapper">
          {chartType === "hourly" && hourlyData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Area type="monotone" dataKey="temp" name="Temperature (°C)" stroke="#3b82f6" fill="url(#tempGrad)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#06b6d4" fill="url(#humGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {chartType === "daily" && dailyData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="maxGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="minGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Area type="monotone" dataKey="max" name="High Temp (°C)" stroke="#f59e0b" fill="url(#maxGrad)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="min" name="Low Temp (°C)" stroke="#3b82f6" fill="url(#minGrad)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {chartType === "rain" && hourlyData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="rain" name="Rainfall (mm)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rainProb" name="Probability (%)" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Standard 7-Day Forecast Rows with Temp Range Visualizer */}
      <div className="glass-card daily-forecast-card">
        <h3 style={{ marginBottom: 16 }}>📅 7-Day Forecast</h3>
        <div className="daily-list">
          {dailyData.map((d, i) => {
            const leftPct = Math.max(0, ((d.min - minOverall) / tempSpan) * 100);
            const widthPct = Math.max(8, (((d.max - d.min) / tempSpan) * 100));

            return (
              <div key={i} className="daily-row-item">
                <div className="daily-row-day">
                  <span className="day-name">{i === 0 ? "Today" : d.date}</span>
                </div>
                <div className="daily-row-condition">
                  <span className="daily-emoji">{d.emoji}</span>
                  <span className="daily-desc">{d.desc}</span>
                </div>
                <div className="daily-row-rain">
                  {d.rain > 0 ? <span>💧 {d.rain.toFixed(1)} mm</span> : <span className="empty">—</span>}
                </div>
                <div className="daily-row-temps">
                  <span className="temp-low">{d.min}°</span>
                  <div className="temp-bar-container">
                    <div
                      className="temp-bar-fill"
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    />
                  </div>
                  <span className="temp-high">{d.max}°</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

