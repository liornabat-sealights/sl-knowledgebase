// ApiService.ts
// Determine the correct API base URL based on environment
const isDevelopment = import.meta.env.DEV;


import {KnowledgeBaseResponse, OperationResponse, DocContentResponse, TranscriptionResponse} from "@/models/ApiModels";
import { MessageHistoryItem } from '@/components/chat/types.ts';

// In development, point to the specific development server port
// In production, use relative URL for API endpoints from the same origin
const API_URL = isDevelopment
    ? "http://localhost:9000/api"
    : "/api";

// const API_URL ="http://localhost:9000/api";

console.log(`API Service initialized with endpoint: ${API_URL}`);

/**
 * ApiService handles all API connectivity for the application
 */
class ApiService {
    private abortController: AbortController | null = null;

    /**
     * Send a query to the API and handle streaming response
     * @param query The user's query
     * @param onChunk Callback function to handle each chunk of streamed response
     * @param messagesHistory Optional array of previous message pairs for context
     * @returns The complete response text
     */
    async sendQuery(
        query: string, 
        onChunk: (chunk: string) => void,
        messagesHistory?: MessageHistoryItem[]
    ): Promise<string> {
        // Create a new AbortController for this request
        this.abortController = new AbortController();
        const signal = this.abortController.signal;

        try {
            const response = await fetch(`${API_URL}/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    stream: true,
                    messagesHistory
                }),
                signal,
                // Add credentials for CORS in development mode
                credentials: isDevelopment ? 'include' : 'same-origin',
            });

            if (!response.body) {
                throw new Error("ReadableStream not supported");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let responseText = '';

            // Process the stream
            while (true) {
                const {done, value} = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, {stream: true});
                responseText += chunk;
                onChunk(responseText);
            }

            return responseText;
        } finally {
            this.abortController = null;
        }
    }

    /**
     * Abort the current API request
     */
    abortRequest(): void {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }

    /**
     * Change the LLM model being used
     * @param llmName The name of the LLM to use
     * @returns The response from the server
     */
    async setLLM(llmName: string): Promise<any> {
        const response = await fetch(`${API_URL}/set_llm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                llm_name: llmName
            }),
            // Add credentials for CORS in development mode
            credentials: isDevelopment ? 'include' : 'same-origin',
        });

        if (!response.ok) {
            throw new Error(`Failed to update LLM: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Transcribe audio to text
     * @param audioBlob The audio blob to transcribe
     * @returns The transcribed text
     */
    async transcribeAudio(audioBlob: Blob): Promise<TranscriptionResponse> {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        const response = await fetch(`${API_URL}/transcribe`, {
            method: 'POST',
            body: formData,
            // Add credentials for CORS in development mode
            credentials: isDevelopment ? 'include' : 'same-origin',
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        return  await response.json();
    }

    /**
     * Get Knowledge Base Information
     * @returns {Promise<KnowledgeBaseResponse>} The knowledge base details.
     */
    async getKnowledgeBase(): Promise<KnowledgeBaseResponse> {
        try {
            const response = await fetch(`${API_URL}/knowledge_base`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                // Add credentials for CORS in development mode
                credentials: isDevelopment ? "include" : "same-origin",
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch knowledge base: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error fetching knowledge base: ${error}`);
            throw error;
        }
    }

    async indexKnowledgeBase(): Promise<OperationResponse> {
        try {
            const response = await fetch(`${API_URL}/index`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: isDevelopment ? "include" : "same-origin",
            });

            if (!response.ok) {
                throw new Error(`Failed to index knowledge base: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error indexing knowledge base: ${error}`);
            throw error;
        }
    }

    /**
     * Reset the knowledge base
     * @returns Promise<OperationResponse> Status of the reset operation
     */
    async resetKnowledgeBase(): Promise<OperationResponse> {
        try {
            const response = await fetch(`${API_URL}/reset`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: isDevelopment ? "include" : "same-origin",
            });

            if (!response.ok) {
                throw new Error(`Failed to reset knowledge base: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error resetting knowledge base: ${error}`);
            throw error;
        }
    }

    /**
     * Add a document to the knowledge base
     * @param file The file to add to the knowledge base
     * @returns Promise<OperationResponse> Status of the add document operation
     */
    async addDocument(file: File): Promise<OperationResponse> {
        try {
            const content = await file.text(); // Read the file content as text
            const formData = new FormData();
            formData.append("content", content); // Send the actual content
            formData.append("file_name", file.name);

            const response = await fetch(`${API_URL}/add_document`, {
                method: "POST",
                body: formData,
                credentials: isDevelopment ? "include" : "same-origin",
            });

            if (!response.ok) {
                throw new Error(`Failed to add document: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error adding document: ${error}`);
            throw error;
        }
    }

    /**
     * Get the knowledge base status
     * @returns Promise<OperationResponse> Current status of the knowledge base
     */
    async getKnowledgeBaseStatus(): Promise<OperationResponse> {
        try {
            const response = await fetch(`${API_URL}/knowledge_base_status`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: isDevelopment ? "include" : "same-origin",
            });

            if (!response.ok) {
                throw new Error(`Failed to get knowledge base status: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error getting knowledge base status: ${error}`);
            throw error;
        }
    }

    /**
     * Get the knowledge base graph
     * @returns Promise<OperationResponse> Knowledge base graph data
     */
    async getKnowledgeBaseGraph(): Promise<OperationResponse> {
        try {
            const response = await fetch(`${API_URL}/knowledge_base_graph`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: isDevelopment ? "include" : "same-origin",
            });

            if (!response.ok) {
                throw new Error(`Failed to get knowledge base graph: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error getting knowledge base graph: ${error}`);
            throw error;
        }
    }

    /**
     * Delete a document from the knowledge base
     * @param docId The ID of the document to delete
     * @returns Promise<OperationResponse> Status of the delete operation
     */
    async deleteDocument(docId: string): Promise<OperationResponse> {
        try {
            const response = await fetch(`${API_URL}/delete_document/${encodeURIComponent(docId)}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: isDevelopment ? "include" : "same-origin",
            });

            if (!response.ok) {
                throw new Error(`Failed to delete document: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error deleting document: ${error}`);
            throw error;
        }
    }

    /**
     * Get document content
     * @param docId The ID of the document to get content for
     * @returns Promise<DocContentResponse> The document content
     */
    async getDocContent(docId: string): Promise<DocContentResponse> {
        try {
            const response = await fetch(`${API_URL}/get_doc_content/${encodeURIComponent(docId)}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: isDevelopment ? "include" : "same-origin",
            });

            if (!response.ok) {
                throw new Error(`Failed to get document content: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error getting document content: ${error}`);
            throw error;
        }
    }

    /**
     * Get quick questions configured for the application
     * @returns {Promise<Array<{id: string, text: string}>>} Array of quick question objects
     */
    async getQuickQuestions(): Promise<Array<{id: string, text: string}>> {
        try {
            const response = await fetch(`${API_URL}/quick-questions`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: isDevelopment ? "include" : "same-origin",
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch quick questions: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Ensure we return an array
            if (Array.isArray(data)) {
                return data;
            } else if (data && typeof data === 'object' && 'questions' in data && Array.isArray(data.questions)) {
                return data.questions;
            } else {
                console.error("Unexpected quick questions format:", data);
                return [];
            }
        } catch (error) {
            console.error(`Error fetching quick questions: ${error}`);
            return []; // Return empty array on error instead of throwing
        }
    }
}
// Export a singleton instance
export const apiService = new ApiService();
