"""
WeatherGPT Weather Router
Endpoints for current weather, forecasts, NWP model data, and geocoding.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.services.meteorological import (
    fetch_current_and_forecast, fetch_air_quality,
    fetch_gfs_model_data, geocode_location
)

router = APIRouter(prefix="/api/weather", tags=["Weather"])


@router.get("/current")
async def get_current_weather(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    location_name: Optional[str] = Query(None, description="Location name"),
):
    """Get current weather conditions and 7-day forecast."""
    try:
        weather = await fetch_current_and_forecast(lat, lon)
        weather.location_name = location_name
        return weather.model_dump()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch weather data: {str(e)}")


@router.get("/air-quality")
async def get_air_quality(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    """Get current air quality data."""
    try:
        aqi = await fetch_air_quality(lat, lon)
        return aqi.model_dump()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch AQI data: {str(e)}")


@router.get("/nwp")
async def get_nwp_model_data(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    """Get GFS Numerical Weather Prediction model output."""
    try:
        nwp = await fetch_gfs_model_data(lat, lon)
        return nwp.model_dump()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch NWP data: {str(e)}")


@router.get("/geocode")
async def geocode(query: str = Query(..., description="Location search query")):
    """Search for a location by name."""
    try:
        results = await geocode_location(query)
        return [r.model_dump() for r in results]
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Geocoding failed: {str(e)}")
