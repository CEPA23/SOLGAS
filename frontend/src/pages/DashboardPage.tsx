import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import logo2 from '../../../img/logo2.webp';
import heroImage from '../../../img/solgas3.jpg';
import profileImage from '../../../img/sinfoto.jpg';
import businessImage from '../../../img/negocio.png';
import { ChevronDown, GraduationCap, LayoutGrid, LogOut, MessageSquare, ShoppingCart, Truck, UserRound, Calculator } from 'lucide-react';

const menu = [['INICIO', LayoutGrid], ['MIS PEDIDOS', ShoppingCart], ['MI NEGOCIO', Calculator], ['ACADEMIA SOLGAS', GraduationCap], ['APP REPARTIDOR', Truck], ['MI ASISTENTE', MessageSquare], ['POPUPS', LayoutGrid], ['MI TIENDA', ShoppingCart], ['WEB DIST', LayoutGrid], ['CAMBIAR INSTALACIÓN', UserRound]] as const;

export function DashboardPage() {
  const { partner, loading } = useAuth();
  if (loading) return <main className="portal-page"><p>Cargando…</p></main>;
  if (!partner) { window.location.href = '/login'; return null; }
  const installation = (() => { try { const params = new URLSearchParams(window.location.search); const queryCode = params.get('code'); const queryBrand = params.get('brand'); if (queryCode || queryBrand) return { code: queryCode ?? undefined, brand: queryBrand ?? undefined }; return JSON.parse(sessionStorage.getItem('selectedInstallation') ?? localStorage.getItem('selectedInstallation') ?? 'null') as { code?: string; brand?: string } | null; } catch { return null; } })();
  const displayCode = installation?.code || partner.ruc;
  const displayBrand = installation?.brand || 'SOLGAS';
  const logout = async () => { await authService.logout(); window.location.href = '/login'; };
  const openProfile = () => { window.location.href = '/profile'; };
  return <main className="portal-page"><header className="portal-topbar"><div className="portal-logo"><img src={logo2} alt="Logo empresarial"/></div><div className="portal-greeting">HOLA, SOCIO ESTRATÉGICO</div><button className="portal-avatar" onClick={openProfile} aria-label="Abrir mi perfil"><img src={profileImage} alt="Perfil del socio"/></button><div className="portal-account"><span>NEGOCIOS Y TRANSPORTES PIZAN EIRL</span><i/><span>Código <strong>{displayCode} {displayBrand}</strong></span><button onClick={logout}><LogOut size={14}/> Cerrar sesión</button><button className="portal-profile" onClick={openProfile}><UserRound size={16}/> MI PERFIL <ChevronDown size={14}/></button></div></header><section className="portal-hero" style={{ backgroundImage: `url(${heroImage})` }}><nav className="portal-menu">{menu.map(([label, Icon], index) => <button key={label} className={index === 0 ? 'active' : ''} onClick={() => { if (label === 'MIS PEDIDOS') window.location.href = '/orders'; if (label === 'MI NEGOCIO') window.location.href = '/business'; if (label === 'MI ASISTENTE') window.location.href = '/assistant'; if (label === 'CAMBIAR INSTALACIÓN') window.location.href = '/select-installation'; }}>{label === 'MI NEGOCIO' ? <img className="portal-menu-image-icon" src={businessImage} alt=""/> : <Icon size={19}/>}<span>{label}</span></button>)}</nav><div className="portal-welcome"><h1>Bienvenido {partner.businessName}</h1><p>Código <strong>{displayCode}</strong></p><button>BIENVENIDO A FAMILIA SOLGAS</button></div></section><section className="campaign-section"><div className="campaign-content"><h2>Vídeo Campaña</h2><div className="campaign-rule"/><div className="campaign-grid"><div className="campaign-copy"><h3>Conoce los<br/><span>beneficios<br/>de Solgas</span></h3><p>Encuentra soluciones para hacer crecer tu negocio.</p></div><div className="campaign-video"><iframe src="https://player.vimeo.com/video/247380991" title="Vídeo Campaña" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen/></div></div></div></section><footer className="portal-footer"><nav>{menu.slice(0,8).map(([label]) => <a href="#" key={label}>{label}</a>)}</nav><div>AYUDA <span>|</span> CONTACTO</div></footer></main>;
}
