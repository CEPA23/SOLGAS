import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import type { Compensation } from '../types/auth';
import logo2 from '../../../img/logo2.webp';
import profileImage from '../../../img/sinfoto.jpg';
import banner from '../../../img/banner_mis_pedidos.png';
import compensationImage from '../../../img/mis-pedidos-big.png';
import { PortalFooter } from '../components/PortalFooter';
import { ChevronDown, GraduationCap, LayoutGrid, LogOut, MessageSquare, ShoppingCart, Truck, UserRound, Calculator } from 'lucide-react';

const menu = [['INICIO', LayoutGrid], ['MIS PEDIDOS', ShoppingCart], ['MI NEGOCIO', Calculator], ['ACADEMIA SOLGAS', GraduationCap], ['APP REPARTIDOR', Truck], ['MI ASISTENTE', MessageSquare], ['POPUPS', LayoutGrid], ['MI TIENDA', ShoppingCart], ['WEB DIST', LayoutGrid], ['CAMBIAR INSTALACIÓN', UserRound]] as const;
const money = (value: number) => `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function CompensationPage() {
  const { partner, loading } = useAuth();
  const [data, setData] = useState<Compensation | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [emptyInvoiceSelected, setEmptyInvoiceSelected] = useState(false);
  const [selectedCredits, setSelectedCredits] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { authService.compensation().then(setData).catch(() => setError('No pudimos cargar la información de compensación.')); }, []);
  if (loading || !data) return <main className="compensation-page"><p>{error || 'Cargando…'}</p></main>;
  if (!partner) { window.location.href = '/login'; return null; }
  const invoice = data.invoices.find(item => item.id === selectedInvoice);
  const selectedCreditTotal = data.credits.filter(item => selectedCredits.includes(item.id)).reduce((sum, item) => sum + item.availableAmount, 0);
  const creditApplied = Math.min(invoice?.pendingAmount ?? 0, selectedCreditTotal);
  const pendingAmount = (invoice?.pendingAmount ?? 0) - selectedCreditTotal;
  const canExecute = Boolean(invoice && selectedCredits.length > 0 && creditApplied > 0 && !busy);
  const selectedCreditLabel = money(selectedCreditTotal);
  const logout = async () => { await authService.logout(); window.location.href = '/login'; };
  const go = (label: string) => { if (label === 'INICIO') window.location.href = '/dashboard'; if (label === 'MIS PEDIDOS') window.location.href = '/orders'; if (label === 'MI NEGOCIO') window.location.href = '/business'; if (label === 'CAMBIAR INSTALACIÓN') window.location.href = '/select-installation'; if (label === 'MI PERFIL') window.location.href = '/profile'; };
  const execute = async () => { if (!invoice || !canExecute) return; setBusy(true); setError(''); setMessage(''); try { await authService.executeCompensation(invoice.id, selectedCredits); const refreshed = await authService.compensation(); setData(refreshed); setSelectedInvoice(null); setSelectedCredits([]); setMessage('Compensación realizada correctamente.'); } catch (e) { setError((e as Error).message || 'No pudimos ejecutar la compensación.'); } finally { setBusy(false); } };
  return <main className="compensation-page">
    <header className="portal-topbar"><div className="portal-logo"><img src={logo2} alt="Logo empresarial"/></div><div className="portal-greeting">HOLA, SOCIO ESTRATÉGICO</div><button className="portal-avatar" onClick={() => go('MI PERFIL')} aria-label="Abrir mi perfil"><img src={profileImage} alt="Perfil del socio"/></button><div className="portal-account"><span>NEGOCIOS Y TRANSPORTES PIZAN EIRL</span><i/><span>Código <strong>{partner.ruc}</strong></span><button onClick={logout}><LogOut size={14}/> Cerrar sesión</button><button className="portal-profile" onClick={() => go('MI PERFIL')}><UserRound size={16}/> MI PERFIL <ChevronDown size={14}/></button></div></header>
    <div className="compensation-banner" style={{ backgroundImage: `url(${banner})` }}/><nav className="portal-menu compensation-menu">{menu.map(([label, Icon]) => <button key={label} className={label === 'MI NEGOCIO' ? 'active' : ''} onClick={() => go(label)}><Icon size={19}/><span>{label}</span></button>)}</nav>
    <section className="compensation-content"><div className="compensation-breadcrumb">HOME <b>›</b> MI NEGOCIO <b>›</b> <strong>COMPENSACIÓN</strong></div><h1><img src={compensationImage} alt=""/> Haz tu compensación</h1><p className="compensation-intro">Realiza aquí tu compensación para mantener tu cuenta corriente Solgas ordenada.</p>
      <div className="balance-cards"><div><strong>SALDO A FAVOR</strong><span>{money(data.totalAvailableCredit)}</span></div><div><strong>DEUDA TOTAL</strong><span>{money(data.totalDebt)}</span></div><div><strong>DEUDA VENCIDA</strong><span>{money(data.overdueDebt)}</span></div></div>
      <div className="invoice-section"><h2>PASO 1: SELECCIONA LA FACTURA A COMPENSAR</h2><table><thead><tr><th></th><th>Referencia</th><th>Clase Documento</th><th>Fecha</th><th>Vencimiento</th><th>Importe</th><th>Percepción (S/)</th><th>Importe Total</th></tr></thead><tbody><tr><td><input type="checkbox" aria-label="Seleccionar factura" checked={emptyInvoiceSelected} onChange={() => setEmptyInvoiceSelected(current => !current)} /></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr></tbody></table></div>
      <div className="compensation-step"><h2>PASO 2: SELECCIONA LAS NOTAS DE CRÉDITO QUE DESEAS APLICAR SOBRE LA FACTURA</h2><table><thead><tr><th></th><th>Referencia</th><th>Clase Documento</th><th>Fecha</th><th>Vencimiento</th><th>Importe</th></tr></thead><tbody>{data.credits.map(item => <tr key={item.id}><td><input type="checkbox" aria-label={`Seleccionar ${item.reference}`} checked={selectedCredits.includes(item.id)} onChange={() => { setMessage(''); setSelectedCredits(current => current.includes(item.id) ? current.filter(id => id !== item.id) : [...current, item.id]); }} /></td><td><strong>{item.reference}</strong></td><td>{item.documentType}</td><td>{new Date(item.date).toLocaleDateString('es-PE')}</td><td>{new Date(item.date).toLocaleDateString('es-PE')}</td><td>{money(-item.availableAmount)}</td></tr>)}</tbody></table></div>
      <div className="compensation-step"><h2>PASO 3: REVISA EL RESUMEN DE LA COMPENSACIÓN</h2><div className="summary-row"><span>Facturas:</span><span>{money(invoice?.pendingAmount ?? 0)}</span></div><div className="summary-row"><span>Notas de crédito:</span><span>{money(selectedCreditTotal)}{selectedCredits.length > 0 ? ` (en ${selectedCredits.length} documentos)` : ''}</span></div><div className="summary-row"><span>Saldo pendiente:</span><span>{money(pendingAmount)}</span></div>{error && <div className="compensation-warning">{error}</div>}{message && <div className="compensation-success">{message}</div>}{!error && !message && <div className="compensation-warning">{!invoice ? 'Selecciona una factura para continuar.' : !selectedCredits.length ? 'Selecciona al menos una nota de crédito para continuar.' : `Se aplicarán ${selectedCreditLabel} a la factura seleccionada.`}</div>}</div>
      <div className="compensation-step step-four"><h2>PASO 4: CONFIRMA LA OPERACIÓN</h2><button disabled={!canExecute} onClick={execute}>{busy ? 'Procesando…' : 'Ejecutar'}</button></div>
    </section><PortalFooter />
  </main>;
}
