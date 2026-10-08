<?php
/**
 * Plugin Name: Oxygen AI & Service Core
 * Description: Central AI providers, agents, prompts, customers, requests, conversations and warranties for Oxygen/MUTQAN.
 * Version: 1.0.0
 * Author: Oxygen 11
 * Requires PHP: 8.1
 */
if (!defined('ABSPATH')) exit;

final class Oxygen_AI_Service_Core {
    const VER = '1.0.0';
    const OPT = 'oxygen_core_settings';

    public static function boot() {
        register_activation_hook(__FILE__, [__CLASS__, 'activate']);
        add_action('admin_menu', [__CLASS__, 'admin_menu']);
        add_action('admin_init', [__CLASS__, 'admin_init']);
        add_action('rest_api_init', [__CLASS__, 'rest']);
    }

    private static function tables() {
        global $wpdb;
        $p = $wpdb->prefix . 'oxygen_';
        return [
            'customers' => $p.'customers',
            'requests' => $p.'requests',
            'messages' => $p.'messages',
            'agents' => $p.'agents',
            'prices' => $p.'prices',
            'warranties' => $p.'warranties',
        ];
    }

    public static function activate() {
        global $wpdb;
        require_once ABSPATH.'wp-admin/includes/upgrade.php';
        $t = self::tables(); $c = $wpdb->get_charset_collate();
        dbDelta("CREATE TABLE {$t['customers']} (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, name VARCHAR(190) NOT NULL, phone VARCHAR(80) DEFAULT '',
            email VARCHAR(190) DEFAULT '', address TEXT, location_lat DECIMAL(10,7) NULL, location_lng DECIMAL(10,7) NULL,
            notes TEXT, status VARCHAR(30) DEFAULT 'active', created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL,
            PRIMARY KEY(id), KEY phone(phone), KEY status(status)
        ) $c;");
        dbDelta("CREATE TABLE {$t['requests']} (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, customer_id BIGINT UNSIGNED NOT NULL, request_no VARCHAR(50) NOT NULL,
            service VARCHAR(190) DEFAULT '', details TEXT, status VARCHAR(40) DEFAULT 'new', priority VARCHAR(20) DEFAULT 'normal',
            technician VARCHAR(190) DEFAULT '', price DECIMAL(12,2) DEFAULT 0, payment_status VARCHAR(30) DEFAULT 'unpaid',
            location TEXT, warranty_days INT DEFAULT 0, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL,
            PRIMARY KEY(id), UNIQUE KEY request_no(request_no), KEY customer_id(customer_id), KEY status(status)
        ) $c;");
        dbDelta("CREATE TABLE {$t['messages']} (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, customer_id BIGINT UNSIGNED NULL, request_id BIGINT UNSIGNED NULL,
            role VARCHAR(30) NOT NULL, channel VARCHAR(30) DEFAULT 'web', content LONGTEXT NOT NULL,
            provider VARCHAR(50) DEFAULT '', model VARCHAR(100) DEFAULT '', created_at DATETIME NOT NULL,
            PRIMARY KEY(id), KEY customer_id(customer_id), KEY request_id(request_id), KEY created_at(created_at)
        ) $c;");
        dbDelta("CREATE TABLE {$t['agents']} (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, name VARCHAR(190) NOT NULL, slug VARCHAR(100) NOT NULL,
            provider VARCHAR(50) DEFAULT 'openai', model VARCHAR(100) DEFAULT 'gpt-6-luna',
            instructions LONGTEXT, negotiation LONGTEXT, active TINYINT(1) DEFAULT 1,
            created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, PRIMARY KEY(id), UNIQUE KEY slug(slug)
        ) $c;");
        dbDelta("CREATE TABLE {$t['prices']} (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, service VARCHAR(190) NOT NULL, min_price DECIMAL(12,2) DEFAULT 0,
            max_price DECIMAL(12,2) DEFAULT 0, fixed_price DECIMAL(12,2) DEFAULT 0, discount_percent DECIMAL(5,2) DEFAULT 0,
            negotiation_note TEXT, active TINYINT(1) DEFAULT 1, created_at DATETIME NOT NULL,
            PRIMARY KEY(id), KEY service(service)
        ) $c;");
        dbDelta("CREATE TABLE {$t['warranties']} (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, request_id BIGINT UNSIGNED NOT NULL, customer_id BIGINT UNSIGNED NOT NULL,
            warranty_no VARCHAR(60) NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, terms TEXT,
            status VARCHAR(30) DEFAULT 'active', created_at DATETIME NOT NULL,
            PRIMARY KEY(id), UNIQUE KEY warranty_no(warranty_no), KEY request_id(request_id), KEY customer_id(customer_id)
        ) $c;");
        if (!get_option(self::OPT)) update_option(self::OPT, [
            'default_provider'=>'openai','default_model'=>'gpt-6-luna','openai_key'=>'',
            'gemini_key'=>'','anthropic_key'=>'','custom_url'=>'','custom_key'=>'',
            'custom_model'=>'','default_agent'=>0,'rate_limit'=>20
        ]);
        $now = current_time('mysql');
        if (!$wpdb->get_var("SELECT COUNT(*) FROM {$t['agents']}")) {
            $wpdb->insert($t['agents'], [
                'name'=>'Oxygen Customer Agent','slug'=>'oxygen-customer','provider'=>'openai','model'=>'gpt-6-luna',
                'instructions'=>'أنت مساعد خدمة عملاء أكسجين. كن واضحاً ومهنياً وودوداً. افهم طلب العميل، اجمع البيانات اللازمة، ولا تخترع سعراً غير موجود في قائمة الأسعار.',
                'negotiation'=>'يمكنك التفاوض داخل الحدود المسموح بها فقط. لا تتجاوز الحد الأدنى للسعر، وإذا احتاج العميل استثناءً حوّله لموظف بشري.',
                'active'=>1,'created_at'=>$now,'updated_at'=>$now
            ]);
        }
    }

