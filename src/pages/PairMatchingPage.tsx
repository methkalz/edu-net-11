import React from 'react';
import { useParams } from 'react-router-dom';
import AppHeader from '@/components/shared/AppHeader';
import AppFooter from '@/components/shared/AppFooter';
import { PairMatchingGame } from '@/components/games/PairMatchingGame';

const PairMatchingPage: React.FC = () => {
  const { gameId } = useParams<{ gameId?: string }>();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex flex-col">
      <AppHeader 
        title="لعبة مطابقة الكلمات" 
        showBackButton={true} 
        backPath="/content-management/grade-11" 
        showLogout={true} 
      />
      
      <main className="container mx-auto px-6 py-8 flex-1">
        <div className="max-w-7xl mx-auto">
          <PairMatchingGame gameId={gameId} />
        </div>
      </main>
      
      <AppFooter />
    </div>
  );
};

export default PairMatchingPage;