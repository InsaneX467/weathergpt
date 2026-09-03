"""
WeatherGPT Meteorological Service
Integrates with Open-Meteo APIs for weather, forecast, air quality, marine, and NWP model data.
All endpoints are free and require no API key.
"""

import httpx
from typing import Optional, Dict, Any, List
from app.config import settings
from app.schemas import (
    CurrentWeather, HourlyForecast, DailyForecast, WeatherResponse,
    AirQualityData, NWPModelData, GeocodingResult
)


WEATHER_CODE_MAP = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing rime fog",
    51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    56: "Light freezing drizzle", 57: "Dense freezing drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    66: "Light freezing rain", 67: "Heavy freezing rain",
    71: "Slight snowfall", 73: "Moderate snowfall", 75: "Heavy snowfall",
    77: "Snow grains",
    80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
    85: "Slight snow showers", 86: "Heavy snow showers",
    95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail",
}


def get_weather_description(code: Optional[int]) -> str:
    """Get human-readable weather description from WMO weather code."""
    if code is None:
        return "Unknown"
    return WEATHER_CODE_MAP.get(code, f"Code {code}")


async def geocode_location(query: str) -> List[GeocodingResult]:
    """Search for a location by name and return coordinates."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(
            settings.OPEN_METEO_GEOCODING_URL,
            params={"name": query, "count": 5, "language": "en", "format": "json"}
        )
        resp.raise_for_status()
        data = resp.json()

    results = []
    for item in data.get("results", []):
        results.append(GeocodingResult(
            name=item.get("name", ""),
            latitude=item["latitude"],
            longitude=item["longitude"],
            country=item.get("country"),
            admin1=item.get("admin1"),
            population=item.get("population"),
        ))
    return results


async def fetch_current_and_forecast(lat: float, lon: float) -> WeatherResponse:
    """Fetch current conditions, hourly (48h), and daily (7-day) forecast."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": ",".join([
            "temperature_2m", "relative_humidity_2m", "apparent_temperature",
            "surface_pressure", "wind_speed_10m", "wind_direction_10m",
            "wind_gusts_10m", "precipitation", "cloud_cover", "weather_code", "is_day"
        ]),
        "hourly": ",".join([
            "temperature_2m", "relative_humidity_2m", "precipitation_probability",
            "precipitation", "weather_code", "wind_speed_10m", "cloud_cover",
            "visibility", "uv_index"
        ]),
        "daily": ",".join([
            "temperature_2m_max", "temperature_2m_min", "precipitation_sum",
            "precipitation_probability_max", "wind_speed_10m_max", "weather_code",
            "sunrise", "sunset", "uv_index_max"
        ]),
        "timezone": "auto",
        "forecast_days": 7,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(settings.OPEN_METEO_FORECAST_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

    # Parse current weather
    cur = data.get("current", {})
    current = CurrentWeather(
        temperature=cur.get("temperature_2m"),
        feels_like=cur.get("apparent_temperature"),
        humidity=cur.get("relative_humidity_2m"),
        pressure=cur.get("surface_pressure"),
        wind_speed=cur.get("wind_speed_10m"),
        wind_direction=cur.get("wind_direction_10m"),
        wind_gusts=cur.get("wind_gusts_10m"),
        precipitation=cur.get("precipitation"),
        cloud_cover=cur.get("cloud_cover"),
        weather_code=cur.get("weather_code"),
        is_day=cur.get("is_day"),
    )

    # Parse hourly forecast (next 48 hours)
    hourly_data = data.get("hourly", {})
    hourly_times = hourly_data.get("time", [])
    hourly = []
    for i, t in enumerate(hourly_times[:48]):
        hourly.append(HourlyForecast(
            time=t,
            temperature=_safe_index(hourly_data.get("temperature_2m"), i),
            humidity=_safe_index(hourly_data.get("relative_humidity_2m"), i),
            precipitation_probability=_safe_index(hourly_data.get("precipitation_probability"), i),
            precipitation=_safe_index(hourly_data.get("precipitation"), i),
            weather_code=_safe_index(hourly_data.get("weather_code"), i),
            wind_speed=_safe_index(hourly_data.get("wind_speed_10m"), i),
            cloud_cover=_safe_index(hourly_data.get("cloud_cover"), i),
            visibility=_safe_index(hourly_data.get("visibility"), i),
            uv_index=_safe_index(hourly_data.get("uv_index"), i),
        ))

    # Parse daily forecast
    daily_data = data.get("daily", {})
    daily_dates = daily_data.get("time", [])
    daily = []
    for i, d in enumerate(daily_dates):
        daily.append(DailyForecast(
            date=d,
            temperature_max=_safe_index(daily_data.get("temperature_2m_max"), i),
            temperature_min=_safe_index(daily_data.get("temperature_2m_min"), i),
            precipitation_sum=_safe_index(daily_data.get("precipitation_sum"), i),
            precipitation_probability_max=_safe_index(daily_data.get("precipitation_probability_max"), i),
            wind_speed_max=_safe_index(daily_data.get("wind_speed_10m_max"), i),
            weather_code=_safe_index(daily_data.get("weather_code"), i),
            sunrise=_safe_index(daily_data.get("sunrise"), i),
            sunset=_safe_index(daily_data.get("sunset"), i),
            uv_index_max=_safe_index(daily_data.get("uv_index_max"), i),
        ))

    return WeatherResponse(
        latitude=data.get("latitude", lat),
        longitude=data.get("longitude", lon),
        timezone=data.get("timezone"),
        current=current,
        hourly=hourly,
        daily=daily,
    )


async def fetch_air_quality(lat: float, lon: float) -> AirQualityData:
    """Fetch current air quality data."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "european_aqi,pm10,pm2_5,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide,ozone",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(settings.OPEN_METEO_AIR_QUALITY_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

    cur = data.get("current", {})
    return AirQualityData(
        aqi=cur.get("european_aqi"),
        pm2_5=cur.get("pm2_5"),
        pm10=cur.get("pm10"),
        no2=cur.get("nitrogen_dioxide"),
        so2=cur.get("sulphur_dioxide"),
        co=cur.get("carbon_monoxide"),
        ozone=cur.get("ozone"),
    )


async def fetch_marine_data(lat: float, lon: float) -> Dict[str, Any]:
    """Fetch marine weather data (wave height, sea surface temperature, etc.)."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "wave_height,wave_direction,wave_period,wind_wave_height,swell_wave_height",
        "daily": "wave_height_max,wave_direction_dominant,wave_period_max",
        "timezone": "auto",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(settings.OPEN_METEO_MARINE_URL, params=params)
        resp.raise_for_status()
        data = resp.json()
    return data


async def fetch_gfs_model_data(lat: float, lon: float) -> NWPModelData:
    """Fetch GFS NWP model data including pressure-level variables."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": ",".join([
            "temperature_2m", "pressure_msl", "wind_speed_10m",
            "wind_direction_10m", "cloud_cover", "precipitation",
            "cape", "lifted_index"
        ]),
        "timezone": "auto",
        "forecast_days": 7,
        "models": "gfs_seamless",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(settings.OPEN_METEO_GFS_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

    hourly = data.get("hourly", {})
    return NWPModelData(
        model_name="GFS",
        surface_data={
            "temperature_2m": hourly.get("temperature_2m", []),
            "pressure_msl": hourly.get("pressure_msl", []),
            "wind_speed_10m": hourly.get("wind_speed_10m", []),
            "wind_direction_10m": hourly.get("wind_direction_10m", []),
            "cloud_cover": hourly.get("cloud_cover", []),
            "precipitation": hourly.get("precipitation", []),
            "cape": hourly.get("cape", []),
            "lifted_index": hourly.get("lifted_index", []),
        },
        timestamps=hourly.get("time", []),
    )


async def fetch_historical_climate(
    lat: float, lon: float, start_year: int = 1990, end_year: int = 2025
) -> Dict[str, Any]:
    """Fetch historical annual climate data for trend analysis."""
    yearly_temps = []
    yearly_precip = []
    years = list(range(start_year, end_year + 1))

    # Fetch in batches to avoid overwhelming the API
    async with httpx.AsyncClient(timeout=60.0) as client:
        for year in years:
            params = {
                "latitude": lat,
                "longitude": lon,
                "start_date": f"{year}-01-01",
                "end_date": f"{year}-12-31",
                "daily": "temperature_2m_mean,precipitation_sum",
                "timezone": "auto",
            }
            try:
                resp = await client.get(settings.OPEN_METEO_HISTORICAL_URL, params=params)
                resp.raise_for_status()
                data = resp.json()
                daily = data.get("daily", {})
                temps = [t for t in (daily.get("temperature_2m_mean") or []) if t is not None]
                precips = [p for p in (daily.get("precipitation_sum") or []) if p is not None]

                avg_temp = round(sum(temps) / len(temps), 2) if temps else None
                total_precip = round(sum(precips), 1) if precips else None
                yearly_temps.append(avg_temp)
                yearly_precip.append(total_precip)
            except Exception:
                yearly_temps.append(None)
                yearly_precip.append(None)

    # Calculate trends
    valid_temps = [(y, t) for y, t in zip(years, yearly_temps) if t is not None]
    temp_trend = "stable"
    if len(valid_temps) >= 5:
        first_5 = sum(t for _, t in valid_temps[:5]) / 5
        last_5 = sum(t for _, t in valid_temps[-5:]) / 5
        diff = last_5 - first_5
        if diff > 0.5:
            temp_trend = f"warming (+{diff:.1f}°C)"
        elif diff < -0.5:
            temp_trend = f"cooling ({diff:.1f}°C)"

    valid_precip = [(y, p) for y, p in zip(years, yearly_precip) if p is not None]
    precip_trend = "stable"
    if len(valid_precip) >= 5:
        first_5 = sum(p for _, p in valid_precip[:5]) / 5
        last_5 = sum(p for _, p in valid_precip[-5:]) / 5
        diff = last_5 - first_5
        if diff > 50:
            precip_trend = f"increasing (+{diff:.0f}mm)"
        elif diff < -50:
            precip_trend = f"decreasing ({diff:.0f}mm)"

    return {
        "years": years,
        "annual_temperature_avg": yearly_temps,
        "annual_precipitation_sum": yearly_precip,
        "temperature_trend": temp_trend,
        "precipitation_trend": precip_trend,
    }


async def fetch_flood_data(lat: float, lon: float) -> Dict[str, Any]:
    """Fetch river discharge forecast for flood monitoring."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": "river_discharge",
        "forecast_days": 14,
    }
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(settings.OPEN_METEO_FLOOD_URL, params=params)
            resp.raise_for_status()
            return resp.json()
    except Exception:
        return {}


def _safe_index(lst: Optional[list], idx: int):
    """Safely index a list, returning None if out of bounds."""
    if lst is None or idx >= len(lst):
        return None
    return lst[idx]
