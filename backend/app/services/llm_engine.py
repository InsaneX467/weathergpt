"""
WeatherGPT LLM Engine
Natural language query understanding with intent extraction, context-aware response generation,
and built-in meteorological fallback (works without any API key).
"""

import re
from typing import Optional, Dict, Any, List
from app.services.meteorological import (
    geocode_location, fetch_current_and_forecast,
    get_weather_description
)
from app.services.warning_system import evaluate_current_alerts, evaluate_forecast_alerts


# ─── Multilingual Translations ────────────────────────────────────

TRANSLATIONS = {
    "en": {
        "current_weather": "Current Weather in {loc}",
        "temperature": "Temperature",
        "feels_like": "Feels Like",
        "humidity": "Humidity",
        "wind": "Wind",
        "pressure": "Pressure",
        "condition": "Condition",
        "forecast": "7-Day Forecast for {loc}",
        "no_location": "I couldn't determine a location from your query. Please specify a city or place name.",
        "greeting": "Hello! I'm WeatherGPT 🌤️ — your AI weather assistant. Ask me about weather anywhere in the world! For example:\n\n• \"What's the weather in Mumbai?\"\n• \"Will it rain in Delhi tomorrow?\"\n• \"5-day forecast for London\"\n• \"Is it safe to fly from Bangalore today?\"",
        "error": "I'm having trouble fetching weather data right now. Please try again shortly.",
    },
    "hi": {
        "current_weather": "{loc} में वर्तमान मौसम",
        "temperature": "तापमान",
        "feels_like": "महसूस होता है",
        "humidity": "आर्द्रता",
        "wind": "हवा",
        "pressure": "दबाव",
        "condition": "स्थिति",
        "forecast": "{loc} के लिए 7-दिन का पूर्वानुमान",
        "no_location": "मैं आपके प्रश्न से स्थान निर्धारित नहीं कर पाया। कृपया शहर का नाम बताएं।",
        "greeting": "नमस्ते! मैं WeatherGPT 🌤️ हूं — आपका AI मौसम सहायक। मुझसे दुनिया में कहीं भी मौसम के बारे में पूछें!",
        "error": "मौसम डेटा लाने में समस्या हो रही है। कृपया कुछ देर बाद पुनः प्रयास करें।",
    },
    "bn": {
        "current_weather": "{loc}-এ বর্তমান আবহাওয়া",
        "temperature": "তাপমাত্রা",
        "feels_like": "অনুভূত হচ্ছে",
        "humidity": "আর্দ্রতা",
        "wind": "বাতাস",
        "pressure": "চাপ",
        "condition": "অবস্থা",
        "forecast": "{loc}-এর জন্য ৭ দিনের পূর্বাভাস",
        "no_location": "আমি আপনার প্রশ্ন থেকে অবস্থান নির্ধারণ করতে পারিনি। অনুগ্রহ করে শহরের নাম বলুন।",
        "greeting": "নমস্কার! আমি WeatherGPT 🌤️ — আপনার AI আবহাওয়া সহকারী।",
        "error": "আবহাওয়ার তথ্য আনতে সমস্যা হচ্ছে। অনুগ্রহ করে কিছুক্ষণ পরে আবার চেষ্টা করুন।",
    },
    "ta": {
        "current_weather": "{loc} தற்போதைய வானிலை",
        "temperature": "வெப்பநிலை",
        "feels_like": "உணர்வு",
        "humidity": "ஈரப்பதம்",
        "wind": "காற்று",
        "pressure": "அழுத்தம்",
        "condition": "நிலைமை",
        "forecast": "{loc} 7-நாள் முன்னறிவிப்பு",
        "no_location": "உங்கள் கேள்வியிலிருந்து இடத்தைக் கண்டறிய முடியவில்லை. நகரத்தின் பெயரைக் குறிப்பிடுங்கள்.",
        "greeting": "வணக்கம்! நான் WeatherGPT 🌤️ — உங்கள் AI வானிலை உதவியாளர்.",
        "error": "வானிலைத் தரவைப் பெறுவதில் சிக்கல் உள்ளது.",
    },
    "te": {
        "current_weather": "{loc}లో ప్రస్తుత వాతావరణం",
        "temperature": "ఉష్ణోగ్రత",
        "feels_like": "అనిపించే",
        "humidity": "తేమ",
        "wind": "గాలి",
        "pressure": "ఒత్తిడి",
        "condition": "పరిస్థితి",
        "forecast": "{loc} 7-రోజుల అంచనా",
        "no_location": "మీ ప్రశ్న నుండి స్థానాన్ని గుర్తించలేకపోయాను. దయచేసి నగరం పేరు చెప్పండి.",
        "greeting": "నమస్కారం! నేను WeatherGPT 🌤️ — మీ AI వాతావరణ సహాయకుడను.",
        "error": "వాతావరణ డేటాను పొందడంలో సమస్య ఉంది.",
    },
}