    private static function settings() { return wp_parse_args(get_option(self::OPT, []), [
        'default_provider'=>'openai','default_model'=>'gpt-6-luna','openai_key'=>'','gemini_key'=>'',
        'anthropic_key'=>'','custom_url'=>'','custom_key'=>'','custom_model'=>'','default_agent'=>0,'rate_limit'=>20
    ]); }

    public static function admin_init() {
        register_setting('oxygen_core_settings', self::OPT, [
            'type'=>'array','sanitize_callback'=>function($v){
                $old=self::settings(); $v=is_array($v)?$v:[];
                foreach(['openai_key','gemini_key','anthropic_key','custom_key'] as $k) {
                    if (!empty($v[$k]) && strlen($v[$k])<10) $v[$k]=$old[$k]??'';
                }
                return array_merge($old, array_map(function($x){return is_string($x)?sanitize_textarea_field($x):$x;},$v));
            }
        ]);
    }

    public static function admin_menu() {
        add_menu_page('Oxygen AI Core','Oxygen AI Core','manage_options','oxygen-core',[__CLASS__,'dashboard'],'dashicons-superhero',25);
        add_submenu_page('oxygen-core','AI Settings','AI Settings','manage_options','oxygen-core-ai',[__CLASS__,'ai_page']);
        add_submenu_page('oxygen-core','AI Commands','AI Commands','manage_options','oxygen-core-agents',[__CLASS__,'agents_page']);
        add_submenu_page('oxygen-core','Customers','Customers','manage_options','oxygen-core-customers',[__CLASS__,'customers_page']);
        add_submenu_page('oxygen-core','Requests & Warranty','Requests & Warranty','manage_options','oxygen-core-requests',[__CLASS__,'requests_page']);
    }

