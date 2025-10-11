import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, BookOpen, FileQuestion, ClipboardList } from 'lucide-react';
import { QuestionBankManager } from './QuestionBankManager';
import { ExamCreator } from './ExamCreator';
import { ExamsList } from './ExamsList';

export const ExamManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('exams');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <ClipboardList className="w-6 h-6" />
            إدارة الامتحانات الإلكترونية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="exams" className="gap-2">
                <ClipboardList className="w-4 h-4" />
                الامتحانات
              </TabsTrigger>
              <TabsTrigger value="questions" className="gap-2">
                <FileQuestion className="w-4 h-4" />
                بنك الأسئلة
              </TabsTrigger>
              <TabsTrigger value="create" className="gap-2">
                <Plus className="w-4 h-4" />
                إنشاء امتحان
              </TabsTrigger>
            </TabsList>

            <TabsContent value="exams" className="mt-6">
              <ExamsList />
            </TabsContent>

            <TabsContent value="questions" className="mt-6">
              <QuestionBankManager />
            </TabsContent>

            <TabsContent value="create" className="mt-6">
              <ExamCreator />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
