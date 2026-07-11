import { z } from "zod";

export const UserSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  passwordHash: z.string(),
  name: z.string(),
  role: z.string(),
  isVerified: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const CreateUserInputSchema = UserSchema.omit({
  id: true, createdAt: true, updatedAt: true, isVerified: true
})

export const UpdateUserInputSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  role: z.string().optional(),
  isVerified: z.boolean().optional(),
})

export const CompanySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  createdAt: z.date(),
  userId: z.uuid().nullable(),
})

export const CreateCompanyInputSchema = z.object({
  name: z.string().min(1),
  userId: z.uuid(),
})

export const UpdateCompanyInputSchema = z.object({
  name: z.string().min(1).optional(),
})

export const CompanyServiceSchema = z.object({
  id: z.uuid(),
  companyId: z.uuid(),
  name: z.string(),
  currency: z.string(),
  createdAt: z.date(),
})

export const CreateCompanyServiceInputSchema = z.object({
  companyId: z.uuid(),
  name: z.string().min(1),
  currency: z.string().length(3),
})

export const UpdateCompanyServiceInputSchema = z.object({
  name: z.string().min(1).optional(),
  currency: z.string().length(3).optional(),
})

export const ProviderConfigSchema = z.object({
  id: z.uuid(),
  serviceId: z.uuid(),
  provider: z.enum(['stripe', 'razorpay']),
  credentialsEncrypted: z.any(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const CreateProviderConfigInputSchema = z.object({
  serviceId: z.uuid(),
  provider: z.enum(['stripe', 'razorpay']),
  credentialsEncrypted: z.record(z.string(), z.any()),
})

export const UpdateProviderConfigInputSchema = z.object({
  credentialsEncrypted: z.record(z.string(), z.any()).optional(),
})

export const status = z.enum(['success', 'failed', 'pending'])

export const CreateServiceSchema = z.object({
  service: z.string(),
  status: status,
  error: z.string().optional()
})

export const UpdateServiceSchema = z.object({
  service: z.string(),
  status: status,
  reason: z.string().optional(),
  error: z.string().optional() 
})

export const serviceType = z.enum(['create', 'update', 'delete', 'read', 'login', 'logout', 'refresh'])

export const ServiceReturnSchema = z.object({
  service: z.string(),
  type: serviceType,
  status: status,
  payload: z.any().optional(),
  error: z.string().optional()
})

export const AccessPayloadSchema = z.object({
  id: z.uuid(),
  role: z.string(),
})

export function validateSchema(schema: z.ZodSchema<any>, input: any) {
    const result = schema.safeParse(input);
    if (!result.success) return { error: result.error, data: null };
    return { error: null, data: result.data };
}

export type UserType = z.infer<typeof UserSchema>
export type CreateUserInputType = z.infer<typeof CreateUserInputSchema>
export type UpdateUserInputType = z.infer<typeof UpdateUserInputSchema>
export type CompanyType = z.infer<typeof CompanySchema>
export type CreateCompanyInputType = z.infer<typeof CreateCompanyInputSchema>
export type UpdateCompanyInputType = z.infer<typeof UpdateCompanyInputSchema>
export type CompanyServiceType = z.infer<typeof CompanyServiceSchema>
export type CreateCompanyServiceInputType = z.infer<typeof CreateCompanyServiceInputSchema>
export type UpdateCompanyServiceInputType = z.infer<typeof UpdateCompanyServiceInputSchema>
export type ProviderConfigType = z.infer<typeof ProviderConfigSchema>
export type CreateProviderConfigInputType = z.infer<typeof CreateProviderConfigInputSchema>
export type UpdateProviderConfigInputType = z.infer<typeof UpdateProviderConfigInputSchema>

export type CreateServiceType = z.infer<typeof CreateServiceSchema>
export type UpdateServiceType = z.infer<typeof UpdateServiceSchema>
export type ServiceReturnType = z.infer<typeof ServiceReturnSchema>
export type AccessPayloadType = z.infer<typeof AccessPayloadSchema>