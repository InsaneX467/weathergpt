"""
WeatherGPT Alerts Router
Endpoints for weather alerts and early warning evaluation.
"""

from fastapi import APIRouter, Query
from typing import Optional
from app.services.meteorological import fetch_current_and_forecast, fetch_air_quality
from app.services.warning_system import (
    evaluate_current_alerts, evaluate_forecast_alerts, evaluate_aqi_alerts
)

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("/")
async def get_alerts(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    location_name: Optional[str] = Query(None, description="Location name"),
):
    """Evaluate current and forecast conditions for weather alerts."""
    weather = await fetch_current_and_forecast(lat, lon)
    all_alerts = []

    if weather.current:
        all_alerts.extend(evaluate_current_alerts(weather.current, location_name))
    if weather.daily:
        all_alerts.extend(evaluate_forecast_alerts(weather.daily, location_name))

    # Air quality alerts
    try:
        aqi = await fetch_air_quality(lat, lon)
        aqi_dict = aqi.model_dump()
        all_alerts.extend(evaluate_aqi_alerts(aqi_dict, location_name))
    except Exception:
        pass

    return {
        "location": location_name,
        "latitude": lat,
        "longitude": lon,
        "alert_count": len(all_alerts),
        "alerts": [a.model_dump() for a in all_alerts],
    }
