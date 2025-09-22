import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Clock, Gift, Star } from 'lucide-react';

const SpecialOffer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 7,
    hours: 12,
    minutes: 30,
    seconds: 45
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const offers = [
    {
      title: 'تجربة المدرسة الكاملة',
      price: 'مجاني',
      duration: '30 يوم',
      features: [
        'جميع المواد التعليمية للصفوف 10-12',
        'إدارة شاملة لـ 500 طالب',
        'لوحات تحكم متقدمة للمعلمين',
        'تقارير وإحصائيات مفصلة',
        'دعم فني على مدار الساعة',
        'تدريب مجاني للمعلمين',
        'جميع الألعاب التفاعلية',
        'مكتبة الفيديوهات كاملة'
      ],
      badge: 'الأكثر شعبية',
      color: 'from-blue-600 to-purple-600'
    },
    {
      title: 'تجربة المعلم المتميز',
      price: 'مجاني',
      duration: '30 يوم',
      features: [
        'محتوى تعليمي كامل لجميع الصفوف',
        'إدارة غير محدودة للطلاب',
        'أدوات التصحيح التلقائي',
        'مكتبة الألعاب التفاعلية',
        'فيديوهات تعليمية حصرية',
        'تقارير أداء الطلاب',
        'أدوات إنشاء الامتحانات',
        'نظام المشاريع التفاعلية'
      ],
      badge: 'قيمة ممتازة',
      color: 'from-green-500 to-teal-600'
    },
    {
      title: 'تجربة الطالب الذكي',
      price: 'مجاني',
      duration: '30 يوم',
      features: [
        'الوصول لجميع المواد التعليمية',
        'ألعاب تفاعلية ممتعة',
        'فيديوهات Packet Tracer',
        'حفظ آمن للمشاريع',
        'تتبع التقدم الشخصي',
        'شهادات إنجاز',
        'نظام الأفاتار الشخصي',
        'مسابقات وتحديات يومية'
      ],
      badge: 'للطلاب',
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white relative overflow-hidden" dir="rtl">
      {/* خلفية متحركة */}
      <div className="absolute inset-0">
        <div className="absolute top-10 right-10 w-32 h-32 bg-white/5 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 left-16 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-purple-400/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* العنوان الرئيسي */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Gift className="h-8 w-8 text-yellow-400" />
            <h2 className="text-4xl md:text-5xl font-bold">
              جرب المنصة مجاناً
            </h2>
            <Gift className="h-8 w-8 text-yellow-400" />
          </div>
          <p className="text-xl text-blue-200 mb-8">
            احصل على وصول كامل لجميع الميزات - تجربة مجانية شاملة!
          </p>

          {/* العد التنازلي */}
          <div className="flex justify-center gap-4 mb-8">
            {[
              { label: 'أيام', value: timeLeft.days },
              { label: 'ساعات', value: timeLeft.hours },
              { label: 'دقائق', value: timeLeft.minutes },
              { label: 'ثواني', value: timeLeft.seconds }
            ].map((time, index) => (
              <div key={index} className="text-center">
                <div className="bg-white/10 rounded-lg p-3 min-w-[60px]">
                  <div className="text-2xl font-bold text-yellow-400">
                    {time.value.toString().padStart(2, '0')}
                  </div>
                </div>
                <div className="text-sm text-gray-300 mt-1">{time.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* الباقات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {offers.map((offer, index) => (
            <Card 
              key={index}
              className={`relative overflow-hidden border-none shadow-2xl hover:shadow-3xl transition-all duration-500 group ${
                index === 0 ? 'transform md:scale-105 z-10' : ''
              }`}
            >
              {/* خلفية متدرجة */}
              <div className={`absolute inset-0 bg-gradient-to-br ${offer.color} opacity-90`}></div>
              
              {/* شارة المميز */}
              {offer.badge && (
                <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {offer.badge}
                </div>
              )}

              <CardContent className="relative p-8 text-white">
                <div className="text-center mb-6">
                  <Crown className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
                  <h3 className="text-2xl font-bold mb-2">{offer.title}</h3>
                  
                  {/* السعر والمدة */}
                  <div className="mb-6">
                    <div className="text-center mb-2">
                      <span className="text-4xl font-bold text-yellow-400">{offer.price}</span>
                    </div>
                    <div className="text-gray-300 text-lg">
                      لمدة {offer.duration}
                    </div>
                  </div>
                </div>

                {/* الميزات */}
                <div className="space-y-3 mb-8">
                  {offer.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2 flex-shrink-0"></div>
                      <span className="text-sm leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* زر التجربة */}
                <Button 
                  className="w-full bg-white text-gray-900 hover:bg-gray-100 font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                  size="lg"
                >
                  ابدأ التجربة المجانية
                  <Gift className="mr-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ضمان التجربة */}
        <div className="text-center mt-16">
          <div className="bg-white/10 rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4 text-yellow-400">
              🚀 تجربة مجانية كاملة
            </h3>
            <p className="text-gray-200 leading-relaxed">
              لا حاجة لبطاقة ائتمان! جرب جميع الميزات مجاناً لمدة 30 يوماً واكتشف القوة الحقيقية لمنصة التقنية ببساطة
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpecialOffer;