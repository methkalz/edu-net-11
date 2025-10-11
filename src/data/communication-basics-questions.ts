import { Question } from '@/types/exam';

export const communicationBasicsQuestions: Omit<Question, 'id' | 'created_at' | 'updated_at'>[] = [
  // أسئلة اختيار متعدد - سهلة
  {
    question_text: "ما هو تعريف شبكة الحاسوب؟",
    question_type: "multiple_choice",
    choices: [
      { id: "1", text: "مجموعة من الحواسيب المستقلة غير المرتبطة" },
      { id: "2", text: "مجموعة من الأجهزة المترابطة لتبادل البيانات والموارد" },
      { id: "3", text: "جهاز واحد فقط متصل بالإنترنت" },
      { id: "4", text: "برنامج لإدارة الملفات" }
    ],
    correct_answer: "مجموعة من الأجهزة المترابطة لتبادل البيانات والموارد",
    points: 1,
    difficulty: "easy",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "مقدمة في الشبكات",
    is_active: true
  },
  {
    question_text: "ما هي الشبكة المحلية LAN؟",
    question_type: "multiple_choice",
    choices: [
      { id: "1", text: "شبكة تغطي مناطق جغرافية واسعة" },
      { id: "2", text: "شبكة صغيرة تغطي منطقة محدودة مثل المنزل أو المكتب" },
      { id: "3", text: "شبكة لاسلكية فقط" },
      { id: "4", text: "شبكة الإنترنت العالمية" }
    ],
    correct_answer: "شبكة صغيرة تغطي منطقة محدودة مثل المنزل أو المكتب",
    points: 1,
    difficulty: "easy",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "أنواع الشبكات",
    is_active: true
  },
  {
    question_text: "ما هو جهاز Router؟",
    question_type: "multiple_choice",
    choices: [
      { id: "1", text: "جهاز لتخزين البيانات" },
      { id: "2", text: "جهاز يربط الشبكات المختلفة ويوجه البيانات بينها" },
      { id: "3", text: "جهاز للطباعة" },
      { id: "4", text: "جهاز لعرض الفيديو" }
    ],
    correct_answer: "جهاز يربط الشبكات المختلفة ويوجه البيانات بينها",
    points: 1,
    difficulty: "easy",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "أجهزة الشبكات",
    is_active: true
  },
  {
    question_text: "ما هو Switch في الشبكات؟",
    question_type: "multiple_choice",
    choices: [
      { id: "1", text: "جهاز يربط الأجهزة في شبكة محلية ويرسل البيانات للجهاز المقصود فقط" },
      { id: "2", text: "جهاز لتحويل الإشارات الرقمية إلى تناظرية" },
      { id: "3", text: "جهاز للأمان فقط" },
      { id: "4", text: "جهاز لتخزين النسخ الاحتياطية" }
    ],
    correct_answer: "جهاز يربط الأجهزة في شبكة محلية ويرسل البيانات للجهاز المقصود فقط",
    points: 1,
    difficulty: "easy",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "أجهزة الشبكات",
    is_active: true
  },
  {
    question_text: "ما هي فائدة شبكات الحاسوب الأساسية؟",
    question_type: "multiple_choice",
    choices: [
      { id: "1", text: "تقليل سرعة نقل البيانات" },
      { id: "2", text: "مشاركة الموارد والبيانات بين الأجهزة" },
      { id: "3", text: "زيادة استهلاك الطاقة" },
      { id: "4", text: "تعقيد العمل" }
    ],
    correct_answer: "مشاركة الموارد والبيانات بين الأجهزة",
    points: 1,
    difficulty: "easy",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "مقدمة في الشبكات",
    is_active: true
  },

  // أسئلة اختيار متعدد - متوسطة
  {
    question_text: "ما الفرق الرئيسي بين Hub و Switch؟",
    question_type: "multiple_choice",
    choices: [
      { id: "1", text: "Hub أسرع من Switch" },
      { id: "2", text: "Switch يرسل البيانات للجهاز المقصود فقط بينما Hub يرسلها لجميع الأجهزة" },
      { id: "3", text: "Hub أغلى من Switch" },
      { id: "4", text: "لا يوجد فرق بينهما" }
    ],
    correct_answer: "Switch يرسل البيانات للجهاز المقصود فقط بينما Hub يرسلها لجميع الأجهزة",
    points: 1,
    difficulty: "medium",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "أجهزة الشبكات",
    is_active: true
  },
  {
    question_text: "ما هي بنية Client-Server؟",
    question_type: "multiple_choice",
    choices: [
      { id: "1", text: "جميع الأجهزة متساوية في الصلاحيات" },
      { id: "2", text: "جهاز مركزي (Server) يقدم خدمات لأجهزة أخرى (Clients)" },
      { id: "3", text: "لا توجد أجهزة مركزية" },
      { id: "4", text: "كل جهاز يعمل بشكل مستقل تماماً" }
    ],
    correct_answer: "جهاز مركزي (Server) يقدم خدمات لأجهزة أخرى (Clients)",
    points: 1,
    difficulty: "medium",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "بنية الشبكات",
    is_active: true
  },
  {
    question_text: "ما هي طوبولوجيا النجمة (Star Topology)؟",
    question_type: "multiple_choice",
    choices: [
      { id: "1", text: "جميع الأجهزة متصلة بجهاز مركزي واحد" },
      { id: "2", text: "الأجهزة متصلة على شكل حلقة" },
      { id: "3", text: "الأجهزة متصلة على خط واحد" },
      { id: "4", text: "كل جهاز متصل بجميع الأجهزة الأخرى" }
    ],
    correct_answer: "جميع الأجهزة متصلة بجهاز مركزي واحد",
    points: 1,
    difficulty: "medium",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "طوبولوجيا الشبكات",
    is_active: true
  },
  {
    question_text: "ما هو Bridge في الشبكات؟",
    question_type: "multiple_choice",
    choices: [
      { id: "1", text: "جهاز يربط شبكتين محليتين من نفس النوع" },
      { id: "2", text: "جهاز لتشفير البيانات فقط" },
      { id: "3", text: "جهاز لتخزين البيانات المؤقتة" },
      { id: "4", text: "جهاز للطباعة الشبكية" }
    ],
    correct_answer: "جهاز يربط شبكتين محليتين من نفس النوع",
    points: 1,
    difficulty: "medium",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "أجهزة الشبكات",
    is_active: true
  },
  {
    question_text: "ما هي الشبكة اللاسلكية WLAN؟",
    question_type: "multiple_choice",
    choices: [
      { id: "1", text: "شبكة تستخدم الأسلاك النحاسية فقط" },
      { id: "2", text: "شبكة محلية تستخدم تقنية Wi-Fi للاتصال اللاسلكي" },
      { id: "3", text: "شبكة عالمية فقط" },
      { id: "4", text: "شبكة للأقمار الصناعية" }
    ],
    correct_answer: "شبكة محلية تستخدم تقنية Wi-Fi للاتصال اللاسلكي",
    points: 1,
    difficulty: "medium",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "أنواع الشبكات",
    is_active: true
  },
  {
    question_text: "ما هو Modem؟",
    question_type: "multiple_choice",
    choices: [
      { id: "1", text: "جهاز يحول الإشارات الرقمية إلى تناظرية والعكس" },
      { id: "2", text: "جهاز لتوزيع البيانات في الشبكة المحلية فقط" },
      { id: "3", text: "جهاز لتخزين البيانات" },
      { id: "4", text: "جهاز للحماية من الفيروسات" }
    ],
    correct_answer: "جهاز يحول الإشارات الرقمية إلى تناظرية والعكس",
    points: 1,
    difficulty: "medium",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "أجهزة الشبكات",
    is_active: true
  },
  {
    question_text: "ما هي WAN؟",
    question_type: "multiple_choice",
    choices: [
      { id: "1", text: "شبكة محلية صغيرة" },
      { id: "2", text: "شبكة واسعة تغطي مناطق جغرافية كبيرة مثل المدن أو الدول" },
      { id: "3", text: "شبكة لاسلكية فقط" },
      { id: "4", text: "شبكة داخل غرفة واحدة" }
    ],
    correct_answer: "شبكة واسعة تغطي مناطق جغرافية كبيرة مثل المدن أو الدول",
    points: 1,
    difficulty: "medium",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "أنواع الشبكات",
    is_active: true
  },
  {
    question_text: "ما هي طوبولوجيا الناقل (Bus Topology)؟",
    question_type: "multiple_choice",
    choices: [
      { id: "1", text: "جميع الأجهزة متصلة بكابل رئيسي واحد" },
      { id: "2", text: "الأجهزة متصلة بشكل دائري" },
      { id: "3", text: "كل جهاز له كابل منفصل للمركز" },
      { id: "4", text: "لا توجد كوابل في هذه الطوبولوجيا" }
    ],
    correct_answer: "جميع الأجهزة متصلة بكابل رئيسي واحد",
    points: 1,
    difficulty: "medium",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "طوبولوجيا الشبكات",
    is_active: true
  },
  {
    question_text: "ما هو كابل Twisted Pair؟",
    question_type: "multiple_choice",
    choices: [
      { id: "1", text: "كابل يحتوي على أسلاك نحاسية ملتوية معاً لتقليل التداخل" },
      { id: "2", text: "كابل من الألياف الضوئية" },
      { id: "3", text: "كابل لاسلكي" },
      { id: "4", text: "كابل معدني سميك فقط" }
    ],
    correct_answer: "كابل يحتوي على أسلاك نحاسية ملتوية معاً لتقليل التداخل",
    points: 1,
    difficulty: "medium",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "وسائط النقل",
    is_active: true
  },
  {
    question_text: "ما هو الفرق بين Peer-to-Peer و Client-Server؟",
    question_type: "multiple_choice",
    choices: [
      { id: "1", text: "في Peer-to-Peer الأجهزة متساوية، بينما في Client-Server يوجد خادم مركزي" },
      { id: "2", text: "لا يوجد فرق بينهما" },
      { id: "3", text: "Peer-to-Peer أسرع دائماً" },
      { id: "4", text: "Client-Server لا تحتاج لأجهزة خاصة" }
    ],
    correct_answer: "في Peer-to-Peer الأجهزة متساوية، بينما في Client-Server يوجد خادم مركزي",
    points: 1,
    difficulty: "medium",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "بنية الشبكات",
    is_active: true
  },

  // أسئلة اختيار متعدد - صعبة
  {
    question_text: "ما هي ميزة استخدام Fiber Optic مقارنة بـ Twisted Pair؟",
    question_type: "multiple_choice",
    choices: [
      { id: "1", text: "أرخص في التكلفة" },
      { id: "2", text: "سرعة نقل أعلى ومقاومة للتداخل الكهرومغناطيسي" },
      { id: "3", text: "أسهل في التركيب" },
      { id: "4", text: "يعمل بدون كهرباء" }
    ],
    correct_answer: "سرعة نقل أعلى ومقاومة للتداخل الكهرومغناطيسي",
    points: 1,
    difficulty: "hard",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "وسائط النقل",
    is_active: true
  },
  {
    question_text: "ما هو Half Duplex في أنماط الاتصال؟",
    question_type: "multiple_choice",
    choices: [
      { id: "1", text: "الإرسال في اتجاه واحد فقط طوال الوقت" },
      { id: "2", text: "الإرسال في الاتجاهين لكن ليس في نفس الوقت" },
      { id: "3", text: "الإرسال في الاتجاهين في نفس الوقت" },
      { id: "4", text: "لا يوجد إرسال على الإطلاق" }
    ],
    correct_answer: "الإرسال في الاتجاهين لكن ليس في نفس الوقت",
    points: 1,
    difficulty: "hard",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "أنماط الاتصال",
    is_active: true
  },
  {
    question_text: "ما هي عيوب طوبولوجيا النجمة (Star)؟",
    question_type: "multiple_choice",
    choices: [
      { id: "1", text: "سهولة الصيانة" },
      { id: "2", text: "إذا تعطل الجهاز المركزي تتعطل الشبكة بالكامل" },
      { id: "3", text: "لا توجد عيوب" },
      { id: "4", text: "سرعة عالية جداً" }
    ],
    correct_answer: "إذا تعطل الجهاز المركزي تتعطل الشبكة بالكامل",
    points: 1,
    difficulty: "hard",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "طوبولوجيا الشبكات",
    is_active: true
  },
  {
    question_text: "ما هو Full Duplex؟",
    question_type: "multiple_choice",
    choices: [
      { id: "1", text: "الإرسال في اتجاه واحد فقط" },
      { id: "2", text: "الإرسال في الاتجاهين في نفس الوقت" },
      { id: "3", text: "الإرسال بالتناوب" },
      { id: "4", text: "لا يوجد إرسال" }
    ],
    correct_answer: "الإرسال في الاتجاهين في نفس الوقت",
    points: 1,
    difficulty: "hard",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "أنماط الاتصال",
    is_active: true
  },
  {
    question_text: "ما هي طوبولوجيا الحلقة (Ring Topology)؟",
    question_type: "multiple_choice",
    choices: [
      { id: "1", text: "الأجهزة متصلة بشكل خطي" },
      { id: "2", text: "كل جهاز متصل بجهازين آخرين لتشكيل حلقة مغلقة" },
      { id: "3", text: "جميع الأجهزة متصلة بمركز واحد" },
      { id: "4", text: "لا توجد اتصالات فيزيائية" }
    ],
    correct_answer: "كل جهاز متصل بجهازين آخرين لتشكيل حلقة مغلقة",
    points: 1,
    difficulty: "hard",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "طوبولوجيا الشبكات",
    is_active: true
  },
  {
    question_text: "ما الفرق بين Unicast و Broadcast؟",
    question_type: "multiple_choice",
    choices: [
      { id: "1", text: "Unicast للجهاز الواحد و Broadcast لجميع الأجهزة" },
      { id: "2", text: "لا يوجد فرق" },
      { id: "3", text: "Broadcast أسرع دائماً" },
      { id: "4", text: "Unicast لاسلكي و Broadcast سلكي" }
    ],
    correct_answer: "Unicast للجهاز الواحد و Broadcast لجميع الأجهزة",
    points: 1,
    difficulty: "hard",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "أنماط الإرسال",
    is_active: true
  },
  {
    question_text: "ما هو Multicast في أنماط الإرسال؟",
    question_type: "multiple_choice",
    choices: [
      { id: "1", text: "إرسال لجهاز واحد فقط" },
      { id: "2", text: "إرسال لمجموعة محددة من الأجهزة" },
      { id: "3", text: "إرسال لجميع الأجهزة بدون استثناء" },
      { id: "4", text: "عدم الإرسال نهائياً" }
    ],
    correct_answer: "إرسال لمجموعة محددة من الأجهزة",
    points: 1,
    difficulty: "hard",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "أنماط الإرسال",
    is_active: true
  },
  {
    question_text: "لماذا يفضل استخدام Switch على Hub في الشبكات الحديثة؟",
    question_type: "multiple_choice",
    choices: [
      { id: "1", text: "لأن Hub أغلى" },
      { id: "2", text: "لأن Switch يقلل منازدحام الشبكة ويزيد الأمان" },
      { id: "3", text: "لأن Hub لا يعمل مع الكوابل الحديثة" },
      { id: "4", text: "لا يوجد فرق حقيقي" }
    ],
    correct_answer: "لأن Switch يقلل منازدحام الشبكة ويزيد الأمان",
    points: 1,
    difficulty: "hard",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "أجهزة الشبكات",
    is_active: true
  },
  {
    question_text: "ما هي ميزة بنية Peer-to-Peer مقارنة بـ Client-Server؟",
    question_type: "multiple_choice",
    choices: [
      { id: "1", text: "أكثر أماناً دائماً" },
      { id: "2", text: "أقل تكلفة ولا تحتاج لخادم مخصص" },
      { id: "3", text: "أسرع في جميع الحالات" },
      { id: "4", text: "تدعم عدد أكبر من المستخدمين" }
    ],
    correct_answer: "أقل تكلفة ولا تحتاج لخادم مخصص",
    points: 1,
    difficulty: "hard",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "بنية الشبكات",
    is_active: true
  },
  {
    question_text: "ما هو Simplex في أنماط الاتصال؟",
    question_type: "multiple_choice",
    choices: [
      { id: "1", text: "الإرسال في الاتجاهين بالتناوب" },
      { id: "2", text: "الإرسال في اتجاه واحد فقط طوال الوقت" },
      { id: "3", text: "الإرسال في الاتجاهين معاً" },
      { id: "4", text: "عدم وجود إرسال" }
    ],
    correct_answer: "الإرسال في اتجاه واحد فقط طوال الوقت",
    points: 1,
    difficulty: "hard",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "أنماط الاتصال",
    is_active: true
  },

  // أسئلة صح وخطأ - سهلة
  {
    question_text: "شبكة LAN تغطي مناطق جغرافية صغيرة مثل المنزل أو المكتب",
    question_type: "true_false",
    choices: [
      { id: "true", text: "صح" },
      { id: "false", text: "خطأ" }
    ],
    correct_answer: "صح",
    points: 1,
    difficulty: "easy",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "أنواع الشبكات",
    is_active: true
  },
  {
    question_text: "Router يربط شبكات مختلفة ويوجه البيانات بينها",
    question_type: "true_false",
    choices: [
      { id: "true", text: "صح" },
      { id: "false", text: "خطأ" }
    ],
    correct_answer: "صح",
    points: 1,
    difficulty: "easy",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "أجهزة الشبكات",
    is_active: true
  },
  {
    question_text: "Hub يرسل البيانات للجهاز المقصود فقط",
    question_type: "true_false",
    choices: [
      { id: "true", text: "صح" },
      { id: "false", text: "خطأ" }
    ],
    correct_answer: "خطأ",
    points: 1,
    difficulty: "easy",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "أجهزة الشبكات",
    is_active: true
  },

  // أسئلة صح وخطأ - متوسطة
  {
    question_text: "في بنية Client-Server، جميع الأجهزة متساوية في الصلاحيات",
    question_type: "true_false",
    choices: [
      { id: "true", text: "صح" },
      { id: "false", text: "خطأ" }
    ],
    correct_answer: "خطأ",
    points: 1,
    difficulty: "medium",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "بنية الشبكات",
    is_active: true
  },
  {
    question_text: "Modem يحول الإشارات الرقمية إلى تناظرية والعكس",
    question_type: "true_false",
    choices: [
      { id: "true", text: "صح" },
      { id: "false", text: "خطأ" }
    ],
    correct_answer: "صح",
    points: 1,
    difficulty: "medium",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "أجهزة الشبكات",
    is_active: true
  },
  {
    question_text: "طوبولوجيا Bus تعني أن جميع الأجهزة متصلة بكابل رئيسي واحد",
    question_type: "true_false",
    choices: [
      { id: "true", text: "صح" },
      { id: "false", text: "خطأ" }
    ],
    correct_answer: "صح",
    points: 1,
    difficulty: "medium",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "طوبولوجيا الشبكات",
    is_active: true
  },
  {
    question_text: "WLAN هي شبكة سلكية فقط",
    question_type: "true_false",
    choices: [
      { id: "true", text: "صح" },
      { id: "false", text: "خطأ" }
    ],
    correct_answer: "خطأ",
    points: 1,
    difficulty: "medium",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "أنواع الشبكات",
    is_active: true
  },

  // أسئلة صح وخطأ - صعبة
  {
    question_text: "Fiber Optic أسرع من Twisted Pair في نقل البيانات",
    question_type: "true_false",
    choices: [
      { id: "true", text: "صح" },
      { id: "false", text: "خطأ" }
    ],
    correct_answer: "صح",
    points: 1,
    difficulty: "hard",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "وسائط النقل",
    is_active: true
  },
  {
    question_text: "في Half Duplex يمكن الإرسال والاستقبال في نفس الوقت",
    question_type: "true_false",
    choices: [
      { id: "true", text: "صح" },
      { id: "false", text: "خطأ" }
    ],
    correct_answer: "خطأ",
    points: 1,
    difficulty: "hard",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "أنماط الاتصال",
    is_active: true
  },
  {
    question_text: "Multicast يرسل البيانات لمجموعة محددة من الأجهزة وليس لجميع الأجهزة",
    question_type: "true_false",
    choices: [
      { id: "true", text: "صح" },
      { id: "false", text: "خطأ" }
    ],
    correct_answer: "صح",
    points: 1,
    difficulty: "hard",
    grade_level: "11",
    section_name: "أساسيات الاتصال",
    topic_name: "أنماط الإرسال",
    is_active: true
  }
];
