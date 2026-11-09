import {useRef,type ReactNode} from 'react';
import {ArrowDown,ArrowUp} from 'lucide-react';

export function DetailSection({id,label,open,onChange,children}: {
  id: string; label: string; open: boolean; onChange: (open: boolean) => void; children: ReactNode;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  function close() {
    onChange(false);
    requestAnimationFrame(() => {
      trigger.current?.focus({preventScroll: true});
      trigger.current?.scrollIntoView({block: 'start'});
    });
  }
  return <section className="detail-section">
    <button ref={trigger} className="detail-toggle" aria-expanded={open} aria-controls={id}
      onClick={() => open ? close() : onChange(true)}>
      {open ? <ArrowUp size={17}/> : <ArrowDown size={17}/>}
      {open ? 'Revenir à la vue simple' : label}
    </button>
    {open && <div id={id} className="detail-content">
      <div className="detail-caption">ANALYSE DÉTAILLÉE</div>
      {children}
      <button className="detail-toggle detail-return" onClick={close}><ArrowUp size={17}/>Revenir à la vue simple</button>
    </div>}
  </section>;
}
