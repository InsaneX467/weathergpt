"""
WeatherGPT Pydantic Schemas
Data models for API requests and responses.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ─── Request Schemas ──────────────────────────────────────────────

class ChatRequest(BaseModel):
    """User chat message request."""
    message: str = Field(..., description="User's natural language query")
    language: str = Field(default="en", description="ISO language code")
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None


class WeatherRequest(BaseModel):
    """Weather data request for a specific location."""
    latitude: float
    longitude: float
    location_name: Optional[str] = None


class ClimateRequest(BaseModel):
    """Historical climate data request."""
    latitude: float
    longitude: float
    start_year: int = Field(default=1990, ge=1940)
    end_year: int = Field(default=2025, le=2026)
    location_name: Optional[str] = None


class AdvisoryRequest(BaseModel):
    """Sector-specific advisory request."""
    latitude: float
    longitude: float
    sector: str = Field(..., description="One of: agriculture, aviation, marine, urban")
    location_name: Optional[str] = None


class GeocodingRequest(BaseModel):
    """Geocoding search request."""
    query: str


# ─── Response Schemas ─────────────────────────────────────────────

class CurrentWeather(BaseModel):
    """Current weather conditions."""
    temperature: Optional[float] = None
    feels_like: Optional[float] = None
    humidity: Optional[float] = None
    pressure: Optional[float] = None
    wind_speed: Optional[float] = None
    wind_direction: Optional[float] = None
    wind_gusts: Optional[float] = None
    precipitation: Optional[float] = None
    cloud_cover: Optional[float] = None
    visibility: Optional[float] = None
    uv_index: Optional[float] = None
    weather_code: Optional[int] = None
    is_day: Optional[int] = None


class HourlyForecast(BaseModel):
    """Single hourly forecast entry."""
    time: str
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    precipitation_probability: Optional[float] = None
    precipitation: Optional[float] = None
    weather_code: Optional[int] = None
    wind_speed: Optional[float] = None
    cloud_cover: Optional[float] = None
    visibility: Optional[float] = None
    uv_index: Optional[float] = None


class DailyForecast(BaseModel):
    """Single daily forecast entry."""
    date: str
    temperature_max: Optional[float] = None
    temperature_min: Optional[float] = None
    precipitation_sum: Optional[float] = None
    precipitation_probability_max: Optional[float] = None
    wind_speed_max: Optional[float] = None
    weather_code: Optional[int] = None
    sunrise: Optional[str] = None
    sunset: Optional[str] = None
    uv_index_max: Optional[float] = None


class WeatherResponse(BaseModel):
    """Full weather response including current, hourly, and daily data."""
    location_name: Optional[str] = None
    latitude: float
    longitude: float
    timezone: Optional[str] = None
    current: Optional[CurrentWeather] = None
    hourly: Optional[List[HourlyForecast]] = None
    daily: Optional[List[DailyForecast]] = None


class AirQualityData(BaseModel):
    """Air quality index data."""
    aqi: Optional[float] = None
    pm2_5: Optional[float] = None
    pm10: Optional[float] = None
    no2: Optional[float] = None
    so2: Optional[float] = None
    co: Optional[float] = None
    ozone: Optional[float] = None


class WeatherAlert(BaseModel):
    """Severe weather alert."""
    alert_type: str
    severity: str  # low, moderate, high, extreme
    title: str
    description: str
    affected_area: Optional[str] = None
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None


class NWPModelData(BaseModel):
    """Numerical Weather Prediction model output."""
    model_config = {"protected_namespaces": ()}

    model_name: str  # GFS, ICON, etc.
    pressure_levels: Optional[Dict[str, Any]] = None
    surface_data: Optional[Dict[str, Any]] = None
    timestamps: Optional[List[str]] = None


class ChatResponse(BaseModel):
    """Chat assistant response."""
    response: str
    language: str = "en"
    weather_data: Optional[Dict[str, Any]] = None
    alerts: Optional[List[WeatherAlert]] = None
    suggestions: Optional[List[str]] = None


class AdvisoryResponse(BaseModel):
    """Sector-specific advisory response."""
    sector: str
    location_name: Optional[str] = None
    advisory: Dict[str, Any]
    alerts: Optional[List[WeatherAlert]] = None


class ClimateResponse(BaseModel):
    """Historical climate analysis response."""
    location_name: Optional[str] = None
    latitude: float
    longitude: float
    years: List[int]
    annual_temperature_avg: List[Optional[float]]
    annual_precipitation_sum: List[Optional[float]]
    temperature_trend: Optional[str] = None
    precipitation_trend: Optional[str] = None


class GeocodingResult(BaseModel):
    """Single geocoding result."""
    name: str
    latitude: float
    longitude: float
    country: Optional[str] = None
    admin1: Optional[str] = None  # state/province
    population: Optional[int] = None
