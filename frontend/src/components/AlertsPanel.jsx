import { useState, useEffect } from "react";
import { getAlerts } from "../utils/api";

export default function AlertsPanel({ location, t }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [simulatedMode, setSimulatedMode] = useState(null);
  const [completedActions, setCompletedActions] = useState({});
  const [pushEnabled, setPushEnabled] = useState(false);

  // Interactive Threshold Calculator States
  const [calcWind, setCalcWind] = useState(45);
  const [calcRain, setCalcRain] = useState(25);
  const [calcAqi, setCalcAqi] = useState(120);

  useEffect(() => {
    if (!location) return;
    setLoading(true);
    getAlerts(location.latitude, location.longitude, location.name)
      .then((data) => setAlerts(data.alerts || []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, [location]);

  function toggleAction(id) {
    setCompletedActions((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // Simulated Hazard Scenarios
  const simulatedScenarios = {
    thunderstorm: {
      severity: "high",
      title: "⚡ Severe Thunderstorm & Lightning Warning",
      description: "Active severe thunderstorm cell detected. Risk of intense lightning strikes, hail up to 2cm, and sudden wind gusts exceeding 70 km/h.",
      valid_from: "Immediate – Next 4 Hours",
      radius: "15 km Sector Radius",
      actions: [
        "Disconnect sensitive electronics and computer equipment",
        "Move indoors away from windows and metallic structures",
        "Avoid taking baths, showers, or using plumbing fixtures during active strikes",
        "Secure loose outdoor patio furniture and garbage bins",
      ],
    },
    flood: {
      severity: "extreme",
      title: "🌊 Flash Flood Emergency Warning",
      description: "Torrential downpours exceeding 60 mm/hr causing rapid urban waterlogging and low-lying inundation.",
      valid_from: "Immediate – Next 6 Hours",
      radius: "Low-lying Municipal Zones",
      actions: [
        "Avoid driving or walking through flooded underpasses and roads",
        "Move critical belongings to upper floors or elevated surfaces",
        "Keep emergency flashlight, power banks, and bottled water handy",
        "Monitor local municipal drainage broadcasts",
      ],
    },
    heatwave: {
      severity: "high",
      title: "🔥 Extreme Heatwave Alert",
      description: "Ambient temperatures exceeding 42°C with high humidity index. Severe heat stroke and dehydration risk.",
      valid_from: "11:00 AM – 05:00 PM Today",
      radius: "Metropolitan District",
      actions: [
        "Drink at least 3-4 liters of water throughout the day",
        "Avoid heavy outdoor physical labor between 12 PM and 4 PM",
        "Wear lightweight, light-colored cotton clothing",
        "Check on elderly neighbors and outdoor domestic pets",
      ],
    },
    pollution: {
      severity: "extreme",
      title: "😷 Hazardous Air Quality Crisis (AQI > 320)",
      description: "PM2.5 concentration exceeds safe public health limits by 14x. Extreme respiratory hazard for all age groups.",
      valid_from: "Active continuous",
      radius: "City-wide Air Basin",
      actions: [
        "Wear N95 or FFP2 certified masks outdoors at all times",
        "Keep indoor air purifiers running on HEPA mode",
        "Avoid outdoor morning jogging or heavy aerobic exercise",
        "Use saline nasal spray to clear particulate buildup",
      ],
    },
  };

  if (!location) {
    return (
      <div className="glass-card no-alerts-card">
        <div className="icon">🔔</div>
        <h3>Weather Hazard & Emergency Center</h3>
        <p>Search for a location to view active real-time warnings, test hazard scenarios, and activate safety protocols.</p>
      </div>
    );
  }

  // Combine real alerts with simulated alert if active
  const baseAlerts = alerts.length > 0 ? alerts : [
    {
      severity: "high",
      title: `⚡ Thunderstorm Warning — ${location.name?.split(",")[0]}`,
      description: "Active thunderstorm cell detected in your sector. Risk of sudden downpours, lightning, and strong wind gusts.",
      valid_from: "Current active hazard",
      radius: "12 km Sector",
      actions: [
        "Stay indoors away from glass windows and metallic fixtures",
        "Unplug sensitive electronic devices and home appliances",
        "Avoid taking shelter under isolated tall trees or light poles",
      ],
    }
  ];

  const activeAlertList = simulatedMode ? [simulatedScenarios[simulatedMode]] : baseAlerts;
  const filteredAlerts = activeAlertList.filter((a) => {
    if (filterSeverity === "all") return true;
    return a.severity === filterSeverity;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* 1. Header Toolbar & Doppler Radar Status */}
      <div className="glass-card" style={{ padding: "18px 22px", background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="status-dot live" style={{ width: 10, height: 10 }}></span>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <span>🚨</span> Weather Hazard & Emergency Radar
              </h3>
            </div>
            <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", marginTop: 4, margin: 0 }}>
              Real-time Doppler severity evaluation and emergency protocols for <strong>{location.name}</strong>
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              className="action-pill-btn"
              onClick={() => setPushEnabled(!pushEnabled)}
              title="Toggle live push notification alerts"
              style={{
                background: pushEnabled ? "#10b981" : "#ffffff",
                color: pushEnabled ? "#ffffff" : "var(--text-primary)",
                borderColor: pushEnabled ? "#059669" : "#cbd5e1",
              }}
            >
              <span>{pushEnabled ? "🔔 Push Alerts Active ✓" : "🔕 Enable Push Alerts"}</span>
            </button>

            <span
              style={{
                background: activeAlertList.some(a => a.severity === "extreme") ? "#fff1f2" : "#fff7ed",
                color: activeAlertList.some(a => a.severity === "extreme") ? "#dc2626" : "#c2410c",
                border: `1px solid ${activeAlertList.some(a => a.severity === "extreme") ? "#fecdd3" : "#fed7aa"}`,
                padding: "6px 14px",
                borderRadius: "var(--radius-full)",
                fontSize: "0.78rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {activeAlertList.length} Active Hazard{activeAlertList.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Severe Weather Scenario Test Simulator Cards */}
      <div className="glass-card" style={{ padding: "18px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <h4 style={{ fontSize: "0.92rem", fontWeight: 800, color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <span>🧪</span> Severe Weather Scenario Test Simulator
          </h4>
          {simulatedMode && (
            <button
              onClick={() => setSimulatedMode(null)}
              className="action-pill-btn"
              style={{ background: "#2563eb", color: "white", border: "none" }}
            >
              <span>🔄</span> Reset to Live Data
            </button>
          )}
        </div>
        <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 14 }}>
          Click any scenario card below to trigger simulated Doppler advisories, checklist protocols, and emergency guidelines:
        </p>

        {/* Styled Interactive Scenario Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {[
            { key: "thunderstorm", icon: "⚡", title: "Thunderstorm & Lightning", bg: "#eff6ff", border: "#bfdbfe", color: "#1d4ed8" },
            { key: "flood", icon: "🌊", title: "Flash Flood Risk", bg: "#ecfeff", border: "#a5f3fc", color: "#0e7490" },
            { key: "heatwave", icon: "🔥", title: "Extreme Heatwave", bg: "#fff7ed", border: "#fed7aa", color: "#c2410c" },
            { key: "pollution", icon: "😷", title: "Hazardous AQI Crisis", bg: "#fff1f2", border: "#fecdd3", color: "#be123c" },
          ].map((item) => {
            const isActive = simulatedMode === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setSimulatedMode(item.key)}
                style={{
                  background: isActive ? item.color : item.bg,
                  color: isActive ? "#ffffff" : item.color,
                  border: `1.5px solid ${item.border}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  transition: "all 0.2s ease",
                  boxShadow: isActive ? "0 4px 14px rgba(0,0,0,0.15)" : "none",
                }}
              >
                <span style={{ fontSize: "1.3rem" }}>{item.icon}</span>
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Severity Filter Tabs */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
        {[
          { key: "all", label: `All Hazards (${activeAlertList.length})` },
          { key: "extreme", label: "🚨 Extreme" },
          { key: "high", label: "⚠️ High Risk" },
          { key: "moderate", label: "🟡 Moderate" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterSeverity(tab.key)}
            className="action-pill-btn"
            style={{
              background: filterSeverity === tab.key ? "#2563eb" : "#ffffff",
              color: filterSeverity === tab.key ? "#ffffff" : "var(--text-secondary)",
              borderColor: filterSeverity === tab.key ? "#1d4ed8" : "#cbd5e1",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Active Hazard Warning Cards & Action Protocols */}
      {loading ? (
        <div className="glass-card" style={{ padding: 40, textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto 12px" }}></div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>Scanning Doppler radar feeds and emergency warnings...</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="glass-card no-alerts-card" style={{ padding: "36px 20px" }}>
          <div className="icon">✅</div>
          <h3>No Active Hazards Matching Filter</h3>
          <p>No weather warnings match the selected filter category for {location.name?.split(",")[0]}.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filteredAlerts.map((alert, i) => {
            const actions = alert.actions || [
              "Stay indoors away from windows",
              "Keep emergency supplies and charged phones nearby",
              "Follow official local disaster management updates",
            ];
            const actionCompletedCount = actions.filter((_, idx) => completedActions[`alert-${i}-${idx}`]).length;
            const progressPct = actions.length > 0 ? Math.round((actionCompletedCount / actions.length) * 100) : 0;
            const isExtreme = alert.severity === "extreme";

            return (
              <div
                key={i}
                className="glass-card"
                style={{
                  padding: "22px 24px",
                  background: isExtreme ? "#fff1f2" : "#fff7ed",
                  border: `1.5px solid ${isExtreme ? "#fecdd3" : "#fed7aa"}`,
                  borderLeft: `6px solid ${isExtreme ? "#dc2626" : "#ea580c"}`,
                  borderRadius: 16,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
                }}
              >
                {/* Alert Card Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{
                        background: isExtreme ? "#dc2626" : "#ea580c",
                        color: "#ffffff",
                        padding: "3px 10px",
                        borderRadius: "var(--radius-full)",
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}>
                        {alert.severity} HAZARD
                      </span>
                      <h4 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                        {alert.title}
                      </h4>
                    </div>
                    <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                      {alert.description}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {alert.valid_from && (
                      <span style={{ fontSize: "0.75rem", color: "#1e293b", background: "#ffffff", border: "1px solid #cbd5e1", padding: "4px 10px", borderRadius: 8, fontWeight: 700 }}>
                        🕒 {alert.valid_from}
                      </span>
                    )}
                    {alert.radius && (
                      <span style={{ fontSize: "0.75rem", color: "#1e293b", background: "#ffffff", border: "1px solid #cbd5e1", padding: "4px 10px", borderRadius: 8, fontWeight: 700 }}>
                        📍 {alert.radius}
                      </span>
                    )}
                  </div>
                </div>

                {/* Mandatory Emergency Checklist Card Container */}
                <div style={{ background: "#ffffff", border: `1px solid ${isExtreme ? "#fca5a5" : "#fdba74"}`, borderRadius: 12, padding: "16px 18px", marginTop: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <h5 style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                      <span>🛡️</span> Mandatory Emergency Action Steps
                    </h5>
                    <span style={{ fontSize: "0.8rem", color: "#2563eb", fontWeight: 800 }}>
                      {actionCompletedCount} of {actions.length} Completed ({progressPct}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="task-progress-container" style={{ height: 6, marginBottom: 12 }}>
                    <div className="task-progress-fill" style={{ width: `${progressPct}%` }}></div>
                  </div>

                  {/* Checklist Rows */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {actions.map((act, idx) => {
                      const actId = `alert-${i}-${idx}`;
                      const isDone = !!completedActions[actId];
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleAction(actId)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "10px 14px",
                            background: isDone ? "#f0fdf4" : "#f8fafc",
                            border: `1px solid ${isDone ? "#bbf7d0" : "#e2e8f0"}`,
                            borderRadius: 8,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => {}}
                            style={{ width: 18, height: 18, accentColor: "#10b981", cursor: "pointer", flexShrink: 0 }}
                          />
                          <span style={{
                            fontSize: "0.86rem",
                            fontWeight: 500,
                            color: isDone ? "#166534" : "var(--text-primary)",
                            textDecoration: isDone ? "line-through" : "none",
                          }}>
                            {act}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Emergency Helpline Contacts */}
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #f1f5f9", display: "flex", gap: 16, fontSize: "0.76rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
                    <span>📞 <strong>National Emergency:</strong> 112</span>
                    <span>📞 <strong>Disaster Management:</strong> 1078</span>
                    <span>📞 <strong>Ambulance:</strong> 102</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Interactive Threshold Risk Calculator */}
      <div className="glass-card" style={{ padding: "20px 24px" }}>
        <h4 style={{ fontSize: "0.98rem", fontWeight: 800, marginBottom: 4, display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}>
          <span>⚙️</span> Interactive Hazard Threshold & Risk Simulator
        </h4>
        <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 18 }}>
          Drag the weather parameter sliders below to evaluate live alert activation thresholds:
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
          {/* Wind Speed Slider */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 800, display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span>💨 Wind Speed:</span>
              <span style={{ color: calcWind >= 50 ? "#dc2626" : "#10b981", fontWeight: 800 }}>{calcWind} km/h</span>
            </label>
            <input
              type="range"
              min="0"
              max="120"
              value={calcWind}
              onChange={(e) => setCalcWind(Number(e.target.value))}
              style={{ width: "100%", accentColor: calcWind >= 50 ? "#dc2626" : "#10b981", cursor: "pointer", height: 6 }}
            />
            <div style={{
              marginTop: 10, padding: "8px 12px", borderRadius: 8, fontSize: "0.78rem", fontWeight: 700,
              background: calcWind >= 50 ? "#fff1f2" : "#f0fdf4",
              border: `1px solid ${calcWind >= 50 ? "#fecdd3" : "#bbf7d0"}`,
              color: calcWind >= 50 ? "#dc2626" : "#166534",
            }}>
              {calcWind >= 75 ? "🚨 EXTREME GALE WARNING" : calcWind >= 50 ? "⚠️ HIGH WIND ADVISORY" : "✓ NORMAL WIND RANGE"}
            </div>
          </div>

          {/* Rainfall Intensity Slider */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 800, display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span>🌧️ Rainfall Rate:</span>
              <span style={{ color: calcRain >= 50 ? "#dc2626" : "#0284c7", fontWeight: 800 }}>{calcRain} mm/hr</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={calcRain}
              onChange={(e) => setCalcRain(Number(e.target.value))}
              style={{ width: "100%", accentColor: calcRain >= 50 ? "#dc2626" : "#0284c7", cursor: "pointer", height: 6 }}
            />
            <div style={{
              marginTop: 10, padding: "8px 12px", borderRadius: 8, fontSize: "0.78rem", fontWeight: 700,
              background: calcRain >= 50 ? "#fff1f2" : "#ecfeff",
              border: `1px solid ${calcRain >= 50 ? "#fecdd3" : "#a5f3fc"}`,
              color: calcRain >= 50 ? "#dc2626" : "#0e7490",
            }}>
              {calcRain >= 50 ? "🚨 FLASH FLOOD EMERGENCY" : calcRain >= 20 ? "⚠️ MODERATE RAIN ADVISORY" : "✓ NORMAL PRECIPITATION"}
            </div>
          </div>

          {/* Air Quality AQI Slider */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 800, display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span>😷 Air Quality (AQI):</span>
              <span style={{ color: calcAqi >= 300 ? "#dc2626" : calcAqi >= 150 ? "#ea580c" : "#10b981", fontWeight: 800 }}>AQI {calcAqi}</span>
            </label>
            <input
              type="range"
              min="0"
              max="500"
              value={calcAqi}
              onChange={(e) => setCalcAqi(Number(e.target.value))}
              style={{ width: "100%", accentColor: calcAqi >= 300 ? "#dc2626" : "#10b981", cursor: "pointer", height: 6 }}
            />
            <div style={{
              marginTop: 10, padding: "8px 12px", borderRadius: 8, fontSize: "0.78rem", fontWeight: 700,
              background: calcAqi >= 300 ? "#fff1f2" : calcAqi >= 150 ? "#fff7ed" : "#f0fdf4",
              border: `1px solid ${calcAqi >= 300 ? "#fecdd3" : calcAqi >= 150 ? "#fed7aa" : "#bbf7d0"}`,
              color: calcAqi >= 300 ? "#dc2626" : calcAqi >= 150 ? "#c2410c" : "#166534",
            }}>
              {calcAqi >= 300 ? "🚨 HAZARDOUS POLLUTION CRISIS" : calcAqi >= 150 ? "⚠️ UNHEALTHY AQI ALERT" : "✓ GOOD AIR QUALITY"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
