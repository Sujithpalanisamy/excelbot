import { z } from 'zod';

export const FetchSingleSchema = z.object({
  bug_id: z.number().int().positive({ message: 'Bug ID must be a positive integer.' }),
});

export const FetchBulkSchema = z.object({
  bug_ids: z.array(z.number().int().positive()).optional(),
  input_text: z.string().optional(),
});

export const SummarizeSchema = z.object({
  bug_id: z.number().int().positive(),
  force_refresh: z.boolean().optional().default(false),
  use_local_only: z.boolean().optional().default(false),
});

export const PageClassificationUpdateSchema = z.object({
  bug_id: z.number().int().positive(),
  page_name: z.string().min(1, { message: 'Page name cannot be empty.' }),
});

export const SettingsUpdateSchema = z.object({
  server_url: z.string().optional(),
  organization: z.string().optional(),
  project: z.string().optional(),
  pat: z.string().optional(),
  mock_mode: z.boolean().optional(),
  ai_enabled: z.boolean().optional(),
  openai_api_key: z.string().optional(),
});

export const ChatRequestSchema = z.object({
  message: z.string().min(1, { message: 'Message cannot be empty.' }),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
        timestamp: z.string().optional(),
      })
    )
    .optional(),
});

export const SyncRequestSchema = z.object({
  mode: z.enum(['incremental', 'full']).optional().default('full'),
});

export const PageReportRequestSchema = z.object({
  page_name: z.string().min(1, { message: 'Page name cannot be empty.' }),
});
