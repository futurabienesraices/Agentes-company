import { NextRequest, NextResponse } from "next/server";

const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "app7dn7435WA9fa7R";
const API_TOKEN = process.env.AIRTABLE_API_TOKEN;
const TABLES = { personas:"tblmDGwNAVcYnUAnW", leads:"tblUxwYmD7Gliahzs", demandas:"tblI0HtmgfOIKzzvs", seguimientos:"tbl5G7PfXax3WafYE" };
const F = {
 personas:{name:"fldJkHjV0rXKkEqIH",phone:"fldWBr2kdR2vp6VAH",email:"fld7TYCurdbXo74x8",relation:"flddcozryg3AGcfPR",status:"fldDF3XWHUNg3IxiB",notes:"fldApr2IshWNFVNpZ",source:"fld3LdFD1yfVQ37iy",first:"fldWp1iBQbMrHsCWu",priority:"fld8xTtELef1jE5sX"},
 leads:{name:"fldA9qI2kUKyv64JY",notes:"fldPFyDntNAI5Dcwk",status:"fldFhHbDVQyBsqujj",person:"fld1s5rX2XeHh1Gpd",phone:"fldBAVL33laSAVf1q",classification:"fldgS0dl95nJxdrE0",channel:"flduBfRO0rLLZq1WD",date:"fldgb694pdT82sI8D",priority:"fldshPdum09OCTKW3",response:"fld6kfblYoaareLKg"},
 demandas:{name:"fld8IM8S3g9oBCONp",notes:"fldzlIOCbFb7W87cD",status:"fldy3KMTLZ8NjK2Vh",operation:"fldG7zFdEQMSgMK4i",budget:"fldwLBaTLOJub2Umq",person:"fldxCgfg8p9AXUBhN",propertyType:"fldyr37i8tbXghWk9",location:"fldUGmROgYr3CByJC",financing:"fldBJxC9NLH75Eu89",urgency:"fldMAJc64LIJm4Nx9",created:"fldXIivtPWm5BCcJ1",originLead:"fldB4RtgZ1O0FMiLx",commercial:"fldIDXeMa3BPcRKRy",requirements:"fldsQanK88Z9dGtIC"},
 followups:{name:"fldXsuexoOflUM3e8",notes:"fldPkefB3ayIzmtx7",status:"fldmE4yR7BznYlT36",person:"fldozfWMEWoR7o4xO",next:"fldNrTzmiZlZokwkv",due:"fldCStsSMMq6MPsVv"}
};
const clean=(v:unknown,max=500)=>typeof v==="string"?v.trim().slice(0,max):"";
const today=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Manila",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
async function create(table:string,fields:Record<string,unknown>){const r=await fetch(`https://api.airtable.com/v0/${BASE_ID}/${table}`,{method:"POST",headers:{Authorization:`Bearer ${API_TOKEN}`,"Content-Type":"application/json"},body:JSON.stringify({typecast:true,records:[{fields}]})});const j=await r.json();if(!r.ok)throw new Error(j?.error?.message||"Airtable rechazó el registro.");return j.records?.[0] as {id:string};}

export async function POST(request:NextRequest){
 if(!API_TOKEN)return NextResponse.json({error:"Airtable no está configurado."},{status:503});
 try{
  const b=await request.json() as Record<string,unknown>; if(clean(b.website))return NextResponse.json({ok:true});
  const name=clean(b.name,120),phone=clean(b.phone,40),email=clean(b.email,120),location=clean(b.location,200),message=clean(b.message,1200); if(!name||(!phone&&!email))return NextResponse.json({error:"Indica tu nombre y al menos un teléfono o correo."},{status:400});
  const rawOp=clean(b.operation,30); const operation=rawOp==="Alquiler"?"Alquiler":rawOp==="Inversión"?"Inversión":"Compra";
  const allowedTypes=["Casa","Lote","Terreno","Local comercial","Finca","Habitación","Propiedad por definir"]; const rawType=clean(b.propertyType,60); const propertyType=allowedTypes.includes(rawType)?rawType:"Propiedad por definir";
  const relation=operation==="Alquiler"?"Inquilino":"Comprador"; const budget=Number(b.budget)||undefined; const financing=Boolean(b.financing); const date=today();
  const person=await create(TABLES.personas,{[F.personas.name]:name,...(phone?{[F.personas.phone]:phone}:{}),...(email?{[F.personas.email]:email}:{}),[F.personas.relation]:[relation],[F.personas.status]:"Prospecto",[F.personas.source]:"Web",[F.personas.first]:date,[F.personas.priority]:"Alta",[F.personas.notes]:message||`Interesado en ${operation.toLowerCase()} en ${location||"ubicación por definir"}.`});
  const lead=await create(TABLES.leads,{[F.leads.name]:`${name} · ${operation}${location?` · ${location}`:""}`,[F.leads.notes]:message||"Consulta recibida desde el formulario web.",[F.leads.status]:"Todo",[F.leads.person]:[person.id],...(phone?{[F.leads.phone]:phone}:{}),[F.leads.classification]:"Nuevo",[F.leads.channel]:"Formulario web",[F.leads.date]:date,[F.leads.priority]:"Alta",[F.leads.response]:"Pendiente"});
  await create(TABLES.demandas,{[F.demandas.name]:`${operation} · ${propertyType} · ${name}`,[F.demandas.notes]:message||"Demanda creada desde captación web.",[F.demandas.status]:"Todo",[F.demandas.operation]:operation,...(budget?{[F.demandas.budget]:budget}:{}),[F.demandas.person]:[person.id],[F.demandas.propertyType]:propertyType,...(location?{[F.demandas.location]:location}:{}),[F.demandas.financing]:financing,[F.demandas.urgency]:"Alta",[F.demandas.created]:date,[F.demandas.originLead]:[lead.id],[F.demandas.commercial]:"Por calificar",...(message?{[F.demandas.requirements]:message}:{})});
  await create(TABLES.seguimientos,{[F.followups.name]:`Contactar a ${name}`,[F.followups.notes]:`Lead web. ${phone?`Tel: ${phone}. `:""}${email?`Correo: ${email}.`:""}`,[F.followups.status]:"Todo",[F.followups.person]:[person.id],[F.followups.next]:"Contactar al cliente y validar necesidad, presupuesto y plazo.",[F.followups.due]:date});
  return NextResponse.json({ok:true,message:"Tu solicitud fue recibida. Te contactaremos pronto."});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"No fue posible registrar la solicitud."},{status:500});}
}
