// آلة حاسبة أنيقة لامتحانات البجروت
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExamCalculatorProps {
  className?: string;
}

type Operator = '+' | '-' | '*' | '/' | '%' | null;

export default function ExamCalculator({ className }: ExamCalculatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  // حسابات آمنة بدون eval
  const calculate = useCallback((a: number, op: Operator, b: number): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b !== 0 ? a / b : 0;
      case '%': return a % b;
      default: return b;
    }
  }, []);

  // إدخال رقم
  const inputDigit = useCallback((digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(prev => prev === '0' ? digit : prev + digit);
    }
  }, [waitingForOperand]);

  // إدخال النقطة العشرية
  const inputDecimal = useCallback(() => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (!display.includes('.')) {
      setDisplay(prev => prev + '.');
    }
  }, [display, waitingForOperand]);

  // مسح الكل
  const clearAll = useCallback(() => {
    setDisplay('0');
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  }, []);

  // حذف آخر رقم
  const backspace = useCallback(() => {
    if (waitingForOperand) return;
    setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
  }, [waitingForOperand]);

  // تغيير الإشارة
  const toggleSign = useCallback(() => {
    const value = parseFloat(display);
    if (value !== 0) {
      setDisplay(String(-value));
    }
  }, [display]);

  // تنفيذ عملية
  const performOperation = useCallback((nextOperator: Operator) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operator) {
      const result = calculate(previousValue, operator, inputValue);
      // تنسيق النتيجة لتجنب الأرقام الطويلة جداً
      const formattedResult = parseFloat(result.toPrecision(12));
      setDisplay(String(formattedResult));
      setPreviousValue(formattedResult);
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  }, [display, previousValue, operator, calculate]);

  // حساب النتيجة النهائية
  const calculateResult = useCallback(() => {
    if (operator === null || previousValue === null) return;

    const inputValue = parseFloat(display);
    const result = calculate(previousValue, operator, inputValue);
    const formattedResult = parseFloat(result.toPrecision(12));
    
    setDisplay(String(formattedResult));
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  }, [display, previousValue, operator, calculate]);

  // معالجة لوحة المفاتيح
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // تجاهل إذا كان المستخدم يكتب في حقل نصي
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        inputDigit(e.key);
      } else if (e.key === '.') {
        e.preventDefault();
        inputDecimal();
      } else if (e.key === '+') {
        e.preventDefault();
        performOperation('+');
      } else if (e.key === '-') {
        e.preventDefault();
        performOperation('-');
      } else if (e.key === '*') {
        e.preventDefault();
        performOperation('*');
      } else if (e.key === '/') {
        e.preventDefault();
        performOperation('/');
      } else if (e.key === '%') {
        e.preventDefault();
        performOperation('%');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        calculateResult();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        backspace();
      } else if (e.key === 'Delete' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        clearAll();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, inputDigit, inputDecimal, performOperation, calculateResult, backspace, clearAll]);

  // تنسيق العرض
  const formatDisplay = (value: string): string => {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    if (value.endsWith('.')) return value;
    
    // إذا كان الرقم كبيراً جداً أو صغيراً جداً، استخدم الترميز العلمي
    if (Math.abs(num) >= 1e12 || (Math.abs(num) < 1e-6 && num !== 0)) {
      return num.toExponential(6);
    }
    
    // خلاف ذلك، استخدم التنسيق العادي مع الفواصل
    const parts = value.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  // أزرار الآلة الحاسبة
  // ترتيب الأزرار مثل آلة حاسبة ويندوز (العمليات على اليمين)
  const buttons = [
    { label: '%', action: () => performOperation('%'), variant: 'secondary' as const },
    { label: 'C', action: clearAll, variant: 'destructive' as const },
    { label: '⌫', action: backspace, variant: 'secondary' as const },
    { label: '÷', action: () => performOperation('/'), variant: 'operator' as const },
    { label: '7', action: () => inputDigit('7'), variant: 'number' as const },
    { label: '8', action: () => inputDigit('8'), variant: 'number' as const },
    { label: '9', action: () => inputDigit('9'), variant: 'number' as const },
    { label: '×', action: () => performOperation('*'), variant: 'operator' as const },
    { label: '4', action: () => inputDigit('4'), variant: 'number' as const },
    { label: '5', action: () => inputDigit('5'), variant: 'number' as const },
    { label: '6', action: () => inputDigit('6'), variant: 'number' as const },
    { label: '−', action: () => performOperation('-'), variant: 'operator' as const },
    { label: '1', action: () => inputDigit('1'), variant: 'number' as const },
    { label: '2', action: () => inputDigit('2'), variant: 'number' as const },
    { label: '3', action: () => inputDigit('3'), variant: 'number' as const },
    { label: '+', action: () => performOperation('+'), variant: 'operator' as const },
    { label: '±', action: toggleSign, variant: 'secondary' as const },
    { label: '0', action: () => inputDigit('0'), variant: 'number' as const },
    { label: '.', action: inputDecimal, variant: 'number' as const },
    { label: '=', action: calculateResult, variant: 'equals' as const },
  ];

  const getButtonClasses = (variant: string): string => {
    switch (variant) {
      case 'destructive':
        return 'bg-destructive/10 text-destructive hover:bg-destructive/20 active:bg-destructive/30';
      case 'operator':
        return 'bg-primary/10 text-primary hover:bg-primary/20 active:bg-primary/30 font-semibold';
      case 'equals':
        return 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 font-bold';
      case 'secondary':
        return 'bg-muted hover:bg-muted/80 active:bg-muted/60';
      default: // number
        return 'bg-background hover:bg-accent active:bg-accent/80';
    }
  };

  return (
    <div className={cn("fixed bottom-20 left-4 z-40", className)}>
      {/* زر التفعيل */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        variant={isOpen ? "default" : "outline"}
        className={cn(
          "h-12 w-12 rounded-full shadow-lg transition-all duration-200",
          isOpen && "ring-2 ring-primary ring-offset-2"
        )}
        aria-label={isOpen ? "إغلاق الآلة الحاسبة" : "فتح الآلة الحاسبة"}
      >
        <Calculator className="h-5 w-5" />
      </Button>

      {/* واجهة الآلة الحاسبة */}
      {isOpen && (
        <Card className={cn(
          "absolute bottom-16 left-0 w-64 shadow-xl",
          "bg-background/95 backdrop-blur-lg border-border/50",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}>
          <CardHeader className="pb-2 pt-3 px-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calculator className="h-4 w-4 text-muted-foreground" />
                الآلة الحاسبة
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={() => setIsOpen(false)}
                aria-label="إغلاق"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-3 pt-0">
            {/* شاشة العرض */}
            <div className="bg-muted/50 rounded-lg p-3 mb-3 min-h-[52px] flex items-center justify-end overflow-hidden">
              <span 
                className="text-2xl font-mono font-semibold text-foreground truncate"
                dir="ltr"
                aria-live="polite"
              >
                {formatDisplay(display)}
              </span>
            </div>

            {/* مؤشر العملية الحالية */}
            {operator && (
              <div className="text-xs text-muted-foreground text-left mb-2 font-mono" dir="ltr">
                {previousValue} {operator === '*' ? '×' : operator === '/' ? '÷' : operator === '-' ? '−' : operator}
              </div>
            )}

            {/* شبكة الأزرار */}
            <div className="grid grid-cols-4 gap-1.5" dir="ltr">
              {buttons.map((btn, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className={cn(
                    "h-11 text-lg font-medium rounded-lg transition-all duration-100",
                    getButtonClasses(btn.variant)
                  )}
                  onClick={btn.action}
                  aria-label={btn.label}
                >
                  {btn.label}
                </Button>
              ))}
            </div>

            {/* تلميح لوحة المفاتيح */}
            <p className="text-[10px] text-muted-foreground text-center mt-3">
              يمكنك استخدام لوحة المفاتيح • Esc للإغلاق
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
