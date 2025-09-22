import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, Network, Award, BookOpen, Video, FileText } from 'lucide-react';

const GradeContent: React.FC = () => {
  const grades = [
    {
      id: 'grade10',
      title: 'الصف العاشر',
      subtitle: 'أساسيات الحوسبة والشبكات',
      icon: Monitor,
      color: 'from-blue-500 to-blue-600',
      content: [
        'التعرف على نظام التشغيل Windows ومكوناته',
        'مقدمة شاملة عن الشبكات والاتصالات',
        'تعليمات مفصلة لبناء مشروع مصغر',
        'أساسيات البرمجة والتفكير المنطقي',
        'التعامل مع الملفات والمجلدات',
        'مبادئ الأمان والحماية الرقمية'
      ],
      features: [
        { icon: Video, text: 'فيديوهات تعليمية تفاعلية' },
        { icon: FileText, text: 'مواد نظرية شاملة' },
        { icon: BookOpen, text: 'تمارين عملية' }
      ]
    },
    {
      id: 'grade11',
      title: 'الصف الحادي عشر',
      subtitle: 'التحضير لامتحان البجروت',
      icon: Network,
      color: 'from-green-500 to-green-600',
      content: [
        'مادة الـ 70% المطلوبة لامتحان البجروت',
        'تحضير شامل ومنهجي للامتحانات النهائية',
        'شبكات الحاسوب المتقدمة والبروتوكولات',
        'برمجة المواقع وتطوير التطبيقات',
        'قواعد البيانات وإدارة المعلومات',
        'أمان المعلومات والحماية السيبرانية'
      ],
      features: [
        { icon: Video, text: 'محاضرات مسجلة عالية الجودة' },
        { icon: FileText, text: 'نماذج امتحانات سابقة' },
        { icon: BookOpen, text: 'ملخصات ومراجعات' }
      ]
    },
    {
      id: 'grade12',
      title: 'الصف الثاني عشر',
      subtitle: 'مشروع التخرج والتطبيق العملي',
      icon: Award,
      color: 'from-purple-500 to-purple-600',
      content: [
        'مهام مفصلة وفيديوهات مسجلة لتنفيذ مشروع التخرج',
        'فحص نسبة التشابه بين مشاريع الطلاب',
        'تطوير مشاريع متقدمة وحلول عملية',
        'إدارة المشاريع والعمل الجماعي',
        'عرض وتقديم المشاريع بطريقة احترافية',
        'التحضير لسوق العمل والجامعة'
      ],
      features: [
        { icon: Video, text: 'ورش عمل عملية' },
        { icon: FileText, text: 'قوالب ونماذج جاهزة' },
        { icon: BookOpen, text: 'متابعة شخصية للمشاريع' }
      ]
    }
  ];

  return (
    <section className="py-20 bg-white" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            المحتوى التعليمي
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            منهج شامل ومتكامل لتخصص الحوسبة والشبكات مطابق تماماً لتعليمات وزارة التربية والتعليم
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {grades.map((grade) => (
            <Card 
              key={grade.id}
              className="relative overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-500 group"
            >
              {/* خلفية متدرجة */}
              <div className={`absolute inset-0 bg-gradient-to-br ${grade.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
              
              <CardHeader className="relative text-center pb-6">
                <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${grade.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <grade.icon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-800 mb-2">
                  {grade.title}
                </CardTitle>
                <p className="text-sm text-gray-600 font-medium">
                  {grade.subtitle}
                </p>
              </CardHeader>

              <CardContent className="relative space-y-6">
                {/* المحتوى الأساسي */}
                <div className="space-y-3">
                  {grade.content.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                {/* الميزات */}
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold text-gray-800 text-sm">الميزات المتاحة:</h4>
                  {grade.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <feature.icon className="h-4 w-4 text-primary" />
                      <span className="text-xs text-gray-600">{feature.text}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ملاحظة مهمة */}
        <div className="mt-12 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            📚 محتوى معتمد ومطابق للمعايير
          </h3>
          <p className="text-gray-700 leading-relaxed max-w-2xl mx-auto">
            جميع المواد التعليمية مطابقة تماماً لتعليمات وزارة التربية والتعليم 
            ومصممة لضمان النجاح في الامتحانات والتميز في التطبيق العملي
          </p>
        </div>
      </div>
    </section>
  );
};

export default GradeContent;