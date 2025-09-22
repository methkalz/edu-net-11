# توثيق شامل لمشروع النظام التعليمي

## نظرة عامة على المشروع

هذا المشروع عبارة عن **نظام إدارة تعليمية متكامل** مبني بتقنيات حديثة يهدف إلى توفير منصة شاملة لإدارة المدارس والمحتوى التعليمي والطلاب والمعلمين. يدعم النظام عدة مستويات دراسية (الصف 10، 11، 12) مع إمكانيات متقدمة لإدارة المحتوى والامتحانات والألعاب التعليمية.

---

## التقنيات والمكتبات المستخدمة

### التقنيات الأساسية
```json
{
  "Frontend Framework": "React 18.3.1",
  "Build Tool": "Vite 5.4.19", 
  "Language": "TypeScript 5.8.3",
  "CSS Framework": "Tailwind CSS 3.4.17",
  "UI Components": "shadcn/ui + Radix UI",
  "Routing": "React Router DOM 6.30.1"
}
```

### مكتبات الواجهة الأمامية

#### مكتبات UI الأساسية
- **`@radix-ui/*`**: مجموعة شاملة من مكونات UI متاحة وقابلة للوصول
  - `react-accordion`, `react-dialog`, `react-dropdown-menu`
  - `react-popover`, `react-select`, `react-tabs`
  - `react-toast`, `react-tooltip` وغيرها

#### أدوات التصميم والرسوم
- **`lucide-react`**: مكتبة أيقونات حديثة وعالية الجودة
- **`lottie-react`**: لعرض الرسوم المتحركة التفاعلية
- **`recharts`**: لإنشاء الرسوم البيانية والإحصائيات
- **`html2canvas`**: لالتقاط لقطات شاشة من المحتوى
- **`jspdf`**: لإنشاء وتصدير ملفات PDF

#### إدارة النماذج والتحقق
- **`react-hook-form`**: إدارة النماذج عالية الأداء
- **`@hookform/resolvers`**: حلول التحقق من صحة البيانات
- **`zod`**: مكتبة التحقق من صحة البيانات مع TypeScript

#### أدوات التفاعل والتجربة
- **`react-dropzone`**: رفع الملفات بالسحب والإفلات
- **`embla-carousel-react`**: مكونات العرض الدوار
- **`react-resizable-panels`**: لوحات قابلة لتغيير الحجم
- **`vaul`**: مكونات Drawer متقدمة

### Backend والبيانات

#### قاعدة البيانات والمصادقة
- **`@supabase/supabase-js`**: منصة Backend-as-a-Service شاملة
  - قاعدة بيانات PostgreSQL
  - المصادقة والترخيص
  - تخزين الملفات
  - Edge Functions
  - Real-time subscriptions

#### إدارة الحالة والاستعلامات
- **`@tanstack/react-query`**: إدارة حالة الخادم والتخزين المؤقت المتقدم

#### الأمان والتشفير
- **`crypto-js`**: مكتبة تشفير البيانات الحساسة

### أدوات المساعدة والمرافق

#### التاريخ والوقت
- **`date-fns`**: معالجة التواريخ والأوقات
- **`react-day-picker`**: مكون اختيار التاريخ

#### التصميم والثيمات
- **`next-themes`**: إدارة الثيمات (فاتح/داكن)
- **`class-variance-authority`**: إنشاء مكونات مع متغيرات
- **`clsx`**: دمج أسماء الفئات بشكل شرطي
- **`tailwind-merge`**: دمج فئات Tailwind بذكاء
- **`tailwindcss-animate`**: رسوم متحركة جاهزة

#### واجهة التحكم والقوائم
- **`cmdk`**: مكون القوائم التفاعلية
- **`sonner`**: نظام إشعارات أنيق
- **`input-otp`**: إدخال رمز OTP

---

## هيكل المشروع وتنظيم الملفات

### الهيكل العام
```
project/
├── public/                          # الملفات العامة والثابتة
│   ├── lovable-uploads/             # ملفات المستخدمين المرفوعة
│   └── robots.txt                   # ملف robots للمحركات البحث
├── src/                            # المجلد الرئيسي للكود المصدري
│   ├── components/                 # المكونات القابلة لإعادة الاستخدام
│   ├── hooks/                      # React Hooks مخصصة
│   ├── integrations/               # تكاملات الخدمات الخارجية
│   ├── lib/                        # مكتبات ومرافق مساعدة
│   ├── pages/                      # صفحات التطبيق الرئيسية
│   ├── types/                      # تعريفات أنواع TypeScript
│   └── utils/                      # دوال مساعدة عامة
├── supabase/                       # إعدادات وملفات Supabase
│   ├── functions/                  # Edge Functions
│   └── migrations/                 # ملفات الهجرة لقاعدة البيانات
└── ملفات الإعداد الأساسية
```

### تفصيل مجلد `src/components/`

