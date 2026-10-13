/* LUMINARI · clientes + catálogo de diseños + consumo por venta */
(function(){
 if(typeof db==='undefined'||typeof menu==='undefined') return;
 if(!Array.isArray(db.products)) db.products=[];
 const idx=menu.findIndex(x=>x[0]==='inventory');
 if(!menu.some(x=>x[0]==='products')) menu.splice(Math.max(idx,0),0,['products','✳','Productos']);
 specs.products={name:'Producto',fields:[]};
 colsets.products=[['name','Producto'],['sku','Referencia'],['category','Categoría'],['price','Precio venta','money'],['stock','Unidades'],['min','Mínimo']];
 if(IS_SAMPLE){render();return;}

 const baseForm=formEdit,baseSubmit=submitRecord,baseDel=del,baseClientRows=clientSalesRows,baseClientDetail=clientSalesDetails,baseRender=render;
 const divs=document.createElement('style');
 divs.textContent='.lum-module-note{background:#f1f3ef;border:1px solid #dedfd9;color:#50554e;border-radius:14px;padding:13px 15px;margin:14px 0;font-size:12px;line-height:1.65}.lum-subtitle{font-size:15px;font-weight:750;margin:22px 0 8px;color:#343934}.lum-sale-line{display:grid;grid-template-columns:1.3fr 1.1fr 75px 120px 32px;gap:7px;align-items:center;margin:9px 0}.lum-sale-line input,.lum-sale-line select,.lum-bom-line input,.lum-bom-line select{width:100%;min-width:0;padding:10px;border:1px solid #d7dad4;border-radius:9px;background:#fff;font-size:12px}.lum-sale-line button,.lum-bom-line button{border:0;background:#f4e3e3;color:#994848;border-radius:8px;padding:9px;font-weight:800}.lum-sale-line small{grid-column:1/-1;color:#69736d;margin-top:-4px}.lum-meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:10px 0}.lum-meta label{font-size:12px;color:#656a65}.lum-meta input,.lum-meta select{display:block;width:100%;padding:10px;border:1px solid #d7dad4;border-radius:9px;background:white}.lum-section{border-top:1px solid #e1e3dd;margin-top:18px;padding-top:8px}.lum-add{border:1px dashed #abb6aa;color:#485448;border-radius:10px;background:#f7f9f5;padding:9px 12px;font-weight:700;font-size:12px}.lum-total{margin:12px 0 0;text-align:right;font-size:13px}.lum-total strong{font-size:20px;color:#282e28}.lum-bom-line{display:grid;grid-template-columns:1fr 110px 32px;gap:7px;margin:7px 0}.lum-stats{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0}.lum-stat{background:#f5f6f3;border:1px solid #e0e4dc;border-radius:13px;padding:12px 16px;flex:1;min-width:160px}.lum-stat b{display:block;font-size:20px}.lum-stat small{color:#6b716a}.lum-toggle{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:700;margin-top:14px}.lum-toggle input{width:18px;height:18px}.lum-modal-actions{margin-top:14px}.lum-catalog-note{font-size:11px;color:#797e77}.lum-wide{grid-column:1/-1}@media(max-width:720px){.lum-sale-line{grid-template-columns:1fr 1fr 50px;gap:6px}.lum-sale-line .lum-product-select{grid-column:1/3}.lum-sale-line .lum-desc{grid-column:1/3}.lum-sale-line .lum-qty{grid-column:1}.lum-sale-line .lum-price{grid-column:2}.lum-sale-line .lum-remove{grid-column:3;grid-row:2/4}.lum-meta{grid-template-columns:1fr}.lum-sale-line small{grid-column:1/-1}.lum-bom-line{grid-template-columns:1fr 85px 30px}}';
 document.head.appendChild(divs);

 function lookupProduct(id){return db.products.find(p=>String(p.id)===String(id))}
 function priceNum(x){const n=Number(x);return Number.isFinite(n)&&n>=0?n:0}
 function productOptions(chosen){
   return '<option value="">Manual · sin descuento de inventario</option>'+db.products.filter(p=>p.active!=='Inactivo'||String(p.id)===String(chosen)).map(p=>'<option value="'+esc(p.id)+'" '+(String(chosen)===String(p.id)?'selected':'')+'>'+esc(p.sku?p.sku+' · '+p.name:p.name)+'</option>').join('');
 }
 function lineHTML(item){
   const p=item||{};
   return '<div class="lum-sale-line">'+
    '<select class="lum-product-select sale-product" aria-label="Producto del catálogo" onchange="commerceChooseProduct(this)">'+productOptions(p.productId||'')+'</select>'+
    '<input class="lum-desc sale-description" aria-label="Descripción de la compra" placeholder="¿Qué compró?" value="'+esc(p.description||'')+'" oninput="commerceRecalc()">'+
    '<input class="lum-qty sale-qty" aria-label="Cantidad" type="number" min="0.01" step="any" value="'+esc(p.qty??1)+'" oninput="commerceRecalc()">'+
    '<input class="lum-price sale-price" aria-label="Precio unitario COP" type="number" min="0" step="any" value="'+esc(p.price??0)+'" oninput="commerceRecalc()">'+
    '<button type="button" class="lum-remove" aria-label="Eliminar producto" onclick="this.closest(\'.lum-sale-line\').remove();commerceRecalc()">×</button>'+
    '<small class="sale-consumption"></small></div>';
 }
 function saleEditor(items,withMeta,values){
   const x=values||{};
   let html='<div class="lum-sale-editor lum-section"><div class="lum-subtitle">Productos comprados</div>'+
    '<p class="lum-catalog-note">Elige un producto del catálogo para descontar sus materiales. También puedes registrar una compra manual sin descuento.</p>'+
    '<div class="lum-sale-lines">'+(items||[]).map(lineHTML).join('')+'</div>'+
    '<button type="button" class="lum-add" onclick="commerceAddSaleLine(this)">＋ Agregar producto</button>'+
    '<div class="lum-total">Valor de esta compra: <strong class="sale-total">'+money(0)+'</strong></div>';
   if(withMeta){
      html+='<div class="lum-meta">'+
        '<label>Fecha real de compra<input type="date" class="sale-date" value="'+esc(x.date||now())+'"></label>'+
        '<label>Abono recibido (COP)<input type="number" class="sale-paid" min="0" step="any" value="'+esc(x.paid??0)+'"></label>'+
        '<label>Estado<select class="sale-status">'+['Pendiente','En fabricación','Terminado','Enviado','Entregado','Cancelado'].map(s=>'<option '+(s===(x.status||'Pendiente')?'selected':'')+'>'+s+'</option>').join('')+'</select></label>'+
        '</div>';
   }
   html+='</div>';
   return html;
 }
 function entryRows(root){return [...root.querySelectorAll('.lum-sale-line')].map(row=>{
   const productId=row.querySelector('.sale-product').value;
   return {productId,description:row.querySelector('.sale-description').value.trim(),qty:Number(row.querySelector('.sale-qty').value),price:Number(row.querySelector('.sale-price').value)};
 });}
 function validLines(root,required){
   const items=entryRows(root);
   if(required&&!items.length)throw Error('Agrega al menos un producto comprado.');
   for(const item of items){
      if(!item.description)throw Error('Indica qué compró el cliente.');
      if(!Number.isFinite(item.qty)||item.qty<=0)throw Error('Revisa la cantidad de cada producto.');
      if(!Number.isFinite(item.price)||item.price<0)throw Error('Revisa el precio unitario.');
      if(item.productId&&!lookupProduct(item.productId))throw Error('El producto ya no existe en el catálogo.');
   }
   return items;
 }
 function updateRowHint(row){
    const p=lookupProduct(row.querySelector('.sale-product').value);
    const h=row.querySelector('.sale-consumption');if(!h)return;
    if(!p){h.textContent='Compra manual: no afecta el inventario.';return;}
    const materials=(p.materials||[]).map(m=>{const stock=db.inventory.find(x=>String(x.id)===String(m.id));return (stock?stock.name:'Material no disponible')+' × '+m.qty}).join(' · ');
    h.textContent=(p.trackStock?'Descuenta unidad terminada. ':'')+(materials?'Materiales por unidad: '+materials:'Sin materiales configurados');
 }
 window.commerceRecalc=function(){
    document.querySelectorAll('.lum-sale-editor').forEach(root=>{
      const lines=entryRows(root);
      const total=sum(lines,i=>Number.isFinite(i.qty)&&Number.isFinite(i.price)?i.qty*i.price:0);
      const el=root.querySelector('.sale-total');if(el)el.textContent=money(total);
      root.querySelectorAll('.lum-sale-line').forEach(updateRowHint);
    });
 };
 window.commerceChooseProduct=function(sel){
   const row=sel.closest('.lum-sale-line'),p=lookupProduct(sel.value);
   if(p){row.querySelector('.sale-description').value=p.name||'';row.querySelector('.sale-price').value=priceNum(p.price);}
   commerceRecalc();
 };
 window.commerceAddSaleLine=function(btn){
   const root=btn.closest('.lum-sale-editor');
   root.querySelector('.lum-sale-lines').insertAdjacentHTML('beforeend',lineHTML({qty:1,price:0}));
   commerceRecalc();
 };
 function validateSale(root,client){
   const lines=validLines(root,true);
   const total=sum(lines,x=>x.qty*x.price),date=root.querySelector('.sale-date')?.value||'';
   const paid=Number(root.querySelector('.sale-paid')?.value||0);
   if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Indica la fecha de compra.');
   if(!Number.isFinite(paid)||paid<0||paid>total)throw Error('El abono no puede ser negativo ni superar el valor de compra.');
   return {id:uid(),code:'LUM-'+Date.now().toString(36).toUpperCase(),client:client.name,clientId:client.id,
     phone:client.phone||'',date:date,due:'',amount:total,paid:paid,cost:0,
     status:root.querySelector('.sale-status')?.value||'Pendiente',
     product:lines.map(x=>x.description).join(', '),items:lines,notes:'Compra registrada desde Clientes CRM'};
 }
 let saleBusy=false;
 async function commitClientSale(customer,sale){
   if(saleBusy)return;
   saleBusy=true;
   const foot=document.getElementById('modalFoot');
   const buttons=foot?[...foot.querySelectorAll('button')]:[];
   buttons.forEach(b=>b.disabled=true);
   try{
     if(PRIVATE_MODE){
       if(typeof window.cloudRecordClientSale!=='function')throw Error('La conexión segura no está disponible.');
       await window.cloudRecordClientSale(customer,sale);
     }else{
       db.clients=db.clients.filter(c=>String(c.id)!==String(customer.id));
       db.clients.unshift(customer);
       db.orders.unshift(sale);save();
     }
     closeModal();render();
   }catch(err){alert('No fue posible guardar la compra: '+(err.message||err));}
   finally{buttons.forEach(b=>b.disabled=false);saleBusy=false;}
 }
 function customerObject(form,clientId){
    const raw=Object.fromEntries(new FormData(form).entries());
    if(!String(raw.name||'').trim())throw Error('Escribe el nombre del cliente.');
    const prev=db.clients.find(x=>String(x.id)===String(clientId))||{};
    return {...prev,...raw,id:clientId||uid()};
 }
 window.commerceTogglePurchase=function(){
   const x=document.getElementById('purchaseAddon');
   if(x)x.hidden=!document.getElementById('addPurchase').checked;
   commerceRecalc();
 };
 window.commerceSaleForClient=function(id){
   const c=db.clients.find(x=>String(x.id)===String(id));if(!c)return;
   showModal('Nueva compra · '+c.name,
     '<form id="recordSaleOnly" onsubmit="commerceSubmitClientSale(event,\''+esc(c.id)+'\')">'+saleEditor([{qty:1,price:0}],true)+'</form>',
     btn('Cancelar','closeModal()','light')+btn('Guardar compra',"document.getElementById('recordSaleOnly').requestSubmit()"));
   commerceRecalc();
 };
 window.commerceSubmitClientSale=async function(e,id){
   e.preventDefault();if(saleBusy)return;
   const customer=db.clients.find(x=>String(x.id)===String(id));if(!customer)return;
   try{const sale=validateSale(e.target,customer);await commitClientSale(customer,sale)}
   catch(err){alert(err.message||err);}
 };

 function bomLineHTML(row){
   const x=row||{};
   return '<div class="lum-bom-line"><select class="bom-material" aria-label="Material">'+
      '<option value="">Selecciona material</option>'+db.inventory.map(m=>'<option value="'+esc(m.id)+'" '+(String(x.id)===String(m.id)?'selected':'')+'>'+esc(m.name)+' ('+esc(m.unit||'Unidad')+')</option>').join('')+
      '</select><input class="bom-qty" aria-label="Consumo por unidad" type="number" min="0.01" step="any" value="'+esc(x.qty??1)+'">'+
      '<button type="button" aria-label="Eliminar material" onclick="this.parentElement.remove()">×</button></div>';
 }
 window.commerceAddBOM=function(btn){
   btn.previousElementSibling.insertAdjacentHTML('beforeend',bomLineHTML({qty:1}));
 };
 function productEdit(id){
   editing=id;
   const p=db.products.find(x=>String(x.id)===String(id))||{};
   const names=[field('name','Nombre del producto','text',p.name),field('sku','Referencia / SKU','text',p.sku),
    field('category','Tipo / categoría','text',p.category),field('price','Precio de venta (COP)','number',p.price??0),
    field('cost','Costo estimado (COP)','number',p.cost??0),field('stock','Unidades terminadas disponibles','number',p.stock??0),
    field('min','Mínimo de unidades','number',p.min??0),field('active','Estado','select',p.active||'Activo',['Activo','Inactivo']),
    field('notes','Características y observaciones','textarea',p.notes)].join('');
   showModal((id?'Editar':'Nuevo')+' producto',
    '<form id="productForm" onsubmit="commerceSaveProduct(event)"><div class="formgrid">'+names+'</div>'+
    '<label class="lum-toggle"><input name="trackStock" type="checkbox" '+(p.trackStock?'checked':'')+'> Descontar unidades terminadas cuando se venda</label>'+
    '<div class="lum-module-note">Para lámparas hechas sobre pedido, deja desactivado el control de unidades terminadas y define los materiales consumidos por diseño.</div>'+
    '<h4 class="lum-subtitle">Materiales utilizados por cada unidad vendida</h4>'+
    '<div id="productBOM">'+(p.materials||[]).map(bomLineHTML).join('')+'</div>'+
    '<button type="button" class="lum-add" onclick="commerceAddBOM(this)">＋ Agregar material</button></form>',
    btn('Cancelar','closeModal()','light')+btn('Guardar producto',"document.getElementById('productForm').requestSubmit()"));
 }
 window.commerceSaveProduct=function(e){
   e.preventDefault();const form=e.target;
   const v=Object.fromEntries(new FormData(form).entries());
   if(!String(v.name||'').trim())return alert('Escribe el nombre del producto.');
   const rows=[...form.querySelectorAll('.lum-bom-line')];
   const materials=[];
   for(const row of rows){
     const id=row.querySelector('.bom-material').value;
     const qty=Number(row.querySelector('.bom-qty').value);
     if(!id||!Number.isFinite(qty)||qty<=0)return alert('Selecciona un material y su cantidad válida.');
     if(!db.inventory.some(x=>String(x.id)===String(id)))return alert('Ese material no está en inventario.');
     materials.push({id,qty});
   }
   for(const key of ['price','cost','stock','min'])v[key]=priceNum(v[key]);
   v.trackStock=!!form.querySelector('[name=trackStock]').checked;
   v.materials=materials;
   const prev=db.products.find(x=>String(x.id)===String(editing))||{};
   const rec={...prev,...v,id:editing||uid()};
   db.products=db.products.filter(p=>String(p.id)!==String(rec.id));
   db.products.unshift(rec);save();closeModal();render();
 };
 formEdit=function(type,id){
   if(type==='products'){productEdit(id);return;}
   baseForm(type,id);
   const form=document.getElementById('recordForm');
   if(!form)return;
   if(type==='clients'){
     const c=db.clients.find(x=>String(x.id)===String(id));
     const past=c?clientPurchases(c):null;
     form.insertAdjacentHTML('beforeend',
       (past?'<div class="lum-module-note">Historial actual: <b>'+past.orders.length+' compras</b> · Valor acumulado de pedidos: <b>'+money(past.total)+'</b>. Las compras antiguas se mantienen sin cambios.</div>':'')+
       '<div class="lum-section"><label class="lum-toggle"><input type="checkbox" id="addPurchase" onchange="commerceTogglePurchase()"> Registrar una compra de este cliente ahora</label>'+
       '<div id="purchaseAddon" hidden>'+saleEditor([{qty:1,price:0}],true)+'</div></div>');
   }
   if(type==='orders'){
     const x=db.orders.find(o=>String(o.id)===String(id))||{};
     form.insertAdjacentHTML('beforeend','<div class="lum-module-note">Los productos seleccionados del catálogo descuentan inventario. Los pedidos históricos sin productos vinculados no se descuentan retroactivamente.</div>'+saleEditor(Array.isArray(x.items)?x.items:[],false));
   }
   commerceRecalc();
 };
 submitRecord=async function(e,type){
   if(type==='products'){commerceSaveProduct(e);return;}
   if(type==='clients'){
     const add=e.target.querySelector('#addPurchase');
     if(!add?.checked){return baseSubmit(e,type);}
     e.preventDefault();if(saleBusy)return;
     try{const customer=customerObject(e.target,editing);const sale=validateSale(e.target.querySelector('#purchaseAddon'),customer);await commitClientSale(customer,sale);}
     catch(err){alert(err.message||err);}
     return;
   }
   if(type==='orders'){
     e.preventDefault();if(saleBusy)return;
     const raw=Object.fromEntries(new FormData(e.target).entries());
     const old=db.orders.find(o=>String(o.id)===String(editing))||{};
     let items=[];
     try{items=validLines(e.target,false);}catch(err){return alert(err.message);}
     if(!String(raw.client||'').trim())return alert('Indica el nombre del cliente.');
     if(items.length){
       raw.items=items;
       raw.amount=sum(items,x=>x.qty*x.price);
       raw.product=items.map(x=>x.description).join(', ');
     }else if(Array.isArray(old.items)){
       raw.items=[];
     }
     const matching=db.clients.filter(x=>customerKey(x.name)===customerKey(raw.client));
     const rec={...old,...raw,id:editing||uid()};
     if(!rec.clientId&&matching.length===1)rec.clientId=matching[0].id;
     saleBusy=true;
     try{
       if(PRIVATE_MODE){
         if(!window.cloudRecordOrder)throw Error('La conexión segura no está disponible.');
         await window.cloudRecordOrder(rec);
       }else{
         db.orders=db.orders.filter(x=>String(x.id)!==String(rec.id));
         db.orders.unshift(rec);save();
       }
       closeModal();render();
     }catch(err){alert('No se pudo guardar el pedido: '+(err.message||err));}
     finally{saleBusy=false;}
     return;
   }
   return baseSubmit(e,type);
 };
 del=async function(type,id){
   if(type==='products'){
     const used=db.orders.some(o=>(o.items||[]).some(i=>String(i.productId)===String(id))||(o._stock_allocations||[]).some(i=>String(i.productId)===String(id)));
     if(used)return alert('Este producto tiene ventas registradas. Edítalo y márcalo como Inactivo para preservar su historial.');
   }
   if(type==='inventory'){
     const used=db.products.some(p=>(p.materials||[]).some(i=>String(i.id)===String(id)))||
       db.orders.some(o=>(o._stock_allocations||[]).some(a=>(a.materials||[]).some(i=>String(i.id)===String(id))));
     if(used)return alert('Este material está vinculado a productos o pedidos. Edítalo en lugar de eliminarlo.');
   }
   if(type==='orders'&&PRIVATE_MODE){
     if(!confirm('¿Eliminar este pedido? Si descontó inventario, sus existencias se repondrán.'))return;
     try{await window.cloudDeleteOrder(id);render();}
     catch(err){alert('No se pudo eliminar: '+(err.message||err));}
     return;
   }
   return baseDel(type,id);
 };
 clientSalesRows=function(){
   const base=baseClientRows();
   return base.replace(/(<button data-customer-id="([^"]+)" onclick="clientSalesDetails\(this\.dataset\.customerId\)">Ver compras<\/button>)/g,
     '$1<button data-customer-id="$2" onclick="commerceSaleForClient(this.dataset.customerId)">＋ Compra</button>');
 };
 clientSalesDetails=function(id){
   const c=db.clients.find(x=>String(x.id)===String(id));if(!c)return;
   const v=clientPurchases(c);
   const orders=[...v.orders].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
   const lineDescription=o=>Array.isArray(o.items)&&o.items.length?o.items.map(i=>(i.qty||1)+' × '+(i.description||'Producto')).join(' · '):(o.product||'Sin detalle');
   const table=orders.length?'<div class="tablewrap"><table class="tbl"><thead><tr><th>Fecha</th><th>Pedido</th><th>Qué compró</th><th>Valor de compra</th><th>Abonado</th><th>Estado</th></tr></thead><tbody>'+
     orders.map(o=>'<tr><td>'+esc(/^\d{4}-\d{2}-\d{2}$/.test(String(o.date||''))?o.date:'Sin fecha registrada')+'</td><td>'+esc(o.code||'—')+'</td><td>'+esc(lineDescription(o))+'</td><td><b>'+money(o.amount)+'</b></td><td>'+money(o.paid)+'</td><td>'+badge(o.status)+'</td></tr>').join('')+
     '</tbody></table></div>':'<div class="lum-module-note">Aún no hay compras vinculadas a este cliente.</div>';
   showModal('Compras · '+c.name,
     '<div class="lum-stats"><div class="lum-stat"><small>Valor de pedidos</small><b>'+money(v.total)+'</b></div><div class="lum-stat"><small>Compras registradas</small><b>'+v.orders.length+'</b></div><div class="lum-stat"><small>Este mes</small><b>'+money(v.month)+'</b></div></div>'+
     '<p class="lum-catalog-note">Valor vendido no equivale a recaudo. Los históricos pueden requerir validación.</p>'+table,
     btn('Cerrar','closeModal()','light')+btn('＋ Registrar compra',"closeModal();commerceSaleForClient('"+esc(c.id)+"')"));
 };
 function inventoryUsagePanel(){
   const totals=new Map(),recent=[];
   for(const o of db.orders){
     for(const a of o._stock_allocations||[]){
       for(const m of a.materials||[]){
         totals.set(String(m.id),(totals.get(String(m.id))||0)+Number(m.qty||0));
       }
       recent.push({code:o.code,date:o.date,product:a.name||a.productId,qty:a.qty,
         materials:(a.materials||[]).map(m=>{const x=db.inventory.find(y=>String(y.id)===String(m.id));return (x?.name||'Material')+' × '+m.qty}).join(' · ')});
     }
   }
   const lines=[...totals.entries()].map(([id,qty])=>{
      const x=db.inventory.find(m=>String(m.id)===id);
      return '<tr><td>'+esc(x?.name||'Material')+'</td><td>'+qty.toLocaleString('es-CO')+' '+esc(x?.unit||'u.')+'</td><td>'+esc(x?.stock??'—')+'</td></tr>';
   });
   const log=recent.sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,25)
     .map(x=>'<tr><td>'+esc(/^\d{4}-\d{2}-\d{2}$/.test(String(x.date||''))?x.date:'Sin fecha')+'</td><td>'+esc(x.code||'—')+'</td><td>'+esc(x.qty)+' × '+esc(x.product)+'</td><td>'+esc(x.materials||'Sin materiales')+'</td></tr>');
   return '<section class="panel" style="margin-top:18px"><div class="section-title">Consumo automático de inventario</div><div class="lum-module-note">Este consumo corresponde únicamente a pedidos nuevos que tienen productos del catálogo vinculados. No se asignan consumos ficticios a ventas históricas.</div>'+
     '<h4>Material consumido por pedidos registrados</h4><div class="tablewrap"><table class="tbl"><thead><tr><th>Material</th><th>Cantidad gastada</th><th>Existencia actual</th></tr></thead><tbody>'+(lines.join('')||'<tr><td colspan="3">Todavía no hay consumos automáticos registrados.</td></tr>')+'</tbody></table></div>'+
     '<h4 style="margin-top:22px">Últimos pedidos que descontaron inventario</h4><div class="tablewrap"><table class="tbl"><thead><tr><th>Fecha</th><th>Pedido</th><th>Producto</th><th>Materiales descontados</th></tr></thead><tbody>'+(log.join('')||'<tr><td colspan="4">Sin movimientos nuevos.</td></tr>')+'</tbody></table></div></section>';
 }
 render=function(){
   baseRender();
   const main=document.getElementById('main');if(!main)return;
   if(page==='inventory'){
      const foot=main.querySelector('.footer');
      if(foot)foot.insertAdjacentHTML('beforebegin',inventoryUsagePanel());
   }
   if(page==='products'){
      const toolbarEl=main.querySelector('.toolbar');
      if(toolbarEl)toolbarEl.insertAdjacentHTML('beforebegin',
        '<div class="lum-module-note">Registra cada modelo de lámpara, su precio y los materiales que consume por unidad. Las ventas nuevas descuentan automáticamente esas existencias. Para diseños hechos sobre pedido, puedes controlar solo sus materiales.</div>');
   }
 };
 render();
})();