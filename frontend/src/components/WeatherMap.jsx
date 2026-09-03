import { useEffect, useRef } from "react";
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
  const center = location
    ? [location.latitude, location.longitude]
    : [20.5937, 78.9629]; // Default to India

  const weatherLayers = [
    {
      name: "Temperature",
      url: "https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=demo",
      active: false,
    },
    {
      name: "Precipitation",
      url: "https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=demo",
      active: false,
    },
  ];

  const cur = weather?.current;
  const emoji = cur?.weather_code != null ? getEmoji(cur.weather_code) : "📍";

  return (
    <div>
      <div className="map-controls">
        <div className="nav-btn active">
          <span className="status-dot live"></span>
          <span>Live Map</span>
        </div>
        {location && (
          <div className="nav-btn">
            📍 {location.name?.split(",")[0]} ({center[0].toFixed(2)}°, {center[1].toFixed(2)}°)
          </div>
        )}
      </div>

      <div className="map-container">
        <MapContainer
          center={center}
          zoom={location ? 8 : 5}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
        >
          <MapUpdater center={center} />
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {location && (
            <Marker position={center}>
              <Popup>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13 }}>
                  <strong>{location.name}</strong>
                  {cur && (
                    <div style={{ marginTop: 4 }}>
                      <div>{emoji} {cur.temperature}°C</div>
                      <div>💨 {cur.wind_speed} km/h</div>
                      <div>💧 {cur.humidity}%</div>
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
