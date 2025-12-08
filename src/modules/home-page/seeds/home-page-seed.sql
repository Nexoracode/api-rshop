-- داده‌های نمونه برای اسلایدرهای اصلی
INSERT INTO hero_sliders (title, description, image_url, background_color, button_text, button_link, sort_order, is_active) VALUES
('تسبیح تایگر چشم بین', 'لورم صنعت چاپ و از طراحان گرافیک است', '/uploads/sliders/slider1.jpg', '#E8B4D9', 'مشاهده محصول', '/products/tiger-eye-tasbih', 1, TRUE),
('مصحف همراه (طلاکوب)', 'لورم صنعت چاپ و از طراحان گرافیک است', '/uploads/sliders/slider2.jpg', '#B8D4E8', 'مشاهده محصول', '/products/golden-quran', 2, TRUE);

-- داده‌های نمونه برای بنرهای کناری
INSERT INTO side_banners (title, subtitle, image_url, link, position, badge_text, badge_color, sort_order, is_active) VALUES
('مصحف همراه (طلاکوب)', 'از ۵۴۹,۹۱ تا ۵۵۹ هزار تومان', '/uploads/banners/banner1.jpg', '/category/quran', 'top_right', NULL, NULL, 1, TRUE),
('مصحف همراه (طلاکوب)', 'لورم صنعت چاپ و از طراحان گرافیک است', '/uploads/banners/banner2.jpg', '/category/quran', 'middle_right', NULL, NULL, 2, TRUE),
('تسبیح تایگر (چشم بیر)', 'لورم صنعت چاپ و از طراحان گرافیک است', '/uploads/banners/banner3.jpg', '/category/tasbih', 'bottom_right', '14%', '#FF0000', 3, TRUE),
('مصحف همراه (طلاکوب)', 'جدیدترین بندها و رنگ‌ها', '/uploads/banners/banner4.jpg', '/category/quran', 'bottom_right', NULL, NULL, 4, TRUE);

-- داده‌های نمونه برای بخش‌های صفحه اصلی
INSERT INTO home_sections (title, slug, description, section_type, display_style, products_limit, sort_order, is_active, show_view_all_button, view_all_link) VALUES
('محصولات ویژه', 'special-products', NULL, 'special_products', 'carousel', 10, 1, TRUE, TRUE, '/products?featured=true'),
('محبوب‌ترین محصولات', 'most-popular', NULL, 'most_popular', 'grid', 8, 2, TRUE, TRUE, '/products?sort=popularity');
