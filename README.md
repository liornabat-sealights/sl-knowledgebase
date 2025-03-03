# sl-knowledgebase

## Configuration

### Quick Questions

The application supports configurable "Quick Questions" that appear in the chat interface. These are pre-defined questions that users can click to quickly ask common questions without typing.

#### Configuring Quick Questions

Quick questions can be configured in multiple ways:

1. **Environment Variables**:
   
   **Method 1: Single Comma-Separated List (Recommended)**:
   
   Define all questions as a single comma-separated list:
   
   ```
   QUICK_QUESTIONS="How do I integrate Sealights Java Agent?,How to set up Cucumber.js with Sealights Node Agent?,What is LabId and how can I use it?,What is TIA and how can I use it?"
   ```
   
   **Method 2: Individual Questions (Legacy)**:
   
   Define questions individually (for backward compatibility):
   
   ```
   QUICK_QUESTION_1="How do I integrate Sealights Java Agent?"
   QUICK_QUESTION_2="How to set up Cucumber.js with Sealights Node Agent?"
   QUICK_QUESTION_3="What is LabId and how can I use it?"
   QUICK_QUESTION_4="What is TIA and how can I use it?"
   ```
   
   > Note: If both methods are used, the individual questions (Method 2) will take precedence.

2. **Direct Config Update**:
   
   You can also modify the questions in `src/rag_service/config.py` file by updating the `quick_questions_str` field.

#### Format Requirements

Each quick question must have the following structure:
```json
{
  "id": "unique_identifier",
  "text": "The question text to display"
}
```

The system will try to automatically format questions if they don't match this structure, but it's best to follow this format explicitly.

#### UI Behavior

- If fewer than 4 questions are configured, they will display in a single row
- If more than 4 questions are configured, they will adapt to a grid layout
- If more than 6 questions are configured, a horizontal scrolling interface will appear
- If no questions are configured or there's an error, the quick questions section will not be displayed

#### Troubleshooting

If you encounter issues with quick questions not displaying:

1. Check browser console for errors
2. Verify that your configuration follows the correct format with `id` and `text` fields
3. If you've modified the configuration, restart the backend service
4. Clear browser cache if needed