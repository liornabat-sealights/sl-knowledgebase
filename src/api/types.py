from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel

from src.rag_service.types import (
    RAGDocModel,
    DocStatus as RAGDocStatus,
    RagServiceStatus,
    RAGDocs,
)


class KnowledgeBaseStatus(Enum):
    UNKNOWN = "Unknown"
    EMPTY = "Empty"
    READY = "Ready"
    NOT_READY = "Not Ready"
    INDEXING = "Indexing"


class KnowledgeBaseDocStatus(Enum):
    UNKNOWN = "Unknown"
    NOT_INDEXED = "Not Indexed"
    IN_PROGRESS = "In Progress"
    INDEXED = "Indexed"
    INDEX_FAILED = "Index Failed"


@dataclass
class KnowledgeBaseDocModel:
    id: str = field(default_factory=str)
    status: KnowledgeBaseDocStatus = KnowledgeBaseDocStatus.UNKNOWN
    file_name: str = field(default_factory=str)
    content_length: int = field(default_factory=int)
    chunks_count: int = field(default_factory=int)
    created_at: str = field(default_factory=str)
    updated_at: str = field(default_factory=str)
    error: str = field(default_factory=str)

    @classmethod
    def create_from(
        cls,
        rag_doc_model: RAGDocModel,
    ):
        status = KnowledgeBaseDocStatus.UNKNOWN
        if rag_doc_model.status in (RAGDocStatus.PENDING, RAGDocStatus.UNKNOWN):
            status = KnowledgeBaseDocStatus.NOT_INDEXED
        elif rag_doc_model.status == RAGDocStatus.PROCESSING:
            status = KnowledgeBaseDocStatus.IN_PROGRESS
        elif rag_doc_model.status == RAGDocStatus.FAILED:
            status = KnowledgeBaseDocStatus.INDEX_FAILED
        elif rag_doc_model.status == RAGDocStatus.PROCESSED:
            status = KnowledgeBaseDocStatus.INDEXED

        return cls(
            id=rag_doc_model.rag_doc_id,
            status=status,
            file_name=rag_doc_model.file_name,
            content_length=rag_doc_model.content_length,
            chunks_count=rag_doc_model.chunks_count,
            created_at=rag_doc_model.created_at,
            updated_at=rag_doc_model.updated_at,
        )


@dataclass
class KnowledgeBaseModel:
    name: str = "knowledge_base"
    status: str = "Unknown"
    docs: Dict[str, KnowledgeBaseDocModel] = field(default_factory=dict)

    @classmethod
    def create_from(
        cls,
        name: str,
        rag_service_status: RagServiceStatus,
        docs: RAGDocs,
    ):
        return cls(
            name=name,
            status=str(rag_service_status.value),
            docs={
                doc_id: KnowledgeBaseDocModel.create_from(doc)
                for doc_id, doc in docs.docs.items()
            },
        )


class QuickQuestion(BaseModel):
    """Quick question model for suggestions in the chat UI"""
    id: str
    text: str


class QuickQuestionsConfig(BaseModel):
    """Configuration for quick questions feature"""
    questions: List[QuickQuestion]
