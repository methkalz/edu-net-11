import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, CheckCircle, Star, Gamepad2, Users, Monitor, BookOpen, Gift, Heart, Clock, Phone } from 'lucide-react';
import TypewriterEffect from '@/components/TypewriterEffect';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import WhatsAppButton from '@/components/landing/WhatsAppButton';
import TeacherFeaturesSlider from '@/components/landing/TeacherFeaturesSlider';
import StudentFeaturesSlider from '@/components/landing/StudentFeaturesSlider';
import AdminFeaturesSlider from '@/components/landing/AdminFeaturesSlider';
import CountdownTimer from '@/components/ui/CountdownTimer';
import { useTrafficLightEffect } from '@/hooks/useTrafficLightEffect';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const activeBox = useTrafficLightEffect();

  // تاريخ انتهاء التجربة المجانية - 29 سبتمبر 2025 الساعة 17:00 توقيت القدس
  const freeTrialEndDate = new Date('2025-09-29T17:00:00+03:00'); // +03:00 is Jerusalem timezone (UTC+3)
  
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 80;
      const elementPosition = element.offsetTop - headerHeight;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };
  return <div className="min-h-screen bg-white flex flex-col" dir="rtl">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-b border-gray-100 z-50">
        <nav className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo-edunet.png" alt="شعار المنصة" className="h-8 w-auto md:h-10" />
              <div className="hidden sm:block">
                <h1 className="text-base md:text-lg font-semibold text-gray-900">التقنية ببساطة</h1>
                <p className="text-xs text-gray-500 hidden md:block">نظام تعليمي لتخصص الحوسبة</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-6">
                <button onClick={() => scrollToSection('features')} className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
                  الميزات
                </button>
                <button onClick={() => scrollToSection('content')} className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
                  المحتوى
                </button>
              </div>
              <Button onClick={() => navigate('/auth')} className="bg-gray-900 text-white hover:bg-gray-800 text-xs md:text-sm px-3 md:px-6 py-2 rounded-md transition-colors">
                ابدأ الآن
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {/* واتساب */}
      <WhatsAppButton />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center pt-16 md:pt-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              {/* الشعار والعنوان */}
              <div className="mb-12 md:mb-16">
                <img src="/logo-edunet.png" alt="شعار المنصة" className="h-20 md:h-28 w-auto mx-auto mb-8 md:mb-12 mt-4 md:mt-8" />
                <h1 className="text-2xl md:text-4xl lg:text-5xl text-gray-900 mb-4 md:mb-6 tracking-tight text-center font-normal px-2">نظام تعليمي وإداري ذكي لتخصص الحوسبة</h1>
                <div className="w-12 md:w-16 h-px bg-gray-300 mx-auto mb-8 md:mb-12"></div>
              </div>
              
              {/* العنوان المتحرك */}
              <div className="mb-12 md:mb-16">
                <h2 className="text-lg md:text-xl lg:text-2xl font-normal text-gray-700 mb-6 md:mb-8 leading-relaxed text-center px-4">
                  <TypewriterEffect texts={["ارتقِ بمستوى طلابك ووفر وقتك مع منصة تعليمية وإدارية شاملة وذكية", "صُممت خصيصًا لدعم المدارس والمعلمين والطلاب والإدارة", "يعمل على تحسين معدل نجاح الطلاب في امتحانات البجروت"]} typeSpeed={60} deleteSpeed={30} pauseDuration={3500} />
                </h2>
              </div>
              
              
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto mb-12 md:mb-16 mt-16 md:mt-24 px-2">
                <div className={`relative pt-10 md:pt-12 pb-4 md:pb-6 px-3 md:px-6 rounded-xl md:rounded-2xl text-center border transition-all duration-500 ${
                  activeBox === 0 
                    ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-2xl scale-105' 
                    : 'bg-gradient-to-br from-blue-25 to-blue-50 border-blue-100 opacity-60 shadow-sm'
                }`}>
                  <div className={`absolute -top-6 md:-top-8 left-1/2 transform -translate-x-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 ${
                    activeBox === 0 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                      : 'bg-gradient-to-br from-blue-300 to-blue-400'
                  }`}>
                    <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium text-sm md:text-base">مواد تعليمية جاهزة</span>
                </div>
                <div className={`relative pt-10 md:pt-12 pb-4 md:pb-6 px-3 md:px-6 rounded-xl md:rounded-2xl text-center border transition-all duration-500 ${
                  activeBox === 1 
                    ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-2xl scale-105' 
                    : 'bg-gradient-to-br from-green-25 to-green-50 border-green-100 opacity-60 shadow-sm'
                }`}>
                  <div className={`absolute -top-6 md:-top-8 left-1/2 transform -translate-x-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 ${
                    activeBox === 1 
                      ? 'bg-gradient-to-br from-green-500 to-green-600' 
                      : 'bg-gradient-to-br from-green-300 to-green-400'
                  }`}>
                    <Monitor className="h-6 w-6 md:h-8 md:w-8 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium text-sm md:text-base">بنك امتحانات بجروت</span>
                </div>
                <div className={`relative pt-10 md:pt-12 pb-4 md:pb-6 px-3 md:px-6 rounded-xl md:rounded-2xl text-center border transition-all duration-500 ${
                  activeBox === 2 
                    ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-2xl scale-105' 
                    : 'bg-gradient-to-br from-purple-25 to-purple-50 border-purple-100 opacity-60 shadow-sm'
                }`}>
                  <div className={`absolute -top-6 md:-top-8 left-1/2 transform -translate-x-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 ${
                    activeBox === 2 
                      ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
                      : 'bg-gradient-to-br from-purple-300 to-purple-400'
                  }`}>
                    <Gamepad2 className="h-6 w-6 md:h-8 md:w-8 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium text-sm md:text-base">ألعاب تعليمية محفزة</span>
                </div>
                <div className={`relative pt-10 md:pt-12 pb-4 md:pb-6 px-3 md:px-6 rounded-xl md:rounded-2xl text-center border transition-all duration-500 ${
                  activeBox === 3 
                    ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-2xl scale-105' 
                    : 'bg-gradient-to-br from-orange-25 to-orange-50 border-orange-100 opacity-60 shadow-sm'
                }`}>
                  <div className={`absolute -top-6 md:-top-8 left-1/2 transform -translate-x-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 ${
                    activeBox === 3 
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600' 
                      : 'bg-gradient-to-br from-orange-300 to-orange-400'
                  }`}>
                    <Users className="h-6 w-6 md:h-8 md:w-8 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium text-sm md:text-base">تقارير تفصيلية فورية</span>
                </div>
              </div>
              
              {/* الإحصائيات */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-3xl mx-auto mb-12 md:mb-16 text-center px-4">
                {[{
                number: 500,
                suffix: '+',
                label: 'مواد تفاعلية',
                duration: 3000
              }, {
                number: 50,
                suffix: '+',
                label: 'معلم متميز',
                duration: 2500
              }, {
                number: 25,
                suffix: '+',
                label: 'مدرسة شريكة',
                duration: 3200
              }, {
                number: 98,
                suffix: '%',
                label: 'نسبة الرضا',
                duration: 4000
                }].map((stat, index) => <div key={index} className="text-center">
                    <div className="text-xl md:text-2xl lg:text-3xl font-light text-gray-900 mb-1 md:mb-2">
                      <AnimatedCounter end={stat.number} duration={stat.duration} suffix={stat.suffix} />
                    </div>
                    <div className="text-gray-600 text-xs md:text-sm">{stat.label}</div>
                  </div>)}
              </div>

              {/* أزرار العمل */}
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center mb-16 md:mb-20 px-4">
                <Button size="lg" onClick={() => window.open('https://api.whatsapp.com/send/?phone=972528359103&text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C+%D8%A3%D8%B1%D8%BA%D8%A8+%D9%81%D9%8A+%D9%85%D8%B9%D8%B1%D9%81%D8%A9+%D8%A7%D9%84%D9%85%D8%B2%D9%8A%D8%AF+%D8%B9%D9%86+%D9%85%D9%86%D8%B5%D8%A9+%D8%A7%D9%84%D8%AA%D9%82%D9%86%D9%8A%D8%A9+%D8%A8%D8%A8%D8%B3%D8%A7%D8%B7%D8%A9+%D9%84%D9%84%D8%AA%D8%B9%D9%84%D9%8A%D9%85+%D8%A7%D9%84%D8%A5%D9%84%D9%83%D8%AA%D8%B1%D9%88%D9%86%D9%8A&type=phone_number&app_absent=0', '_blank')} className="bg-green-600 hover:bg-green-700 text-white px-6 md:px-8 py-3 rounded-md transition-colors font-medium w-full sm:w-auto text-sm md:text-base">
                  اطلب الآن
                  <ArrowRight className="mr-2 h-4 w-4 animate-wiggle" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => scrollToSection('features')} className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 md:px-8 py-3 rounded-md transition-colors font-medium w-full sm:w-auto text-sm md:text-base">
                  تعرف على الميزات
                </Button>
              </div>

            </div>
          </div>
        </section>

        {/* ميزات للمعلم */}
        <section id="features" className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-900 mb-4 md:mb-6 text-center">
                ميزات للمعلم
              </h2>
              <div className="w-10 md:w-12 h-px bg-gray-300 mx-auto mb-6 md:mb-8"></div>
              <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto text-center px-4">
                أدوات متطورة لإدارة التعليم والمتابعة الفعالة
              </p>
            </div>
            <TeacherFeaturesSlider />
          </div>
        </section>

        {/* ميزات للطالب */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-900 mb-4 md:mb-6 text-center">
                ميزات للطالب
              </h2>
              <div className="w-10 md:w-12 h-px bg-gray-300 mx-auto mb-6 md:mb-8"></div>
              <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto text-center px-4">
                تعلم تفاعلي وممتع يحفز على الإنجاز والتقدم
              </p>
            </div>
            <StudentFeaturesSlider />
          </div>
        </section>

        {/* ميزات للإدارة */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-900 mb-4 md:mb-6 text-center">
                ميزات للإدارة
              </h2>
              <div className="w-10 md:w-12 h-px bg-gray-300 mx-auto mb-6 md:mb-8"></div>
              <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto text-center px-4">
                متابعة شاملة وتحليل دقيق لتحسين الأداء التعليمي
              </p>
            </div>
            <AdminFeaturesSlider />
          </div>
        </section>

        {/* المحتوى حسب الصفوف */}
        <section id="content" className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 md:mb-20">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-900 mb-4 md:mb-6 text-center">
                المحتوى حسب الصفوف
              </h2>
              <div className="w-10 md:w-12 h-px bg-gray-300 mx-auto mb-6 md:mb-8"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
              {[{
              grade: 'الصف العاشر',
              description: 'التعرف على نظام ويندوز، مقدمة في الشبكات، ومشاريع مصغرة مع فيديوهات',
              avatar: '/avatars/student-boy-1.png',
              gradeIcon: '🎯',
              gradeNumber: '10',
              bgColor: 'from-blue-50 to-blue-100',
              borderColor: 'border-blue-200',
              features: ['مشاريع مصغرة', 'ألعاب تفاعلية', 'دروس شيقة', 'رسوم متحركة']
            }, {
              grade: 'الصف الحادي عشر',
              description: 'المادة المطلوبة (70%) لامتحان البجروت',
              avatar: '/avatars/student-girl-1.png',
              gradeIcon: '📚',
              gradeNumber: '11',
              bgColor: 'from-green-50 to-green-100',
              borderColor: 'border-green-200',
              features: ['محتوى البجروت', 'دروس متقدمة', 'ألعاب تحفيزية', 'امتحانات تفاعلية']
            }, {
              grade: 'الصف الثاني عشر',
              description: 'مهام قصيرة وفيديوهات عملية لتنفيذ مشروع التخرج، مع فحص نسبة التشابه',
              avatar: '/avatars/student-creative.png',
              gradeIcon: '🎓',
              gradeNumber: '12',
              bgColor: 'from-purple-50 to-purple-100',
              borderColor: 'border-purple-200',
              features: ['مشروع التخرج', 'فيديوهات عملية', 'Packet Tracer', 'فحص التشابه']
            }].map((item, index) => <div key={index} className={`relative bg-gradient-to-br ${item.bgColor} p-6 md:p-8 border ${item.borderColor} rounded-2xl md:rounded-3xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden group`}>
                  {/* Decorative background elements */}
                  <div className="absolute top-0 right-0 w-16 h-16 md:w-20 md:h-20 bg-white/20 rounded-full -translate-y-8 md:-translate-y-10 translate-x-8 md:translate-x-10"></div>
                  <div className="absolute bottom-0 left-0 w-12 h-12 md:w-16 md:h-16 bg-white/30 rounded-full translate-y-6 md:translate-y-8 -translate-x-6 md:-translate-x-8"></div>
                  
                  {/* Avatar section */}
                  <div className="relative text-center mb-4 md:mb-6">
                    <div className="inline-block relative">
                      <img src={item.avatar} alt={item.grade} className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover shadow-lg border-4 border-white mx-auto group-hover:scale-110 transition-transform duration-300" />
                      
                      {/* Grade icon overlay with floating animation */}
                      <div className="absolute -top-1 md:-top-2 -right-1 md:-right-2 w-6 h-6 md:w-8 md:h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-sm md:text-lg border-2 border-gray-100 animate-bounce" style={{
                    animationDuration: '3s'
                  }}>
                        {item.gradeIcon}
                      </div>
                      
                      {/* Grade number badge with subtle float */}
                      <div className="absolute -bottom-1 md:-bottom-2 -left-1 md:-left-2 w-6 h-6 md:w-7 md:h-7 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full flex items-center justify-center text-white text-xs md:text-sm font-bold shadow-lg animate-pulse" style={{
                    animationDuration: '4s'
                  }}>
                        {item.gradeNumber}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4 text-center">{item.grade}</h3>
                  <p className="text-gray-600 text-xs md:text-sm mb-4 md:mb-6 leading-relaxed text-center">{item.description}</p>
                  
                  <ul className="space-y-2 md:space-y-3">
                    {item.features.map((feature, idx) => <li key={idx} className="flex items-center text-gray-700 text-xs md:text-sm">
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gradient-to-r from-current to-current rounded-full ml-2 flex-shrink-0 opacity-60"></div>
                        <span className="font-medium">{feature}</span>
                      </li>)}
                  </ul>
                </div>)}
            </div>
          </div>
        </section>
      </main>

        {/* عرض خاص للمدارس */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-900 mb-8 md:mb-12">
                عرض خاص للمدارس
              </h2>
              
              {/* العداد التنازلي */}
              <CountdownTimer targetDate={freeTrialEndDate} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12 text-center">
                <div className="bg-white p-6 md:p-8 rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                    <Gift className="h-6 w-6 md:h-8 md:w-8 text-white" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4 text-center">تجربة مجانية</h3>
                  <p className="text-gray-600 leading-relaxed text-sm md:text-base">تجربة مجانية لمدة أسبوعين كاملين مع إمكانية الوصول لجميع الميزات</p>
                </div>
                <div className="bg-white p-6 md:p-8 rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                    <Heart className="h-6 w-6 md:h-8 md:w-8 text-white" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4 text-center">دعم גפ"ן</h3>
                  <p className="text-gray-600 leading-relaxed">فرصة الحصول على النظام مع دعم منظومة גפ"ן المالي</p>
                </div>
              </div>
              
              <div className="bg-white p-10 rounded-2xl shadow-xl mb-8 border border-gray-100">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Phone className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">للتواصل والاستفسار</h3>
                <p className="text-xl text-gray-700 mb-8 font-medium text-center">يونس عمارنة: 0528359103</p>
                <Button 
                  size="lg" 
                  onClick={() => window.open('https://api.whatsapp.com/send/?phone=972528359103&text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C+%D8%A3%D8%B1%D8%BA%D8%A8+%D9%81%D9%8A+%D9%85%D8%B9%D8%B1%D9%81%D8%A9+%D8%A7%D9%84%D9%85%D8%B2%D9%8A%D8%AF+%D8%B9%D9%86+%D9%85%D9%86%D8%B5%D8%A9+%D8%A7%D9%84%D8%AA%D9%82%D9%86%D9%8A%D8%A9+%D8%A8%D8%A8%D8%B3%D8%A7%D8%B7%D8%A9+%D9%84%D9%84%D8%AA%D8%B9%D9%84%D9%8A%D9%85+%D8%A7%D9%84%D8%A5%D9%84%D9%83%D8%AA%D8%B1%D9%88%D9%86%D9%8A&type=phone_number&app_absent=0', '_blank')} 
                  className="bg-green-600 hover:bg-green-700 text-white px-12 py-4 rounded-2xl transition-all duration-300 font-medium text-lg w-full max-w-xs mx-auto block shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2 group"
                >
                  اطلب الآن
                  <ArrowRight className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-2 animate-[wiggle_2s_ease-in-out_infinite]" />
                </Button>
              </div>
            </div>
          </div>
        </section>
    </div>;
};
export default LandingPage;