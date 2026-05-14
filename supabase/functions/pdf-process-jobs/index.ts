import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getPDFComparisonSettings } from '../_shared/pdf-settings.ts';
import {
  extractMatchingSegments,
  calculateCoverage,
  type MatchedSegment,
} from '../_shared/pdf-helpers.ts';

const JOBS_PER_RUN = 3;
const PARALLEL_PER_RUN = 3; // العمليات أصبحت رياضية بحتة (cosine/jaccard) — آمن للتوازي

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // أخذ jobs من الطابور (atomic مع SKIP LOCKED)
    const { data: jobs, error: fetchError } = await supabase.rpc(
      'claim_pdf_jobs',
      { max_jobs: JOBS_PER_RUN }
    );

    if (fetchError) {
      // إذا لم تكن الـ function موجودة بعد، نستخدم fallback
      console.warn('RPC claim_pdf_jobs not found, using direct query');
    }

    // fallback: أخذ مباشر إذا لم تكن RPC متاحة
    let pendingJobs = jobs;
    if (!pendingJobs?.length) {
      const { data: directJobs } = await supabase
        .from('pdf_comparison_jobs')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(JOBS_PER_RUN);

      if (!directJobs?.length) {
        return new Response(
          JSON.stringify({ processed: 0, message: 'No pending jobs' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // تحديث الحالة
      const jobIds = directJobs.map(j => j.id);
      await supabase
        .from('pdf_comparison_jobs')
        .update({ status: 'processing', started_at: new Date().toISOString(), attempts: directJobs[0].attempts + 1 })
        .in('id', jobIds);

      pendingJobs = directJobs;
    }

    console.log(`🔄 Processing ${pendingJobs.length} jobs (parallel=${PARALLEL_PER_RUN})`);

    const settings = await getPDFComparisonSettings(supabase);
    let processedCount = 0;

    // معالجة بالتوازي بدفعات من PARALLEL_PER_RUN
    const processOne = async (job: any) => {
      try {
        switch (job.job_type) {
          case 'internal_shard':
            await processInternalShard(supabase, job, settings);
            break;
          case 'aggregate_internal':
            await processAggregateInternal(supabase, job, settings);
            break;
          case 'internal':
            // legacy — fail fast
            throw new Error('legacy internal job type — replaced by internal_shard');
          case 'repository':
            await processRepositoryComparison(supabase, job, settings);
            break;
          case 'add_to_repo':
            await processAddToRepo(supabase, job);
            break;
          default:
            throw new Error(`Unknown job_type: ${job.job_type}`);
        }

        await supabase
          .from('pdf_comparison_jobs')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', job.id);

        processedCount++;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`❌ Job ${job.id} (${job.job_type}) failed:`, errorMsg);

        const newStatus = (job.attempts || 0) >= (job.max_attempts || 3) ? 'failed' : 'pending';
        await supabase
          .from('pdf_comparison_jobs')
          .update({
            status: newStatus,
            error_message: errorMsg,
            processing_started_at: null,
          })
          .eq('id', job.id);
      }
    };

    for (let i = 0; i < pendingJobs.length; i += PARALLEL_PER_RUN) {
      const chunk = pendingJobs.slice(i, i + PARALLEL_PER_RUN);
      await Promise.all(chunk.map(processOne));
    }

    return new Response(
      JSON.stringify({ processed: processedCount, total: pendingJobs.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Process jobs error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ==========================================
// Sharded Internal Comparison
// ==========================================
// كل shard يستقبل قائمة أزواج (i,j) في payload ويحسب التشابه لكل زوج فقط
async function processInternalShard(supabase: any, job: any, settings: any) {
  const payload = job.payload || {};
  const pairs: Array<[number, number]> = payload.pairs || [];
  const shardIndex = payload.shard_index ?? 0;

  if (!pairs.length) {
    console.log(`⚠️ Shard ${shardIndex} has no pairs, skipping`);
    await supabase.from('pdf_comparison_shards').upsert({
      batch_id: job.batch_id,
      shard_index: shardIndex,
      pair_results: [],
      status: 'completed',
      completed_at: new Date().toISOString(),
    }, { onConflict: 'batch_id,shard_index' });
    return;
  }

  // جلب الملفات (نحتاج فقط الـ indices المستخدمة في هذا الـ shard)
  const usedIndices = new Set<number>();
  pairs.forEach(([i, j]) => { usedIndices.add(i); usedIndices.add(j); });

  const { data: results, error } = await supabase
    .from('pdf_comparison_results')
    .select('id, compared_file_name, compared_file_hash, compared_extracted_text, compared_file_pages, embedding, top_keywords')
    .eq('batch_id', job.batch_id)
    .order('created_at', { ascending: true });

  if (error || !results?.length) {
    throw new Error(`Failed to fetch results for batch ${job.batch_id}: ${error?.message}`);
  }

  const filesData = results.map((r: any) => ({
    id: r.id,
    name: r.compared_file_name,
    hash: r.compared_file_hash,
    text: r.compared_extracted_text,
    embedding: r.embedding || [],
    keywords: new Set<string>(r.top_keywords || []),
    wordCount: (r.compared_extracted_text || '').split(/\s+/).length,
    pageCount: r.compared_file_pages || 1,
  }));

  const pairResults: any[] = [];

  for (const [i, j] of pairs) {
    const f1 = filesData[i];
    const f2 = filesData[j];
    if (!f1 || !f2) continue;

    if (f1.hash === f2.hash) {
      pairResults.push({
        i, j,
        similarity_score: 1.0,
        similarity_method: 'hash_exact_match',
        flagged: true,
        matched_segments: [],
        metadata: { cosine: 1, jaccard: 1, length_similarity: 1, coverage_ratio: 1 },
      });
      continue;
    }

    // cosine
    let dotProduct = 0;
    const emb1 = f1.embedding;
    const emb2 = f2.embedding;
    if (emb1.length && emb2.length) {
      const len = Math.min(emb1.length, emb2.length);
      for (let k = 0; k < len; k++) dotProduct += emb1[k] * emb2[k];
    }
    const cosineSim = Math.max(0, Math.min(1, dotProduct));

    // jaccard
    let intersection = 0;
    for (const kw of f1.keywords) if (f2.keywords.has(kw)) intersection++;
    const union = f1.keywords.size + f2.keywords.size - intersection;
    const jaccardSim = union > 0 ? intersection / union : 0;

    // length
    const wordRatio = Math.min(f1.wordCount, f2.wordCount) / Math.max(f1.wordCount, f2.wordCount);
    const pageRatio = Math.min(f1.pageCount, f2.pageCount) / Math.max(f1.pageCount, f2.pageCount);
    const lengthSim = (wordRatio + pageRatio) / 2;

    // coverage gate
    let coverageRatio = 0;
    if (cosineSim + jaccardSim > 0.20 && f1.text && f2.text) {
      coverageRatio = calculateCoverage(f1.text, f2.text, settings.thresholds.paragraph_similarity_min);
    }

    const weights = settings.algorithm_weights;
    let finalSim = 0;
    if (jaccardSim < 0.15) {
      finalSim = cosineSim * (weights.cosine_weight * 0.6) +
                 jaccardSim * (weights.jaccard_weight * 1.5) +
                 lengthSim * (weights.length_weight * 1.0) +
                 coverageRatio * weights.coverage_weight;
    } else if (lengthSim < 0.5) {
      finalSim = (cosineSim * weights.cosine_weight +
                  jaccardSim * weights.jaccard_weight +
                  lengthSim * weights.length_weight +
                  coverageRatio * weights.coverage_weight) * 0.7;
    } else {
      finalSim = cosineSim * weights.cosine_weight +
                 jaccardSim * weights.jaccard_weight +
                 lengthSim * weights.length_weight +
                 coverageRatio * weights.coverage_weight;
    }

    if (coverageRatio >= settings.thresholds.coverage_high_threshold) {
      finalSim = Math.max(finalSim, 0.65);
    } else if (coverageRatio >= settings.thresholds.coverage_medium_threshold) {
      finalSim = Math.max(finalSim, 0.50);
    }

    finalSim = Math.round(finalSim * 100) / 100;
    const flagged = finalSim >= settings.thresholds.flagged_threshold;

    let segments: MatchedSegment[] = [];
    if (finalSim >= 0.35 && f1.text && f2.text) {
      segments = extractMatchingSegments(f1.text, f2.text).slice(0, 10);
    }

    pairResults.push({
      i, j,
      similarity_score: finalSim,
      similarity_method: 'hybrid_cosine_jaccard_length_coverage',
      flagged,
      matched_segments: segments,
      metadata: {
        cosine: Math.round(cosineSim * 100) / 100,
        jaccard: Math.round(jaccardSim * 100) / 100,
        length_similarity: Math.round(lengthSim * 100) / 100,
        coverage_ratio: Math.round(coverageRatio * 100) / 100,
      },
    });
  }

  await supabase.from('pdf_comparison_shards').upsert({
    batch_id: job.batch_id,
    shard_index: shardIndex,
    pair_results: pairResults,
    status: 'completed',
    completed_at: new Date().toISOString(),
  }, { onConflict: 'batch_id,shard_index' });

  console.log(`✅ Shard ${shardIndex} (batch ${job.batch_id}): ${pairResults.length} pair results`);
}

// ==========================================
// Aggregate Internal — يجمع كل الـ shards ويُنشئ نتائج لكل ملف + repository jobs
// ==========================================
async function processAggregateInternal(supabase: any, job: any, settings: any) {
  const totalShards = job.payload?.total_shards ?? 0;

  // فحص اكتمال كل الـ shards
  const { data: shards, error: shardsErr } = await supabase
    .from('pdf_comparison_shards')
    .select('shard_index, status, pair_results')
    .eq('batch_id', job.batch_id);

  if (shardsErr) throw new Error(`Failed to fetch shards: ${shardsErr.message}`);

  const completedCount = (shards || []).filter((s: any) => s.status === 'completed').length;
  if (completedCount < totalShards) {
    // إعادة الجدولة — الـ shards لم تنتهِ بعد
    throw new Error(`Waiting for shards: ${completedCount}/${totalShards} completed`);
  }

  console.log(`🧮 Aggregating ${totalShards} shards for batch ${job.batch_id}`);

  // جلب الملفات بالترتيب الصحيح (نفس ترتيب الـ enqueue)
  const { data: results } = await supabase
    .from('pdf_comparison_results')
    .select('id, compared_file_name')
    .eq('batch_id', job.batch_id)
    .order('created_at', { ascending: true });

  if (!results?.length) throw new Error('No results found for batch');

  const N = results.length;
  const matchesMap: Record<string, any[]> = {};
  results.forEach((r: any) => { matchesMap[r.id] = []; });

  // جمع كل الـ pair_results من جميع الـ shards
  for (const shard of shards || []) {
    for (const pr of shard.pair_results || []) {
      const f1 = results[pr.i];
      const f2 = results[pr.j];
      if (!f1 || !f2) continue;
      const matchData = {
        similarity_score: pr.similarity_score,
        similarity_method: pr.similarity_method,
        flagged: pr.flagged,
        matched_segments: pr.matched_segments,
        metadata: pr.metadata,
      };
      matchesMap[f1.id].push({ ...matchData, matched_file_name: f2.compared_file_name });
      matchesMap[f2.id].push({ ...matchData, matched_file_name: f1.compared_file_name });
    }
  }

  // تحديث صف كل ملف
  for (const file of results) {
    const matches = matchesMap[file.id]
      .sort((a: any, b: any) => b.similarity_score - a.similarity_score)
      .slice(0, 5);

    const maxSim = matches.length > 0 ? Math.max(...matches.map((m: any) => m.similarity_score)) : 0;
    const highRisk = matches.filter((m: any) => m.flagged).length;

    let status = 'safe';
    if (maxSim >= settings.thresholds.flagged_threshold) status = 'flagged';
    else if (maxSim >= settings.thresholds.warning_threshold) status = 'warning';

    await supabase
      .from('pdf_comparison_results')
      .update({
        internal_matches: matches,
        internal_max_similarity: maxSim,
        internal_high_risk_count: highRisk,
        batch_status: 'internal_done',
        status,
        max_similarity_score: maxSim,
        total_matches_found: matches.length,
        high_risk_matches: highRisk,
        matches: matches,
        comparison_source: 'internal',
        progress_phase: 'repository',
        progress_percent: 50,
      })
      .eq('id', file.id);
  }

  // إنشاء repository jobs (واحد لكل ملف)
  const repoJobs = [];
  for (let i = 0; i < N; i++) {
    repoJobs.push({
      batch_id: job.batch_id,
      job_type: 'repository',
      status: 'pending',
      file_index: i,
      grade_level: job.grade_level,
      comparison_type: job.comparison_type,
      requested_by: job.requested_by,
      school_id: job.school_id,
    });
  }
  if (repoJobs.length) await supabase.from('pdf_comparison_jobs').insert(repoJobs);

  // تنظيف الـ shards (لم نعد بحاجة لها)
  await supabase.from('pdf_comparison_shards').delete().eq('batch_id', job.batch_id);

  console.log(`✅ Aggregated ${N} files, created ${repoJobs.length} repository jobs`);
}

// ==========================================
// مقارنة ملف واحد مع المستودع
// ==========================================
async function processRepositoryComparison(
  supabase: any,
  job: any,
  settings: any
) {
  // جلب result row لهذا الملف
  const { data: results } = await supabase
    .from('pdf_comparison_results')
    .select('id, compared_file_name, compared_file_hash, compared_extracted_text, compared_file_pages, embedding, top_keywords')
    .eq('batch_id', job.batch_id)
    .order('created_at', { ascending: true });

  const result = results?.[job.file_index];
  if (!result) throw new Error(`No result found at index ${job.file_index} for batch ${job.batch_id}`);

  console.log(`🔍 Repository comparison for ${result.compared_file_name}`);

  const queryEmbedding = result.embedding || [];
  const queryKeywords = result.top_keywords || [];
  const fileText = result.compared_extracted_text || '';
  const wordCount = fileText.split(/\s+/).length;
  const pageCount = result.compared_file_pages || 1;

  // بحث pgvector — أقرب 100 candidate (مطابق للنظام القديم)
  const { data: matches, error: rpcError } = await supabase.rpc(
    'match_documents_hybrid',
    {
      query_embedding: queryEmbedding,
      query_keywords: queryKeywords,
      match_threshold: settings.thresholds.repository_display * 0.7,
      match_count: 100,
      p_grade_level: job.grade_level,
      p_project_type: job.comparison_type,
      jaccard_threshold: settings.thresholds.repository_display * 0.6,
      p_page_count: pageCount,
      p_word_count: wordCount,
    }
  );

  if (rpcError) {
    console.error('RPC error:', rpcError);
    throw new Error(`فشل بحث المستودع: ${rpcError.message}`);
  }

  // استبعاد ملفات الدفعة الحالية (لم تُضف للمستودع بعد — لكن احتياطاً)
  const { data: batchHashes } = await supabase
    .from('pdf_comparison_results')
    .select('compared_file_hash')
    .eq('batch_id', job.batch_id);
  const batchHashSet = new Set((batchHashes || []).map((r: any) => r.compared_file_hash));

  const filteredMatches = (matches || []).filter(
    (m: any) => !batchHashSet.has(m.text_hash)
  );

  if (!filteredMatches.length) {
    console.log(`ℹ️ No repository matches for ${result.compared_file_name}`);
    await updateRepositoryResult(supabase, result, [], settings, job.batch_id);
    await checkRepositoryPhaseComplete(supabase, job);
    return;
  }

  // جلب نصوص الـ candidates دفعة واحدة (إصلاح N+1)
  const matchIds = filteredMatches.map((m: any) => m.id);
  const { data: repoTexts } = await supabase
    .from('pdf_comparison_repository')
    .select('id, extracted_text')
    .in('id', matchIds);

  const textMap = new Map((repoTexts || []).map((r: any) => [r.id, r.extracted_text]));

  // حساب similarity + coverage
  const repoMatches = filteredMatches.map((match: any) => {
    const cosineSim = match.cosine_similarity ?? match.similarity ?? 0;
    const jaccardSim = match.jaccard_similarity ?? 0;
    const lengthSim = match.length_similarity ?? 1;

    let coverageRatio = 0;
    const repoText = textMap.get(match.id);
    if (fileText && repoText && (cosineSim + jaccardSim > 0.20)) {
      coverageRatio = calculateCoverage(fileText, repoText, settings.thresholds.paragraph_similarity_min);
    }

    let finalSim =
      cosineSim * settings.algorithm_weights.cosine_weight +
      jaccardSim * settings.algorithm_weights.jaccard_weight +
      lengthSim * settings.algorithm_weights.length_weight +
      coverageRatio * settings.algorithm_weights.coverage_weight;

    if (coverageRatio >= settings.thresholds.coverage_high_threshold) {
      finalSim = Math.max(finalSim, 0.65);
    } else if (coverageRatio >= settings.thresholds.coverage_medium_threshold) {
      finalSim = Math.max(finalSim, 0.50);
    }

    return {
      matched_file_id: match.id,
      matched_file_name: match.file_name,
      similarity_score: Math.round(finalSim * 100) / 100,
      similarity_method: 'hybrid_weighted_with_coverage',
      flagged: finalSim >= settings.thresholds.flagged_threshold,
      cosine_similarity: Math.round(cosineSim * 100) / 100,
      jaccard_similarity: Math.round(jaccardSim * 100) / 100,
      length_similarity: Math.round(lengthSim * 100) / 100,
      coverage_ratio: Math.round(coverageRatio * 100) / 100,
    };
  });

  const sortedMatches = repoMatches
    .filter((m: any) => m.similarity_score >= settings.thresholds.repository_display)
    .sort((a: any, b: any) => b.similarity_score - a.similarity_score)
    .slice(0, 5);

  await updateRepositoryResult(supabase, result, sortedMatches, settings, job.batch_id);
  await checkRepositoryPhaseComplete(supabase, job);

  console.log(`✅ Repository comparison done for ${result.compared_file_name}: ${sortedMatches.length} matches`);
}

async function updateRepositoryResult(
  supabase: any,
  result: any,
  repoMatches: any[],
  settings: any,
  batchId: string
) {
  const repoMaxSim = repoMatches.length > 0
    ? Math.max(...repoMatches.map((m: any) => m.similarity_score))
    : 0;
  const repoHighRisk = repoMatches.filter((m: any) => m.flagged).length;

  // جلب النتائج الداخلية الحالية
  const { data: current } = await supabase
    .from('pdf_comparison_results')
    .select('internal_max_similarity, internal_high_risk_count, internal_matches, status')
    .eq('id', result.id)
    .single();

  const internalMaxSim = current?.internal_max_similarity || 0;
  const overallMaxSim = Math.max(internalMaxSim, repoMaxSim);
  const internalMatches = current?.internal_matches || [];

  let newStatus = 'safe';
  if (overallMaxSim >= settings.thresholds.flagged_threshold) newStatus = 'flagged';
  else if (overallMaxSim >= settings.thresholds.warning_threshold) newStatus = 'warning';

  await supabase
    .from('pdf_comparison_results')
    .update({
      repository_matches: repoMatches,
      repository_max_similarity: repoMaxSim,
      repository_high_risk_count: repoHighRisk,
      comparison_source: 'both',
      batch_status: 'repository_done',
      status: newStatus,
      max_similarity_score: overallMaxSim,
      total_matches_found: internalMatches.length + repoMatches.length,
      high_risk_matches: (current?.internal_high_risk_count || 0) + repoHighRisk,
      matches: [...internalMatches, ...repoMatches].sort((a: any, b: any) => b.similarity_score - a.similarity_score).slice(0, 10),
    })
    .eq('id', result.id);
}

async function checkRepositoryPhaseComplete(supabase: any, job: any) {
  const { count } = await supabase
    .from('pdf_comparison_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('batch_id', job.batch_id)
    .eq('job_type', 'repository')
    .neq('status', 'completed');

  if (count === 0) {
    console.log(`🎉 All repository jobs done for batch ${job.batch_id}. Creating add_to_repo jobs.`);

    // عدد الملفات في الدفعة
    const { data: results } = await supabase
      .from('pdf_comparison_results')
      .select('id')
      .eq('batch_id', job.batch_id)
      .order('created_at', { ascending: true });

    for (let i = 0; i < (results?.length || 0); i++) {
      await supabase.from('pdf_comparison_jobs').insert({
        batch_id: job.batch_id,
        job_type: 'add_to_repo',
        status: 'pending',
        file_index: i,
        grade_level: job.grade_level,
        comparison_type: job.comparison_type,
        requested_by: job.requested_by,
        school_id: job.school_id,
      });
    }
  }
}

// ==========================================
// إضافة ملف واحد للمستودع
// ==========================================
async function processAddToRepo(supabase: any, job: any) {
  const { data: results } = await supabase
    .from('pdf_comparison_results')
    .select('id, compared_file_name, compared_file_path, compared_file_hash, compared_extracted_text, embedding, top_keywords')
    .eq('batch_id', job.batch_id)
    .order('created_at', { ascending: true });

  const result = results?.[job.file_index];
  if (!result) throw new Error(`No result at index ${job.file_index}`);

  console.log(`📤 Adding ${result.compared_file_name} to repository`);

  // استدعاء pdf-add-to-repository الموجودة
  const { data: addResult, error: addError } = await supabase.functions.invoke(
    'pdf-add-to-repository',
    {
      body: {
        filePath: result.compared_file_path,
        fileName: result.compared_file_name,
        bucket: 'pdf-comparison-temp',
        fileSize: 0,
        gradeLevel: job.grade_level,
        projectType: job.comparison_type,
        sourceProjectId: null,
        sourceProjectType: job.grade_level === '10' ? 'grade10_mini_project' : 'grade12_final_project',
        userId: job.requested_by,
        schoolId: job.school_id,
        extractedText: result.compared_extracted_text,
        textHash: result.compared_file_hash,
        wordCount: (result.compared_extracted_text || '').split(/\s+/).length,
      },
    }
  );

  if (addError) {
    console.warn(`⚠️ Add to repo failed for ${result.compared_file_name}: ${addError.message}`);
  }

  // تحديث result row
  await supabase
    .from('pdf_comparison_results')
    .update({
      batch_status: 'completed',
      added_to_repository: true,
      processing_time_ms: Date.now() - new Date(result.created_at || Date.now()).getTime(),
    })
    .eq('id', result.id);

  // فحص اكتمال الدفعة بالكامل
  const { count } = await supabase
    .from('pdf_comparison_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('batch_id', job.batch_id)
    .eq('job_type', 'add_to_repo')
    .neq('status', 'completed');

  // count سيكون 1 (الـ job الحالي لم يُعلّم بعد) أو أكثر
  // نفحص عدد الـ pending/processing (ماعدا الحالي)
  if (count !== null && count <= 1) {
    console.log(`🎉 Batch ${job.batch_id} fully completed!`);
  }
}