```
src/components/
├── calendar/                       # مكونات التقويم
│   └── SchoolCalendarWidget.tsx    # ودجة تقويم المدرسة
├── content/                        # مكونات إدارة المحتوى
│   ├── Grade10*/                   # مكونات خاصة بالصف العاشر
│   ├── Grade11*/                   # مكونات خاصة بالصف الحادي عشر
│   ├── Grade12*/                   # مكونات خاصة بالصف الثاني عشر
│   ├── CodeBlock.tsx               # عرض الأكواد البرمجية
│   ├── DocumentEditor.tsx          # محرر المستندات
│   ├── ExamForm.tsx                # نماذج الامتحانات
│   ├── RichTextEditor.tsx          # محرر النصوص المنسق
│   └── VideoForm.tsx               # نماذج الفيديوهات
├── dashboard/                      # مكونات لوحة التحكم
│   ├── DashboardStats.tsx          # إحصائيات لوحة التحكم
│   └── DashboardWidgets.tsx        # ودجات لوحة التحكم
├── forms/                          # نماذج المصادقة
│   ├── SignInForm.tsx              # نموذج تسجيل الدخول
│   └── SignUpForm.tsx              # نموذج إنشاء حساب
├── games/                          # مكونات الألعاب التعليمية
│   ├── KnowledgeAdventure.tsx      # لعبة مغامرة المعرفة
│   ├── QuizChallenge.tsx           # تحدي الأسئلة
│   ├── GameMap.tsx                 # خريطة اللعبة
│   ├── Achievements.tsx            # نظام الإنجازات
│   └── Leaderboard.tsx             # لوحة المتصدرين
├── security/                       # مكونات الأمان
│   └── SecurityMonitor.tsx         # مراقب الأمان
├── shared/                         # مكونات مشتركة
│   ├── AppHeader.tsx               # رأس التطبيق
│   ├── AppFooter.tsx               # تذييل التطبيق
│   └── BackButton.tsx              # زر العودة
├── ui/                            # مكونات UI الأساسية (shadcn/ui)
│   ├── button.tsx                  # مكون الأزرار
│   ├── card.tsx                    # مكون البطاقات
│   ├── dialog.tsx                  # مكون النوافذ المنبثقة
│   ├── form.tsx                    # مكونات النماذج
│   ├── input.tsx                   # مكونات الإدخال
│   ├── table.tsx                   # مكونات الجداول
│   └── ... (40+ مكون UI)
└── widgets/                        # ودجات متخصصة
    └── UpcomingEventsWidget.tsx     # ودجة الأحداث القادمة
```

### تفصيل مجلد `src/pages/`

```
src/pages/
├── Index.tsx                       # الصفحة الرئيسية
├── Auth.tsx                        # صفحة المصادقة
├── SuperAdminAuth.tsx              # مصادقة المدير الرئيسي
├── Dashboard.tsx                   # لوحة التحكم الرئيسية
├── Test.tsx                        # صفحة الاختبار (للتطوير)
├── NotFound.tsx                    # صفحة 404
├── إدارة المدارس/
│   ├── SchoolAdminManagement.tsx   # إدارة مديري المدارس
│   ├── SchoolClasses.tsx           # إدارة الفصول الدراسية
│   └── AcademicYears.tsx           # إدارة السنوات الأكاديمية
├── إدارة المستخدمين/
│   ├── UserManagement.tsx          # إدارة المستخدمين
│   └── StudentManagement.tsx       # إدارة الطلاب
├── إدارة المحتوى/
│   ├── ContentManagement.tsx       # إدارة المحتوى العامة
│   ├── Grade10Management.tsx       # إدارة محتوى الصف العاشر
│   ├── Grade11Management.tsx       # إدارة محتوى الصف الحادي عشر
│   └── Grade12Management.tsx       # إدارة محتوى الصف الثاني عشر
├── إدارة النظام/
│   ├── SystemSettings.tsx          # إعدادات النظام
│   ├── PluginManagement.tsx        # إدارة الإضافات
│   ├── PackageManagement.tsx       # إدارة الحزم
│   └── CalendarManagement.tsx      # إدارة التقويم
└── المدرسة/
    └── SchoolManagement.tsx        # إدارة المدرسة العامة
```

### تفصيل مجلد `src/hooks/`

