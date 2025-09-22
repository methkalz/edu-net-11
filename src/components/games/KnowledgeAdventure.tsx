import React from 'react';
import LegacyKnowledgeAdventure from './LegacyKnowledgeAdventure';

/**
 * Legacy Knowledge Adventure Component Wrapper
 * 
 * This component now redirects to the legacy version which warns users
 * that this version doesn't use database integration.
 * Use KnowledgeAdventureRealContent for the modern database-integrated game.
 */
const KnowledgeAdventure: React.FC = () => {
  return <LegacyKnowledgeAdventure />;
};

export default KnowledgeAdventure;