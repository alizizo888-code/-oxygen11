-- =========================================================================
-- Mutqan Platform - Orders & Dispatch Engine Schema (schema_orders.sql)
-- Sovereign IP Protection: SAIP-CR-2024-8891
-- Author/Owner: علي طلعت زيدان (آية)
-- =========================================================================

CREATE TABLE IF NOT EXISTS service_orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    provider_id INT DEFAULT NULL, -- يُسند تلقائياً أو يدوياً عبر المالك/المشرف
    service_category VARCHAR(100) NOT NULL, -- مثل: تكييف مركزي، اسبليت، غرف تبريد
    order_status ENUM('pending_dispatch', 'assigned_automatic', 'assigned_manual', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending_dispatch',
    dispatch_type ENUM('automatic', 'manual') DEFAULT 'automatic',
    
    -- تفاصيل التسعير والماليات للطلب
    base_price DECIMAL(10, 2) NOT NULL,
    spare_parts_cost DECIMAL(10, 2) DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    platform_commission DECIMAL(10, 2) NOT NULL, -- نسبة المنصة (مثلاً 15%)
    net_provider_amount DECIMAL(10, 2) NOT NULL, -- صافي مستحق الفني/المؤسسة
    total_amount DECIMAL(10, 2) NOT NULL,
    
    payment_method ENUM('online_mada_visa', 'stc_pay', 'wallet', 'cash') DEFAULT 'online_mada_visa',
    payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
    
    address_id INT NOT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(client_id),
    FOREIGN KEY (provider_id) REFERENCES service_providers(provider_id),
    FOREIGN KEY (address_id) REFERENCES client_addresses(address_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول سجل تتبع وتوزيع الطلبات (Log) لضمان الشفافية والتحكيم
CREATE TABLE IF NOT EXISTS order_dispatch_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    action_type VARCHAR(100) NOT NULL, -- مثل: تسعير تلقائي، إسناد يدوي، قبول الفني
    performed_by VARCHAR(150) NOT NULL, -- النظام الآلي أو اسم المشرف/المالك
    details TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES service_orders(order_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
