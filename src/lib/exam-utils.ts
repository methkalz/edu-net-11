/**
 * دوال مساعدة لحساب النقاط في الامتحانات
 * العلامة النهائية دائماً من 100
 */

/**
 * حساب علامة كل سؤال بناءً على العدد الكلي للأسئلة
 * @param totalQuestions - العدد الكلي للأسئلة في الامتحان
 * @returns علامة كل سؤال
 */
export const calculateQuestionPoints = (totalQuestions: number): number => {
  if (totalQuestions === 0) return 0;
  return 100 / totalQuestions;
};

/**
 * حساب العلامة الكلية للامتحان
 * @returns العلامة الكلية (دائماً 100)
 */
export const calculateTotalPoints = (): number => {
  return 100;
};

/**
 * حساب النسبة المئوية من العلامة
 * @param score - العلامة المحققة
 * @param totalQuestions - العدد الكلي للأسئلة
 * @returns النسبة المئوية
 */
export const calculatePercentage = (score: number, totalQuestions: number): number => {
  if (totalQuestions === 0) return 0;
  const questionPoints = calculateQuestionPoints(totalQuestions);
  return (score / (questionPoints * totalQuestions)) * 100;
};
