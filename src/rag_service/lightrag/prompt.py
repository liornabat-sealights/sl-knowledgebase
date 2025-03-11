from __future__ import annotations
from typing import Any

GRAPH_FIELD_SEP = "<SEP>"

PROMPTS: dict[str, Any] = {}

PROMPTS["DEFAULT_LANGUAGE"] = "English"
PROMPTS["DEFAULT_TUPLE_DELIMITER"] = "<|>"
PROMPTS["DEFAULT_RECORD_DELIMITER"] = "##"
PROMPTS["DEFAULT_COMPLETION_DELIMITER"] = "<|COMPLETE|>"
PROMPTS["process_tickers"] = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]

PROMPTS["DEFAULT_ENTITY_TYPES"] = [
    "Product",
    "Technical Concept",
    "Tool",
    "Organization",
    "File Path",
    "Agent Type",
    "Programming Language",
    "Parameter Name",
    "Version",
    "API Endpoint",
    "Git",
    "Branch",
    "Code Coverage",
    "Code Example",
    "TestCase",
    "Code Snippet",
    "Variable Name",
    "Framework",
    "Technology",
    "Technology AgentFunctional Test",
    "Unit Test",
    "Error Code",
    "Command",
    "Environment Variable",
]

PROMPTS["entity_extraction"] = """-Goal-
Given a code snippet or documentation that is potentially relevant to this activity and a list of entity types, identify all entities of those types from the document data and all relationships among the identified entities.
Use {language} as output language.

-Steps-
1. Identify all entities. For each identified entity, extract the following information:
- entity_name: Name of the entity (e.g., component name, test name, script name)
- entity_type: One of the following types: [{entity_types}]
- entity_description: Comprehensive description of the entity's purpose, functionality, and key characteristics
Format each entity as ("entity"{tuple_delimiter}<entity_name>{tuple_delimiter}<entity_type>{tuple_delimiter}<entity_description>)

2. From the entities identified in step 1, identify all pairs of (source_entity, target_entity) that are *clearly related* to each other.
For each pair of related entities, extract the following information:
- source_entity: name of the source entity, as identified in step 1
- target_entity: name of the target entity, as identified in step 1
- relationship_description: explanation of how the source entity and target entity interact or depend on each other
- relationship_strength: a numeric score indicating coupling strength between the entities (1-10)
- relationship_keywords: one or more technical keywords that describe the relationship type (e.g., "inheritance", "composition", "dependency", "calls")
Format each relationship as ("relationship"{tuple_delimiter}<source_entity>{tuple_delimiter}<target_entity>{tuple_delimiter}<relationship_description>{tuple_delimiter}<relationship_keywords>{tuple_delimiter}<relationship_strength>)

3. Identify technical keywords that summarize the main programming concepts, patterns, or architectural aspects present in the code.
Format the content-level keywords as ("content_keywords"{tuple_delimiter}<technical_keywords>)

4. Return output in {language} as a single list of all the entities and relationships identified in steps 1 and 2. Use **{record_delimiter}** as the list delimiter.

5. When finished, output {completion_delimiter}


#############################
-Real Data-
######################
Entity_types: {entity_types}
Document: {input_text}
######################
Output:
"""

