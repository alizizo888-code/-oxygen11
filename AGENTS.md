# Oxygen 11 — Agent Development Rules

This repository is the AI/development core for Oxygen 11.

## Source of truth
- Production branch: main
- Frontend: index.html
- WordPress AI bridge: wp-content/plugins/oxygen-ai-bridge/oxygen-ai-bridge.php
- Optional REST reference: wordpress/oxygen-ai-endpoint.php

## Rules
- Continue the existing project; do not rebuild it as a new application.
- Do not add Node/Express runtime files.
- Never commit API keys, tokens, cookies, passwords, or secrets.
- Keep OpenAI credentials server-side only.
- Keep the existing Oxygen AI UI unless a change is explicitly requested.
- Use the OpenAI Responses API for new AI work.
- Keep Agent instructions and development documentation under agent/.
- Test the REST health endpoint before diagnosing chat failures.
