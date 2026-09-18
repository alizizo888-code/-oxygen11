-- =========================================================================
-- Mutqan Platform - Client Schema (schema_clients.sql)
-- Sovereign IP Protection: SAIP-CR-2024-8891
-- Author/Owner: علي طلعت زيدان (آية)
-- =========================================================================

CREATE TABLE IF NOT EXISTS clients (
    client_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(150) DEFAULT NULL,
    wallet_balance DECIMAL(10, 2) DEFAULT 0.00, -- التفعيل التلقائي برصيد 0.00 ر.س
    registration_status ENUM('active', 'suspended', 'pending') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول عناوين العميل (سجل العناوين الجغرافية)
CREATE TABLE IF NOT EXISTS client_addresses (
    address_id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    city VARCHAR(100) DEFAULT 'مكة المكرمة', -- أو جدة
    district VARCHAR(100) NOT NULL,
    street_address TEXT NOT NULL,
    latitude DECIMAL(10, 8) DEFAULT NULL,
    longitude DECIMAL(11, 8) DEFAULT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