PROMPTS["entity_extraction_examples"] = [
    """Example 1:

Entity_types: [class, function, module, interface, variable, dependency]
Code:
import asyncio

from src.common.log import get_logger
from src.core.otel.service import OtelService
from src.core.storage.service import StorageService
from src.core.messaging.service import MessagingService
from src.core.workers.service import WorkersService
from src.core.exceptions import ServicesError

class Services:
    def __init__(self):
        self.logger = get_logger("core.services")
        self.logger.info("Initializing Core Services")
        try:
            self.otel_service = OtelService()
            self.storage_service = StorageService()
            self.messaging_service = MessagingService()
            self.workers_service = WorkersService()
            self.logger.info("Core Services initialized successfully")
        except ServicesError as e:
            self.logger.error(f"Failed to initialize core services: ")
            raise

    async def start(self):
        self.logger.info("Starting all core services")
        try:
            tasks = [
                self.otel_service.start(),
                self.storage_service.start(),
                self.messaging_service.start(),
                self.workers_service.start(),
            ]
            await asyncio.gather(*tasks)
            self.logger.info("All core services started successfully")
        except Exception as e:
            self.logger.error(f"Unexpected error during core services start: ")
            raise
################
Output:
("entity"{tuple_delimiter}"Services"{tuple_delimiter}"class"{tuple_delimiter}"A core class that manages initialization, starting, and stopping of multiple service components. Implements error handling and logging for service lifecycle management."){record_delimiter}
("entity"{tuple_delimiter}"start"{tuple_delimiter}"function"{tuple_delimiter}"Asynchronous method responsible for starting all core services in parallel using asyncio.gather."){record_delimiter}
("entity"{tuple_delimiter}"OtelService"{tuple_delimiter}"dependency"{tuple_delimiter}"External service component for OpenTelemetry operations."){record_delimiter}
("entity"{tuple_delimiter}"StorageService"{tuple_delimiter}"dependency"{tuple_delimiter}"External service component for handling storage operations."){record_delimiter}
("entity"{tuple_delimiter}"MessagingService"{tuple_delimiter}"dependency"{tuple_delimiter}"External service component for handling messaging operations."){record_delimiter}
("entity"{tuple_delimiter}"WorkersService"{tuple_delimiter}"dependency"{tuple_delimiter}"External service component for managing worker operations."){record_delimiter}
("entity"{tuple_delimiter}"asyncio"{tuple_delimiter}"dependency"{tuple_delimiter}"Python's asynchronous I/O framework used for concurrent operations."){record_delimiter}
("entity"{tuple_delimiter}"ServicesError"{tuple_delimiter}"class"{tuple_delimiter}"Custom exception class for handling service-specific errors."){record_delimiter}
("relationship"{tuple_delimiter}"Services"{tuple_delimiter}"OtelService"{tuple_delimiter}"Services class initializes and manages the lifecycle of OtelService"{tuple_delimiter}"composition, lifecycle management"{tuple_delimiter}9){record_delimiter}
("relationship"{tuple_delimiter}"Services"{tuple_delimiter}"StorageService"{tuple_delimiter}"Services class initializes and manages the lifecycle of StorageService"{tuple_delimiter}"composition, lifecycle management"{tuple_delimiter}9){record_delimiter}
("relationship"{tuple_delimiter}"Services"{tuple_delimiter}"MessagingService"{tuple_delimiter}"Services class initializes and manages the lifecycle of MessagingService"{tuple_delimiter}"composition, lifecycle management"{tuple_delimiter}9){record_delimiter}
("relationship"{tuple_delimiter}"Services"{tuple_delimiter}"WorkersService"{tuple_delimiter}"Services class initializes and manages the lifecycle of WorkersService"{tuple_delimiter}"composition, lifecycle management"{tuple_delimiter}9){record_delimiter}
("relationship"{tuple_delimiter}"Services"{tuple_delimiter}"asyncio"{tuple_delimiter}"Services uses asyncio for concurrent service operations"{tuple_delimiter}"async operations, concurrency"{tuple_delimiter}8){record_delimiter}
("content_keywords"{tuple_delimiter}"service management, async programming, error handling, dependency injection, service lifecycle"{completion_delimiter}
#############################""",
    """Example 2:
## Current Situation

### Token Access

There are no restrictions on the apps that can be accessed using tokens. Each token can access all apps.

### Token Management

All users can view and manage all tokens, as long as they can access the token list page.

|**Token Type**|**Access List**|**View**|**Delete**|**Other Options**|
|---|---|---|---|---|
|Extension Tokens|All users|All tokens|All tokens|All tokens|
|API Tokens|Admin, DevOps|All tokens|All tokens|All tokens|
|Agent Tokens|Devops|All tokens|All tokens|All tokens|
||||||

*Other Actions = Copy / Download / Refresh

# Requirements

Available for all customers.

**Note!** sl-admin can access all three token types pages, view all tokens, and use all actions.

################
Output:
("entity" | "Extension Token" | "Token Types" | "A type of token that can be accessed and managed by all users. It grants full access to all applications and actions, including viewing, deleting, and other operations like copying, downloading, and refreshing.")
("entity" | "API Token" | "Token Types" | "A type of token that can be accessed and managed by Admin and DevOps users. It allows full access to all applications and actions, including viewing, deleting, and other operations like copying, downloading, and refreshing.")
("entity" | "Agent Token" | "Token Types" | "A type of token that can be accessed and managed by DevOps users. It allows full access to all applications and actions, including viewing, deleting, and other operations like copying, downloading, and refreshing.")
("entity" | "User" | "User Roles" | "A general user who can view and manage all tokens as long as they have access to the token list page.")
("entity" | "Admin" | "User Roles" | "A privileged role with access to API Tokens and full permissions over them.")
("entity" | "DevOps" | "User Roles" | "A privileged role that has access to both API Tokens and Agent Tokens, with full control over them.")
("entity" | "sl-admin" | "User Roles" | "A special admin role that has access to all token types, can view all tokens, and perform all possible actions including copying, downloading, and refreshing.")
("entity" | "Application" | "Resources" | "A system or service that tokens can provide access to.")
("entity" | "Action" | "Actions" | "Operations that can be performed on tokens, including viewing, deleting, copying, downloading, and refreshing.")
("entity" | "Token Management" | "Policy" | "A policy defining how users interact with tokens, specifying who can view, manage, and perform actions on them.")
("entity" | "Token Access" | "Policy" | "A policy stating that all tokens can access all applications without restriction.")
("entity" | "Requirements" | "Documentation" | "A statement ensuring that token management and access rules apply to all customers.")

("relationship" | "Extension Token" | "User" | "Users can view and manage all extension tokens." | "permissions" | 7)
("relationship" | "API Token" | "Admin" | "Admins can view and manage all API tokens." | "permissions" | 8)
("relationship" | "API Token" | "DevOps" | "DevOps users can view and manage all API tokens." | "permissions" | 8)
("relationship" | "Agent Token" | "DevOps" | "DevOps users can view and manage all agent tokens." | "permissions" | 8)
("relationship" | "sl-admin" | "Extension Token" | "sl-admins can view, manage, and perform all actions on extension tokens." | "full access" | 10)
("relationship" | "sl-admin" | "API Token" | "sl-admins can view, manage, and perform all actions on API tokens." | "full access" | 10)
("relationship" | "sl-admin" | "Agent Token" | "sl-admins can view, manage, and perform all actions on agent tokens." | "full access" | 10)
("relationship" | "Token Management" | "User" | "Users can manage tokens as long as they have access to the token list page." | "policy enforcement" | 6)
("relationship" | "Token Access" | "Application" | "Tokens grant unrestricted access to all applications." | "security policy" | 9)
("relationship" | "Action" | "Token Types" | "All token types support actions like view, delete, copy, download, and refresh." | "operations" | 7)
("relationship" | "Requirements" | "Policy" | "The policies must be available for all customers." | "compliance" | 5)

("content_keywords" | "role-based access control, token management, permissions, security policy, access control, user roles, API security, resource management")

#############################""",
]

