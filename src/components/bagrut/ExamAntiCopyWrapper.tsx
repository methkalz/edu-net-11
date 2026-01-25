// مكون حماية ضد النسخ للامتحانات
import React, { useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ExamAntiCopyWrapperProps {
  children: React.ReactNode;
  className?: string;
  enabled?: boolean;
}

/**
 * مكون يمنع نسخ المحتوى وتحديده
 * يستثني حقول الإدخال (input, textarea) للسماح بكتابة الإجابات
 */
const ExamAntiCopyWrapper: React.FC<ExamAntiCopyWrapperProps> = ({
  children,
  className,
  enabled = true,
}) => {
  // منع أحداث النسخ
  const handleCopy = useCallback((e: React.ClipboardEvent) => {
    if (!enabled) return;
    
    // السماح بالنسخ من حقول الإدخال
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }
    
    e.preventDefault();
  }, [enabled]);

  // منع القص
  const handleCut = useCallback((e: React.ClipboardEvent) => {
    if (!enabled) return;
    
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }
    
    e.preventDefault();
  }, [enabled]);

  // منع القائمة السياقية (الزر الأيمن) على النصوص فقط
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!enabled) return;
    
    const target = e.target as HTMLElement;
    // السماح بالقائمة السياقية في حقول الإدخال
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }
    
    e.preventDefault();
  }, [enabled]);

  // تعطيل اختصارات النسخ عبر لوحة المفاتيح
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      
      // السماح في حقول الإدخال
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // منع Ctrl+C, Ctrl+X, Ctrl+A
      if ((e.ctrlKey || e.metaKey) && ['c', 'x', 'a'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }

      // منع Print Screen (قد لا يعمل في كل المتصفحات)
      if (e.key === 'PrintScreen') {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div
      onCopy={handleCopy}
      onCut={handleCut}
      onContextMenu={handleContextMenu}
      className={cn(
        // منع تحديد النص عبر CSS
        'select-none',
        '[&_*]:select-none',
        // استثناء حقول الإدخال
        '[&_input]:select-text',
        '[&_textarea]:select-text',
        '[&_[contenteditable]]:select-text',
        className
      )}
      style={{
        // طبقات إضافية للحماية
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      {children}
    </div>
  );
};

export default ExamAntiCopyWrapper;
