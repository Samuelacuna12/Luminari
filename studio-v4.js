/* LUMINARI native studio experience. Only fictional data are shown in the public preview. */
(function(){
const preview=typeof IS_SAMPLE!=='undefined'&&IS_SAMPLE;
const local=typeof IS_LOCAL!=='undefined'&&IS_LOCAL;
const dateKey=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')};
function studioDashboard(){
 const today=new Date(), period=dateKey();
 const orders=db.orders.filter(o=>o.status!=='Cancelado');
 const registered=sum(orders,x=>x.amount);
 const historicOut=db.transactions.filter(x=>x.type==='Egreso');
 const expenses=sum(historicOut,x=>x.amount);
 const monthSales=sum(orders.filter(x=>String(x.date||'').startsWith(period)),x=>x.amount);
 const percent=Math.min(100,Math.max(0,Math.round(100*monthSales/(+db.goal||1))));
 const months=Array.from({length:6},(_,i)=>{const d=new Date(today.getFullYear(),today.getMonth()-5+i,1),key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');return {label:d.toLocaleDateString('es-CO',{month:'short'}),value:sum(orders.filter(x=>String(x.date||'').startsWith(key)),x=>x.amount)}});
 const max=Math.max(1,...months.map(x=>x.value));
 const pending=db.orders.filter(x=>!['Entregado','Cancelado','Histórico sin validar'].includes(x.status)).length;
 const other=[['Pedidos en proceso',pending],['Tareas pendientes',db.tasks.filter(x=>x.status!=='Terminada').length],['Materiales en alerta',db.inventory.filter(x=>(+x.stock||0)<=(+x.min||0)).length],['Garantías y entregas',db.shipments.length]];
 const metrics=[['Ventas registradas',money(registered),'Acumulado en pedidos'],['Egresos históricos',money(expenses),historicOut.length+' movimientos acumulados · no son gastos fijos'],['Clientes',db.clients.length.toLocaleString('es-CO'),'Contactos activos'],['Cotizaciones',db.quotes.length.toLocaleString('es-CO'),'Propuestas creadas']];
 return '<div class="studio-intro"><div class="caption"><i></i> CENTRO DE OPERACIONES / LUMINARI</div><span class="stamped">STUDIO EDITION 04</span></div>'+
 '<div class="studio-feature"><section class="studio-product" aria-label="Colección de iluminación de LUMINARI">'+
  '<div class="lum-scene"><div class="lum-floating">✳  ILUMINACIÓN CON IDENTIDAD</div><div class="lum-beam b1"></div><div class="lum-beam b2"></div><div class="lum-beam b3"></div><div class="lum-drop d1"></div><div class="lum-drop d2"></div><div class="lum-drop d3"></div><div class="lum-thumb-nav"><span></span><span></span><span></span></div><div class="lum-media-counter">✦ ESTUDIO LUMINARI</div></div>'+
  '<div class="product-foot"><small>ESPACIOS EXTRAORDINARIOS · OPERACIÓN EN ORDEN</small><h2>Diseñamos luz. Gestionamos cada detalle.</h2><p>Desde una idea hasta la instalación final.</p><div class="spec-rail"><span>✦ Clientes</span><span>◈ Diseños</span><span>◌ Fabricación</span><span>↗ Entregas</span></div></div></section>'+
  '<section class="studio-summary"><div class="studio-summary-head"><small>PANEL DE DIRECCIÓN</small><div class="summary-asterisk">✳</div></div><h2>Todo bajo<br><em>tu control.</em></h2><p>Un espacio hecho para LUMINARI. Clientes, cotizaciones, producción y finanzas conectados en una sola operación.</p><div class="studio-total-box"><div class="label">VENTAS DEL MES</div><strong>'+money(monthSales)+'</strong><div class="studio-progress"><div style="width:'+percent+'%"></div></div><small>'+percent+'% de la meta de '+money(db.goal)+'</small></div><div class="studio-shortcuts"><button onclick="document.getElementById(\'monthlyClients\')?.scrollIntoView({behavior:\'smooth\'})">Ver clientes del mes ↗</button><button onclick="quoteEdit(null)">＋ Crear cotización</button><button onclick="go(\'orders\')">Ver fabricación ↗</button></div></section></div>'+
 '<div class="studio-section-label"><h3>La empresa, en cifras</h3><small>Indicadores de operación</small></div>'+
 '<div class="studio-tile-grid">'+metrics.map((x,i)=>'<div class="studio-tile"><i>0'+(i+1)+'</i><span>'+esc(x[0])+'</span><strong>'+esc(x[1])+'</strong><small>'+esc(x[2])+'</small></div>').join('')+'</div>'+monthlyClientsPanel(period)+
 '<div class="studio-section-label"><h3>Movimiento y seguimiento</h3><small>Últimos seis meses</small></div>'+
 '<div class="studio-two-cols"><section class="panel"><div class="section-title">Tendencia comercial</div><div class="studio-month-chart">'+months.map(m=>'<div class="studio-month-col"><b>'+(m.value?money(m.value):'')+'</b><div style="height:'+Math.max(5,Math.round(m.value/max*129))+'px"></div><span>'+esc(m.label)+'</span></div>').join('')+'</div><p class="studio-subtle">Ventas por fecha de pedido; los registros históricos pueden requerir conciliación contable.</p></section>'+
 '<section class="panel"><div class="section-title">Estado de la operación</div><div class="studio-ops-list">'+other.map(x=>'<div class="studio-op"><span>'+x[0]+'</span><b>'+x[1]+'</b></div>').join('')+'</div><p class="studio-subtle">Consulta cada módulo para administrar el detalle.</p></section></div>';
}
dashboard=studioDashboard;
const renderBase=render;
function layout(){
 const top=document.querySelector('.top');if(!top)return;
 let brand=document.getElementById('studioBrand');
 if(!brand){
  top.insertAdjacentHTML('afterbegin','<div class="studio-brand" id="studioBrand"><span class="studio-mark">✳</span><span><strong>LUMINARI</strong><small>STUDIO OPERATIONS</small></span></div>');
 }
 const privateMode=!preview&&!local;
 const t=top.querySelector('.topright');
 if(t){
  t.innerHTML=privateMode?'<span class="muted" id="today"></span><span class="studio-top-action soft">☁ Base compartida</span><button class="studio-top-action" onclick="cloudLogout()">Cerrar sesión ↗</button>':local?'<span class="muted" id="today"></span><button class="studio-top-action soft" onclick="backup()">Descargar respaldo</button><button class="studio-top-action" onclick="go(\'reports\')">Informes ↗</button>':'<span class="muted" id="today"></span><a class="studio-top-action" href="./">Usar sin clave ↗</a>';
 }
 let nav=document.getElementById('studioNavigation');
 if(!nav){
  nav=document.createElement('nav');nav.id='studioNavigation';nav.className='studio-nav';nav.setAttribute('aria-label','Secciones de Luminari');top.after(nav);
 }
 const tabs=[['dashboard','⌂','Estudio'],['quotes','▤','Cotizaciones'],['clients','♙','Clientes'],['orders','◈','Fabricación'],['inventory','◫','Inventario'],['transactions','↗','Finanzas'],['expenses','◷','Gastos fijos'],['shipments','⇄','Entregas'],['tasks','☑','Tareas'],['reports','▥','Informes']];
 nav.innerHTML=tabs.map(x=>'<button class="'+(page===x[0]?'current':'')+'" onclick="go(\''+x[0]+'\')"><b>'+x[1]+'</b>'+x[2]+'</button>').join('')+'<span class="studio-spacer"></span><span class="priv-tip">'+(preview?'DATOS DE EJEMPLO':local?'ACCESO LIBRE · GUARDADO LOCAL':'ÁREA PRIVADA')+'</span>';
 const main=document.getElementById('main');
 if(!privateMode&&main&&!document.getElementById('sampleNote')){
  main.insertAdjacentHTML('afterbegin',preview?
  '<div id="sampleNote" class="design-banner"><span>Ejemplo ficticio. Sin acceso a datos de clientes.</span><a href="./">Abrir acceso privado ↗</a></div>':
  '<div id="sampleNote" class="design-banner"><span>Sistema sin inicio de sesión. Tus registros se guardan únicamente en este navegador, NO en Supabase. Descarga respaldos desde Informes.</span><a href="?demo=1">Ver ejemplo ↗</a></div>');
 }
 const footer=document.querySelector('.footer');if(footer)footer.textContent=preview?'LUMINARI · Vista ficticia':local?'LUMINARI · Espacio de trabajo local, sin inicio de sesión ni sincronización':'LUMINARI · Sistema privado con base de datos independiente';
}
render=function(){renderBase();layout();};
if(preview){
 // La muestra no escribe datos. Abre el espacio local para registrar información.
 const access=()=>{location.href='./';};
 formEdit=access;quoteEdit=access;updateGoal=access;quoteSave=access;del=access;cloudImport=access;
}
render();
})();