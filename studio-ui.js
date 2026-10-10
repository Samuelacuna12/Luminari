function dashboard(){
 const all=db.orders.filter(x=>x.status!=='Cancelado'), f=fin(),dt=new Date();
 const ym=dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0');
 const current=sum(all.filter(x=>String(x.date||'').startsWith(ym)),x=>x.amount);
 const proj=Math.round(current/Math.max(1,dt.getDate())*new Date(dt.getFullYear(),dt.getMonth()+1,0).getDate());
 const percent=db.goal?Math.min(100,Math.round(current/db.goal*100)):0;
 const months=Array.from({length:6},(_,i)=>{const d=new Date(dt.getFullYear(),dt.getMonth()-5+i,1),key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');return {label:d.toLocaleDateString('es-CO',{month:'short'}),amount:sum(all.filter(x=>String(x.date||'').startsWith(key)),x=>x.amount)}});
 const peak=Math.max(1,...months.map(m=>m.amount));
 const delays=db.orders.filter(x=>x.due&&x.due<now()&&!['Entregado','Cancelado','Histórico sin validar'].includes(x.status)).length;
 const pending=db.tasks.filter(x=>x.status!=='Terminada').length;
 const low=db.inventory.filter(x=>(+x.stock||0)<=(+x.min||0)).length;
 const qs=db.quotes.filter(x=>x.status==='Pendiente').length;
 const kpis=[['Ventas registradas',money(f.sales),'Total de pedidos'],['Gastos registrados',money(f.out),'Egresos acumulados'],['Clientes',db.clients.length.toLocaleString('es-CO'),'Contactos en CRM'],['Cotizaciones',db.quotes.length.toLocaleString('es-CO'),'Propuestas comerciales']];
 return `<section class="editorial-hero" id="overview">
  <div class="hero-copy">
   <div class="hero-kicker"><span class="live-dot"></span> ESTUDIO LUMINARI · VISIÓN 360</div>
   <h2>El arte de iluminar.<br><em>El control de crecer.</em></h2>
   <p>Todo lo que sucede en tu empresa, con la claridad que merece cada proyecto.</p>
   <div class="hero-actions"><button class="btn" onclick="quoteEdit(null)">＋ Nueva cotización</button><button class="btn light" onclick="go('orders')">Ver pedidos ↗</button></div>
   <div class="hero-quiet">LUMINARI / GESTIÓN DE ESTUDIO</div>
  </div>
  <div class="light-scene" aria-hidden="true">
   <div class="lamp-cord one"></div><div class="lamp-cord two"></div>
   <div class="lamp-cap"></div><div class="lamp-cap two"></div>
   <div class="glass one"></div><div class="glass two"></div>
   <div class="light-label"><b>ESTUDIO EN ORDEN ✦</b><span>Diseño · Operaciones · Control</span></div>
  </div>
 </section>
 <div class="mini-nav" aria-label="Secciones del panel">
  <button class="chosen" onclick="document.getElementById('overview').scrollIntoView({behavior:'smooth'})">Vista general</button>
  <button onclick="document.getElementById('performance').scrollIntoView({behavior:'smooth'})">Rendimiento</button>
  <button onclick="document.getElementById('operations').scrollIntoView({behavior:'smooth'})">Operación</button>
  <button onclick="document.getElementById('shortcuts').scrollIntoView({behavior:'smooth'})">Accesos rápidos</button>
 </div>
 <div class="section-heading"><h3>Tu negocio, de un vistazo</h3><small>Indicadores registrados</small></div>
 <div class="grid metrics">${kpis.map((x,i)=>`<article class="panel metric"><span class="metric-no">0${i+1}</span><span class="label">${esc(x[0])}</span><strong>${esc(x[1])}</strong><small>${esc(x[2])}</small><div class="metric-accent"></div></article>`).join('')}</div>
 <div class="grid twocol" id="performance">
  <section class="panel"><div class="section-title">Movimiento comercial <small>Últimos 6 meses</small></div>
   <div class="bars">${months.map(m=>`<div class="barcol"><span>${m.amount?money(m.amount):'—'}</span><div class="bar" style="height:${Math.max(4,Math.round(m.amount/peak*116))}px"></div><span>${esc(m.label)}</span></div>`).join('')}</div>
   <div class="chartlegend">Ventas por fecha de pedido. Los datos históricos pueden estar pendientes de conciliación.</div>
  </section>
  <section class="panel"><div class="card-kicker">OBJETIVO COMERCIAL</div>
   <div class="section-title" style="margin-top:13px">Meta del mes <small>${percent}% alcanzado</small></div>
   <div class="muted" style="font-size:11px;margin-top:22px">Ventas del mes</div>
   <div style="font:800 clamp(23px,3vw,34px) Manrope;letter-spacing:-1.1px;color:#252627;margin:8px 0 5px">${money(current)}</div>
   <div class="progress"><div style="width:${percent}%"></div></div>
   <div class="muted" style="font-size:11px;margin:15px 0 7px">Meta mensual · ${money(db.goal||0)}</div>
   <div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap"><input class="goalinput" id="goal" type="number" min="1" aria-label="Meta mensual" value="${db.goal||30000000}" style="max-width:175px;padding:10px">${btn('Guardar','updateGoal()','small')}</div>
   <div class="chartlegend" style="margin-top:22px">Proyección lineal del mes: <b>${money(proj)}</b>. No es una garantía.</div>
  </section>
 </div>
 <div class="section-heading" id="operations"><h3>Operación al día</h3><small>Pendientes y alertas</small></div>
 <div class="grid twocol">
  <section class="panel"><div class="section-title">Lo que necesita atención <small>Seguimiento</small></div>
   ${[['Entregas fuera de fecha',delays],['Materiales con stock mínimo',low],['Tareas por completar',pending],['Cotizaciones pendientes',qs]].map(a=>`<div class="statrow"><span>${esc(a[0])}</span>${badge(String(a[1]))}</div>`).join('')}
  </section>
  <section class="panel"><div class="card-kicker">CONTINUIDAD OPERATIVA</div>
   <div class="section-title" style="margin-top:12px">Tus procesos, organizados.</div>
   <p style="font-size:12px;color:#858680;line-height:1.8;margin-bottom:23px">Del primer contacto a la instalación final. Consulta cada fase en un mismo lugar.</p>
   ${btn('Revisar fabricación',"go('orders')")} ${btn('Ver tareas',"go('tasks')",'light')}
  </section>
 </div>
 <div class="section-heading" id="shortcuts"><h3>¿Qué hacemos ahora?</h3><small>Accesos rápidos</small></div>
 <div class="quick-tiles">
  <button class="quick-tile" onclick="formEdit('clients',null)"><div class="tile-top">♙<span class="tile-arrow">↗</span></div><div><strong>Nuevo cliente</strong><small>Registra datos y seguimiento</small></div></button>
  <button class="quick-tile" onclick="formEdit('orders',null)"><div class="tile-top">◈<span class="tile-arrow">↗</span></div><div><strong>Nuevo pedido</strong><small>Inicia una fabricación</small></div></button>
  <button class="quick-tile" onclick="formEdit('transactions',null)"><div class="tile-top">◫<span class="tile-arrow">↗</span></div><div><strong>Registrar pago</strong><small>Controla tus movimientos</small></div></button>
 </div>`;
}
const studioOriginalRender=render;
function studioBottom(){
 const bar=document.getElementById('mobileBottom');
 if(!bar)return;
 const tabs=[['dashboard','⌂','Inicio'],['clients','♙','Clientes'],['quotes','▤','Cotizar'],['orders','◈','Pedidos'],['reports','▥','Reportes']];
 bar.innerHTML=tabs.map(t=>'<button class="'+(page===t[0]?'selected':'')+'" onclick="go(\''+t[0]+'\')"><span>'+t[1]+'</span>'+t[2]+'</button>').join('');
}
render=function(){studioOriginalRender();studioBottom()};
render();