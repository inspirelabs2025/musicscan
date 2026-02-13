import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface AiUsageLogEntry {
  function_name: string;
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  has_images?: boolean;
  image_count?: number;
  context_info?: Record<string, unknown>;
  duration_ms?: number;
  status?: string;
  error_message?: string;
}

// Cost per 1M tokens (approximate USD)
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'google/gemini-2.5-flash': { input: 0.15, output: 0.60 },
  'google/gemini-2.5-flash-lite': { input: 0.075, output: 0.30 },
  'google/gemini-2.5-flash-image': { input: 0.15, output: 0.60 },
  'google/gemini-2.5-pro': { input: 1.25, output: 10.00 },
  'google/gemini-3-flash-preview': { input: 0.15, output: 0.60 },
  'google/gemini-3-pro-preview': { input: 1.25, output: 10.00 },
  'google/gemini-3-pro-image-preview': { input: 1.25, output: 10.00 },
  'openai/gpt-5': { input: 5.00, output: 15.00 },
  'openai/gpt-5-mini': { input: 0.40, output: 1.60 },
  'openai/gpt-5-nano': { input: 0.10, output: 0.40 },
  'openai/gpt-5.2': { input: 5.00, output: 15.00 },
};

function estimateCost(model: string, inputTokens?: number, outputTokens?: number): number {
  const costs = MODEL_COSTS[model] || MODEL_COSTS['google/gemini-2.5-flash'];
  const inCost = ((inputTokens || 0) / 1_000_000) * costs.input;
  const outCost = ((outputTokens || 0) / 1_000_000) * costs.output;
  return Math.round((inCost + outCost) * 1_000_000) / 1_000_000; // 6 decimal precision
}

/**
 * Log an AI gateway call to the ai_usage_log table.
 * Call this after each fetch to the Lovable AI gateway.
 * 
 * Usage:
 * ```ts
 * const startTime = Date.now();
 * const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', { ... });
 * const data = await response.json();
 * await logAiUsage({
 *   function_name: 'analyze-vinyl-images',
 *   model: 'google/gemini-2.5-flash',
 *   input_tokens: data.usage?.prompt_tokens,
 *   output_tokens: data.usage?.completion_tokens,
 *   total_tokens: data.usage?.total_tokens,
 *   has_images: true,
 *   image_count: 2,
 *   duration_ms: Date.now() - startTime,
 * });
 * ```
 */
export async function logAiUsage(entry: AiUsageLogEntry): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const model = entry.model || 'google/gemini-2.5-flash';
    const estimatedCost = estimateCost(model, entry.input_tokens, entry.output_tokens);

    await supabase.from('ai_usage_log').insert({
      function_name: entry.function_name,
      model,
      input_tokens: entry.input_tokens,
      output_tokens: entry.output_tokens,
      total_tokens: entry.total_tokens || (entry.input_tokens || 0) + (entry.output_tokens || 0),
      estimated_cost_usd: estimatedCost,
      has_images: entry.has_images || false,
      image_count: entry.image_count || 0,
      context_info: entry.context_info || {},
      duration_ms: entry.duration_ms,
      status: entry.status || 'success',
      error_message: entry.error_message,
    });
  } catch (err) {
    // Don't let logging failures break the main flow
    console.error('Failed to log AI usage:', err);
  }
}

/**
 * Helper: wraps a fetch to the AI gateway and auto-logs usage.
 * Returns the parsed JSON response.
 */
export async function fetchAiWithLogging(
  functionName: string,
  requestBody: Record<string, unknown>,
  options?: {
    hasImages?: boolean;
    imageCount?: number;
    contextInfo?: Record<string, unknown>;
  }
): Promise<{ response: Response; startTime: number }> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) throw new Error('LOVABLE_API_KEY not configured');

  const startTime = Date.now();
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  return { response, startTime };
}

/**
 * Log usage from a completed AI response (non-streaming).
 * Call after parsing the JSON response.
 */
export async function logAiResponseUsage(
  functionName: string,
  model: string,
  responseData: Record<string, unknown>,
  startTime: number,
  options?: {
    hasImages?: boolean;
    imageCount?: number;
    contextInfo?: Record<string, unknown>;
    status?: string;
    errorMessage?: string;
  }
): Promise<void> {
  const usage = responseData.usage as { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined;
  
  await logAiUsage({
    function_name: functionName,
    model,
    input_tokens: usage?.prompt_tokens,
    output_tokens: usage?.completion_tokens,
    total_tokens: usage?.total_tokens,
    has_images: options?.hasImages,
    image_count: options?.imageCount,
    context_info: options?.contextInfo,
    duration_ms: Date.now() - startTime,
    status: options?.status || 'success',
    error_message: options?.errorMessage,
  });
}
