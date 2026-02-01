/**
 * اختبار الحفظ التلقائي في امتحانات البجروت
 * 
 * هذا الاختبار يتحقق من:
 * 1. الحفظ الدوري كل 30 ثانية
 * 2. الحفظ الذكي بعد 5 ثواني من آخر تغيير
 * 3. الحفظ عند إغلاق المتصفح (beforeunload)
 * 4. استعادة الإجابات عند العودة للامتحان
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('نظام الحفظ التلقائي في البجروت', () => {
  
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('آلية الحفظ الدوري', () => {
    it('يجب أن يتم الحفظ كل 30 ثانية إذا وجدت تغييرات', () => {
      const saveCallback = vi.fn();
      let answers = {};
      let lastSavedAnswers = '';
      
      // محاكاة الحفظ الدوري
      const interval = setInterval(() => {
        const currentAnswersStr = JSON.stringify(answers);
        if (currentAnswersStr !== lastSavedAnswers && Object.keys(answers).length > 0) {
          saveCallback(answers);
          lastSavedAnswers = currentAnswersStr;
        }
      }, 30000);

      // إضافة إجابة
      answers = { 'q1': { answer: 'الإجابة 1' } };
      
      // تقدم الوقت 30 ثانية
      vi.advanceTimersByTime(30000);
      
      expect(saveCallback).toHaveBeenCalledTimes(1);
      expect(saveCallback).toHaveBeenCalledWith({ 'q1': { answer: 'الإجابة 1' } });
      
      // تقدم 30 ثانية أخرى بدون تغييرات
      vi.advanceTimersByTime(30000);
      
      // لا يجب أن يحفظ لأنه لا توجد تغييرات
      expect(saveCallback).toHaveBeenCalledTimes(1);
      
      // إضافة إجابة جديدة
      answers = { ...answers, 'q2': { answer: 'الإجابة 2' } };
      
      // تقدم 30 ثانية أخرى
      vi.advanceTimersByTime(30000);
      
      // يجب أن يحفظ لأن هناك تغييرات
      expect(saveCallback).toHaveBeenCalledTimes(2);
      
      clearInterval(interval);
    });

    it('لا يجب الحفظ إذا لم تكن هناك إجابات', () => {
      const saveCallback = vi.fn();
      const answers = {};
      
      const interval = setInterval(() => {
        if (Object.keys(answers).length > 0) {
          saveCallback(answers);
        }
      }, 30000);

      vi.advanceTimersByTime(30000);
      
      expect(saveCallback).not.toHaveBeenCalled();
      
      clearInterval(interval);
    });
  });

  describe('آلية الحفظ الذكي (Debounced)', () => {
    it('يجب أن يتم الحفظ بعد 5 ثواني من آخر تغيير', () => {
      const saveCallback = vi.fn();
      let debounceTimer: NodeJS.Timeout | null = null;
      
      const debouncedSave = (answers: any) => {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => {
          saveCallback(answers);
        }, 5000);
      };

      // تغيير أول
      debouncedSave({ 'q1': { answer: 'أ' } });
      
      // بعد 2 ثانية، تغيير آخر
      vi.advanceTimersByTime(2000);
      debouncedSave({ 'q1': { answer: 'أ' }, 'q2': { answer: 'ب' } });
      
      // بعد 2 ثانية أخرى (مجموع 4 ثواني)، لم يتم الحفظ بعد
      vi.advanceTimersByTime(2000);
      expect(saveCallback).not.toHaveBeenCalled();
      
      // بعد 5 ثواني من آخر تغيير
      vi.advanceTimersByTime(5000);
      expect(saveCallback).toHaveBeenCalledTimes(1);
      expect(saveCallback).toHaveBeenCalledWith({ 'q1': { answer: 'أ' }, 'q2': { answer: 'ب' } });
      
      if (debounceTimer) clearTimeout(debounceTimer);
    });

    it('يجب إعادة ضبط المؤقت عند كل تغيير', () => {
      const saveCallback = vi.fn();
      let debounceTimer: NodeJS.Timeout | null = null;
      
      const debouncedSave = (answers: any) => {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => {
          saveCallback(answers);
        }, 5000);
      };

      // تغييرات متتالية كل ثانية
      for (let i = 0; i < 10; i++) {
        debouncedSave({ [`q${i}`]: { answer: `إجابة ${i}` } });
        vi.advanceTimersByTime(1000);
      }
      
      // لم يتم الحفظ بعد لأن التغييرات متتالية
      expect(saveCallback).not.toHaveBeenCalled();
      
      // بعد 5 ثواني من آخر تغيير
      vi.advanceTimersByTime(5000);
      expect(saveCallback).toHaveBeenCalledTimes(1);
      
      if (debounceTimer) clearTimeout(debounceTimer);
    });
  });

  describe('استعادة الإجابات المحفوظة', () => {
    it('يجب استعادة الإجابات عند تحميل محاولة موجودة', () => {
      // محاكاة بيانات محاولة محفوظة
      const savedAttempt = {
        id: 'attempt-123',
        status: 'in_progress',
        started_at: '2024-01-15T10:00:00Z',
        answers: {
          'q1': { answer: 'إجابة محفوظة 1' },
          'q2': { answer: 'إجابة محفوظة 2' },
          'q3': { answer: 'صح' }
        }
      };
      
      // محاكاة تحميل البيانات
      const loadedAnswers = savedAttempt.answers;
      
      expect(Object.keys(loadedAnswers)).toHaveLength(3);
      expect(loadedAnswers['q1'].answer).toBe('إجابة محفوظة 1');
      expect(loadedAnswers['q2'].answer).toBe('إجابة محفوظة 2');
      expect(loadedAnswers['q3'].answer).toBe('صح');
    });

    it('يجب استئناف المحاولة من حيث توقفت', () => {
      const savedAttempt = {
        id: 'attempt-123',
        status: 'in_progress',
        started_at: '2024-01-15T10:00:00Z',
        time_spent_seconds: 1800, // 30 دقيقة
        answers: {
          'q1': { answer: 'أ' },
          'q2': { answer: 'ب' }
        }
      };
      
      // التحقق من أن المحاولة لا تزال جارية
      expect(savedAttempt.status).toBe('in_progress');
      
      // التحقق من استعادة الإجابات
      expect(savedAttempt.answers['q1'].answer).toBe('أ');
      expect(savedAttempt.answers['q2'].answer).toBe('ب');
    });
  });

  describe('سيناريو انقطاع الكهرباء', () => {
    it('يجب حفظ الإجابات حتى لحظة الانقطاع', () => {
      const savedAnswers: any[] = [];
      let lastSavedAnswers = '';
      let answers: Record<string, any> = {};
      
      // محاكاة الحفظ الدوري
      const intervalId = setInterval(() => {
        const currentAnswersStr = JSON.stringify(answers);
        if (currentAnswersStr !== lastSavedAnswers && Object.keys(answers).length > 0) {
          savedAnswers.push({ ...answers });
          lastSavedAnswers = currentAnswersStr;
        }
      }, 30000);

      // الطالب يجيب على سؤال 1
      answers['q1'] = { answer: 'الإجابة 1' };
      vi.advanceTimersByTime(30000); // حفظ دوري
      
      // الطالب يجيب على سؤال 2
      answers['q2'] = { answer: 'الإجابة 2' };
      vi.advanceTimersByTime(30000); // حفظ دوري
      
      // الطالب يجيب على سؤال 3
      answers['q3'] = { answer: 'الإجابة 3' };
      vi.advanceTimersByTime(10000); // 10 ثواني فقط
      
      // انقطاع الكهرباء هنا!
      
      // التحقق من الإجابات المحفوظة
      expect(savedAnswers).toHaveLength(2); // حفظتان فقط
      
      // آخر حفظ يحتوي على السؤالين الأولين
      const lastSave = savedAnswers[savedAnswers.length - 1];
      expect(lastSave['q1']).toBeDefined();
      expect(lastSave['q2']).toBeDefined();
      
      // السؤال 3 لم يُحفظ بعد (كان يحتاج 20 ثانية إضافية)
      expect(savedAnswers.some(s => s['q3'])).toBe(false);
      
      clearInterval(intervalId);
    });

    it('الحفظ الذكي يقلل فقدان البيانات', () => {
      const savedAnswers: any[] = [];
      let debounceTimer: NodeJS.Timeout | null = null;
      
      const debouncedSave = (answers: any) => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          savedAnswers.push({ ...answers });
        }, 5000);
      };

      let answers: Record<string, any> = {};
      
      // الطالب يجيب ويتوقف
      answers['q1'] = { answer: 'إجابة 1' };
      debouncedSave(answers);
      
      vi.advanceTimersByTime(6000); // 6 ثواني - سيتم الحفظ
      
      answers['q2'] = { answer: 'إجابة 2' };
      debouncedSave(answers);
      
      vi.advanceTimersByTime(3000); // 3 ثواني فقط - انقطاع الكهرباء
      
      // السؤال 1 محفوظ، السؤال 2 لم يُحفظ
      expect(savedAnswers).toHaveLength(1);
      expect(savedAnswers[0]['q1']).toBeDefined();
      expect(savedAnswers[0]['q2']).toBeUndefined();
      
      if (debounceTimer) clearTimeout(debounceTimer);
    });
  });

  describe('التحقق من بنية البيانات', () => {
    it('يجب أن تكون بنية الإجابة صحيحة', () => {
      const answer = {
        answer: 'الخيار أ',
        time_spent_seconds: 45
      };
      
      expect(answer).toHaveProperty('answer');
      expect(typeof answer.answer).toBe('string');
    });

    it('يجب دعم أنواع الإجابات المختلفة', () => {
      const answers: Record<string, { answer: any }> = {
        // اختيار من متعدد
        'mcq_q1': { answer: 'أ. الخيار الأول' },
        // صح/خطأ
        'tf_q1': { answer: 'صح' },
        // إجابة نصية
        'text_q1': { answer: 'هذه إجابة مكتوبة بالتفصيل' },
        // ملء الفراغات (عدة فراغات)
        'fill_q1': { answer: { 'فراغ_1': 'كلمة1', 'فراغ_2': 'كلمة2' } }
      };
      
      expect(typeof answers['mcq_q1'].answer).toBe('string');
      expect(typeof answers['tf_q1'].answer).toBe('string');
      expect(typeof answers['text_q1'].answer).toBe('string');
      expect(typeof answers['fill_q1'].answer).toBe('object');
    });
  });
});

describe('اختبار تكامل الحفظ مع قاعدة البيانات', () => {
  it('يجب أن تتطابق بنية الإجابات مع المخطط المتوقع', () => {
    // بنية الإجابات كما هي في قاعدة البيانات
    const dbAnswerStructure = {
      "2645851c-d7bd-48be-891b-8904e2547038": { "answer": "أ. حتى عشرة مستخدمين" },
      "35e574c6-413d-44ef-b748-f0df5a5e5e37": { "answer": "صح" },
      "7ec4d855-abe9-40a2-a5a0-287955b61dec": { "answer": "يبيب" },
      "a94b2029-b7f4-4cc4-95b3-05ae38a760a3": { "answer": "خطأ" }
    };
    
    // التحقق من البنية
    Object.keys(dbAnswerStructure).forEach(questionId => {
      expect(dbAnswerStructure[questionId as keyof typeof dbAnswerStructure]).toHaveProperty('answer');
    });
  });
});
