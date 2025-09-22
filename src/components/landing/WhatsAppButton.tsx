import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsAppButton: React.FC = () => {
  const handleWhatsAppClick = () => {
    const whatsappUrl = 'https://api.whatsapp.com/send/?phone=972528359103&text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C+%D8%A3%D8%B1%D8%BA%D8%A8+%D9%81%D9%8A+%D9%85%D8%B9%D8%B1%D9%81%D8%A9+%D8%A7%D9%84%D9%85%D8%B2%D9%8A%D8%AF+%D8%B9%D9%86+%D9%85%D9%86%D8%B5%D8%A9+%D8%A7%D9%84%D8%AA%D9%82%D9%86%D9%8A%D8%A9+%D8%A8%D8%A8%D8%B3%D8%A7%D8%B7%D8%A9+%D9%84%D9%84%D8%AA%D8%B9%D9%84%D9%8A%D9%85+%D8%A7%D9%84%D8%A5%D9%84%D9%83%D8%AA%D8%B1%D9%88%D9%86%D9%8A&type=phone_number&app_absent=0';
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <button
      onClick={handleWhatsAppClick}
      className="fixed bottom-6 left-6 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 z-50 animate-pulse hover:animate-none group"
      aria-label="تواصل معنا عبر الواتساب"
    >
      <div className="flex items-center gap-2">
        <MessageCircle size={24} />
        <span className="hidden group-hover:block whitespace-nowrap text-sm font-medium">
          تواصل معنا
        </span>
      </div>
    </button>
  );
};

export default WhatsAppButton;