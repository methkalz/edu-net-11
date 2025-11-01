-- أسئلة البطاقات 1-4 (40 سؤال)

-- أسئلة البطاقة 1: مفاهيم VLAN الأساسية (order_index = 514)
INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما هو VLAN؟', 'multiple_choice', '{"a": "جهاز توجيه للشبكات", "b": "شبكة محلية افتراضية تقسم السويتش منطقياً", "c": "بروتوكول للاتصال بالإنترنت", "d": "نوع من الكابلات"}', 'b', 'easy', 10, 'VLAN هي اختصار لـ Virtual Local Area Network، وهي تقنية تقسم السويتش إلى شبكات منطقية منفصلة.'
FROM grade11_lessons WHERE order_index = 514 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما فائدة استخدام VLAN في الشبكات؟', 'multiple_choice', '{"a": "زيادة سرعة الإنترنت فقط", "b": "تقليل broadcast domains وتحسين الأمان", "c": "إلغاء الحاجة للموجهات", "d": "تقليل تكلفة الكابلات"}', 'b', 'medium', 12, 'VLANs تقلل من broadcast domains مما يحسن الأداء، وتعزز الأمان بعزل حركة البيانات.'
FROM grade11_lessons WHERE order_index = 514 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما هو Native VLAN؟', 'multiple_choice', '{"a": "VLAN الأساسي الذي لا يحتاج إلى tagging على trunk", "b": "أول VLAN في السويتش", "c": "VLAN للمدراء فقط", "d": "VLAN المحذوف تلقائياً"}', 'a', 'medium', 12, 'Native VLAN هو الـ VLAN الذي لا يتم وضع tag له على trunk port، وافتراضياً هو VLAN 1.'
FROM grade11_lessons WHERE order_index = 514 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما الفرق بين Access Port و Trunk Port؟', 'multiple_choice', '{"a": "لا يوجد فرق", "b": "Access لـ VLAN واحد، Trunk لعدة VLANs", "c": "Access أسرع من Trunk", "d": "Trunk للأجهزة فقط"}', 'b', 'medium', 12, 'Access Port يحمل VLAN واحد فقط ويوصل بالأجهزة، بينما Trunk Port يحمل عدة VLANs ويوصل بين السويتشات.'
FROM grade11_lessons WHERE order_index = 514 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'كم عدد VLANs المتاحة في سويتش Cisco؟', 'multiple_choice', '{"a": "256", "b": "1024", "c": "4096", "d": "65536"}', 'c', 'easy', 10, 'سويتشات Cisco تدعم حتى 4096 VLAN (من 0 إلى 4095)، لكن بعضها محجوز للنظام.'
FROM grade11_lessons WHERE order_index = 514 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما هو VLAN 1 في سويتش Cisco؟', 'multiple_choice', '{"a": "VLAN يجب حذفه دائماً", "b": "VLAN الافتراضي للإدارة ولا يمكن حذفه", "c": "VLAN للضيوف فقط", "d": "VLAN غير مستخدم"}', 'b', 'easy', 10, 'VLAN 1 هو الـ VLAN الافتراضي في سويتشات Cisco، يستخدم للإدارة ولا يمكن حذفه.'
FROM grade11_lessons WHERE order_index = 514 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما نوع VLAN المستخدم عادة للإدارة؟', 'multiple_choice', '{"a": "Data VLAN", "b": "Voice VLAN", "c": "Management VLAN", "d": "Native VLAN"}', 'c', 'easy', 10, 'Management VLAN هو VLAN مخصص لإدارة أجهزة الشبكة مثل السويتشات والموجهات.'
FROM grade11_lessons WHERE order_index = 514 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ماذا يحدث لحركة broadcast في VLAN؟', 'multiple_choice', '{"a": "تنتقل إلى جميع VLANs", "b": "تبقى داخل نفس VLAN فقط", "c": "يتم حذفها تلقائياً", "d": "تذهب للموجه أولاً"}', 'b', 'medium', 12, 'حركة broadcast تبقى محصورة داخل نفس الـ VLAN ولا تنتقل إلى VLANs أخرى، مما يقلل broadcast domain.'
FROM grade11_lessons WHERE order_index = 514 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'هل يمكن للأجهزة في VLANs مختلفة التواصل مباشرة؟', 'multiple_choice', '{"a": "نعم دائماً", "b": "لا، يحتاجون موجه أو Layer 3 Switch", "c": "نعم إذا كانوا في نفس السويتش", "d": "لا يمكن أبداً"}', 'b', 'medium', 12, 'الأجهزة في VLANs مختلفة تحتاج إلى موجه (Router) أو Layer 3 Switch للتواصل بينها.'
FROM grade11_lessons WHERE order_index = 514 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما هو Data VLAN؟', 'multiple_choice', '{"a": "VLAN للبيانات الصوتية", "b": "VLAN للإدارة فقط", "c": "VLAN لحركة بيانات المستخدمين", "d": "VLAN للمدراء"}', 'c', 'easy', 10, 'Data VLAN هو VLAN مخصص لحركة بيانات المستخدمين العادية وهو أكثر أنواع VLANs استخداماً.'
FROM grade11_lessons WHERE order_index = 514 LIMIT 1;

