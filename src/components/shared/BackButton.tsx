import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface BackButtonProps {
  backPath?: string;
  className?: string;
}

export default function BackButton({ backPath = '/dashboard', className = '' }: BackButtonProps) {
  const navigate = useNavigate();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate(backPath)}
      className={`flex items-center gap-2 text-muted-foreground hover:text-foreground ${className}`}
    >
      <ArrowRight className="h-4 w-4" />
      <span>للخلف</span>
    </Button>
  );
}