# ─── Intent Detection ──────────────────────────────────────────

INTENT_PATTERNS = {
    "greeting": r"\b(hello|hi|hey|namaste|namaskar|vanakkam|namaskaram|howdy)\b",
    "current_weather": r"\b(current|now|today|right now|at the moment|aaj|abhi)\b",
    "forecast": r"\b(forecast|tomorrow|next|week|days ahead|upcoming|kal|agla)\b",
    "rain": r"\b(rain|rainfall|barish|precipitation|shower|drizzle|storm|baarish|mazha)\b",
    "temperature": r"\b(temperature|temp|hot|cold|warm|heat|cool|garam|thanda|tapman)\b",
    "wind": r"\b(wind|windy|breeze|gust|hawa|cyclone|storm)\b",
    "aviation": r"\b(aviation|flight|fly|airport|metar|taf|visibility|ceiling|pilot|airline)\b",
    "agriculture": r"\b(agriculture|farm|crop|harvest|sowing|irrigation|kisan|kheti|fasal|soil|pest)\b",
    "marine": r"\b(marine|sea|ocean|wave|fishing|boat|ship|coastal|tide|samudra|machli)\b",
    "urban": r"\b(urban|city|aqi|air quality|pollution|smart city|waterlog|flood|traffic)\b",
    "climate": r"\b(climate|historical|trend|analysis|decade|annual|year|long.?term|warming|cooling)\b",
    "alert": r"\b(alert|warning|danger|severe|extreme|emergency|disaster|cyclone|flood|earthquake)\b",
}


def detect_intent(message: str) -> str:
    """Detect the primary intent from user's natural language message."""
    msg_lower = message.lower()

    # Check each pattern
    scores: Dict[str, int] = {}
    for intent, pattern in INTENT_PATTERNS.items():
        matches = re.findall(pattern, msg_lower, re.IGNORECASE)
        if matches:
            scores[intent] = len(matches)

    if not scores:
        return "current_weather"  # Default intent

    return max(scores, key=lambda k: scores[k])


def extract_location(message: str) -> Optional[str]:
    """Extract location name from the user's message."""
    msg = message.strip()

    # Patterns like "weather in Delhi", "forecast for Mumbai"
    patterns = [
        r"(?:weather|forecast|temperature|rain|climate|aqi|air quality|conditions?)\s+(?:in|for|at|of|near)\s+([A-Za-z\s\-']+)",
        r"(?:in|for|at|of|near)\s+([A-Za-z\s\-']+?)(?:\s+(?:today|tomorrow|this|next|right|now|please|weather|forecast)|\?|$)",
        r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:weather|forecast|temperature|mausam)",
        r"^([A-Z][a-z]+(?:\s+[A-Za-z]+){0,2})\s*\??$",  # Standalone city name
    ]

    for pattern in patterns:
        match = re.search(pattern, msg, re.IGNORECASE)
        if match:
            loc = match.group(1).strip().rstrip(".,!?")
            # Filter out common non-location words
            ignore_words = {"the", "my", "your", "this", "that", "please", "tell", "me", "what", "how", "is", "will", "can"}
            if loc.lower() not in ignore_words and len(loc) > 1:
                return loc

    return None


async def process_chat_message(
    message: str,
    language: str = "en",
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    location_name: Optional[str] = None,
) -> Dict[str, Any]:
    """Process a natural language chat message and return contextual weather information."""

    lang = TRANSLATIONS.get(language, TRANSLATIONS["en"])
    intent = detect_intent(message)

    # Handle greeting
    if intent == "greeting":
        return {
            "response": lang["greeting"],
            "language": language,
            "suggestions": [
                "Weather in Delhi",
                "Will it rain in Mumbai?",
                "5-day forecast for Bangalore",
                "Farmer advisory for Jaipur",
                "Aviation briefing for Chennai",
            ],
        }

    # Extract location from message
    extracted_loc = extract_location(message)
    loc_name = location_name or extracted_loc

    # Geocode if we have a location name but no coordinates
    lat, lon = latitude, longitude
    if loc_name and (lat is None or lon is None):
        try:
            results = await geocode_location(loc_name)
            if results:
                lat = results[0].latitude
                lon = results[0].longitude
                loc_name = f"{results[0].name}, {results[0].country or ''}"
        except Exception:
            pass

    # If still no location, ask for one
    if lat is None or lon is None:
        return {
            "response": lang["no_location"],
            "language": language,
            "suggestions": [
                "Weather in Mumbai",
                "Delhi forecast",
                "Kolkata temperature",
                "Chennai rain today",
            ],
        }

    try:
        # Fetch weather data
        weather = await fetch_current_and_forecast(lat, lon)
        weather.location_name = loc_name

        # Generate alerts
        alerts = []
        if weather.current:
            alerts.extend(evaluate_current_alerts(weather.current, loc_name))
        if weather.daily:
            alerts.extend(evaluate_forecast_alerts(weather.daily, loc_name))

        # Build response based on intent
        response_text = _build_response(intent, weather, alerts, lang, loc_name, language)

        # Build suggestions based on intent
        suggestions = _build_suggestions(intent, loc_name)

        return {
            "response": response_text,
            "language": language,
            "weather_data": {
                "location": loc_name,
                "latitude": lat,
                "longitude": lon,
                "current": weather.current.model_dump() if weather.current else None,
                "daily": [d.model_dump() for d in weather.daily] if weather.daily else None,
            },
            "alerts": [a.model_dump() for a in alerts] if alerts else None,
            "suggestions": suggestions,
        }

    except Exception as e:
        return {
            "response": lang["error"] + f"\n\n_Debug: {str(e)}_",
            "language": language,
        }


