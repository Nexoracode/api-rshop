-- ایجاد جدول برای ترک کلیک‌ها روی اسلایدرها و بنرها
CREATE TABLE IF NOT EXISTS homepage_click_analytics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    element_type ENUM('hero_slider', 'side_banner') NOT NULL,
    element_id INT NOT NULL,
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_ip VARCHAR(45),
    user_agent TEXT,
    INDEX idx_element_type_id (element_type, element_id),
    INDEX idx_clicked_at (clicked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ایجاد view برای آمار کلیک‌ها
CREATE OR REPLACE VIEW homepage_click_stats AS
SELECT 
    element_type,
    element_id,
    COUNT(*) as total_clicks,
    COUNT(DISTINCT user_ip) as unique_users,
    DATE(clicked_at) as click_date
FROM homepage_click_analytics
GROUP BY element_type, element_id, DATE(clicked_at);

-- ایجاد view برای آمار کلی
CREATE OR REPLACE VIEW homepage_click_summary AS
SELECT 
    element_type,
    element_id,
    COUNT(*) as total_clicks,
    COUNT(DISTINCT user_ip) as unique_users,
    MAX(clicked_at) as last_click
FROM homepage_click_analytics
GROUP BY element_type, element_id;
