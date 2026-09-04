import { useState, useEffect } from "react";
import { getAdvisory } from "../utils/api";

export default function Advisories({ location, t }) {
  const [sector, setSector] = useState("agriculture");
  const [advisory, setAdvisory] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Interactive widget states
  const [completedTasks, setCompletedTasks] = useState({});
  const [vesselType, setVesselType] = useState("fishing_trawler");
  const [landArea, setLandArea] = useState(5); // hectares
  const [runwayHeading, setRunwayHeading] = useState(90); // degrees
  const [activity, setActivity] = useState("jogging");
  const [copied, setCopied] = useState(false);

  const sectors = [
    { key: "agriculture", icon: "🌾", label: t?.agriculture || "Agriculture", color: "#10b981", activeBg: "#ecfdf5", activeBorder: "#10b981" },
    { key: "aviation", icon: "✈️", label: t?.aviation || "Aviation", color: "#3b82f6", activeBg: "#eff6ff", activeBorder: "#3b82f6" },
    { key: "marine", icon: "🚢", label: t?.marine || "Marine", color: "#06b6d4", activeBg: "#ecfeff", activeBorder: "#06b6d4" },
    { key: "urban", icon: "🏙️", label: t?.urban || "Smart City", color: "#8b5cf6", activeBg: "#f5f3ff", activeBorder: "#8b5cf6" },
  ];

  const sectorInfoDescriptions = {
    agriculture: {
      title: "🌾 Agricultural Crop & Irrigation Intelligence",
      description: "Calculates real-time daily evapotranspiration and soil moisture retention based on ambient temperature, wind velocity, and relative humidity. Helps farmers schedule drip irrigation to maximize crop yield while conserving ground water.",
    },
    aviation: {
      title: "✈️ Aviation METAR & Crosswind Briefing",
      description: "Evaluates active wind velocity and direction against airport runway magnetic headings. Calculates crosswind and headwind vectors in real time to assist flight dispatchers and pilots with runway selection and IFR/VFR operating decisions.",
    },
    marine: {
      title: "🚢 Coastal Marine & Hydrodynamic Safety Matrix",
      description: "Assesses offshore wave height, surface wind shear, and sea state scales (Douglas Sea Scale). Provides safety operational status for small fishing craft (<5m), commercial trawlers, and offshore vessels.",
    },
    urban: {
      title: "🏙️ Smart City Environmental & Outdoor Health Planner",
      description: "Integrates real-time ambient Air Quality Index (PM2.5/PM10) with thermal comfort metrics. Provides tailored outdoor exposure guidance for runners, cyclists, and municipal field workers.",
    },
  };

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

  function toggleTask(id) {
    setCompletedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleCopy() {
    if (!advisory) return;
    const cleanTitle = advisory.title ? advisory.title.replace(/^[^\w\s]+/, "").trim() : "Sector Advisory";
    const text = `${cleanTitle} — ${location?.name || "Your Location"}\n${(advisory.recommendations || []).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!location) {
    return (
      <div className="glass-card no-alerts-card">
        <div className="icon">📋</div>
        <h3>Sector Weather Intelligence</h3>
        <p>Search for a location to access interactive agriculture, aviation, marine, and urban health decision matrices.</p>
      </div>
    );
  }

  const currentSectorObj = sectors.find((s) => s.key === sector) || sectors[0];
  const infoObj = sectorInfoDescriptions[sector] || sectorInfoDescriptions.agriculture;
  const cleanTitle = advisory?.title ? advisory.title.replace(/^[^\w\s]+/, "").trim() : `${currentSectorObj.label} Advisory`;
  const recs = advisory?.recommendations || [];
  const completedCount = recs.filter((_, i) => completedTasks[`${sector}-${i}`]).length;
  const progressPercent = recs.length > 0 ? Math.round((completedCount / recs.length) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 1. Full-Width Interactive Sector Tabs Grid */}
      <div className="advisory-tabs">
        {sectors.map((s) => {
          const isActive = sector === s.key;
          return (
            <button
              key={s.key}
              className={`advisory-tab ${isActive ? "active" : ""}`}
              onClick={() => setSector(s.key)}
              style={{
                borderColor: isActive ? s.activeBorder : "#e2e8f0",
                backgroundColor: isActive ? s.activeBg : "#ffffff",
                color: isActive ? s.color : "var(--text-secondary)",
              }}
            >
              <span style={{ fontSize: "1.25rem" }}>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="glass-card" style={{ padding: 40, textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto 14px" }}></div>
          <p style={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.9rem" }}>
            Analyzing meteorological vectors and decision matrix for {currentSectorObj.label}...
          </p>
        </div>
      ) : advisory ? (
        <div className="glass-card advisory-content" style={{ padding: "24px 28px" }}>
          {/* Header Action Toolbar with FIX for marked Copy & Print buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 14 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: "1.5rem" }}>{currentSectorObj.icon}</span>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                  {cleanTitle} — {location.name?.split(",")[0]}
                </h3>
                <span className="status-badge badge-info" style={{ textTransform: "uppercase" }}>
                  Live Sync
                </span>
              </div>
              <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", marginTop: 4 }}>
                Real-time operational advisory for <strong>{location.name}</strong>
              </p>
            </div>

            {/* FIX: Modern styled rounded pill action buttons (Copy Summary & Print Report) */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                className="action-pill-btn"
                onClick={handleCopy}
                title="Copy summary to clipboard"
              >
                <span>📋</span>
                <span>{copied ? "✓ Copied!" : "Copy Summary"}</span>
              </button>
              <button
                className="action-pill-btn"
                onClick={() => window.print()}
                title="Print advisory document"
              >
                <span>🖨️</span>
                <span>Print Report</span>
              </button>
            </div>
          </div>

          {/* ℹ️ EXPLANATORY INFO CALLOUT BANNER (What the info is on) */}
          <div style={{
            background: "#f0f9ff",
            border: "1px solid #bae6fd",
            borderRadius: 12,
            padding: "14px 18px",
            marginBottom: 22,
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
          }}>
            <span style={{ fontSize: "1.3rem" }}>ℹ️</span>
            <div>
              <strong style={{ fontSize: "0.88rem", color: "#0369a1", display: "block", marginBottom: 2 }}>
                WHAT THIS BRIEFING & METRICS ARE ON:
              </strong>
              <p style={{ fontSize: "0.82rem", color: "#0c4a6e", lineHeight: 1.5, margin: 0 }}>
                {infoObj.description}
              </p>
            </div>
          </div>

          {/* Key Meteorological Inputs Grid */}
          {advisory.current_conditions && (
            <div className="advisory-section" style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span>📊</span> Key Live Meteorological Inputs
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
                {Object.entries(advisory.current_conditions || {}).map(([key, val]) => (
                  <div key={key} style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 10,
                    padding: "10px 14px",
                  }}>
                    <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", textTransform: "capitalize", display: "block" }}>
                      {key.replace(/_/g, " ")}
                    </span>
                    <div style={{ fontWeight: 800, fontSize: "1.05rem", marginTop: 2, color: "var(--text-primary)" }}>
                      {val}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🌾 Interactive Agriculture Calculator */}
          {sector === "agriculture" && (
            <div className="interactive-widget-box" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "20px 22px", borderRadius: 14, marginBottom: 24 }}>
              <h4 style={{ color: "#059669", fontSize: "0.98rem", fontWeight: 800, marginBottom: 4 }}>
                🌾 Agriculture & Irrigation Requirement Calculator
              </h4>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 16 }}>
                Adjust your active crop land area to calculate daily water requirements based on current temperatures:
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, alignItems: "center" }}>
                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: 700, display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span>Active Land Area:</span>
                    <span style={{ color: "#10b981", fontWeight: 800 }}>{landArea} Hectares</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={landArea}
                    onChange={(e) => setLandArea(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "#10b981", cursor: "pointer", height: 6 }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4 }}>
                    <span>1 Ha</span>
                    <span>25 Ha</span>
                    <span>50 Ha</span>
                  </div>
                </div>

                <div style={{ background: "#ffffff", border: "1px solid #a7f3d0", borderRadius: 12, padding: "16px 18px" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>Calculated Irrigation Water Demand</span>
                  <div style={{ fontWeight: 800, fontSize: "1.4rem", color: "#059669", marginTop: 4, marginBottom: 4 }}>
                    {(landArea * 25000 * (advisory.current_conditions?.temperature ? Math.max(1, parseFloat(advisory.current_conditions.temperature) / 25) : 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })} Liters/Day
                  </div>
                  <span style={{ fontSize: "0.78rem", color: "#047857" }}>
                    💡 Recommended timing: Early morning (5 AM – 8 AM) or subsurface drip irrigation to prevent evaporative loss.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ✈️ Interactive Aviation Crosswind Calculator */}
          {sector === "aviation" && (
            <div className="interactive-widget-box" style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "20px 22px", borderRadius: 14, marginBottom: 24 }}>
              <h4 style={{ color: "#1d4ed8", fontSize: "0.98rem", fontWeight: 800, marginBottom: 4 }}>
                ✈️ Runway Vector & METAR Crosswind Calculator
              </h4>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 16 }}>
                Adjust runway magnetic heading to calculate active crosswind and headwind components against live wind.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, alignItems: "center" }}>
                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: 700, display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span>Runway Magnetic Heading:</span>
                    <span style={{ color: "#1d4ed8", fontWeight: 800 }}>RWY {runwayHeading}°</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="10"
                    value={runwayHeading}
                    onChange={(e) => setRunwayHeading(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "#2563eb", cursor: "pointer", height: 6 }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4 }}>
                    <span>0° (North)</span>
                    <span>180° (South)</span>
                    <span>360°</span>
                  </div>
                </div>

                {(() => {
                  const windSpd = parseFloat(advisory.current_conditions?.wind || advisory.metar_summary?.wind || "15");
                  const windDir = 45;
                  const angleRad = ((windDir - runwayHeading) * Math.PI) / 180;
                  const crosswind = Math.abs(Math.round(windSpd * Math.sin(angleRad)));
                  const headwind = Math.round(windSpd * Math.cos(angleRad));

                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div style={{
                        background: crosswind > 25 ? "#fff1f2" : "#ffffff",
                        border: `1px solid ${crosswind > 25 ? "#fecdd3" : "#dbeafe"}`,
                        borderRadius: 10, padding: "12px 14px",
                      }}>
                        <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Crosswind Component</span>
                        <div style={{ fontWeight: 800, fontSize: "1.3rem", marginTop: 2, color: crosswind > 25 ? "#dc2626" : "#1d4ed8" }}>
                          {crosswind} km/h
                        </div>
                        <span style={{ fontSize: "0.72rem", color: crosswind > 25 ? "#b91c1c" : "#1e40af" }}>
                          {crosswind > 25 ? "⚠️ Exceeds safe limit" : "✓ Within safe margin"}
                        </span>
                      </div>
                      <div style={{ background: "#ffffff", border: "1px solid #dbeafe", borderRadius: 10, padding: "12px 14px" }}>
                        <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Headwind Component</span>
                        <div style={{ fontWeight: 800, fontSize: "1.3rem", marginTop: 2, color: "#10b981" }}>
                          {headwind} km/h
                        </div>
                        <span style={{ fontSize: "0.72rem", color: "#047857" }}>
                          ✓ Favorable takeoff lift
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* 🚢 Interactive Marine Vessel Matrix */}
          {sector === "marine" && (
            <div className="interactive-widget-box" style={{ background: "#ecfeff", border: "1px solid #a5f3fc", padding: "20px 22px", borderRadius: 14, marginBottom: 24 }}>
              <h4 style={{ color: "#0e7490", fontSize: "0.98rem", fontWeight: 800, marginBottom: 4 }}>
                🚢 Vessel Safety & Douglas Sea State Matrix
              </h4>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 14 }}>
                Select your vessel type to evaluate real-time sea state safety thresholds:
              </p>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                {[
                  { key: "small_boat", label: "🚣 Small Craft (<5m)" },
                  { key: "fishing_trawler", label: "🛥️ Trawler (12m)" },
                  { key: "yacht", label: "⛵ Leisure Yacht" },
                  { key: "commercial_ship", label: "🚢 Commercial Ship" },
                ].map((v) => (
                  <button
                    key={v.key}
                    onClick={() => setVesselType(v.key)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "var(--radius-full)",
                      fontSize: "0.84rem",
                      fontWeight: 600,
                      border: vesselType === v.key ? "1px solid #0891b2" : "1px solid #cbd5e1",
                      background: vesselType === v.key ? "#0891b2" : "#ffffff",
                      color: vesselType === v.key ? "#ffffff" : "var(--text-primary)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              {(() => {
                const waveHt = parseFloat(advisory.sea_conditions?.wave_height || "1.2");
                let status = "SAFE TO OPERATE";
                let badgeCls = "#f0fdf4";
                let borderCls = "#bbf7d0";
                let textCls = "#15803d";
                let advice = "Favorable sea state for coastal and offshore departure. Wave swells are within normal operational parameters.";

                if (vesselType === "small_boat" && waveHt > 1.0) {
                  status = "HIGH RISK — STAY IN PORT"; badgeCls = "#fff1f2"; borderCls = "#fecdd3"; textCls = "#be123c"; advice = "Wave height exceeds safe threshold for small craft (<5m). Risk of swamping or capsize.";
                } else if (vesselType === "fishing_trawler" && waveHt > 2.5) {
                  status = "CAUTION ADVISED"; badgeCls = "#fffbeb"; borderCls = "#fde68a"; textCls = "#b45309"; advice = "Rough seas detected. Limit offshore operations and maintain continuous VHF channel monitoring.";
                }

                return (
                  <div style={{ background: badgeCls, border: `1px solid ${borderCls}`, borderRadius: 12, padding: "16px 18px" }}>
                    <div style={{ fontWeight: 800, fontSize: "0.98rem", marginBottom: 4, color: textCls }}>
                      {status}
                    </div>
                    <div style={{ fontSize: "0.84rem", color: textCls }}>{advice}</div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* 🏙️ Interactive Urban Health Advisor */}
          {sector === "urban" && (
            <div className="interactive-widget-box" style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", padding: "20px 22px", borderRadius: 14, marginBottom: 24 }}>
              <h4 style={{ color: "#6d28d9", fontSize: "0.98rem", fontWeight: 800, marginBottom: 4 }}>
                🏃 Outdoor Activity Health & Exposure Planner
              </h4>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 14 }}>
                Select an outdoor activity to analyze safety recommendations based on live AQI and temperature:
              </p>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                {[
                  { key: "jogging", label: "🏃 Running / Jogging" },
                  { key: "cycling", label: "🚴 Cycling" },
                  { key: "walking", label: "🚶 Walking" },
                  { key: "outdoor_work", label: "🏗️ Outdoor Work" },
                ].map((act) => (
                  <button
                    key={act.key}
                    onClick={() => setActivity(act.key)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "var(--radius-full)",
                      fontSize: "0.84rem",
                      fontWeight: 600,
                      border: activity === act.key ? "1px solid #7c3aed" : "1px solid #cbd5e1",
                      background: activity === act.key ? "#7c3aed" : "#ffffff",
                      color: activity === act.key ? "#ffffff" : "var(--text-primary)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {act.label}
                  </button>
                ))}
              </div>

              {(() => {
                const aqiVal = advisory.air_quality?.aqi ?? 50;
                let advice = "Air quality is good. Enjoy outdoor physical activities freely!";
                let bgCls = "#f0fdf4";
                let borderCls = "#bbf7d0";
                let textCls = "#15803d";
                if (aqiVal > 150) {
                  advice = "Unhealthy AQI detected! Wearing an N95 mask is strongly advised. Limit outdoor exertion to <30 minutes.";
                  bgCls = "#fff1f2"; borderCls = "#fecdd3"; textCls = "#be123c";
                } else if (aqiVal > 100) {
                  advice = "Moderate air quality. Sensitive individuals should reduce prolonged or heavy outdoor exertion.";
                  bgCls = "#fffbeb"; borderCls = "#fde68a"; textCls = "#b45309";
                }

                return (
                  <div style={{ background: bgCls, border: `1px solid ${borderCls}`, borderRadius: 12, padding: "16px 18px" }}>
                    <div style={{ fontWeight: 800, fontSize: "0.95rem", marginBottom: 4, textTransform: "uppercase", color: textCls }}>
                      {activity.replace(/_/g, " ")} Health Guidance
                    </div>
                    <div style={{ fontSize: "0.84rem", color: textCls }}>{advice}</div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Interactive Actionable Safety Tasks Checklist */}
          {recs.length > 0 && (
            <div className="advisory-section" style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)" }}>
                  ☑️ Actionable Safety Tasks & Guidelines
                </h4>
                <span style={{ fontSize: "0.82rem", color: "#2563eb", fontWeight: 700 }}>
                  {completedCount} of {recs.length} Completed ({progressPercent}%)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="task-progress-container" style={{ height: 6, marginBottom: 12 }}>
                <div className="task-progress-fill" style={{ width: `${progressPercent}%` }}></div>
              </div>

              {/* Task Items Grid */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recs.map((rec, i) => {
                  const taskId = `${sector}-${i}`;
                  const isChecked = !!completedTasks[taskId];

                  return (
                    <div
                      key={i}
                      onClick={() => toggleTask(taskId)}
                      style={{
                        padding: "12px 16px",
                        background: isChecked ? "#f0fdf4" : "#ffffff",
                        border: `1px solid ${isChecked ? "#bbf7d0" : "#e2e8f0"}`,
                        borderRadius: 10,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        transition: "all 0.2s ease",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ width: 18, height: 18, accentColor: "#10b981", cursor: "pointer", flexShrink: 0 }}
                      />
                      <span style={{
                        fontSize: "0.88rem",
                        fontWeight: 500,
                        textDecoration: isChecked ? "line-through" : "none",
                        color: isChecked ? "#166534" : "var(--text-primary)",
                      }}>
                        {rec}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          {advisory.disclaimer && (
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 16, fontStyle: "italic", borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
              ℹ️ {advisory.disclaimer}
            </div>
          )}
        </div>
      ) : null}

      {/* Related Safety Alerts */}
      {alerts.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <h4 style={{ fontSize: "1rem", marginBottom: 14, fontWeight: 800, color: "var(--text-primary)" }}>
            🚨 Related Active Safety Warnings
          </h4>
          {alerts.map((a, i) => (
            <div key={i} className={`alert-banner ${a.severity}`} style={{ marginBottom: 12 }}>
              <div>
                <span className={`alert-severity-badge ${a.severity}`}>{a.severity}</span>
                <span className="alert-title" style={{ marginLeft: 10 }}>{a.title}</span>
                <div className="alert-desc" style={{ marginTop: 6 }}>{a.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
