from functools import partial
from dotenv import load_dotenv
import nest_asyncio
from anthropic import Anthropic

nest_asyncio.apply()

load_dotenv()
from src.rag_service.lightrag.utils import EmbeddingFunc
from src.rag_service.lightrag.llm.openai import openai_embed, openai_complete_if_cache
import numpy as np


async def embedding_func(texts: list[str], embedding_model) -> np.ndarray:
    return await openai_embed(
        texts,
        model=embedding_model,
    )


async def get_embedding_dimension(embedding_model="text-embedding-3-small"):
    test_text = ["This is a test sentence."]
    embedding = await embedding_func(test_text, embedding_model)
    return embedding.shape[1]


async def create_embedding_function_instance(
    max_token_size=8192, embedding_model="text-embedding-3-small"
):
    embedding_dimension = await get_embedding_dimension(embedding_model)
    return EmbeddingFunc(
        embedding_dim=embedding_dimension,
        max_token_size=max_token_size,
        func=partial(embedding_func, embedding_model=embedding_model),
    )


async def anthropic_llm_model_func(
    prompt,
    system_prompt=None,
    history_messages=[],
    keyword_extraction=False,
    model="claude-3-5-sonnet-20241022",
    api_key="",
    **kwargs,
) -> str:
    # 1. Initialize the Anthropic Client
    client = Anthropic(api_key=api_key)

    # 2. Format messages for Claude's expected structure
    messages = []

    # Add system prompt if provided
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})

    # Add history messages
    if history_messages:
        for msg in history_messages:
            messages.append(
                {
                    "role": "user" if msg["role"].lower() == "user" else "assistant",
                    "content": msg["content"],
                }
            )

    # Add the current prompt
    messages.append({"role": "user", "content": prompt})

    # 3. Call the Claude model
    response = client.messages.create(
        model=model, messages=messages, max_tokens=8192, temperature=0.0
    )

    # 4. Return the response text
    return response.content[0].text


async def openai_llm_model_func(
    prompt,
    system_prompt=None,
    history_messages=[],
    keyword_extraction=False,
    model="gpt4o",
    api_key="",
    **kwargs,
) -> str:
    return await openai_complete_if_cache(
        model=model,
        prompt=prompt,
        system_prompt=system_prompt,
        history_messages=history_messages,
        base_url="https://api.openai.com/v1",
        api_key=api_key,
        **kwargs,
    )


async def get_llm_model_func(type: str, model_id: str, api_key):
    if type == "openai":
        if model_id == "":
            model_id = "gpt4o"
        return partial(openai_llm_model_func, model=model_id, api_key=api_key)
    elif type == "anthropic":
        model_id = "claude-3-5-sonnet-20241022"
        return partial(anthropic_llm_model_func, model=model_id, api_key=api_key)
    else:
        raise ValueError(f"Unknown LLM model type: {type}")
