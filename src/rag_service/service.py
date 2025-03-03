import os
import asyncio
from typing import AsyncIterator, Dict
from typing import List
from functools import partial
from src.rag_service.config import Config
import nest_asyncio
import logfire
import shutil

from pyvis.network import Network
import tempfile
import aiofiles
import networkx as nx
from pathlib import Path
from src.rag_service.input_validation import validate_input
from src.log import get_logger
from src.rag_service.lightrag import LightRAG
from src.rag_service.llms import create_embedding_function_instance
from src.rag_service.llms import openai_llm_model_func, anthropic_llm_model_func
from src.rag_service.lightrag.llm.openai import openai_complete_if_cache
from src.rag_service.types import (
    RAGDocs,
    QueryParameters,
    RagServiceStatus,
    RAGDocModel,
)


class RAGService:
    def __init__(self, config: Config | None = None):
        nest_asyncio.apply()
        if config is None:
            self.config = Config()
        else:
            self.config = config
        self.logger = get_logger(self.config.service_name)
        self.light_rag: LightRAG | None = None
        self.rag_docs: RAGDocs | None = None
        self.rag_docs_lock = asyncio.Lock()
        self.stop_metrics_update = False
        self.knowledge_base_status: RagServiceStatus = RagServiceStatus.INIT
        self.knowledge_base_status_lock = asyncio.Lock()

    async def init(self):
        try:
            if self.config.logfire_key is not None:
                self.logger.info("Init Log Fire")
                logfire.configure(token=self.config.logfire_key.get_secret_value())
                logfire.instrument_openai()
                logfire.instrument_anthropic()
        except Exception as e:
            self.logger.error(f"Failed to init Log Fire: {str(e)}")
            raise

        await self.refresh_rag_docs()

        try:
            self.logger.info(
                "Initializing RAG Service for %s at root dir %s",
                self.config.service_name,
                self.config.root_dir,
            )
            embedding_func_instance = await create_embedding_function_instance(
                self.config.embedding_max_token_size, self.config.embedding_model
            )
            self.light_rag = LightRAG(
                working_dir=self.config.root_dir,
                llm_model_func=openai_complete_if_cache,
                embedding_func=embedding_func_instance,
                entity_summary_to_max_tokens=self.config.entity_summary_to_max_tokens,
                chunk_token_size=self.config.chunk_token_size,
                chunk_overlap_token_size=self.config.chunk_overlap_token_size,
                log_level=self.config.log_level_int,
                entity_extract_max_gleaning=self.config.entity_extract_max_gleaning,
                embedding_batch_num=self.config.embedding_batch_num,
                embedding_func_max_async=self.config.embedding_func_max_async,
                llm_model_max_token_size=self.config.llm_model_max_token_size,
                llm_model_max_async=self.config.llm_model_max_async,
                max_parallel_insert=self.config.max_parallel_insert,
                vector_storage=self.config.vector_storage,
                vector_db_storage_cls_kwargs={
                    "local_path": self.config.root_dir + "/chromadb",
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
            self.logger.info("RAG Service initialized")
            async with self.knowledge_base_status_lock:
                self.knowledge_base_status = RagServiceStatus.READY
        except Exception as e:
            async with self.knowledge_base_status_lock:
                self.knowledge_base_status = RagServiceStatus.NOT_READY
            self.logger.error(f"Failed to initialize RAG Service: {str(e)}")
            raise

    async def stop(self):
        pass

    async def refresh_rag_docs(self):
        try:
            self.logger.info("loading source docs and status")
            status_file_path = os.path.join(
                self.config.root_dir, "kv_store_doc_status.json"
            )

            async with self.rag_docs_lock:
                self.rag_docs = await RAGDocs.load(
                    self.config.source_dir, status_file_path
                )
                (
                    self.logger.info(
                        f"Docs processing status loaded successfully:\n {self.rag_docs.get_metrics_string()}"
                    ),
                )
        except Exception as e:
            self.logger.error(f"Failed to load source docs: {str(e)}")
            raise

    async def set_rag_llm(self, llm_type: str, llm_model_name: str):
        async with self.knowledge_base_status_lock:
            if self.knowledge_base_status != RagServiceStatus.READY:
                self.logger.warning("Cannot set RAG LLM: knowledge base is not ready")
                return
        try:
            self.logger.info(
                f"Setting RAG LLM, llm_type: {llm_type}, llm_model_name: {llm_model_name}"
            )
            async with self.knowledge_base_status_lock:
                self.knowledge_base_status = RagServiceStatus.UPDATING
            if llm_type == "openai":
                if llm_model_name == "":
                    llm_model_name = "gpt4o"
                llm_model_func = partial(
                    openai_llm_model_func,
                    model=llm_model_name,
                    api_key=self.config.openai_api_key.get_secret_value(),
                )

            elif llm_type == "anthropic":
                llm_model_name = "claude-3-5-sonnet-20241022"
                llm_model_func = partial(
                    anthropic_llm_model_func,
                    model=llm_model_name,
                    api_key=self.config.anthropic_api_key.get_secret_value(),
                )
            else:
                raise Exception(f"Invalid llm_type: {llm_type}")
            self.light_rag.llm_model_func = llm_model_func
        except Exception as e:
            self.logger.error(f"Failed to set RAG LLM: {str(e)}")
            raise
        finally:
            async with self.knowledge_base_status_lock:
                self.knowledge_base_status = RagServiceStatus.READY

    async def _process_batch(self, batch_files: List[str]) -> None:
        current_batch = []
        for file_path in batch_files:
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    if content:
                        current_batch.append(content)
                self.logger.info(f"Read file: {file_path}")
            except Exception as e:
                self.logger.exception(f"Error reading file {file_path}: {e}")
                continue

        if current_batch:
            try:
                self.logger.info(f"Inserting batch of {len(current_batch)} documents")
                await self.light_rag.ainsert(current_batch)
                self.logger.info(
                    f"Successfully inserted batch of {len(current_batch)} documents"
                )
            except Exception as e:
                self.logger.exception(f"Error inserting batch: {e}")
                raise Exception(f"Error inserting batch: {e}")

    async def _batch_process(self) -> None:
        source_files = []
        for root, _, files in os.walk(self.config.source_dir):
            for file in files:
                source_files.append(os.path.join(root, file))
        self.logger.info(f"Found {len(source_files)} files to process")

        for i in range(0, len(source_files), self.config.processing_batch_size):
            batch_files = source_files[i : i + self.config.processing_batch_size]
            await self._process_batch(batch_files)

    async def index(self):
        async with self.knowledge_base_status_lock:
            if self.knowledge_base_status != RagServiceStatus.READY:
                self.logger.warning("Cannot process index: knowledge base is not ready")
                return
        try:
            await self.set_rag_llm(
                self.config.index_llm_provider, self.config.index_llm_model
            )
            self.logger.info(
                f"Indexing RAG, llm_type: {self.config.index_llm_provider}, llm_model_name: {self.config.index_llm_model}"
            )
            async with self.knowledge_base_status_lock:
                self.knowledge_base_status = RagServiceStatus.INDEXING
            await self._batch_process()

        except Exception as e:
            self.logger.error(f"Failed to process index: {str(e)}")
            raise Exception(f"Indexing Error: {str(e)}")
        finally:
            async with self.knowledge_base_status_lock:
                self.knowledge_base_status = RagServiceStatus.READY
            await self.refresh_rag_docs()

    async def reset(self):
        async with self.knowledge_base_status_lock:
            if self.knowledge_base_status != RagServiceStatus.READY:
                self.logger.warning(
                    "Cannot reset knowledge base: knowledge base is not ready"
                )
                return
        try:
            async with self.knowledge_base_status_lock:
                self.knowledge_base_status = RagServiceStatus.NOT_READY

            # Convert source_dir to absolute path for accurate comparison
            source_dir_abs = os.path.abspath(self.config.source_dir)

            for item in os.listdir(self.config.root_dir):
                item_path = os.path.join(self.config.root_dir, item)
                item_abs_path = os.path.abspath(item_path)

                # Skip if the item is source_dir or is inside source_dir
                if item_abs_path.startswith(source_dir_abs):
                    self.logger.info(f"Keeping path: {item_path}")
                    continue

                try:
                    if os.path.isfile(item_path):
                        os.remove(item_path)
                        self.logger.info(f"Removed file: {item_path}")
                    elif os.path.isdir(item_path):
                        shutil.rmtree(item_path)
                        self.logger.info(f"Removed directory: {item_path}")
                except Exception as e:
                    self.logger.error(f"Error removing {item_path}: {str(e)}")

            await self.init()
            self.logger.info("Knowledge base reset successfully")
        except Exception as e:
            self.logger.error(f"An error occurred: {str(e)}")
            raise Exception(f"Reset Error: {str(e)}")
        finally:
            async with self.knowledge_base_status_lock:
                self.knowledge_base_status = RagServiceStatus.READY

    async def query(
        self, user_query: str, query_params: QueryParameters
    ) -> AsyncIterator[str]:
        async with self.knowledge_base_status_lock:
            if self.knowledge_base_status != RagServiceStatus.READY:
                self.logger.warning(
                    "Cannot query knowledge base: knowledge base is not ready"
                )

                async def not_ready_iterator():
                    yield "Knowledge base is not ready"

                return not_ready_iterator()

        try:
            is_valid, result = validate_input(user_query)
            if not is_valid:

                async def validation_error_iterator():
                    yield f"Error: {result}"

                return validation_error_iterator()

            response = await self.light_rag.aquery(
                user_query, query_params.to_light_rag_params()
            )
            return response
        except Exception as e:
            self.logger.error(f"Error querying RAG: {str(e)}")
            error_message = str(e)  # Capture the error message

            async def error_iterator():
                yield f"Error: {error_message}"  # Use the captured message

            return error_iterator()

    async def add_doc(self, file_name: str, content: str) -> None:
        async with self.knowledge_base_status_lock:
            if self.knowledge_base_status != RagServiceStatus.READY:
                self.logger.warning("Cannot add document: knowledge base is not ready")
                return
        try:
            self.logger.info(f"Adding document to source: {file_name}")
            full_file_path = os.path.join(self.config.source_dir, file_name)
            async with self.rag_docs_lock:
                await self.rag_docs.add_doc(full_file_path, content)
            await self.refresh_rag_docs()
        except Exception as e:
            self.logger.error(f"Failed to add document to source: {str(e)}")
            raise

    async def delete_doc_by_file_name(self, file_name: str) -> None:
        async with self.knowledge_base_status_lock:
            if self.knowledge_base_status != RagServiceStatus.READY:
                self.logger.warning(
                    "Cannot delete document: knowledge base is not ready"
                )
                return
        try:
            full_file_path = os.path.join(self.config.source_dir, file_name)
            self.logger.info(f"Deleting document from source: {full_file_path}")
            async with self.rag_docs_lock:
                doc_id = self.rag_docs.get_doc_id_by_file_path(full_file_path)
                self.logger.info(f"Deleting document with id: {doc_id}")
            await self.light_rag.adelete_by_doc_id(doc_id)
            async with self.rag_docs_lock:
                await self.rag_docs.remove_doc_with_file_name(full_file_path)
        except Exception as e:
            self.logger.error(f"Failed to delete document from source: {str(e)}")
            raise

    async def delete_doc_by_id(self, doc_id: str) -> None:
        async with self.knowledge_base_status_lock:
            if self.knowledge_base_status != RagServiceStatus.READY:
                self.logger.warning(
                    "Cannot delete document: knowledge base is not ready"
                )
                return
        try:
            if self.rag_docs is None:
                raise Exception("RAG Docs not initialized")
            async with self.rag_docs_lock:
                if doc_id not in self.rag_docs.docs:
                    raise Exception(f"Document with id {doc_id} does not exist")

            self.logger.info(f"Deleting document with id: {doc_id}")
            await self.light_rag.adelete_by_doc_id(doc_id)

            async with self.rag_docs_lock:
                await self.rag_docs.remove_doc_with_doc_id(doc_id)
            await self.refresh_rag_docs()
        except Exception as e:
            self.logger.error(f"Failed to delete document from source: {str(e)}")
            raise

    async def get_docs(self) -> RAGDocs:
        await self.refresh_rag_docs()
        async with self.rag_docs_lock:
            return self.rag_docs

    async def get_status(self) -> RagServiceStatus:
        async with self.knowledge_base_status_lock:
            return self.knowledge_base_status

    async def get_doc_content(self, doc_id: str) -> str:
        async with self.knowledge_base_status_lock:
            if self.knowledge_base_status != RagServiceStatus.READY:
                self.logger.warning(
                    "Cannot get document content: knowledge base is not ready"
                )
                return "Knowledge base is not ready"
        try:
            self.logger.info(f"Getting document content for doc_id: {doc_id}")
            doc_model: RAGDocModel = self.rag_docs.docs.get(doc_id)
            if doc_model is None:
                raise Exception(f"Document with id {doc_id} does not exist")
            if doc_model.file_path is None:
                raise Exception(f"Document with id {doc_id} does not have a file path")
            with open(doc_model.file_path, "r", encoding="utf-8") as f:
                return f.read()
        except Exception as e:
            self.logger.error(f"Failed to get document content: {str(e)}")
            raise

    async def get_quick_questions(self) -> List[Dict[str, str]]:
        """
        Get the configured quick questions
        
        Returns:
            List[Dict[str, str]]: List of quick question objects with id and text
        """
        try:
            # Get questions from configuration
            config_questions = self.config.quick_questions
            
            # Ensure all questions have id and text fields
            formatted_questions = []
            for i, q in enumerate(config_questions):
                if isinstance(q, dict):
                    # Ensure minimum required fields
                    question_id = q.get('id', f'q{i+1}')
                    question_text = q.get('text', '')
                    
                    if question_text:  # Only add if text is not empty
                        formatted_questions.append({
                            'id': question_id,
                            'text': question_text
                        })
            
            return formatted_questions
        except Exception as e:
            self.logger.error(f"Error retrieving quick questions: {e}")
            # Return empty list on error instead of throwing
            return []

    async def visualize(self) -> str:
        async with self.knowledge_base_status_lock:
            if self.knowledge_base_status != RagServiceStatus.READY:
                self.logger.warning(
                    "Cannot visualize knowledge base: knowledge base is not ready"
                )
                return "Knowledge base is not ready"
        try:
            self.logger.info("Visualizing knowledge base")
            graph = nx.read_graphml(
                os.path.join(
                    self.config.root_dir, "graph_chunk_entity_relation.graphml"
                )
            )
            net = Network(notebook=True)
            net.from_nx(graph)
            temp_dir = tempfile.gettempdir()
            temp_path = Path(temp_dir) / f"temp_graph_{os.urandom(8).hex()}.html"
            net.show(str(temp_path))
            async with aiofiles.open(temp_path, mode="r", encoding="utf-8") as f:
                html_content = await f.read()
            os.unlink(temp_path)
            return html_content

        except Exception as e:
            self.logger.error(f"Failed to visualize knowledge base: {str(e)}")
            raise Exception(f"Failed to visualize knowledge base: {str(e)}")
