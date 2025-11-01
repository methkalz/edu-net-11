-- أسئلة البطاقات 5-8 (40 سؤال)

-- أسئلة البطاقة 5: التوجيه الثابت (order_index = 518)
INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما هو Static Route؟', 'multiple_choice', '{"a": "مسار يتم تكوينه يدوياً من قبل المدير", "b": "مسار يتعلمه الموجه تلقائياً", "c": "مسار للإنترنت فقط", "d": "مسار مؤقت"}', 'a', 'easy', 10, 'Static Route هو مسار يتم تكوينه يدوياً في جدول التوجيه ولا يتغير إلا بتدخل المدير.'
FROM grade11_lessons WHERE order_index = 518 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما الصيغة الصحيحة لأمر Static Route؟', 'multiple_choice', '{"a": "route 192.168.1.0 255.255.255.0 10.0.0.1", "b": "ip route 192.168.1.0 255.255.255.0 10.0.0.1", "c": "static 192.168.1.0 255.255.255.0 10.0.0.1", "d": "add route 192.168.1.0 255.255.255.0 10.0.0.1"}', 'b', 'medium', 12, 'الصيغة الصحيحة: ip route [destination network] [subnet mask] [next-hop IP or exit interface].'
FROM grade11_lessons WHERE order_index = 518 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما هو Default Route؟', 'multiple_choice', '{"a": "مسار للشبكات غير المعروفة", "b": "أول مسار في الجدول", "c": "مسار للإنترنت فقط", "d": "مسار معطل"}', 'a', 'easy', 10, 'Default Route (0.0.0.0/0) يستخدم لتوجيه جميع الحزم إلى الشبكات غير الموجودة في جدول التوجيه.'
FROM grade11_lessons WHERE order_index = 518 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما هو Administrative Distance (AD)؟', 'multiple_choice', '{"a": "مسافة الشبكة", "b": "قيمة لتحديد أولوية مصادر التوجيه", "c": "سرعة الموجه", "d": "عدد الموجهات"}', 'b', 'medium', 12, 'AD هي قيمة (من 0-255) تحدد أولوية مصادر المسارات، القيمة الأقل لها أولوية أعلى.'
FROM grade11_lessons WHERE order_index = 518 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما قيمة AD الافتراضية لـ Static Route؟', 'multiple_choice', '{"a": "0", "b": "1", "c": "5", "d": "10"}', 'b', 'easy', 10, 'القيمة الافتراضية لـ AD لـ Static Route هي 1 (فقط Connected routes لها AD = 0).'
FROM grade11_lessons WHERE order_index = 518 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما الفرق بين Next-Hop IP و Exit Interface في Static Route؟', 'multiple_choice', '{"a": "لا يوجد فرق", "b": "Next-Hop يحدد IP الموجه التالي، Exit Interface يحدد المنفذ الخارج", "c": "Exit Interface أسرع دائماً", "d": "Next-Hop للشبكات الكبيرة فقط"}', 'b', 'medium', 12, 'Next-Hop IP يحدد عنوان الموجه التالي، بينما Exit Interface يحدد المنفذ الذي تخرج منه الحزمة.'
FROM grade11_lessons WHERE order_index = 518 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'كيف عرض جدول التوجيه؟', 'multiple_choice', '{"a": "display route", "b": "show ip route", "c": "get routes", "d": "list routes"}', 'b', 'easy', 10, 'الأمر show ip route يعرض جدول التوجيه الكامل مع جميع المسارات المتاحة.'
FROM grade11_lessons WHERE order_index = 518 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما هو Floating Static Route؟', 'multiple_choice', '{"a": "مسار يطفو على الماء", "b": "مسار احتياطي بـ AD أعلى", "c": "مسار سريع جداً", "d": "مسار للشبكات الصغيرة"}', 'b', 'hard', 15, 'Floating Static Route هو مسار احتياطي يتم تكوينه بـ AD أعلى، يُستخدم فقط عند فشل المسار الأساسي.'
FROM grade11_lessons WHERE order_index = 518 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'كيف حذف Static Route؟', 'multiple_choice', '{"a": "delete route", "b": "remove route", "c": "no ip route [destination] [mask] [next-hop]", "d": "clear route"}', 'c', 'medium', 12, 'الأمر no ip route متبوعاً بنفس معاملات المسار الأصلي يحذف Static Route.'
FROM grade11_lessons WHERE order_index = 518 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'متى يُفضل استخدام Static Routes؟', 'multiple_choice', '{"a": "في الشبكات الكبيرة جداً", "b": "في الشبكات الصغيرة أو للمسارات الاحتياطية", "c": "مع الإنترنت فقط", "d": "لا يُستخدم أبداً"}', 'b', 'medium', 12, 'Static Routes مناسبة للشبكات الصغيرة، stub networks، ومسارات احتياطية حيث التحكم اليدوي مفيد.'
FROM grade11_lessons WHERE order_index = 518 LIMIT 1;

