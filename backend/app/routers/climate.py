"""
WeatherGPT Climate Router
Endpoints for historical climate analysis and trend detection.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.services.meteorological import fetch_historical_climate

router = APIRouter(prefix="/api/climate", tags=["Climate"])


@router.get("/history")
async def get_climate_history(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    start_year: int = Query(default=2000, ge=1940, description="Start year"),
    end_year: int = Query(default=2025, le=2026, description="End year"),
    location_name: Optional[str] = Query(None, description="Location name"),
):
    """Get historical climate data and trend analysis for a location."""
    try:
        data = await fetch_historical_climate(lat, lon, start_year, end_year)
        data["location_name"] = location_name
        data["latitude"] = lat
        data["longitude"] = lon
        return data
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch climate data: {str(e)}")
