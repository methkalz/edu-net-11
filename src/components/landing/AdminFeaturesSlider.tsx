import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import './slider-animations.css';

const AdminFeaturesSlider: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [enlargedImageIndex, setEnlargedImageIndex] = useState<number | null>(null);

  const slides = [
    {
      title: 'رفع نتائج التحصيل',
      description: 'رفع نتائج التحصيل في امتحانات البجروت.',
      image: '/admin-features/class-management.png',
      features: ['تحسين النتائج', 'نجاح أكبر', 'تقدم ملحوظ']
    },
    {
      title: 'تقوية العلاقة مع الأهالي',
      description: 'تقوية العلاقة مع الأهالي عبر رسائل واتساب بعد كل اختبار.',
      image: '/admin-features/quick-dashboard.png',
      features: ['تواصل فعال', 'رسائل واتساب', 'شراكة مستمرة']
    },
    {
      title: 'تقارير شاملة ومتابعة',
      description: 'تقارير شاملة لمستوى كل صف ولوحة متابعة متكاملة.',
      image: '/admin-features/statistics-dashboard.png',
      features: ['تقارير شاملة', 'متابعة متكاملة', 'رؤية واضحة']
    },
    {
      title: 'فحص ذكي للمشاريع',
      description: 'تقليل نسب الأخطاء والغش في مشاريع التخرج من خلال فحص ذكي للمشاريع قبل التسليم.',
      image: '/admin-features/class-management.png',
      features: ['فحص التشابه', 'منع الغش', 'جودة المشاريع']
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
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-indigo-100 rounded-2xl sm:rounded-3xl"></div>
      
      {/* Enhanced Navigation - Outside the overflow container */}
      <button
        onClick={prevSlide}
        className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-purple-50 text-purple-600 p-2 sm:p-3 rounded-full shadow-xl transition-all duration-300 hover:scale-110 border-2 border-purple-100 z-50"
      >
        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-purple-50 text-purple-600 p-2 sm:p-3 rounded-full shadow-xl transition-all duration-300 hover:scale-110 border-2 border-purple-100 z-50"
      >
        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
      
      <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden border border-purple-100">
        <div className="relative h-[24rem] sm:h-80 md:h-96 px-6 sm:px-8 md:px-16">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                index === currentSlide 
                  ? 'opacity-100 scale-100 rotate-0' 
                  : index < currentSlide 
                    ? 'opacity-0 scale-95 -rotate-1' 
                    : 'opacity-0 scale-95 rotate-1'
              }`}
            >
              {/* Mobile Layout */}
              <div className="flex flex-col h-full px-1 sm:px-2 md:hidden">
                <div className="flex-1 p-2 sm:p-4 flex flex-col justify-center items-center text-center relative">
                  {/* Decorative Elements */}
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 bg-purple-100 rounded-full opacity-30 animate-pulse"></div>
                  <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 w-6 h-6 bg-indigo-200 rounded-full opacity-20 animate-bounce"></div>
                  
                  <div className="relative z-10">
                    <div className="block px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium mb-2 animate-fade-in text-center w-fit mx-auto">
                      للإدارة
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
                          <div className="w-1 h-1 bg-gradient-to-r from-purple-400 to-indigo-600 rounded-full ml-1 flex-shrink-0 animate-pulse"></div>
                          <span className="text-sm font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="flex-shrink-0 flex items-center justify-center p-2 relative overflow-hidden">
                  {/* Animated Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100"></div>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-purple-200 rounded-full opacity-20 animate-pulse"></div>
                  <div className="absolute bottom-0 left-0 w-12 h-12 bg-indigo-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
                  
                  <div className="relative z-10 group w-full max-w-[200px]">
                     <div className="relative transform transition-all duration-500 group-hover:scale-105">
                       <img
                         src={slide.image}
                         alt={slide.title}
                         onClick={() => setEnlargedImageIndex(index)}
                         className="w-full max-h-[8rem] object-contain rounded-lg shadow-xl border border-white bg-white/10 cursor-pointer hover:shadow-2xl transition-shadow duration-300"
                       />
                        {/* Admin Elements - pointer-events-none to allow clicking through */}
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-bounce pointer-events-none"></div>
                        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-indigo-400 rounded-full animate-bounce pointer-events-none" style={{ animationDelay: '0.5s' }}></div>
                      </div>
                     
                     {/* Orbit Ring - pointer-events-none to allow clicking through */}
                     <div className="absolute inset-0 border border-purple-200 rounded-full animate-spin-slow opacity-20 pointer-events-none"></div>
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:flex md:items-center h-full px-8">
                <div className="grid grid-cols-2 gap-8 w-full items-center">
                  {/* Left side - Text content */}
                  <div className="space-y-6">
                    <div className="inline-block px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium animate-fade-in">
                      للإدارة
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
                          <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-indigo-600 rounded-full ml-2 flex-shrink-0 animate-pulse"></div>
                          <span className="text-base font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right side - Image */}
                  <div className="flex justify-center relative">
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 rounded-2xl"></div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full opacity-20 animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
                    
                    <div className="relative z-10 group">
                       <div className="relative transform transition-all duration-500 group-hover:scale-105">
                         <img
                           src={slide.image}
                           alt={slide.title}
                           onClick={() => setEnlargedImageIndex(index)}
                           className="w-full max-w-lg h-80 object-contain rounded-xl shadow-xl border border-white bg-white/10 cursor-pointer hover:shadow-2xl transition-shadow duration-300"
                         />
                          {/* Admin Elements - pointer-events-none to allow clicking through */}
                          <div className="absolute -top-2 -right-2 w-5 h-5 bg-purple-400 rounded-full animate-bounce pointer-events-none"></div>
                          <div className="absolute -bottom-3 -left-3 w-4 h-4 bg-indigo-400 rounded-full animate-bounce pointer-events-none" style={{ animationDelay: '0.5s' }}></div>
                        </div>
                       
                       {/* Orbit Ring - pointer-events-none to allow clicking through */}
                       <div className="absolute inset-0 border-2 border-purple-200 rounded-full animate-spin-slow opacity-20 pointer-events-none"></div>
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
                  ? 'w-4 sm:w-6 h-1.5 sm:h-2 bg-purple-500 rounded-full' 
                  : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-purple-200 hover:bg-purple-300 rounded-full hover:scale-125'
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

export default AdminFeaturesSlider;