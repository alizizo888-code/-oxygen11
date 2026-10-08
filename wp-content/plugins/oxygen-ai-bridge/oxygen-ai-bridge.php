<?php
/**
 * Plugin Name: Oxygen 11 AI Bridge
 * Description: Server-side OpenAI Responses API bridge for Oxygen AI.
 * Version: 1.1.0
 */
if (!defined('ABSPATH')) exit;

function oxygen_ai_get_api_key() {
    if (defined('OXYGEN_AI_OPENAI_API_KEY') && OXYGEN_AI_OPENAI_API_KEY) {
        return trim((string) OXYGEN_AI_OPENAI_API_KEY);
    }
    return trim((string) get_option('oxygen_ai_openai_api_key', ''));
}

function oxygen_ai_get_model() {
    if (defined('OXYGEN_AI_MODEL') && OXYGEN_AI_MODEL) {
        return trim((string) OXYGEN_AI_MODEL);
    }
    return trim((string) get_option('oxygen_ai_model', 'gpt-6-luna')) ?: 'gpt-6-luna';
}

function oxygen_ai_rate_limit() {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $key = 'oxygen_ai_rl_' . md5($ip);
    $count = (int) get_transient($key);
    if ($count >= 20) {
        return new WP_Error('oxygen_ai_rate_limited', 'تم تجاوز حد الطلبات مؤقتاً. حاول بعد دقيقة.', ['status' => 429]);
    }
    set_transient($key, $count + 1, MINUTE_IN_SECONDS);
    return true;
}

add_action('rest_api_init', function () {
    register_rest_route('oxygen-ai/v1', '/health', [
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'callback' => function () {
            return [
                'ok' => true,
                'configured' => oxygen_ai_get_api_key() !== '',
                'model' => oxygen_ai_get_model(),
                'service' => 'oxygen-11-ai',
            ];
        },
    ]);

    register_rest_route('oxygen-ai/v1', '/chat', [
        'methods' => 'POST',
        'permission_callback' => '__return_true',
        'callback' => function (WP_REST_Request $request) {
            $limited = oxygen_ai_rate_limit();
            if (is_wp_error($limited)) return $limited;

            $key = oxygen_ai_get_api_key();
            if ($key === '') {
                return new WP_Error(
                    'oxygen_ai_not_configured',
                    'لم يتم ضبط مفتاح OpenAI على السيرفر.',
                    ['status' => 503]
                );
            }

            $body = $request->get_json_params();
            $input = isset($body['input']) && is_array($body['input'])
                ? array_slice($body['input'], -12)
                : [];
            $instructions = isset($body['instructions'])
                ? sanitize_textarea_field((string) $body['instructions'])
                : '';

            if (!$input) {
                return new WP_Error('oxygen_ai_bad_request', 'لم يتم إرسال رسالة.', ['status' => 400]);
            }

            $payload = [
                'model' => oxygen_ai_get_model(),
                'input' => $input,
                'instructions' => $instructions,
                'max_output_tokens' => 300,
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

            $text = trim((string) ($data['output_text'] ?? ''));
            if ($text === '' && !empty($data['output']) && is_array($data['output'])) {
                foreach ($data['output'] as $item) {
                    foreach (($item['content'] ?? []) as $part) {
                        if (isset($part['text'])) $text .= (string) $part['text'];
                    }
                }
                $text = trim($text);
            }

            if ($text === '') {
                return new WP_Error('oxygen_ai_empty', 'تم الاتصال بالذكاء الاصطناعي ولكن لم يصل نص.', ['status' => 502]);
            }

            return ['text' => $text, 'model' => oxygen_ai_get_model()];
        },
    ]);
});
