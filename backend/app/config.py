"""
WeatherGPT Configuration Module
Loads environment variables and defines application settings.
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables or .env file."""

    # API Keys (optional - app works without them)
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None

    # Open-Meteo base URLs (free, no API key required)
    OPEN_METEO_FORECAST_URL: str = "https://api.open-meteo.com/v1/forecast"
    OPEN_METEO_HISTORICAL_URL: str = "https://archive-api.open-meteo.com/v1/archive"
    OPEN_METEO_AIR_QUALITY_URL: str = "https://air-quality-api.open-meteo.com/v1/air-quality"
    OPEN_METEO_GEOCODING_URL: str = "https://geocoding-api.open-meteo.com/v1/search"
    OPEN_METEO_MARINE_URL: str = "https://marine-api.open-meteo.com/v1/marine"
    OPEN_METEO_FLOOD_URL: str = "https://flood-api.open-meteo.com/v1/flood"

    # GFS model specifics
    OPEN_METEO_GFS_URL: str = "https://api.open-meteo.com/v1/gfs"

    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True

    # Severe weather thresholds
    WIND_SPEED_ALERT_KMH: float = 50.0
    PRECIPITATION_ALERT_MM: float = 50.0
    TEMPERATURE_HEATWAVE_C: float = 40.0
    TEMPERATURE_COLDWAVE_C: float = 4.0
    UV_INDEX_EXTREME: float = 11.0
    AQI_HAZARDOUS: float = 300.0

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