```
src/hooks/
├── مصادقة/
│   └── useAuth.tsx                 # إدارة حالة المصادقة
├── إدارة البيانات/
│   ├── useDashboardStats.ts        # إحصائيات لوحة التحكم
│   ├── useGradeStats.ts            # إحصائيات الدرجات
│   ├── useCalendarEvents.ts        # أحداث التقويم
│   └── useSecureOperations.ts      # العمليات الآمنة
├── إدارة المحتوى/
│   ├── useGrade10Content.ts        # محتوى الصف العاشر
│   ├── useGrade11Content.ts        # محتوى الصف الحادي عشر
│   ├── useGrade12Content.ts        # محتوى الصف الثاني عشر
│   └── useGradeContent.ts          # محتوى عام للصفوف
├── ملفات ومشاريع/
│   ├── useGrade10Files.ts          # ملفات الصف العاشر
│   ├── useGrade11Files.ts          # ملفات الصف الحادي عشر
│   ├── useGrade10Projects.ts       # مشاريع الصف العاشر
│   └── useGrade12Projects.ts       # مشاريع الصف الثاني عشر
├── نظام الامتحانات/
│   └── useExamSystem.ts            # نظام إدارة الامتحانات
├── ألعاب تعليمية/
│   └── useGrade11Game.ts           # ألعاب الصف الحادي عشر
├── مرافق/
│   ├── useAsyncOperation.ts        # العمليات غير المتزامنة
│   ├── useLocalStorage.ts          # التخزين المحلي
│   ├── useMobile.tsx               # كشف الأجهزة المحمولة
│   ├── useRTL.tsx                  # دعم الاتجاه من اليمين لليسار
│   └── useSiteSettings.tsx         # إعدادات الموقع
└── إعدادات/
    ├── useLottieSettings.ts        # إعدادات Lottie
    └── useSharedLottieSettings.ts  # إعدادات Lottie المشتركة
```

---

## نظام التوجيه (Routing System)

### إعداد التوجيه الرئيسي

يستخدم المشروع `React Router DOM v6` مع نظام **Lazy Loading** لتحسين الأداء:

```typescript
// في src/App.tsx
<BrowserRouter>
  <Suspense fallback={<PageLoading message="Loading..." />}>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<LazyAuth />} />
      <Route path="/dashboard" element={<LazyDashboard />} />
      <Route path="/school-management" element={<LazySchoolManagement />} />
      {/* المزيد من المسارات... */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
</BrowserRouter>
```

### نظام التحميل التدريجي

```typescript
// في src/components/LazyComponents.tsx
export const LazyDashboard = lazy(() => import('@/pages/Dashboard'));
export const LazyAuth = lazy(() => import('@/pages/Auth'));
export const LazySchoolManagement = lazy(() => import('@/pages/SchoolManagement'));
// إلخ...
```

### خريطة المسارات الكاملة

| المسار | الصفحة | الوصف | نوع المستخدم |
|--------|---------|--------|-------------|
| `/` | Index | الصفحة الرئيسية | جميع المستخدمين |
| `/auth` | Auth | تسجيل الدخول/إنشاء حساب | غير مسجل |
| `/super-admin-auth` | SuperAdminAuth | مصادقة المدير الرئيسي | مدير رئيسي |
| `/dashboard` | Dashboard | لوحة التحكم | مصادق |
| `/test` | Test | صفحة الاختبار | مطور |
| **إدارة المدارس** ||||
| `/school-management` | SchoolManagement | إدارة المدرسة العامة | مدير مدرسة+ |
| `/school-admin-management` | SchoolAdminManagement | إدارة مديري المدارس | مدير رئيسي |
| `/academic-years` | AcademicYears | إدارة السنوات الأكاديمية | مدير رئيسي |
| `/school-classes` | SchoolClasses | إدارة الفصول الدراسية | مدير مدرسة+ |
| **إدارة المستخدمين** ||||
| `/users` | UserManagement | إدارة المستخدمين | مدير رئيسي |
| `/students` | StudentManagement | إدارة الطلاب | مدير مدرسة+ |
| **إدارة المحتوى** ||||
| `/content-management` | ContentManagement | إدارة المحتوى العامة | معلم+ |
| `/content-management/grade-10` | Grade10Management | محتوى الصف العاشر | معلم+ |
| `/content-management/grade-11` | Grade11Management | محتوى الصف الحادي عشر | معلم+ |
| `/content-management/grade-12` | Grade12Management | محتوى الصف الثاني عشر | معلم+ |
| **إدارة النظام** ||||
| `/system-settings` | SystemSettings | إعدادات النظام | مدير رئيسي |
| `/plugin-management` | PluginManagement | إدارة الإضافات | مدير رئيسي |
| `/package-management` | PackageManagement | إدارة الحزم | مدير رئيسي |
| `/calendar-management` | CalendarManagement | إدارة التقويم | مدير مدرسة+ |

---

## أنماط التصميم المطبقة

### 1. نمط Component Composition

```typescript
// مثال: مكون البطاقة المركب
<Card>
  <CardHeader>
    <CardTitle>عنوان البطاقة</CardTitle>
  </CardHeader>
  <CardContent>
    محتوى البطاقة
  </CardContent>
</Card>
```

### 2. نمط Custom Hooks

```typescript
// مثال: Hook لإدارة حالة الامتحان
const useExamSystem = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const createExam = async (examData) => {
    // منطق إنشاء الامتحان
  };
  
  return { exams, loading, createExam };
};
```

