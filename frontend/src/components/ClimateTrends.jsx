import { useState, useEffect } from "react";
import { getClimateHistory } from "../utils/api";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";

export default function ClimateTrends({ location }) {
  const [climateData, setClimateData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startYear, setStartYear] = useState(2000);
  const [endYear, setEndYear] = useState(2025);
  const [chartMode, setChartMode] = useState("temperature");

  useEffect(() => {
    if (!location) return;
    setLoading(true);
    getClimateHistory(location.latitude, location.longitude, startYear, endYear, location.name)
      .then(setClimateData)
      .catch(() => setClimateData(null))
      .finally(() => setLoading(false));
  }, [location, startYear, endYear]);

  if (!location) {
    return (
      <div className="glass-card no-alerts-card">
        <div className="icon">📊</div>
        <h3>Climate Trends</h3>
        <p>Search for a location to view historical climate data and trend analysis.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: 40, textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto 16px" }}></div>
        <p style={{ color: "var(--text-secondary)" }}>
          Analyzing {endYear - startYear + 1} years of climate data...
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: 4 }}>
          This may take a moment as we fetch historical records.
        </p>
      </div>
    );
  }

  if (!climateData) return null;

  // Build chart data
  const chartData = climateData.years.map((year, i) => ({
    year,
    temperature: climateData.annual_temperature_avg[i],
    precipitation: climateData.annual_precipitation_sum[i],
  })).filter((d) => d.temperature != null || d.precipitation != null);

  const tempTrend = climateData.temperature_trend || "stable";
  const precipTrend = climateData.precipitation_trend || "stable";

  const getTrendClass = (trend) => {
    if (trend.includes("warming") || trend.includes("increasing")) return "warming";
    if (trend.includes("cooling") || trend.includes("decreasing")) return "cooling";
    return "stable";
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    return (
      <div style={{
        background: "rgba(17, 24, 39, 0.95)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8, padding: "10px 14px", fontSize: "0.82rem",
      }}>
        <p style={{ fontWeight: 600, marginBottom: 4 }}>Year: {label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {p.value?.toFixed(1)} {p.name.includes("Temp") ? "°C" : "mm"}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="climate-header">
        <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          📊 Climate Analysis — {location.name?.split(",")[0]}
        </h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className={`trend-badge ${getTrendClass(tempTrend)}`}>
            🌡️ {tempTrend}
          </span>
          <span className={`trend-badge ${getTrendClass(precipTrend)}`}>
            🌧️ {precipTrend}
          </span>
        </div>
      </div>

      {/* Year range selector */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <div className="chart-toggle-group">
          <button className={`chart-toggle ${chartMode === "temperature" ? "active" : ""}`} onClick={() => setChartMode("temperature")}>Temperature</button>
          <button className={`chart-toggle ${chartMode === "precipitation" ? "active" : ""}`} onClick={() => setChartMode("precipitation")}>Precipitation</button>
          <button className={`chart-toggle ${chartMode === "both" ? "active" : ""}`} onClick={() => setChartMode("both")}>Combined</button>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: "auto" }}>
          <select
            className="lang-select"
            value={startYear}
            onChange={(e) => setStartYear(Number(e.target.value))}
          >
            {Array.from({ length: 36 }, (_, i) => 1990 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <span style={{ color: "var(--text-muted)" }}>to</span>
          <select
            className="lang-select"
            value={endYear}
            onChange={(e) => setEndYear(Number(e.target.value))}
          >
            {Array.from({ length: 36 }, (_, i) => 1990 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Temperature chart */}
      {(chartMode === "temperature" || chartMode === "both") && (
        <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
          <h4 style={{ fontSize: "0.9rem", color: "#f59e0b", marginBottom: 12 }}>
            🌡️ Annual Average Temperature (°C)
          </h4>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} domain={["auto", "auto"]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  name="Avg Temp (°C)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: "#f59e0b", r: 3 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Precipitation chart */}
      {(chartMode === "precipitation" || chartMode === "both") && (
        <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
          <h4 style={{ fontSize: "0.9rem", color: "#3b82f6", marginBottom: 12 }}>
            🌧️ Annual Total Precipitation (mm)
          </h4>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="precipitation"
                  name="Total Precipitation (mm)"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  opacity={0.8}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Summary statistics */}
      <div className="nwp-grid">
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
            Temperature Summary
          </div>
          {(() => {
            const temps = chartData.map((d) => d.temperature).filter(Boolean);
            const min = temps.length ? Math.min(...temps) : null;
            const max = temps.length ? Math.max(...temps) : null;
            const avg = temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length) : null;
            return (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Coolest Year</div>
                  <div style={{ fontWeight: 600, color: "#3b82f6" }}>{min?.toFixed(1)}°C</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Average</div>
                  <div style={{ fontWeight: 600 }}>{avg?.toFixed(1)}°C</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Warmest Year</div>
                  <div style={{ fontWeight: 600, color: "#f43f5e" }}>{max?.toFixed(1)}°C</div>
                </div>
              </div>
            );
          })()}
        </div>
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
            Precipitation Summary
          </div>
          {(() => {
            const precips = chartData.map((d) => d.precipitation).filter(Boolean);
            const min = precips.length ? Math.min(...precips) : null;
            const max = precips.length ? Math.max(...precips) : null;
            const avg = precips.length ? (precips.reduce((a, b) => a + b, 0) / precips.length) : null;
            return (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Driest Year</div>
                  <div style={{ fontWeight: 600, color: "#f59e0b" }}>{min?.toFixed(0)} mm</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Average</div>
                  <div style={{ fontWeight: 600 }}>{avg?.toFixed(0)} mm</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Wettest Year</div>
                  <div style={{ fontWeight: 600, color: "#06b6d4" }}>{max?.toFixed(0)} mm</div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
