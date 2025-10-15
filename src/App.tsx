/**
 * Main Application Component
 * 
 * This is the root component of the Arabic Educational Platform.
 * It sets up all global providers, error boundaries, and routing configuration.
 * 
 * Features:
 * - Global error boundary for graceful error handling
 * - React Query for server state management
 * - Authentication context for user management
 * - Lazy loading for improved performance
 * - Site settings application
 * - Toast notifications system
 * 
 * @author Educational Platform Team
 * @version 1.0.0
 */

import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/lib/error-boundary";
import useSiteSettings from "@/hooks/useSiteSettings";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import EnhancedGameDataManagement from "./components/games/EnhancedGameDataManagement";
import { 
  LazyDashboard,
  LazyAuth,
  LazySuperAdminAuth,
  LazySchoolManagement,
  LazySchoolAdminManagement,
  LazyPluginManagement,
  LazyPackageManagement,
  LazyAcademicYears,
  LazyCalendarManagement,
  LazySchoolClasses,
  LazyUserManagement,
  LazySystemSettings,
  LazyProfileSettings,
  LazyContentManagement,
  LazyEducationalContent,
  LazyGrade10Management,
  LazyGrade11Management,
  LazyGrade12Management,
  LazyStudentManagement,
  LazyTest,
  LazyPairMatchingPage,
  LazyReports,
  withLazyLoading
} from "@/components/LazyComponents";

// Lazy load Grade 12 Project Editor and Landing Page
const Grade12ProjectEditorPage = React.lazy(() => import('@/pages/Grade12ProjectEditor'));
const Grade12ProjectsManagement = React.lazy(() => import('@/pages/Grade12ProjectsManagement'));
const Grade10ProjectEditorPage = React.lazy(() => import('@/pages/Grade10ProjectEditor'));
const LandingPage = React.lazy(() => import('@/pages/LandingPage'));
const KnowledgeAdventurePage = React.lazy(() => import('@/pages/KnowledgeAdventurePage'));
const StudentTrackingPage = React.lazy(() => import('@/pages/teacher/StudentTracking'));
const BadgeTestPage = React.lazy(() => import('@/pages/BadgeTestPage'));
const LazyGoogleDocsManagement = React.lazy(() => import('@/components/google-docs/GoogleDocsManagement'));
const StudentExamAttemptPage = React.lazy(() => import('@/pages/StudentExamAttempt'));
const StudentExamResultPage = React.lazy(() => import('@/pages/StudentExamResult'));
const GradeExamsAnalytics = React.lazy(() => import('@/pages/GradeExamsAnalytics'));
import { PageLoading } from "@/components/ui/LoadingComponents";

/**
 * Main App Component
 * 
 * Sets up the application routing with lazy-loaded components and fallback loading states.
 * Site settings are applied on mount for theme, language direction (RTL), and other global configurations.
 * 
 * @returns {JSX.Element} The main application component
 */
