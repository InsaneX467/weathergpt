"""
WeatherGPT Warning System
Evaluates weather conditions against severe thresholds and generates alerts.
"""

from typing import List, Optional, Dict, Any
from app.config import settings
from app.schemas import WeatherAlert, CurrentWeather, DailyForecast


def evaluate_current_alerts(
    current: CurrentWeather,
    location_name: Optional[str] = None
) -> List[WeatherAlert]:
    """Evaluate current conditions against severe weather thresholds."""
    alerts = []
    area = location_name or "your area"

    # High wind alert
    if current.wind_speed and current.wind_speed >= settings.WIND_SPEED_ALERT_KMH:
        severity = "extreme" if current.wind_speed >= 90 else "high" if current.wind_speed >= 70 else "moderate"
        alerts.append(WeatherAlert(
            alert_type="HIGH_WIND",
            severity=severity,
            title=f"⚠️ High Wind Warning — {current.wind_speed:.0f} km/h",
            description=f"Dangerous wind speeds of {current.wind_speed:.0f} km/h detected in {area}. "
                        f"Wind gusts up to {current.wind_gusts:.0f} km/h. "
                        "Secure loose objects, avoid outdoor activities, and stay indoors.",
            affected_area=area,
        ))

    # Heavy precipitation alert
    if current.precipitation and current.precipitation >= settings.PRECIPITATION_ALERT_MM:
        severity = "extreme" if current.precipitation >= 100 else "high" if current.precipitation >= 75 else "moderate"
        alerts.append(WeatherAlert(
            alert_type="HEAVY_RAIN",
            severity=severity,
            title=f"🌧️ Heavy Rainfall Alert — {current.precipitation:.1f} mm",
            description=f"Heavy precipitation of {current.precipitation:.1f} mm recorded in {area}. "
                        "Risk of urban flooding, waterlogging, and landslides. Exercise caution.",
            affected_area=area,
        ))

    # Heatwave alert
    if current.temperature and current.temperature >= settings.TEMPERATURE_HEATWAVE_C:
        severity = "extreme" if current.temperature >= 45 else "high" if current.temperature >= 42 else "moderate"
        alerts.append(WeatherAlert(
            alert_type="HEATWAVE",
            severity=severity,
            title=f"🔥 Heatwave Warning — {current.temperature:.1f}°C",
            description=f"Extreme heat of {current.temperature:.1f}°C in {area}. "
                        "Stay hydrated, avoid prolonged sun exposure, and check on elderly and children.",
            affected_area=area,
        ))

    # Cold wave alert
    if current.temperature is not None and current.temperature <= settings.TEMPERATURE_COLDWAVE_C:
        severity = "extreme" if current.temperature <= 0 else "high" if current.temperature <= 2 else "moderate"
        alerts.append(WeatherAlert(
            alert_type="COLD_WAVE",
            severity=severity,
            title=f"❄️ Cold Wave Alert — {current.temperature:.1f}°C",
            description=f"Very low temperature of {current.temperature:.1f}°C in {area}. "
                        "Risk of hypothermia and frostbite. Keep warm, protect crops and livestock.",
            affected_area=area,
        ))

    # Thunderstorm alert (based on weather code)
    if current.weather_code and current.weather_code >= 95:
        severity = "extreme" if current.weather_code >= 99 else "high"
        alerts.append(WeatherAlert(
            alert_type="THUNDERSTORM",
            severity=severity,
            title="⛈️ Thunderstorm Warning",
            description=f"Active thunderstorm detected in {area}. "
                        "Risk of lightning, hail, and sudden downpours. Stay indoors and away from tall structures.",
            affected_area=area,
        ))

    # Low visibility / fog
    if current.weather_code and current.weather_code in (45, 48):
        alerts.append(WeatherAlert(
            alert_type="FOG",
            severity="moderate",
            title="🌫️ Dense Fog Advisory",
            description=f"Dense fog reported in {area}. Visibility significantly reduced. "
                        "Drive slowly with fog lights. Avoid highway travel if possible.",
            affected_area=area,
        ))

    return alerts


def evaluate_forecast_alerts(
    daily: List[DailyForecast],
    location_name: Optional[str] = None
) -> List[WeatherAlert]:
    """Evaluate upcoming forecast for potential severe weather."""
    alerts = []
    area = location_name or "your area"

    for day in daily:
        # Future heavy rain
        if day.precipitation_sum and day.precipitation_sum >= 80:
            alerts.append(WeatherAlert(
                alert_type="HEAVY_RAIN_FORECAST",
                severity="high",
                title=f"🌧️ Heavy Rain Expected on {day.date}",
                description=f"Total precipitation of {day.precipitation_sum:.0f} mm expected in {area} on {day.date}. "
                            "Plan accordingly and avoid flood-prone areas.",
                affected_area=area,
                valid_from=day.date,
            ))

        # Future extreme heat
        if day.temperature_max and day.temperature_max >= settings.TEMPERATURE_HEATWAVE_C:
            alerts.append(WeatherAlert(
                alert_type="HEATWAVE_FORECAST",
                severity="high",
                title=f"🔥 Heatwave Expected on {day.date} — {day.temperature_max:.0f}°C",
                description=f"Maximum temperature of {day.temperature_max:.0f}°C forecast for {area} on {day.date}.",
                affected_area=area,
                valid_from=day.date,
            ))

        # High UV forecast
        if day.uv_index_max and day.uv_index_max >= settings.UV_INDEX_EXTREME:
            alerts.append(WeatherAlert(
                alert_type="UV_EXTREME",
                severity="high",
                title=f"☀️ Extreme UV Index on {day.date} — {day.uv_index_max:.0f}",
                description=f"UV index of {day.uv_index_max:.0f} expected in {area}. "
                            "Use SPF 50+ sunscreen, wear protective clothing, limit outdoor exposure between 10 AM – 4 PM.",
                affected_area=area,
                valid_from=day.date,
            ))

    return alerts


def evaluate_aqi_alerts(
    aqi_data: Dict[str, Any],
    location_name: Optional[str] = None
) -> List[WeatherAlert]:
    """Evaluate air quality for health alerts."""
    alerts = []
    area = location_name or "your area"
    aqi = aqi_data.get("aqi")

    if aqi is not None:
        if aqi >= 300:
            alerts.append(WeatherAlert(
                alert_type="AQI_HAZARDOUS",
                severity="extreme",
                title=f"☠️ Hazardous Air Quality — AQI {aqi:.0f}",
                description=f"Air quality is hazardous (AQI {aqi:.0f}) in {area}. "
                            "All outdoor activity should be avoided. Use N95 masks if going outside.",
                affected_area=area,
            ))
        elif aqi >= 200:
            alerts.append(WeatherAlert(
                alert_type="AQI_VERY_UNHEALTHY",
                severity="high",
                title=f"😷 Very Unhealthy Air — AQI {aqi:.0f}",
                description=f"Air quality is very unhealthy (AQI {aqi:.0f}) in {area}. "
                            "Sensitive groups should stay indoors. Limit outdoor exertion.",
                affected_area=area,
            ))
        elif aqi >= 150:
            alerts.append(WeatherAlert(
                alert_type="AQI_UNHEALTHY",
                severity="moderate",
                title=f"⚠️ Unhealthy Air Quality — AQI {aqi:.0f}",
                description=f"Air quality is unhealthy (AQI {aqi:.0f}) in {area}. "
                            "People with respiratory conditions should reduce outdoor activity.",
                affected_area=area,
            ))

    return alerts
