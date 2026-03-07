import { z } from 'zod'

export const invoiceItemSchema = z.object({
  id: z.string().optional(), // Allow id field from client
  description: z.string().min(1, 'Deskripsi item harus diisi'),
  quantity: z.number().min(1, 'Quantity minimal 1'),
  price: z.number().min(0, 'Harga tidak boleh negatif'),
  priceFormatted: z.string().optional(), // Allow formatted price from client
})

export const templateSettingsSchema = z.object({
  showClientInfo: z.boolean().optional().default(true),
  showDiscount: z.boolean().optional().default(false),
  showAdditionalDiscount: z.boolean().optional().default(false),
  showTax: z.boolean().optional().default(true),
  showSignature: z.boolean().optional().default(false),
})

export const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Nomor invoice harus diisi'),
  date: z.string().min(1, 'Tanggal harus diisi'),
  dueDate: z.string().optional(),
  companyName: z.string().min(1, 'Nama perusahaan harus diisi'),
  companyEmail: z.string().email('Email perusahaan tidak valid'),
  companyPhone: z.string().optional(),
  companyAddress: z.string().optional(),
  clientName: z.string().min(1, 'Nama klien harus diisi'),
  clientEmail: z.string().email('Email klien tidak valid'),
  clientPhone: z.string().optional(),
  clientAddress: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'Minimal 1 item harus diisi'),
  notes: z.string().optional(),
  taxRate: z.number().min(0).max(100).default(11),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELED']).optional(),
  // New fields for template settings
  settings: templateSettingsSchema.optional().nullable(),
  termsAndConditions: z.string().optional().nullable(),
  signatureUrl: z.string().optional().nullable(),
  signatoryName: z.string().optional().nullable(),
  signatoryTitle: z.string().optional().nullable(),
  discountType: z.enum(['percentage', 'fixed']).optional().nullable(),
  discountValue: z.number().min(0).optional().nullable(),
  additionalDiscountType: z.enum(['percentage', 'fixed']).optional().nullable(),
  additionalDiscountValue: z.number().min(0).optional().nullable(),
})

export const invoiceUpdateSchema = invoiceSchema.partial()

export const templateSchema = z.object({
  name: z.string().min(1, 'Nama template harus diisi'),
  description: z.string().optional().nullable(),
  taxRate: z.number().min(0).max(100).default(11),
  notes: z.string().optional().nullable(),
  items: z.array(invoiceItemSchema).min(1, 'Minimal 1 item harus diisi'),
  // New fields for template settings
  settings: templateSettingsSchema.optional().nullable(),
  defaultClientId: z.string().optional().nullable(),
  termsAndConditions: z.string().optional().nullable(),
  signatureUrl: z.string().optional().nullable(),
  signatoryName: z.string().optional().nullable(),
  signatoryTitle: z.string().optional().nullable(),
  discountType: z.enum(['percentage', 'fixed']).optional().nullable(),
  discountValue: z.number().min(0).optional().nullable(),
  additionalDiscountType: z.enum(['percentage', 'fixed']).optional().nullable(),
  additionalDiscountValue: z.number().min(0).optional().nullable(),
})

export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

export const registerSchema = z.object({
  name: z.string().min(1, 'Nama harus diisi'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string(),
  plan: z.enum(['free', 'trial']).optional().default('trial'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
})

export type CreateInvoiceInput = z.infer<typeof invoiceSchema>
export type UpdateInvoiceInput = z.infer<typeof invoiceUpdateSchema>
export type CreateTemplateInput = z.infer<typeof templateSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
