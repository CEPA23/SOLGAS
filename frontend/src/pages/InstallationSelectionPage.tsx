import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import solgasLogo from '../../../img/solgas.png';

const solgas = [['SECTOR CHUIN ALTO Nro 2 / S/N, PAIJAN - 9047766907', 'SOLGAS', 'NEGOCIOS Y TRANSPORTES PIZAN EIRL'], ['SECTOR CHUIN ALTO Nro 2 / S/N, ASCOPE - 62171651', 'SOLGAS', 'NEGOCIOS Y TRANSPORTES PIZAN EIRL'], ['VEHICULO / TCS-941, PAIJAN - 62173919', 'SOLGAS', 'NEGOCIOS Y TRANSPORTES PIZAN EIRL'], ['VEHICULO / BCH-738, TRUJILLO - 62175010', 'SOLGAS', 'CONT-NEGOCIOS Y TRANSPORTES PIZAN E'], ['VEHICULO / TAW-830, PAIJAN - 62176862', 'SOLGAS', 'NEGOCIOS Y TRANSPORTE PIZAN E.I.R.L']];
const masgas = [['SECTOR CHUIN ALTO Nro 2 / S/N, PAIJAN - 62163837', 'MASGAS', 'NEGOCIOS Y TRANSPORTES PIZAN EIRL'], ['SECTOR CHUIN ALTO Nro 2 / S/N, ASCOPE - 62171652', 'MASGAS', 'NEGOCIOS Y TRANSPORTES PIZAN EIRL'], ['VEHICULO / TCS-941, PAIJAN - 62173920', 'MASGAS', 'NEGOCIOS Y TRANSPORTES PIZAN EIRL'], ['VEHICULO / BCH-738, TRUJILLO - 62175011', 'MASGAS', 'CONT-NEGOCIOS Y TRANSPORTES PIZAN E'], ['VEHICULO / TAW-830, PAIJAN - 62176863', 'MASGAS', 'NEGOCIOS Y TRANSPORTE PIZAN E.I.R.L']];

function InstallationColumn({ title, items, selected, onSelect }: { title: string; items: string[][]; selected: string; onSelect: (value: string, item: string[]) => void }) { return <section className="installation-column"><h2>{title}</h2><div className="installation-list">{items.map((item, index) => { const id = `${title}-${index}`; const titleContent = item[0].includes('9047766907') ? <>{item[0].split('9047766907')[0]}<mark>9047766907</mark>{item[0].split('9047766907')[1]}</> : item[0]; return <label className={`installation-item ${selected === id ? 'selected' : ''}`} htmlFor={id} key={id}><input id={id} type="radio" name="installation" checked={selected === id} onChange={() => onSelect(id, item)}/><span><strong>{titleContent}</strong><small>{item[1]}</small><small>{item[2]}</small></span></label>; })}</div></section>; }

export function InstallationSelectionPage() {
  const { partner, loading } = useAuth();
  const [selected, setSelected] = useState('');
  if (loading) return <main className="selection-page"><p>Cargando…</p></main>;
  if (!partner) { window.location.href = '/login'; return null; }
  const saveSelection = (id: string, item: string[]) => { setSelected(id); const code = item[0].split(' - ').pop() ?? partner.ruc; const installation = { code, brand: item[1] }; sessionStorage.setItem('selectedInstallation', JSON.stringify(installation)); localStorage.setItem('selectedInstallation', JSON.stringify(installation)); window.location.href = `/dashboard?code=${encodeURIComponent(code)}&brand=${encodeURIComponent(item[1])}`; };
  return <main className="selection-page"><div className="selection-card"><img className="selection-logo" src={solgasLogo} alt="Solgas"/><div className="selection-heading"><h1>SELECCIONA</h1><p>Instalación con la que deseas trabajar.</p></div><div className="installation-grid"><InstallationColumn title="SOLGAS" items={solgas} selected={selected} onSelect={saveSelection}/><InstallationColumn title="MASGAS" items={masgas} selected={selected} onSelect={saveSelection}/></div></div><footer>2017-2020 Solgas - Lima: +51 1 613 3333</footer></main>;
}
