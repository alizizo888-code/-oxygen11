-- =========================================================================
-- Mutqan Platform - Governance & Sovereign Control Schema (schema_governance.sql)
-- Sovereign IP Protection: SAIP-CR-2024-8891
-- Author/Owner: علي طلعت زيدان (آية)
-- =========================================================================

CREATE TABLE IF NOT EXISTS platform_governance (
    config_id INT AUTO_INCREMENT PRIMARY KEY,
    sovereign_owner_name VARCHAR(150) DEFAULT 'علي طلعت زيدان (آية)',
    master_auth_key VARCHAR(100) DEFAULT '789512364',
    system_status ENUM('active', 'maintenance', 'emergency_lockdown') DEFAULT 'active',
    default_commission_rate DECIMAL(5, 2) DEFAULT 15.00, -- نسبة عمولة المنصة الافتراضية 15%
    emergency_override_active BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول سجل التحكم والعمليات السيادية للمالك والمشرفين
CREATE TABLE IF NOT EXISTS sovereign_audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    admin_name VARCHAR(150) NOT NULL,
    action_performed TEXT NOT NULL,
    target_entity VARCHAR(100) NOT NULL, -- مثل: فني، عميل، أسعار، نسبة
    ip_address VARCHAR(45) DEFAULT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