-- أسئلة البطاقة 6: التوجيه الديناميكي OSPF (order_index = 519)
INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما هو OSPF؟', 'multiple_choice', '{"a": "بروتوكول توجيه ديناميكي من نوع Link-State", "b": "بروتوكول للأمان", "c": "نوع من الكابلات", "d": "برنامج للموجهات"}', 'a', 'easy', 10, 'OSPF (Open Shortest Path First) هو بروتوكول توجيه ديناميكي من نوع Link-State يستخدم خوارزمية Dijkstra.'
FROM grade11_lessons WHERE order_index = 519 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما هو OSPF Area؟', 'multiple_choice', '{"a": "مساحة الموجه", "b": "مجموعة منطقية من الموجهات والشبكات", "c": "سرعة OSPF", "d": "نوع من الكابلات"}', 'b', 'medium', 12, 'OSPF Area هي مجموعة منطقية من الموجهات والشبكات لتقليل حجم قاعدة بيانات Link-State.'
FROM grade11_lessons WHERE order_index = 519 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما هو Router ID في OSPF؟', 'multiple_choice', '{"a": "رقم تسلسلي للموجه", "b": "معرّف فريد للموجه في OSPF domain", "c": "عنوان MAC", "d": "رقم المنفذ"}', 'b', 'medium', 12, 'Router ID هو عنوان IP فريد يعرّف الموجه في OSPF domain، يمكن تكوينه يدوياً أو اختياره تلقائياً.'
FROM grade11_lessons WHERE order_index = 519 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما وظيفة DR (Designated Router) في OSPF؟', 'multiple_choice', '{"a": "حذف المسارات", "b": "تقليل عدد adjacencies في multi-access networks", "c": "تشفير البيانات", "d": "توزيع IP addresses"}', 'b', 'hard', 15, 'DR يقلل عدد OSPF adjacencies في multi-access networks، كل الموجهات ترسل updates للـ DR بدلاً من بعضها.'
FROM grade11_lessons WHERE order_index = 519 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما هو BDR في OSPF؟', 'multiple_choice', '{"a": "Backup Designated Router - احتياطي للـ DR", "b": "نوع من المسارات", "c": "بروتوكول فرعي", "d": "منفذ خاص"}', 'a', 'medium', 12, 'BDR هو Backup Designated Router، يصبح DR في حال فشل الـ DR الحالي.'
FROM grade11_lessons WHERE order_index = 519 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما هو LSA (Link-State Advertisement)؟', 'multiple_choice', '{"a": "إعلان عن حالة الروابط في OSPF", "b": "نوع من الكابلات", "c": "برنامج للموجهات", "d": "عنوان IP"}', 'a', 'hard', 15, 'LSA هي رسائل تحمل معلومات عن حالة الروابط والموجهات، تُستخدم لبناء قاعدة بيانات Link-State.'
FROM grade11_lessons WHERE order_index = 519 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما أمر تفعيل OSPF على الموجه؟', 'multiple_choice', '{"a": "enable ospf", "b": "router ospf [process-id]", "c": "start ospf", "d": "ospf on"}', 'b', 'medium', 12, 'الأمر router ospf [process-id] يفعل عملية OSPF على الموجه، process-id محلي للموجه فقط.'
FROM grade11_lessons WHERE order_index = 519 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'كيف إضافة شبكة إلى OSPF؟', 'multiple_choice', '{"a": "add network", "b": "network [address] [wildcard-mask] area [area-id]", "c": "insert network", "d": "ospf network"}', 'b', 'hard', 15, 'الأمر network [address] [wildcard-mask] area [area-id] يضيف شبكة إلى OSPF في area محدد.'
FROM grade11_lessons WHERE order_index = 519 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما قيمة AD لـ OSPF؟', 'multiple_choice', '{"a": "90", "b": "100", "c": "110", "d": "120"}', 'c', 'medium', 12, 'القيمة الافتراضية لـ AD لـ OSPF هي 110، أقل من EIGRP (90) وأعلى من Static (1).'
FROM grade11_lessons WHERE order_index = 519 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'كيف عرض جيران OSPF؟', 'multiple_choice', '{"a": "display neighbors", "b": "show ip ospf neighbor", "c": "get ospf peers", "d": "list ospf"}', 'b', 'easy', 10, 'الأمر show ip ospf neighbor يعرض قائمة بجميع OSPF neighbors مع حالتهم.'
FROM grade11_lessons WHERE order_index = 519 LIMIT 1;

