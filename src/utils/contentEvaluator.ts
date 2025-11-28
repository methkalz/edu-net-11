/**
 * تقييم ملائمة محتوى الدرس لتوليد الأسئلة
 */

export interface ContentEvaluation {
  isSuitable: boolean;
  suitabilityLevel: 'excellent' | 'good' | 'poor' | 'insufficient';
  textLength: number;
  warnings: string[];
  maxRecommendedQuestions: number;
}

/**
 * تقييم محتوى الدرس
 */
export function evaluateLessonContent(htmlContent: string): ContentEvaluation {
  // استخراج النص الصافي من HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  // إزالة script و style tags
  tempDiv.querySelectorAll('script, style').forEach(el => el.remove());
  
  const textContent = tempDiv.textContent || tempDiv.innerText || '';
  const cleanText = textContent.trim();
  const textLength = cleanText.length;
  
  const warnings: string[] = [];
  let suitabilityLevel: ContentEvaluation['suitabilityLevel'] = 'excellent';
  let maxRecommendedQuestions = 20;
  
  // فحص المحتوى
  if (textLength === 0) {
    warnings.push('المحتوى فارغ أو يحتوي على وسائط فقط');
    suitabilityLevel = 'insufficient';
    maxRecommendedQuestions = 0;
  } else if (textLength < 200) {
    warnings.push('المحتوى قصير جداً (أقل من 200 حرف)');
    suitabilityLevel = 'poor';
    maxRecommendedQuestions = 2;
  } else if (textLength < 500) {
    warnings.push('المحتوى قصير نسبياً');
    suitabilityLevel = 'good';
    maxRecommendedQuestions = 5;
  } else if (textLength < 1000) {
    suitabilityLevel = 'good';
    maxRecommendedQuestions = 10;
  } else if (textLength < 2000) {
    suitabilityLevel = 'excellent';
    maxRecommendedQuestions = 15;
  } else {
    suitabilityLevel = 'excellent';
    maxRecommendedQuestions = 20;
  }
  
  // فحص وجود وسائط فقط
  const hasEmbeds = htmlContent.includes('data-type="html-embed"') || 
                    htmlContent.includes('gamma.app/embed') ||
                    htmlContent.includes('<video') ||
                    htmlContent.includes('<audio');
  
  if (hasEmbeds && textLength < 200) {
    warnings.push('المحتوى يحتوي بشكل أساسي على وسائط (فيديو/صوتيات/تفاعلية)');
  }
  
  const isSuitable = suitabilityLevel !== 'insufficient';
  
  return {
    isSuitable,
    suitabilityLevel,
    textLength,
    warnings,
    maxRecommendedQuestions
  };
}

/**
 * الحصول على لون Badge بناءً على مستوى الملائمة
 */
export function getSuitabilityColor(level: ContentEvaluation['suitabilityLevel']): string {
  switch (level) {
    case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
    case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'poor': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'insufficient': return 'text-red-600 bg-red-50 border-red-200';
  }
}

/**
 * الحصول على أيقونة بناءً على مستوى الملائمة
 */
export function getSuitabilityIcon(level: ContentEvaluation['suitabilityLevel']): string {
  switch (level) {
    case 'excellent': return '✅';
    case 'good': return '⚠️';
    case 'poor': return '⚠️';
    case 'insufficient': return '❌';
  }
}
