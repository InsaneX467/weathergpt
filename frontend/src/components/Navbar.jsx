import { useState, useRef, useEffect } from "react";
import { geocodeLocation } from "../utils/api";

export default function Navbar({ language, setLanguage, location, setLocation, t }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

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
    setSearchQuery(result.name);
    setShowResults(false);
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="logo-icon">⛅</div>
        <span>WeatherGPT</span>
      </div>

      <div className="navbar-controls">
        <div className="location-search" ref={searchRef}>
          <span className="location-search-icon">📍</span>
          <input
            className="location-input"
            type="text"
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
          />
          {showResults && searchResults.length > 0 && (
            <div className="location-results">
              {searchResults.map((r, i) => (
                <div
                  key={i}
                  className="location-result-item"
                  onClick={() => selectLocation(r)}
                >
                  <span>{r.name}{r.admin1 ? `, ${r.admin1}` : ""}</span>
                  <span className="country">{r.country}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {location && (
          <div className="nav-btn active">
            <span className="status-dot live"></span>
            <span>{location.name.split(",")[0]}</span>
          </div>
        )}

        <select
          className="lang-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          {languages.map((l) => (
            <option key={l.code} value={l.code}>{l.name}</option>
          ))}
        </select>
      </div>
    </nav>
  );
}
