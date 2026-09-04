import { useState } from "react";

export default function SidebarNav({
  tabs,
  activeTab,
  setActiveTab,
  location,
  language,
  setLanguage,
  onRefresh,
  loadingWeather,
  t,
}) {
  const languages = [
    { code: "en", name: "English" },
    { code: "hi", name: "हिन्दी" },
    { code: "bn", name: "বাংলা" },
    { code: "ta", name: "தமிழ்" },
    { code: "te", name: "తెలుగు" },
    { code: "mr", name: "मराठी" },
    { code: "gu", name: "ગુજરાતી" },
    { code: "kn", name: "ಕನ್ನಡ" },
    { code: "ml", name: "മലയാളം" },
    { code: "pa", name: "ਪੰਜਾਬੀ" },
  ];

  return (
    <aside className="app-sidebar left-sidebar">
      {/* TOP SECTION: Brand Header & Language Selector */}
      <div className="sidebar-top-section">
        <div className="sidebar-brand">
          <div className="logo-icon">⛅</div>
          <div className="brand-text">
            <span className="brand-title">WeatherGPT</span>
            <span className="brand-sub">AI Intelligence</span>
          </div>
        </div>

        {/* Language Button / Selector in Top Section */}
        <div className="sidebar-lang-container" style={{ marginTop: 10 }}>
          <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px", marginBottom: 4, display: "block" }}>
            🌐 LANGUAGE / भाषा
          </label>
          <select
            className="sidebar-lang-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* MIDDLE SECTION: Active Location + Navigation */}
      <div className="sidebar-middle-section" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Active Location Card Badge */}
        {location && (
          <div className="sidebar-location-badge">
            <span className="status-dot live"></span>
            <div className="location-info">
              <span className="loc-label">ACTIVE LOCATION</span>
              <span className="loc-name">{location.name.split(",")[0]}</span>
            </div>
          </div>
        )}

        {/* Vertical Navigation Menu */}
        <nav className="sidebar-nav">
          <div className="nav-group-label">NAVIGATION</div>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <span className="nav-icon">{tab.icon}</span>
                <span className="nav-text">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* BOTTOM SECTION: Sync & Status */}
      <div className="sidebar-footer">
        <button
          className="sidebar-action-btn refresh-btn"
          onClick={onRefresh}
          disabled={loadingWeather}
          title="Fetch live weather data from API"
        >
          <span className={loadingWeather ? "spinning-icon" : ""}>🔄</span>
          <span>{loadingWeather ? "Syncing..." : "Live Sync"}</span>
        </button>
      </div>
    </aside>
  );
}