const App = () => {
  // Apply site settings when the application loads
  // This includes theme, language direction (RTL), and other global configurations
  useSiteSettings();

  return (
    // Global error boundary to catch and handle any unhandled errors
    <ErrorBoundary>
      {/* Tooltip provider for UI tooltips throughout the app */}
      <TooltipProvider>
        {/* Toast notification systems - dual system for flexibility */}
        <Toaster />
        <Sonner />
        {/* Suspense boundary for lazy-loaded components */}
        <Suspense fallback={<PageLoading message="Loading..." />}>
          <Routes>
              {/* Public routes */}
              <Route path="/" element={<Suspense fallback={<PageLoading message="لحظة.. منجهزلك الصفحة" />}><LandingPage /></Suspense>} />
              <Route path="/index2" element={<Index />} />
              
              {/* Authentication routes */}
              <Route path="/auth" element={<LazyAuth />} />
              <Route path="/super-admin-auth" element={<LazySuperAdminAuth />} />
              
              {/* Main dashboard */}
              <Route path="/dashboard" element={<LazyDashboard />} />
              
              {/* School management routes */}
              <Route path="/school-management" element={<LazySchoolManagement />} />
              <Route path="/school-admin-management" element={<LazySchoolAdminManagement />} />
              <Route path="/school-classes" element={<LazySchoolClasses />} />
              
              {/* Game data management - superadmin only */}
              <Route path="/game-data-management" element={<EnhancedGameDataManagement />} />
              
              {/* System management routes */}
              <Route path="/plugin-management" element={<LazyPluginManagement />} />
              <Route path="/package-management" element={<LazyPackageManagement />} />
               <Route path="/users" element={<LazyUserManagement />} />
               <Route path="/system-settings" element={<LazySystemSettings />} />
               <Route path="/profile-settings" element={<LazyProfileSettings />} />
              
               {/* Academic management routes */}
               <Route path="/academic-years" element={<LazyAcademicYears />} />
               <Route path="/calendar-management" element={<LazyCalendarManagement />} />
               <Route path="/students" element={<LazyStudentManagement />} />
               <Route path="/student-management" element={<LazyStudentManagement />} />
              
               {/* Content management routes - hierarchical structure */}
            <Route path="/content-management" element={<LazyContentManagement />} />
            <Route path="/google-docs" element={<LazyGoogleDocsManagement />} />
               <Route path="/educational-content" element={<LazyEducationalContent />} />
                <Route path="/grade10-management" element={<LazyGrade10Management />} />
                <Route path="/grade11-management" element={
                  <ErrorBoundary fallback={
                    <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
                      <div className="text-center">
                        <h2 className="text-xl font-bold text-red-600 mb-2">خطأ في تحميل الصف الحادي عشر</h2>
                        <p className="text-muted-foreground mb-4">حدث خطأ أثناء تحميل هذه الصفحة</p>
                        <button 
                          onClick={() => window.location.reload()}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
                        >
                          إعادة تحميل
                        </button>
                      </div>
                    </div>
                  }>
                    <Suspense fallback={<PageLoading message="جاري تحميل محتوى الصف الحادي عشر..." />}>
                      <LazyGrade11Management />
                    </Suspense>
                  </ErrorBoundary>
                } />
                 <Route path="/grade12-management" element={<LazyGrade12Management />} />
                 <Route 
                   path="/grade12-project-editor/:projectId" 
                   element={<Suspense fallback={<PageLoading message="جاري تحميل محرر المشروع..." />}><Grade12ProjectEditorPage /></Suspense>} 
                 />
                 <Route 
                   path="/grade12-projects-management" 
                   element={<Suspense fallback={<PageLoading message="جاري تحميل إدارة المشاريع..." />}><Grade12ProjectsManagement /></Suspense>} 
                 />
                 <Route 
                   path="/grade10-project-editor/:projectId" 
                   element={<Suspense fallback={<PageLoading message="جاري تحميل محرر المشروع..." />}><Grade10ProjectEditorPage /></Suspense>} 
                 />
               
               {/* Teacher routes */}
               <Route 
                 path="/teacher/student-tracking" 
                 element={<Suspense fallback={<PageLoading message="جاري تحميل تتبع الطلاب..." />}><StudentTrackingPage /></Suspense>} 
               />
               
               {/* Student Exam routes */}
               <Route 
                 path="/student/exam/:examId" 
                 element={<Suspense fallback={<PageLoading message="جاري تحميل الامتحان..." />}><StudentExamAttemptPage /></Suspense>} 
               />
               <Route 
                 path="/student/exam-result/:attemptId" 
                 element={<Suspense fallback={<PageLoading message="جاري تحميل النتيجة..." />}><StudentExamResultPage /></Suspense>} 
               />
               
               {/* Exams Analytics routes */}
               <Route 
                 path="/exams-analytics/:grade" 
                 element={<Suspense fallback={<PageLoading message="جاري تحميل إحصائيات الامتحانات..." />}><GradeExamsAnalytics /></Suspense>} 
               />
               
                 {/* Game routes */}
               <Route path="/pair-matching/:gameId?" element={<LazyPairMatchingPage />} />
               <Route path="/knowledge-adventure" element={
                 <Suspense fallback={<PageLoading message="جاري تحميل مغامرة المعرفة..." />}>
                   <KnowledgeAdventurePage />
                 </Suspense>
               } />
              
               {/* Question management for interactive games */}
                <Route path="/question-management" element={<LazyTest />} />
                
                {/* Reports dashboard route */}
                <Route path="/reports" element={<Suspense fallback={<PageLoading message="جاري تحميل التقارير..." />}><LazyReports /></Suspense>} />
               
               {/* Badge testing page - superadmin only */}
                <Route path="/badge-test" element={<Suspense fallback={<PageLoading message="جاري تحميل صفحة الاختبار..." />}><BadgeTestPage /></Suspense>} />
               
               {/* Development and testing routes */}
                <Route path="/test" element={<LazyTest />} />
              
              {/* IMPORTANT: Keep catch-all route last - handles 404 errors */}
              <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        </TooltipProvider>
    </ErrorBoundary>
  );
};

export default App;