### 3. نمط Context API

```typescript
// في src/hooks/useAuth.tsx
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  
  return (
    <AuthContext.Provider value={{ user, session }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 4. نمط Higher-Order Components (HOC)

```typescript
// في src/components/LazyComponents.tsx
export const withLazyLoading = (Component) => {
  return (props) => (
    <SimpleErrorBoundary>
      <Component {...props} />
    </SimpleErrorBoundary>
  );
};
```

### 5. نمط Render Props

```typescript
// استخدام في نماذج إدارة المحتوى
<Form>
  {({ register, errors }) => (
    <Input 
      {...register("title")} 
      error={errors.title?.message}
    />
  )}
</Form>
```

### 6. نمط Error Boundary

```typescript
// في src/lib/error-boundary.tsx
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

---

## نظام التصميم (Design System)

### نظام الألوان

المشروع يستخدم نظام ألوان متقدم مبني على متغيرات CSS:

```css
/* المتغيرات الأساسية */
:root {
  --primary: 214 85% 55%;           /* أزرق أساسي */
  --secondary: 25 85% 55%;          /* برتقالي ثانوي */
  --background: 218 15% 98%;        /* خلفية فاتحة */
  --foreground: 215 25% 12%;        /* نص داكن */
  
  /* ألوان موسعة */
  --purple-mystic: 270 85% 65%;
  --green-emerald: 150 85% 55%;
  --yellow-bright: 55 100% 65%;
}
```

### نظام التدرجات اللونية

```css
/* تدرجات حديثة */
--gradient-blue: linear-gradient(135deg, hsl(214 85% 55%), hsl(214 95% 45%));
--gradient-orange: linear-gradient(135deg, hsl(25 85% 55%), hsl(25 95% 45%));
--gradient-hero: linear-gradient(135deg, hsl(214 85% 55% / 0.1), hsl(25 85% 55% / 0.05));
```

### نظام الظلال

```css
/* ظلال متقدمة */
--shadow-primary: 0 8px 32px hsl(220 85% 60% / 0.3);
--shadow-electric: 0 8px 32px hsl(210 100% 65% / 0.4);
--shadow-neon: 0 0 40px hsl(120 100% 60% / 0.6);
```

### نظام الخطوط

```typescript
// في tailwind.config.ts
fontFamily: {
  cairo: ['Cairo', 'sans-serif'],      // الخط الأساسي
  tajawal: ['Tajawal', 'sans-serif'],  // خط بديل
  amiri: ['Amiri', 'serif'],           // خط زخرفي
}
```

### فئات مساعدة مخصصة

```css
/* بطاقات حديثة */
.modern-card {
  backdrop-filter: blur(10px);
  background: hsl(var(--card) / 0.95);
  border: 1px solid hsl(var(--border) / 0.3);
  transition: all 0.3s ease;
}

/* رسوم متحركة متقدمة */
.animate-modern-pulse {
  animation: modern-pulse 2s ease-in-out infinite;
}

/* خلفيات إبداعية */
.creative-background::before {
  background-image: 
    radial-gradient(circle at 25% 25%, hsl(var(--primary) / 0.08) 1px, transparent 1px);
}
```

---

## إدارة الحالة (State Management)

### 1. React Query لحالة الخادم

```typescript
// استخدام React Query لإدارة البيانات
const { data: students, isLoading } = useQuery({
  queryKey: ['students', schoolId],
  queryFn: () => getStudents(schoolId),
  staleTime: 5 * 60 * 1000, // 5 دقائق
});
```

### 2. Context API لحالة التطبيق العامة

```typescript
// حالة المصادقة
const { user, userProfile, signIn, signOut } = useAuth();

// حالة إعدادات الموقع  
const siteSettings = useSiteSettings();
```

### 3. useState لحالة المكونات المحلية

```typescript
// حالة النماذج والواجهة
const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState(initialData);
const [errors, setErrors] = useState({});
```

### 4. Custom Hooks لمنطق الأعمال

```typescript
// hook مخصص للامتحانات
const useExamSystem = () => {
  const [exams, setExams] = useState([]);
  const [currentExam, setCurrentExam] = useState(null);
  
  const createExam = useCallback(async (data) => {
    // منطق إنشاء الامتحان
  }, []);
  
  return { exams, currentExam, createExam };
};
```

---

## نظام الأمان والصلاحيات

### مستويات المستخدمين

```typescript
// أنواع المستخدمين
type UserRole = 
  | 'superadmin'     // مدير النظام الرئيسي
  | 'school_admin'   // مدير المدرسة  
  | 'teacher'        // معلم
  | 'student'        // طالب
  | 'parent';        // ولي أمر
```

### نظام Row Level Security (RLS)

قاعدة البيانات تطبق نظام أمان متقدم:

