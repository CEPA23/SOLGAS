const links = [
  ['INICIO', '/dashboard'],
  ['MIS PEDIDOS', '/orders'],
  ['MI NEGOCIO', '/business'],
  ['ACADEMIA SOLGAS', '#'],
  ['APP REPARTIDOR', '#'],
  ['MI ASISTENTE', '/assistant'],
  ['POPUPS', '#'],
] as const;

export function PortalFooter() {
  return (
    <footer className="shared-portal-footer">
      <nav aria-label="Navegación inferior">
        <div className="shared-footer-main-links">
          {links.map(([label, href]) => <a href={href} key={label}>{label}</a>)}
        </div>
        <a href="#">MI TIENDA</a>
      </nav>
      <div className="shared-footer-help"><a href="#">AYUDA</a><span>|</span><a href="#">CONTACTO</a></div>
    </footer>
  );
}
