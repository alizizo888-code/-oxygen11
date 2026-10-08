<?php
/**
 * Oxygen 11 AI — OpenAI server-side WordPress REST bridge.
 * Store the API key in the WordPress option oxygen_ai_openai_api_key.
 */
add_action('rest_api_init', function () {
    register_rest_route('oxygen-ai/v1', '/chat', [
        'methods' => 'POST',
        'permission_callback' => function () { return true; },
        'callback' => function (WP_REST_Request $request) {
            $key = trim((string) get_option('oxygen_ai_openai_api_key', ''));
            if ($key === '') {
                return new WP_Error('oxygen_ai_not_configured', 'لم يتم ضبط مفتاح OpenAI على السيرفر.', ['status' => 503]);
            }

            $body = $request->get_json_params();
            $input = isset($body['input']) && is_array($body['input']) ? array_slice($body['input'], -12) : [];
            $instructions = isset($body['instructions']) ? sanitize_textarea_field((string) $body['instructions']) : '';

            if (!$input) {
                return new WP_Error('oxygen_ai_bad_request', 'لم يتم إرسال رسالة.', ['status' => 400]);
            }

            $payload = [
                'model' => 'gpt-6-luna',
                'input' => $input,
                'instructions' => $instructions,
                'max_output_tokens' => 220,
                'store' => false,
            ];

            $response = wp_remote_post('https://api.openai.com/v1/responses', [
                'timeout' => 25,
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                    'Authorization' => 'Bearer ' . $key,
                ],
                'body' => wp_json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            ]);

            if (is_wp_error($response)) {
                return new WP_Error('oxygen_ai_upstream', $response->get_error_message(), ['status' => 502]);
            }

            $code = wp_remote_retrieve_response_code($response);
            $raw = wp_remote_retrieve_body($response);
            $data = json_decode($raw, true);

            if ($code < 200 || $code >= 300) {
                $message = $data['error']['message'] ?? 'فشل الاتصال بـ OpenAI.';
                return new WP_Error('oxygen_ai_upstream', $message, ['status' => 502]);
            }

            $text = isset($data['output_text']) ? trim((string) $data['output_text']) : '';
            if ($text === '' && !empty($data['output']) && is_array($data['output'])) {
                foreach ($data['output'] as $item) {
                    foreach (($item['content'] ?? []) as $part) {
                        if (isset($part['text'])) $text .= (string) $part['text'];
                    }
                }
                $text = trim($text);
            }

            return ['text' => $text];
        },
    ]);
});
