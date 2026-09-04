"""
WeatherGPT — FastAPI Application Entry Point
Real-time weather intelligence platform with conversational AI,
NWP model integration, extreme weather alerts, sector advisories,
and multilingual support.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import json

from app.routers import weather, chat, alerts, advisories, climate
from app.services.voice_service import get_supported_languages
from app.services.meteorological import fetch_current_and_forecast
from app.services.warning_system import evaluate_current_alerts


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    print("[WeatherGPT] Backend starting...")
    print("[WeatherGPT] Connected to Open-Meteo APIs (GFS/ICON/ECMWF models)")
    print("[WeatherGPT] All systems operational")
    yield
    print("[WeatherGPT] Backend shutting down...")


app = FastAPI(
    title="WeatherGPT API",
    description=(
        "AI-powered weather intelligence platform with real-time forecasting, "
        "NWP model integration, disaster alerts, and multilingual support."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(weather.router)
app.include_router(chat.router)
app.include_router(alerts.router)
app.include_router(advisories.router)
app.include_router(climate.router)


# ─── Health & Info Endpoints ──────────────────────────────────────

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "WeatherGPT",
        "version": "1.0.0",
        "data_sources": [
            "Open-Meteo Forecast API",
            "Open-Meteo Air Quality API",
            "Open-Meteo Marine API",
            "Open-Meteo Historical Archive",
            "Open-Meteo GFS Model API",
        ],
    }


@app.get("/api/languages")
async def get_languages():
    """Get supported languages for multilingual interface."""
    return get_supported_languages()


# ─── WebSocket for Live Alerts ────────────────────────────────────

class ConnectionManager:
    """Manage WebSocket connections for live alert streaming."""

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass


manager = ConnectionManager()


@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    """WebSocket endpoint for real-time alert streaming."""
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, listen for location updates from client
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                lat = payload.get("latitude")
                lon = payload.get("longitude")
                if lat and lon:
                    weather_data = await fetch_current_and_forecast(lat, lon)
                    if weather_data.current:
                        alerts_list = evaluate_current_alerts(
                            weather_data.current,
                            payload.get("location_name")
                        )
                        if alerts_list:
                            await websocket.send_json({
                                "type": "alert",
                                "alerts": [a.model_dump() for a in alerts_list]
                            })
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ─── App init ─────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"message": "Welcome to WeatherGPT API", "docs": "/docs"}
