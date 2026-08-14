import { useEffect, useState } from 'react';
import { authService } from '../services/authService';
import type { Partner } from '../types/auth';
export function useAuth() { const [partner, setPartner] = useState<Partner | null>(null); const [loading, setLoading] = useState(true); useEffect(() => { authService.me().then(x => setPartner(x.partner)).catch(() => setPartner(null)).finally(() => setLoading(false)); }, []); return { partner, loading, setPartner }; }
