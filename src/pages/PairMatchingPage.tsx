import React from 'react';
import { useParams } from 'react-router-dom';
import AppHeader from '@/components/shared/AppHeader';
import AppFooter from '@/components/shared/AppFooter';
import { PairMatchingGame } from '@/components/games/PairMatchingGame';
import { useBackPath } from '@/hooks/useBackPath';

const PairMatchingPage: React.FC = () => {
  const { gameId } = useParams<{ gameId?: string }>();
  const { gameBackPath } = useBackPath();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex flex-col">
      <AppHeader 
        title="لعبة مطابقة الكلمات" 
        showBackButton={true} 
        backPath={gameBackPath} 
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