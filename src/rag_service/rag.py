import asyncio
import hashlib
import os
from enum import Enum
import aiofiles
from pydantic import BaseModel, Field, RootModel
from typing import List, Optional
import nest_asyncio

nest_asyncio.apply()
from src.rag_service.llms import create_embedding_function_instance, get_llm_model_func
from src.rag_service.lightrag import LightRAG

from src.log import get_logger

logger = get_logger("rag")
ENTITY_SUMMARY_TO_MAX_TOKENS = int(os.getenv("ENTITY_SUMMARY_TO_MAX_TOKENS", 8000))
CHUNK_TOKEN_SIZE = int(os.getenv("CHUNK_TOKEN_SIZE", 1200))
CHUNK_OVERLAP_TOKEN_SIZE = int(os.getenv("CHUNK_OVERLAP_TOKEN_SIZE", 100))
LOG_LEVEL = os.getenv("LOG_LEVEL", "DEBUG")
ENTITY_EXTRACT_MAX_GLEANING = int(os.getenv("ENTITY_EXTRACT_MAX_GLEANING", 1))
EMBEDDING_BATCH_NUM = int(os.getenv("EMBEDDING_BATCH_NUM", 32))
EMBEDDING_FUNC_MAX_ASYNC = int(os.getenv("EMBEDDING_FUNC_MAX_ASYNC", 32))
VECTOR_STORAGE = os.getenv("VECTOR_STORAGE", "ChromaVectorDBStorage")
LLM_MODEL_MAX_TOKEN_SIZE = int(os.getenv("LLM_MODEL_MAX_TOKEN_SIZE", 32768))
LLM_MODEL_MAX_ASYNC = int(os.getenv("LLM_MODEL_MAX_ASYNC", 32))
PROCESSING_BATCH_SIZE = int(
    os.getenv("PROCESSING_BATCH_SIZE", 20)
)  # Control batch size
MAX_PARALLEL_INSERT = int(
    os.getenv("MAX_PARALLEL_INSERT", 32)
)  # Currently is one due to Bug in LightRAG


def log_level_to_int(log_level: str) -> int:
    if log_level == "DEBUG":
        return 10
    elif log_level == "INFO":
        return 20
    elif log_level == "WARNING":
        return 30
    elif log_level == "ERROR":
        return 40
    elif log_level == "CRITICAL":
        return 50
    else:
        return 20


async def process_batch(rag: LightRAG, batch_files: List[str]) -> None:
    current_batch = []
    for file_path in batch_files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
                if content:
                    current_batch.append(content)
            logger.info(f"Read file: {file_path}")
        except Exception as e:
            logger.exception(f"Error reading file {file_path}: {e}")
            continue

    if current_batch:
        try:
            logger.info(f"Inserting batch of {len(current_batch)} documents")
            await rag.ainsert(current_batch)
            logger.info(
                f"Successfully inserted batch of {len(current_batch)} documents"
            )
        except Exception as e:
            logger.exception(f"Error inserting batch: {e}")


async def batch_process(rag: LightRAG, directory: str) -> None:
    # Walk through the directory and collect all markdown files
    source_files = []
    for root, _, files in os.walk(directory):
        for file in files:
            source_files.append(os.path.join(root, file))
    logger.info(f"Found {len(source_files)} files to process")

    for i in range(0, len(source_files), PROCESSING_BATCH_SIZE):
        batch_files = source_files[i : i + PROCESSING_BATCH_SIZE]
        await process_batch(rag, batch_files)


async def get_rag_instance(work_dir: str, llm_type: str, llm_model_name: str):
    embedding_func_instance = await create_embedding_function_instance()
    rag = LightRAG(
        working_dir=work_dir,
        llm_model_func=await get_llm_model_func(llm_type, llm_model_name),
        embedding_func=embedding_func_instance,
        entity_summary_to_max_tokens=ENTITY_SUMMARY_TO_MAX_TOKENS,
        chunk_token_size=CHUNK_TOKEN_SIZE,
        chunk_overlap_token_size=CHUNK_OVERLAP_TOKEN_SIZE,
        log_level=log_level_to_int(LOG_LEVEL),
        entity_extract_max_gleaning=ENTITY_EXTRACT_MAX_GLEANING,
        embedding_batch_num=EMBEDDING_BATCH_NUM,
        embedding_func_max_async=EMBEDDING_FUNC_MAX_ASYNC,
        llm_model_max_token_size=LLM_MODEL_MAX_TOKEN_SIZE,
        llm_model_max_async=LLM_MODEL_MAX_ASYNC,
        max_parallel_insert=MAX_PARALLEL_INSERT,
        vector_storage=VECTOR_STORAGE,
        vector_db_storage_cls_kwargs={
            "local_path": work_dir + "/chromadb",
            "collection_settings": {
                "hnsw:space": "cosine",
                "hnsw:construction_ef": 128,
                "hnsw:search_ef": 128,
                "hnsw:M": 16,
                "hnsw:batch_size": 100,
                "hnsw:sync_threshold": 1000,
            },
        },
    )
    return rag


