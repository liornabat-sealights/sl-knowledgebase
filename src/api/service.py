import asyncio
import os
import uvicorn
from typing import Union, List, Dict
import tempfile
from fastapi import FastAPI, APIRouter, Request, status
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError, HTTPException
from fastapi.responses import StreamingResponse, FileResponse, HTMLResponse

from src.api.types import KnowledgeBaseModel
from src.api.responses import (
    KnowledgeBaseResponse,
    OperationResponse,
    TranscriptionResponse,
    QuickQuestionsResponse,
)
from src.rag_service.service import RAGService
from src.rag_service.types import QueryParameters
import openai
from src.log import get_logger


class ApiService:
    def __init__(self):
        super().__init__()
        self.ws_handler = None

        self.app = None
        self.router = None
        self.state = {"running": False}
        self.server = None
        self.rag_service: Union[RAGService, None] = None
        self.logger = get_logger("api")

    def init(self, rag_service: RAGService):
        try:
            self.rag_service = rag_service
            self.app = FastAPI()
            self.router = APIRouter()
            self._setup_cors()
            self._setup_routes()
            self.app.include_router(self.router)

            # Mount assets directory for static files
            assets_dir = "./src/web/assets"
            if os.path.exists(assets_dir) and os.path.isdir(assets_dir):
                self.app.mount(
                    "/assets",
                    StaticFiles(directory=assets_dir),
                    name="assets",
                )
            else:
                self.logger.warning(
                    f"Assets directory '{assets_dir}' does not exist or is not a directory. Static files will not be served."
                )

            # Add catch-all route for SPA (Single Page Application)
            @self.app.get("/{full_path:path}")
            async def serve_spa(request: Request, full_path: str):
                # Skip API routes - they should be handled by the router
                if full_path.startswith("api"):
                    return {"detail": "Not Found"}

                # For all other routes, serve the index.html file
                index_path = "./src/web/index.html"
                if os.path.exists(index_path):
                    self.logger.info(f"Serving index.html for path: {full_path}")
                    return FileResponse(index_path)
                else:
                    self.logger.error("index.html not found in web directory")
                    return HTMLResponse(
                        "<html><body><h1>Error: index.html not found</h1>"
                        "<p>Please build the React app first.</p></body></html>"
                    )

        except Exception as e:
            self.logger.error(f"Error in init: {str(e)}")
            raise

    async def start(self):
        try:
            # Log directory contents to help with debugging
            self.logger.info(f"Current directory: {os.getcwd()}")

            config = uvicorn.Config(
                self.app,
                host="0.0.0.0",
                port=9000,
                log_level="info",
            )
            self.server = uvicorn.Server(config)
            await self.server.serve()
        except Exception as e:
            self.logger.error(f"Error starting server: {str(e)}")
            raise

    # Other methods remain the same...
    async def stop(self):
        """Properly stop the Uvicorn server"""
        if self.server:
            self.logger.info("Stopping API server...")
            try:
                # Signal the server to exit
                self.server.should_exit = True

                # Manually close server connections if needed
                if hasattr(self.server, "servers"):
                    for server in self.server.servers:
                        server.close()

                # Give a small amount of time for the server to shutdown gracefully
                await asyncio.sleep(0.1)

                self.logger.info("API server stopped")
            except Exception as e:
                self.logger.error(f"Error stopping API server: {e}")

    async def state(self) -> dict:
        pass

    async def metrics(self) -> dict:
        pass

    def _setup_cors(self):
        # For origins with "lovable" in the name and any localhost port
        self.app.add_middleware(
            CORSMiddleware,
            # FastAPI's CORS middleware doesn't support wildcards within a domain name,
            # so we have to be explicit about the exact patterns we want to match
            allow_origins=[
                # Any domain that contains "lovable"
                "https://*.lovableproject.com",
                "https://*.lovable.com",
                "https://*.lovable.org",
                "https://*.lovable.io",
                "https://*.lovable.net",
                "https://*.lovable.app",
                "https://*.kubes.dev",
                "http://*.lovableproject.com",
                "http://*.lovable.com",
                "http://*.lovable.org",
                "http://*.lovable.io",
                "http://*.lovable.net",
                # Any localhost port
                "http://localhost:*",
                "http://127.0.0.1:*",
            ],
            # Use allow_origin_regex for more flexible pattern matching
            # This allows any domain with "lovable" in it and any localhost port
            allow_origin_regex=r"https?://(.*\.)?lovable.*\..*|http://localhost:\d+|http://127\.0\.0\.1:\d+",
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
            expose_headers=["*"],
        )

    def _setup_routes(self):
        @self.router.get("/api")
        def read_root():
            return {"status": "ok"}

        @self.router.post(
            "/api/transcribe",
            response_model=TranscriptionResponse,
            status_code=status.HTTP_200_OK,
            tags=["Transcribe Audio"],
            summary="Transcribe Audio to Text",
            response_description="Returns the status of the operation and transcribed text",
        )
        async def transcribe_audio(request: Request):
            """
            Transcribe audio files to text using a speech-to-text service
            """
            try:
                # Parse multipart form data
                form = await request.form()
                audio_file = form.get("audio")

                if not audio_file:
                    raise HTTPException(
                        status_code=400, detail="No audio file provided"
                    )

                # Read the content from the UploadFile object
                content = await audio_file.read()

                # Create a temporary file with the audio content
                with tempfile.NamedTemporaryFile(
                    delete=False, suffix=".webm"
                ) as tmp_file:
                    tmp_file.write(content)
                    tmp_file_path = tmp_file.name

                # Initialize the OpenAI client
                client = openai.OpenAI()

                # Open the file and send it to OpenAI
                with open(tmp_file_path, "rb") as audio_file_obj:
                    transcription = client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file_obj,
                        language="en",
                    )

                os.remove(tmp_file_path)
                if transcription:
                    return {"text": transcription.text}
                else:
                    raise HTTPException(status_code=500, detail="Transcription failed")

            except Exception as e:
                self.logger.error(f"Error transcribing audio: {str(e)}")
                raise HTTPException(
                    status_code=500, detail=f"Transcription error: {str(e)}"
                )

        @self.router.post(
            "/api/set_llm",
            response_model=OperationResponse,
            status_code=status.HTTP_200_OK,
            tags=["Set LLM Model"],
            summary="Set the LLM Model",
            response_description="Returns the status of the operation",
        )
        async def set_llm(
            request: Request,
        ):
            """
            Query the RAG service with a user question and optional parameters
            Returns a streaming response if streaming is enabled, otherwise returns the full response
            """
            # if not request.query.strip():
            #     raise HTTPException(status_code=400, detail="Query cannot be empty")
            body = await request.json()
            llm_name = body.get("llm_name")
            if llm_name == "GPT-4o":
                llm = "openai"
                model = "gpt-4o"
            elif llm_name == "GPT-4o Mini":
                llm = "openai"
                model = "gpt-4o-mini"
            elif llm_name == "o1":
                llm = "openai"
                model = "o1"
            elif llm_name == "o1-mini":
                llm = "openai"
                model = "o1-mini"
            elif llm_name == "o3-mini":
                llm = "openai"
                model = "o3-mini"
            else:
                raise HTTPException(status_code=400, detail="Invalid LLM model name")
            await self.rag_service.set_rag_llm(llm, model)
            return {"status": "success", "message": "LLM model set successfully"}

        @self.router.post("/api/query")
        async def query_rag(
            request: Request,
        ):
            """
            Query the RAG service with a user question and optional parameters
            Returns a streaming response if streaming is enabled, otherwise returns the full response
            """
            body = await request.json()
            user_input = body.get("query")
            is_stream = body.get("stream")
            messagesHistory = body.get("messagesHistory")
            query_params = QueryParameters()
            if messagesHistory:
                query_params.conversation_history = messagesHistory
            if is_stream:
                query_params.stream = is_stream

            response = await self.rag_service.query(user_input, query_params)

            # Check if response is a string (error message) or an async iterator
            if isinstance(response, str):
                # If it's a string and streaming is enabled, return it as a streaming response
                if is_stream:

                    async def string_generator():
                        yield response

                    return StreamingResponse(
                        string_generator(), media_type="text/plain"
                    )
                else:
                    # If streaming is not enabled, return it as a JSON response
                    return {"response": response}
            else:
                # It's an async iterator, handle as before
                if is_stream:
                    # Return as a streaming response
                    async def response_generator():
                        async for chunk in response:
                            yield chunk

                    return StreamingResponse(
                        response_generator(), media_type="text/plain"
                    )
                else:
                    # Collect all chunks into a single response
                    full_response = ""
                    async for chunk in response:
                        full_response += chunk

                    return {"response": full_response}

        @self.router.post(
            "/api/index",
            response_model=OperationResponse,
            status_code=status.HTTP_200_OK,
            tags=["Index Knowledge Base"],
            summary="Index Knowledge Base",
            response_description="Returns the status of the operation",
        )
        async def index():
            try:
                asyncio.run(self.rag_service.index())
                return {"status": "indexing", "message": "Indexing started"}
            except Exception as e:
                self.logger.error(f"Error during indexing: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.router.post(
            "/api/reset",
            response_model=OperationResponse,
            status_code=status.HTTP_200_OK,
            tags=["Reset Knowledge Base"],
            summary="Reset Knowledge Base",
            response_description="Returns the status of the operation",
        )
        async def reset():
            try:
                await self.rag_service.reset()
                return {
                    "status": "success",
                    "message": "Knowledge base reset successfully",
                }
            except Exception as e:
                self.logger.error(f"Error during reset: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.router.post(
            "/api/add_document",
            response_model=OperationResponse,
            status_code=status.HTTP_200_OK,
            tags=["Add Document"],
            summary="Add Document to Knowledge Base",
            response_description="Returns the status of the operation",
        )
        async def add_document(request: Request):
            try:
                form = await request.form()
                file_name = form.get("file_name")
                content = form.get("content")
                await self.rag_service.add_doc(file_name, content)
                return {"status": "success", "message": "Document added successfully"}
            except Exception as e:
                self.logger.error(f"Error adding document: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.router.get(
            "/api/knowledge_base",
            response_model=KnowledgeBaseResponse,
            status_code=status.HTTP_200_OK,
            tags=["Knowledge Base"],
            summary="Get Knowledge Base Information",
            response_description="Returns the knowledge base information and status",
        )
        async def get_knowledge_base():
            try:
                rag_docs = await self.rag_service.get_docs()
                rag_status = await self.rag_service.get_status()
                kb: KnowledgeBaseModel = KnowledgeBaseModel.create_from(
                    name="knowledge_base", rag_service_status=rag_status, docs=rag_docs
                )
                return {"status": "success", "knowledge_base": kb}
            except Exception as e:
                self.logger.error(f"Error getting knowledge base: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.router.get(
            "/api/knowledge_base_status",
            response_model=OperationResponse,
            status_code=status.HTTP_200_OK,
            tags=["Knowledge Base"],
            summary="Get Knowledge Base Status",
            response_description="Returns the status of the knowledge base",
        )
        async def get_knowledge_base_status():
            try:
                rag_status = await self.rag_service.get_status()
                return {
                    "status": "success",
                    "message": str(rag_status.value),
                }
            except Exception as e:
                self.logger.error(f"Error getting knowledge base: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.router.get(
            "/api/knowledge_base_graph",
            response_model=OperationResponse,
            status_code=status.HTTP_200_OK,
            tags=["Knowledge Base"],
            summary="Get Knowledge Base Graph",
            response_description="Returns the knowledge base graph",
        )
        async def get_knowledge_base_graphe():
            try:
                graph = await self.rag_service.visualize()
                return {"status": "success", "message": graph}
            except Exception as e:
                self.logger.error(f"Error getting knowledge base: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.router.get(
            "/api/get_doc_content/{doc_id}",
            response_model=OperationResponse,
            status_code=status.HTTP_200_OK,
            tags=["Get Document Content"],
            summary="Get Document Content from Knowledge Base",
            response_description="Returns the content of the document",
        )
        async def get_doc_content(doc_id: str):
            try:
                content = await self.rag_service.get_doc_content(doc_id)
                return {"status": "success", "message": content}
            except Exception as e:
                self.logger.error(f"Error getting knowledge base: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.router.delete(
            "/api/delete_document/{doc_id}",
            response_model=OperationResponse,
            status_code=status.HTTP_200_OK,
            tags=["Delete Document"],
            summary="Delete Document from Knowledge Base",
            response_description="Returns the status of the operation",
        )
        async def delete_document(doc_id: str):
            try:
                await self.rag_service.delete_doc_by_id(doc_id)
                return {
                    "status": "success",
                    "message": f"Document {doc_id} deleted successfully",
                }
            except Exception as e:
                self.logger.error(f"Error deleting document: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.router.get(
            "/api/quick-questions",
            response_model=List[Dict[str, str]],
            status_code=status.HTTP_200_OK,
            tags=["Quick Questions"],
            summary="Get Quick Questions",
            response_description="Returns the configured quick questions"
        )
        async def get_quick_questions():
            try:
                # Get questions from the RAG service
                questions = await self.rag_service.get_quick_questions()
                
                # Ensure each question has id and text properties
                validated_questions = []
                for idx, question in enumerate(questions):
                    # Validate that the question has the required structure
                    if isinstance(question, dict) and 'id' in question and 'text' in question:
                        validated_questions.append(question)
                    else:
                        # Try to construct a valid question object
                        try:
                            if isinstance(question, dict) and 'text' in question and question['text']:
                                # Question has text but missing id
                                validated_questions.append({
                                    'id': question.get('id', f'q{idx+1}'),
                                    'text': question['text']
                                })
                            elif isinstance(question, str) and question:
                                # Question is just a string
                                validated_questions.append({
                                    'id': f'q{idx+1}',
                                    'text': question
                                })
                        except Exception as e:
                            self.logger.error(f"Error validating question {idx}: {e}")
                
                return validated_questions
            except Exception as e:
                self.logger.error(f"Error getting quick questions: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=str(e)
                )

        @self.app.exception_handler(RequestValidationError)
        async def validation_exception_handler(
            request: Request, exc: RequestValidationError
        ):
            return {"detail": exc.errors(), "body": exc.body}


async def main():
    rag_service = RAGService()
    await rag_service.init()
    await rag_service.set_rag_llm("openai", "gpt-4o")
    api_service = ApiService()
    api_service.init(rag_service)
    await api_service.start()


if __name__ == "__main__":
    asyncio.run(main())
