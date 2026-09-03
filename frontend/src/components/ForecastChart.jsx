import { useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";
import { weatherCodeToEmoji } from "../utils/api";

export default function ForecastChart({ weather, t }) {
  const [chartType, setChartType] = useState("hourly");

  if (!weather) return null;

  // Hourly data (next 24 hours)
  const hourlyData = (weather.hourly || []).slice(0, 24).map((h) => ({
    time: new Date(h.time).toLocaleTimeString("en-IN", { hour: "2-digit", hour12: true }),
    temp: h.temperature,
    humidity: h.humidity,
    rain: h.precipitation,
    rainProb: h.precipitation_probability,
    wind: h.wind_speed,
  }));

  // Daily data
  const dailyData = (weather.daily || []).map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
    max: d.temperature_max,
    min: d.temperature_min,
    rain: d.precipitation_sum,
    wind: d.wind_speed_max,
    emoji: weatherCodeToEmoji(d.weather_code),
    uv: d.uv_index_max,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    return (
      <div style={{
        background: "rgba(17, 24, 39, 0.95)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: "0.82rem",
      }}>
        <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {p.value}{p.name.includes("Temp") || p.name.includes("temp") ? "°C" : p.name.includes("Rain") ? " mm" : p.name.includes("Wind") ? " km/h" : "%"}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="glass-card chart-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3>📈 {chartType === "hourly" ? "24-Hour Forecast" : "7-Day Forecast"}</h3>
        <div className="chart-toggle-group">
          <button className={`chart-toggle ${chartType === "hourly" ? "active" : ""}`} onClick={() => setChartType("hourly")}>Hourly</button>
          <button className={`chart-toggle ${chartType === "daily" ? "active" : ""}`} onClick={() => setChartType("daily")}>7-Day</button>
          <button className={`chart-toggle ${chartType === "rain" ? "active" : ""}`} onClick={() => setChartType("rain")}>Rain</button>
        </div>
      </div>

      <div className="chart-wrapper">
        {chartType === "hourly" && hourlyData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="time" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="temp" name="Temp (°C)" stroke="#f59e0b" fill="url(#tempGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#06b6d4" fill="url(#humGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {chartType === "daily" && dailyData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="maxGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="minGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="max" name="Max Temp" stroke="#f43f5e" fill="url(#maxGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="min" name="Min Temp" stroke="#3b82f6" fill="url(#minGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {chartType === "rain" && hourlyData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="time" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="rain" name="Rain (mm)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rainProb" name="Rain Prob (%)" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Daily forecast row */}
      {weather.daily && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", marginTop: 20, paddingBottom: 4 }}>
          {weather.daily.map((d, i) => (
            <div key={i} style={{
              flex: "0 0 auto",
              textAlign: "center",
              padding: "12px 16px",
              background: "var(--bg-glass)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-glass)",
              minWidth: 80,
            }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 4 }}>
                {new Date(d.date).toLocaleDateString("en-IN", { weekday: "short" })}
              </div>
              <div style={{ fontSize: "1.4rem", marginBottom: 4 }}>
                {weatherCodeToEmoji(d.weather_code)}
              </div>
              <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                {d.temperature_max?.toFixed(0)}°
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {d.temperature_min?.toFixed(0)}°
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
