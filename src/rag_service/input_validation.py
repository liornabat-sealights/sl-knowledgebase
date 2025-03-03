import re
import html


def moderate_content(text):
    """Basic content moderation to prevent harmful or inappropriate requests"""
    # List of sensitive patterns to check
    sensitive_patterns = [
        r"(hack|exploit|attack)\s(system|server|database)",
        r"(sql|code)\s*injection",
        r"(vulnerability|exploit)\s*(scan|test)",
    ]

    for pattern in sensitive_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return False, "Your request contains potentially harmful content."

    return True, ""


# Security functions
def sanitize_input(user_input):
    """Sanitize user input to prevent script injection and other attacks"""
    if not user_input:
        return ""

    # Remove potentially harmful HTML/script tags
    user_input = html.escape(user_input)

    # Prevent prompt injection attempts
    user_input = prevent_prompt_injection(user_input)

    return user_input


def prevent_prompt_injection(text):
    """Basic protection against prompt injection attacks"""
    # Look for common prompt injection patterns
    prompt_injection_patterns = [
        r"ignore previous instructions",
        r"ignore all previous commands",
        r"disregard previous prompts",
        r"system:\s*",
        r"<\s*sys\s*>",
        r"<\s*system\s*>",
        r"User:\s*",
        r"AI:\s*",
        r"Assistant:\s*",
        r"You are now",
        r"From now on",
    ]

    # Check if any patterns match
    for pattern in prompt_injection_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return "[Potentially harmful instruction removed]"

    # Check for large repetition of characters (potential DoS attack)
    if re.search(r"(.)\1{100,}", text):
        return "[Repetitive content removed]"

    return text


def validate_input(user_input):
    """Full input validation"""
    # Check for empty input
    if not user_input or user_input.strip() == "":
        return False, "Please enter a valid question."

    # Limit input length
    MAX_INPUT_LENGTH = 3500
    if len(user_input) > MAX_INPUT_LENGTH:
        return False, f"Input exceeds maximum length of {MAX_INPUT_LENGTH} characters."

    # Check for content moderation
    is_allowed, reason = moderate_content(user_input)
    if not is_allowed:
        return False, reason

    return True, sanitize_input(user_input)


def validate_query_parameters(query_param_object):
    """Validate and sanitize query parameters"""
    # Make a copy to avoid direct modification
    safe_params = query_param_object

    # Ensure max token values are within safe limits
    max_safe_token_limit = 10000
    if safe_params.max_token_for_text_unit > max_safe_token_limit:
        safe_params.max_token_for_text_unit = max_safe_token_limit

    if safe_params.max_token_for_local_context > max_safe_token_limit:
        safe_params.max_token_for_local_context = max_safe_token_limit

    if safe_params.max_token_for_global_context > max_safe_token_limit:
        safe_params.max_token_for_global_context = max_safe_token_limit

    # Ensure top_k is reasonable
    if safe_params.top_k > 200 or safe_params.top_k < 1:
        safe_params.top_k = 120  # Reset to default

    return safe_params
