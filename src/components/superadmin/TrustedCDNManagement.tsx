import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, AlertTriangle, Shield } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface TrustedCDN {
  id: string;
  domain: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export default function TrustedCDNManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // جلب جميع CDNs (للسوبر آدمن فقط)
  const { data: cdns, isLoading } = useQuery({
    queryKey: ['trusted-cdns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trusted_cdn_domains')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TrustedCDN[];
    },
  });

  // إضافة CDN جديد
  const addCDNMutation = useMutation({
    mutationFn: async ({ domain, description }: { domain: string; description: string }) => {
      const { data, error } = await supabase
        .from('trusted_cdn_domains')
        .insert([{ domain, description, is_active: true }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trusted-cdns'] });
      toast({
        title: 'تم الإضافة بنجاح',
        description: 'تم إضافة CDN الموثوق بنجاح',
      });
      setIsAddDialogOpen(false);
      setNewDomain('');
      setNewDescription('');
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في الإضافة',
        description: error.message || 'حدث خطأ أثناء إضافة CDN',
        variant: 'destructive',
      });
    },
  });

  // تفعيل/إلغاء تفعيل CDN
  const toggleCDNMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('trusted_cdn_domains')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trusted-cdns'] });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث حالة CDN بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في التحديث',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // حذف CDN
  const deleteCDNMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('trusted_cdn_domains')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trusted-cdns'] });
      toast({
        title: 'تم الحذف',
        description: 'تم حذف CDN بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في الحذف',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAddCDN = () => {
    if (!newDomain.trim()) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يجب إدخال عنوان النطاق',
        variant: 'destructive',
      });
      return;
    }

    // التحقق من صيغة النطاق
    const domainRegex = /^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?)*$/i;
    if (!domainRegex.test(newDomain)) {
      toast({
        title: 'صيغة خاطئة',
        description: 'يرجى إدخال نطاق صحيح (مثال: cdn.example.com)',
        variant: 'destructive',
      });
      return;
    }

    addCDNMutation.mutate({ domain: newDomain, description: newDescription });
  };

  const handleDelete = (id: string, domain: string) => {
    if (confirm(`هل أنت متأكد من حذف ${domain}؟`)) {
      deleteCDNMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">إدارة CDNs الموثوقة</h2>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة قائمة نطاقات CDN المسموح بتحميل JavaScript منها في محتوى HTML التفاعلي
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              إضافة CDN
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة CDN موثوق</DialogTitle>
              <DialogDescription>
                أضف نطاق CDN جديد للسماح بتحميل scripts منه
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="domain">النطاق (Domain) *</Label>
                <Input
                  id="domain"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value.trim())}
                  placeholder="مثال: cdnjs.cloudflare.com"
                  className="mt-1"
                  dir="ltr"
                />
              </div>
              <div>
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="وصف اختياري للـ CDN"
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleAddCDN} disabled={addCDNMutation.isPending}>
                {addCDNMutation.isPending ? 'جاري الإضافة...' : 'إضافة'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>ملاحظة أمنية</AlertTitle>
        <AlertDescription>
          يجب إضافة نطاقات CDN موثوقة فقط (مثل cdnjs.cloudflare.com، unpkg.com). 
          تجنب إضافة نطاقات غير معروفة لمنع هجمات supply chain attacks.
          جميع الـ scripts يجب أن تكون عبر HTTPS فقط.
        </AlertDescription>
      </Alert>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>النطاق</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ الإضافة</TableHead>
                <TableHead className="text-left">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cdns && cdns.length > 0 ? (
                cdns.map((cdn) => (
                  <TableRow key={cdn.id}>
                    <TableCell className="font-mono text-sm">{cdn.domain}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {cdn.description || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={cdn.is_active}
                          onCheckedChange={(checked) =>
                            toggleCDNMutation.mutate({ id: cdn.id, is_active: checked })
                          }
                        />
                        <span className="text-sm">
                          {cdn.is_active ? 'مفعّل' : 'معطّل'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(cdn.created_at).toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell className="text-left">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(cdn.id, cdn.domain)}
                        disabled={deleteCDNMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    لا توجد CDNs موثوقة. قم بإضافة CDN جديد للبدء.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
