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
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [emptyInvoiceSelected, setEmptyInvoiceSelected] = useState(false);
  const [selectedCredits, setSelectedCredits] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => { try { const current = await authService.compensation(); setData(current); setSelectedCredits(current.credits.map(item => item.id)); } catch { setError('No pudimos cargar la información de compensación.'); } };
  useEffect(() => { void load(); }, []);
  if (loading || !data) return <main className="compensation-page"><p>{error || 'Cargando…'}</p></main>;
  if (!partner) { window.location.href = '/login'; return null; }

  const selectedInvoiceRows = data.invoices.filter(item => selectedInvoices.includes(item.id));
  const totalDebt = data.invoices.reduce((sum, item) => sum + item.totalAmount, 0);
  const invoiceTotal = selectedInvoiceRows.reduce((sum, item) => sum + item.pendingAmount, 0);
  const selectedCreditTotal = data.credits.filter(item => selectedCredits.includes(item.id)).reduce((sum, item) => sum + item.availableAmount, 0);
  const resultingBalance = data.totalAvailableCredit - invoiceTotal;
  const canExecute = selectedInvoices.length > 0 && invoiceTotal > 0 && data.totalAvailableCredit > 0 && invoiceTotal <= selectedCreditTotal && !busy;
  const allInvoicesSelected = data.invoices.length > 0 && selectedInvoices.length === data.invoices.length;
  const allCreditsSelected = data.credits.length > 0 && selectedCredits.length === data.credits.length;
  const logout = async () => { await authService.logout(); window.location.href = '/login'; };
  const go = (label: string) => { if (label === 'INICIO') window.location.href = '/dashboard'; if (label === 'MIS PEDIDOS') window.location.href = '/orders'; if (label === 'MI NEGOCIO') window.location.href = '/business'; if (label === 'CAMBIAR INSTALACIÓN') window.location.href = '/select-installation'; if (label === 'MI PERFIL') window.location.href = '/profile'; };
  const toggleInvoice = (id: string) => { setMessage(''); setSelectedInvoices(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]); };
  const execute = async () => {
    if (!canExecute) return;
    const confirmed = window.confirm(`Facturas seleccionadas: ${selectedInvoices.length}\nTotal a compensar: ${money(invoiceTotal)}\nSaldo actual: ${money(data.totalAvailableCredit)}\nSaldo después de compensar: ${money(resultingBalance)}\n\n¿Deseas confirmar la compensación?`);
    if (!confirmed) return;
    setBusy(true); setError(''); setMessage('');
    try { const result = await authService.executeCompensation(selectedInvoices, selectedCredits, `Compensación de ${selectedInvoices.length} factura(s)`); await load(); setSelectedInvoices([]); setMessage(`Compensación realizada correctamente. Se aplicaron ${money(result.appliedAmount)} a ${result.compensatedInvoices.length} factura(s).`); } catch (e) { setError((e as Error).message || 'No pudimos ejecutar la compensación.'); } finally { setBusy(false); }
  };

  return <main className="compensation-page">
    <header className="portal-topbar"><div className="portal-logo"><img src={logo2} alt="Logo empresarial" /></div><div className="portal-greeting">HOLA, SOCIO ESTRATÉGICO</div><button className="portal-avatar" onClick={() => go('MI PERFIL')} aria-label="Abrir mi perfil"><img src={profileImage} alt="Perfil del socio" /></button><div className="portal-account"><span>NEGOCIOS Y TRANSPORTES PIZAN EIRL</span><i /><span>Código <strong>{partner.ruc}</strong></span><button onClick={logout}><LogOut size={14} /> Cerrar sesión</button><button className="portal-profile" onClick={() => go('MI PERFIL')}><UserRound size={16} /> MI PERFIL <ChevronDown size={14} /></button></div></header>
    <div className="compensation-banner" style={{ backgroundImage: `url(${banner})` }} /><nav className="portal-menu compensation-menu">{menu.map(([label, Icon]) => <button key={label} className={label === 'MI NEGOCIO' ? 'active' : ''} onClick={() => go(label)}><Icon size={19} /><span>{label}</span></button>)}</nav>
    <section className="compensation-content"><div className="compensation-breadcrumb">HOME <b>›</b> MI NEGOCIO <b>›</b> <strong>COMPENSACIÓN</strong></div><h1><img src={compensationImage} alt="" /> Haz tu compensación</h1><p className="compensation-intro">Realiza aquí tu compensación para mantener tu cuenta corriente Solgas ordenada.</p>
      <div className="balance-cards"><div><strong>SALDO A FAVOR</strong><span>{money(data.totalAvailableCredit)}</span></div><div><strong>DEUDA TOTAL</strong><span>{money(totalDebt)}</span></div><div><strong>DEUDA VENCIDA</strong><span>{money(data.overdueDebt)}</span></div></div>
      <div className="invoice-section"><h2>PASO 1: SELECCIONA LAS FACTURAS A COMPENSAR</h2><table><thead><tr><th><input type="checkbox" aria-label="Seleccionar todas las facturas" checked={allInvoicesSelected} onChange={() => setSelectedInvoices(allInvoicesSelected ? [] : data.invoices.map(item => item.id))} /></th><th>Referencia</th><th>Clase Documento</th><th>Fecha</th><th>Vencimiento</th><th>Importe</th><th>Percepción (S/)</th><th>Importe Total</th></tr></thead><tbody>{data.invoices.length === 0 ? <tr><td><input type="checkbox" aria-label="Seleccionar factura pendiente" checked={emptyInvoiceSelected} onChange={() => setEmptyInvoiceSelected(current => !current)} /></td><td colSpan={7}></td></tr> : data.invoices.map(item => <tr key={item.id}><td><input type="checkbox" aria-label={`Seleccionar factura ${item.reference}`} checked={selectedInvoices.includes(item.id)} onChange={() => toggleInvoice(item.id)} /></td><td><strong>{item.reference}</strong></td><td>{item.documentType}</td><td>{new Date(item.issueDate).toLocaleDateString('es-PE')}</td><td>{new Date(item.dueDate).toLocaleDateString('es-PE')}</td><td>{money(item.totalAmount - item.perception)}</td><td>{money(item.perception)}</td><td>{money(item.totalAmount)}</td></tr>)}</tbody></table></div>
      <div className="compensation-step"><h2>PASO 2: SELECCIONA LAS NOTAS DE CRÉDITO QUE DESEAS APLICAR SOBRE LA FACTURA</h2><table><thead><tr><th><input type="checkbox" aria-label="Seleccionar todos los créditos" checked={allCreditsSelected} onChange={() => setSelectedCredits(allCreditsSelected ? [] : data.credits.map(item => item.id))} /></th><th>Referencia</th><th>Clase Documento</th><th>Fecha</th><th>Vencimiento</th><th>Importe</th></tr></thead><tbody>{data.credits.map(item => <tr key={item.id}><td><input type="checkbox" aria-label={`Seleccionar crédito ${item.reference}`} checked={selectedCredits.includes(item.id)} onChange={() => setSelectedCredits(current => current.includes(item.id) ? current.filter(id => id !== item.id) : [...current, item.id])} /></td><td><strong>{item.reference}</strong></td><td>{item.documentType}</td><td>{new Date(item.date).toLocaleDateString('es-PE')}</td><td>{new Date(item.date).toLocaleDateString('es-PE')}</td><td>{money(-item.availableAmount)}</td></tr>)}</tbody></table></div>
      <div className="compensation-step"><h2>PASO 3: REVISA EL RESUMEN DE LA COMPENSACIÓN</h2><div className="summary-row"><span>Facturas:</span><span>{money(invoiceTotal)}</span></div><div className="summary-row"><span>Notas de crédito:</span><span>{money(selectedCreditTotal)}{selectedCredits.length > 0 ? ` (en ${selectedCredits.length} documentos)` : ''}</span></div><div className="summary-row"><span>Saldo pendiente:</span><span>{money(Math.max(0, resultingBalance))}</span></div>{error && <div className="compensation-warning">{error}</div>}{message && <div className="compensation-success">{message}</div>}{!error && !message && selectedInvoices.length === 0 && <div className="compensation-warning">No puedes ejecutar la compensación, comienza seleccionando una o más facturas</div>}{!error && !message && selectedInvoices.length > 0 && invoiceTotal > selectedCreditTotal && <div className="compensation-warning">El saldo a favor no es suficiente para cubrir las facturas seleccionadas.</div>}</div>
      <div className="compensation-step step-four"><h2>PASO 4: CONFIRMA LA OPERACIÓN</h2><button disabled={!canExecute} onClick={execute}>{busy ? 'Procesando…' : 'Ejecutar'}</button></div>
    </section><PortalFooter />
  </main>;
}
