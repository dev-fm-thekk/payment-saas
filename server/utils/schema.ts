import { z } from "zod";

export const UserSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  passwordHash: z.string(),
  name: z.string(),
  role: z.string(),
  isVerified: z.boolean(),
  createdAt: z.date(),
  updatedAt:z.date()
})

export const CompanySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  created_at: z.date(),
  user_id: z.uuid(),
})

export const CompanyServiceSchema = z.object({
  id: z.uuid(),
  companyId: z.uuid(),
  name: z.string(),
  currency: z.string(),
  createdAt: z.date(),
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

    console.log(result);
    if (!result.success) return { error: result.error, data: null };

    return { error: null, data: result.data };
}

export type UserType = z.infer<typeof UserSchema>
export type CompanyType = z.infer<typeof CompanySchema>
export type CompanyServiceType = z.infer<typeof CompanyServiceSchema>
export type CreateServiceType = z.infer<typeof CreateServiceSchema>
export type UpdateServiceType = z.infer<typeof UpdateServiceSchema>
export type ServiceReturnType = z.infer<typeof ServiceReturnSchema>
export type AccessPayloadType = z.infer<typeof AccessPayloadSchema>