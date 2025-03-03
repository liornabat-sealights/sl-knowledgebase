from pydantic import BaseModel

from src.api.types import KnowledgeBaseModel


class KnowledgeBaseResponse(BaseModel):
    status: str
    knowledge_base: KnowledgeBaseModel


class OperationResponse(BaseModel):
    status: str
    message: str


class TranscriptionResponse(BaseModel):
    text: str