PROMPTS["summarize_entity_descriptions"] = """
You are a technical analyst responsible for creating comprehensive entity summaries that enable cross-entity relationship mapping. Synthesize information from multiple sources to create rich entity profiles.

Given one or more entities and a list of descriptions from multiple sources (User Stories, Functional Tests, Git Patches, and Method Code), create a detailed, coherent summary that encompasses all available information about the entity or group of entities.

Create a unified summary that:
1. Identifies the entity's core purpose across all contexts
2. Resolves source discrepancies through weighted analysis (prioritize code > tests > requirements > docs)
3. Includes metadata from all relevant dimensions:
   - For code: Implementation details, dependencies, coverage status
   - For tests: Associated conditions/actions/results, coverage links
   - For security: Contracts, access levels, policies
   - For business: User stories, Jira tickets, feature toggles
   - For infrastructure: Routes, proxies, configuration
4. Preserves relationship anchors like:
   - "Used in test suite X"
   - "Implements requirement Y"
   - "Modified in patch Z"
   - "Covered by test case T"
   - "Associated with Jira ticket J"

Your summary should:
- Consolidate all technical and functional details from every description
- Include the entity names, their type(s), and their intended technical or business purpose
- Resolve any contradictory details to provide a single, coherent narrative
- Provide enough detail to later enable the inference of relationships among the entities
- Optionally indicate the original source type of the details (e.g., "User Story", "Functional Test", "Git Patch", etc.) when relevant
- Clearly identify relationships to other entities (dependencies, parent-child, uses, etc.)
- Include relevant business logic, requirements, and test coverage information
- Reference file paths, code locations, and version history where available

The summary should be detailed enough to establish clear relationships between this entity and other entities in the system while providing complete technical context.

Use {language} as output language.

#######
-Data-
Entity Type: {entity_type}
Entity Name: {entity_name}
Source Types: {source_types}
Description List: {description_list}
#######
Output:
"""

PROMPTS[
    "entiti_continue_extraction"
] = """MANY entities were missed in the last extraction.  Add them below using the same format:
"""

