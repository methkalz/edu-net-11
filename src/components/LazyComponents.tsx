import React, { lazy } from 'react';
import { SimpleErrorBoundary } from '@/lib/error-boundary';
import { retryDynamicImport, createLazyComponentWithFallback } from '@/utils/chunkRetry';

// Enhanced lazy loading with retry logic for chunk loading failures
export const LazyDashboard = lazy(() => retryDynamicImport(() => import('@/pages/Dashboard')));
export const LazyAuth = lazy(() => retryDynamicImport(() => import('@/pages/Auth')));
export const LazySuperAdminAuth = lazy(() => retryDynamicImport(() => import('@/pages/SuperAdminAuth')));
export const LazySchoolManagement = lazy(() => retryDynamicImport(() => import('@/pages/SchoolManagement')));
export const LazySchoolAdminManagement = lazy(() => retryDynamicImport(() => import('@/pages/SchoolAdminManagement')));
export const LazyPluginManagement = lazy(() => retryDynamicImport(() => import('@/pages/PluginManagement')));
export const LazyPackageManagement = lazy(() => retryDynamicImport(() => import('@/pages/PackageManagement')));
export const LazyAcademicYears = lazy(() => retryDynamicImport(() => import('@/pages/AcademicYears')));
export const LazyCalendarManagement = lazy(() => retryDynamicImport(() => import('@/pages/CalendarManagement')));
export const LazySchoolClasses = lazy(() => retryDynamicImport(() => import('@/pages/SchoolClasses')));
export const LazyUserManagement = lazy(() => retryDynamicImport(() => import('@/pages/UserManagement')));
export const LazySystemSettings = lazy(() => retryDynamicImport(() => import('@/pages/SystemSettings')));
export const LazyContentManagement = lazy(() => retryDynamicImport(() => import('@/pages/ContentManagement')));
export const LazyEducationalContent = createLazyComponentWithFallback(
  () => import('@/pages/EducationalContent'),
  'EducationalContent',
  { maxRetries: 5, delay: 1500, backoffMultiplier: 2 }
);
export const LazyGrade10Management = lazy(() => retryDynamicImport(() => import('@/pages/Grade10Management')));
export const LazyGrade11Management = createLazyComponentWithFallback(
  () => import('@/pages/Grade11Management'),
  'Grade11Management',
  { maxRetries: 5, delay: 1500, backoffMultiplier: 2 }
);
export const LazyGrade12Management = lazy(() => retryDynamicImport(() => import('@/pages/Grade12Management')));
export const LazyStudentManagement = lazy(() => retryDynamicImport(() => import('@/pages/StudentManagement')));
export const LazyTest = lazy(() => retryDynamicImport(() => import('@/pages/Test')));
export const LazyQuestionManagement = lazy(() => retryDynamicImport(() => import('@/pages/QuestionManagement')));
export const LazyPairMatchingPage = lazy(() => retryDynamicImport(() => import('@/pages/PairMatchingPage')));

// HOC for lazy components with error boundary
export const withLazyLoading = (Component: React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>) => {
  return (props: Record<string, unknown>) => (
    <SimpleErrorBoundary>
      <Component {...props} />
    </SimpleErrorBoundary>
  );
};