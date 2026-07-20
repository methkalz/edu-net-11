import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

const DEFAULT_TITLE = 'نظام تعليمي وإداري ذكي لتخصص الحوسبة | EduNet';
const DEFAULT_DESCRIPTION =
  'منصة EduNet التعليمية الذكية: نظام إدارة تعلم متكامل لتخصص الحوسبة، يجمع الامتحانات، البجروت، المشاريع، والألعاب التعليمية للصفوف العاشر إلى الثاني عشر.';

const BASE_URL = 'https://edu-net.me';

interface RouteMeta {
  title: string;
  description: string;
}

const routeMeta: Record<string, RouteMeta | ((params: string[]) => RouteMeta)> = {
  '/': {
    title: 'EduNet | منصة تعليمية ذكية لتخصص الحوسبة',
    description:
      'منصة EduNet التعليمية الذكية: إدارة تعلم متكاملة للحوسبة، تشمل امتحانات، البجروت، المشاريع، الألعاب التعليمية، والمتابعة الأكاديمية للصفوف الثانوية.',
  },
  '/auth': {
    title: 'تسجيل الدخول | EduNet',
    description: 'تسجيل الدخول إلى منصة EduNet التعليمية الذكية.',
  },
  '/super-admin-auth': {
    title: 'دخول المشرف العام | EduNet',
    description: 'بوابة الدخول الخاصة بالمشرف العام في منصة EduNet.',
  },
  '/reset-password': {
    title: 'إعادة تعيين كلمة المرور | EduNet',
    description: 'إعادة تعيين كلمة المرور لحسابك في منصة EduNet.',
  },
  '/dashboard': {
    title: 'لوحة التحكم | EduNet',
    description: 'لوحة التحكم الشخصية في منصة EduNet: متابعة التقدم، الامتحانات، والإشعارات.',
  },
  '/school-management': {
    title: 'إدارة المدارس | EduNet',
    description: 'إدارة المدارس والمؤسسات التعليمية في منصة EduNet.',
  },
  '/school-admin-management': {
    title: 'إدارة مسؤولي المدارس | EduNet',
    description: 'إدارة حسابات مسؤولي المدارس وصلاحياتهم في EduNet.',
  },
  '/school-classes': {
    title: 'الصفوف الدراسية | EduNet',
    description: 'إدارة الصفوف الدراسية والشعب في منصة EduNet.',
  },
  '/educational-content': {
    title: 'المحتوى التعليمي | EduNet',
    description: 'استعراض المحتوى التعليمي التفاعلي للصفوف العاشر، الحادي عشر، والثاني عشر في EduNet.',
  },
  '/content-management': {
    title: 'إدارة المحتوى | EduNet',
    description: 'إدارة الدروس، المواضيع، والمواد التعليمية في منصة EduNet.',
  },
  '/grade10-management': {
    title: 'إدارة الصف العاشر | EduNet',
    description: 'إدارة محتوى وامتحانات ومشاريع الصف العاشر في EduNet.',
  },
  '/grade11-management': {
    title: 'إدارة الصف الحادي عشر | EduNet',
    description: 'إدارة محتوى وامتحانات ومشاريع الصف الحادي عشر في EduNet.',
  },
  '/grade12-management': {
    title: 'إدارة الصف الثاني عشر | EduNet',
    description: 'إدارة محتوى وامتحانات ومشاريع الصف الثاني عشر في EduNet.',
  },
  '/students': {
    title: 'إدارة الطلاب | EduNet',
    description: 'إدارة بيانات الطلاب وتسجيلهم في الصفوف والشعب في EduNet.',
  },
  '/student-management': {
    title: 'إدارة الطلاب | EduNet',
    description: 'إدارة بيانات الطلاب وتسجيلهم في الصفوف والشعب في EduNet.',
  },
  '/exam-bank-management': {
    title: 'بنك الأسئلة | EduNet',
    description: 'إدارة بنك الأسئلة والاختبارات في منصة EduNet.',
  },
  '/bagrut-management': {
    title: 'إدارة امتحانات البجروت | EduNet',
    description: 'إدارة امتحانات البجروت للصفوف الثانوية في منصة EduNet.',
  },
  '/teacher/bagrut-exams': {
    title: 'امتحانات البجروت للمعلم | EduNet',
    description: 'إدارة ونشر امتحانات البجروت للطلاب من قبل المعلم في EduNet.',
  },
  '/teacher/student-tracking': {
    title: 'تتبع الطلاب | EduNet',
    description: 'متابعة تقدم الطلاب وتحليل أدائهم في EduNet.',
  },
  '/teacher/pdf-comparison': {
    title: 'مقارنة ملفات PDF | EduNet',
    description: 'أداة مقارنة ملفات PDF للمشاريع والامتحانات في EduNet.',
  },
  '/reports': {
    title: 'التقارير والإحصائيات | EduNet',
    description: 'تقارير وإحصائيات شاملة عن التقدم والأداء في EduNet.',
  },
  '/profile-settings': {
    title: 'إعدادات الملف الشخصي | EduNet',
    description: 'تعديل إعدادات الملف الشخصي والحساب في EduNet.',
  },
  '/knowledge-adventure': {
    title: 'مغامرة المعرفة | EduNet',
    description: 'لعبة مغامرة المعرفة التعليمية التفاعلية للصفوف الثانوية في EduNet.',
  },
  '/pdf-comparison': {
    title: 'مقارنة ملفات PDF | EduNet',
    description: 'أداة مقارنة ملفات PDF للمشاريع والامتحانات في EduNet.',
  },
  '/question-management': {
    title: 'إدارة الأسئلة التفاعلية | EduNet',
    description: 'إدارة الأسئلة التفاعلية والألعاب التعليمية في EduNet.',
  },
  '/pair-matching': {
    title: 'لعبة المطابقة | EduNet',
    description: 'لعبة مطابقة المصطلحات التعليمية التفاعلية في EduNet.',
  },
  '/test': {
    title: 'اختبار النظام | EduNet',
    description: 'صفحة اختبار النظام في منصة EduNet.',
  },
  '/tf-fix': {
    title: 'إصلاح أسئلة صح/خطأ | EduNet',
    description: 'أداة إصلاح وتحسين أسئلة صح/خطأ في بنك الأسئلة.',
  },
  '/badge-test': {
    title: 'اختبار الشارات | EduNet',
    description: 'صفحة اختبار نظام الشارات في EduNet.',
  },
};

function matchRoute(pathname: string): RouteMeta {
  // Direct match
  if (routeMeta[pathname]) {
    const meta = routeMeta[pathname];
    return typeof meta === 'function' ? meta([]) : meta;
  }

  // Match known prefixes (e.g., dynamic routes)
  for (const [route, meta] of Object.entries(routeMeta)) {
    if (route === '/') continue;
    if (pathname.startsWith(route + '/')) {
      return typeof meta === 'function' ? meta([]) : meta;
    }
  }

  return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION };
}

export function SeoHead() {
  const { pathname } = useLocation();
  const { title, description } = useMemo(() => matchRoute(pathname), [pathname]);
  const canonicalUrl = useMemo(() => `${BASE_URL}${pathname}`, [pathname]);

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
    </Helmet>
  );
}

export default SeoHead;
