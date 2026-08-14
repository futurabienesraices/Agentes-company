"use client";

import type { CrmStage } from "../../lib/dashboard";

export default function CrmPipeline({ stages }: { stages: CrmStage[] }) {
  return <div className="pipeline" aria-label="Pipeline de CRM">{stages.map((stage) => <section key={stage.stage}><header><strong>{stage.stage}</strong><span>{stage.leads.length}</span></header>{stage.leads.length ? stage.leads.map((lead) => <article key={lead.id}><strong>{lead.name}</strong><small>{lead.priority} · {lead.detail}</small></article>) : <p>Sin leads</p>}</section>)}<style jsx>{`.pipeline{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(190px,1fr);gap:10px;overflow-x:auto;padding-bottom:8px;scroll-snap-type:x proximity}.pipeline section{min-height:176px;scroll-snap-align:start;padding:12px;border:1px solid #e8edf4;border-radius:14px;background:#fafcff}.pipeline header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:.76rem}.pipeline header span{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:#e9edff;color:#3730a3;font-size:.67rem;font-weight:800}.pipeline article{padding:9px 0;border-top:1px solid #e9eef5}.pipeline article strong,.pipeline article small{display:block}.pipeline article strong{font-size:.76rem}.pipeline article small,.pipeline p{margin:3px 0;color:#94a3b8;font-size:.67rem}.pipeline p{padding-top:7px}`}</style></div>;
}
