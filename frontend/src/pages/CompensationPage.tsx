import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import logo2 from '../../../img/logo2.webp';
import profileImage from '../../../img/sinfoto.jpg';
import banner from '../../../img/banner_mis_pedidos.png';
import cylinderImage from '../../../img/mis-pedidos-big.png';
import { PortalFooter } from '../components/PortalFooter';
import { ChevronDown, GraduationCap, LayoutGrid, LogOut, MessageSquare, ShoppingCart, Truck, UserRound, Calculator } from 'lucide-react';

const menu = [['INICIO', LayoutGrid], ['MIS PEDIDOS', ShoppingCart], ['MI NEGOCIO', Calculator], ['ACADEMIA SOLGAS', GraduationCap], ['APP REPARTIDOR', Truck], ['MI ASISTENTE', MessageSquare], ['POPUPS', LayoutGrid], ['MI TIENDA', ShoppingCart], ['WEB DIST', LayoutGrid], ['CAMBIAR INSTALACIÓN', UserRound]] as const;
const invoices = [{ id: 'invoice-1', reference: '01-F326-00085995', type: 'Factura', date: '12/08/2026', dueDate: '13/08/2026', amount: 17320, perception: 346.4, total: 17666.4 }];
const creditNotes = [
  { id: 'credit-1', reference: 'Sin ref.', type: 'Saldo a favor', date: '11/08/2026', dueDate: '11/08/2026', amount: 314262.58 },
  { id: 'credit-2', reference: 'SALDO-A-FAVOR', type: 'Depósito bancario', date: '13/08/2026', dueDate: '13/08/2026', amount: 30000 },
  { id: 'credit-3', reference: 'SALDO-A-FAVOR', type: 'Depósito bancario', date: '13/08/2026', dueDate: '13/08/2026', amount: 30000 },
];
const initialCreditBalance = 374262.58;
const money = (value: number) => `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function CompensationPage() {
  const { partner, loading } = useAuth();
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [selectedCredits, setSelectedCredits] = useState<string[]>([]);
  const [executed, setExecuted] = useState(false);
  if (loading) return <main className="compensation-page"><p>Cargando…</p></main>;
  if (!partner) { window.location.href = '/login'; return null; }

  const invoiceTotal = selectedInvoice ? invoices.find(invoice => invoice.id === selectedInvoice)?.total ?? 0 : 0;
  const selectedCreditTotal = selectedCredits.reduce((sum, id) => sum + (creditNotes.find(note => note.id === id)?.amount ?? 0), 0);
  const appliedCredit = Math.min(invoiceTotal, selectedCreditTotal);
  const pendingBalance = Math.max(invoiceTotal - appliedCredit, 0);
  const remainingCredit = Math.max(initialCreditBalance - appliedCredit, 0);
  const canExecute = Boolean(selectedInvoice && selectedCredits.length && invoiceTotal > 0 && appliedCredit > 0);
  const logout = async () => { await authService.logout(); window.location.href = '/login'; };
  const go = (label: string) => { if (label === 'INICIO') window.location.href = '/dashboard'; if (label === 'MIS PEDIDOS') window.location.href = '/orders'; if (label === 'MI NEGOCIO') window.location.href = '/business'; if (label === 'CAMBIAR INSTALACIÓN') window.location.href = '/select-installation'; if (label === 'MI PERFIL') window.location.href = '/profile'; };
  const toggleCredit = (id: string) => { setExecuted(false); setSelectedCredits(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]); };
  const execute = () => { if (canExecute) setExecuted(true); };

  return <main className="compensation-page">
    <header className="portal-topbar"><div className="portal-logo"><img src={logo2} alt="Logo empresarial"/></div><div className="portal-greeting">HOLA, SOCIO ESTRATÉGICO</div><button className="portal-avatar" onClick={() => go('MI PERFIL')} aria-label="Abrir mi perfil"><img src={profileImage} alt="Perfil del socio"/></button><div className="portal-account"><span>NEGOCIOS Y TRANSPORTES PIZAN EIRL</span><i/><span>Código <strong>{partner.ruc}</strong></span><button onClick={logout}><LogOut size={14}/> Cerrar sesión</button><button className="portal-profile" onClick={() => go('MI PERFIL')}><UserRound size={16}/> MI PERFIL <ChevronDown size={14}/></button></div></header>
    <div className="compensation-banner" style={{ backgroundImage: `url(${banner})` }}/>
    <nav className="portal-menu compensation-menu">{menu.map(([label, Icon]) => <button key={label} className={label === 'MI NEGOCIO' ? 'active' : ''} onClick={() => go(label)}><Icon size={19}/><span>{label}</span></button>)}</nav>
    <section className="compensation-content">
      <div className="compensation-breadcrumb">HOME <b>›</b> MI NEGOCIO <b>›</b> <strong>COMPENSACIÓN</strong></div>
      <h1><img src={cylinderImage} alt=""/> Haz tu compensación</h1>
      <p className="compensation-intro">Realiza aquí tu compensación para mantener tu cuenta corriente Solgas ordenada.</p>
      <div className="balance-cards"><div><strong>SALDO A FAVOR</strong><span>{money(remainingCredit)}</span></div><div><strong>DEUDA TOTAL</strong><span>{money(pendingBalance)}</span></div><div><strong>DEUDA VENCIDA</strong><span>{money(0)}</span></div></div>
      <div className="invoice-section"><h2>PASO 1: SELECCIONA LA FACTURA A COMPENSAR</h2><table><thead><tr><th></th><th>Referencia</th><th>Clase Documento</th><th>Fecha</th><th>Vencimiento</th><th>Importe</th><th>Percepción (S/)</th><th>Importe Total</th></tr></thead><tbody>{invoices.map(invoice => <tr key={invoice.id}><td><input type="checkbox" aria-label="Seleccionar factura" checked={selectedInvoice === invoice.id} onChange={() => { setExecuted(false); setSelectedInvoice(current => current === invoice.id ? null : invoice.id); }} /></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>)}</tbody></table></div>
      <div className="compensation-step"><h2>PASO 2: SELECCIONA LAS NOTAS DE CRÉDITO QUE DESEAS APLICAR SOBRE LA FACTURA</h2><table><thead><tr><th></th><th>Referencia</th><th>Clase Documento</th><th>Fecha</th><th>Vencimiento</th><th>Importe</th></tr></thead><tbody>{creditNotes.map(note => <tr key={note.id}><td><input type="checkbox" aria-label={`Seleccionar ${note.reference}`} checked={selectedCredits.includes(note.id)} onChange={() => toggleCredit(note.id)} /></td><td><strong>{note.reference}</strong></td><td>{note.type}</td><td>{note.date}</td><td>{note.dueDate}</td><td>{money(-note.amount)}</td></tr>)}</tbody></table></div>
      <div className="compensation-step"><h2>PASO 3: REVISA EL RESUMEN DE LA COMPENSACIÓN</h2><div className="summary-row"><span>Facturas:</span><span>{money(invoiceTotal)}</span></div><div className="summary-row"><span>Notas de crédito:</span><span>{money(-appliedCredit)}</span></div><div className="summary-row"><span>Saldo pendiente:</span><span>{money(pendingBalance)}</span></div>{executed ? <div className="compensation-success">Compensación realizada correctamente.</div> : <div className="compensation-warning">{!selectedInvoice ? 'Selecciona una factura para continuar.' : !selectedCredits.length ? 'Selecciona al menos una nota de crédito para continuar.' : `Se aplicarán ${money(appliedCredit)} a la factura seleccionada.`}</div>}</div>
      <div className="compensation-step step-four"><h2>PASO 4: CONFIRMA LA OPERACIÓN</h2><button disabled={!canExecute || executed} onClick={execute}>Ejecutar</button></div>
    </section>
    <PortalFooter />
  </main>;
}