def _build_response(
    intent: str, weather, alerts: list, lang: dict, loc_name: Optional[str], language: str
) -> str:
    """Build a formatted weather response string based on detected intent."""
    loc_name = loc_name or "Location"
    parts = []

    cur = weather.current
    condition_desc = get_weather_description(cur.weather_code) if cur else "Unknown"

    # Current weather summary
    if intent in ("current_weather", "temperature", "rain", "wind"):
        header = lang["current_weather"].format(loc=loc_name)
        parts.append(f"### 🌍 {header}\n")
        if cur:
            parts.append(f"**{lang['condition']}:** {condition_desc}")
            parts.append(f"**{lang['temperature']}:** {cur.temperature}°C (_{lang['feels_like']}: {cur.feels_like}°C_)")
            parts.append(f"**{lang['humidity']}:** {cur.humidity}%")
            parts.append(f"**{lang['wind']}:** {cur.wind_speed} km/h")
            parts.append(f"**{lang['pressure']}:** {cur.pressure} hPa")
            if cur.precipitation and cur.precipitation > 0:
                parts.append(f"**Precipitation:** {cur.precipitation} mm")
            parts.append("")

    # Forecast
    if intent in ("forecast", "rain") and weather.daily:
        header = lang["forecast"].format(loc=loc_name)
        parts.append(f"### 📅 {header}\n")
        parts.append("| Date | Max | Min | Rain | Wind | Condition |")
        parts.append("|------|-----|-----|------|------|-----------|")
        for d in weather.daily[:7]:
            desc = get_weather_description(d.weather_code)
            rain = f"{d.precipitation_sum:.1f}mm" if d.precipitation_sum else "0mm"
            parts.append(
                f"| {d.date} | {d.temperature_max}°C | {d.temperature_min}°C | "
                f"{rain} | {d.wind_speed_max}km/h | {desc} |"
            )
        parts.append("")

    # Agriculture intent
    if intent == "agriculture" and cur:
        parts.append(f"### 🌾 Agriculture Advisory for {loc_name}\n")
        parts.append(f"**Current Temperature:** {cur.temperature}°C")
        parts.append(f"**Humidity:** {cur.humidity}%")
        parts.append(f"**Conditions:** {condition_desc}\n")
        if cur.temperature and cur.temperature > 35:
            parts.append("⚠️ **Heat Stress Alert:** High temperatures may affect crop growth. Increase irrigation frequency.")
        if cur.precipitation and cur.precipitation > 20:
            parts.append("🌧️ **Rain Alert:** Heavy rainfall detected. Delay spraying operations and ensure drainage.")
        if cur.humidity and cur.humidity > 80:
            parts.append("🍄 **Fungal Risk:** High humidity increases pest and fungal disease risk. Monitor crops closely.")
        if cur.wind_speed and cur.wind_speed > 40:
            parts.append("💨 **Wind Advisory:** High winds may damage standing crops. Provide windbreaks where possible.")
        parts.append("\n**General Advisory:** Check soil moisture before irrigation. Optimal sowing windows depend on monsoon patterns.")

    # Aviation intent
    if intent == "aviation" and cur:
        parts.append(f"### ✈️ Aviation Weather Briefing — {loc_name}\n")
        parts.append(f"**Surface Wind:** {cur.wind_speed} km/h, direction {cur.wind_direction}°")
        if cur.wind_gusts:
            parts.append(f"**Gusts:** {cur.wind_gusts} km/h")
        parts.append(f"**Visibility:** {'Good' if (not cur.weather_code or cur.weather_code < 45) else 'Reduced — ' + condition_desc}")
        parts.append(f"**Cloud Cover:** {cur.cloud_cover}%")
        parts.append(f"**Pressure (QNH):** {cur.pressure} hPa")
        parts.append(f"**Conditions:** {condition_desc}\n")
        if cur.weather_code and cur.weather_code >= 95:
            parts.append("🚫 **SIGMET:** Thunderstorm activity. Delay departure/arrival.")
        if cur.wind_gusts and cur.wind_gusts > 55:
            parts.append("⚠️ **Crosswind Advisory:** Strong gusts may affect landing. Check runway orientation.")
        parts.append("\n_Note: This is an AI-generated briefing. Always consult official METAR/TAF for operational decisions._")

    # Marine intent
    if intent == "marine" and cur:
        parts.append(f"### 🚢 Marine Weather — {loc_name}\n")
        parts.append(f"**Wind Speed:** {cur.wind_speed} km/h ({cur.wind_speed * 0.54:.1f} knots)")
        parts.append(f"**Wind Direction:** {cur.wind_direction}°")
        parts.append(f"**Conditions:** {condition_desc}")
        if cur.wind_speed and cur.wind_speed > 60:
            parts.append("\n⚠️ **Gale Warning:** Sea conditions dangerous for small vessels. Avoid venturing out.")
        elif cur.wind_speed and cur.wind_speed > 40:
            parts.append("\n⚠️ **Rough Sea Advisory:** Exercise caution for fishing operations.")
        else:
            parts.append("\n✅ **Sea Conditions:** Generally favorable for coastal activities.")

    # Urban / AQI intent
    if intent == "urban" and cur:
        parts.append(f"### 🏙️ Urban Weather & Air Quality — {loc_name}\n")
        parts.append(f"**Temperature:** {cur.temperature}°C (Feels like {cur.feels_like}°C)")
        parts.append(f"**Humidity:** {cur.humidity}%")
        parts.append(f"**Conditions:** {condition_desc}")
        if cur.temperature and cur.temperature > 38:
            parts.append("\n🔥 **Urban Heat Island Alert:** City temperatures are elevated. Stay hydrated, use cooling centers.")
        if cur.precipitation and cur.precipitation > 30:
            parts.append("\n🌊 **Waterlogging Risk:** Heavy rain may cause urban flooding in low-lying areas.")

    # Climate trend (handled differently — just prompt them)
    if intent == "climate":
        parts.append(f"### 📊 Climate Analysis for {loc_name}\n")
        parts.append("Use the **Climate Trends** tab in the dashboard for detailed historical analysis including:")
        parts.append("- Annual temperature trends (1990–2025)")
        parts.append("- Precipitation patterns")
        parts.append("- Warming/cooling trend indicators")
        parts.append(f"\nCurrent conditions: **{cur.temperature}°C**, {condition_desc}" if cur else "")

    # Alert intent
    if intent == "alert":
        if alerts:
            parts.append(f"### 🚨 Active Weather Alerts — {loc_name}\n")
            for a in alerts:
                parts.append(f"**[{a.severity.upper()}]** {a.title}")
                parts.append(f"_{a.description}_\n")
        else:
            parts.append(f"### ✅ No Active Alerts for {loc_name}\n")
            parts.append("There are currently no severe weather warnings for your area.")
            if cur:
                parts.append(f"\nCurrent conditions: **{cur.temperature}°C**, {condition_desc}")

    # Add alerts section if present and not already shown
    if alerts and intent != "alert":
        parts.append("\n---\n### 🚨 Active Alerts\n")
        for a in alerts[:3]:
            parts.append(f"**[{a.severity.upper()}]** {a.title}")

    return "\n".join(parts) if parts else f"Current conditions in {loc_name}: {cur.temperature}°C, {condition_desc}" if cur else lang["error"]


def _build_suggestions(intent: str, loc_name: Optional[str] = None) -> List[str]:
    """Generate contextual follow-up suggestions."""
    base_loc = loc_name.split(",")[0] if loc_name else "Delhi"
    suggestions = {
        "current_weather": [f"7-day forecast for {base_loc}", f"Will it rain in {base_loc}?", f"Air quality in {base_loc}"],
        "forecast": [f"Current weather in {base_loc}", f"Farmer advisory for {base_loc}", f"Climate trends for {base_loc}"],
        "rain": [f"Forecast for {base_loc}", f"Flood alerts near {base_loc}", f"Soil moisture for {base_loc}"],
        "aviation": [f"Wind conditions at {base_loc}", "Visibility forecast", "Thunderstorm alerts"],
        "agriculture": [f"Rain forecast for {base_loc}", "Soil moisture levels", "Pest risk assessment"],
        "marine": ["Wave forecast", f"Wind speed at {base_loc} coast", "Fishing advisory"],
        "urban": [f"AQI forecast for {base_loc}", "Heat index today", "Waterlogging risk"],
    }
    return suggestions.get(intent, [f"Weather in {base_loc}", f"Forecast for {base_loc}", "Show active alerts"])
