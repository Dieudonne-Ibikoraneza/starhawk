import { useState } from 'react';
import { extractTextFromPdf } from '@/utils/pdfTextExtractor';

export type PdfValidationContext =
  | 'drone_analysis'
  | 'loss_evidence'
  | 'crop_monitoring';

export interface PdfValidationResult {
  relevant: boolean;
  reason: string;
  documentType: string;
  warning?: boolean;
}

const CONTEXT_PROMPTS: Record<PdfValidationContext, string> = {
  drone_analysis: `
You are a validator for an agricultural crop insurance platform in Rwanda.
The user is in the "Drone Analysis" section, where assessors upload drone/aerial analysis reports
(e.g., Agremo reports, Sentera reports, or similar precision agriculture PDF reports).
These documents typically contain: crop health indices (NDVI, NDRE, GNDVI), field zone maps,
vegetation stress analysis, growth stage assessments, or multi-spectral imagery analysis results.

CRITICAL INSTRUCTION: You MUST reject (relevant: false) any drone manuals, user guides, marketing materials, general specifications, or equipment manuals. Only accept actual agricultural analysis reports of a specific farm.
`,
  loss_evidence: `
You are a validator for an agricultural crop insurance platform in Rwanda.
The user is in the "Loss Evidence" section, where assessors upload field loss assessment reports.
These documents typically contain: crop damage descriptions, percentage of crop loss, field survey data,
disaster/event descriptions (drought, flood, pest), or loss quantification for insurance claims.

CRITICAL INSTRUCTION: You MUST reject (relevant: false) general manuals, articles, marketing materials, or unrelated documents.
`,
  crop_monitoring: `
You are a validator for an agricultural crop insurance platform in Rwanda.
The user is in the "Crop Monitoring" section, where assessors upload crop monitoring cycle reports.
These documents typically contain: crop growth monitoring data, vegetation indices over time,
crop development stages, monitoring cycle results, or agronomic field observations.

CRITICAL INSTRUCTION: You MUST reject (relevant: false) general manuals, articles, marketing materials, or unrelated documents.
`,
};

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

async function callGemini(text: string, context: PdfValidationContext): Promise<PdfValidationResult> {
  const contextDescription = CONTEXT_PROMPTS[context];

  const prompt = `${contextDescription}

The user just uploaded a PDF. Here is the extracted text from the first few pages:

--- START OF PDF ---
${text.substring(0, 6000)}
--- END OF PDF ---

Based on this content, determine if this PDF is relevant for the described section.

Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation outside JSON):
{
  "relevant": true or false,
  "documentType": "a short name describing what this document actually is (e.g. 'University Transcript', 'Agremo Drone Report', 'Bank Statement', 'Crop Loss Assessment')",
  "reason": "A clear, friendly one-sentence explanation for the user. If irrelevant, tell them what kind of document IS expected."
}`;

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 256,
      },
    }),
  });

  if (!response.ok) {
    console.warn(`Gemini API error: ${response.status}`);
    const errorBody = await response.text().catch(() => '');
    
    // Check if it's a quota error (429 Too Many Requests)
    if (response.status === 429 || errorBody.includes('quota') || errorBody.includes('RESOURCE_EXHAUSTED')) {
      return {
        relevant: true,
        documentType: 'Unvalidated PDF',
        reason: 'AI validation is currently unavailable due to quota limits. Proceeding with upload without validation.',
        warning: true,
      };
    }
    
    // Generic fallback for other API errors
    return {
      relevant: true,
      documentType: 'Unvalidated PDF',
      reason: `AI validation failed (Error ${response.status}). Proceeding with upload.`,
      warning: true,
    };
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  // Strip markdown code fences if present
  const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  
  try {
    return JSON.parse(cleaned) as PdfValidationResult;
  } catch {
    // If parsing fails, be permissive — let the upload through
    console.warn('usePdfValidator: Could not parse Gemini JSON response:', rawText);
    return {
      relevant: true,
      documentType: 'Unknown',
      reason: 'AI validation could not parse a result. Proceeding with upload.',
    };
  }
}

/**
 * Hook for AI-powered PDF relevance validation.
 * 
 * Usage:
 *   const { validating, validate } = usePdfValidator();
 *   const result = await validate(file, 'drone_analysis');
 *   if (!result.relevant) { show error and return; }
 */
export function usePdfValidator() {
  const [validating, setValidating] = useState(false);

  const validate = async (
    file: File,
    context: PdfValidationContext,
  ): Promise<PdfValidationResult> => {
    setValidating(true);
    try {
      // Step 1: Extract text from PDF
      let pdfText = '';
      try {
        pdfText = await extractTextFromPdf(file);
      } catch (extractErr: any) {
        console.warn('usePdfValidator: PDF text extraction failed:', extractErr);
        // If we can't extract text (e.g. scanned image PDF), be permissive
        return {
          relevant: true,
          documentType: 'Unreadable PDF',
          reason: `Could not extract text (${extractErr?.message || 'Unknown error'}). Proceeding with upload as it might be an image-only scan.`,
          warning: true,
        };
      }

      // Step 2: If very little text, be permissive
      if (pdfText.length < 80) {
        return {
          relevant: true,
          documentType: 'Sparse PDF',
          reason: 'Not enough text content to validate. Proceeding with upload.',
          warning: true,
        };
      }

      // Step 3: Ask Gemini
      if (!GEMINI_API_KEY) {
        console.warn('usePdfValidator: No VITE_GEMINI_API_KEY set. Skipping validation.');
        return { relevant: false, documentType: 'Unknown', reason: 'AI API key is missing. Contact support.' };
      }

      return await callGemini(pdfText, context);
    } finally {
      setValidating(false);
    }
  };

  return { validating, validate };
}
