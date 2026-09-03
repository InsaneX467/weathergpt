"""
WeatherGPT Advisories Router
Sector-specific advisory generation for Agriculture, Aviation, Marine, and Urban.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.services.meteorological import (
    fetch_current_and_forecast, fetch_air_quality,
    fetch_marine_data, get_weather_description
)
from app.services.warning_system import evaluate_current_alerts

router = APIRouter(prefix="/api/advisories", tags=["Advisories"])


@router.get("/")
async def get_advisory(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    sector: str = Query(..., description="Sector: agriculture, aviation, marine, urban"),
    location_name: Optional[str] = Query(None, description="Location name"),
):
    """Generate sector-specific weather advisory."""
    sector = sector.lower()
    if sector not in ("agriculture", "aviation", "marine", "urban"):
        raise HTTPException(status_code=400, detail="Sector must be one of: agriculture, aviation, marine, urban")

    weather = await fetch_current_and_forecast(lat, lon)
    cur = weather.current
    alerts = evaluate_current_alerts(cur, location_name) if cur else []
    condition = get_weather_description(cur.weather_code) if cur else "Unknown"

    if sector == "agriculture":
        advisory = _agriculture_advisory(cur, weather.daily, condition, location_name)
    elif sector == "aviation":
        advisory = _aviation_advisory(cur, condition, location_name)
    elif sector == "marine":
        try:
            marine = await fetch_marine_data(lat, lon)
        except Exception:
            marine = {}
        advisory = _marine_advisory(cur, marine, condition, location_name)
    else:  # urban
        try:
            aqi = await fetch_air_quality(lat, lon)
            aqi_data = aqi.model_dump()
        except Exception:
            aqi_data = {}
        advisory = _urban_advisory(cur, aqi_data, condition, location_name)

    return {
        "sector": sector,
        "location_name": location_name,
        "advisory": advisory,
        "alerts": [a.model_dump() for a in alerts],
    }


def _agriculture_advisory(cur, daily, condition, loc):
    """Generate agriculture advisory."""
    advisory = {
        "title": f"🌾 Agricultural Advisory — {loc or 'Your Location'}",
        "current_conditions": {
            "temperature": f"{cur.temperature}°C" if cur and cur.temperature else "N/A",
            "humidity": f"{cur.humidity}%" if cur and cur.humidity else "N/A",
            "wind_speed": f"{cur.wind_speed} km/h" if cur and cur.wind_speed else "N/A",
            "condition": condition,
        },
        "recommendations": [],
        "crop_impact": [],
        "irrigation_advice": "",
        "pest_risk": "low",
    }

    if cur:
        # Temperature-based advice
        if cur.temperature and cur.temperature > 38:
            advisory["recommendations"].append("🔥 High heat stress — increase irrigation frequency, use mulching to conserve soil moisture")
            advisory["crop_impact"].append("Rice, wheat, and vegetables may suffer heat damage")
            advisory["irrigation_advice"] = "Irrigate during early morning or late evening to minimize evaporation"
        elif cur.temperature and cur.temperature < 10:
            advisory["recommendations"].append("❄️ Frost risk — protect seedlings with covers, delay transplanting")
            advisory["crop_impact"].append("Tender crops like tomatoes and peppers are vulnerable")
        else:
            advisory["recommendations"].append("✅ Temperature is favorable for most crops")
            advisory["irrigation_advice"] = "Maintain regular irrigation schedule based on soil moisture"

        # Humidity-based pest risk
        if cur.humidity and cur.humidity > 85:
            advisory["pest_risk"] = "high"
            advisory["recommendations"].append("🍄 High fungal disease risk — apply preventive fungicides, ensure proper drainage")
        elif cur.humidity and cur.humidity > 70:
            advisory["pest_risk"] = "moderate"
            advisory["recommendations"].append("⚠️ Moderate pest risk — monitor crops for early signs of disease")

        # Rain-based advice
        if cur.precipitation and cur.precipitation > 10:
            advisory["recommendations"].append("🌧️ Active rainfall — postpone spraying operations, check field drainage")

        # Wind-based advice
        if cur.wind_speed and cur.wind_speed > 30:
            advisory["recommendations"].append("💨 Strong winds — stake tall plants, delay aerial spraying")

    # Forecast-based sowing window
    if daily:
        rain_days = sum(1 for d in daily[:7] if d.precipitation_sum and d.precipitation_sum > 5)
        if rain_days >= 3:
            advisory["recommendations"].append(f"🌦️ {rain_days} rainy days expected this week — good for transplanting water-loving crops")
        else:
            advisory["recommendations"].append("☀️ Mostly dry week ahead — ensure adequate irrigation for newly sown crops")

    return advisory


def _aviation_advisory(cur, condition, loc):
    """Generate aviation advisory."""
    advisory = {
        "title": f"✈️ Aviation Weather Briefing — {loc or 'Your Location'}",
        "metar_summary": {},
        "flight_conditions": "VFR",
        "hazards": [],
        "recommendations": [],
    }

    if cur:
        # Build METAR-like summary
        advisory["metar_summary"] = {
            "wind": f"{cur.wind_direction or 0:03.0f}° at {cur.wind_speed or 0:.0f} km/h"
                    + (f" gusting {cur.wind_gusts:.0f}" if cur.wind_gusts and cur.wind_gusts > cur.wind_speed * 1.3 else ""),
            "visibility": "Good (>10km)" if (not cur.weather_code or cur.weather_code < 45) else f"Reduced — {condition}",
            "cloud_cover": f"{cur.cloud_cover or 0:.0f}%",
            "pressure_qnh": f"{cur.pressure or 1013:.0f} hPa",
            "temperature": f"{cur.temperature or 0:.0f}°C",
            "conditions": condition,
        }

        # Determine flight conditions
        if cur.weather_code and cur.weather_code >= 45:
            advisory["flight_conditions"] = "IFR"
            advisory["hazards"].append("Reduced visibility — IFR conditions")
        if cur.weather_code and cur.weather_code >= 95:
            advisory["flight_conditions"] = "LIFR"
            advisory["hazards"].append("⛈️ Thunderstorm activity — SIGMET conditions")

        # Wind hazards
        if cur.wind_gusts and cur.wind_gusts > 55:
            advisory["hazards"].append(f"Strong gusts: {cur.wind_gusts:.0f} km/h — crosswind landing risk")
        if cur.wind_speed and cur.wind_speed > 50:
            advisory["hazards"].append(f"High sustained winds: {cur.wind_speed:.0f} km/h")

        # Recommendations
        if advisory["flight_conditions"] == "VFR":
            advisory["recommendations"].append("✅ Visual flight conditions — standard operations permitted")
        elif advisory["flight_conditions"] == "IFR":
            advisory["recommendations"].append("⚠️ Instrument flight rules apply — IFR-rated pilots and equipment required")
        else:
            advisory["recommendations"].append("🚫 Low IFR conditions — consider delaying departure")

    advisory["disclaimer"] = "AI-generated briefing. Always consult official METAR/TAF/NOTAM for operational decisions."
    return advisory


def _marine_advisory(cur, marine_data, condition, loc):
    """Generate marine advisory."""
    advisory = {
        "title": f"🚢 Marine Weather Advisory — {loc or 'Your Location'}",
        "sea_conditions": {},
        "safety_level": "safe",
        "fishing_advisory": "",
        "recommendations": [],
    }

    # Marine-specific data
    marine_current = marine_data.get("current", {})
    wave_height = marine_current.get("wave_height")
    wave_period = marine_current.get("wave_period")
    wave_direction = marine_current.get("wave_direction")

    advisory["sea_conditions"] = {
        "wave_height": f"{wave_height:.1f} m" if wave_height else "N/A",
        "wave_period": f"{wave_period:.0f} s" if wave_period else "N/A",
        "wave_direction": f"{wave_direction:.0f}°" if wave_direction else "N/A",
        "wind_speed": f"{cur.wind_speed:.0f} km/h ({cur.wind_speed * 0.54:.1f} knots)" if cur and cur.wind_speed else "N/A",
        "wind_direction": f"{cur.wind_direction:.0f}°" if cur and cur.wind_direction else "N/A",
        "conditions": condition,
    }

    # Safety assessment
    if cur and cur.wind_speed:
        if cur.wind_speed > 75:
            advisory["safety_level"] = "dangerous"
            advisory["fishing_advisory"] = "🚫 DO NOT venture into sea. Storm warning in effect."
            advisory["recommendations"].append("All vessels should return to port immediately")
        elif cur.wind_speed > 50:
            advisory["safety_level"] = "hazardous"
            advisory["fishing_advisory"] = "⚠️ Avoid deep sea fishing. Coastal operations with extreme caution only."
            advisory["recommendations"].append("Small vessels should not venture beyond harbor limits")
        elif cur.wind_speed > 30:
            advisory["safety_level"] = "caution"
            advisory["fishing_advisory"] = "⚠️ Exercise caution. Moderate sea conditions."
            advisory["recommendations"].append("Carry safety equipment, inform coast guard of route")
        else:
            advisory["fishing_advisory"] = "✅ Sea conditions favorable for fishing operations"
            advisory["recommendations"].append("Standard safety protocols apply")

    if wave_height and wave_height > 3:
        advisory["recommendations"].append(f"High waves ({wave_height:.1f}m) — risk of capsizing for small boats")

    return advisory


def _urban_advisory(cur, aqi_data, condition, loc):
    """Generate smart city / urban advisory."""
    advisory = {
        "title": f"🏙️ Smart City Weather Advisory — {loc or 'Your Location'}",
        "conditions": {},
        "air_quality": {},
        "heat_stress": "low",
        "waterlogging_risk": "low",
        "recommendations": [],
    }

    if cur:
        advisory["conditions"] = {
            "temperature": f"{cur.temperature}°C" if cur.temperature else "N/A",
            "feels_like": f"{cur.feels_like}°C" if cur.feels_like else "N/A",
            "humidity": f"{cur.humidity}%" if cur.humidity else "N/A",
            "condition": condition,
        }

        # Heat stress index
        if cur.temperature and cur.humidity:
            if cur.temperature > 40 and cur.humidity > 50:
                advisory["heat_stress"] = "extreme"
                advisory["recommendations"].append("🔥 Extreme heat stress — activate cooling shelters, restrict outdoor labor between 11 AM - 4 PM")
            elif cur.temperature > 38:
                advisory["heat_stress"] = "high"
                advisory["recommendations"].append("⚠️ High heat stress — limit outdoor activity, ensure public water stations are operational")
            elif cur.temperature > 35:
                advisory["heat_stress"] = "moderate"
                advisory["recommendations"].append("☀️ Moderate heat — stay hydrated, take breaks in shade")

        # Waterlogging risk
        if cur.precipitation and cur.precipitation > 40:
            advisory["waterlogging_risk"] = "high"
            advisory["recommendations"].append("🌊 High waterlogging risk — avoid low-lying areas, check storm drains")
        elif cur.precipitation and cur.precipitation > 20:
            advisory["waterlogging_risk"] = "moderate"
            advisory["recommendations"].append("🌧️ Moderate waterlogging risk — traffic delays likely in flood-prone zones")

    # AQI assessment
    aqi_val = aqi_data.get("aqi")
    if aqi_val is not None:
        if aqi_val >= 300:
            aqi_level = "Hazardous"
            advisory["recommendations"].append("☠️ Hazardous air quality — schools should close outdoor activities, use N95 masks")
        elif aqi_val >= 200:
            aqi_level = "Very Unhealthy"
            advisory["recommendations"].append("😷 Very unhealthy air — sensitive groups should stay indoors")
        elif aqi_val >= 150:
            aqi_level = "Unhealthy"
            advisory["recommendations"].append("⚠️ Unhealthy air — limit prolonged outdoor exertion")
        elif aqi_val >= 100:
            aqi_level = "Moderate"
        else:
            aqi_level = "Good"

        advisory["air_quality"] = {
            "aqi": aqi_val,
            "level": aqi_level,
            "pm2_5": aqi_data.get("pm2_5"),
            "pm10": aqi_data.get("pm10"),
            "no2": aqi_data.get("no2"),
            "ozone": aqi_data.get("ozone"),
        }

    return advisory
