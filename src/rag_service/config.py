import os
from typing import Optional, List, Dict
from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Config(BaseSettings):
    service_name: str = Field(
        default_factory=lambda: os.getenv("RAG_SERVICE_NAME", "RAG Service"),
        description="Name of the service",
    )

    root_dir: str = Field(
        default_factory=lambda: os.getenv("ROOT_DIR", "/"),
        description="Root directory for the project",
    )
    source_dir: str = Field(
        default_factory=lambda: os.getenv("SOURCE_DIR", "./source"),
        description="Source directory for the project",
    )
    openai_api_key: Optional[SecretStr] = Field(
        default_factory=lambda: os.getenv("OPENAI_API_KEY"),
        description="OpenAI API Key",
    )
    anthropic_api_key: Optional[SecretStr] = Field(
        default_factory=lambda: os.getenv("ANTHROPIC_API_KEY"),
        description="Anthropic API Key",
    )
    logfire_key: Optional[SecretStr] = Field(
        default_factory=lambda: os.getenv("LOGFIRE_KEY"), description="Logfire API Key"
    )
    embedding_model: str = Field(
        default_factory=lambda: os.getenv("EMBEDDING_MODEL", "text-embedding-3-small"),
        description="Embedding model",
    )
    embedding_max_token_size: int = Field(
        default_factory=lambda: int(os.getenv("EMBEDDING_MAX_TOKEN_SIZE", 8192)),
        description="Maximum token size for embedding",
    )
    entity_summary_to_max_tokens: int = Field(
        default_factory=lambda: int(os.getenv("ENTITY_SUMMARY_TO_MAX_TOKENS", 8000)),
        description="Maximum tokens for entity summary",
    )
    chunk_token_size: int = Field(
        default_factory=lambda: int(os.getenv("CHUNK_TOKEN_SIZE", 1200)),
        description="Size of tokens in a chunk",
    )
    chunk_overlap_token_size: int = Field(
        default_factory=lambda: int(os.getenv("CHUNK_OVERLAP_TOKEN_SIZE", 100)),
        description="Token overlap between chunks",
    )

    # Logging and extraction configurations
    log_level: str = Field(
        default_factory=lambda: os.getenv("LOG_LEVEL", "DEBUG"),
        description="Logging level",
    )
    entity_extract_max_gleaning: int = Field(
        default_factory=lambda: int(os.getenv("ENTITY_EXTRACT_MAX_GLEANING", 1)),
        description="Maximum gleaning for entity extraction",
    )

    # Embedding configurations
    embedding_batch_num: int = Field(
        default_factory=lambda: int(os.getenv("EMBEDDING_BATCH_NUM", 32)),
        description="Number of batches for embeddings",
    )
    embedding_func_max_async: int = Field(
        default_factory=lambda: int(os.getenv("EMBEDDING_FUNC_MAX_ASYNC", 32)),
        description="Maximum async functions for embeddings",
    )

    # Vector storage configuration
    vector_storage: str = Field(
        default_factory=lambda: os.getenv("VECTOR_STORAGE", "ChromaVectorDBStorage"),
        description="Vector storage type",
    )

    # LLM model configurations
    llm_model_max_token_size: int = Field(
        default_factory=lambda: int(os.getenv("LLM_MODEL_MAX_TOKEN_SIZE", 32768)),
        description="Maximum token size for LLM model",
    )
    llm_model_max_async: int = Field(
        default_factory=lambda: int(os.getenv("LLM_MODEL_MAX_ASYNC", 32)),
        description="Maximum async operations for LLM model",
    )

    # Processing configurations
    processing_batch_size: int = Field(
        default_factory=lambda: int(os.getenv("PROCESSING_BATCH_SIZE", 20)),
        description="Batch size for processing",
    )
    max_parallel_insert: int = Field(
        default_factory=lambda: int(os.getenv("MAX_PARALLEL_INSERT", 32)),
        description="Maximum parallel insertions",
    )

    index_llm_provider: str = Field(
        default_factory=lambda: os.getenv("INDEX_LLM_PROVIDER", "openai"),
        description="Index LLM provider",
    )

    index_llm_model: str = Field(
        default_factory=lambda: os.getenv("INDEX_LLM_MODEL", "gpt4o"),
        description="Index LLM model",
    )

    # Quick Questions configuration
    quick_questions_str: str = Field(
        default_factory=lambda: os.getenv(
            "QUICK_QUESTIONS", 
            "How do I integrate Sealights Java Agent?,How to set up Cucumber.js with Sealights Node Agent?,What is LabId and how can I use it?,What is TIA and how can I use it?"
        ),
        description="Comma-separated list of quick questions to show in chat UI"
    )

    @property
    def quick_questions(self) -> List[Dict[str, str]]:
        """Parse quick questions from comma-separated string"""
        try:
            if not self.quick_questions_str:
                return []
                
            # For backward compatibility
            if os.getenv("QUICK_QUESTION_1"):
                legacy_questions = []
                for i in range(1, 10):  # Support up to 10 legacy questions
                    env_var = f"QUICK_QUESTION_{i}"
                    if os.getenv(env_var):
                        legacy_questions.append({
                            "id": f"q{i}",
                            "text": os.getenv(env_var)
                        })
                if legacy_questions:
                    return legacy_questions
            
            # Parse comma-separated questions
            questions = []
            for i, question_text in enumerate(self.quick_questions_str.split(',')):
                question_text = question_text.strip()
                if question_text:  # Skip empty questions
                    questions.append({
                        "id": f"q{i+1}",
                        "text": question_text
                    })
            return questions
        except Exception as e:
            print(f"Error parsing quick questions: {e}")
            return []

    # Pydantic settings configuration
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    @property
    def log_level_int(self):
        if self.log_level == "DEBUG":
            return 10
        elif self.log_level == "INFO":
            return 20
        elif self.log_level == "WARNING":
            return 30
        elif self.log_level == "ERROR":
            return 40
        elif self.log_level == "CRITICAL":
            return 50
        else:
            return 20
