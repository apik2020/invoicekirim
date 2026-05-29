/**
 * Common Validation Schemas
 * Reusable Zod schemas for API validation
 */

import { z } from 'zod'

// ============================================================================
// SHARED/PRIMITIVE SCHEMAS
// ============================================================================

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
})

export const idSchema = z.string().min(1, 'ID tidak boleh kosong')

export const emailSchema = z.string().email('Email tidak valid')

export const phoneSchema = z.string()
  .regex(/^(\+62|62|0)[0-9]{9,12}$/, 'Nomor telepon tidak valid (format: 08xxx atau +62xxx)')
  .optional()

export const urlSchema = z.string().url('URL tidak valid').optional()

export const dateStringSchema = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: 'Format tanggal tidak valid' }
)

// ============================================================================
// CLIENT SCHEMAS
// ============================================================================

export const createClientSchema = z.object({
  name: z.string().min(1, 'Nama klien wajib diisi').max(200, 'Nama terlalu panjang'),
  email: emailSchema,
  phone: phoneSchema,
  address: z.string().max(500, 'Alamat terlalu panjang').optional(),
  companyName: z.string().max(200, 'Nama perusahaan terlalu panjang').optional(),
  taxNumber: z.string().max(50, 'Nomor pajak terlalu panjang').optional(),
  website: urlSchema,
  notes: z.string().max(1000, 'Catatan terlalu panjang').optional(),
})

export const updateClientSchema = createClientSchema.partial()

// ============================================================================
// ITEM SCHEMAS
// ============================================================================

export const createItemSchema = z.object({
  name: z.string().min(1, 'Nama item wajib diisi').max(200, 'Nama terlalu panjang'),
  description: z.string().max(1000, 'Deskripsi terlalu panjang').optional(),
  price: z.number().min(0, 'Harga tidak boleh negatif').max(1000000000000, 'Harga terlalu besar'),
  unit: z.string().max(20, 'Unit terlalu panjang').optional().default('pcs'),
  category: z.string().max(100, 'Kategori terlalu panjang').optional(),
  sku: z.string().max(100, 'SKU terlalu panjang').optional(),
})

export const updateItemSchema = createItemSchema.partial()

// ============================================================================
// USER PROFILE SCHEMAS
// ============================================================================

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(200, 'Nama terlalu panjang').optional(),
  email: emailSchema.optional(),
  phone: phoneSchema,
  companyName: z.string().max(200, 'Nama perusahaan terlalu panjang').optional(),
  address: z.string().max(500, 'Alamat terlalu panjang').optional(),
  taxNumber: z.string().max(50, 'Nomor pajak terlalu panjang').optional(),
  website: urlSchema,
})

// ============================================================================
// TEAM SCHEMAS
// ============================================================================

export const createTeamSchema = z.object({
  name: z.string().min(1, 'Nama tim wajib diisi').max(200, 'Nama terlalu panjang'),
  description: z.string().max(500, 'Deskripsi terlalu panjang').optional(),
})

export const updateTeamSchema = createTeamSchema.partial()

export const inviteTeamMemberSchema = z.object({
  email: emailSchema,
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'], {
    errorMap: () => ({ message: 'Role tidak valid' })
  }),
})

// ============================================================================
// PAYMENT SCHEMAS
// ============================================================================

export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID wajib diisi'),
  amount: z.number().min(0, 'Jumlah tidak boleh negatif'),
  method: z.enum(['va', 'qris', 'ewallet', 'bank_transfer', 'cash', 'other'], {
    errorMap: () => ({ message: 'Metode pembayaran tidak valid' })
  }).optional(),
  notes: z.string().max(500, 'Catatan terlalu panjang').optional(),
})

// ============================================================================
// INVOICE SCHEMAS (Basic - full schemas might be in separate file)
// ============================================================================

export const invoiceStatusSchema = z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELED'], {
  errorMap: () => ({ message: 'Status invoice tidak valid' })
})

export const invoiceFilterSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: invoiceStatusSchema.optional(),
  clientId: z.string().optional(),
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
})

// ============================================================================
// GENERIC CRUD SCHEMAS
// ============================================================================

/**
 * Generic ID param schema for routes like /api/resource/[id]
 */
export const idParamSchema = z.object({
  id: idSchema
})

/**
 * Generic bulk delete schema
 */
export const bulkDeleteSchema = z.object({
  ids: z.array(idSchema).min(1, 'Minimal 1 ID harus dipilih')
})

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validates request body with Zod schema and returns typed result
 * @example
 * const result = validateBody(createClientSchema, body)
 * if (!result.success) {
 *   return NextResponse.json({ error: result.error }, { status: 400 })
 * }
 * // result.data is now typed correctly
 */
export function validateBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; error: string; details?: Record<string, string[]> } {
  const validation = schema.safeParse(body)

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || 'Data tidak valid',
      details: validation.error.flatten().fieldErrors as Record<string, string[]>
    }
  }

  return {
    success: true,
    data: validation.data
  }
}

/**
 * Validates query parameters with Zod schema
 */
export function validateQuery<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): { success: true; data: T } | { success: false; error: string } {
  const params = Object.fromEntries(searchParams.entries())
  const validation = schema.safeParse(params)

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || 'Query parameters tidak valid'
    }
  }

  return {
    success: true,
    data: validation.data
  }
}