-- أسئلة البطاقة 2: تكوين VLAN (order_index = 515)
INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما هو الأمر الصحيح لإنشاء VLAN جديد؟', 'multiple_choice', '{"a": "create vlan 10", "b": "vlan 10", "c": "new vlan 10", "d": "add vlan 10"}', 'b', 'medium', 12, 'الأمر الصحيح هو vlan 10 في configuration mode لإنشاء VLAN جديد برقم 10.'
FROM grade11_lessons WHERE order_index = 515 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'كيف تعيين منفذ إلى VLAN معين؟', 'multiple_choice', '{"a": "set vlan 10", "b": "vlan access 10", "c": "switchport access vlan 10", "d": "port vlan 10"}', 'c', 'medium', 12, 'الأمر switchport access vlan 10 يعين المنفذ إلى VLAN 10 في interface configuration mode.'
FROM grade11_lessons WHERE order_index = 515 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما هو أمر تفعيل وضع Trunk على منفذ؟', 'multiple_choice', '{"a": "trunk mode on", "b": "switchport mode trunk", "c": "enable trunk", "d": "port trunk"}', 'b', 'hard', 15, 'الأمر switchport mode trunk يحول المنفذ إلى trunk mode لحمل عدة VLANs.'
FROM grade11_lessons WHERE order_index = 515 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما هو VTP (VLAN Trunking Protocol)؟', 'multiple_choice', '{"a": "بروتوكول لمزامنة تكوينات VLAN بين السويتشات", "b": "بروتوكول للتوجيه", "c": "بروتوكول للأمان", "d": "بروتوكول للإنترنت"}', 'a', 'medium', 12, 'VTP هو بروتوكول من Cisco لمزامنة معلومات VLANs تلقائياً بين السويتشات في نفس الدومين.'
FROM grade11_lessons WHERE order_index = 515 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما وظيفة DTP (Dynamic Trunking Protocol)؟', 'multiple_choice', '{"a": "حذف VLANs تلقائياً", "b": "التفاوض التلقائي لتكوين trunk بين السويتشات", "c": "توزيع عناوين IP", "d": "تشفير البيانات"}', 'b', 'medium', 12, 'DTP يسمح للسويتشات بالتفاوض تلقائياً لتكوين trunk link بدون تكوين يدوي.'
FROM grade11_lessons WHERE order_index = 515 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'كيف عرض VLANs الموجودة على السويتش؟', 'multiple_choice', '{"a": "list vlan", "b": "display vlan", "c": "show vlan brief", "d": "get vlan"}', 'c', 'easy', 10, 'الأمر show vlan brief يعرض قائمة مختصرة بجميع VLANs المكونة على السويتش.'
FROM grade11_lessons WHERE order_index = 515 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'كيف حذف VLAN من السويتش؟', 'multiple_choice', '{"a": "remove vlan 10", "b": "delete vlan 10", "c": "no vlan 10", "d": "clear vlan 10"}', 'c', 'medium', 12, 'الأمر no vlan 10 في global configuration mode يحذف VLAN 10 من السويتش.'
FROM grade11_lessons WHERE order_index = 515 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما وظيفة الأمر switchport trunk allowed vlan؟', 'multiple_choice', '{"a": "إنشاء VLANs جديدة", "b": "تحديد VLANs المسموح بها على trunk", "c": "حذف VLANs", "d": "عرض VLANs"}', 'b', 'hard', 15, 'هذا الأمر يحدد أي VLANs مسموح لها بالمرور عبر trunk port محدد.'
FROM grade11_lessons WHERE order_index = 515 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما الفرق بين VTP Server و VTP Client؟', 'multiple_choice', '{"a": "لا يوجد فرق", "b": "Server يمكنه إنشاء VLANs، Client لا يمكنه", "c": "Client أسرع", "d": "Server للمدراء فقط"}', 'b', 'medium', 12, 'VTP Server يمكنه إنشاء وتعديل وحذف VLANs، بينما VTP Client يستقبل التحديثات فقط ولا يمكنه التعديل.'
FROM grade11_lessons WHERE order_index = 515 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'كيف تعطيل DTP على منفذ؟', 'multiple_choice', '{"a": "no dtp", "b": "switchport nonegotiate", "c": "disable dtp", "d": "dtp off"}', 'b', 'hard', 15, 'الأمر switchport nonegotiate يعطل DTP على المنفذ ويمنع التفاوض التلقائي لـ trunk.'
FROM grade11_lessons WHERE order_index = 515 LIMIT 1;