```sql
-- مثال: سياسة أمان للطلاب
CREATE POLICY "Students can view their own projects" 
ON grade10_projects 
FOR SELECT 
USING (student_id = auth.uid());

-- سياسة أمان للمعلمين
CREATE POLICY "Teachers can view projects in their school" 
ON grade10_projects 
FOR SELECT 
USING (school_id = get_user_school_id());
```

### حماية المسارات

```typescript
// في كل صفحة محمية
const { user, userProfile, loading } = useAuth();

useEffect(() => {
  if (!loading && !user) {
    navigate('/auth');
  }
}, [user, loading, navigate]);

// التحقق من الصلاحيات
if (userProfile?.role !== 'school_admin') {
  return <AccessDenied />;
}
```

### تشفير البيانات الحساسة

```typescript
// في src/lib/encryption.ts
import CryptoJS from 'crypto-js';

export const encryptData = (data: string): string => {
  return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
};

export const decryptData = (encryptedData: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};
```

---

## قاعدة البيانات وهيكل البيانات

### الجداول الرئيسية

#### جدول المستخدمين
```sql
-- profiles: ملفات المستخدمين
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  role app_role NOT NULL,
  full_name TEXT,
  email TEXT,
  school_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### جداول المدارس والفصول
```sql
-- schools: المدارس
CREATE TABLE schools (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  city_id UUID,
  principal_id UUID
);

-- classes: الفصول الدراسية
CREATE TABLE classes (
  id UUID PRIMARY KEY,
  school_id UUID REFERENCES schools,
  grade_level_id UUID,
  academic_year_id UUID,
  status TEXT DEFAULT 'active'
);
```

#### جداول المحتوى التعليمي
```sql
-- grade10_documents: مستندات الصف العاشر
CREATE TABLE grade10_documents (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  category TEXT,
  school_id UUID,
  is_visible BOOLEAN DEFAULT true
);

-- grade11_game_questions: أسئلة ألعاب الصف الحادي عشر
CREATE TABLE grade11_game_questions (
  id UUID PRIMARY KEY,
  question_text TEXT NOT NULL,
  choices JSONB,
  correct_answer TEXT,
  difficulty_level TEXT DEFAULT 'medium'
);
```

#### جداول الامتحانات
```sql
-- exams: الامتحانات
CREATE TABLE exams (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  course_id UUID,
  duration_minutes INTEGER,
  max_score INTEGER,
  is_active BOOLEAN DEFAULT true
);

-- exam_attempts: محاولات الامتحان
CREATE TABLE exam_attempts (
  id UUID PRIMARY KEY,
  exam_id UUID REFERENCES exams,
  student_id UUID,
  total_score INTEGER,
  status TEXT DEFAULT 'in_progress'
);
```

### الدوال المساعدة في قاعدة البيانات

```sql
-- دالة للحصول على دور المستخدم
CREATE FUNCTION get_user_role() RETURNS app_role AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- دالة للحصول على معرف المدرسة
CREATE FUNCTION get_user_school_id() RETURNS UUID AS $$
  SELECT school_id FROM profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
