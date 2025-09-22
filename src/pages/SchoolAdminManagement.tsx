import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import SchoolAdminManagement from '@/components/SchoolAdminManagement';
import AppHeader from '@/components/shared/AppHeader';
import AppFooter from '@/components/shared/AppFooter';
import { PageLoading } from '@/components/ui/LoadingComponents';

const SchoolAdminManagementPage = () => {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <PageLoading message="Loading..." />;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader 
        title="إدارة مدراء المدارس" 
        showBackButton={true} 
        showLogout={true} 
      />

      <main className="container mx-auto px-6 py-6 flex-1">
        <SchoolAdminManagement />
      </main>
      
      <AppFooter />
    </div>
  );
};

export default SchoolAdminManagementPage;