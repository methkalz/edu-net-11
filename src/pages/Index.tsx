/**
 * Landing Page Component (Index)
 * 
 * The main entry point and marketing page for the educational platform.
 * Features a modern design with animated elements, interactive sections,
 * and responsive layout optimized for Arabic content (RTL).
 * 
 * Features:
 * - Hero section with typewriter effect and animated backgrounds
 * - Educational materials showcase (Grade 10, 11, 12)
 * - Benefits section for different user types (teacher, student, school)
 * - Interactive features highlight with floating animations
 * - Call-to-action sections with conditional rendering based on auth state
 * - Smooth scrolling navigation between sections
 * - Floating light orbs and ambient animations
 * - Responsive design with mobile-first approach
 * 
 * SEO Optimized:
 * - Semantic HTML structure
 * - Proper heading hierarchy
 * - Meta description ready content
 * - Arabic language support (RTL)
 * 
 * @author Educational Platform Team
 * @version 1.0.0
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Monitor, Network, Award, BookOpen, Users, GraduationCap, Gamepad2, Play, ArrowRight, CheckCircle } from 'lucide-react';
import TypewriterEffect from '@/components/TypewriterEffect';
import { PageLoading } from '@/components/ui/LoadingComponents';
/**
 * Index Component Implementation
 * 
 * Main landing page component with authentication state management
 * and smooth navigation functionality.
 */