-- أسئلة البطاقة 3: التوجيه بين VLAN - المفاهيم (order_index = 516)
INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'لماذا لا يمكن للأجهزة في VLANs مختلفة التواصل مباشرة؟', 'multiple_choice', '{"a": "لأنها في broadcast domains منفصلة", "b": "لأنها بعيدة جغرافياً", "c": "لأن السويتش معطل", "d": "لأنها تستخدم كابلات مختلفة"}', 'a', 'medium', 12, 'VLANs تنشئ broadcast domains منفصلة، والاتصال بين domains مختلفة يتطلب جهاز Layer 3 مثل الموجه.'
FROM grade11_lessons WHERE order_index = 516 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما هو Router-on-a-Stick؟', 'multiple_choice', '{"a": "موجه صغير", "b": "تقنية لتوجيه بين VLANs باستخدام منفذ واحد", "c": "نوع من الكابلات", "d": "برنامج للموجهات"}', 'b', 'medium', 12, 'Router-on-a-Stick هي تقنية تستخدم منفذ واحد على الموجه مع subinterfaces لتوجيه حركة البيانات بين عدة VLANs.'
FROM grade11_lessons WHERE order_index = 516 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما هي Subinterface؟', 'multiple_choice', '{"a": "منفذ فرعي منطقي على منفذ فيزيائي واحد", "b": "منفذ إضافي في الموجه", "c": "كابل فرعي", "d": "موجه صغير"}', 'a', 'medium', 12, 'Subinterface هي interface منطقية متعددة على منفذ فيزيائي واحد، كل واحدة لها IP address خاص وتمثل VLAN معين.'
FROM grade11_lessons WHERE order_index = 516 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما هو Encapsulation في Inter-VLAN Routing؟', 'multiple_choice', '{"a": "تشفير البيانات", "b": "إضافة VLAN tag للإطارات", "c": "ضغط البيانات", "d": "حذف البيانات"}', 'b', 'medium', 12, 'Encapsulation يضيف VLAN tag للإطارات على trunk link لتمييز VLANs المختلفة.'
FROM grade11_lessons WHERE order_index = 516 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما نوع Encapsulation الشائع مع trunk في شبكات Cisco؟', 'multiple_choice', '{"a": "PPP", "b": "HDLC", "c": "802.1Q", "d": "Frame Relay"}', 'c', 'medium', 12, '802.1Q هو المعيار الصناعي لـ VLAN tagging على trunk ports، وهو الأكثر استخداماً في شبكات Cisco الحديثة.'
FROM grade11_lessons WHERE order_index = 516 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'كم subinterface نحتاج لتوجيه بين 3 VLANs؟', 'multiple_choice', '{"a": "1", "b": "2", "c": "3", "d": "4"}', 'c', 'easy', 10, 'نحتاج إلى subinterface واحدة لكل VLAN، لذلك لـ 3 VLANs نحتاج 3 subinterfaces.'
FROM grade11_lessons WHERE order_index = 516 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'هل يجب أن تكون Subinterfaces في نفس الشبكة (Subnet)؟', 'multiple_choice', '{"a": "نعم دائماً", "b": "لا، كل subinterface في subnet مختلف", "c": "فقط في شبكات صغيرة", "d": "يعتمد على السويتش"}', 'b', 'medium', 12, 'كل subinterface تمثل VLAN مختلف ويجب أن يكون في subnet منفصل لتجنب تعارض العناوين.'
FROM grade11_lessons WHERE order_index = 516 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما البديل الأفضل لـ Router-on-a-Stick؟', 'multiple_choice', '{"a": "استخدام عدة موجهات", "b": "Layer 3 Switch مع SVI", "c": "Hub", "d": "Repeater"}', 'b', 'hard', 15, 'Layer 3 Switch مع Switched Virtual Interfaces (SVI) أسرع وأكثر كفاءة من Router-on-a-Stick للتوجيه بين VLANs.'
FROM grade11_lessons WHERE order_index = 516 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما هو Layer 3 Switch؟', 'multiple_choice', '{"a": "سويتش عادي", "b": "سويتش يمكنه القيام بوظائف التوجيه", "c": "موجه صغير", "d": "كابل خاص"}', 'b', 'medium', 12, 'Layer 3 Switch يجمع بين وظائف السويتش والموجه، يمكنه التبديل والتوجيه في نفس الجهاز.'
FROM grade11_lessons WHERE order_index = 516 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما فائدة Inter-VLAN Routing؟', 'multiple_choice', '{"a": "زيادة عدد VLANs", "b": "السماح بالاتصال بين أجهزة في VLANs مختلفة", "c": "تسريع الإنترنت", "d": "تقليل عدد الأجهزة"}', 'b', 'easy', 10, 'Inter-VLAN Routing يسمح للأجهزة في VLANs مختلفة بالتواصل مع بعضها مع الحفاظ على الفصل المنطقي للشبكات.'
FROM grade11_lessons WHERE order_index = 516 LIMIT 1;