```

---

## نظام الملفات والتخزين

### مجلدات التخزين في Supabase

```typescript
// مجلدات التخزين
const STORAGE_BUCKETS = {
  'school-files': 'ملفات المدرسة العامة',
  'grade10-documents': 'مستندات الصف العاشر', 
  'grade11-documents': 'مستندات الصف الحادي عشر'
};
```

### إدارة رفع الملفات

```typescript
// في مكونات رفع الملفات
const uploadFile = async (file: File, bucket: string) => {
  const fileName = `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);
    
  if (error) throw error;
  return data.path;
};
```

### نظام الحماية للملفات

```sql
-- سياسات أمان للملفات
CREATE POLICY "Users can upload files to their school" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'school-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## نظام الألعاب التعليمية

### مكونات نظام الألعاب

#### 1. Knowledge Adventure (مغامرة المعرفة)
- نظام خريطة تفاعلية
- مستويات متدرجة الصعوبة
- نظام نقاط وإنجازات
- تتبع التقدم الفردي

#### 2. Quiz Challenge (تحدي الأسئلة)  
- أسئلة متعددة الخيارات
- توقيت محدد للإجابة
- تصنيف حسب المواضيع
- نظام صعوبة متدرج

#### 3. نظام الإنجازات
```typescript
// أنواع الإنجازات
type AchievementType = 
  | 'first_lesson_complete'
  | 'perfect_score'
  | 'speed_master'
  | 'consistency_master';
```

#### 4. لوحة المتصدرين
- ترتيب حسب النقاط
- إحصائيات أسبوعية/شهرية
- تصنيف حسب المستوى الدراسي

### قاعدة بيانات الألعاب

```sql
-- تقدم الألعاب
CREATE TABLE grade11_game_progress (
  id UUID PRIMARY KEY,
  user_id UUID,
  lesson_id UUID,
  score INTEGER,
  max_score INTEGER,
  unlocked BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ
);

-- إنجازات الألعاب  
CREATE TABLE grade11_game_achievements (
  id UUID PRIMARY KEY,
  user_id UUID,
  achievement_type TEXT,
  achievement_data JSONB,
  unlocked_at TIMESTAMPTZ DEFAULT now()
);
```

---

## نظام الامتحانات المتقدم

### مكونات نظام الامتحانات

#### 1. قوالب الامتحانات (Exam Templates)
```typescript
interface ExamTemplate {
  id: string;
  title: string;
  total_questions: number;
  duration_minutes: number;
  difficulty_distribution: {
    easy: number;
    medium: number; 
    hard: number;
  };
  question_sources: {
    type: 'random' | 'specific';
    sections: string[];
  };
}
```

#### 2. بنك الأسئلة
```typescript
interface ExamQuestion {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  choices: Option[];
  correct_answer: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  points: number;
  category_id?: string;
}
```

#### 3. محاولات الامتحان
```typescript
interface ExamAttempt {
  id: string;
  exam_id: string;
  student_id: string;
  started_at: Date;
  finished_at?: Date;
  total_score: number;
  max_score: number;
  status: 'in_progress' | 'completed' | 'abandoned';
}
```

### ميزات الامتحانات

- **ترتيب عشوائي للأسئلة والإجابات**
- **توقيت محدد للامتحان**
- **حفظ تلقائي للإجابات**
- **منع الغش (تبديل النوافذ)**
- **تقارير مفصلة للنتائج**
- **إعدادات مرونة (محاولات متعددة، إظهار النتائج)**

---

## نظام إدارة المحتوى

### أنواع المحتوى المدعومة

#### 1. المستندات والملفات
```typescript
interface DocumentContent {
  id: string;
  title: string;
  file_path: string;
  file_type: string;
  file_size: number;
  category: string;
  grade_level: string;
  is_visible: boolean;
  allowed_roles: UserRole[];
}
```

#### 2. مقاطع الفيديو
```typescript
interface VideoContent {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: string;
  source_type: 'youtube' | 'vimeo' | 'direct';
  category: string;
  order_index: number;
}
```

#### 3. الدروس التفاعلية
```typescript
interface LessonContent {
  id: string;
  title: string;
  content: string; // Rich text content
  media_items: MediaItem[];
  exercises: Exercise[];
  estimated_duration: number;
  prerequisites: string[];
}
```

#### 4. المشاريع العملية
```typescript
interface ProjectContent {
  id: string;
  title: string;
  description: string;
  content: string;
  due_date?: Date;
  status: 'draft' | 'published' | 'submitted' | 'graded';
  tasks: ProjectTask[];
  grade?: number;
  teacher_feedback?: string;
}
```

### محرر المحتوى المتقدم

المشروع يتضمن محرر نصوص متقدم يدعم:

- **تنسيق النصوص (خط، حجم، لون)**
- **إدراج الصور والفيديوهات**
- **إنشاء جداول وقوائم**
- **أكواد برمجية مع تمييز الصيغة**
- **رسوم بيانية تفاعلية**
- **معادلات رياضية**

---

## نظام التقويم والأحداث

### مكونات نظام التقويم

#### 1. إدارة الأحداث
```typescript
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  end_date?: Date;
  time?: string;
  type: 'event' | 'exam' | 'holiday' | 'meeting';
  color: string;
  school_id?: string;
  is_active: boolean;
}
```

#### 2. إعدادات التقويم
```typescript
interface CalendarSettings {
  id: string;
  show_in_header: boolean;
  header_duration: number;
  header_color: string;
  auto_show_before_days: number;
  is_active: boolean;
}
```

### ميزات التقويم

- **عرض شهري/أسبوعي/يومي**
- **أحداث ملونة حسب النوع**
- **تنبيهات تلقائية للأحداث القادمة**
- **تصدير للتقويمات الخارجية**
- **مزامنة مع أحداث المدرسة**

---

## نظام الإحصائيات والتقارير

### أنواع الإحصائيات

#### 1. إحصائيات لوحة التحكم
```typescript
interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalExams: number;
  averageGrade: number;
  completionRate: number;
  activeUsers: number;
  recentActivity: Activity[];
}
```

#### 2. إحصائيات الدرجات
```typescript
interface GradeStats {
  grade_level: string;
  total_students: number;
  total_content: number;
  completion_rate: number;
  average_score: number;
  top_performers: Student[];
  struggling_students: Student[];
}
```

#### 3. تقارير الأداء
- **تقرير أداء الطلاب الفردي**
- **تقرير أداء الفصل الدراسي**
- **تقرير استخدام المحتوى**
- **تقرير نشاط المعلمين**
- **تقارير الحضور والغياب**

### رسوم بيانية تفاعلية

المشروع يستخدم مكتبة `recharts` لعرض:

- **رسوم بيانية خطية للتقدم**
- **رسوم دائرية للتوزيعات**
- **رسوم عمودية للمقارنات**
- **خرائط حرارية للأنشطة**

---

## نظام الأمان والمراقبة

### مكونات الأمان

#### 1. مراقب الأمان
```typescript
// في src/components/security/SecurityMonitor.tsx
const SecurityMonitor = () => {
  const [threats, setThreats] = useState([]);
  const [securityScore, setSecurityScore] = useState(0);
  
  // مراقبة النشاطات المشبوهة
  useEffect(() => {
    monitorSuspiciousActivity();
  }, []);
  
  return (
    <SecurityDashboard 
      threats={threats}
      score={securityScore}
    />
  );
};
```

#### 2. سجل التدقيق
```sql
-- جدول سجل التدقيق
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  actor_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  payload_json JSONB,
  created_at_utc TIMESTAMPTZ DEFAULT now()
);
```

#### 3. حد المعدل (Rate Limiting)
```sql
-- جدول تتبع محاولات تسجيل الدخول
CREATE TABLE auth_rate_limit (
  id UUID PRIMARY KEY,
  identifier TEXT NOT NULL,
  attempt_type TEXT NOT NULL,
  attempts_count INTEGER DEFAULT 1,
  first_attempt_at TIMESTAMPTZ,
  blocked_until TIMESTAMPTZ
);
```

### ميزات الأمان المتقدمة

- **تشفير البيانات الحساسة**
- **مصادقة ثنائية (2FA)**
- **جلسات آمنة محدودة الوقت**
- **حماية من هجمات CSRF/XSS**
- **مراقبة الأنشطة غير الطبيعية**
- **نسخ احتياطية مشفرة**

---

## أدوات التطوير والاختبار

### أدوات البناء والتطوير

```json
{
  "devDependencies": {
    "@eslint/js": "^9.32.0",                    // أداة فحص الكود
    "@types/node": "^22.16.5",                  // تعريفات TypeScript لـ Node.js
    "@types/react": "^18.3.23",                 // تعريفات React
    "@types/react-dom": "^18.3.7",              // تعريفات React DOM
    "@vitejs/plugin-react-swc": "^3.11.0",      // بلاجن React لـ Vite
    "autoprefixer": "^10.4.21",                 // إضافة البادئات تلقائياً
    "eslint": "^9.32.0",                        // أداة فحص الكود الرئيسية
    "eslint-plugin-react-hooks": "^5.2.0",     // قواعد React Hooks
    "eslint-plugin-react-refresh": "^0.4.20",  // دعم Hot Reload
    "lovable-tagger": "^1.1.9",                 // أداة Lovable للتطوير
    "postcss": "^8.5.6",                        // معالج CSS
    "tailwindcss": "^3.4.17",                   // إطار CSS
    "typescript": "^5.8.3",                     // TypeScript
    "vite": "^5.4.19"                           // أداة البناء السريع
  }
}
```

### إعدادات ESLint

```javascript
// eslint.config.js
export default {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react-hooks/recommended'
  ],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true }
    ]
  }
};
```

### صفحة الاختبار (Test Page)

المشروع يتضمن صفحة اختبار متطورة في `/test` تحتوي على:

```typescript
// أزرار تنقل لجميع الصفحات
const pages = [
  { name: 'الرئيسية', path: '/', icon: Home },
  { name: 'المصادقة', path: '/auth', icon: Lock },
  { name: 'لوحة التحكم', path: '/dashboard', icon: BarChart3 },
  // ... جميع الصفحات الأخرى
];

