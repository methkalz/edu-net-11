/**
 * Content Filter Badge Component
 * 
 * Displays a visual indicator when teacher content is filtered
 * based on assigned grades or school settings.
 * 
 * @author Educational Platform Team
 * @version 1.0.0
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Filter, Eye, EyeOff, BookOpen, Info } from 'lucide-react';

interface ContentFilterBadgeProps {
  allowedGrades: string[];
  totalPackageGrades: string[];
  restrictToAssigned: boolean;
  showAllContent: boolean;
  isVisible?: boolean;
}

export const ContentFilterBadge: React.FC<ContentFilterBadgeProps> = ({
  allowedGrades,
  totalPackageGrades,
  restrictToAssigned,
  showAllContent,
  isVisible = true
}) => {
  if (!isVisible || allowedGrades.length === 0) return null;

  const isFiltered = restrictToAssigned && !showAllContent;
  const hasAllGrades = allowedGrades.length === totalPackageGrades.length;

  if (!isFiltered && hasAllGrades) {
    return null; // No need to show badge if showing all content
  }

  return (
    <div className="space-y-2">
      {/* Main Filter Badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge 
          variant={isFiltered ? "secondary" : "default"} 
          className="flex items-center gap-1"
        >
          {isFiltered ? (
            <Filter className="h-3 w-3" />
          ) : (
            <Eye className="h-3 w-3" />
          )}
          {isFiltered 
            ? `مضامين صفوفي فقط (${allowedGrades.length} صفوف)`
            : `جميع المضامين (${allowedGrades.length} صفوف)`
          }
        </Badge>

        {/* Show specific grades */}
        <div className="flex items-center gap-1">
          <BookOpen className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">الصفوف:</span>
          {allowedGrades.map((grade) => (
            <Badge key={grade} variant="outline" className="text-xs">
              {grade}
            </Badge>
          ))}
        </div>
      </div>

      {/* Informational Alert */}
      {isFiltered && (
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            يتم عرض المضامين التعليمية للصفوف المخصصة لك فقط. 
            {allowedGrades.length < totalPackageGrades.length && (
              <span className="text-muted-foreground">
                {" "}({totalPackageGrades.length - allowedGrades.length} صفوف أخرى متاحة في الباقة)
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};