PROMPTS[
    "entiti_if_loop_extraction"
] = """It appears some entities may have still been missed.  Answer YES | NO if there are still entities that need to be added.
"""

PROMPTS["fail_response"] = (
    "Sorry, I'm not able to provide an answer to that question.[no-context]"
)

PROMPTS["rag_response"] = """---Role---

You are a helpful assistant responding to user query about Knowledge Base provided below.


---Goal---

Generate a concise response based on Knowledge Base and follow Response Rules, considering both the conversation history and the current query. Summarize all information in the provided Knowledge Base, and incorporating general knowledge relevant to the Knowledge Base. Do not include information not provided by Knowledge Base.

When handling relationships with timestamps:
1. Each relationship has a "created_at" timestamp indicating when we acquired this knowledge
2. When encountering conflicting relationships, consider both the semantic content and the timestamp
3. Don't automatically prefer the most recently created relationships - use judgment based on the context
4. For time-specific queries, prioritize temporal information in the content before considering creation timestamps

---Conversation History---
{history}

---Knowledge Base---
{context_data}

---Response Rules---

- Target format and length: {response_type}
- Use markdown formatting with appropriate section headings
- Please respond in the same language as the user's question.
- Ensure the response maintains continuity with the conversation history.
- If you don't know the answer, just say so.
- Do not make anything up. Do not include information not provided by the Knowledge Base."""

PROMPTS["keywords_extraction"] = """
You are an AI assistant specialized in extracting and categorizing keywords from user queries and conversation history. Your task is to identify both high-level (overarching concepts or themes) and low-level (specific entities or details) keywords from the given input.

Here is the relevant conversation history (if any):
<conversation_history>
{history}
</conversation_history>

Here is the user's query:
<query>
{query}
</query>

Please follow these steps to complete the task:

1. Carefully read and analyze the conversation history and query.
2. Inside <keyword_analysis> tags:
   a. List all potential keywords from both the query and conversation history.
   b. Categorize each keyword as either high-level or low-level.
   c. Evaluate the relevance of each keyword to the query and conversation context.
   d. Select the most relevant 3-6 keywords for each category.
3. Based on your analysis, extract two sets of keywords:
   a. High-level keywords: Focus on overarching concepts, themes, or main topics.
   b. Low-level keywords: Focus on specific entities, technical terms, or concrete details.
4. Ensure that the keywords are relevant to the query and any context provided in the conversation history.
5. Format your response as a JSON object with two keys: "high_level_keywords" and "low_level_keywords". Each key should contain an array of string values.

Keep in mind:
- Aim for 5-8 keywords in each category, but adjust based on the complexity of the query.
- Maintain the same language as the input query.
- Ensure that the output is in human-readable text, not unicode characters.

You can refer to the examples provided at the beginning of this prompt for guidance on the expected input and output format.

<examples>
{examples}
</examples>


"""

PROMPTS["keywords_extraction_old"] = """---Role---

You are a helpful assistant tasked with identifying both high-level and low-level keywords in the user's query and conversation history.

---Goal---

Given the query and conversation history, list both high-level and low-level keywords. High-level keywords focus on overarching concepts or themes, while low-level keywords focus on specific entities, details, or concrete terms.

---Instructions---

- Consider both the current query and relevant conversation history when extracting keywords
- Output the keywords in JSON format
- The JSON should have two keys:
  - "high_level_keywords" for overarching concepts or themes
  - "low_level_keywords" for specific entities or details

######################
-Examples-
######################
{examples}

#############################
-Real Data-
######################
Conversation History:
{history}

Current Query: {query}
######################
The `Output` should be human text, not unicode characters. Keep the same language as `Query`.
Output:

"""

PROMPTS["keywords_extraction_examples"] = [
    """Example 1:

Query: "How does TokenPermissionService handle different token access levels across applications?"
################
Output:
{
  "high_level_keywords": ["TokenPermissionService", "Token access levels", "Application security"],
  "low_level_keywords": ["Global Access", "Creator Access", "Group-Based Access", "Legacy Token", "Token Type", "Security Contract"]
}
#############################""",
    """Example 2:

Query: "What are the functional test cases covering the token creation API endpoints?"
################
Output:
{
  "high_level_keywords": ["Functional Test Case", "Token creation", "API Endpoint"],
  "low_level_keywords": ["Test Condition", "Test Action", "Test Expected Result", "Token Management Action", "API Version", "Coverage"]
}
#############################""",
    """Example 3:

Query: "Which methods in the AuthenticationModule are not covered by unit tests?"
################
Output:
{
  "high_level_keywords": ["AuthenticationModule", "Method", "Unit Test Case", "Coverage"],
  "low_level_keywords": ["File Path", "Class", "Interface", "Module", "Business Logic", "Test Suite"]
}
#############################""",
]

