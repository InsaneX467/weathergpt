"""
WeatherGPT Chat Router
Conversational AI endpoint for natural language weather queries.
"""

from fastapi import APIRouter
from app.schemas import ChatRequest
from app.services.llm_engine import process_chat_message

router = APIRouter(prefix="/api", tags=["Chat"])


@router.post("/chat")
async def chat(request: ChatRequest):
    """Process a natural language weather query and return contextual response."""
    result = await process_chat_message(
        message=request.message,
        language=request.language,
        latitude=request.latitude,
        longitude=request.longitude,
        location_name=request.location_name,
    )
    return result
