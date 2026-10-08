<?php
/**
 * Plugin Name: Oxygen 11 AI Bridge
 * Description: Server-side OpenAI Responses API bridge for Oxygen AI.
 * Version: 1.0.0
 */
if (!defined('ABSPATH')) exit;
add_action('rest_api_init', function () {
    register_rest_route('oxygen-ai/v1', '/chat', [
        'methods' => 'POST',
        'permission_callback' => '__return_true',
        'callback' => function (WP_REST_Request $request) {
            $key = trim((string) get_option('oxygen_ai_openai_api_key', ''));
            if (!$key) return new WP_Error('oxygen_ai_not_configured', 'لم يتم ضبط مفتاح OpenAI على السيرفر.', ['status'=>503]);
            $body = $request->get_json_params();
            $input = isset($body['input']) && is_array($body['input']) ? array_slice($body['input'], -12) : [];
            $instructions = isset($body['instructions']) ? sanitize_textarea_field((string)$body['instructions']) : '';
            if (!$input) return new WP_Error('oxygen_ai_bad_request', 'لم يتم إرسال رسالة.', ['status'=>400]);
            $r = wp_remote_post('https://api.openai.com/v1/responses', [
                'timeout'=>25,
                'headers'=>['Content-Type'=>'application/json','Authorization'=>'Bearer '.$key],
                'body'=>wp_json_encode([
                    'model'=>'gpt-6-luna',
                    'input'=>$input,
                    'instructions'=>$instructions,
                    'max_output_tokens'=>220,
                    'store'=>false,
                ], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES)
            ]);
            if (is_wp_error($r)) return new WP_Error('oxygen_ai_upstream',$r->get_error_message(),['status'=>502]);
            $code=wp_remote_retrieve_response_code($r); $data=json_decode(wp_remote_retrieve_body($r),true);
            if ($code<200 || $code>=300) return new WP_Error('oxygen_ai_upstream',$data['error']['message']??'فشل الاتصال بـ OpenAI.',['status'=>502]);
            $text=trim((string)($data['output_text']??''));
            if (!$text && !empty($data['output'])) foreach($data['output'] as $item) foreach(($item['content']??[]) as $part) if(isset($part['text'])) $text.=$part['text'];
            return ['text'=>trim($text)];
        }
    ]);
});
