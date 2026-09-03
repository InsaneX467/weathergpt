"""
WeatherGPT Voice Service
Helpers for audio processing and speech utility metadata.
Actual STT/TTS runs in the browser via Web Speech API.
"""

from typing import Dict, List


# Supported languages with Web Speech API locale codes
SUPPORTED_VOICE_LANGUAGES: Dict[str, Dict[str, str]] = {
    "en": {"name": "English", "locale": "en-IN", "tts_voice": "en-IN"},
    "hi": {"name": "हिन्दी (Hindi)", "locale": "hi-IN", "tts_voice": "hi-IN"},
    "bn": {"name": "বাংলা (Bengali)", "locale": "bn-IN", "tts_voice": "bn-IN"},
    "ta": {"name": "தமிழ் (Tamil)", "locale": "ta-IN", "tts_voice": "ta-IN"},
    "te": {"name": "తెలుగు (Telugu)", "locale": "te-IN", "tts_voice": "te-IN"},
    "mr": {"name": "मराठी (Marathi)", "locale": "mr-IN", "tts_voice": "mr-IN"},
    "gu": {"name": "ગુજરાતી (Gujarati)", "locale": "gu-IN", "tts_voice": "gu-IN"},
    "kn": {"name": "ಕನ್ನಡ (Kannada)", "locale": "kn-IN", "tts_voice": "kn-IN"},
    "ml": {"name": "മലയാളം (Malayalam)", "locale": "ml-IN", "tts_voice": "ml-IN"},
    "pa": {"name": "ਪੰਜਾਬੀ (Punjabi)", "locale": "pa-IN", "tts_voice": "pa-IN"},
}


def get_supported_languages() -> List[Dict[str, str]]:
    """Return list of supported voice languages."""
    return [
        {"code": code, **info}
        for code, info in SUPPORTED_VOICE_LANGUAGES.items()
    ]


def get_voice_locale(language_code: str) -> str:
    """Get the browser Speech API locale for a language code."""
    lang = SUPPORTED_VOICE_LANGUAGES.get(language_code, SUPPORTED_VOICE_LANGUAGES["en"])
    return lang["locale"]
