import { useState, useEffect } from "react";
import translations from "./utils/translations";
import { getCurrentWeather, getAirQuality } from "./utils/api";

import SidebarNav from "./components/SidebarNav";
import RightSidebar from "./components/RightSidebar";
import TopDataHeader from "./components/TopDataHeader";
import WeatherCard from "./components/WeatherCard";
import ForecastChart from "./components/ForecastChart";
import ChatInterface from "./components/ChatInterface";
import WeatherMap from "./components/WeatherMap";
import NWPViewer from "./components/NWPViewer";
import AlertsPanel from "./components/AlertsPanel";
import Advisories from "./components/Advisories";
import ClimateTrends from "./components/ClimateTrends";

export default function App() {
  const [language, setLanguage] = useState("en");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [aqi, setAqi] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const t = translations[language] || translations.en;

  const fetchLiveData = () => {
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
  };

  // Fetch weather when location changes
  useEffect(() => {
    fetchLiveData();
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
    { key: "dashboard", icon: "📊", label: t.tabs.dashboard || "Dashboard" },
    { key: "chat", icon: "💬", label: t.tabs.chat || "Chat Assistant" },
    { key: "forecast", icon: "📈", label: t.tabs.forecast || "Forecast" },
    { key: "map", icon: "🗺️", label: t.tabs.map || "Weather Map" },
    { key: "nwp", icon: "🛰️", label: t.tabs.nwp || "NWP Models" },
    { key: "alerts", icon: "🚨", label: t.tabs.alerts || "Alerts" },
    { key: "advisories", icon: "📋", label: t.tabs.advisories || "Advisories" },
    { key: "climate", icon: "📊", label: t.tabs.climate || "Climate Trends" },
  ];

  return (
    <div className="app-layout">
      {/* Mobile Header Bar */}
      <div className="mobile-header">
        <button className="mobile-menu-btn" onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}>
          ☰ Menu
        </button>
        <div className="mobile-brand">⛅ WeatherGPT</div>
      </div>

      {/* Left Navigation Sidebar */}
      <div className={`sidebar-wrapper left ${mobileSidebarOpen ? "mobile-open" : ""}`}>
        <SidebarNav
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setMobileSidebarOpen(false);
          }}
          location={location}
          setLocation={setLocation}
          language={language}
          setLanguage={setLanguage}
          onRefresh={fetchLiveData}
          loadingWeather={loadingWeather}
          t={t}
        />
      </div>

      {/* Center Main Data Representation Area */}
      <main className="main-content-area">
        {/* Prominent Global Top Data Header Search */}
        <TopDataHeader
          location={location}
          setLocation={setLocation}
          weather={weather}
          loadingWeather={loadingWeather}
          onRefresh={fetchLiveData}
          t={t}
        />
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

      {/* Right Context Sidebar */}
      <div className="sidebar-wrapper right">
        <RightSidebar
          weather={weather}
          aqi={aqi}
          location={location}
          setLocation={setLocation}
          language={language}
          t={t}
        />
      </div>
    </div>
  );
}

