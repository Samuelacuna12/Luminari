/* LUMINARI: private shared team workspace in a dedicated Supabase project */
(function () {
  if (typeof PRIVATE_MODE === "undefined" || !PRIVATE_MODE) return;
  const SB_URL="https://kmylrayhpyrksprffeui.supabase.co";
  const SB_KEY="sb_publishable_KUjXR0KwvPLoYWqNHA3D4w_bM7ooNfN";
  const TABLES=["clients","quotes","inventory","products","orders","transactions","tasks","shipments","expenses"];
  const ALLOWED=new Set(["admin@luminari.com","gerson@luminari.com","omar@luminari.com","karen@luminari.com"]);
  let client,user=null,loading=false,saving=false,queued=false,baseline={},timer=null,mode="activate";
  const el=id=>document.getElementById(id);
  const note=msg=>{if(el("authStatus"))el("authStatus").textContent=msg;};
  const status=msg=>{if(el("syncStatus"))el("syncStatus").textContent=msg;};
  const fingerprint=row=>JSON.stringify(row);
  async function codeHash(code) {
    const bytes=new TextEncoder().encode(code.trim().toUpperCase());
    const digest=await crypto.subtle.digest("SHA-256",bytes);
    return Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,"0")).join("");
  }
  function authMode(next) {
    mode=next;
    el("authTitle").textContent=next==="activate"?"Activa tu acceso a LUMINARI":"Ingresa a LUMINARI";
    el("authInstruction").textContent=next==="activate"
      ?"Crea una clave segura que no se te olvide nunca. Es personal y la usarás cada vez que ingreses."
      :"Ingresa con tu correo de LUMINARI y la contraseña que elegiste.";
    el("activationWrap").style.display=next==="activate"?"block":"none";
    el("activationCode").required=next==="activate";
    el("authPass").minLength=next==="activate"?12:6;
    el("authPass").autocomplete=next==="activate"?"new-password":"current-password";
    el("authSubmit").textContent=next==="activate"?"Crear mi contraseña y activar acceso":"Iniciar sesión";
    el("authModeToggle").textContent=next==="activate"?"Ya tengo contraseña · Iniciar sesión":"Primera vez · Crear mi contraseña";
    note("");
  }
  async function loadTable(table) {
    const result=[];
    for(let offset=0;offset<20000;offset+=1000){
      const {data,error}=await client.from(table).select("id,data").order("created_at",{ascending:false}).range(offset,offset+999);
      if(error)throw error;
      for(const row of data||[])result.push({...row.data,id:String(row.id)});
      if((data||[]).length<1000)break;
    }
    return result;
  }
  async function hydrate(person) {
    loading=true;
    document.body.classList.remove("authorized");
    note("Cargando la información real de LUMINARI...");
    try{
      // Confirm membership server-side. RLS provides final enforcement on each table.
      const {data:allowed,error:memberError}=await client.rpc("is_luminari_member");
      if(memberError)throw Error("Falta instalar la configuración del equipo en Supabase.");
      if(!allowed)throw Error("La cuenta aún no está autorizada para el equipo LUMINARI.");
      const next=blank(),snap={};
      for(const table of TABLES){
        next[table]=await loadTable(table);
        snap[table]=new Map(next[table].map(row=>[String(row.id),fingerprint(row)]));
      }
      const {data:config,error:cfgError}=await client.from("luminari_config").select("data").eq("name","business").maybeSingle();
      if(cfgError)throw cfgError;
      next.goal=Number(config?.data?.goal)||30000000;
      db=next;baseline=snap;
      render();
      document.body.classList.add("authorized");
      status("☁ Sincronizado con Supabase");
      note("");
    }catch(err){
      status("⚠ Error al cargar Supabase");
      note("No se pudo abrir la base compartida: "+err.message);
    }finally{loading=false;}
  }
  async function flush(){
    if(!user||loading||saving)return;
    saving=true;
    try{
      while(queued){
        queued=false;
        status("↻ Guardando cambios en Supabase...");
        for(const table of TABLES){
          const records=db[table]||[],old=baseline[table]||new Map();
          const current=new Map(records.map(r=>[String(r.id),fingerprint(r)]));
          const changes=records.filter(r=>old.get(String(r.id))!==current.get(String(r.id)));
          const deletions=[...old.keys()].filter(id=>!current.has(id));
          for(let i=0;i<changes.length;i+=100){
            const items=changes.slice(i,i+100).map(r=>({id:String(r.id),owner_id:user.id,data:r}));
            const {error}=await client.from(table).upsert(items,{onConflict:"id"});
            if(error)throw error;
          }
          for(const id of deletions){
            const {error}=await client.from(table).delete().eq("id",id);
            if(error)throw error;
          }
          baseline[table]=current;
        }
        const {error}=await client.from("luminari_config").upsert({name:"business",data:{goal:db.goal},updated_at:new Date().toISOString()},{onConflict:"name"});
        if(error)throw error;
      }
      status("☁ Guardado en Supabase");
    }catch(err){
      queued=true;
      status("⚠ No se guardaron los cambios: "+err.message);
    }finally{saving=false;}
  }

  // Direct commits surface SQL/stock errors to the form and refresh snapshots.
  async function settlePending(){
    if(loading||!user)throw Error("Inicia sesión y carga los datos de LUMINARI.");
    if(saving)throw Error("Hay un guardado en curso. Revisa el estado y repite la acción.");
    if(queued){
      clearTimeout(timer);
      await flush();
      if(queued)throw Error("Hay cambios pendientes que aún no se han sincronizado.");
    }
  }
  async function refreshCollections(names){
    for(const table of names){
      const rows=await loadTable(table);
      db[table]=rows;
      baseline[table]=new Map(rows.map(row=>[String(row.id),fingerprint(row)]));
    }
    render();
  }
  window.cloudRecordClientSale=async(customer,sale)=>{
    await settlePending();
    saving=true;
    status("↻ Registrando cliente, venta y consumo...");
    try{
      const {error}=await client.rpc("luminari_record_client_sale",{p_client:customer,p_order:sale});
      if(error)throw error;
      await refreshCollections(["clients","orders","products","inventory"]);
      status("☁ Compra e inventario guardados en Supabase");
    }catch(error){
      status("⚠ No se guardó la compra: "+error.message);
      throw error;
    }finally{saving=false;}
  };
  window.cloudRecordOrder=async(order)=>{
    await settlePending();
    saving=true;
    status("↻ Registrando pedido y consumo...");
    try{
      const {error}=await client.from("orders").upsert({
        id:String(order.id),owner_id:user.id,data:order
      },{onConflict:"id"});
      if(error)throw error;
      await refreshCollections(["orders","products","inventory"]);
      status("☁ Pedido e inventario sincronizados");
    }catch(error){
      status("⚠ No se guardó el pedido: "+error.message);
      throw error;
    }finally{saving=false;}
  };
  window.cloudDeleteOrder=async(id)=>{
    await settlePending();
    saving=true;
    status("↻ Eliminando pedido y reponiendo existencias...");
    try{
      const {error}=await client.from("orders").delete().eq("id",String(id));
      if(error)throw error;
      await refreshCollections(["orders","products","inventory"]);
      status("☁ Pedido eliminado; existencias actualizadas");
    }catch(error){
      status("⚠ No se eliminó el pedido: "+error.message);
      throw error;
    }finally{saving=false;}
  };
  // Al volver a la pestaña, consultar el stock compartido de otros miembros del equipo.
  document.addEventListener("visibilitychange",()=>{
    if(document.visibilityState!=="visible"||!user||loading||saving||queued||el("modal")?.open)return;
    refreshCollections(["products","inventory","orders"]).catch(err=>status("⚠ No se pudieron actualizar las existencias: "+err.message));
  });
  window.cloudSync=()=>{if(!user||loading)return;queued=true;clearTimeout(timer);timer=setTimeout(flush,400);};
  window.cloudLogout=async()=>{if(client)await client.auth.signOut();};
  window.cloudImport=()=>alert("El historial se carga desde Supabase automáticamente cuando está instalada la configuración del equipo.");
  document.addEventListener("DOMContentLoaded",async()=>{
    if(!window.supabase?.createClient){note("No se pudo iniciar Supabase. Revisa tu conexión.");return;}
    client=window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
    authMode("activate");
    el("authModeToggle").addEventListener("click",()=>authMode(mode==="activate"?"login":"activate"));
    el("authForm").addEventListener("submit",async event=>{
      event.preventDefault();
      const email=el("authEmail").value.trim().toLowerCase();
      const password=el("authPass").value;
      if(!ALLOWED.has(email)){note("Este correo no está autorizado para LUMINARI.");return;}
      el("authSubmit").disabled=true;
      try{
        if(mode==="activate"){
          const code=el("activationCode").value.toUpperCase().trim();
          if(!/^[A-Z2-9]{5}(?:-[A-Z2-9]{5}){3}$/.test(code))throw Error("Introduce el código de activación individual completo.");
          if(password.length<12||!/[A-Z]/.test(password)||!/[a-z]/.test(password)||!/[0-9]/.test(password))throw Error("La clave requiere al menos 12 caracteres, una mayúscula, una minúscula y un número.");
          note("Comprobando que LUMINARI esté configurado...");
          const setup=await client.rpc("luminari_signup_ready");
          if(setup.error||setup.data!==true)throw Error("Falta instalar la configuración inicial de usuarios en Supabase. La cuenta no se ha creado.");
          note("Registrando tu acceso...");
          const hash=await codeHash(code);
          const {data,error}=await client.auth.signUp({email,password,options:{data:{activation_hash:hash}}});
          if(error)throw error;
          if(!data.session)note("Supabase solicita confirmar el correo. El administrador debe desactivar «Confirm email» en Authentication → Providers → Email del proyecto LUMINARI.");
          else note("Cuenta creada. Cargando la información compartida...");
        }else{
          note("Iniciando sesión...");
          const {error}=await client.auth.signInWithPassword({email,password});
          if(error)throw error;
        }
      }catch(err){
        note("No fue posible ingresar: "+err.message);
      }finally{el("authSubmit").disabled=false;}
    });
    client.auth.onAuthStateChange((event,session)=>{
      if(session?.user&&session.user.id!==user?.id){user=session.user;setTimeout(()=>hydrate(user),0);}
      if(!session){user=null;document.body.classList.remove("authorized");if(event==="SIGNED_OUT")note("Sesión cerrada.");}
    });
    const {data,error}=await client.auth.getSession();
    if(error)note("Error de sesión: "+error.message);
    else if(!data.session)note("Usa tu código individual para activar la cuenta o entra con tu contraseña.");
  });
})();