PROMPTS["naive_rag_response"] = """---Role---

You are a helpful assistant responding to user query about Document Chunks provided below.

---Goal---

Generate a concise response based on Document Chunks and follow Response Rules, considering both the conversation history and the current query. Summarize all information in the provided Document Chunks, and incorporating general knowledge relevant to the Document Chunks. Do not include information not provided by Document Chunks.

When handling content with timestamps:
1. Each piece of content has a "created_at" timestamp indicating when we acquired this knowledge
2. When encountering conflicting information, consider both the content and the timestamp
3. Don't automatically prefer the most recent content - use judgment based on the context
4. For time-specific queries, prioritize temporal information in the content before considering creation timestamps

---Conversation History---
{history}

---Document Chunks---
{content_data}

---Response Rules---

- Target format and length: {response_type}
- Use markdown formatting with appropriate section headings
- Please respond in the same language as the user's question.
- Ensure the response maintains continuity with the conversation history.
- If you don't know the answer, just say so.
- Do not include information not provided by the Document Chunks."""

PROMPTS[
    "similarity_check"
] = """Please analyze the similarity between these two questions:

Question 1: {original_prompt}
Question 2: {cached_prompt}

Please evaluate whether these two questions are semantically similar, and whether the answer to Question 2 can be used to answer Question 1, provide a similarity score between 0 and 1 directly.

Similarity score criteria:
0: Completely unrelated or answer cannot be reused, including but not limited to:
   - The questions have different topics
   - The locations mentioned in the questions are different
   - The times mentioned in the questions are different
   - The specific individuals mentioned in the questions are different
   - The specific events mentioned in the questions are different
   - The background information in the questions is different
   - The key conditions in the questions are different
1: Identical and answer can be directly reused
0.5: Partially related and answer needs modification to be used
Return only a number between 0-1, without any additional content.
"""


PROMPTS["mix_rag_response"] = """--Role--

You are a helpful assistant responding to a user query about Data Sources provided below.

---Goal---

Generate a detailed and exhaustive response based on the provided Data Sources and follow the Response Rules. Data Sources include two parts: Knowledge Graph (KG) and Document Chunks (DC). Extract and list all relevant information in full detail without merging or summarizing key elements. Incorporate general knowledge relevant to the Data Sources only if it directly supports the provided information. Do not include any details that are not present in the Data Sources.

When handling information with timestamps:
1. Each piece of information (both relationships and content) has a "created_at" timestamp indicating when we acquired this knowledge
2. When encountering conflicting information, consider both the content/relationship and the timestamp
3. Don't automatically prefer the most recent information - use judgment based on the context
4. For time-specific queries, prioritize temporal information in the content before considering creation timestamps

---Conversation History---
{history}

---Data Sources---

From Knowledge Graph (KG):
{kg_context}

From Document Chunks (DC):
{vector_context}

---Response Rules---

- Target format: Markdown with appropriate section headings, clear and descriptive titles, and comprehensive information
- Response Length: Detailed and exhaustive response
- Response language: Same as the user's question
- Use markdown formatting with appropriate section headings
- Please respond in the same language as the user's question
- Ensure the response maintains continuity with the conversation history
- Present comprehensive information in tabular format when appropriate
- Prioritize completeness over conciseness for listing queries
- If there are links or references in the Data Sources, include them in the response with proper formatting and context
- If you don't know the answer, just say so. Do not make anything up.
- Do not include information not provided by the Data Sources."""

PROMPTS["mix_rag_response_old"] = """---Role---

You are a helpful assistant responding to user query about Data Sources provided below.


---Goal---

Generate a detailed response based on Data Sources and follow Response Rules, considering both the conversation history and the current query. Data sources contain two parts: Knowledge Graph(KG) and Document Chunks(DC). Summarize all information in the provided Data Sources, and incorporating general knowledge relevant to the Data Sources. Do not include information not provided by Data Sources.

When handling information with timestamps:
1. Each piece of information (both relationships and content) has a "created_at" timestamp indicating when we acquired this knowledge
2. When encountering conflicting information, consider both the content/relationship and the timestamp
3. Don't automatically prefer the most recent information - use judgment based on the context
4. For time-specific queries, prioritize temporal information in the content before considering creation timestamps

---Conversation History---
{history}

---Data Sources---

1. From Knowledge Graph(KG):
{kg_context}

2. From Document Chunks(DC):
{vector_context}

---Response Rules---

- Target format and length: {response_type}
- Use markdown formatting with appropriate section headings
- Please respond in the same language as the user's question.
- Ensure the response maintains continuity with the conversation history.
- Organize answer in sections 
- Use clear and descriptive section titles that reflect the content
- If you don't know the answer, just say so. Do not make anything up.
- Do not include information about the Data Sources.
- Do not include information not provided by the Data Sources."""


