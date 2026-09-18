-- =========================================================================
-- Mutqan Platform - Service Providers & Technicians Schema (schema_providers.sql)
-- Sovereign IP Protection: SAIP-CR-2024-8891
-- Author/Owner: علي طلعت زيدان (آية)
-- =========================================================================

CREATE TABLE IF NOT EXISTS service_providers (
    provider_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(150) DEFAULT NULL,
    service_type ENUM('ac_maintenance', 'refrigeration', 'electrical', 'plumbing', 'general_contracting') NOT NULL,
    entity_type ENUM('individual_technician', 'maintenance_establishment', 'company') DEFAULT 'individual_technician',
    
    -- بروتوكول التعليق والحالة السيادية (معلق/زائر افتراضياً)
    account_status ENUM('pending_visitor', 'active', 'suspended', 'rejected') DEFAULT 'pending_visitor',
    
    -- توثيق اعتمادات المالك أو المشرف
    approved_by VARCHAR(100) DEFAULT NULL,
    approval_date TIMESTAMP NULL DEFAULT NULL,
    
    wallet_balance DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول مستندات وتراخيص مزود الخدمة (للمراجعة والقبول من قبل المالك)
CREATE TABLE IF NOT EXISTS provider_documents (
    doc_id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    doc_type VARCHAR(100) NOT NULL, -- مثل: رخصة مقاولات، هوية وطنية، شهادة فنية
    file_path TEXT NOT NULL,
    verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES service_providers(provider_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
