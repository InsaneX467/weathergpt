import { useState, useEffect } from "react";
import { getAdvisory } from "../utils/api";

export default function Advisories({ location, t }) {
  const [sector, setSector] = useState("agriculture");
  const [advisory, setAdvisory] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  const sectors = [
    { key: "agriculture", icon: "🌾", label: t.agriculture },
    { key: "aviation", icon: "✈️", label: t.aviation },
    { key: "marine", icon: "🚢", label: t.marine },
    { key: "urban", icon: "🏙️", label: t.urban },
  ];

  useEffect(() => {
    if (!location) return;
    setLoading(true);
    getAdvisory(location.latitude, location.longitude, sector, location.name)
      .then((data) => {
        setAdvisory(data.advisory);
        setAlerts(data.alerts || []);
      })
      .catch(() => { setAdvisory(null); setAlerts([]); })
      .finally(() => setLoading(false));
  }, [location, sector]);

  if (!location) {
    return (
      <div className="glass-card no-alerts-card">
        <div className="icon">📋</div>
        <h3>Sector Advisories</h3>
        <p>Search for a location to get agriculture, aviation, marine, and smart city advisories.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="advisory-tabs">
        {sectors.map((s) => (
          <button
            key={s.key}
            className={`advisory-tab ${sector === s.key ? "active" : ""}`}
            onClick={() => setSector(s.key)}
          >
            <span>{s.icon}</span> {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="glass-card" style={{ padding: 40, textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto 16px" }}></div>
          <p style={{ color: "var(--text-secondary)" }}>Generating {sector} advisory...</p>
        </div>
      ) : advisory ? (
        <div className="glass-card advisory-content">
          <h3 style={{ fontSize: "1.1rem", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            {sectors.find(s => s.key === sector)?.icon} {advisory.title}
          </h3>

          {/* Current conditions */}
          {advisory.current_conditions && (
            <div className="advisory-section">
              <h4>📊 Current Conditions</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
                {Object.entries(advisory.current_conditions || advisory.conditions || {}).map(([key, val]) => (
                  <div key={key} className="advisory-item success">
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
                      {key.replace(/_/g, " ")}
                    </span>
                    <div style={{ fontWeight: 600, marginTop: 2 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* METAR Summary (aviation) */}
          {advisory.metar_summary && (
            <div className="advisory-section">
              <h4>📡 METAR Summary</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
                {Object.entries(advisory.metar_summary).map(([key, val]) => (
                  <div key={key} className="advisory-item">
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
                      {key.replace(/_/g, " ")}
                    </span>
                    <div style={{ fontWeight: 600, marginTop: 2 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flight conditions */}
          {advisory.flight_conditions && (
            <div className="advisory-section">
              <h4>🛫 Flight Conditions</h4>
              <div className={`advisory-item ${advisory.flight_conditions === "VFR" ? "success" : "danger"}`}>
                <strong>{advisory.flight_conditions}</strong>
                {advisory.flight_conditions === "VFR" && " — Visual Flight Rules, standard operations"}
                {advisory.flight_conditions === "IFR" && " — Instrument Flight Rules required"}
                {advisory.flight_conditions === "LIFR" && " — Low IFR — consider delays"}
              </div>
            </div>
          )}

          {/* Sea conditions (marine) */}
          {advisory.sea_conditions && (
            <div className="advisory-section">
              <h4>🌊 Sea Conditions</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
                {Object.entries(advisory.sea_conditions).map(([key, val]) => (
                  <div key={key} className="advisory-item">
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
                      {key.replace(/_/g, " ")}
                    </span>
                    <div style={{ fontWeight: 600, marginTop: 2 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safety level (marine) */}
          {advisory.safety_level && (
            <div className="advisory-section">
              <h4>⚓ Safety Assessment</h4>
              <div className={`advisory-item ${advisory.safety_level === "safe" ? "success" : advisory.safety_level === "dangerous" ? "danger" : "warning"}`}>
                <strong style={{ textTransform: "uppercase" }}>{advisory.safety_level}</strong>
              </div>
            </div>
          )}

          {/* Fishing advisory */}
          {advisory.fishing_advisory && (
            <div className="advisory-section">
              <h4>🐟 Fishing Advisory</h4>
              <div className="advisory-item">{advisory.fishing_advisory}</div>
            </div>
          )}

          {/* Air quality (urban) */}
          {advisory.air_quality && advisory.air_quality.aqi != null && (
            <div className="advisory-section">
              <h4>😷 Air Quality</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
                <div className={`advisory-item ${advisory.air_quality.level === "Good" ? "success" : advisory.air_quality.level === "Hazardous" ? "danger" : "warning"}`}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>AQI</span>
                  <div style={{ fontWeight: 700, fontSize: "1.2rem" }}>{advisory.air_quality.aqi}</div>
                  <div style={{ fontSize: "0.78rem" }}>{advisory.air_quality.level}</div>
                </div>
                {advisory.air_quality.pm2_5 != null && (
                  <div className="advisory-item">
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>PM2.5</span>
                    <div style={{ fontWeight: 600 }}>{advisory.air_quality.pm2_5} µg/m³</div>
                  </div>
                )}
                {advisory.air_quality.pm10 != null && (
                  <div className="advisory-item">
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>PM10</span>
                    <div style={{ fontWeight: 600 }}>{advisory.air_quality.pm10} µg/m³</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Heat stress / waterlogging (urban) */}
          {advisory.heat_stress && advisory.heat_stress !== "low" && (
            <div className="advisory-section">
              <h4>🌡️ Heat Stress Index</h4>
              <div className={`advisory-item ${advisory.heat_stress === "extreme" ? "danger" : "warning"}`}>
                Heat stress level: <strong style={{ textTransform: "uppercase" }}>{advisory.heat_stress}</strong>
              </div>
            </div>
          )}

          {/* Pest risk (agriculture) */}
          {advisory.pest_risk && (
            <div className="advisory-section">
              <h4>🐛 Pest & Disease Risk</h4>
              <div className={`advisory-item ${advisory.pest_risk === "high" ? "danger" : advisory.pest_risk === "moderate" ? "warning" : "success"}`}>
                Risk Level: <strong style={{ textTransform: "uppercase" }}>{advisory.pest_risk}</strong>
              </div>
            </div>
          )}

          {/* Irrigation advice */}
          {advisory.irrigation_advice && (
            <div className="advisory-section">
              <h4>💧 Irrigation</h4>
              <div className="advisory-item success">{advisory.irrigation_advice}</div>
            </div>
          )}

          {/* Recommendations */}
          {advisory.recommendations && advisory.recommendations.length > 0 && (
            <div className="advisory-section">
              <h4>📝 Recommendations</h4>
              {advisory.recommendations.map((rec, i) => (
                <div key={i} className={`advisory-item ${rec.includes("🚫") || rec.includes("☠️") ? "danger" : rec.includes("⚠️") ? "warning" : "success"}`}>
                  {rec}
                </div>
              ))}
            </div>
          )}

          {/* Hazards (aviation) */}
          {advisory.hazards && advisory.hazards.length > 0 && (
            <div className="advisory-section">
              <h4>⚠️ Hazards</h4>
              {advisory.hazards.map((h, i) => (
                <div key={i} className="advisory-item danger">{h}</div>
              ))}
            </div>
          )}

          {/* Disclaimer */}
          {advisory.disclaimer && (
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 16, fontStyle: "italic" }}>
              {advisory.disclaimer}
            </p>
          )}
        </div>
      ) : null}

      {/* Related alerts */}
      {alerts.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h4 style={{ fontSize: "0.9rem", marginBottom: 8 }}>🚨 Related Alerts</h4>
          {alerts.map((a, i) => (
            <div key={i} className={`alert-banner ${a.severity}`}>
              <div>
                <span className={`alert-severity-badge ${a.severity}`}>{a.severity}</span>
                <span className="alert-title" style={{ marginLeft: 8 }}>{a.title}</span>
                <div className="alert-desc" style={{ marginTop: 4 }}>{a.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
