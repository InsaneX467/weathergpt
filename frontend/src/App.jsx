import { useState, useEffect } from "react";
import translations from "./utils/translations";
import { getCurrentWeather, getAirQuality } from "./utils/api";

import Navbar from "./components/Navbar";
import WeatherCard from "./components/WeatherCard";
import ForecastChart from "./components/ForecastChart";
import ChatInterface from "./components/ChatInterface";
import WeatherMap from "./components/WeatherMap";
import NWPViewer from "./components/NWPViewer";
import AlertsPanel from "./components/AlertsPanel";
import Advisories from "./components/Advisories";
import ClimateTrends from "./components/ClimateTrends";
import VoiceAssist from "./components/VoiceAssist";

export default function App() {
  const [language, setLanguage] = useState("en");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [aqi, setAqi] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  const t = translations[language] || translations.en;

  // Fetch weather when location changes
  useEffect(() => {
    if (!location) return;
    setLoadingWeather(true);
    Promise.all([
      getCurrentWeather(location.latitude, location.longitude, location.name),
      getAirQuality(location.latitude, location.longitude).catch(() => null),
    ])
      .then(([weatherData, aqiData]) => {
        setWeather(weatherData);
        setAqi(aqiData);
      })
      .catch(() => {
        setWeather(null);
        setAqi(null);
      })
      .finally(() => setLoadingWeather(false));
  }, [location]);

  // Try to get user's location on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            name: "Your Location",
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => {
          // Default to New Delhi if geolocation denied
          setLocation({
            name: "New Delhi, India",
            latitude: 28.6139,
            longitude: 77.209,
          });
        }
      );
    } else {
      setLocation({
        name: "New Delhi, India",
        latitude: 28.6139,
        longitude: 77.209,
      });
    }
  }, []);

  const tabs = [
    { key: "dashboard", icon: "📊", label: t.tabs.dashboard },
    { key: "chat", icon: "💬", label: t.tabs.chat },
    { key: "forecast", icon: "📈", label: t.tabs.forecast },
    { key: "map", icon: "🗺️", label: t.tabs.map },
    { key: "nwp", icon: "🛰️", label: t.tabs.nwp },
    { key: "alerts", icon: "🚨", label: t.tabs.alerts },
    { key: "advisories", icon: "📋", label: t.tabs.advisories },
    { key: "climate", icon: "📊", label: t.tabs.climate },
  ];

  return (
    <>
      <div className="weather-bg" />

      <Navbar
        language={language}
        setLanguage={setLanguage}
        location={location}
        setLocation={setLocation}
        t={t}
      />

      <div className="tab-nav">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      <main className="main-content">
        {activeTab === "dashboard" && (
          <>
            <WeatherCard weather={weather} aqi={aqi} t={t} />
            <div style={{ marginTop: 20 }}>
              <ForecastChart weather={weather} t={t} />
            </div>
          </>
        )}

        {activeTab === "chat" && (
          <ChatInterface language={language} location={location} t={t} />
        )}

        {activeTab === "forecast" && (
          <ForecastChart weather={weather} t={t} />
        )}

        {activeTab === "map" && (
          <WeatherMap location={location} weather={weather} />
        )}

        {activeTab === "nwp" && (
          <NWPViewer location={location} />
        )}

        {activeTab === "alerts" && (
          <AlertsPanel location={location} t={t} />
        )}

        {activeTab === "advisories" && (
          <Advisories location={location} t={t} />
        )}

        {activeTab === "climate" && (
          <ClimateTrends location={location} />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: "center",
        padding: "20px 24px",
        borderTop: "1px solid var(--border-glass)",
        fontSize: "0.78rem",
        color: "var(--text-muted)",
      }}>
        <p>
          WeatherGPT — AI Weather Intelligence Platform •
          Data: Open-Meteo (GFS/ECMWF/ICON) •
          Built with FastAPI + React
        </p>
      </footer>
    </>
  );
}
