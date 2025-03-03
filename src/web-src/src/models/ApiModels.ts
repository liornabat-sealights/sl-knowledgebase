
export interface OperationResponse {
    status: string;
    message: string;
}


export type KnowledgeBaseDocStatus =
    | "Unknown"
    | "Not Indexed"
    | "In Progress"
    | "Indexed"
    | "Index Failed";

export interface KnowledgeBaseDocModel {
    id: string;
    status: KnowledgeBaseDocStatus;
    file_name: string;
    content_length: number;
    content_summary: string;
    chunks_count: number;
    created_at: string; // ISO 8601 Date
    updated_at: string; // ISO 8601 Date
    error?: string;
}

export interface KnowledgeBaseModel {
    name: string;
    status: string; // Default: "Unknown"
    docs: Record<string, KnowledgeBaseDocModel>;
}

export interface KnowledgeBaseResponse {
    status: string;
    knowledge_base: KnowledgeBaseModel;
}

export interface TranscriptionResponse {
    text: string;
}

export interface DocContentResponse {
    status: string;
    message: string;
}

export interface ValidationError {
    loc: (string | number)[];
    msg: string;
    type: string;
}

export interface HTTPValidationError {
    detail?: ValidationError[];
}