-- أسئلة البطاقة 7: قوائم الوصول ACL الأساسيات (order_index = 520)
INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما هو ACL (Access Control List)؟', 'multiple_choice', '{"a": "قائمة للتحكم في حركة البيانات في الشبكة", "b": "قائمة بالمستخدمين", "c": "قائمة بالأجهزة", "d": "قائمة بالكابلات"}', 'a', 'easy', 10, 'ACL هي مجموعة من القواعد المرتبة لتصفية حركة البيانات بناءً على معايير معينة مثل IP addresses.'
FROM grade11_lessons WHERE order_index = 520 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما الفرق بين Standard ACL و Extended ACL؟', 'multiple_choice', '{"a": "لا يوجد فرق", "b": "Standard تفحص Source IP فقط، Extended تفحص Source وDestination", "c": "Standard أسرع", "d": "Extended للشبكات الكبيرة فقط"}', 'b', 'medium', 12, 'Standard ACL تفحص Source IP address فقط، بينما Extended ACL تفحص Source/Destination IPs، protocols، وports.'
FROM grade11_lessons WHERE order_index = 520 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما هو Wildcard Mask في ACL؟', 'multiple_choice', '{"a": "عكس subnet mask", "b": "نوع من التشفير", "c": "عنوان IP", "d": "نوع من ACL"}', 'a', 'medium', 12, 'Wildcard Mask هو عكس subnet mask، الصفر يعني match والواحد يعني ignore في الفحص.'
FROM grade11_lessons WHERE order_index = 520 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'كيف حساب Wildcard Mask من Subnet Mask 255.255.255.0؟', 'multiple_choice', '{"a": "255.255.255.255", "b": "0.0.0.0", "c": "0.0.0.255", "d": "255.0.0.0"}', 'c', 'medium', 12, 'Wildcard Mask = 255.255.255.255 - Subnet Mask = 255.255.255.255 - 255.255.255.0 = 0.0.0.255'
FROM grade11_lessons WHERE order_index = 520 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما نطاق أرقام Standard ACL في Cisco؟', 'multiple_choice', '{"a": "1-99 و 1300-1999", "b": "100-199", "c": "200-299", "d": "1-100"}', 'a', 'easy', 10, 'Standard ACLs تستخدم الأرقام 1-99 و 1300-1999 في موجهات Cisco.'
FROM grade11_lessons WHERE order_index = 520 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما نطاق أرقام Extended ACL؟', 'multiple_choice', '{"a": "1-99", "b": "100-199 و 2000-2699", "c": "200-299", "d": "300-399"}', 'b', 'easy', 10, 'Extended ACLs تستخدم الأرقام 100-199 و 2000-2699 في موجهات Cisco.'
FROM grade11_lessons WHERE order_index = 520 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'كيف تعالج ACL الحزم؟', 'multiple_choice', '{"a": "عشوائياً", "b": "من الأعلى للأسفل حتى تجد match", "c": "من الأسفل للأعلى", "d": "كلها في نفس الوقت"}', 'b', 'hard', 15, 'ACL تعالج الحزم من أول قاعدة إلى آخرها بالترتيب، وتتوقف عند أول match، لذلك ترتيب القواعد مهم.'
FROM grade11_lessons WHERE order_index = 520 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما هو Implicit Deny في ACL؟', 'multiple_choice', '{"a": "قاعدة صريحة للسماح", "b": "قاعدة ضمنية ترفض كل ما لم يُطابق", "c": "قاعدة للحذف", "d": "خطأ في ACL"}', 'b', 'medium', 12, 'Implicit Deny هي قاعدة ضمنية في نهاية كل ACL ترفض أي حزمة لم تطابق أي قاعدة سابقة.'
FROM grade11_lessons WHERE order_index = 520 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'أين يُفضل وضع Standard ACL؟', 'multiple_choice', '{"a": "قرب المصدر", "b": "قرب الوجهة", "c": "في المنتصف", "d": "لا يهم المكان"}', 'b', 'hard', 15, 'Standard ACL توضع قرب الوجهة لأنها تفحص Source IP فقط، لتجنب حجب حركة مشروعة.'
FROM grade11_lessons WHERE order_index = 520 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'أين يُفضل وضع Extended ACL؟', 'multiple_choice', '{"a": "قرب الوجهة", "b": "قرب المصدر", "c": "في أي مكان", "d": "فقط على الإنترنت"}', 'b', 'hard', 15, 'Extended ACL توضع قرب المصدر لمنع الحركة غير المرغوبة مبكراً قبل استهلاك موارد الشبكة.'
FROM grade11_lessons WHERE order_index = 520 LIMIT 1;

