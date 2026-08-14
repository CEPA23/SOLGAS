import type { Captcha, LoginRequest, Partner } from '../types/auth';
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5080';
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, { credentials: 'include', ...options, headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message ?? 'No pudimos procesar su solicitud. Intente nuevamente.');
  return body;
}
export const authService = {
  captcha: () => request<Captcha>('/api/auth/captcha'),
  login: (data: LoginRequest) => request<{ success: boolean; partner: Partner }>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request<{ partner: Partner }>('/api/auth/me'),
  logout: () => request('/api/auth/logout', { method: 'POST' })
};
