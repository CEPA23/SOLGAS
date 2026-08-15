import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import logo2 from '../../../img/logo2.webp';
import profileImage from '../../../img/sinfoto.jpg';
import assistantIcon from '../../../img/asistente.png';
import { PortalFooter } from '../components/PortalFooter';
import assistantBanner from '../../../img/abastible_banner_mi_asistente.png';
import { ChevronDown, GraduationCap, LayoutGrid, LogOut, MessageSquare, ShoppingCart, Truck, UserRound, Calculator, Phone, Smartphone, Mail, Smile, Frown, Meh, Paperclip } from 'lucide-react';

const menu = [['INICIO', LayoutGrid], ['MIS PEDIDOS', ShoppingCart], ['MI NEGOCIO', Calculator], ['ACADEMIA SOLGAS', GraduationCap], ['APP REPARTIDOR', Truck], ['MI ASISTENTE', MessageSquare], ['POPUPS', LayoutGrid], ['MI TIENDA', ShoppingCart], ['WEB DIST', LayoutGrid], ['CAMBIAR INSTALACIÓN', UserRound]] as const;
const contacts = [['Ricardo Marrufo', 'SUPERVISOR COMERCIAL', '943487651', 'rmarruffog@solgas.com.pe'], ['Fernando Aliaga', 'JEFE COMERCIAL', '934137229', 'fernando.aliaga@solgas.com.pe'], ['Humberto Figueroa', 'GERENTE COMERCIAL B2C', '', ''], ['Alessandra Dentone', 'GERENTE COMERCIAL', '', ''], ['Mario Matuk', 'GERENTE GENERAL', '', '']];

export function AssistantPage() {
  const { partner, loading } = useAuth();
  if (loading) return <main className="assistant-page"><p>Cargando…</p></main>;
  if (!partner) { window.location.href = '/login'; return null; }
  const logout = async () => { await authService.logout(); window.location.href = '/login'; };
  const go = (label: string) => { if (label === 'INICIO') window.location.href = '/dashboard'; if (label === 'MIS PEDIDOS') window.location.href = '/orders'; if (label === 'MI NEGOCIO') window.location.href = '/business'; if (label === 'CAMBIAR INSTALACIÓN') window.location.href = '/select-installation'; if (label === 'MI PERFIL') window.location.href = '/profile'; };
  return <main className="assistant-page">
    <header className="portal-topbar"><div className="portal-logo"><img src={logo2} alt="Logo empresarial"/></div><div className="portal-greeting">HOLA, SOCIO ESTRATÉGICO</div><button className="portal-avatar" onClick={() => go('MI PERFIL')} aria-label="Abrir mi perfil"><img src={profileImage} alt="Perfil del socio"/></button><div className="portal-account"><span>NEGOCIOS Y TRANSPORTES PIZAN EIRL</span><i/><span>Código <strong>{partner.ruc}</strong></span><button onClick={logout}><LogOut size={14}/> Cerrar sesión</button><button className="portal-profile" onClick={() => go('MI PERFIL')}><UserRound size={16}/> MI PERFIL <ChevronDown size={14}/></button></div></header>
    <div className="assistant-banner" style={{ backgroundImage: `url(${assistantBanner})` }}/><nav className="portal-menu assistant-menu">{menu.map(([label, Icon]) => <button key={label} className={label === 'MI ASISTENTE' ? 'active' : ''} onClick={() => go(label)}><Icon size={19}/><span>{label}</span></button>)}</nav>
    <section className="assistant-content"><div className="assistant-title"><img src={assistantIcon} alt=""/> <h1>Mi asistente</h1></div><div className="assistant-grid"><div className="assistant-contacts">{contacts.map(contact => <article key={contact[0]}><img src={profileImage} alt=""/><div><h2>{contact[0]}</h2><p>{contact[1]}</p>{contact[2] && <><span><Phone size={17}/> {contact[2]}</span><span><Smartphone size={17}/> {contact[2]}</span><span><Mail size={17}/> {contact[3]}</span></>}</div></article>)}</div><form className="assistant-form"><h2>ESCRÍBENOS</h2><p>Selecciona tipo de contacto</p><div className="contact-types"><button type="button" className="selected"><Smile/><span>Consulta</span></button><button type="button"><Frown/><span>Reclamo /<br/>Denuncia</span></button><button type="button"><Meh/><span>Solicitud</span></button></div><input type="email" defaultValue="talo.74@hotmail.com"/><label>Comentario</label><textarea/><div className="attach"><Paperclip size={15}/> Adjuntar archivo</div><button className="send-assistant" type="button">ENVIAR SOLICITUD</button></form></div></section>
    <PortalFooter />
  </main>;
}
