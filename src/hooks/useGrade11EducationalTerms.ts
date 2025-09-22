import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface EducationalTerm {
  id: string;
  term_text: string;
  definition: string;
  term_type: 'concept' | 'device' | 'protocol' | 'technology';
  difficulty_level: 'easy' | 'medium' | 'hard';
  importance_level: number;
  section_id?: string;
  topic_id?: string;
  lesson_id?: string;
  extracted_from_content: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  approved_by?: string;
}

export interface ContentGameLink {
  id: string;
  game_id: string;
  section_id: string;
  topic_id?: string;
  lesson_id?: string;
  term_selection_criteria: {
    difficulty: string[];
    max_terms: number;
  };
  auto_generate_pairs: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface TermExtractionResult {
  extracted_terms: EducationalTerm[];
  success_count: number;
  total_processed: number;
}

export const useGrade11EducationalTerms = () => {
  const [terms, setTerms] = useState<EducationalTerm[]>([]);
  const [contentGameLinks, setContentGameLinks] = useState<ContentGameLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);

  // جلب المصطلحات التعليمية
  const fetchTerms = async (sectionId?: string, approved?: boolean) => {
    try {
      setLoading(true);
      let query = supabase
        .from('grade11_educational_terms')
        .select('*')
        .order('importance_level', { ascending: false });

      if (sectionId) {
        query = query.eq('section_id', sectionId);
      }

      if (approved !== undefined) {
        query = query.eq('is_approved', approved);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTerms(data as EducationalTerm[] || []);
    } catch (error) {
      logger.error('Error fetching educational terms', error as Error);
      toast.error('حدث خطأ في تحميل المصطلحات التعليمية');
    } finally {
      setLoading(false);
    }
  };

  // جلب روابط الألعاب بالمحتوى
  const fetchContentGameLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('grade11_content_games')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContentGameLinks(data as ContentGameLink[] || []);
    } catch (error) {
      logger.error('Error fetching content game links', error as Error);
      toast.error('حدث خطأ في تحميل روابط الألعاب');
    }
  };

  // استخراج المصطلحات من محتوى الدروس بذكاء
  const extractTermsFromContent = async (
    lessonId?: string,
    sectionId?: string,
    topicId?: string
  ): Promise<TermExtractionResult> => {
    try {
      setExtracting(true);
      
      // جلب المحتوى المحدد
      let contentQuery;
      if (lessonId) {
        contentQuery = supabase
          .from('grade11_lessons')
          .select('id, title, content, topic_id')
          .eq('id', lessonId);
      } else if (topicId) {
        contentQuery = supabase
          .from('grade11_lessons')
          .select('id, title, content, topic_id')
          .eq('topic_id', topicId);
      } else if (sectionId) {
        contentQuery = supabase
          .from('grade11_lessons')
          .select(`
            id, title, content, topic_id,
            grade11_topics!inner(section_id)
          `)
          .eq('grade11_topics.section_id', sectionId);
      } else {
        contentQuery = supabase
          .from('grade11_lessons')
          .select('id, title, content, topic_id');
      }

      const { data: lessons, error: lessonsError } = await contentQuery;
      if (lessonsError) throw lessonsError;

      const extractedTerms: EducationalTerm[] = [];
      let successCount = 0;

      for (const lesson of lessons || []) {
        if (!lesson.content) continue;

        // تحليل ذكي للمحتوى لاستخراج المصطلحات
        const terms = analyzeContentForTerms(lesson.content, lesson.title);
        
        for (const term of terms) {
          try {
            const { data: insertedTerm, error: insertError } = await supabase
              .from('grade11_educational_terms')
              .insert({
                term_text: term.term_text,
                definition: term.definition,
                term_type: term.term_type,
                difficulty_level: term.difficulty_level,
                importance_level: term.importance_level,
                lesson_id: lesson.id,
                topic_id: lesson.topic_id,
                section_id: sectionId,
                extracted_from_content: true,
                is_approved: false
              })
              .select()
              .single();

            if (insertError) {
              // إذا كان المصطلح موجود، تجاهل الخطأ
              if (insertError.code !== '23505') {
                throw insertError;
              }
            } else {
              extractedTerms.push(insertedTerm as EducationalTerm);
              successCount++;
            }
          } catch (error) {
            logger.error(`Error inserting term: ${term.term_text}`, error as Error);
          }
        }
      }

      toast.success(`تم استخراج ${successCount} مصطلح جديد بنجاح`);
      await fetchTerms();

      return {
        extracted_terms: extractedTerms,
        success_count: successCount,
        total_processed: lessons?.length || 0
      };
    } catch (error) {
      logger.error('Error extracting terms from content', error as Error);
      toast.error('حدث خطأ في استخراج المصطلحات');
      throw error;
    } finally {
      setExtracting(false);
    }
  };

  // تحليل ذكي للمحتوى مع التركيز على منهج الشبكات للصف 11
  const analyzeContentForTerms = (content: string, lessonTitle: string) => {
    const extractedTerms = [];
    
    // قائمة المصطلحات المناسبة للصف الحادي عشر - الشبكات
    const networkingKeywords = [
      'شبكة', 'راوتر', 'سويتش', 'خادم', 'عميل', 'مضيف', 'بروتوكول',
      'IP', 'MAC', 'TCP', 'UDP', 'HTTP', 'HTTPS', 'DNS', 'DHCP',
      'OSI', 'طبقة', 'إيثرنت', 'كابل', 'لاسلكي', 'WiFi', 'LAN', 'WAN',
      'جدار ناري', 'أمان', 'تشفير', 'عنوان', 'توجيه', 'تحويل', 'اتصال',
      'router', 'switch', 'server', 'client', 'host', 'protocol',
      'ethernet', 'cable', 'wireless', 'firewall', 'network', 'address'
    ];
    
    // تحسين التعبيرات النمطية للبحث عن المصطلحات والتعريفات المتعلقة بالشبكات
    const definitionPatterns = [
      /(.+?)\s*(?:هو|هي|يعني|يقصد به|يُعرَّف|يُطلق على|يُسمى|عبارة عن)\s*(.+?)(?:\.|$)/g,
      /يمكن تعريف\s*(.+?)\s*(?:على أنه|بأنه|كونه)\s*(.+?)(?:\.|$)/g,
      /(.+?)\s*:\s*(.+?)(?:\.|$)/g,
      /مصطلح\s*(.+?)\s*يشير إلى\s*(.+?)(?:\.|$)/g,
      // إضافة أنماط للمصطلحات الإنجليزية مع تعريف عربي
      /([A-Za-z][A-Za-z0-9\-\/]*)\s*(?:هو|هي|يعني|يقصد به)\s*(.+?)(?:\.|$)/g,
      // أنماط للمصطلحات بين أقواس
      /([^\(]+)\s*\(([A-Za-z][A-Za-z0-9\-\/]*)\)\s*(?:هو|هي|يعني)\s*(.+?)(?:\.|$)/g,
    ];

    definitionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const term = match[1]?.trim();
        const definition = match[2]?.trim() || match[3]?.trim();
        
        // التحقق من أن المصطلح متعلق بالشبكات
        const isNetworkingTerm = networkingKeywords.some(keyword => 
          term?.toLowerCase().includes(keyword.toLowerCase()) || 
          definition?.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (term && definition && term.length > 1 && definition.length > 8 && isNetworkingTerm) {
          // تجنب المصطلحات المتقدمة جداً غير المناسبة للصف 11
          const advancedTerms = [
            'Heap', 'Hash Table', 'Binary Tree', 'AES', 'RSA', 'ALU', 'CPU Cache',
            'Machine Learning', 'AI', 'Blockchain', 'Quantum', 'Neural Network',
            'Assembly', 'Compiler', 'Virtual Memory', 'Page Fault'
          ];
          
          const isAdvanced = advancedTerms.some(advanced => 
            term?.includes(advanced) || definition?.includes(advanced)
          );
          
          if (!isAdvanced) {
            const termType = determineTermType(term, definition, content);
            const difficulty = determineDifficulty(term, definition);
            const importance = determineImportance(term, definition, lessonTitle, content);
            
            extractedTerms.push({
              term_text: term,
              definition: definition,
              term_type: termType,
              difficulty_level: difficulty,
              importance_level: importance
            });
          }
        }
      }
    });

    // إزالة المصطلحات المكررة
    const uniqueTerms = extractedTerms.filter((term, index, self) => 
      index === self.findIndex(t => t.term_text.toLowerCase() === term.term_text.toLowerCase())
    );

    // ترتيب حسب الأهمية وتحديد العدد المناسب
    return uniqueTerms
      .sort((a, b) => b.importance_level - a.importance_level)
      .slice(0, 15); // تقليل العدد لضمان الجودة
  };

  // تحديد نوع المصطلح بناءً على السياق والمحتوى
  const determineTermType = (termText: string, definition: string, content: string): string => {
    const text = (termText + ' ' + definition + ' ' + content).toLowerCase();
    
    // أجهزة الشبكة
    const deviceKeywords = ['router', 'switch', 'hub', 'bridge', 'gateway', 'firewall', 'جهاز', 'أجهزة', 'راوتر', 'سويتش', 'خادم', 'حاسوب', 'مضيف', 'طرفية', 'وسيطة'];
    
    // البروتوكولات
    const protocolKeywords = ['tcp', 'udp', 'http', 'https', 'ftp', 'smtp', 'dns', 'dhcp', 'arp', 'icmp', 'بروتوكول', 'protocol'];
    
    // التقنيات والمفاهيم
    const technologyKeywords = ['lan', 'wan', 'internet', 'ethernet', 'wi-fi', 'vlan', 'vpn', 'nat', 'تقنية', 'نظام', 'خدمة', 'شبكة'];
    
    // طبقات النموذج
    const layerKeywords = ['osi', 'طبقة', 'layer', 'physical', 'data link', 'network', 'transport', 'session', 'presentation', 'application'];
    
    // الأمان
    const securityKeywords = ['firewall', 'encryption', 'security', 'authentication', 'authorization', 'أمان', 'تشفير', 'حماية'];

    if (deviceKeywords.some(keyword => text.includes(keyword))) return 'device';
    if (protocolKeywords.some(keyword => text.includes(keyword))) return 'protocol';
    if (layerKeywords.some(keyword => text.includes(keyword))) return 'layer';
    if (securityKeywords.some(keyword => text.includes(keyword))) return 'security';
    if (technologyKeywords.some(keyword => text.includes(keyword))) return 'technology';
    
    return 'concept';
  };

  // تحديد مستوى الصعوبة بناءً على المحتوى مع التركيز على التدرج الصحيح
  const determineDifficulty = (termText: string, definition: string): string => {
    const text = (termText + ' ' + definition).toLowerCase();
    
    // مصطلحات أساسية (سهلة) - الأقسام 1-6
    const basicTerms = [
      'حاسوب', 'شبكة', 'كابل', 'إنترنت', 'موقع', 'host', 'client', 'server',
      'راوتر', 'سويتش', 'خادم', 'عميل', 'مضيف', 'اتصال', 'جهاز', 'router', 'switch'
    ];
    
    // مصطلحات متوسطة - الأقسام 7-15
    const mediumTerms = [
      'بروتوكول', 'protocol', 'tcp', 'udp', 'ip', 'mac', 'ethernet', 'إيثرنت',
      'طبقة', 'layer', 'osi', 'عنوان', 'address', 'توجيه', 'routing'
    ];
    
    // مصطلحات متقدمة - الأقسام 16-22
    const advancedTerms = [
      'vlan', 'nat', 'arp', 'dhcp', 'dns', 'firewall', 'جدار ناري',
      'encryption', 'تشفير', 'security', 'أمان', 'wireless', 'لاسلكي'
    ];

    if (basicTerms.some(term => text.includes(term))) return 'easy';
    if (advancedTerms.some(term => text.includes(term))) return 'hard';
    if (mediumTerms.some(term => text.includes(term))) return 'medium';
    
    // تحديد افتراضي بناءً على طول التعريف ومدى تعقيده
    if (definition.length < 50) return 'easy';
    if (definition.length > 120) return 'hard';
    
    return 'medium';
  };

  // تحديد مستوى الأهمية بناءً على السياق والتكرار
  const determineImportance = (termText: string, definition: string, lessonTitle: string, content: string): number => {
    let importance = 3; // الأهمية الافتراضية
    
    // المصطلحات في عنوان الدرس أكثر أهمية
    if (lessonTitle.toLowerCase().includes(termText.toLowerCase())) importance += 2;
    
    // التكرار في المحتوى يزيد الأهمية
    const termOccurrences = (content.toLowerCase().match(new RegExp(termText.toLowerCase(), 'g')) || []).length;
    if (termOccurrences > 3) importance += 1;
    
    // المصطلحات التقنية الأساسية
    const coreTerms = ['lan', 'wan', 'tcp', 'ip', 'router', 'switch', 'osi', 'ethernet'];
    if (coreTerms.some(term => termText.toLowerCase().includes(term))) importance += 1;
    
    // المصطلحات بالإنجليزية غالباً مهمة
    if (/^[A-Z][A-Z0-9\-\/]*$/i.test(termText)) importance += 1;
    
    // تحديد الحد الأقصى والأدنى
    return Math.min(Math.max(importance, 1), 5);
  };

  // إنشاء لعبة مطابقة من المصطلحات
  const generateMatchingGameFromTerms = async (
    sectionId: string,
    gameTitle: string,
    criteria: {
      difficulty?: string[];
      max_terms?: number;
      term_types?: string[];
    } = {}
  ) => {
    try {
      // جلب المصطلحات المناسبة
      let query = supabase
        .from('grade11_educational_terms')
        .select('*')
        .eq('section_id', sectionId)
        .eq('is_approved', true);

      if (criteria.difficulty?.length) {
        query = query.in('difficulty_level', criteria.difficulty);
      }

      if (criteria.term_types?.length) {
        query = query.in('term_type', criteria.term_types);
      }

      const { data: availableTerms, error: termsError } = await query
        .order('importance_level', { ascending: false })
        .limit(criteria.max_terms || 8);

      if (termsError) throw termsError;

      if (!availableTerms || availableTerms.length < 4) {
        throw new Error('لا توجد مصطلحات كافية لإنشاء اللعبة');
      }

      // إنشاء اللعبة
      const { data: gameData, error: gameError } = await supabase
        .from('pair_matching_games')
        .insert({
          title: gameTitle,
          description: `لعبة مطابقة تعليمية مستندة إلى المحتوى التعليمي`,
          grade_level: '11',
          subject: 'networks',
          difficulty_level: criteria.difficulty?.[0] || 'medium',
          max_pairs: availableTerms.length,
          time_limit_seconds: Math.max(180, availableTerms.length * 30),
          is_active: true
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // إنشاء كلمات المطابقة
      const pairs = availableTerms.map((term, index) => ({
        game_id: gameData.id,
        left_content: term.term_text,
        right_content: term.definition,
        left_type: 'term',
        right_type: 'definition',
        explanation: `${term.term_text}: ${term.definition}`,
        order_index: index + 1
      }));

      const { error: pairsError } = await supabase
        .from('pair_matching_pairs')
        .insert(pairs);

      if (pairsError) throw pairsError;

      // ربط اللعبة بالمحتوى التعليمي
      const { error: linkError } = await supabase
        .from('grade11_content_games')
        .insert({
          game_id: gameData.id,
          section_id: sectionId,
          term_selection_criteria: {
            difficulty: criteria.difficulty || ['easy', 'medium'],
            max_terms: criteria.max_terms || 8
          },
          auto_generate_pairs: true,
          is_active: true
        });

      if (linkError) throw linkError;

      toast.success(`تم إنشاء لعبة "${gameTitle}" بنجاح مع ${availableTerms.length} زوج`);
      await fetchContentGameLinks();

      return gameData;
    } catch (error) {
      logger.error('Error generating matching game', error as Error);
      toast.error('حدث خطأ في إنشاء اللعبة');
      throw error;
    }
  };

  // الموافقة على المصطلحات
  const approveTerms = async (termIds: string[]) => {
    try {
      const { error } = await supabase
        .from('grade11_educational_terms')
        .update({ 
          is_approved: true,
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          updated_at: new Date().toISOString()
        })
        .in('id', termIds);

      if (error) throw error;

      toast.success(`تم الموافقة على ${termIds.length} مصطلح`);
      await fetchTerms();
    } catch (error) {
      logger.error('Error approving terms', error as Error);
      toast.error('حدث خطأ في الموافقة على المصطلحات');
    }
  };

  // حذف المصطلحات
  const deleteTerms = async (termIds: string[]) => {
    try {
      const { error } = await supabase
        .from('grade11_educational_terms')
        .delete()
        .in('id', termIds);

      if (error) throw error;

      toast.success(`تم حذف ${termIds.length} مصطلح`);
      await fetchTerms();
    } catch (error) {
      logger.error('Error deleting terms', error as Error);
      toast.error('حدث خطأ في حذف المصطلحات');
    }
  };

  // جلب المصطلحات لقسم معين
  const getTermsForSection = async (sectionId: string, approvedOnly: boolean = true) => {
    try {
      let query = supabase
        .from('grade11_educational_terms')
        .select('*')
        .eq('section_id', sectionId);

      if (approvedOnly) {
        query = query.eq('is_approved', true);
      }

      const { data, error } = await query
        .order('importance_level', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching terms for section', error as Error);
      return [];
    }
  };

  useEffect(() => {
    fetchTerms();
    fetchContentGameLinks();
  }, []);

  return {
    terms,
    contentGameLinks,
    loading,
    extracting,
    fetchTerms,
    fetchContentGameLinks,
    extractTermsFromContent,
    generateMatchingGameFromTerms,
    approveTerms,
    deleteTerms,
    getTermsForSection
  };
};