(function(){
// La vista de demostración usa únicamente datos ficticios y no inicia sesión ni consulta Supabase.
if(new URLSearchParams(location.search).get('demo')==='1')return;
const URL='https://kmylrayhpyrksprffeui.supabase.co',KEY='sb_publishable_KUjXR0KwvPLoYWqNHA3D4w_bM7ooNfN';
const tables=['clients','quotes','orders','inventory','transactions','tasks','shipments','expenses'];
let client,user=null,loading=false,saving=false,dirty=false,baseline={},timer;
const el=id=>document.getElementById(id),status=s=>{el('syncStatus').textContent=s},note=s=>{el('authStatus').textContent=s};
async function hydrate(u){loading=true;document.body.classList.remove('authorized');note('Cargando datos protegidos...');
try{const fresh=blank();baseline={};
for(const t of tables){const {data,error}=await client.from(t).select('id,data').order('created_at',{ascending:false}).limit(10000);if(error)throw error;fresh[t]=(data||[]).map(v=>({...v.data,id:v.id}));baseline[t]=new Set(fresh[t].map(v=>v.id))}
const {data,error}=await client.from('settings').select('data').eq('owner_id',u.id).maybeSingle();if(error)throw error;fresh.goal=data?.data?.goal??fresh.goal;
db=fresh;localStorage.setItem('luminari.erp.v1',JSON.stringify(db));render();document.body.classList.add('authorized');status('☁ Supabase conectado');note('');
}catch(e){note('Error de conexión: '+e.message)}finally{loading=false}}
async function flush(){if(!user||loading||saving)return;saving=true;
try{while(dirty){dirty=false;status('↻ Guardando cambios');
for(const t of tables){const entries=db[t]||[],ids=new Set(entries.map(v=>String(v.id)));const removed=[...(baseline[t]||new Set())].filter(id=>!ids.has(id));for(const id of removed){const {error}=await client.from(t).delete().eq('id',id);if(error)throw error}
for(let i=0;i<entries.length;i+=150){const payload=entries.slice(i,i+150).map(row=>({id:String(row.id),owner_id:user.id,data:row}));const {error}=await client.from(t).upsert(payload,{onConflict:'id'});if(error)throw error}baseline[t]=ids}
const {error}=await client.from('settings').upsert({owner_id:user.id,data:{goal:db.goal}},{onConflict:'owner_id'});if(error)throw error;
}status('☁ Datos guardados')}catch(e){dirty=true;status('⚠ Error al sincronizar: '+e.message)}finally{saving=false}}
window.cloudSync=()=>{if(!user||loading)return;dirty=true;clearTimeout(timer);timer=setTimeout(flush,500)};
window.cloudLogout=async()=>{await client.auth.signOut();};
window.cloudImport=async()=>{
if(!user)return alert('Inicia sesión primero.');
let input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=()=>{let file=input.files[0];if(!file)return;let rd=new FileReader();rd.onload=()=>{try{let payload=JSON.parse(rd.result);if(!tables.every(t=>Array.isArray(payload[t])))throw Error('Formato no reconocido');if(!confirm('Esto incorporará los datos históricos del archivo a esta cuenta de LUMINARI, evitando IDs duplicados. ¿Continuar?'))return;
for(const t of tables){const map=new Map(db[t].map(r=>[r.id,r]));for(const r of payload[t])if(!map.has(r.id))map.set(r.id,r);db[t]=[...map.values()]}
save();render();alert('Importación recibida. Comprueba el indicador de sincronización hasta que indique Datos guardados.')}catch(e){alert('Importación rechazada: '+e.message)}};rd.readAsText(file)};input.click()};
document.addEventListener('DOMContentLoaded',async()=>{
if(!window.supabase?.createClient){note('No cargó Supabase JS. Comprueba tu conexión.');return}
client=window.supabase.createClient(URL,KEY);
el('authForm').addEventListener('submit',async ev=>{ev.preventDefault();note('Validando credenciales...');const {error}=await client.auth.signInWithPassword({email:el('authEmail').value,password:el('authPass').value});if(error)note(error.message)});
el('signup').onclick=async()=>{const email=el('authEmail').value,password=el('authPass').value;if(!email||password.length<6)return note('Correo y contraseña de 6 caracteres mínimo.');note('Registrando cuenta...');const {data,error}=await client.auth.signUp({email,password});note(error?error.message:data.session?'Sesión iniciada.':'Confirma tu correo electrónico y luego inicia sesión.')};
client.auth.onAuthStateChange((event,session)=>{if(session?.user&&session.user.id!==user?.id){user=session.user;setTimeout(()=>hydrate(user),0)}else if(!session){user=null;document.body.classList.remove('authorized');note('Accede con tu correo y contraseña.')}});
const {data}=await client.auth.getSession();if(!data.session)note('Accede con tu correo y contraseña.');
});
})();