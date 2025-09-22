import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, BookOpen, GraduationCap, Users } from 'lucide-react';
import ImageSlider from './ImageSlider';

const FeatureSection: React.FC = () => {
  const features = [
    {
      id: 'teachers',
      title: 'للمعلمين',
      icon: BookOpen,
      description: 'أدوات متقدمة لإدارة الصفوف والتقييم',
      benefits: [
        'مواد تعليمية جاهزة وفق المنهاج الرسمي',
        'أوراق عمل وامتحانات قابلة للتخصيص',
        'تصحيح تلقائي يوفر الوقت والجهد',
        'لوحة تحكم شاملة لمتابعة تقدم الطلاب',
        'تقارير مفصلة عن الأداء والتحصيل',
        'نظام إشعارات للتواصل مع الأهل'
      ],
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      id: 'students',
      title: 'للطلاب',
      icon: GraduationCap,
      description: 'تجربة تعليمية تفاعلية وممتعة',
      benefits: [
        'تعلم تفاعلي من أي مكان وأي وقت',
        'ألعاب تعليمية تجعل التعلم ممتعاً',
        'فيديوهات تعليمية لبرنامج Packet Tracer',
        'حفظ آمن للمشاريع والواجبات',
        'تتبع التقدم الشخصي والنتائج',
        'نظام أفاتار وتحديات شخصية'
      ],
      gradient: 'from-green-500 to-green-600'
    },
    {
      id: 'admin',
      title: 'للإدارة المدرسية',
      icon: Users,
      description: 'إدارة شاملة وتقارير متقدمة',
      benefits: [
        'رفع مستوى التحصيل الأكاديمي',
        'تواصل فعال مع الأهل والمعلمين',
        'تقارير شاملة عن أداء المدرسة',
        'مراقبة شاملة لتقدم جميع الطلاب',
        'إحصائيات متقدمة وتحليل البيانات',
        'نظام إدارة المعلمين والصفوف'
      ],
      gradient: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <section className="py-20 bg-gray-50" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            لماذا تختار منصتنا؟
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            نوفر حلول شاملة ومتكاملة للمعلمين والطلاب والإدارة المدرسية
            لتحقيق أفضل النتائج التعليمية
          </p>
        </div>

        <div className="space-y-16">
          {features.map((feature, index) => (
            <div 
              key={feature.id}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''
              }`}
            >
              {/* المحتوى النصي */}
              <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
                <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="text-center pb-6">
                    <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-800">
                      {feature.title}
                    </CardTitle>
                    <p className="text-gray-600 mt-2">{feature.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <div 
                          key={benefitIndex}
                          className="flex items-start gap-3"
                        >
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 text-sm leading-relaxed">
                            {benefit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* السلايدر */}
              <div className={index % 2 === 1 ? 'lg:col-start-1' : ''}>
                <ImageSlider section={feature.id as 'teachers' | 'students' | 'admin'} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;