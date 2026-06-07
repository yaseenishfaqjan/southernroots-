export * from "./generated/api";
// types/ duplicates 10 *Body schema names as interfaces. Re-export the domain
// types from types/, but make api.ts (the zod schemas) authoritative for the
// overlapping names — their types are available via z.infer<typeof XBody>.
export type * from "./generated/types";
export {
  AssignJobBody,
  CreateEscalationBody,
  CreateInvoiceBody,
  CreateJobBody,
  CreateSubcontractorBody,
  UpdateAssignmentBody,
  UpdateEscalationBody,
  UpdateInvoiceStatusBody,
  UpdateJobBody,
  UpdateSubcontractorBody,
} from "./generated/api";
