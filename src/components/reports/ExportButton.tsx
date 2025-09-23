/**
 * ExportButton Component - زر تصدير التقارير
 * 
 * مكون لتصدير التقارير بصيغ مختلفة (PDF, JSON, CSV)
 */

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileText, File, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

interface ExportButtonProps {
  data: any;
  filename: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ data, filename }) => {
  
  // تصدير بصيغة JSON
  const exportAsJSON = () => {
    try {
      const jsonData = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('تم تصدير التقرير بصيغة JSON بنجاح');
    } catch (error) {
      toast.error('حدث خطأ في تصدير التقرير');
    }
  };

  // تصدير بصيغة CSV
  const exportAsCSV = () => {
    try {
      const headers = Object.keys(data).join(',');
      const values = Object.values(data).join(',');
      const csvContent = `${headers}\n${values}`;
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('تم تصدير التقرير بصيغة CSV بنجاح');
    } catch (error) {
      toast.error('حدث خطأ في تصدير التقرير');
    }
  };

  // تصدير بصيغة PDF (مبسط)
  const exportAsPDF = () => {
    try {
      // إنشاء محتوى HTML للتقرير
      const htmlContent = `
        <html dir="rtl">
          <head>
            <meta charset="utf-8">
            <title>تقرير النظام</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
              .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; padding: 20px; }
              .stat-item { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
              .stat-value { font-size: 24px; font-weight: bold; color: #667eea; }
              .stat-label { color: #666; margin-top: 5px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>تقرير الإحصائيات</h1>
              <p>تم الإنشاء في: ${new Date().toLocaleDateString('ar-SA')}</p>
            </div>
            <div class="stats">
              <div class="stat-item">
                <div class="stat-value">${data.totalUsers}</div>
                <div class="stat-label">إجمالي المستخدمين</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">${data.activeUsers}</div>
                <div class="stat-label">المستخدمين النشطين</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">${data.totalContent}</div>
                <div class="stat-label">إجمالي المحتوى</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">${data.averageScore}%</div>
                <div class="stat-label">متوسط النقاط</div>
              </div>
            </div>
          </body>
        </html>
      `;

      // فتح نافذة جديدة للطباعة
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
      
      toast.success('تم فتح التقرير للطباعة كـ PDF');
    } catch (error) {
      toast.error('حدث خطأ في تصدير التقرير');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          تصدير التقرير
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={exportAsPDF} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4" />
          تصدير كـ PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsJSON} className="gap-2 cursor-pointer">
          <File className="h-4 w-4" />
          تصدير كـ JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsCSV} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="h-4 w-4" />
          تصدير كـ CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};