# Oxygen 11 Agent Core

This directory contains development guidance for AI agents working on Oxygen 11.

## Runtime contract

Frontend:
- `/index.html`

WordPress:
- `/wp-json/oxygen-ai/v1/health`
- `/wp-json/oxygen-ai/v1/chat`

The chat bridge reads the OpenAI key from a server-side WordPress option or the server constant `OXYGEN_AI_OPENAI_API_KEY`.

## Agent workflow

1. Inspect the existing code before changing it.
2. Preserve the current UI and business behavior.
3. Make the smallest safe change.
4. Keep secrets out of GitHub.
5. Verify PHP syntax and the REST health contract.
6. Record important architectural changes in this directory.
