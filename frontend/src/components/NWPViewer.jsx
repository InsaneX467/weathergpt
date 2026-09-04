import { useState, useEffect } from "react";
import { getNWPData } from "../utils/api";
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";

export default function NWPViewer({ location }) {
  const [nwpData, setNwpData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedVar, setSelectedVar] = useState("temperature_2m");

  useEffect(() => {
    if (!location) return;
    setLoading(true);
    getNWPData(location.latitude, location.longitude)
      .then(setNwpData)
      .catch(() => setNwpData(null))
      .finally(() => setLoading(false));
  }, [location]);

  if (!location) {
    return (
      <div className="glass-card" style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🛰️</div>
        <h3 style={{ marginBottom: 8 }}>NWP Model Viewer</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
          Search for a location to view GFS numerical weather prediction model output.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: 40, textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto 16px" }}></div>
        <p style={{ color: "var(--text-secondary)" }}>Loading GFS model data...</p>
      </div>
    );
  }

  if (!nwpData || !nwpData.surface_data) return null;

  const variables = [
    { key: "temperature_2m", label: "Temperature (2m)", unit: "°C", color: "#f59e0b" },
    { key: "pressure_msl", label: "Mean Sea Level Pressure", unit: "hPa", color: "#10b981" },
    { key: "wind_speed_10m", label: "Wind Speed (10m)", unit: "km/h", color: "#3b82f6" },
    { key: "cloud_cover", label: "Cloud Cover", unit: "%", color: "#8b5cf6" },
    { key: "precipitation", label: "Precipitation", unit: "mm", color: "#06b6d4" },
    { key: "cape", label: "CAPE (Convective Energy)", unit: "J/kg", color: "#f43f5e" },
  ];

  const activeVar = variables.find((v) => v.key === selectedVar) || variables[0];

  // Build chart data (every 3rd hour for readability)
  const timestamps = nwpData.timestamps || [];
  const values = nwpData.surface_data[selectedVar] || [];
  const chartData = timestamps
    .filter((_, i) => i % 3 === 0)
    .map((t, idx) => ({
      time: new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + " " +
            new Date(t).toLocaleTimeString("en-IN", { hour: "2-digit", hour12: true }),
      value: values[idx * 3] ?? null,
    }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    return (
      <div className="custom-chart-tooltip">
        <p className="tooltip-label">{label}</p>
        <p style={{ color: activeVar.color, fontWeight: 700, margin: "2px 0" }}>
          {activeVar.label}: {payload[0]?.value?.toFixed(1)} {activeVar.unit}
        </p>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="nwp-header" style={{ marginBottom: 0 }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "1.2rem", fontWeight: 800 }}>
          🛰️ Numerical Weather Prediction — {location.name?.split(",")[0]}
        </h3>
        <span className="nwp-model-badge">GFS 0.25° Global Model</span>
      </div>

      {/* Model Overview Banner */}
      <div className="glass-card" style={{ padding: "14px 18px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
        <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          ℹ️ <strong>Global Forecast System (GFS)</strong> is NOAA's primary numerical weather model running at 25km spatial resolution.
          Updated 4 times daily (00, 06, 12, 18 UTC) to compute atmospheric variables across 64 vertical atmospheric layers.
        </p>
      </div>

      {/* Variable selector */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {variables.map((v) => (
          <button
            key={v.key}
            className={`chart-toggle ${selectedVar === v.key ? "active" : ""}`}
            onClick={() => setSelectedVar(v.key)}
            style={selectedVar === v.key ? { borderColor: v.color, color: v.color, fontWeight: 700 } : {}}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Main chart */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h4 style={{ fontSize: "0.95rem", color: activeVar.color, marginBottom: 16, fontWeight: 800 }}>
          {activeVar.label} ({activeVar.unit}) — 7-Day Numerical Forecast
        </h4>
        <div style={{ height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="nwpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={activeVar.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={activeVar.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fill: "#64748b", fontSize: 10 }}
                interval={Math.floor(chartData.length / 8)}
                angle={-20}
                textAnchor="end"
                height={50}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={activeVar.color}
                fill="url(#nwpGrad)"
                strokeWidth={2.5}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary statistics */}
      <div className="nwp-grid">
        {variables.slice(0, 4).map((v) => {
          const vals = (nwpData.surface_data[v.key] || []).filter((x) => x != null);
          const min = vals.length ? Math.min(...vals) : null;
          const max = vals.length ? Math.max(...vals) : null;
          const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : null;
          return (
            <div key={v.key} className="glass-card" style={{ padding: 18 }}>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5, marginBottom: 8 }}>
                {v.label} Range
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Min</div>
                  <div style={{ fontWeight: 800, color: "#3b82f6", fontSize: "1rem" }}>{min?.toFixed(1)} {v.unit}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Avg</div>
                  <div style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "1rem" }}>{avg?.toFixed(1)} {v.unit}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Max</div>
                  <div style={{ fontWeight: 800, color: "#f43f5e", fontSize: "1rem" }}>{max?.toFixed(1)} {v.unit}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