// شبكة أزرار ملونة للتنقل السريع
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {pages.map((page, index) => (
    <Button 
      key={index}
      className={page.color}
      onClick={() => navigate(page.path)}
    >
      <page.icon className="h-5 w-5" />
      {page.name}
    </Button>
  ))}
</div>
```

---

## نصائح الأداء والتحسين

### 1. تحميل تدريجي (Lazy Loading)

```typescript
// تحميل الصفحات حسب الحاجة
const LazyDashboard = lazy(() => import('@/pages/Dashboard'));
const LazyContentManagement = lazy(() => import('@/pages/ContentManagement'));
```

### 2. تخزين مؤقت ذكي

```typescript
// استخدام React Query للتخزين المؤقت
const { data, isLoading } = useQuery({
  queryKey: ['students', schoolId],
  queryFn: fetchStudents,
  staleTime: 5 * 60 * 1000, // 5 دقائق
  cacheTime: 10 * 60 * 1000, // 10 دقائق
});
```

### 3. تحسين الصور

```typescript
// تحميل الصور التدريجي
<img 
  src={imageUrl}
  loading="lazy"
  alt="وصف الصورة"
  className="w-full h-auto"
/>
```

### 4. تحسين الخطوط

```css
/* تحميل الخطوط مسبقاً */
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap');
```

### 5. تقليل حجم الحزمة

- استخدام Tree Shaking لإزالة الكود غير المستخدم
- تقسيم الحزمة حسب المسارات
- ضغط الأصول والصور

---

## دليل النشر والصيانة

### متطلبات النشر

#### 1. متغيرات البيئة
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 2. إعدادات Supabase
- تفعيل Row Level Security
- إعداد سياسات الأمان
- رفع Edge Functions
- إعداد Storage Buckets

#### 3. إعدادات النطاق
- ربط النطاق المخصص
- إعداد شهادات SSL
- إعداد DNS Records

### مراقبة الأداء

#### 1. مراقبة قاعدة البيانات
```sql
-- مراقبة الاستعلامات البطيئة
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