-- أسئلة البطاقة 4: التوجيه بين VLAN - التطبيق (order_index = 517)
INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما الأمر الصحيح لإنشاء subinterface؟', 'multiple_choice', '{"a": "interface fa0/0.10", "b": "subinterface 10", "c": "create sub 10", "d": "int sub 10"}', 'a', 'hard', 15, 'الأمر interface fa0/0.10 ينشئ subinterface رقم 10 على المنفذ fa0/0.'
FROM grade11_lessons WHERE order_index = 517 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما أمر تكوين Encapsulation على subinterface؟', 'multiple_choice', '{"a": "encap dot1q 10", "b": "encapsulation dot1Q 10", "c": "vlan 10", "d": "tag 10"}', 'b', 'hard', 15, 'الأمر encapsulation dot1Q 10 يكون 802.1Q encapsulation لـ VLAN 10 على الـ subinterface.'
FROM grade11_lessons WHERE order_index = 517 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما هو SVI (Switched Virtual Interface)؟', 'multiple_choice', '{"a": "منفذ فيزيائي", "b": "interface افتراضية لـ VLAN في Layer 3 Switch", "c": "نوع من الكابلات", "d": "برنامج للسويتش"}', 'b', 'medium', 12, 'SVI هي interface افتراضية تمثل VLAN في Layer 3 Switch، تستخدم للتوجيه بين VLANs.'
FROM grade11_lessons WHERE order_index = 517 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'كيف إنشاء SVI على Layer 3 Switch؟', 'multiple_choice', '{"a": "create vlan 10", "b": "interface vlan 10", "c": "svi 10", "d": "virtual vlan 10"}', 'b', 'medium', 12, 'الأمر interface vlan 10 ينشئ SVI لـ VLAN 10 في Layer 3 Switch.'
FROM grade11_lessons WHERE order_index = 517 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما أمر تفعيل IP Routing على Layer 3 Switch؟', 'multiple_choice', '{"a": "enable routing", "b": "ip routing", "c": "routing on", "d": "start routing"}', 'b', 'hard', 15, 'الأمر ip routing في global configuration mode يفعل وظيفة التوجيه على Layer 3 Switch.'
FROM grade11_lessons WHERE order_index = 517 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'كيف التحقق من subinterfaces على الموجه؟', 'multiple_choice', '{"a": "show sub", "b": "display subinterface", "c": "show ip interface brief", "d": "list subs"}', 'c', 'medium', 12, 'الأمر show ip interface brief يعرض جميع interfaces بما فيها subinterfaces مع حالتها وعناوين IP.'
FROM grade11_lessons WHERE order_index = 517 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما سبب محتمل لفشل Inter-VLAN Routing؟', 'multiple_choice', '{"a": "Native VLAN غير متطابق بين السويتش والموجه", "b": "السرعة عالية جداً", "c": "عدد VLANs قليل", "d": "الكابلات طويلة"}', 'a', 'hard', 15, 'عدم تطابق Native VLAN على طرفي trunk link يسبب مشاكل في Inter-VLAN Routing.'
FROM grade11_lessons WHERE order_index = 517 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'كيف فحص تكوين trunk على السويتش؟', 'multiple_choice', '{"a": "show trunk", "b": "show interfaces trunk", "c": "display trunk", "d": "get trunk"}', 'b', 'medium', 12, 'الأمر show interfaces trunk يعرض تفاصيل جميع trunk ports والـ VLANs المسموح بها عليها.'
FROM grade11_lessons WHERE order_index = 517 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما أهمية Native VLAN في Inter-VLAN Routing؟', 'multiple_choice', '{"a": "لا أهمية له", "b": "يجب أن يكون متطابقاً على طرفي trunk", "c": "يستخدم فقط للإدارة", "d": "يحسن السرعة"}', 'b', 'medium', 12, 'يجب أن يكون Native VLAN نفسه على طرفي trunk link لتجنب مشاكل في توجيه الحزم.'
FROM grade11_lessons WHERE order_index = 517 LIMIT 1;

INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points, explanation)
SELECT id, 'ما الخطوة الأولى لحل مشكلة عدم التواصل بين VLANs؟', 'multiple_choice', '{"a": "إعادة تشغيل الأجهزة", "b": "التحقق من تكوين trunk وencapsulation", "c": "تغيير الكابلات", "d": "حذف VLANs"}', 'b', 'hard', 15, 'أول خطوة هي التحقق من trunk configuration وأن encapsulation مكون بشكل صحيح على السويتش والموجه.'
FROM grade11_lessons WHERE order_index = 517 LIMIT 1;