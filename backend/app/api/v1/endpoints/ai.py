from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.entities import User, AIQueryLog
from app.permissions.deps import get_current_user
from app.services.ai_service import AttendXAIService

router = APIRouter(prefix="/ai", tags=["AttendX AI"])

class AIQueryRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=500, description="Natural language question")

class AIQueryResponse(BaseModel):
    query: str
    answer: str
    evidence: List[Dict[str, Any]]
    follow_up_questions: List[str]

@router.post("/query", response_model=AIQueryResponse)
async def query_ai(
    req: AIQueryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    AttendX AI assistant endpoint:
    Processes natural language attendance questions against authorized database records,
    strictly scopes permissions, and returns evidence-backed responses.
    """
    result = await AttendXAIService.process_query(
        query=req.query,
        user=current_user,
        db=db
    )

    # Log query
    log = AIQueryLog(
        user_id=current_user.id,
        query_text=req.query,
        response_summary=result["answer"][:255],
        evidence_used=str(result["evidence"])[:500]
    )
    db.add(log)
    await db.commit()

    return AIQueryResponse(
        query=req.query,
        answer=result["answer"],
        evidence=result["evidence"],
        follow_up_questions=result.get("follow_up_questions", [])
    )
