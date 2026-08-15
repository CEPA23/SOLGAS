import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import logo2 from '../../../img/logo2.webp';
import profileImage from '../../../img/sinfoto.jpg';
import businessImage from '../../../img/negocio.png';
import { PortalFooter } from '../components/PortalFooter';
import businessBanner from '../../../img/banner_mi_negocio.png';
import { ChevronDown, GraduationCap, LayoutGrid, LogOut, MessageSquare, ShoppingCart, Truck, UserRound, Calculator, CircleDollarSign, FileText, Files, History } from 'lucide-react';

const menu = [['INICIO', LayoutGrid], ['MIS PEDIDOS', ShoppingCart], ['MI NEGOCIO', Calculator], ['ACADEMIA SOLGAS', GraduationCap], ['APP REPARTIDOR', Truck], ['MI ASISTENTE', MessageSquare], ['POPUPS', LayoutGrid], ['MI TIENDA', ShoppingCart], ['WEB DIST', LayoutGrid], ['CAMBIAR INSTALACIÓN', UserRound]] as const;

export function BusinessPage() {
  const { partner, loading } = useAuth();
  if (loading) return <main className="business-page"><p>Cargando…</p></main>;
  if (!partner) { window.location.href = '/login'; return null; }
  const logout = async () => { await authService.logout(); window.location.href = '/login'; };
  const go = (label: string) => { if (label === 'INICIO') window.location.href = '/dashboard'; if (label === 'MIS PEDIDOS') window.location.href = '/orders'; if (label === 'CAMBIAR INSTALACIÓN') window.location.href = '/select-installation'; if (label === 'MI PERFIL') window.location.href = '/profile'; };
  return <main className="business-page">
    <header className="portal-topbar"><div className="portal-logo"><img src={logo2} alt="Logo empresarial"/></div><div className="portal-greeting">HOLA, SOCIO ESTRATÉGICO</div><button className="portal-avatar" onClick={() => go('MI PERFIL')} aria-label="Abrir mi perfil"><img src={profileImage} alt="Perfil del socio"/></button><div className="portal-account"><span>NEGOCIOS Y TRANSPORTES PIZAN EIRL</span><i/><span>Código <strong>{partner.ruc}</strong></span><button onClick={logout}><LogOut size={14}/> Cerrar sesión</button><button className="portal-profile" onClick={() => go('MI PERFIL')}><UserRound size={16}/> MI PERFIL <ChevronDown size={14}/></button></div></header>
    <div className="business-banner" style={{ backgroundImage: `url(${businessBanner})` }} />
    <nav className="portal-menu business-menu">{menu.map(([label, Icon]) => <button key={label} className={label === 'MI NEGOCIO' ? 'active' : ''} onClick={() => go(label)}>{label === 'MI NEGOCIO' ? <img src={businessImage} alt=""/> : <Icon size={19}/>}<span>{label}</span></button>)}</nav>
    <section className="business-content"><div className="business-breadcrumb">HOME <b>›</b> <strong>MI NEGOCIO</strong></div><h1 className="business-title"><img src={businessImage} alt=""/> Mi negocio</h1><h2>Información del titular</h2><div className="business-options"><button onClick={() => { window.location.href = '/business/compensation'; }}><span><CircleDollarSign size={28}/></span><strong>Haz tu<br/>compensación</strong></button><button><span><FileText size={27}/></span><strong>Estado de cuenta</strong></button><button><span><Files size={27}/></span><strong>Documentos<br/>Contables</strong></button><button><span><History size={28}/></span><strong>Historial<br/>Compensación</strong></button></div></section>
    <PortalFooter />
  </main>;
}
