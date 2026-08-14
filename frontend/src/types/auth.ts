export type Captcha = { captchaId: string; image: string };
export type Partner = { id: string; ruc: string; businessName: string };
export type LoginRequest = { ruc: string; password: string; captchaId: string; captchaAnswer: string; rememberMe: boolean };
