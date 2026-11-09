/* Tmoh V6: optional Supabase Auth + per-user encrypted-transport cloud profile.
   Never store passwords. Requires cloud-config.js + Supabase SQL/RLS.
   Existing guest profiles are preserved; account sync is activated only after sign-in.
*/
(function(){
"use strict";
const cfg=window.TMOH_CLOUD_CONFIG||{};
const validURL=typeof cfg.url==="string"&&/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(cfg.url);
const configured=validURL&&typeof cfg.publishableKey==="string"&&cfg.publishableKey.length>15;
let client=null;
let loadingSDK=null;
async function ensureClient(){
 if(client)return client;
 if(!configured)throw Error("ربط Supabase لم يتم تفعيله بعد");
 if(!window.supabase?.createClient){
  if(!loadingSDK)loadingSDK=new Promise((resolve,reject)=>{
   const s=document.createElement("script");
   s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
   s.onload=resolve;s.onerror=()=>reject(Error("تعذر تحميل مكتبة تسجيل الدخول. حاول عند توفر الإنترنت."));document.head.appendChild(s);
  });
  await loadingSDK;
 }
 if(!window.supabase?.createClient)throw Error("مكتبة الحساب غير متاحة");
 client=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 return client;
}
let user=null,syncTimer=null,saving=false,dirty=false,lastError="",isLoading=false;
const localKey=id=>"cloud-"+id;
function status(){return {configured:!!configured, signedIn:!!user, email:user?.email||"",error:lastError, loading:isLoading};}
function hasCloudProfile(){return !!(user&&typeof d!=="undefined"&&d?.id===localKey(user.id));}
function doSave(){if(!client||!hasCloudProfile())return;dirty=true;clearTimeout(syncTimer);syncTimer=setTimeout(flush,650);}
async function flush(){if(!client||!hasCloudProfile()||!dirty||saving)return;saving=true;dirty=false;let uid=user.id,p=JSON.parse(JSON.stringify(d));try{
 const {error}=await client.from("student_data").upsert({user_id:uid,profile:p,updated_at:new Date().toISOString()},{onConflict:"user_id"});
 if(error)throw error;lastError="";
 }catch(e){lastError="تعذر رفع التعديلات. محفوظة على الجهاز وسنحاول عند عودة الاتصال.";dirty=true;}
 finally{saving=false;if(dirty&&navigator.onLine)syncTimer=setTimeout(flush,3500);}
}
async function restore(){if(!configured)return;await ensureClient();isLoading=true;try{const {data:{session},error}=await client.auth.getSession();if(error)throw error;if(session?.user){await connectUser(session.user,true)}}catch(e){lastError="تعذر استرجاع جلسة الحساب. البيانات المحلية محفوظة."}finally{isLoading=false}}
async function connectUser(u,restoreOnly){user=u;let key=localKey(u.id);const {data,error}=await client.from("student_data").select("profile").eq("user_id",u.id).maybeSingle();if(error)throw error;
 if(data?.profile&&typeof data.profile.name==="string"){
   const p=Object.assign({},data.profile,{id:key});R.profiles[key]=p;R.active=key;save();enter();return;
 }
 if(R.profiles[key]){R.active=key;save();enter();doSave();return;}
 // If a guest profile exists, do not migrate it silently into the new account.
 const guestIds=Object.keys(R.profiles).filter(x=>!x.startsWith("cloud-"));
 if(!restoreOnly&&guestIds.length&&confirm("عندك ملف قديم على الجهاز. تحب تربط الملف الحالي بحسابك الجديد؟ (هنحتفظ بنسخة محلية)") ){
   const src=R.profiles[R.active]&&!String(R.active).startsWith("cloud-")?R.profiles[R.active]:R.profiles[guestIds[0]];
   const copy=JSON.parse(JSON.stringify(src));copy.id=key;R.profiles[key]=copy;R.active=key;save();enter();doSave();return;
 }
 R.active=null;save();welcome("dream");msg("الحساب جاهز. أنشئ ملفك الدراسي علشان نحفظه على السحابة.");
}
async function signup(email,password){await ensureClient();const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}});if(error)throw error;if(data.session&&data.user){await connectUser(data.user,false);return "تم إنشاء الحساب وتسجيل الدخول";}return "اتبع رسالة تأكيد البريد الإلكتروني، ثم ارجع وسجّل دخولك.";}
async function login(email,password){await ensureClient();const {data,error}=await client.auth.signInWithPassword({email,password});if(error)throw error;if(!data.user)throw Error("تعذر تسجيل الدخول");await connectUser(data.user,false);return "أهلًا! بياناتك اتفتحت";}
async function reset(email){await ensureClient();const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});if(error)throw error;return "لو البريد مسجل، هيوصلك رابط لاستعادة كلمة المرور";}
async function logout(){if(!client)return;await flush();if(dirty)throw Error("البيانات لم تُرفع بعد. اتصل بالإنترنت ثم حاول تسجيل الخروج.");const id=user?.id;await client.auth.signOut();user=null;dirty=false;clearTimeout(syncTimer);if(id){delete R.profiles[localKey(id)];R.active=null;save();}welcome("cloud");}
function renderAuth(root){const enabled=!!configured;root.innerHTML=`<div class="logo mobile">🎓 Tmoh <b>طموح</b></div><h2>أهلاً بك في طموح 💜</h2><p class="muted">احفظ رحلتك الدراسية بحسابك، أو جرّب الموقع محليًا.</p><div class="auth-cloud-card"><h3>📧 حساب الطالب</h3><p class="muted">${enabled?"تسجيل أو إنشاء حساب بالبريد وكلمة السر":"التسجيل السحابي يحتاج ربط Supabase من صاحب المنصة، ولم يتم تفعيله بعد."}</p><form id="tmohCloudForm"><label>البريد الإلكتروني<input id="tmohEmail" type="email" autocomplete="email" required placeholder="example@email.com" ${enabled?"":"disabled"}></label><label>كلمة السر<input id="tmohPassword" type="password" minlength="8" autocomplete="current-password" required placeholder="8 أحرف على الأقل" ${enabled?"":"disabled"}></label><div class="btnrow"><button class="primary" type="submit" value="login" ${enabled?"":"disabled"}>دخول</button><button class="soft" type="button" id="tmohRegister" ${enabled?"":"disabled"}>حساب جديد</button></div></form><button id="tmohReset" class="link" ${enabled?"":"disabled"}>نسيت كلمة السر؟</button><p id="tmohCloudMsg" role="status" class="muted"></p></div><button class="soft wide" id="tmohGuest">متابعة بدون حساب (حفظ على الجهاز فقط)</button>`;
 root.querySelector("#tmohGuest").onclick=()=>welcome(Object.keys(R.profiles).filter(k=>!k.startsWith("cloud-")).length?"pick":"dream");
 const email=()=>root.querySelector("#tmohEmail").value.trim();const pass=()=>root.querySelector("#tmohPassword").value;
 const report=(s)=>{let m=root.querySelector("#tmohCloudMsg");if(m)m.textContent=s;};
 async function go(action){report("جاري الاتصال...");try{if(action!=="reset"&&pass().length<8)throw Error("كلمة السر لازم تكون 8 أحرف على الأقل");let result=action==="signup"?await signup(email(),pass()):action==="reset"?await reset(email()):await login(email(),pass());report(result);if(action!=="reset")msg(result)}catch(e){report("تعذر تنفيذ الطلب: "+String(e.message||e).slice(0,150));}}
 root.querySelector("#tmohCloudForm").onsubmit=e=>{e.preventDefault();go("login")};
 root.querySelector("#tmohRegister").onclick=()=>go("signup");root.querySelector("#tmohReset").onclick=()=>{if(!email())return report("اكتب بريدك الإلكتروني الأول");go("reset")};
}
window.addEventListener("online",()=>{if(dirty)flush()});document.addEventListener("visibilitychange",()=>{if(document.hidden&&dirty)flush()});
window.TMOH_CLOUD={client,status,localKey,renderAuth,restore,signup,login,reset,logout,doSave,flush,getClient:ensureClient,get user(){return user;}};
})();