    private static function admin_header($title) {
        echo '<div class="wrap"><h1>'.$title.'</h1><style>
        .oxygen-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px;margin:20px 0}
        .oxygen-card{background:#fff;border:1px solid #dcdcde;border-radius:10px;padding:18px}
        .oxygen-card h2{margin-top:0}.oxygen-muted{color:#646970}
        .oxygen-table{width:100%;border-collapse:collapse;background:#fff}.oxygen-table th,.oxygen-table td{padding:10px;border-bottom:1px solid #eee;text-align:left}
        .oxygen-field{margin:12px 0}.oxygen-field label{display:block;font-weight:600;margin-bottom:5px}.oxygen-field input,.oxygen-field textarea,.oxygen-field select{width:100%;max-width:720px}
        </style>';
    }
    private static function admin_footer(){echo '</div>'; }

    public static function dashboard() {
        global $wpdb; $t=self::tables();
        $counts=[]; foreach(['customers','requests','messages','agents'] as $k) $counts[$k]=(int)$wpdb->get_var("SELECT COUNT(*) FROM {$t[$k]}");
        self::admin_header('Oxygen AI & Service Core');
        echo '<p class="oxygen-muted">مركز التحكم في الذكاء الاصطناعي والعملاء والطلبات والمحادثات والضمانات.</p><div class="oxygen-grid">';
        foreach([['customers','العملاء'],['requests','الطلبات'],['messages','رسائل المحادثات'],['agents','Agents']] as $x)
            echo '<div class="oxygen-card"><h2>'.esc_html($x[1]).'</h2><div style="font-size:30px">'.number_format_i18n($counts[$x[0]]).'</div></div>';
        echo '</div><div class="oxygen-card"><h2>المكونات</h2><p>1) AI Providers & API Keys — 2) Agents/Prompts/Negotiation — 3) Customer & Conversation History — 4) Requests/Status/Warranty.</p></div>';
        self::admin_footer();
    }

    public static function ai_page() {
        $s=self::settings(); self::admin_header('إعدادات الذكاء الاصطناعي');
        echo '<form method="post" action="options.php">'; settings_fields('oxygen_core_settings');
        echo '<div class="oxygen-card"><div class="oxygen-field"><label>المزود الافتراضي</label><select name="'.self::OPT.'[default_provider]">';
        foreach(['openai'=>'OpenAI','gemini'=>'Google Gemini','anthropic'=>'Anthropic / Claude','custom'=>'Custom / Other'] as $k=>$v)
            echo '<option value="'.$k.'" '.selected($s['default_provider'],$k,false).'>'.$v.'</option>';
        echo '</select></div><div class="oxygen-field"><label>الموديل الافتراضي</label><input name="'.self::OPT.'[default_model]" value="'.esc_attr($s['default_model']).'"></div>';
        foreach(['openai_key'=>'OpenAI API Key','gemini_key'=>'Gemini API Key','anthropic_key'=>'Anthropic API Key','custom_key'=>'Custom API Key'] as $k=>$label)
            echo '<div class="oxygen-field"><label>'.esc_html($label).'</label><input type="password" autocomplete="new-password" name="'.self::OPT.'['.$k.']" value="" placeholder="'.(!empty($s[$k])?'مفتاح محفوظ — اتركه كما هو':'أدخل المفتاح هنا').'"></div>';
        echo '<div class="oxygen-field"><label>Custom API URL</label><input name="'.self::OPT.'[custom_url]" value="'.esc_attr($s['custom_url']).'" placeholder="https://..."></div>';
        echo '<div class="oxygen-field"><label>Custom Model</label><input name="'.self::OPT.'[custom_model]" value="'.esc_attr($s['custom_model']).'"></div>';
        echo '<div class="oxygen-field"><label>حد الطلبات لكل دقيقة</label><input type="number" min="1" max="500" name="'.self::OPT.'[rate_limit]" value="'.esc_attr($s['rate_limit']).'"></div>';
        submit_button('حفظ إعدادات الذكاء'); echo '</div></form>';
        echo '<div class="oxygen-card" style="margin-top:16px"><h2>الأمان</h2><p>المفاتيح محفوظة في WordPress فقط ولا تُرسل للواجهة الأمامية ولا تُحفظ في GitHub.</p></div>';
        self::admin_footer();
    }

    public static function agents_page() {
        global $wpdb; $t=self::tables(); $now=current_time('mysql');
        if (!empty($_POST['oxygen_agent_nonce']) && wp_verify_nonce($_POST['oxygen_agent_nonce'],'oxygen_agent_save')) {
            $data=[
                'name'=>sanitize_text_field($_POST['name']??''),'slug'=>sanitize_title($_POST['slug']??$_POST['name']??'agent'),
                'provider'=>sanitize_key($_POST['provider']??'openai'),'model'=>sanitize_text_field($_POST['model']??'gpt-6-luna'),
                'instructions'=>sanitize_textarea_field($_POST['instructions']??''),'negotiation'=>sanitize_textarea_field($_POST['negotiation']??''),
                'active'=>empty($_POST['active'])?0:1,'updated_at'=>$now
            ];
            if (!empty($_POST['id'])) $wpdb->update($t['agents'],$data,['id'=>(int)$_POST['id']]);
            else {$data['created_at']=$now;$wpdb->insert($t['agents'],$data);}
            echo '<div class="notice notice-success"><p>تم حفظ الـAgent.</p></div>';
        }
        $agents=$wpdb->get_results("SELECT * FROM {$t['agents']} ORDER BY id DESC");
        self::admin_header('أوامر الذكاء والـAgents');
        echo '<div class="oxygen-grid">';
        foreach($agents as $a) echo '<div class="oxygen-card"><h2>'.esc_html($a->name).'</h2><p><b>Provider:</b> '.esc_html($a->provider).' | <b>Model:</b> '.esc_html($a->model).'</p><p>'.nl2br(esc_html(wp_trim_words($a->instructions,35))).'</p><p><b>التفاوض:</b> '.nl2br(esc_html(wp_trim_words($a->negotiation,25))).'</p><span class="oxygen-muted">'.($a->active?'نشط':'متوقف').'</span></div>';
        echo '</div><div class="oxygen-card"><h2>إضافة Agent</h2><form method="post">'.wp_nonce_field('oxygen_agent_save','oxygen_agent_nonce',true,false);
        foreach([['name','اسم الـAgent'],['slug','Slug'],['model','Model']] as $f) echo '<div class="oxygen-field"><label>'.$f[1].'</label><input name="'.$f[0].'" required></div>';
        echo '<div class="oxygen-field"><label>Provider</label><select name="provider"><option>openai</option><option>gemini</option><option>anthropic</option><option>custom</option></select></div>';
        echo '<div class="oxygen-field"><label>التعليمات / System Prompt</label><textarea name="instructions" rows="7"></textarea></div>';
        echo '<div class="oxygen-field"><label>قواعد الفصل والتفاوض والأسعار</label><textarea name="negotiation" rows="7"></textarea></div><p><label><input type="checkbox" name="active" checked> نشط</label></p>';
        submit_button('حفظ Agent'); echo '</form></div>'; self::admin_footer();
    }

    public static function customers_page() {
        global $wpdb;$t=self::tables();$rows=$wpdb->get_results("SELECT * FROM {$t['customers']} ORDER BY id DESC LIMIT 100");
        self::admin_header('سجل العملاء');
        echo '<table class="oxygen-table"><thead><tr><th>#</th><th>العميل</th><th>الهاتف</th><th>البريد</th><th>الحالة</th><th>التاريخ</th></tr></thead><tbody>';
        foreach($rows as $r) echo '<tr><td>'.(int)$r->id.'</td><td>'.esc_html($r->name).'</td><td>'.esc_html($r->phone).'</td><td>'.esc_html($r->email).'</td><td>'.esc_html($r->status).'</td><td>'.esc_html($r->created_at).'</td></tr>';
        echo '</tbody></table>'; self::admin_footer();
    }

    public static function requests_page() {
        global $wpdb;$t=self::tables();$rows=$wpdb->get_results("SELECT r.*,c.name customer_name FROM {$t['requests']} r LEFT JOIN {$t['customers']} c ON c.id=r.customer_id ORDER BY r.id DESC LIMIT 100");
        self::admin_header('الطلبات والضمانات');
        echo '<table class="oxygen-table"><thead><tr><th>الطلب</th><th>العميل</th><th>الخدمة</th><th>الحالة</th><th>الأولوية</th><th>السعر</th><th>الضمان</th></tr></thead><tbody>';
        foreach($rows as $r) echo '<tr><td>'.esc_html($r->request_no).'</td><td>'.esc_html($r->customer_name).'</td><td>'.esc_html($r->service).'</td><td>'.esc_html($r->status).'</td><td>'.esc_html($r->priority).'</td><td>'.esc_html($r->price).'</td><td>'.(int)$r->warranty_days.' يوم</td></tr>';
        echo '</tbody></table>'; self::admin_footer();
    }

    private static function auth() {
        if (!current_user_can('manage_options')) return new WP_Error('forbidden','غير مصرح',['status'=>403]);
        return true;
    }

    public static function rest() {
        register_rest_route('oxygen-core/v1','/health',['methods'=>'GET','permission_callback'=>'__return_true','callback'=>function(){
            $s=self::settings(); return ['ok'=>true,'plugin'=>self::VER,'configured'=>!empty($s[$s['default_provider'].'_key']) || $s['default_provider']==='custom' && !empty($s['custom_key'])];
        }]);
        register_rest_route('oxygen-core/v1','/customers',['methods'=>'POST','permission_callback'=>'__return_true','callback'=>[__CLASS__,'create_customer']]);
        register_rest_route('oxygen-core/v1','/requests',['methods'=>'POST','permission_callback'=>'__return_true','callback'=>[__CLASS__,'create_request']]);
        register_rest_route('oxygen-core/v1','/conversations/(?P<customer_id>\d+)',['methods'=>'GET','permission_callback'=>'__return_true','callback'=>[__CLASS__,'conversation']]);
        register_rest_route('oxygen-core/v1','/chat',['methods'=>'POST','permission_callback'=>'__return_true','callback'=>[__CLASS__,'chat']]);
    }

    public static function create_customer($req) {
        global $wpdb;$t=self::tables();$p=$req->get_json_params();$name=sanitize_text_field($p['name']??'');
        if (!$name) return new WP_Error('missing_name','اسم العميل مطلوب',['status'=>400]);
        $now=current_time('mysql');$wpdb->insert($t['customers'],[
            'name'=>$name,'phone'=>sanitize_text_field($p['phone']??''),'email'=>sanitize_email($p['email']??''),
            'address'=>sanitize_textarea_field($p['address']??''),'location_lat'=>isset($p['lat'])?(float)$p['lat']:null,
            'location_lng'=>isset($p['lng'])?(float)$p['lng']:null,'notes'=>sanitize_textarea_field($p['notes']??''),
            'created_at'=>$now,'updated_at'=>$now
        ]);
        return ['id'=>(int)$wpdb->insert_id,'ok'=>true];
    }

    public static function create_request($req) {
        global $wpdb;$t=self::tables();$p=$req->get_json_params();$cid=(int)($p['customer_id']??0);
        if (!$cid) return new WP_Error('missing_customer','customer_id مطلوب',['status'=>400]);
        $no='OXY-'.gmdate('YmdHis').'-'.wp_rand(100,999);$now=current_time('mysql');
        $wpdb->insert($t['requests'],[
            'customer_id'=>$cid,'request_no'=>$no,'service'=>sanitize_text_field($p['service']??''),
            'details'=>sanitize_textarea_field($p['details']??''),'status'=>'new','priority'=>sanitize_key($p['priority']??'normal'),
            'technician'=>sanitize_text_field($p['technician']??''),'price'=>(float)($p['price']??0),
            'payment_status'=>sanitize_key($p['payment_status']??'unpaid'),'location'=>sanitize_textarea_field($p['location']??''),
            'warranty_days'=>(int)($p['warranty_days']??0),'created_at'=>$now,'updated_at'=>$now
        ]);
        return ['id'=>(int)$wpdb->insert_id,'request_no'=>$no,'status'=>'new','ok'=>true];
    }

    public static function conversation($req) {
        global $wpdb;$t=self::tables();$cid=(int)$req['customer_id'];
        return $wpdb->get_results($wpdb->prepare("SELECT id,request_id,role,channel,content,provider,model,created_at FROM {$t['messages']} WHERE customer_id=%d ORDER BY id ASC LIMIT 500",$cid));
    }

    private static function ai_call($provider,$model,$instructions,$input) {
        $s=self::settings();
        $provider= $provider ?: $s['default_provider']; $model=$model ?: $s['default_model'];
        $key='';
        if ($provider==='openai') $key=$s['openai_key']; elseif($provider==='gemini') $key=$s['gemini_key']; elseif($provider==='anthropic') $key=$s['anthropic_key']; else {$key=$s['custom_key'];$model=$s['custom_model']?:$model;}
        if (!$key) return new WP_Error('ai_not_configured','مزود الذكاء غير مضبوط بعد. ضع المفتاح من Oxygen AI Core > AI Settings.',['status'=>503]);
        if ($provider==='openai') {
            $body=['model'=>$model,'instructions'=>$instructions,'input'=>$input,'store'=>false,'max_output_tokens'=>500];
            $res=wp_remote_post('https://api.openai.com/v1/responses',['timeout'=>30,'headers'=>['Authorization'=>'Bearer '.$key,'Content-Type'=>'application/json'],'body'=>wp_json_encode($body)]);
            if (is_wp_error($res)) return $res; $code=wp_remote_retrieve_response_code($res);$json=json_decode(wp_remote_retrieve_body($res),true);
            if ($code>=400) return new WP_Error('ai_upstream',$json['error']['message']??'OpenAI error',['status'=>502]);
            return ['text'=>$json['output_text']??self::extract_output($json),'model'=>$model,'provider'=>$provider];
        }
        if ($provider==='gemini') {
            $url='https://generativelanguage.googleapis.com/v1beta/models/'.rawurlencode($model).':generateContent?key='.rawurlencode($key);
            $body=['systemInstruction'=>['parts'=>[['text'=>$instructions]]],'contents'=>[['role'=>'user','parts'=>[['text'=>is_string($input)?$input:wp_json_encode($input)]]]]];
            $res=wp_remote_post($url,['timeout'=>30,'headers'=>['Content-Type'=>'application/json'],'body'=>wp_json_encode($body)]);
            if (is_wp_error($res)) return $res;$code=wp_remote_retrieve_response_code($res);$json=json_decode(wp_remote_retrieve_body($res),true);
            if ($code>=400) return new WP_Error('ai_upstream',$json['error']['message']??'Gemini error',['status'=>502]);
            return ['text'=>$json['candidates'][0]['content']['parts'][0]['text']??'','model'=>$model,'provider'=>$provider];
        }
        if ($provider==='anthropic') {
            $body=['model'=>$model,'max_tokens'=>500,'system'=>$instructions,'messages'=>[['role'=>'user','content'=>is_string($input)?$input:wp_json_encode($input)]]];
            $res=wp_remote_post('https://api.anthropic.com/v1/messages',['timeout'=>30,'headers'=>['x-api-key'=>$key,'anthropic-version'=>'2023-06-01','Content-Type'=>'application/json'],'body'=>wp_json_encode($body)]);
            if (is_wp_error($res)) return $res;$code=wp_remote_retrieve_response_code($res);$json=json_decode(wp_remote_retrieve_body($res),true);
            if ($code>=400) return new WP_Error('ai_upstream',$json['error']['message']??'Anthropic error',['status'=>502]);
            return ['text'=>$json['content'][0]['text']??'','model'=>$model,'provider'=>$provider];
        }
        $url=esc_url_raw($s['custom_url']); if(!$url) return new WP_Error('custom_url','Custom API URL غير مضبوط',['status'=>503]);
        $res=wp_remote_post($url,['timeout'=>30,'headers'=>['Authorization'=>'Bearer '.$key,'Content-Type'=>'application/json'],'body'=>wp_json_encode(['model'=>$model,'instructions'=>$instructions,'input'=>$input])]);
        if(is_wp_error($res)) return $res;$json=json_decode(wp_remote_retrieve_body($res),true);
        return ['text'=>$json['output_text']??$json['text']??'','model'=>$model,'provider'=>'custom'];
    }

    private static function extract_output($j) {
        if (!empty($j['output']) && is_array($j['output'])) foreach($j['output'] as $item) if(($item['type']??'')==='message') foreach(($item['content']??[]) as $c) if(isset($c['text'])) return $c['text'];
        return '';
    }

    public static function chat($req) {
        global $wpdb;$t=self::tables();$p=$req->get_json_params();$text=trim((string)($p['message']??$p['input']??''));
        if(!$text) return new WP_Error('empty_message','الرسالة فارغة',['status'=>400]);
        $s=self::settings();$cid=(int)($p['customer_id']??0);$rid=(int)($p['request_id']??0);$agent_id=(int)($p['agent_id']??$s['default_agent']);
        $agent=$agent_id?$wpdb->get_row($wpdb->prepare("SELECT * FROM {$t['agents']} WHERE id=%d AND active=1",$agent_id)):null;
        if(!$agent) $agent=$wpdb->get_row("SELECT * FROM {$t['agents']} WHERE active=1 ORDER BY id ASC LIMIT 1");
        $instructions=$agent->instructions??'أنت مساعد خدمة عملاء Oxygen. أجب بالعربية بوضوح.';
        if(!empty($agent->negotiation)) $instructions.="\n\nقواعد التفاوض:\n".$agent->negotiation;
        $wpdb->insert($t['messages'],['customer_id'=>$cid?:null,'request_id'=>$rid?:null,'role'=>'user','channel'=>'web','content'=>sanitize_textarea_field($text),'provider'=>$agent->provider??$s['default_provider'],'model'=>$agent->model??$s['default_model'],'created_at'=>current_time('mysql')]);
        $history=$cid?$wpdb->get_results($wpdb->prepare("SELECT role,content FROM {$t['messages']} WHERE customer_id=%d ORDER BY id DESC LIMIT 12",$cid)):[];$history=array_reverse($history);
        $input=$history; if(!$history) $input=[['role'=>'user','content'=>$text]];
        $r=self::ai_call($agent->provider??$s['default_provider'],$agent->model??$s['default_model'],$instructions,$input);
        if(is_wp_error($r)) return $r;
        $wpdb->insert($t['messages'],['customer_id'=>$cid?:null,'request_id'=>$rid?:null,'role'=>'assistant','channel'=>'web','content'=>sanitize_textarea_field($r['text']??''),'provider'=>$r['provider'],'model'=>$r['model'],'created_at'=>current_time('mysql')]);
        return ['ok'=>true,'text'=>$r['text'],'provider'=>$r['provider'],'model'=>$r['model']];
    }
}
Oxygen_AI_Service_Core::boot();
