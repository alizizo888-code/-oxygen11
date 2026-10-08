# WPVibe integration for Oxygen AI Service Core

Connected site: https://mutaqin-maintenance-services.oxygen11.com

## Deployment
The Hostinger GitHub deployment must place `wp-content/plugins/oxygen-ai-service-core/oxygen-ai-service-core.php` into the actual WordPress `wp-content/plugins` directory. Deploying repository root to an unrelated directory does not install the plugin. Verify plugin path and activate through WP Admin or WP-CLI. The GitHub repository ZIP is NOT itself a WordPress plugin ZIP because it contains the whole website.

## WPVibe
WPVibe 1.19.2 is active. It can inspect plugin status, call REST endpoints, and discover WordPress Abilities. After plugin activation, inspect `GET /wp-json/oxygen-core/v1/health`, verify routes, and manage permitted records using the authenticated WordPress connector. Do not expose customers or conversations to public unauthenticated endpoints.

## Security review before production
- Restrict customer, request, conversation and AI chat REST routes with appropriate permissions or signed guest sessions and nonces; current initial core file must NOT be enabled publicly before this fix.
- Ensure customers can only see their own conversations.
- Add rate limiting and input validation.
- Keep API credentials server-side, never in GitHub.
- Add audit logging and role permissions.
- Validate custom AI provider URLs to avoid SSRF.
- Confirm real API capabilities before claiming support for external agents such as Manus.

## Deployment verification
1. WPVibe `plugin list` includes oxygen-ai-service-core.
2. Plugin activation completes without fatal PHP error.
3. `oxygen-core/v1/health` returns `ok: true`.
4. Restricted endpoints reject anonymous requests.
5. Admin dashboard opens and customer/request tables are created.
