-- إضافة فيديوهات الصف الثاني عشر الـ19 بدقة متناهية مع معرف المستخدم الصحيح

INSERT INTO public.grade12_videos (
  title, 
  video_url, 
  thumbnail_url, 
  source_type, 
  category, 
  order_index,
  owner_user_id,
  school_id,
  is_active,
  is_visible
) VALUES
-- الدرس الأول
('الدرس الأول: تحضير المجلدات والصور', 
 'https://drive.google.com/file/d/1ZDO7mMCTe00Y_2UzAYXTP0h4iZQ_id3E/preview',
 'https://drive.google.com/thumbnail?id=1ZDO7mMCTe00Y_2UzAYXTP0h4iZQ_id3E&sz=w320-h180',
 'google_drive', 'networks', 1, '0ddfe7c4-c5b2-4d08-b376-9a92e31a4160', NULL, true, true),

-- الدرس الثاني
('الدرس الثاني: إعدادات فروع الشركة', 
 'https://drive.google.com/file/d/16gXLcCICDt5HBtr_BV-YnN_ibi6yZLZD/preview',
 'https://drive.google.com/thumbnail?id=16gXLcCICDt5HBtr_BV-YnN_ibi6yZLZD&sz=w320-h180',
 'google_drive', 'networks', 2, '0ddfe7c4-c5b2-4d08-b376-9a92e31a4160', NULL, true, true),

-- الدرس الثالث
('الدرس الثالث: شبكة الميترو إيثرنت وتوصيل الفروع مع بعض', 
 'https://drive.google.com/file/d/1eZDDfXMFQfZP0pneBb2ml_vAMfHKef-r/preview',
 'https://drive.google.com/thumbnail?id=1eZDDfXMFQfZP0pneBb2ml_vAMfHKef-r&sz=w320-h180',
 'google_drive', 'networks', 3, '0ddfe7c4-c5b2-4d08-b376-9a92e31a4160', NULL, true, true),

-- الدرس الرابع
('الدرس الرابع: تكملة إعدادات الفروع وفحص الاتصال بين الفروع', 
 'https://drive.google.com/file/d/1It_mZCjNqFkv6MRJTLDAFopT1awCur1l/preview',
 'https://drive.google.com/thumbnail?id=1It_mZCjNqFkv6MRJTLDAFopT1awCur1l&sz=w320-h180',
 'google_drive', 'networks', 4, '0ddfe7c4-c5b2-4d08-b376-9a92e31a4160', NULL, true, true),

-- الدرس الخامس
('الدرس الخامس: بداية تجهيز الفرع الأول', 
 'https://drive.google.com/file/d/1pVg_xi3JGrb8QScUUxSSHr6GvFsLffwV/preview',
 'https://drive.google.com/thumbnail?id=1pVg_xi3JGrb8QScUUxSSHr6GvFsLffwV&sz=w320-h180',
 'google_drive', 'networks', 5, '0ddfe7c4-c5b2-4d08-b376-9a92e31a4160', NULL, true, true),

-- الدرس السادس
('الدرس السادس: تكملة إضافة الأقسام في الفرع الأول', 
 'https://drive.google.com/file/d/1Tm7tONUWoM6szi5wg4lQjBiG8MgCJ9vp/preview',
 'https://drive.google.com/thumbnail?id=1Tm7tONUWoM6szi5wg4lQjBiG8MgCJ9vp&sz=w320-h180',
 'google_drive', 'networks', 6, '0ddfe7c4-c5b2-4d08-b376-9a92e31a4160', NULL, true, true),

-- الدرس السابع
('الدرس السابع: تفعيل بروتوكول VTP', 
 'https://drive.google.com/file/d/1N_x1DiuMrHeo6y71uzDEd9_l4WqFhIlb/preview',
 'https://drive.google.com/thumbnail?id=1N_x1DiuMrHeo6y71uzDEd9_l4WqFhIlb&sz=w320-h180',
 'google_drive', 'networks', 7, '0ddfe7c4-c5b2-4d08-b376-9a92e31a4160', NULL, true, true),

-- الدرس الثامن
('الدرس الثامن: إعدادات الـ VLAN', 
 'https://drive.google.com/file/d/1jCLmqLkqWkHPdYdtnWU5oXrHUkjSbMSw/preview',
 'https://drive.google.com/thumbnail?id=1jCLmqLkqWkHPdYdtnWU5oXrHUkjSbMSw&sz=w320-h180',
 'google_drive', 'networks', 8, '0ddfe7c4-c5b2-4d08-b376-9a92e31a4160', NULL, true, true),

-- الدرس التاسع
('الدرس التاسع: تكملة إعدادات الـ VLAN', 
 'https://drive.google.com/file/d/1nWtpO2UOVrp1ON3-WmCMnHF0HIyT8hgy/preview',
 'https://drive.google.com/thumbnail?id=1nWtpO2UOVrp1ON3-WmCMnHF0HIyT8hgy&sz=w320-h180',
 'google_drive', 'networks', 9, '0ddfe7c4-c5b2-4d08-b376-9a92e31a4160', NULL, true, true),