async def do_rage_index(work_dir: str, llm_type: str, llm_model_name: str):
    logger.info(f"Indexing RAG, llm_type: {llm_type}, llm_model_name: {llm_model_name}")
    rag = await get_rag_instance(work_dir, llm_type, llm_model_name)
    try:
        await batch_process(rag, f"{work_dir}/source")
    except Exception as e:
        logger.exception(f"Error in index: {str(e)}")


class DocStatus(str, Enum):
    """Document processing status"""

    UNKNOWN = "unknown"
    PENDING = "pending"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"


class SourceDocModel(BaseModel):
    FileName: str = Field(..., title="FileName", description="Name of the file")
    FilePath: str = Field(..., title="FilePath", description="Path of the file")
    RagDocId: str = Field(..., title="RagDocId", description="Rag Document Id")

    @staticmethod
    def clean_text(text: str) -> str:
        """Clean text by removing null bytes (0x00) and whitespace"""
        return text.strip().replace("\x00", "")

    @staticmethod
    async def async_create(file_full_path: str) -> "SourceDocModel":
        # Extract the file name from the full path
        file_name = os.path.basename(file_full_path)
        # Read the file content asynchronously with UTF-8 encoding
        async with aiofiles.open(file_full_path, "r", encoding="utf8") as file:
            content = await file.read()

        cleaned_content = content.strip().replace("\x00", "")
        rag_doc_id = "doc-" + hashlib.md5(cleaned_content.encode()).hexdigest()
        # Create and return the SourceDocModel instance
        return SourceDocModel(
            FileName=file_name, FilePath=file_full_path, RagDocId=rag_doc_id
        )


class SourceDocs(BaseModel):
    docs: dict[str, SourceDocModel] = Field(
        default_factory=dict, title="Docs", description="List of source documents"
    )

    @staticmethod
    async def load(source_dir: str) -> "SourceDocs":
        source_docs = SourceDocs()
        if os.path.exists(source_dir):
            tasks = []
            # Semaphore to limit concurrency to 10
            semaphore = asyncio.Semaphore(10)

            async def sem_async_create(file_full_path: str) -> SourceDocModel:
                async with semaphore:
                    return await SourceDocModel.async_create(file_full_path)

            # Walk through the directory and create tasks for each file
            for root, _, files in os.walk(source_dir):
                for file in files:
                    file_full_path = os.path.join(root, file)
                    tasks.append(asyncio.create_task(sem_async_create(file_full_path)))

            # Wait for all tasks to complete concurrently
            results = await asyncio.gather(*tasks)
            for source_doc in results:
                source_docs.docs[source_doc.rag_doc_id] = source_doc
        return source_docs


class DocProcessingStatus(BaseModel):
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


class DocsProcessingStatus(RootModel[dict[str, DocProcessingStatus]]):
    @property
    def docs(self) -> dict[str, DocProcessingStatus]:
        return self.root  # Use .root instead of __root__

    @staticmethod
    async def create(status_file_full_path: str) -> "DocsProcessingStatus":
        """
        Asynchronously loads the document status file in a read-only mode.
        This method avoids locking the file, which is being concurrently written by another process.
        """
        docs_status = DocsProcessingStatus(__root__={})
        if os.path.exists(status_file_full_path):
            async with aiofiles.open(
                status_file_full_path, "r", encoding="utf8"
            ) as file:
                content = await file.read()
            docs_status = DocsProcessingStatus.model_validate_json(content)
            print(f"Loaded {len(docs_status.docs)} document processing status")
        return docs_status


async def load_source_docs(source_dir: str):
    docs = await SourceDocs.load(source_dir)
    for doc_id, doc in docs.docs.items():
        print(f"DocId: {doc_id}, FileName: {doc.FileName}, FilePath: {doc.FilePath}")


async def load_docs_status(status_file_full_path: str):
    docs_status = await DocsProcessingStatus.create(status_file_full_path)
    for doc_id, doc_status in docs_status.docs.items():
        print(
            f"DocId: {doc_id}, Status: {doc_status.status}, Error: {doc_status.error}"
        )


if __name__ == "__main__":
    # asyncio.run(load_source_docs("./cs-test/source"))
    asyncio.run(load_docs_status("../../cs-test/kv_store_doc_status.json"))
