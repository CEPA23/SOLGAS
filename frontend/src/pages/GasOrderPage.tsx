import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import logo2 from '../../../img/logo2.webp';
import profileImage from '../../../img/sinfoto.jpg';
import banner from '../../../img/mis_pedidos.jpg';
import s10 from '../../../img/balon1.jpg';
import k10 from '../../../img/blaon2.jpg';
import s45 from '../../../img/balon3.jpg';
import masgasCylinder from '../../../img/masgas1.jpg';
import cylinderImage from '../../../img/balon.png';
import { PortalFooter } from '../components/PortalFooter';
import { ChevronDown, GraduationCap, LayoutGrid, LogOut, MessageSquare, ShoppingCart, Truck, UserRound, Calculator, Package, CalendarDays } from 'lucide-react';

const menu = [['INICIO', LayoutGrid], ['MIS PEDIDOS', ShoppingCart], ['MI NEGOCIO', Calculator], ['ACADEMIA SOLGAS', GraduationCap], ['APP REPARTIDOR', Truck], ['MI ASISTENTE', MessageSquare], ['POPUPS', LayoutGrid], ['MI TIENDA', ShoppingCart], ['WEB DIST', LayoutGrid], ['CAMBIAR INSTALACIÓN', UserRound]] as const;
const solgasProducts = [{ name: 'S10', weight: 10, image: s10 }, { name: 'K10', weight: 10, image: s45 }, { name: 'S45', weight: 45, image: k10 }];

export function GasOrderPage() {
  const { partner, loading } = useAuth();
  const installation = (() => { try { return JSON.parse(sessionStorage.getItem('selectedInstallation') ?? localStorage.getItem('selectedInstallation') ?? 'null') as { code?: string; brand?: string } | null; } catch { return null; } })();
  const isMasgas = installation?.code === '62173920' || installation?.brand === 'MASGAS';
  const products = isMasgas ? [{ name: 'S10', weight: 10, image: masgasCylinder }, { name: 'K10', weight: 10, image: masgasCylinder }] : solgasProducts;
  const [quantities, setQuantities] = useState(() => products.map(() => 0));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  if (loading) return <main className="gas-order-page"><p>Cargando…</p></main>;
  if (!partner) { window.location.href = '/login'; return null; }
  const logout = async () => { await authService.logout(); window.location.href = '/login'; };
  const go = (label: string) => { if (label === 'INICIO') window.location.href = '/dashboard'; if (label === 'MIS PEDIDOS') window.location.href = '/orders'; if (label === 'MI NEGOCIO') window.location.href = '/business'; if (label === 'CAMBIAR INSTALACIÓN') window.location.href = '/select-installation'; if (label === 'MI PERFIL') window.location.href = '/profile'; };
  const updateQuantity = (index: number, value: string) => { const next = [...quantities]; next[index] = Math.max(0, Number(value) || 0); setQuantities(next); };
  const total = quantities.reduce((sum, quantity, index) => sum + quantity * products[index].weight, 0);
  return <main className={`gas-order-page${isMasgas ? ' masgas-order-page' : ''}`}>
    <header className="portal-topbar"><div className="portal-logo"><img src={logo2} alt="Logo empresarial"/></div><div className="portal-greeting">HOLA, SOCIO ESTRATÉGICO</div><button className="portal-avatar" onClick={() => go('MI PERFIL')} aria-label="Abrir mi perfil"><img src={profileImage} alt="Perfil del socio"/></button><div className="portal-account"><span>NEGOCIOS Y TRANSPORTES PIZAN EIRL</span><i/><span>Código <strong>{installation?.code || partner.ruc} {isMasgas ? 'MASGAS' : 'SOLGAS'}</strong></span><button onClick={logout}><LogOut size={14}/> Cerrar sesión</button><button className="portal-profile" onClick={() => go('MI PERFIL')}><UserRound size={16}/> MI PERFIL <ChevronDown size={14}/></button></div></header>
    <div className="gas-order-banner" style={{ backgroundImage: `url(${banner})` }} />
    <nav className="portal-menu gas-order-menu">{menu.map(([label, Icon]) => <button key={label} className={label === 'MIS PEDIDOS' ? 'active' : ''} onClick={() => go(label)}><Icon size={19}/><span>{label}</span></button>)}</nav>
    <section className="gas-order-content">
      <div className="gas-breadcrumb">HOME <b>›</b> MIS PEDIDOS <b>›</b> <strong>HAZ TU PEDIDO</strong></div>
      <div className="gas-order-grid">
        <aside className="gas-order-sidebar"><h1><img className="gas-title-cylinder" src={cylinderImage} alt=""/> Haz tu pedido</h1><ul><li>ESTADO DEL PEDIDO</li><li className="selected">HACER PEDIDOS</li><li>COMPENSACIÓN</li><li>HISTORIAL COMPENSACIÓN</li></ul></aside>
        <div className="gas-products"><div className="gas-products-heading">PRODUCTOS GAS <ChevronDown size={30}/></div><div className="gas-product-grid">{products.map((product) => <div className="gas-product" key={product.name}><img src={product.image} alt={`Cilindro ${product.name}`}/><strong>{product.name}</strong></div>)}</div><div className="gas-quantity-grid">{quantities.map((quantity, index) => <input key={products[index].name} type="number" min="0" value={quantity} onFocus={event => event.currentTarget.select()} onClick={event => event.currentTarget.select()} onChange={event => updateQuantity(index, event.target.value)} aria-label={`Cantidad ${products[index].name}`}/>)}</div><div className="gas-subtotal-grid">{quantities.map((quantity, index) => <strong key={products[index].name}>{quantity * products[index].weight}</strong>)}</div><div className="gas-total">Total de Kg. del pedido: <strong>{total} KG</strong></div><div className="gas-limit">Tu pedido debe tener como máximo <strong>5,000 KG</strong></div><div className="gas-order-form"><label><strong>Tipo de pedido</strong><input value="AUTOABASTECIDO - Usted se acerca a Solgas" readOnly /></label><label><strong>SCOP</strong><div className="scop-row"><input aria-label="Código SCOP"/><span>Por normativa todos tus pedidos<br/>deben llevar código <b>SCOP</b><a href="#scop">Obtén tu SCOP</a></span></div></label><label><strong>Fecha de entrega</strong><div className="date-picker"><button type="button" className="date-field" onClick={() => setCalendarOpen(open => !open)} aria-label="Abrir calendario"><span>{selectedDate || ' '}</span><CalendarDays size={17}/></button>{calendarOpen && <div className="calendar-popup"><div className="calendar-header"><button type="button">‹</button><strong>Agosto 2026</strong><button type="button">›</button></div><div className="calendar-week"><b>Lu</b><b>Ma</b><b>Mi</b><b>Ju</b><b>Vi</b><b>Sá</b><b>Do</b></div><div className="calendar-days">{['','','','','','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31'].map((day, index) => <button type="button" key={`${day}-${index}`} className={day === '14' ? 'today' : ''} disabled={!day} onClick={() => { setSelectedDate(`${day}/08/2026`); setCalendarOpen(false); }}>{day}</button>)}</div></div>}</div></label><fieldset><legend>Selección de turno</legend><label><input type="radio" name="shift" defaultChecked/> Turno MAÑANA</label><label><input type="radio" name="shift"/> Turno Tarde</label><label><input type="radio" name="shift"/> S/Turno</label></fieldset><div className="gas-form-actions"><button type="button">LIMPIAR</button><button type="button">CONFIRMAR PEDIDO</button></div></div></div>
      </div>
    </section>
    <PortalFooter />
  </main>;
}
