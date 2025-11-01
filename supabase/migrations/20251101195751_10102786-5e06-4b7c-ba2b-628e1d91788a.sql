-- إضافة 8 بطاقات جديدة فقط
INSERT INTO grade11_lessons (topic_id, title, content, order_index, is_active)
VALUES
  -- VLAN - البطاقة 1
  ('4116903a-ac52-4d26-be0a-73551f546674', 'مفاهيم VLAN الأساسية', 'تعرف على المفاهيم الأساسية لشبكات VLAN الافتراضية، وفوائدها، وأنواعها المختلفة، وكيفية عمل Native VLAN، والفرق بين منافذ Trunk و Access في السويتش.', 514, true),
  
  -- VLAN - البطاقة 2
  ('4116903a-ac52-4d26-be0a-73551f546674', 'تكوين VLAN على السويتش', 'تعلم كيفية تكوين وإدارة VLANs على سويتش Cisco، بما في ذلك أوامر الإنشاء، تعيين المنافذ، تكوين Trunk، وفهم بروتوكولات VTP و DTP.', 515, true),
  
  -- Inter-VLAN Routing - البطاقة 3
  ('54d05fe2-2ded-4013-976c-19869182c2d2', 'التوجيه بين VLAN - المفاهيم', 'فهم كيفية حل مشكلة الاتصال بين VLANs المختلفة باستخدام Router-on-a-Stick، Subinterfaces، وأنواع Encapsulation المستخدمة.', 516, true),
  
  -- Inter-VLAN Routing - البطاقة 4
  ('54d05fe2-2ded-4013-976c-19869182c2d2', 'التوجيه بين VLAN - التطبيق', 'التطبيق العملي للتوجيه بين VLANs باستخدام Subinterfaces، Layer 3 Switch، SVI، وحل المشاكل الشائعة في Inter-VLAN Routing.', 517, true),
  
  -- التوجيه الثابت - البطاقة 5
  ('9b853c62-26f3-4895-b917-88e2ca27a6c2', 'التوجيه الثابت', 'تعلم أساسيات التوجيه الثابت Static Routes، Default Route، Administrative Distance، والفرق بين Next-Hop و Exit Interface في جدول التوجيه.', 518, true),
  
  -- التوجيه الديناميكي OSPF - البطاقة 6
  ('6c6498f7-9f38-490e-8dab-f08e1d19f1f3', 'التوجيه الديناميكي OSPF', 'فهم بروتوكول OSPF للتوجيه الديناميكي، بما في ذلك Areas، DR/BDR، LSA، Router ID، وكيفية تكوين OSPF على الموجهات.', 519, true),
  
  -- ACL - البطاقة 7
  ('81f08bd1-7cd5-4533-8f09-cd679814ef0f', 'قوائم الوصول ACL الأساسيات', 'تعرف على قوائم الوصول ACL، الفرق بين Standard و Extended ACL، Wildcard Mask، وكيفية معالجة ACL للحزم في الشبكة.', 520, true),
  
  -- ACL - البطاقة 8
  ('81f08bd1-7cd5-4533-8f09-cd679814ef0f', 'تكوين وتطبيق ACL', 'تعلم كيفية تكوين Standard و Extended ACL، Named ACL، وتطبيق قوائم الوصول على المنافذ لتحكم في حركة البيانات في الشبكة.', 521, true);