#### 2. مراقبة التطبيق
```typescript
// في src/lib/performance-monitor.ts
export const trackPageLoad = (pageName: string, loadTime: number) => {
  console.log(`Page ${pageName} loaded in ${loadTime}ms`);
  // إرسال للمراقبة الخارجية
};
```

#### 3. معالجة الأخطاء
```typescript
// Error Boundary للتعامل مع الأخطاء
export const GlobalErrorBoundary = ({ children }) => {
  return (
    <ErrorBoundary 
      fallback={<ErrorFallback />}
      onError={(error, errorInfo) => {
        logError(error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
```

---

## خارطة الطريق المستقبلية

### المرحلة القادمة (الأولوية العالية)

#### 1. تحسينات الأداء
- **تحسين استعلامات قاعدة البيانات**
- **إضافة المزيد من التخزين المؤقت**
- **تحسين تحميل الصور والملفات**
- **ضغط وتحسين حزمة JavaScript**

#### 2. ميزات جديدة أساسية
- **نظام الإشعارات الفورية**
- **تطبيق محمول (React Native)**
- **دعم الوضع غير المتصل (Offline)**
- **نظام النسخ الاحتياطي التلقائي**

#### 3. تحسينات الأمان
- **مصادقة ثنائية إجبارية**
- **تشفير قاعدة البيانات بالكامل**
- **مراقبة أمنية متقدمة**
- **اختبارات اختراق دورية**

### المرحلة المتوسطة

#### 1. ذكاء اصطناعي
- **توصيات محتوى ذكية**
- **تصحيح تلقائي للامتحانات**
- **تحليل أداء الطلاب بالذكاء الاصطناعي**
- **مساعد ذكي للمعلمين**

#### 2. تكامل خارجي
- **ربط مع أنظمة المدارس الحكومية**
- **تكامل مع منصات التعلم الدولية**
- **ربط مع أنظمة إدارة المحتوى**
- **تكامل مع أدوات التقييم الخارجية**

#### 3. ميزات متقدمة
- **فصول افتراضية مباشرة**
- **نظام منتدى تفاعلي**
- **مكتبة موارد مشتركة**
- **نظام تقييم الأقران**

### المرحلة طويلة المدى

#### 1. توسعة المنصة
- **دعم جامعات ومعاهد**
- **نظام شهادات رقمية**
- **متجر محتوى تعليمي**
- **شبكة معلمين عالمية**

#### 2. تقنيات متطورة
- **واقع معزز للتعليم**
- **واقع افتراضي للمختبرات**
- **تعلم آلي متقدم**
- **معالجة لغة طبيعية**

---

## خلاصة التوثيق

هذا المشروع يمثل **نظاماً تعليمياً متكاملاً** مبني بأحدث التقنيات والمعايير. يتميز بـ:

### النقاط القوية الرئيسية

1. **بنية تقنية حديثة**: استخدام React 18، TypeScript، Vite
2. **تصميم مرن وقابل للتوسع**: نمط Component-based مع Custom Hooks
3. **أمان متقدم**: RLS، تشفير، مراقبة
4. **أداء محسن**: Lazy Loading، Caching، تحسين الحزمة
5. **واجهة مستخدم متطورة**: shadcn/ui، Tailwind CSS، تصميم متجاوب
6. **دعم كامل للعربية**: RTL، خطوط عربية، محتوى باللغة العربية

### التقنيات المميزة

- **نظام ألعاب تعليمية تفاعلي**
- **محرر محتوى غني ومتقدم**
- **نظام امتحانات ذكي**
- **إحصائيات وتقارير تفصيلية**
- **إدارة ملفات متقدمة**
- **نظام صلاحيات متدرج**

### قابلية الصيانة

المشروع مصمم بطريقة تسهل:
- **إضافة ميزات جديدة**
- **تعديل التصميم والواجهة**
- **توسيع قاعدة البيانات**
- **تحسين الأداء**
- **إصلاح الأخطاء**

يُعتبر هذا المشروع **مثالاً متقدماً** على كيفية بناء تطبيق تعليمي حديث وشامل يجمع بين الأداء العالي، الأمان المتقدم، وتجربة المستخدم المتميزة.