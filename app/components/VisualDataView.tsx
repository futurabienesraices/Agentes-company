"use client";

import { useMemo, useState } from "react";

type Datum = {
  label: string;
  value: number;
  detail?: string;
};

type VisualDataViewProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  data: Datum[];
  valueSuffix?: string;
};

export default function VisualDataView({ title, eyebrow = "ANÁLISIS", description, data, valueSuffix = "" }: VisualDataViewProps) {
  const [view, setView] = useState<"chart" | "data">("chart");
  const max = useMemo(() => Math.max(1, ...data.map((item) => item.value)), [data]);
  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);

  return (
    <article className="visualDataCard">
      <header className="visualDataHeader">
        <div>
          <p>{eyebrow}</p>
          <h2>{title}</h2>
          {description ? <span>{description}</span> : null}
        </div>
        <div className="viewSwitch" role="group" aria-label={`Vista de ${title}`}>
          <button type="button" className={view === "chart" ? "active" : ""} onClick={() => setView("chart")}>Gráfico</button>
          <button type="button" className={view === "data" ? "active" : ""} onClick={() => setView("data")}>Datos</button>
        </div>
      </header>

      {view === "chart" ? (
        <div className="barChart" role="img" aria-label={`${title}. Total ${total}${valueSuffix}`}>
          {data.map((item) => {
            const percentage = Math.max(3, Math.round((item.value / max) * 100));
            return (
              <div className="barRow" key={item.label}>
                <div className="barMeta"><strong>{item.label}</strong><span>{item.value}{valueSuffix}</span></div>
                <div className="barTrack"><span style={{ width: `${percentage}%` }} /></div>
                {item.detail ? <small>{item.detail}</small> : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="dataTableWrap">
          <table>
            <thead><tr><th>Indicador</th><th>Valor</th><th>Detalle</th></tr></thead>
            <tbody>{data.map((item) => <tr key={item.label}><td>{item.label}</td><td><strong>{item.value}{valueSuffix}</strong></td><td>{item.detail || "—"}</td></tr>)}</tbody>
            <tfoot><tr><td>Total</td><td><strong>{total}{valueSuffix}</strong></td><td>{data.length} indicadores</td></tr></tfoot>
          </table>
        </div>
      )}

      <style jsx>{`
        .visualDataCard{padding:24px;background:#fff;border:1px solid #e2e7ee;border-radius:22px;box-shadow:0 12px 30px rgba(20,32,51,.04)}
        .visualDataHeader{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:24px}.visualDataHeader p{margin:0 0 8px;color:#7a8494;letter-spacing:.12em;font-size:.67rem;font-weight:800}.visualDataHeader h2{margin:0;font-size:1.75rem;letter-spacing:-.04em}.visualDataHeader>div>span{display:block;margin-top:8px;color:#737d8d;font-size:.82rem;line-height:1.45}
        .viewSwitch{display:flex;padding:4px;border-radius:12px;background:#f0f2f6}.viewSwitch button{border:0;background:transparent;padding:8px 11px;border-radius:9px;color:#687386;font-size:.72rem;font-weight:750;cursor:pointer}.viewSwitch button.active{background:#fff;color:#182235;box-shadow:0 2px 8px rgba(20,32,51,.09)}
        .barChart{display:grid;gap:17px}.barRow{display:grid;gap:7px}.barMeta{display:flex;justify-content:space-between;gap:14px;align-items:center}.barMeta strong{font-size:.82rem}.barMeta span{font-size:.8rem;font-weight:800}.barTrack{height:12px;overflow:hidden;border-radius:999px;background:#edf0f4}.barTrack span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#7259e8,#4f7df3);transition:width .35s ease}.barRow small{color:#7d8797;font-size:.69rem}
        .dataTableWrap{overflow-x:auto}table{width:100%;border-collapse:collapse;font-size:.78rem}th,td{padding:13px 12px;text-align:left;border-bottom:1px solid #e9edf2}th{color:#778193;font-size:.67rem;text-transform:uppercase;letter-spacing:.08em}td:nth-child(2),th:nth-child(2){text-align:right}tfoot td{border-bottom:0;background:#f7f8fa;font-weight:700}
        @media(max-width:680px){.visualDataCard{padding:18px}.visualDataHeader{display:block}.viewSwitch{margin-top:16px;width:max-content}.visualDataHeader h2{font-size:1.45rem}}
      `}</style>
    </article>
  );
}