exterations="""
You are an AI assistant specialized in extracting and categorizing keywords from user queries and conversation history. Your task is to identify both high-level (overarching concepts or themes) and low-level (specific entities or details) keywords from the given input.

Here is the relevant conversation history (if any):
<conversation_history>
{history}
</conversation_history>

Here is the user's query:
<query>
{query}
</query>

Please follow these steps to complete the task:

1. Carefully read and analyze the conversation history and query.
2. Inside <keyword_analysis> tags:
   a. List all potential keywords from both the query and conversation history.
   b. Categorize each keyword as either high-level or low-level.
   c. Evaluate the relevance of each keyword to the query and conversation context.
   d. Select the most relevant 3-6 keywords for each category.
3. Based on your analysis, extract two sets of keywords:
   a. High-level keywords: Focus on overarching concepts, themes, or main topics.
   b. Low-level keywords: Focus on specific entities, technical terms, or concrete details.
4. Ensure that the keywords are relevant to the query and any context provided in the conversation history.
5. Format your response as a JSON object with two keys: "high_level_keywords" and "low_level_keywords". Each key should contain an array of string values.

Keep in mind:
- Aim for 5-8 keywords in each category, but adjust based on the complexity of the query.
- Maintain the same language as the input query.
- Ensure that the output is in human-readable text, not unicode characters.

You can refer to the examples provided at the beginning of this prompt for guidance on the expected input and output format.

<examples>
{examples}
</examples>

"""

full_prompt="""
You are an AI assistant specialized in extracting and categorizing keywords from user queries and conversation history. Your task is to identify both high-level (overarching concepts or themes) and low-level (specific entities or details) keywords from the given input.

Here is the relevant conversation history (if any):
<conversation_history>

</conversation_history>



Please follow these steps to complete the task:

1. Carefully read and analyze the conversation history and query.
2. Inside <keyword_analysis> tags:
   a. List all potential keywords from both the query and conversation history.
   b. Categorize each keyword as either high-level or low-level.
   c. Evaluate the relevance of each keyword to the query and conversation context.
   d. Select the most relevant 3-6 keywords for each category.
3. Based on your analysis, extract two sets of keywords:
   a. High-level keywords: Focus on overarching concepts, themes, or main topics.
   b. Low-level keywords: Focus on specific entities, technical terms, or concrete details.
4. Ensure that the keywords are relevant to the query and any context provided in the conversation history.
5. Format your response as a JSON object with two keys: "high_level_keywords" and "low_level_keywords". Each key should contain an array of string values.

Keep in mind:
- Aim for 5-8 keywords in each category, but adjust based on the complexity of the query.
- Maintain the same language as the input query.
- Ensure that the output is in human-readable text, not unicode characters.

You can refer to the examples provided at the beginning of this prompt for guidance on the expected input and output format.

<examples>
{examples}
Example 1:

Query: "How does TokenPermissionService handle different token access levels across applications?"
################
Output:
{
  "high_level_keywords": ["TokenPermissionService", "Token access levels", "Application security"],
  "low_level_keywords": ["Global Access", "Creator Access", "Group-Based Access", "Legacy Token", "Token Type", "Security Contract"]
}
#############################
Example 2:

Query: "What are the functional test cases covering the token creation API endpoints?"
################
Output:
{
  "high_level_keywords": ["Functional Test Case", "Token creation", "API Endpoint"],
  "low_level_keywords": ["Test Condition", "Test Action", "Test Expected Result", "Token Management Action", "API Version", "Coverage"]
}
#############################,
Example 3:

Query: "Which methods in the AuthenticationModule are not covered by unit tests?"
################
Output:
{
  "high_level_keywords": ["AuthenticationModule", "Method", "Unit Test Case", "Coverage"],
  "low_level_keywords": ["File Path", "Class", "Interface", "Module", "Business Logic", "Test Suite"]
}
#############################

Here is the user's query:
<query>
give me a list of agenets and how to install them
</query>
"""