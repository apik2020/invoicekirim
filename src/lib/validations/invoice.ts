import { z } from 'zod'

export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Deskripsi item harus diisi'),
  quantity: z.number().min(1, 'Quantity minimal 1'),
  price: z.number().min(0, 'Harga tidak boleh negatif'),
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
})

export const invoiceUpdateSchema = invoiceSchema.partial()

export const templateSchema = z.object({
  name: z.string().min(1, 'Nama template harus diisi'),
  description: z.string().optional(),
  taxRate: z.number().min(0).max(100).default(11),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'Minimal 1 item harus diisi'),
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
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
})

export type CreateInvoiceInput = z.infer<typeof invoiceSchema>
export type UpdateInvoiceInput = z.infer<typeof invoiceUpdateSchema>
export type CreateTemplateInput = z.infer<typeof templateSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
