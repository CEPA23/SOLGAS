import { useEffect, useState } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import solgasLogo from '../../../img/solgas.png';
import backgroundVideo from '../../../img/background.mp4';

const slides = [
  { title: <>Bienvenidos al nuevo<br/>Portal Familia Solgas</>, text: 'Ingresa y encuentra en un solo lugar las soluciones para administrar tu negocio.' },
  { title: <>Familia Solgas se adapta<br/>a tu forma de trabajar</>, text: 'Accede a tu plataforma estés donde estés, desde tu PC, notebook, smartphone y tablet.' },
  { kicker: '', title: <>Seguro,<br/>rápido<br/>y fácil</>, text: 'Administra tu negocio de forma segura, realiza tus compensaciones y pedidos en línea.' }
];

export function LoginPage() {
  const [slide, setSlide] = useState(0);
  const current = slides[slide];
  useEffect(() => {
    const timer = window.setInterval(() => setSlide((currentSlide) => (currentSlide + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, []);
  return <main className="auth-shell"><video className="background-video" autoPlay muted loop playsInline aria-hidden="true"><source src={backgroundVideo} type="video/mp4"/></video><div className="video-overlay" aria-hidden="true"/><div className="auth-layout"><section className="login-card" aria-labelledby="welcome"><img className="brand-logo" src={solgasLogo} alt="Solgas"/><h1 id="welcome">BIENVENIDO</h1><p className="subtitle">Ingrese su RUC y contraseña a continuación.</p><LoginForm onSuccess={() => { window.location.href = '/select-installation'; }}/><div className="registration-links"><a href="/forgot-password">¿Olvidaste tu contraseña?</a><span className="rule"/><p>¿Eres socio o distribuidor?</p><a href="#registro">REGÍSTRATE AQUÍ</a><p>¿Quieres conocer más sobre la plataforma?</p><a href="#informacion">CONOCE MÁS</a></div></section><aside className="welcome-panel"><div className="welcome-copy" aria-live="polite"><div key={slide} className="slide-content">{current.kicker && <p className="panel-kicker">{current.kicker}</p>}<h2>{current.title}</h2><span className="panel-rule"/><p>{current.text}</p></div></div><div className="slider-dots" aria-label="Seleccionar información"><button className={slide === 0 ? 'active' : ''} aria-label="Mostrar información principal" aria-pressed={slide === 0} onClick={() => setSlide(0)}/><button className={slide === 1 ? 'active' : ''} aria-label="Mostrar información de Familia Costanza" aria-pressed={slide === 1} onClick={() => setSlide(1)}/><button className={slide === 2 ? 'active' : ''} aria-label="Mostrar información segura y rápida" aria-pressed={slide === 2} onClick={() => setSlide(2)}/></div></aside></div><footer>©2017-2020 Familia Solgas - www.familiasolgas.com.pe</footer></main>;
}
 