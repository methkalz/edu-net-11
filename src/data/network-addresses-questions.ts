import { Question } from "@/types/exam";

export const networkAddressesQuestions: Omit<Question, 'id' | 'created_at' | 'updated_at'>[] = [
  // ========== أسئلة اختيار متعدد - سهلة (8 أسئلة) ==========
  {
    question_text: "كم عدد الأجزاء (Octets) التي يتكون منها عنوان IPv4؟",
    question_type: "multiple_choice",
    choices: [
      { id: "a", text: "2 أجزاء" },
      { id: "b", text: "4 أجزاء" },
      { id: "c", text: "6 أجزاء" },
      { id: "d", text: "8 أجزاء" }
    ],
    correct_answer: "b",
    points: 1,
    difficulty: "easy",
    grade_level: "11",
    section_name: "عناوين الشبكة وطرق تمثيل الأرقام في الشبكة",
    topic_name: "IPv4",
    is_active: true
  },
  {
    question_text: "ما هو النظام العددي الذي يستخدم الأرقام من 0 إلى 9 فقط؟",
    question_type: "multiple_choice",
    choices: [
      { id: "a", text: "النظام الثنائي" },
      { id: "b", text: "النظام الست عشري" },
      { id: "c", text: "النظام العشري" },
      { id: "d", text: "النظام الثماني" }
    ],
    correct_answer: "c",
    points: 1,
    difficulty: "easy",
    grade_level: "11",
    section_name: "عناوين الشبكة وطرق تمثيل الأرقام في الشبكة",
    topic_name: "أنظمة العد",
    is_active: true
  },
  {
    question_text: "كم عدد البتات (Bits) في عنوان MAC Address؟",
    question_type: "multiple_choice",
    choices: [
      { id: "a", text: "32 بت" },
      { id: "b", text: "48 بت" },
      { id: "c", text: "64 بت" },
      { id: "d", text: "128 بت" }
    ],
    correct_answer: "b",
    points: 1,
    difficulty: "easy",
    grade_level: "11",
    section_name: "عناوين الشبكة وطرق تمثيل الأرقام في الشبكة",
    topic_name: "MAC Address",
    is_active: true
  },
  {
    question_text: "أي من الأمثلة التالية هو عنوان IPv4 صحيح؟",
    question_type: "multiple_choice",
    choices: [
      { id: "a", text: "192.168.1.256" },
      { id: "b", text: "192.168.1.100" },
      { id: "c", text: "192.168.1.1.1" },
      { id: "d", text: "192.168" }
    ],
    correct_answer: "b",
    points: 1,
    difficulty: "easy",
    grade_level: "11",
    section_name: "عناوين الشبكة وطرق تمثيل الأرقام في الشبكة",
    topic_name: "IPv4",
    is_active: true
  },
  {
    question_text: "ما هو الإصدار الأحدث من بروتوكول الإنترنت؟",
    question_type: "multiple_choice",
    choices: [
      { id: "a", text: "IPv4" },
      { id: "b", text: "IPv5" },
      { id: "c", text: "IPv6" },
      { id: "d", text: "IPv8" }
    ],
    correct_answer: "c",
    points: 1,
    difficulty: "easy",
    grade_level: "11",
    section_name: "عناوين الشبكة وطرق تمثيل الأرقام في الشبكة",
    topic_name: "IPv6",
    is_active: true
  },
  {
    question_text: "أي من التالي يمثل الرقم 10 في النظام الثنائي؟",
    question_type: "multiple_choice",
    choices: [
      { id: "a", text: "1010" },
      { id: "b", text: "1100" },
      { id: "c", text: "1000" },
      { id: "d", text: "0110" }
    ],
    correct_answer: "a",
    points: 1,
    difficulty: "easy",
    grade_level: "11",
    section_name: "عناوين الشبكة وطرق تمثيل الأرقام في الشبكة",
    topic_name: "أنظمة العد",
    is_active: true
  },
  {
    question_text: "ما هي الطبقة من نموذج OSI التي يعمل فيها عنوان MAC؟",
    question_type: "multiple_choice",
    choices: [
      { id: "a", text: "طبقة الشبكة" },
      { id: "b", text: "طبقة ربط البيانات" },
      { id: "c", text: "طبقة النقل" },
      { id: "d", text: "طبقة التطبيقات" }
    ],
    correct_answer: "b",
    points: 1,
    difficulty: "easy",
    grade_level: "11",
    section_name: "عناوين الشبكة وطرق تمثيل الأرقام في الشبكة",
    topic_name: "MAC Address",
    is_active: true
  },
  {
    question_text: "كم عدد البتات في عنوان IPv4؟",
    question_type: "multiple_choice",
    choices: [
      { id: "a", text: "16 بت" },
      { id: "b", text: "32 بت" },
      { id: "c", text: "64 بت" },
      { id: "d", text: "128 بت" }
    ],
    correct_answer: "b",
    points: 1,
    difficulty: "easy",
    grade_level: "11",
    section_name: "عناوين الشبكة وطرق تمثيل الأرقام في الشبكة",
    topic_name: "IPv4",
    is_active: true
  },

  // ========== أسئلة اختيار متعدد - متوسطة (7 أسئلة) ==========
  {
    question_text: "ما هو Subnet Mask الافتراضي لشبكة من الفئة C (Class C)؟",
    question_type: "multiple_choice",
    choices: [
      { id: "a", text: "255.0.0.0" },
      { id: "b", text: "255.255.0.0" },
      { id: "c", text: "255.255.255.0" },
      { id: "d", text: "255.255.255.255" }
    ],
    correct_answer: "c",
    points: 2,
    difficulty: "medium",
    grade_level: "11",
    section_name: "عناوين الشبكة وطرق تمثيل الأرقام في الشبكة",
    topic_name: "Subnet Mask",
    is_active: true
  },
  {
    question_text: "أي من النطاقات التالية هو نطاق عناوين IP خاصة (Private IP)؟",
    question_type: "multiple_choice",
    choices: [
      { id: "a", text: "8.8.8.0 - 8.8.8.255" },
      { id: "b", text: "192.168.0.0 - 192.168.255.255" },
      { id: "c", text: "200.100.50.0 - 200.100.50.255" },
      { id: "d", text: "150.150.0.0 - 150.150.255.255" }
    ],
    correct_answer: "b",
    points: 2,
    difficulty: "medium",
    grade_level: "11",
    section_name: "عناوين الشبكة وطرق تمثيل الأرقام في الشبكة",
    topic_name: "Public vs Private IPs",
    is_active: true
  },
  {
    question_text: "ما هو الرقم 255 في النظام الثنائي؟",
    question_type: "multiple_choice",
    choices: [
      { id: "a", text: "11110000" },
      { id: "b", text: "11111111" },
      { id: "c", text: "10101010" },
      { id: "d", text: "11001100" }
    ],
    correct_answer: "b",
    points: 2,
    difficulty: "medium",
    grade_level: "11",
    section_name: "عناوين الشبكة وطرق تمثيل الأرقام في الشبكة",
    topic_name: "أنظمة العد",
    is_active: true
  },
  {
    question_text: "كم عدد العناوين المتاحة في IPv4؟",
    question_type: "multiple_choice",
    choices: [
      { id: "a", text: "حوالي 4 مليون" },
      { id: "b", text: "حوالي 4 مليار" },
      { id: "c", text: "حوالي 4 تريليون" },
      { id: "d", text: "غير محدود" }
    ],
    correct_answer: "b",
    points: 2,
    difficulty: "medium",
    grade_level: "11",
    section_name: "عناوين الشبكة وطرق تمثيل الأرقام في الشبكة",
    topic_name: "IPv4",
    is_active: true
  },
  {
    question_text: "ما هو الفرق الرئيسي بين عنوان IP وعنوان MAC؟",
    question_type: "multiple_choice",
    choices: [
      { id: "a", text: "IP ثابت و MAC متغير" },
      { id: "b", text: "IP منطقي و MAC فيزيائي" },
      { id: "c", text: "IP للشبكات المحلية و MAC للإنترنت" },
      { id: "d", text: "لا فرق بينهما" }
    ],
    correct_answer: "b",
    points: 2,
    difficulty: "medium",
    grade_level: "11",
    section_name: "عناوين الشبكة وطرق تمثيل الأرقام في الشبكة",
    topic_name: "MAC Address",
    is_active: true
  },
  {
    question_text: "أي من التالي يمثل الرقم الست عشري FF في النظام العشري؟",
    question_type: "multiple_choice",
    choices: [
      { id: "a", text: "100" },
      { id: "b", text: "200" },
      { id: "c", text: "255" },
      { id: "d", text: "256" }
    ],
    correct_answer: "c",
    points: 2,
    difficulty: "medium",
    grade_level: "11",
    section_name: "عناوين الشبكة وطرق تمثيل الأرقام في الشبكة",
    topic_name: "أنظمة العد",
    is_active: true
  },
  {
    question_text: "ما هي الأداة أو البروتوكول الذي يستخدم لترجمة عناوين IP الخاصة إلى عناوين عامة؟",
    question_type: "multiple_choice",
    choices: [
      { id: "a", text: "DNS" },
      { id: "b", text: "DHCP" },
      { id: "c", text: "NAT" },
      { id: "d", text: "ARP" }
    ],
    correct_answer: "c",
    points: 2,
    difficulty: "medium",
    grade_level: "11",
    section_name: "عناوين الشبكة وطرق تمثيل الأرقام في الشبكة",
    topic_name: "Public vs Private IPs",
    is_active: true
  },

  // ========== أسئلة اختيار متعدد - صعبة (5 أسئلة) ==========
  {
    question_text: "إذا كان لديك شبكة بعنوان 192.168.1.0/26، كم عدد الأجهزة التي يمكن توصيلها (Host addresses)؟",
    question_type: "multiple_choice",
    choices: [
      { id: "a", text: "30 جهاز" },
      { id: "b", text: "62 جهاز" },
      { id: "c", text: "126 جهاز" },
      { id: "d", text: "254 جهاز" }
    ],
    correct_answer: "b",
    points: 3,
    difficulty: "hard",
    grade_level: "11",
    section_name: "عناوين الشبكة وطرق تمثيل الأرقام في الشبكة",
    topic_name: "CIDR Notation",
    is_active: true
  },
  {
    question_text: "ما هو Subnet Mask المكافئ للترميز /28 في CIDR؟",
    question_type: "multiple_choice",
    choices: [
      { id: "a", text: "255.255.255.192" },
      { id: "b", text: "255.255.255.224" },
      { id: "c", text: "255.255.255.240" },
      { id: "d", text: "255.255.255.248" }
    ],
    correct_answer: "c",
    points: 3,
    difficulty: "hard",
    grade_level: "11",
    section_name: "عناوين الشبكة وطرق تمثيل الأرقام في الشبكة",
    topic_name: "CIDR Notation",
    is_active: true
  },
  {
    question_text: "كم عدد البتات في عنوان IPv6؟",
    question_type: "multiple_choice",
    choices: [
      { id: "a", text: "64 بت" },
      { id: "b", text: "96 بت" },
      { id: "c", text: "128 بت" },
      { id: "d", text: "256 بت" }
    ],
    correct_answer: "c",
    points: 3,
    difficulty: "hard",
    grade_level: "11",
    section_name: "عناوين الشبكة وطرق تمثيل الأرقام في الشبكة",
    topic_name: "IPv6",
    is_active: true
  },
  {
    question_text: "ما هو الرقم الثنائي 11000000.10101000.00000001.00000001 في النظام العشري (Dotted Decimal)؟",
    question_type: "multiple_choice",
    choices: [
      { id: "a", text: "192.168.1.1" },
      { id: "b", text: "192.168.0.1" },
      { id: "c", text: "192.168.1.0" },
      { id: "d", text: "192.167.1.1" }
    ],
    correct_answer: "a",
    points: 3,
    difficulty: "hard",
    grade_level: "11",
    section_name: "عناوين الشبكة وطرق تمثيل الأرقام في الشبكة",
    topic_name: "أنظمة العد",
    is_active: true
  },
  {
    question_text: "إذا قسمت شبكة من الفئة C (192.168.1.0/24) إلى 4 شبكات فرعية متساوية، ما هو Subnet Mask الجديد؟",
    question_type: "multiple_choice",
    choices: [
      { id: "a", text: "255.255.255.128" },
      { id: "b", text: "255.255.255.192" },
      { id: "c", text: "255.255.255.224" },
      { id: "d", text: "255.255.255.240" }
    ],
    correct_answer: "b",
    points: 4,
    difficulty: "hard",
    grade_level: "11",
    section_name: "عناوين الشبكة وطرق تمثيل الأرقام في الشبكة",
    topic_name: "Subnetting",
    is_active: true
  },

  // ========== أسئلة صح/خطأ - سهلة (3 أسئلة) ==========
  {
    question_text: "عنوان MAC هو عنوان فيزيائي فريد لكل بطاقة شبكة.",
    question_type: "true_false",
    correct_answer: "صح",
    points: 1,
    difficulty: "easy",
    grade_level: "11",
    section_name: "عناوين الشبكة وطرق تمثيل الأرقام في الشبكة",
    topic_name: "MAC Address",
    is_active: true
  },
  {
    question_text: "IPv6 تم تطويره لأن عناوين IPv4 بدأت تنفد.",
    question_type: "true_false",
    correct_answer: "صح",
    points: 1,
    difficulty: "easy",
    grade_level: "11",
    section_name: "عناوين الشبكة وطرق تمثيل الأرقام في الشبكة",
    topic_name: "IPv6",
    is_active: true
  },
  {
    question_text: "النظام الثنائي يستخدم فقط الرقمين 0 و 1.",
    question_type: "true_false",
    correct_answer: "صح",
    points: 1,
    difficulty: "easy",
    grade_level: "11",
    section_name: "عناوين الشبكة وطرق تمثيل الأرقام في الشبكة",
    topic_name: "أنظمة العد",
    is_active: true
  },

  // ========== أسئلة صح/خطأ - متوسطة (4 أسئلة) ==========
  {
    question_text: "العنوان 192.168.1.1 هو عنوان IP خاص (Private) ولا يمكن استخدامه على الإنترنت مباشرة.",
    question_type: "true_false",
    correct_answer: "صح",
    points: 2,
    difficulty: "medium",
    grade_level: "11",
    section_name: "عناوين الشبكة وطرق تمثيل الأرقام في الشبكة",
    topic_name: "Public vs Private IPs",
    is_active: true
  },
  {
    question_text: "Subnet Mask يستخدم لتحديد أي جزء من عنوان IP يمثل الشبكة وأي جزء يمثل الجهاز.",
    question_type: "true_false",
    correct_answer: "صح",
    points: 2,
    difficulty: "medium",
    grade_level: "11",
    section_name: "عناوين الشبكة وطرق تمثيل الأرقام في الشبكة",
    topic_name: "Subnet Mask",
    is_active: true
  },
  {
    question_text: "عنوان MAC يتكون من 6 أجزاء كل جزء 8 بتات ويكتب بالنظام الست عشري.",
    question_type: "true_false",
    correct_answer: "صح",
    points: 2,
    difficulty: "medium",
    grade_level: "11",
    section_name: "عناوين الشبكة وطرق تمثيل الأرقام في الشبكة",
    topic_name: "MAC Address",
    is_active: true
  },
  {
    question_text: "في النظام الست عشري، نستخدم الأحرف من A إلى Z لتمثيل الأرقام.",
    question_type: "true_false",
    correct_answer: "خطأ",
    points: 2,
    difficulty: "medium",
    grade_level: "11",
    section_name: "عناوين الشبكة وطرق تمثيل الأرقام في الشبكة",
    topic_name: "أنظمة العد",
    is_active: true
  },

  // ========== أسئلة صح/خطأ - صعبة (3 أسئلة) ==========
  {
    question_text: "الترميز /24 في CIDR يعني أن أول 24 بت من عنوان IP مخصصة لعنوان الشبكة.",
    question_type: "true_false",
    correct_answer: "صح",
    points: 3,
    difficulty: "hard",
    grade_level: "11",
    section_name: "عناوين الشبكة وطرق تمثيل الأرقام في الشبكة",
    topic_name: "CIDR Notation",
    is_active: true
  },
  {
    question_text: "IPv6 يستخدم نفس بنية العنوان الرباعية المستخدمة في IPv4.",
    question_type: "true_false",
    correct_answer: "خطأ",
    points: 3,
    difficulty: "hard",
    grade_level: "11",
    section_name: "عناوين الشبكة وطرق تمثيل الأرقام في الشبكة",
    topic_name: "IPv6",
    is_active: true
  },
  {
    question_text: "الرقم الثنائي 10000000 يساوي 128 في النظام العشري.",
    question_type: "true_false",
    correct_answer: "صح",
    points: 3,
    difficulty: "hard",
    grade_level: "11",
    section_name: "عناوين الشبكة وطرق تمثيل الأرقام في الشبكة",
    topic_name: "أنظمة العد",
    is_active: true
  }
];