-- أسئلة البطاقة 8: تكوين وتطبيق ACL (order_index = 521)
INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما الأمر الصحيح لإنشاء Standard ACL؟', 'multiple_choice', '{"a": "acl 10 permit 192.168.1.0", "b": "access-list 10 permit 192.168.1.0 0.0.0.255", "c": "standard-acl 10 permit 192.168.1.0", "d": "create acl 10"}', 'b', 'medium', 12, 'الصيغة: access-list [number] [permit|deny] [source] [wildcard-mask]'
FROM grade11_lessons WHERE order_index = 521 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما أمر إنشاء Extended ACL؟', 'multiple_choice', '{"a": "access-list 100 permit ip any any", "b": "extended-acl 100 permit ip", "c": "acl 100 permit", "d": "create extended 100"}', 'a', 'hard', 15, 'الصيغة: access-list [number] [permit|deny] [protocol] [source] [destination] [options]'
FROM grade11_lessons WHERE order_index = 521 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'كيف السماح بـ IP محدد في Standard ACL؟', 'multiple_choice', '{"a": "access-list 10 permit 192.168.1.5", "b": "access-list 10 permit 192.168.1.5 0.0.0.0", "c": "access-list 10 permit host 192.168.1.5", "d": "كل الإجابات صحيحة"}', 'd', 'medium', 12, 'الثلاث صيغ متكافئة: permit [ip]، permit [ip] 0.0.0.0، و permit host [ip]'
FROM grade11_lessons WHERE order_index = 521 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'كيف منع شبكة 192.168.2.0/24 في ACL؟', 'multiple_choice', '{"a": "access-list 10 deny 192.168.2.0 0.0.0.255", "b": "access-list 10 block 192.168.2.0", "c": "access-list 10 refuse 192.168.2.0", "d": "access-list 10 stop 192.168.2.0"}', 'a', 'medium', 12, 'الأمر access-list 10 deny 192.168.2.0 0.0.0.255 يمنع جميع IPs في الشبكة 192.168.2.0/24'
FROM grade11_lessons WHERE order_index = 521 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما أمر تطبيق ACL على منفذ؟', 'multiple_choice', '{"a": "apply access-group 10 in", "b": "ip access-group 10 in", "c": "set acl 10 in", "d": "use access-list 10 in"}', 'b', 'hard', 15, 'الأمر ip access-group [acl-number] [in|out] يطبق ACL على interface محدد.'
FROM grade11_lessons WHERE order_index = 521 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما الفرق بين IN و OUT في تطبيق ACL؟', 'multiple_choice', '{"a": "لا يوجد فرق", "b": "IN للحزم الداخلة، OUT للحزم الخارجة", "c": "IN أسرع", "d": "OUT للإنترنت فقط"}', 'b', 'medium', 12, 'IN يفحص الحزم الداخلة إلى interface، OUT يفحص الحزم الخارجة من interface.'
FROM grade11_lessons WHERE order_index = 521 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما هو Named ACL؟', 'multiple_choice', '{"a": "ACL بدون رقم", "b": "ACL باسم نصي بدلاً من رقم", "c": "ACL للأسماء فقط", "d": "ACL معطل"}', 'b', 'medium', 12, 'Named ACL يستخدم اسم نصي بدلاً من رقم، مما يسهل التعرف على وظيفته.'
FROM grade11_lessons WHERE order_index = 521 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'كيف عرض ACLs الموجودة على الموجه؟', 'multiple_choice', '{"a": "display acl", "b": "show access-lists", "c": "get acl", "d": "list acl"}', 'b', 'easy', 10, 'الأمر show access-lists يعرض جميع ACLs المكونة مع إحصائيات الاستخدام.'
FROM grade11_lessons WHERE order_index = 521 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'كيف حذف ACL من الموجه؟', 'multiple_choice', '{"a": "delete access-list 10", "b": "remove access-list 10", "c": "no access-list 10", "d": "clear access-list 10"}', 'c', 'medium', 12, 'الأمر no access-list [number] في global configuration mode يحذف ACL كاملة.'
FROM grade11_lessons WHERE order_index = 521 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'كيف تعديل قاعدة في Named ACL؟', 'multiple_choice', '{"a": "حذف ACL وإعادة إنشائها", "b": "استخدام sequence numbers لإضافة/حذف قواعد محددة", "c": "لا يمكن التعديل", "d": "إعادة تشغيل الموجه"}', 'b', 'hard', 15, 'Named ACLs تدعم sequence numbers مما يسمح بإضافة أو حذف أو تعديل قواعد محددة بدون حذف ACL كاملة.'
FROM grade11_lessons WHERE order_index = 521 LIMIT 1;