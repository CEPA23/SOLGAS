import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { DashboardPage } from './DashboardPage';
import profileImage from '../../../img/sinfoto.jpg';
import { LogOut, UserRound, X } from 'lucide-react';
import { PortalFooter } from '../components/PortalFooter';

export function ProfilePage() {
  const { partner, loading } = useAuth();
  const [isClosing, setIsClosing] = useState(false);
  if (loading) return <DashboardPage />;
  if (!partner) { window.location.href = '/login'; return null; }
  const logout = async () => { await authService.logout(); window.location.href = '/login'; };
  const businessName = partner.businessName || 'NEGOCIOS Y TRANSPORTES PIZAN EIRL';
  const closeProfile = () => { setIsClosing(true); window.setTimeout(() => { window.location.href = '/dashboard'; }, 320); };
  return <main className="profile-page">
    <DashboardPage />
    <section className={`profile-drawer${isClosing ? ' is-closing' : ''}`} aria-label="Mi perfil">
      <button className="profile-drawer-close" onClick={closeProfile} aria-label="Cerrar perfil"><X size={19}/></button>
      <div className="profile-layout">
        <section className="profile-form-panel">
          <div className="profile-section-title">FICHA PERSONAL</div>
          <div className="profile-upload"><img src={profileImage} alt="Foto de perfil" /><div><button className="profile-orange-button">SUBE TU FOTO</button><small>Tamaño Máximo 2 MB - JPG/PNG/GIF</small></div></div>
          <div className="profile-fields">
            <label><span>Nickname</span><input /></label>
            <label><span>Nombre<br/>Cliente</span><input value={businessName} readOnly /></label>
            <label><span>Ruc</span><input value={partner.ruc} readOnly /></label>
            <label><span>Dirección</span><input /></label>
            <label><span>Fijo</span><div className="phone-field"><b>+51</b><input /></div></label>
            <label><span>Celular</span><div className="phone-field"><b>+51</b><input /></div></label>
            <label><span>Correo<br/>Electrónico</span><input /></label>
          </div>
          <a className="change-password" href="/forgot-password">Cambiar mi clave</a>
        </section>
        <aside className="profile-summary">
          <h2><UserRound size={18}/> MI PERFIL</h2>
          <img className="profile-summary-photo" src={profileImage} alt="Foto de perfil" />
          <h3>{businessName}</h3><strong>DISTRIBUIDOR</strong>
          <div className="profile-progress"><span /></div><b>15% COMPLETADO</b>
          <button className="profile-orange-button small">EDITAR</button>
          <a href="/select-installation" className="profile-side-link">CAMBIAR INSTALACIÓN</a>
          <div className="profile-side-block"><h4><UserRound size={17}/> PERFIL COMERCIAL</h4><img src={profileImage} alt="Perfil comercial" /><button className="profile-orange-button small">EDITAR</button></div>
          <div className="profile-side-block admins"><h4><UserRound size={17}/> ADMINISTRADORES</h4><p>No se han definido<br/>administradores</p></div>
          <button className="profile-mobile-logout" onClick={logout}><LogOut size={15}/> Cerrar sesión</button>
        </aside>
      </div>
    </section>
    <PortalFooter />
  </main>;
}