const Index = () => {
  // Authentication state and navigation hooks
  const {
    user,     // Current authenticated user (null if not logged in)
    loading   // Loading state during authentication check
  } = useAuth();
  const navigate = useNavigate();
  
  // Show loading spinner during authentication verification
  if (loading) {
    return <PageLoading message="Loading..." />;
  }
  /**
   * Smooth Scroll Navigation Helper
   * 
   * Scrolls to specific sections on the page with offset compensation
   * for the fixed header. Provides smooth scrolling animation.
   * 
   * @param sectionId - The DOM ID of the target section
   */
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 80; // Fixed header height compensation
      const elementPosition = element.offsetTop - headerHeight;
      
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };
  return (
    <div className="min-h-screen bg-white creative-background flex flex-col" dir="rtl">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-gray-200/50 z-50">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/lovable-uploads/f942a38c-ddca-45fc-82fc-239e22268abe.png" alt="شعار الموقع" className="h-10 w-auto" />
              <span className="text-xl font-semibold font-cairo text-gray-600">التقنية ببساطة</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('materials')} className="text-gray-600 hover:text-primary transition-colors">
                المواد التعليمية
              </button>
              <button onClick={() => scrollToSection('benefits')} className="text-gray-600 hover:text-primary transition-colors">
                لماذا منصتنا؟
              </button>
              <button onClick={() => scrollToSection('features')} className="text-gray-600 hover:text-primary transition-colors">
                ميزات تفاعلية
              </button>
              <Button onClick={() => scrollToSection('cta')} className="gradient-blue text-white hover:scale-105 transition-all duration-300">
                ابدأ الآن
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Floating Light Orbs */}
        <div className="light-orbs">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
          <div className="orb orb-4"></div>
          <div className="orb orb-5"></div>
          <div className="orb orb-6"></div>
          <div className="orb orb-7"></div>
        </div>

        <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
          {/* Subtle Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-white/40"></div>

          {/* Ambient Light Elements */}
          <div className="absolute top-20 right-20 w-40 h-40 bg-gradient-to-br from-primary/10 to-secondary/5 rounded-full blur-3xl float-animation"></div>
          <div className="absolute bottom-32 left-16 w-32 h-32 bg-gradient-to-tr from-secondary/8 to-primary/3 rounded-full blur-2xl float-animation" style={{
          animationDelay: '2s'
        }}></div>
          <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-bl from-primary/6 to-secondary/3 rounded-full blur-xl float-animation" style={{
          animationDelay: '4s'
        }}></div>
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center fade-in-up -mt-[80px]">
              {/* Logo/Brand */}
              <div className="mb-8">
                <div className="flex items-center justify-center mb-6">
                  <img src="/lovable-uploads/f942a38c-ddca-45fc-82fc-239e22268abe.png" alt="شعار الموقع" className="h-20 md:h-24 w-auto" />
                </div>
                <h1 className="text-5xl md:text-7xl font-bold font-cairo mb-4">
                  
                  
                </h1>
                <div className="w-20 h-1 gradient-blue mx-auto rounded-full"></div>
              </div>
              
              {/* Main Headline */}
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-600 mb-6 leading-relaxed min-h-[2.5rem] md:min-h-[3rem] text-center">
                <TypewriterEffect texts={["نظام تعليمي وإداري شامل لتخصص الحوسبة", "نتعلّم ونعرف المزيد والمزيد بكل شغف", "نحصل على أفضل تجربة وأعلى نتائج"]} typeSpeed={80} deleteSpeed={40} pauseDuration={3000} />
              </h2>
              
              <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed text-center">
                يشمل مواد، امتحانات، متابعة، وتغذية راجعة فورية
                <br />
                <span className="text-primary font-semibold">مطابق لتعليمات وزارة التربية</span>
              </p>
              
              {/* CTA Buttons */}
              <div className="flex gap-4 justify-center flex-wrap mb-16">
                {user ? (
                  <Button size="lg" className="gradient-blue hover:gradient-orange text-white hover:scale-105 transition-all duration-300 text-lg px-8 py-4 rounded-xl shadow-lg" onClick={() => navigate('/dashboard')}>
                    الذهاب إلى لوحة التحكم
                    <ArrowRight className="mr-2 h-5 w-5" />
                  </Button>
                ) : (
                  <>
                    <Button size="lg" className="gradient-blue hover:gradient-orange text-white hover:scale-105 transition-all duration-300 text-lg px-8 py-4 rounded-xl shadow-lg" onClick={() => navigate('/auth')}>
                      تسجيل الدخول
                      <ArrowRight className="mr-2 h-5 w-5" />
                    </Button>
                    <Button size="lg" variant="outline" className="border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300 text-lg px-8 py-4 rounded-xl" onClick={() => navigate('/auth')}>
                      ابدأ الآن
                    </Button>
                  </>
                )}
              </div>

              {/* Key Features Preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
                {[{
                icon: CheckCircle,
                text: "مطابق لوزارة التربية",
                color: "text-green-600"
              }, {
                icon: CheckCircle,
                text: "تفاعلي ومرح",
                color: "text-blue-600"
              }, {
                icon: CheckCircle,
                text: "تقارير شاملة",
                color: "text-orange-600"
              }].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 justify-center">
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                  <span className="text-gray-700 font-medium">{feature.text}</span>
                </div>
              ))}
              </div>
            </div>
          </div>
        </section>

        {/* Educational Content Section */}
        <section id="materials" className="py-20 bg-muted/40 relative z-10 -mt-[150px]">
          <div className="container mx-auto px-6 relative z-10 text-center">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold font-cairo text-gray-800 mb-4 text-center">المواد التعليمية</h2>
              <div className="w-16 h-1 gradient-blue mx-auto rounded-full mb-6"></div>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto text-center">
                منهج شامل لتخصص الحوسبة مطابق لتعليمات وزارة التربية والتعليم
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[{
              title: "الصف العاشر",
              icon: Monitor,
              items: ["التعرف على نظام التشغيل الويندوز", "مقدمة عن الشبكات", "تعليمات لبناء مشروع مصغر"],
              gradient: "gradient-blue"
            }, {
              title: "الصف الحادي عشر",
              icon: Network,
              items: ["مادة الـ 70% المطلوبة لامتحان البجروت", "تحضير شامل ومنهجي للامتحانات النهائية"],
              gradient: "gradient-orange"
            }, {
              title: "الصف الثاني عشر",
              icon: Award,
              items: ["مهام وفيديوهات مسجلة لتنفيذ مشروع التخرج", "فحص نسبة التشابه بين مشاريع الطلاب"],
              gradient: "gradient-blue"
            }].map((grade, index) => (
              <Card key={grade.title} className="modern-card group relative z-20">
                <CardHeader className="text-center pb-4 relative z-20">
                  <div className={`w-16 h-16 mx-auto mb-4 ${grade.gradient} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 relative z-20`}>
                    <grade.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-cairo text-gray-800 relative z-20 text-center">{grade.title}</CardTitle>
                </CardHeader>
                <CardContent className="relative z-20">
                  <ul className="space-y-3">
                    {grade.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="py-20 bg-white relative z-10">
          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold font-cairo text-gray-800 mb-4 text-center">لماذا تختار منصتنا؟</h2>
              <div className="w-16 h-1 gradient-orange mx-auto rounded-full mb-6"></div>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto text-center">
                نوفر حلول شاملة للمعلمين والطلاب والمدارس
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[{
              title: "للمعلم",
              icon: BookOpen,
              benefits: ["مواد تعليمية وفق المنهاج الرسمي", "أوراق عمل وامتحانات جاهزة", "تصحيح تلقائي يوفر الوقت", "لوحة تحكم شاملة للمتابعة"],
              gradient: "gradient-blue"
            }, {
              title: "للطالب",
              icon: GraduationCap,
              benefits: ["تعلم تفاعلي من أي مكان", "ألعاب تعليمية ممتعة", "فيديوهات Packet Tracer", "حفظ آمن للمشاريع"],
              gradient: "gradient-orange"
            }, {
              title: "للمدرسة",
              icon: Users,
              benefits: ["رفع مستوى التحصيل", "تواصل فعال مع الأهل", "تقارير مفصلة", "مراقبة شاملة للتقدم"],
              gradient: "gradient-blue"
            }].map((benefit, index) => (
              <Card key={benefit.title} className="modern-card group text-center">
                <CardHeader className="pb-4">
                  <div className={`w-16 h-16 mx-auto mb-4 ${benefit.gradient} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <benefit.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-cairo text-gray-800 text-center">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {benefit.benefits.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
            </div>
          </div>
        </section>

        {/* Interactive Features */}
        <section id="features" className="py-20 bg-muted/40 relative overflow-hidden z-10">
          {/* Floating Feature Icons */}
          <div className="feature-icons">
            <div className="feature-icon feature-icon-1">
              <Gamepad2 size={48} className="text-primary" />
            </div>
            <div className="feature-icon feature-icon-2">
              <Play size={56} className="text-primary" />
            </div>
            <div className="feature-icon feature-icon-3">
              <Users size={40} className="text-primary" />
            </div>
            <div className="feature-icon feature-icon-4">
              <CheckCircle size={52} className="text-primary" />
            </div>
            <div className="feature-icon feature-icon-5">
              <Gamepad2 size={44} className="text-primary" />
            </div>
            <div className="feature-icon feature-icon-6">
              <Play size={60} className="text-primary" />
            </div>
          </div>
          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center mb-16 relative z-20">
              <h2 className="text-4xl font-bold font-cairo text-gray-800 mb-4 text-center">ميزات تفاعلية</h2>
              <div className="w-16 h-1 gradient-blue mx-auto rounded-full mb-6"></div>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto text-center">
                تقنيات حديثة تجعل التعليم أكثر متعة وفعالية
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto relative z-20">
              {[{
              title: "ألعاب تفاعلية",
              icon: Gamepad2,
              gradient: "gradient-blue"
            }, {
              title: "فيديوهات تعليمية",
              icon: Play,
              gradient: "gradient-orange"
            }, {
              title: "نظام أفاتار",
              icon: Users,
              gradient: "gradient-blue"
            }, {
              title: "تصحيح ذكي",
              icon: CheckCircle,
              gradient: "gradient-orange"
            }].map((feature, index) => (
              <div key={feature.title} className="text-center group relative z-30">
                <div className={`w-12 h-12 mx-auto mb-3 ${feature.gradient} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 relative z-30`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800 relative z-30 text-center">{feature.title}</h3>
              </div>
            ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section id="cta" className="py-20 bg-white relative z-10">
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl font-bold font-cairo text-gray-800 mb-6 text-center">
                ابدأ رحلتك التعليمية الآن
              </h2>
              <div className="w-20 h-1 gradient-blue mx-auto rounded-full mb-6"></div>
              <p className="text-xl text-gray-600 mb-8 text-center">
                انضم إلى آلاف المدارس والمعلمين الذين يستخدمون منصتنا
              </p>
              {user ? (
                <Button size="lg" onClick={() => navigate('/dashboard')} className="gradient-blue text-white hover:scale-105 transition-all duration-300 text-xl px-12 py-6 rounded-2xl shadow-lg">
                  الذهاب إلى لوحة التحكم
                  <ArrowRight className="mr-2 h-6 w-6" />
                </Button>
              ) : (
                <Button size="lg" onClick={() => navigate('/auth')} className="gradient-blue text-white hover:scale-105 transition-all duration-300 text-xl px-12 py-6 rounded-2xl shadow-lg">
                  ابدأ مجاناً الآن
                  <ArrowRight className="mr-2 h-6 w-6" />
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center">
            <h3 className="text-2xl font-bold font-cairo text-gradient-blue mb-4 text-center">
              التقنية ببساطة
            </h3>
            <p className="text-gray-600 mb-6 text-center">
              نظام تعليمي وإداري شامل لتخصص الحوسبة - مطابق لتعليمات وزارة التربية
            </p>
            <div className="w-16 h-1 gradient-blue mx-auto rounded-full mb-6"></div>
            <p className="text-sm text-gray-500 text-center">
              &copy; 2024 التقنية ببساطة. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default Index;