-- الدرس العاشر
('الدرس العاشر: تفعيل بروتوكول dot1q وتكملة الإعدادات', 
 'https://drive.google.com/file/d/1xXJebtbdYs_bshhjBCnxfFGRs068lVCM/preview',
 'https://drive.google.com/thumbnail?id=1xXJebtbdYs_bshhjBCnxfFGRs068lVCM&sz=w320-h180',
 'google_drive', 'networks', 10, '0ddfe7c4-c5b2-4d08-b376-9a92e31a4160', NULL, true, true),

-- الدرس الحادي عشر
('الدرس الحادي عشر: IoT, DNS, HTTP Server', 
 'https://drive.google.com/file/d/1fJbwhiQ1mInaUL1riH7S2GecoqRp5y40/preview',
 'https://drive.google.com/thumbnail?id=1fJbwhiQ1mInaUL1riH7S2GecoqRp5y40&sz=w320-h180',
 'google_drive', 'networks', 11, '0ddfe7c4-c5b2-4d08-b376-9a92e31a4160', NULL, true, true),

-- الدرس الثاني عشر
('الدرس الثاني عشر: Mail and TFTP Server', 
 'https://drive.google.com/file/d/1LUC6Ronh5LejGph_P1_jF-nMu88YJOBJ/preview',
 'https://drive.google.com/thumbnail?id=1LUC6Ronh5LejGph_P1_jF-nMu88YJOBJ&sz=w320-h180',
 'google_drive', 'networks', 12, '0ddfe7c4-c5b2-4d08-b376-9a92e31a4160', NULL, true, true),

-- الدرس الثالث عشر
('الدرس الثالث عشر: Telnet & SSH', 
 'https://drive.google.com/file/d/1NtVZiatYvyw2vXOnSqDPhzj33Ymg8FJg/preview',
 'https://drive.google.com/thumbnail?id=1NtVZiatYvyw2vXOnSqDPhzj33Ymg8FJg&sz=w320-h180',
 'google_drive', 'networks', 13, '0ddfe7c4-c5b2-4d08-b376-9a92e31a4160', NULL, true, true),

-- الدرس الرابع عشر
('الدرس الرابع عشر: إعدادات البانر', 
 'https://drive.google.com/file/d/1gNd2jobiz9kEW1vbFqjXjqjIDmnFIjrc/preview',
 'https://drive.google.com/thumbnail?id=1gNd2jobiz9kEW1vbFqjXjqjIDmnFIjrc&sz=w320-h180',
 'google_drive', 'networks', 14, '0ddfe7c4-c5b2-4d08-b376-9a92e31a4160', NULL, true, true),

-- الدرس الخامس عشر
('الدرس الخامس عشر: Port Security', 
 'https://drive.google.com/file/d/1VWBoiF0Gyjm1ffIqn-WKWazsXaiKFrTh/preview',
 'https://drive.google.com/thumbnail?id=1VWBoiF0Gyjm1ffIqn-WKWazsXaiKFrTh&sz=w320-h180',
 'google_drive', 'networks', 15, '0ddfe7c4-c5b2-4d08-b376-9a92e31a4160', NULL, true, true),

-- الدرس السادس عشر
('الدرس السادس عشر: Access List', 
 'https://drive.google.com/file/d/17FBCJDsCqFwkIHjCjuGmX6DCwqpBu1qt/preview',
 'https://drive.google.com/thumbnail?id=17FBCJDsCqFwkIHjCjuGmX6DCwqpBu1qt&sz=w320-h180',
 'google_drive', 'networks', 16, '0ddfe7c4-c5b2-4d08-b376-9a92e31a4160', NULL, true, true),

-- الدرس السابع عشر
('الدرس السابع عشر: إضافة خدمة الإنترنت للمشروع', 
 'https://drive.google.com/file/d/11aJIqg7QpdobElm9uW-3dmWuQ3Yhod3a/preview',
 'https://drive.google.com/thumbnail?id=11aJIqg7QpdobElm9uW-3dmWuQ3Yhod3a&sz=w320-h180',
 'google_drive', 'networks', 17, '0ddfe7c4-c5b2-4d08-b376-9a92e31a4160', NULL, true, true),

-- الدرس الثامن عشر
('الدرس الثامن عشر: تكملة إعدادات الإنترنت', 
 'https://drive.google.com/file/d/1uXbtjZTBqgy-tMQHxugalGrUiXwuz0EF/preview',
 'https://drive.google.com/thumbnail?id=1uXbtjZTBqgy-tMQHxugalGrUiXwuz0EF&sz=w320-h180',
 'google_drive', 'networks', 18, '0ddfe7c4-c5b2-4d08-b376-9a92e31a4160', NULL, true, true),

-- الدرس التاسع عشر
('الدرس التاسع عشر: تفعيل DHCP في الراوتر بالفرع الثاني', 
 'https://drive.google.com/file/d/1iQrAn8jS1TK2MWc5BfIr91F5V9F_-N20/preview',
 'https://drive.google.com/thumbnail?id=1iQrAn8jS1TK2MWc5BfIr91F5V9F_-N20&sz=w320-h180',
 'google_drive', 'networks', 19, '0ddfe7c4-c5b2-4d08-b376-9a92e31a4160', NULL, true, true);