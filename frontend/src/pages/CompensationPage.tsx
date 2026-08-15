import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import logo2 from '../../../img/logo2.webp';
import profileImage from '../../../img/sinfoto.jpg';
import banner from '../../../img/banner_mis_pedidos.png';
import cylinderImage from '../../../img/balon.png';
import { PortalFooter } from '../components/PortalFooter';
import { ChevronDown, GraduationCap, LayoutGrid, LogOut, MessageSquare, ShoppingCart, Truck, UserRound, Calculator } from 'lucide-react';

const menu = [['INICIO', LayoutGrid], ['MIS PEDIDOS', ShoppingCart], ['MI NEGOCIO', Calculator], ['ACADEMIA SOLGAS', GraduationCap], ['APP REPARTIDOR', Truck], ['MI ASISTENTE', MessageSquare], ['POPUPS', LayoutGrid], ['MI TIENDA', ShoppingCart], ['WEB DIST', LayoutGrid], ['CAMBIAR INSTALACIÓN', UserRound]] as const;
const creditNotes = [
  ['Sin ref.', 'Saldo a favor', '11/08/2026', '11/08/2026', 'S/ -314,262.58'],
  ['SALDO-A-FAVOR', 'Depósito bancario', '13/08/2026', '13/08/2026', 'S/ -30,000.0'],
  ['SALDO-A-FAVOR', 'Depósito bancario', '13/08/2026', '13/08/2026', 'S/ -30,000.0'],
];

export function CompensationPage() {
  const { partner, loading } = useAuth();
  if (loading) return <main className="compensation-page"><p>Cargando…</p></main>;
  if (!partner) { window.location.href = '/login'; return null; }
  const logout = async () => { await authService.logout(); window.location.href = '/login'; };
  const go = (label: string) => { if (label === 'INICIO') window.location.href = '/dashboard'; if (label === 'MIS PEDIDOS') window.location.href = '/orders'; if (label === 'MI NEGOCIO') window.location.href = '/business'; if (label === 'CAMBIAR INSTALACIÓN') window.location.href = '/select-installation'; if (label === 'MI PERFIL') window.location.href = '/profile'; };
  return <main className="compensation-page">
    <header className="portal-topbar"><div className="portal-logo"><img src={logo2} alt="Logo empresarial"/></div><div className="portal-greeting">HOLA, SOCIO ESTRATÉGICO</div><button className="portal-avatar" onClick={() => go('MI PERFIL')} aria-label="Abrir mi perfil"><img src={profileImage} alt="Perfil del socio"/></button><div className="portal-account"><span>NEGOCIOS Y TRANSPORTES PIZAN EIRL</span><i/><span>Código <strong>{partner.ruc}</strong></span><button onClick={logout}><LogOut size={14}/> Cerrar sesión</button><button className="portal-profile" onClick={() => go('MI PERFIL')}><UserRound size={16}/> MI PERFIL <ChevronDown size={14}/></button></div></header>
    <div className="compensation-banner" style={{ backgroundImage: `url(${banner})` }}/>
    <nav className="portal-menu compensation-menu">{menu.map(([label, Icon]) => <button key={label} className={label === 'MI NEGOCIO' ? 'active' : ''} onClick={() => go(label)}><Icon size={19}/><span>{label}</span></button>)}</nav>
    <section className="compensation-content">
      <div className="compensation-breadcrumb">HOME <b>›</b> MI NEGOCIO <b>›</b> <strong>COMPENSACIÓN</strong></div>
      <h1><img src={cylinderImage} alt=""/> Haz tu compensación</h1>
      <p className="compensation-intro">Realiza aquí tu compensación para mantener tu cuenta corriente Solgas ordenada.</p>
      <div className="balance-cards"><div><strong>SALDO A FAVOR</strong><span>S/ 374,262.58</span></div><div><strong>DEUDA TOTAL</strong><span>S/ 0.00</span></div><div><strong>DEUDA VENCIDA</strong><span>S/ 0.00</span></div></div>
      <div className="invoice-section"><h2>PASO 1: SELECCIONA LA FACTURA A COMPENSAR</h2><table><thead><tr><th></th><th>Referencia</th><th>Clase Documento</th><th>Fecha</th><th>Vencimiento</th><th>Importe</th><th>Percepción (S/)</th><th>Importe Total</th></tr></thead><tbody /></table></div>
      <div className="compensation-step"><h2>PASO 2: SELECCIONA LAS NOTAS DE CRÉDITO QUE DESEAS APLICAR SOBRE LA FACTURA</h2><table><thead><tr><th></th><th>Referencia</th><th>Clase Documento</th><th>Fecha</th><th>Vencimiento</th><th>Importe</th></tr></thead><tbody>{creditNotes.map((note, index) => <tr key={`${note[0]}-${index}`}><td><input type="checkbox"/></td><td><strong>{note[0]}</strong></td><td>{note[1]}</td><td>{note[2]}</td><td>{note[3]}</td><td>{note[4]}</td></tr>)}</tbody></table></div>
      <div className="compensation-step"><h2>PASO 3: REVISA EL RESUMEN DE LA COMPENSACIÓN</h2><div className="summary-row"><span>Facturas:</span><span>S/ 0</span></div><div className="summary-row"><span>Notas de crédito:</span><span>S/ 0</span></div><div className="summary-row"><span>Saldo pendiente:</span><span>S/ 0</span></div><div className="compensation-warning">No puedes ejecutar la compensación, comienza seleccionando una factura</div></div>
      <div className="compensation-step step-four"><h2>PASO 4: CONFIRMA LA OPERACIÓN</h2><button>Ejecutar</button></div>
    </section>
    <PortalFooter />
  </main>;
}
