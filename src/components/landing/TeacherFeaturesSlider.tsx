import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import './slider-animations.css';

const TeacherFeaturesSlider: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [enlargedImageIndex, setEnlargedImageIndex] = useState<number | null>(null);

  const slides = [
    {
      title: 'مواد جاهزة حسب مناهج الوزارة',
      description: 'مواد جاهزة حسب مناهج الوزارة لكل صف.',
      image: '/teacher-features/teacher-dashboard.png',
      features: ['محتوى مطابق للمناهج', 'تحديث مستمر', 'جودة عالية']
    },
    {
      title: 'محتوى تفاعلي متطور',
      description: 'محتوى تفاعلي مع عروض وفيديوهات وشروحات للمواضيع الصعبة.',
      image: '/teacher-features/class-management.png',
      features: ['عروض تفاعلية', 'فيديوهات تعليمية', 'شروحات مفصلة']
    },
    {
      title: 'بنك أسئلة متطور',
      description: 'بنك أسئلة متطور ومولد امتحانات جاهزة مع الحلول.',
      image: '/teacher-features/student-management.png',
      features: ['آلاف الأسئلة', 'حلول مفصلة', 'تصنيف حسب الصعوبة']
    },
    {
      title: 'إعداد الامتحانات بسهولة',
      description: 'إمكانية إعداد أوراق عمل وامتحانات بضغطة زر.',
      image: '/teacher-features/video-lessons.png',
      features: ['أوراق عمل جاهزة', 'امتحانات سريعة', 'توفير الوقت']
    },
    {
      title: 'تقارير متابعة تفصيلية',
      description: 'تقارير متابعة تفصيلية لكل طالب مع عرض الأسئلة غير المجاب عنها.',
      image: '/teacher-features/bulk-student-upload.png',
      features: ['تحليل الأداء', 'تقارير فورية', 'متابعة فردية']
    },
    {
      title: 'الصف العاشر',
      description: 'التعرف على نظام ويندوز، مقدمة في الشبكات، ومشاريع مصغرة مع فيديوهات.',
      image: '/teacher-features/grade-content.png',
      features: ['نظام ويندوز', 'مقدمة الشبكات', 'مشاريع مصغرة']
    },
    {
      title: 'الصف الحادي عشر',
      description: 'المادة المطلوبة (70%) لامتحان البجروت.',
      image: '/teacher-features/grade11-content.png',
      features: ['منهج البجروت', '70% من المادة', 'تحضير شامل']
    },
    {
      title: 'الصف الثاني عشر',
      description: 'مهام قصيرة وفيديوهات عملية لتنفيذ مشروع التخرج، مع فحص نسبة التشابه بين المشاريع.',
      image: '/teacher-features/vlan-lessons.png',
      features: ['مشروع التخرج', 'فيديوهات عملية', 'فحص التشابه']
    },
    {
      title: 'مواد جاهزة حسب مناهج الوزارة',
      description: 'مواد جاهزة حسب مناهج الوزارة لكل صف.',
      image: '/teacher-features/peer-to-peer.png',
      features: ['محتوى مطابق للمناهج', 'تحديث مستمر', 'جودة عالية']
    },
    {
      title: 'محتوى تفاعلي متطور',
      description: 'محتوى تفاعلي مع عروض وفيديوهات وشروحات للمواضيع الصعبة.',
      image: '/teacher-features/wireless-security.png',
      features: ['عروض تفاعلية', 'فيديوهات تعليمية', 'شروحات مفصلة']
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const nextEnlargedImage = () => {
    if (enlargedImageIndex !== null) {
      setEnlargedImageIndex((prev) => prev === null ? 0 : (prev + 1) % slides.length);
    }
  };

  const prevEnlargedImage = () => {
    if (enlargedImageIndex !== null) {
      setEnlargedImageIndex((prev) => prev === null ? 0 : (prev - 1 + slides.length) % slides.length);
    }
  };

  return (
    <div className="relative max-w-5xl mx-auto px-2 sm:px-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl sm:rounded-3xl"></div>
      
      {/* Enhanced Navigation - Outside the overflow container */}
      <button
        onClick={prevSlide}
        className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-blue-50 text-blue-600 p-2 sm:p-3 rounded-full shadow-xl transition-all duration-300 hover:scale-110 border-2 border-blue-100 z-50"
      >
        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-blue-50 text-blue-600 p-2 sm:p-3 rounded-full shadow-xl transition-all duration-300 hover:scale-110 border-2 border-blue-100 z-50"
      >
        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
      
      <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden border border-blue-100">
        <div className="relative h-[24rem] sm:h-80 md:h-96 px-6 sm:px-8 md:px-16"> {/* Fixed height for mobile */}
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                index === currentSlide 
                  ? 'opacity-100 translate-x-0 scale-100' 
                  : index < currentSlide 
                    ? 'opacity-0 -translate-x-full scale-95' 
                    : 'opacity-0 translate-x-full scale-95'
              }`}
            >
              {/* Mobile Layout */}
              <div className="flex flex-col h-full px-1 sm:px-2 md:hidden">
                <div className="flex-1 p-2 sm:p-4 flex flex-col justify-center items-center text-center relative">
                  {/* Decorative Elements */}
                  <div className="absolute top-2 left-2 sm:top-4 sm:left-4 w-8 h-8 bg-blue-100 rounded-full opacity-30 animate-pulse"></div>
                  <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-6 h-6 bg-blue-200 rounded-full opacity-20 animate-bounce"></div>
                  
                  <div className="relative z-10">
                    <div className="block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-2 animate-fade-in text-center w-fit mx-auto">
                      للمعلم
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 animate-slide-up leading-tight text-center">
                      {slide.title}
                    </h3>
                    <p className="text-gray-600 mb-3 text-sm leading-relaxed animate-slide-up text-center" style={{ animationDelay: '0.1s' }}>
                      {slide.description}
                    </p>
                    <ul className="space-y-1 flex flex-col items-center">
                      {slide.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-gray-700 animate-slide-right" style={{ animationDelay: `${0.2 + idx * 0.1}s` }}>
                          <div className="w-1 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full ml-1 flex-shrink-0 animate-pulse"></div>
                          <span className="text-sm font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {/* قسم الصورة - أصغر للهواتف */}
                <div className="flex-shrink-0 flex items-center justify-center p-2 relative overflow-hidden">
                  {/* Animated Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100"></div>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
                  <div className="absolute bottom-0 left-0 w-12 h-12 bg-indigo-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
                  
                  <div className="relative z-10 group w-full max-w-[200px]">
                     <div className="relative transform transition-all duration-500 group-hover:scale-105">
                       <img
                         src={slide.image}
                         alt={slide.title}
                         onClick={() => setEnlargedImageIndex(index)}
                         className="w-full max-h-[8rem] object-contain rounded-lg shadow-xl border border-white bg-white/10 cursor-pointer hover:shadow-2xl transition-shadow duration-300"
                       />
                        {/* Teacher Elements - pointer-events-none to allow clicking through */}
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-bounce pointer-events-none"></div>
                        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-indigo-400 rounded-full animate-bounce pointer-events-none" style={{ animationDelay: '0.5s' }}></div>
                      </div>
                     
                     {/* Orbit Ring - pointer-events-none to allow clicking through */}
                     <div className="absolute inset-0 border border-blue-200 rounded-full animate-spin-slow opacity-20 pointer-events-none"></div>
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:flex md:items-center h-full px-8">
                <div className="grid grid-cols-2 gap-8 w-full items-center">
                  {/* Left side - Text content */}
                  <div className="space-y-6">
                    <div className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium animate-fade-in">
                      للمعلم
                    </div>
                    <div>
                      <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 animate-slide-up leading-tight">
                        {slide.title}
                      </h3>
                      <p className="text-gray-600 mb-6 text-base lg:text-lg leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        {slide.description}
                      </p>
                    </div>
                    
                    <ul className="space-y-3">
                      {slide.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-gray-700 animate-slide-right" style={{ animationDelay: `${0.2 + idx * 0.1}s` }}>
                          <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full ml-2 flex-shrink-0 animate-pulse"></div>
                          <span className="text-base font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right side - Image */}
                  <div className="flex justify-center relative">
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 rounded-2xl"></div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
                    
                    <div className="relative z-10 group">
                       <div className="relative transform transition-all duration-500 group-hover:scale-105">
                         <img
                           src={slide.image}
                           alt={slide.title}
                           onClick={() => setEnlargedImageIndex(index)}
                           className="w-full max-w-lg h-80 object-contain rounded-xl shadow-xl border border-white bg-white/10 cursor-pointer hover:shadow-2xl transition-shadow duration-300"
                         />
                          {/* Teacher Elements - pointer-events-none to allow clicking through */}
                          <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-400 rounded-full animate-bounce pointer-events-none"></div>
                          <div className="absolute -bottom-3 -left-3 w-4 h-4 bg-indigo-400 rounded-full animate-bounce pointer-events-none" style={{ animationDelay: '0.5s' }}></div>
                        </div>
                       
                       {/* Orbit Ring - pointer-events-none to allow clicking through */}
                       <div className="absolute inset-0 border-2 border-blue-200 rounded-full animate-spin-slow opacity-20 pointer-events-none"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Dots */}
        <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1 sm:space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`transition-all duration-300 ${
                index === currentSlide 
                  ? 'w-4 sm:w-6 h-1.5 sm:h-2 bg-blue-500 rounded-full' 
                  : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-blue-200 hover:bg-blue-300 rounded-full hover:scale-125'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Image Enlargement Dialog */}
      <Dialog open={enlargedImageIndex !== null} onOpenChange={() => setEnlargedImageIndex(null)}>
        <DialogContent className="max-w-6xl max-h-[95vh] p-0 bg-black/95 border-none overflow-hidden">
          <div className="relative h-full">
            {/* Close Button */}
            <button
              onClick={() => setEnlargedImageIndex(null)}
              className="absolute top-6 right-6 z-50 bg-red-500/80 hover:bg-red-500 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg border-2 border-white/20"
            >
              <X className="h-6 w-6" />
            </button>
            
            {/* Navigation Arrows */}
            <button
              onClick={prevEnlargedImage}
              className="absolute left-6 top-1/2 transform -translate-y-1/2 z-50 bg-gray-900/80 hover:bg-gray-900 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-xl border-2 border-white/30"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            <button
              onClick={nextEnlargedImage}
              className="absolute right-6 top-1/2 transform -translate-y-1/2 z-50 bg-gray-900/80 hover:bg-gray-900 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-xl border-2 border-white/30"
            >
              <ChevronRight className="h-8 w-8" />
            </button>

            {/* Image Container */}
            {enlargedImageIndex !== null && (
              <div className="w-full h-full flex items-center justify-center p-6">
                <div className="text-center">
                  <img
                    src={slides[enlargedImageIndex].image}
                    alt={slides[enlargedImageIndex].title}
                    className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                  />
                  <h3 className="text-white text-xl font-bold mt-4">{slides[enlargedImageIndex].title}</h3>
                  <p className="text-white/80 text-sm mt-2">{slides[enlargedImageIndex].description}</p>
                </div>
              </div>
            )}

            {/* Image Counter */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full">
              <span className="text-white text-sm">
                {enlargedImageIndex !== null ? enlargedImageIndex + 1 : 0} / {slides.length}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherFeaturesSlider;