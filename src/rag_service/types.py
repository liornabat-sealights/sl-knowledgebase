import asyncio
import hashlib
import os
import time
from enum import Enum
import aiofiles
from pydantic import BaseModel, Field, RootModel
from typing import Optional, Dict

from src.rag_service.lightrag import QueryParam


class RagServiceStatus(Enum):
    UNKNOWN = "Unknown"
    INIT = "Init"
    READY = "Ready"
    NOT_READY = "Not Ready"
    UPDATING = "Updating"
    INDEXING = "Indexing"


class DocStatus(str, Enum):
    """Document processing status"""

    UNKNOWN = "unknown"
    PENDING = "pending"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"


class RAGDocModel(BaseModel):
    """Class representing merged document data from SourceDocModel and DocProcessingStatus"""

    # Fields from SourceDocModel
    file_name: Optional[str] = Field(
        None, title="FileName", description="Name of the file"
    )
    file_path: Optional[str] = Field(
        None, title="FilePath", description="Path of the file"
    )
    rag_doc_id: str = Field(..., title="RagDocId", description="Rag Document Id")
    content_length: Optional[int] = Field(
        None, title="ContentLength", description="Total length of document"
    )
    status: DocStatus = Field(
        DocStatus.UNKNOWN, title="Status", description="Current processing status"
    )
    created_at: Optional[str] = Field(
        None, title="CreatedAt", description="Created at timestamp"
    )
    updated_at: Optional[str] = Field(
        None, title="UpdatedAt", description="Updated at timestamp"
    )
    chunks_count: Optional[int] = Field(
        None,
        title="ChunksCount",
        description="Number of chunks after splitting, used for processing",
    )
    error: Optional[str] = Field(
        None, title="Error", description="Error message if failed"
    )
    metadata: Optional[dict] = Field(
        None, title="Metadata", description="Additional metadata"
    )


class RAGDocs(BaseModel):
    docs: Dict[str, RAGDocModel] = Field(
        default_factory=dict, title="Docs", description="Merged documents"
    )

    async def add_doc(self, full_file_path: str, content: str) -> None:
        cleaned_content = content.strip().replace("\x00", "")
        rag_doc_id = "doc-" + hashlib.md5(cleaned_content.encode()).hexdigest()
        if rag_doc_id in self.docs:
            return
        try:
            async with aiofiles.open(full_file_path, "w", encoding="utf8") as file:
                await file.write(content)
            rag_doc = RAGDocModel(
                file_name=os.path.basename(full_file_path),
                file_path=full_file_path,
                rag_doc_id=rag_doc_id,
                status=DocStatus.PENDING,
                content_length=len(content),
                created_at=time.strftime("%Y-%m-%d %H:%M:%S"),
                updated_at=time.strftime("%Y-%m-%d %H:%M:%S"),
            )
            self.docs[rag_doc_id] = rag_doc
        except Exception as e:
            raise Exception(f"Error adding document {full_file_path}: {e}")

    def get_doc_id_by_file_path(self, file_path: str) -> str | None:
        for doc_id, doc in self.docs.items():
            if doc.file_path == file_path:
                return doc_id
        return None

    def doc_id_exists(self, doc_id: str) -> bool:
        return doc_id in self.docs

    async def remove_doc_with_file_name(self, full_file_path: str) -> str | None:
        doc_id = self.get_doc_id_by_file_path(full_file_path)
        try:
            if doc_id:
                os.remove(full_file_path)
                del self.docs[doc_id]
                return doc_id
        except Exception as e:
            raise Exception(f"Error removing document {full_file_path}: {e}")

    async def remove_doc_with_doc_id(self, doc_id: str) -> str | None:
        try:
            doc = self.docs.get(doc_id)
            if doc:
                os.remove(doc.file_path)
                del self.docs[doc.rag_doc_id]
                return doc_id
        except Exception as e:
            raise Exception(f"Error removing document id {doc_id}: {e}")

    @staticmethod
    async def load(source_dir: str, status_file_path: str) -> "RAGDocs":
        """
        Load documents from source directory and processing status file, then merge them into RAGDocs.

        Args:
            source_dir: Directory containing source documents


        Returns:
            RAGDocs: A new instance with merged document data
        """

        rag_docs = RAGDocs()

        # Process files from source directory if it exists
        if os.path.exists(source_dir):
            # Semaphore to limit concurrency to 10
            semaphore = asyncio.Semaphore(10)
            tasks = []

            async def process_file(file_full_path: str) -> tuple[str, RAGDocModel]:
                """Process a single file and return a tuple of (rag_doc_id, RAGDocModel)"""
                async with semaphore:
                    # Extract the file name from the full path
                    file_name = os.path.basename(file_full_path)

                    # Read the file content asynchronously with UTF-8 encoding
                    async with aiofiles.open(
                        file_full_path, "r", encoding="utf8"
                    ) as file:
                        content = await file.read()

                    cleaned_content = content.strip().replace("\x00", "")
                    rag_doc_id = (
                        "doc-" + hashlib.md5(cleaned_content.encode()).hexdigest()
                    )

                    # Create and return the RAGDocModel with source document information
                    rag_doc = RAGDocModel(
                        file_name=file_name,
                        file_path=file_full_path,
                        rag_doc_id=rag_doc_id,
                        status=DocStatus.UNKNOWN,
                    )
                    return rag_doc_id, rag_doc

            # Walk through the directory and create tasks for each file
            for root, _, files in os.walk(source_dir):
                for file in files:
                    file_full_path = os.path.join(root, file)
                    tasks.append(asyncio.create_task(process_file(file_full_path)))

            # Wait for all tasks to complete concurrently
            if tasks:
                results = await asyncio.gather(*tasks)
                for rag_doc_id, rag_doc in results:
                    rag_docs.docs[rag_doc_id] = rag_doc

        if os.path.exists(status_file_path):
            try:
                async with aiofiles.open(
                    status_file_path, "r", encoding="utf8"
                ) as file:
                    content = await file.read()

                # Parse status JSON content
                docs_status = RootModel[dict[str, dict]].model_validate_json(content)
                status_dict = docs_status.root

                # Update RAG documents with status information
                for status_id, status_info in status_dict.items():
                    status_info["rag_doc_id"] = status_id

                    # Check if we already loaded this document from the file system
                    if status_id in rag_docs.docs:
                        # Update the existing document with status info while preserving file info
                        existing_doc = rag_docs.docs[status_id]
                        updated_doc = existing_doc.model_copy(update=status_info)
                        rag_docs.docs[status_id] = updated_doc
                    else:
                        # This document only exists in the status file
                        rag_docs.docs[status_id] = RAGDocModel(**status_info)
            except Exception as e:
                # Handle any errors in loading or parsing the status file
                print(f"Error loading status file: {e}")

        return rag_docs

    def get_metrics(self) -> dict:
        """
        Calculate metrics for the RAG documents.

        Returns:
            dict: Dictionary with counts by status
        """
        metrics = {
            "total_sources": len(self.docs),
            "total_pending": 0,
            "total_processing": 0,
            "total_processed": 0,
            "total_failed": 0,
            "total_unknown": 0,
        }

        for doc in self.docs.values():
            if doc.status == DocStatus.PENDING:
                metrics["total_pending"] += 1
            elif doc.status == DocStatus.PROCESSING:
                metrics["total_processing"] += 1
            elif doc.status == DocStatus.PROCESSED:
                metrics["total_processed"] += 1
            elif doc.status == DocStatus.FAILED:
                metrics["total_failed"] += 1
            elif doc.status == DocStatus.UNKNOWN:
                metrics["total_unknown"] += 1

        return metrics

    def get_metrics_string(self) -> str:
        """
        Get a formatted string with all metrics data.

        Returns:
            str: Formatted metrics string
        """
        metrics = self.get_metrics()

        # Calculate percentages
        total = metrics["total_sources"]
        percent_pending = (metrics["total_pending"] / total * 100) if total > 0 else 0
        percent_processing = (
            (metrics["total_processing"] / total * 100) if total > 0 else 0
        )
        percent_processed = (
            (metrics["total_processed"] / total * 100) if total > 0 else 0
        )
        percent_failed = (metrics["total_failed"] / total * 100) if total > 0 else 0
        percent_unknown = (metrics["total_unknown"] / total * 100) if total > 0 else 0

        # Create the formatted string
        metrics_str = f"""RAG Documents Metrics:
Total Documents: {metrics["total_sources"]}
-----------------------------
Status Breakdown:
  • Unknown:     {metrics["total_unknown"]:4d} ({percent_unknown:.1f}%)
  • Pending:     {metrics["total_pending"]:4d} ({percent_pending:.1f}%)
  • Processing:  {metrics["total_processing"]:4d} ({percent_processing:.1f}%)
  • Processed:   {metrics["total_processed"]:4d} ({percent_processed:.1f}%)
  • Failed:      {metrics["total_failed"]:4d} ({percent_failed:.1f}%)
"""
        return metrics_str


