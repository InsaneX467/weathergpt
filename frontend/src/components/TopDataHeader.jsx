import { useState, useRef, useEffect } from "react";
import { geocodeLocation } from "../utils/api";

export default function TopDataHeader({ location, setLocation, weather, loadingWeather, onRefresh, t }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearch(value) {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await geocodeLocation(value);
        setSearchResults(results);
        setShowResults(true);
      } catch {
        setSearchResults([]);
      }
    }, 400);
  }

  function selectLocation(result) {
    setLocation({
      name: `${result.name}${result.admin1 ? ", " + result.admin1 : ""}${result.country ? ", " + result.country : ""}`,
      latitude: result.latitude,
      longitude: result.longitude,
    });
    setSearchQuery("");
    setShowResults(false);
  }

  const cur = weather?.current;

  return (
    <div className="top-data-header" style={{
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "var(--radius-lg)",
      padding: "12px 18px",
      marginBottom: 20,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
      flexWrap: "wrap",
    }}>
      {/* Prominent Global Location Search Bar */}
      <div style={{ position: "relative", flex: 1, minWidth: 260 }} ref={searchRef}>
        <div style={{ position: "relative" }}>
          <span style={{
            position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
            color: "var(--text-muted)", fontSize: "0.9rem",
          }}>🔍</span>
          <input
            type="text"
            placeholder={t?.search || "Search location globally (e.g. London, Delhi, Tokyo)..."}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            style={{
              width: "100%",
              padding: "10px 16px 10px 40px",
              borderRadius: "var(--radius-full)",
              border: "1px solid #cbd5e1",
              background: "#f8fafc",
              fontSize: "0.88rem",
              color: "var(--text-primary)",
              outline: "none",
              transition: "all 0.2s ease",
            }}
          />
        </div>

        {/* Auto-complete Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
            background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12,
            maxHeight: 240, overflowY: "auto", zIndex: 500, boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            padding: "6px 0",
          }}>
            {searchResults.map((r, i) => (
              <div
                key={i}
                onClick={() => selectLocation(r)}
                style={{
                  padding: "10px 16px", cursor: "pointer", fontSize: "0.86rem",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  borderBottom: i < searchResults.length - 1 ? "1px solid #f1f5f9" : "none",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#eff6ff"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#ffffff"}
              >
                <span><strong>{r.name}</strong>{r.admin1 ? `, ${r.admin1}` : ""}</span>
                <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>{r.country}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Location & Weather Quick Status Badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {location && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8, background: "#eff6ff",
            border: "1px solid #dbeafe", padding: "6px 14px", borderRadius: "var(--radius-full)",
            fontSize: "0.82rem", fontWeight: 700, color: "var(--accent-blue)",
          }}>
            <span className="status-dot live"></span>
            <span>📍 {location.name.split(",")[0]}</span>
          </div>
        )}

        {cur && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6, background: "#f8fafc",
            border: "1px solid #e2e8f0", padding: "6px 14px", borderRadius: "var(--radius-full)",
            fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)",
          }}>
            <span>🌡️ {cur.temperature != null ? Math.round(cur.temperature) : "--"}°C</span>
            <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>•</span>
            <span>💨 {cur.wind_speed} km/h</span>
          </div>
        )}

        <button
          onClick={onRefresh}
          disabled={loadingWeather}
          style={{
            padding: "7px 14px", borderRadius: "var(--radius-full)", border: "1px solid #cbd5e1",
            background: "#ffffff", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6, color: "var(--text-primary)",
            transition: "all 0.2s ease",
          }}
        >
          <span className={loadingWeather ? "spinning-icon" : ""}>🔄</span>
          <span>{loadingWeather ? "Syncing..." : "Sync"}</span>
        </button>
      </div>
    </div>
  );
}
