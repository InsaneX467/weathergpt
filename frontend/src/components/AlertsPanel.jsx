import { useState, useEffect } from "react";
import { getAlerts } from "../utils/api";

export default function AlertsPanel({ location, t }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!location) return;
    setLoading(true);
    getAlerts(location.latitude, location.longitude, location.name)
      .then((data) => setAlerts(data.alerts || []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, [location]);

  if (!location) {
    return (
      <div className="glass-card no-alerts-card">
        <div className="icon">🔔</div>
        <h3>Weather Alerts</h3>
        <p>Search for a location to check for active weather warnings and alerts.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: 40, textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto 16px" }}></div>
        <p style={{ color: "var(--text-secondary)" }}>Scanning for active alerts...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          🚨 Weather Alerts — {location.name?.split(",")[0]}
        </h3>
        <div style={{
          background: alerts.length > 0 ? "rgba(244, 63, 94, 0.15)" : "rgba(16, 185, 129, 0.15)",
          color: alerts.length > 0 ? "var(--accent-rose)" : "var(--accent-emerald)",
          padding: "4px 12px",
          borderRadius: "var(--radius-full)",
          fontSize: "0.8rem",
          fontWeight: 600,
        }}>
          {alerts.length > 0 ? `${alerts.length} Active Alert${alerts.length > 1 ? "s" : ""}` : "All Clear ✓"}
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="glass-card no-alerts-card">
          <div className="icon">✅</div>
          <h3>{t.noAlerts}</h3>
          <p>There are currently no severe weather warnings for {location.name?.split(",")[0]}.</p>
          <p style={{ marginTop: 8, color: "var(--text-muted)", fontSize: "0.82rem" }}>
            Alerts are generated automatically when conditions exceed safety thresholds for wind speed,
            precipitation, temperature, air quality, and thunderstorm activity.
          </p>
        </div>
      ) : (
        <div>
          {alerts.map((alert, i) => (
            <div key={i} className={`alert-banner ${alert.severity}`}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span className={`alert-severity-badge ${alert.severity}`}>
                    {alert.severity}
                  </span>
                  <span className="alert-title">{alert.title}</span>
                </div>
                <div className="alert-desc">{alert.description}</div>
                {alert.valid_from && (
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 6 }}>
                    Valid from: {alert.valid_from}
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="glass-card" style={{ padding: 16, marginTop: 16 }}>
            <h4 style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 8 }}>
              ℹ️ Alert Thresholds
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              <div>💨 Wind Speed: ≥ 50 km/h</div>
              <div>🌧️ Rainfall: ≥ 50 mm/hr</div>
              <div>🔥 Heatwave: ≥ 40°C</div>
              <div>❄️ Cold Wave: ≤ 4°C</div>
              <div>☀️ UV Extreme: ≥ 11</div>
              <div>😷 AQI Hazardous: ≥ 300</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
