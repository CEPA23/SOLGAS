export type Captcha = { captchaId: string; image: string };
export type Partner = { id: string; ruc: string; businessName: string };
export type LoginRequest = { ruc: string; password: string; captchaId: string; captchaAnswer: string; rememberMe: boolean };
export type CompensationInvoice = { id: string; reference: string; totalAmount: number; pendingAmount: number };
export type CompensationCredit = { id: string; reference: string; documentType: string; date: string; originalAmount: number; availableAmount: number };
export type Compensation = { totalAvailableCredit: number; totalDebt: number; overdueDebt: number; invoices: CompensationInvoice[]; credits: CompensationCredit[] };
export type CompensationExecution = { id: string; invoiceId: string; invoiceAmount: number; creditApplied: number; pendingAmount: number; unusedCredit: number };
