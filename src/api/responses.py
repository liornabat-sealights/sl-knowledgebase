from pydantic import BaseModel
from typing import Dict, List, Optional, Any, Union

from src.api.types import KnowledgeBaseModel


class KnowledgeBaseResponse(BaseModel):
    status: str
    knowledge_base: KnowledgeBaseModel


class OperationResponse(BaseModel):
    status: str
    message: str


class TranscriptionResponse(BaseModel):
    text: str


class QuickQuestionsResponse(BaseModel):
    """Response containing quick questions for the chat UI"""
    questions: List[Dict[str, str]]