from typing import Literal, List, Dict
from pydantic import BaseModel, Field


class QueryParameters(BaseModel):
    """Configuration parameters for query execution in LightRAG."""

    mode: Literal["local", "global", "hybrid", "naive", "mix"] = Field(
        default="mix",
        description="Specifies the retrieval mode: "
        "- 'local': Focuses on context-dependent information. "
        "- 'global': Utilizes global knowledge. "
        "- 'hybrid': Combines local and global retrieval methods. "
        "- 'naive': Performs a basic search without advanced techniques. "
        "- 'mix': Integrates knowledge graph and vector retrieval.",
    )

    only_need_context: bool = Field(
        default=False,
        description="If True, only returns the retrieved context without generating a response.",
    )

    only_need_prompt: bool = Field(
        default=False,
        description="If True, only returns the generated prompt without producing a response.",
    )

    response_type: str = Field(
        default="Multiple Paragraphs",
        description="Defines the response format. Examples: 'Multiple Paragraphs', 'Single Paragraph', 'Bullet Points'.",
    )

    stream: bool = Field(
        default=True,
        description="If True, enables streaming output for real-time responses.",
    )

    top_k: int = Field(
        default=120,
        description="Number of top items to retrieve. Represents entities in 'local' mode and relationships in 'global' mode.",
    )

    max_token_for_text_unit: int = Field(
        default=8000,
        description="Maximum number of tokens allowed for each retrieved text chunk.",
    )

    max_token_for_global_context: int = Field(
        default=8000,
        description="Maximum number of tokens allocated for relationship descriptions in global retrieval.",
    )

    max_token_for_local_context: int = Field(
        default=8000,
        description="Maximum number of tokens allocated for entity descriptions in local retrieval.",
    )

    hl_keywords: List[str] = Field(
        default_factory=list,
        description="List of high-level keywords to prioritize in retrieval.",
    )

    ll_keywords: List[str] = Field(
        default_factory=list,
        description="List of low-level keywords to refine retrieval focus.",
    )

    conversation_history: List[Dict[str, str]] = Field(
        default_factory=list,
        description="Stores past conversation history to maintain context. "
        'Format: [{"role": "user/assistant", "content": "message"}].',
    )

    history_turns: int = Field(
        default=3,
        description="Number of complete conversation turns (user-assistant pairs) to consider in the response context.",
    )

    def to_light_rag_params(self) -> QueryParam:
        """
        Convert QueryParam to LightRAG QueryParam.

        Returns:
            QueryParam: LightRAG QueryParam object
        """
        return QueryParam(
            mode=self.mode,
            only_need_context=self.only_need_context,
            only_need_prompt=self.only_need_prompt,
            response_type=self.response_type,
            stream=self.stream,
            top_k=self.top_k,
            max_token_for_text_unit=self.max_token_for_text_unit,
            max_token_for_global_context=self.max_token_for_global_context,
            max_token_for_local_context=self.max_token_for_local_context,
            hl_keywords=self.hl_keywords,
            ll_keywords=self.ll_keywords,
            conversation_history=self.conversation_history,
            history_turns=self.history_turns,
        )
