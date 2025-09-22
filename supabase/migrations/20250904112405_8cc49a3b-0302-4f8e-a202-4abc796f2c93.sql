-- إصلاح مشكلة عدم التطابق بين max_pairs والأزواج الفعلية
-- تحديث max_pairs لتطابق العدد الفعلي للأزواج

-- تحديث اللعبة الأولى لتطابق 4 أزواج
UPDATE pair_matching_games 
SET max_pairs = 4, updated_at = now()
WHERE id = '4057ca72-478e-4820-b701-045c688997ac';

-- تحديث اللعبة الثانية لتطابق 5 أزواج  
UPDATE pair_matching_games 
SET max_pairs = 5, updated_at = now()
WHERE id = 'a06c83e0-4bc0-4970-8e32-837edccdb208';

-- تحديث اللعبة الثالثة لتطابق 5 أزواج
UPDATE pair_matching_games 
SET max_pairs = 5, updated_at = now()
WHERE id = '5742797d-8eb1-49f9-a0e6-575dbfb113f8';

-- إضافة المزيد من الأزواج للألعاب الحالية لتحسين التجربة
-- سنضيف أزواج إضافية من المصطلحات التعليمية المعتمدة

-- إضافة زوج إضافي للعبة الأولى (أساسيات الشبكات)
INSERT INTO pair_matching_pairs (
  game_id,
  left_content,
  right_content,
  left_type,
  right_type,
  explanation,
  order_index
) VALUES 
('4057ca72-478e-4820-b701-045c688997ac', 'عنوان MAC', 'عنوان فيزيائي فريد ومحفور في كرت الشبكة لكل جهاز، ويستخدم في الطبقة الثانية', 'term', 'definition', 'تعريف: عنوان MAC', 5),
('4057ca72-478e-4820-b701-045c688997ac', 'عنوان IP', 'رقم فريد يُستخدم لتحديد هوية جهاز في الشبكة ويمكن أن يكون IPv4 أو IPv6', 'term', 'definition', 'تعريف: عنوان IP', 6);

-- تحديث max_pairs للعبة الأولى إلى 6
UPDATE pair_matching_games 
SET max_pairs = 6, updated_at = now()
WHERE id = '4057ca72-478e-4820-b701-045c688997ac';

-- إضافة أزواج إضافية للعبة الثانية (البروتوكولات والطبقات)
INSERT INTO pair_matching_pairs (
  game_id,
  left_content,
  right_content,
  left_type,
  right_type,
  explanation,
  order_index
) VALUES 
('a06c83e0-4bc0-4970-8e32-837edccdb208', 'بروتوكول TCP', 'بروتوكول موثوق لنقل البيانات يضمن وصول البيانات كاملة ومرتبة', 'term', 'definition', 'تعريف: بروتوكول TCP', 6),
('a06c83e0-4bc0-4970-8e32-837edccdb208', 'بروتوكول UDP', 'بروتوكول سريع لنقل البيانات لكنه غير موثوق ولا يضمن وصول البيانات', 'term', 'definition', 'تعريف: بروتوكول UDP', 7),
('a06c83e0-4bc0-4970-8e32-837edccdb208', 'نموذج OSI', 'نموذج مرجعي يقسم عملية الاتصال إلى سبع طبقات لتسهيل فهم وتطوير الشبكات', 'term', 'definition', 'تعريف: نموذج OSI', 8);

-- تحديث max_pairs للعبة الثانية إلى 8
UPDATE pair_matching_games 
SET max_pairs = 8, updated_at = now()
WHERE id = 'a06c83e0-4bc0-4970-8e32-837edccdb208';

-- إضافة أزواج إضافية للعبة الثالثة
INSERT INTO pair_matching_pairs (
  game_id,
  left_content,
  right_content,
  left_type,
  right_type,
  explanation,
  order_index
) VALUES 
('5742797d-8eb1-49f9-a0e6-575dbfb113f8', 'إيثرنت (Ethernet)', 'تقنية الربط الأكثر شيوعاً في الشبكات المحلية باستخدام الكابلات', 'term', 'definition', 'تعريف: إيثرنت (Ethernet)', 6),
('5742797d-8eb1-49f9-a0e6-575dbfb113f8', 'واي فاي (Wi-Fi)', 'تقنية شبكة لاسلكية تسمح للأجهزة بالاتصال بالإنترنت', 'term', 'definition', 'تعريف: واي فاي (Wi-Fi)', 7),
('5742797d-8eb1-49f9-a0e6-575dbfb113f8', 'جدار الحماية (Firewall)', 'نظام أمني يراقب ويتحكم في حركة البيانات الواردة والصادرة', 'term', 'definition', 'تعريف: جدار الحماية (Firewall)', 8);

-- تحديث max_pairs للعبة الثالثة إلى 8
UPDATE pair_matching_games 
SET max_pairs = 8, updated_at = now()
WHERE id = '5742797d-8eb1-49f9-a0e6-575dbfb113f8';