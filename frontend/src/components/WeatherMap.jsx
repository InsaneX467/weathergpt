import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 8, { animate: true });
    }
  }, [center, map]);
  return null;
}

export default function WeatherMap({ location, weather }) {
  const [mapStyle, setMapStyle] = useState("osm"); // 'osm', 'satellite', 'voyager'

  const center = location
    ? [location.latitude, location.longitude]
    : [20.5937, 78.9629]; // Default to India

  const cur = weather?.current;
  const emoji = cur?.weather_code != null ? getEmoji(cur.weather_code) : "📍";

  // Map Tile Layers without API key requirements
  const tileLayers = {
    osm: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      name: "🗺️ Standard Map",
    },
    voyager: {
      url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      name: "🌤️ Light Voyager",
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      name: "🛰️ Satellite View",
    },
  };

  const activeTile = tileLayers[mapStyle] || tileLayers.osm;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
      {/* Map Control Bar & Tile Switchers */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="status-dot live"></span>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
            Interactive Doppler Weather Radar & Map
          </h3>
        </div>

        {/* Map Layer Switcher Tabs */}
        <div style={{ display: "flex", gap: 6, background: "#f1f5f9", padding: 4, borderRadius: 10 }}>
          {Object.entries(tileLayers).map(([key, item]) => (
            <button
              key={key}
              onClick={() => setMapStyle(key)}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                fontSize: "0.8rem",
                fontWeight: mapStyle === key ? 700 : 500,
                border: "none",
                background: mapStyle === key ? "#ffffff" : "transparent",
                color: mapStyle === key ? "var(--accent-blue)" : "var(--text-secondary)",
                boxShadow: mapStyle === key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="glass-card" style={{ position: "relative", height: "600px", width: "100%", overflow: "hidden", borderRadius: 16 }}>
        {/* Floating Weather Stats Badge Overlay */}
        {location && (
          <div
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              zIndex: 1000,
              background: "rgba(255, 255, 255, 0.92)",
              backdropFilter: "blur(8px)",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "10px 14px",
              boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ fontSize: "2rem" }}>{emoji}</span>
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--text-primary)" }}>
                {location.name.split(",")[0]}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 2 }}>
                {cur?.temperature != null ? `${cur.temperature}°C` : "--"} • Wind {cur?.wind_speed != null ? `${cur.wind_speed} km/h` : "--"} • Humidity {cur?.humidity != null ? `${cur.humidity}%` : "--"}
              </div>
            </div>
          </div>
        )}

        <MapContainer
          center={center}
          zoom={location ? 9 : 5}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
        >
          <MapUpdater center={center} />
          <TileLayer
            key={mapStyle}
            attribution={activeTile.attribution}
            url={activeTile.url}
          />
          {location && (
            <Marker position={center}>
              <Popup>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, padding: 2 }}>
                  <strong style={{ fontSize: 14, color: "#0f172a" }}>📍 {location.name}</strong>
                  {cur && (
                    <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                      <div>{emoji} <strong>Temp:</strong> {cur.temperature}°C (Feels {cur.feels_like}°C)</div>
                      <div>💨 <strong>Wind:</strong> {cur.wind_speed} km/h ({cur.wind_direction}°)</div>
                      <div>💧 <strong>Humidity:</strong> {cur.humidity}%</div>
                      <div>📉 <strong>Pressure:</strong> {cur.pressure} hPa</div>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}

function getEmoji(code) {
  const map = {
    0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️", 48: "🌫️",
    51: "🌦️", 53: "🌦️", 55: "🌧️", 61: "🌧️", 63: "🌧️", 65: "🌧️",
    71: "❄️", 73: "❄️", 75: "❄️", 80: "🌦️", 81: "🌧️", 82: "⛈️",
    95: "⛈️", 96: "⛈️", 99: "⛈️",
  };
  return map[code] || "🌡️";
}
