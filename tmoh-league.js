/* Tmoh — optional cross-student league. Opt-in. No emails/shared profiles.
   The personal league works offline unchanged if Supabase is unconfigured.
   Entries are self-reported from the local profile, NOT independently verified.
*/
(function(){
'use strict';
if(typeof VIEWS==='undefined'||typeof d==='undefined')return;
const E=(v)=>esc(String(v??''));
const api=()=>window.TMOH_CLOUD;
const signed=()=>!!api()?.status?.().signedIn && !!api()?.user;
const C='Africa/Cairo';
function dateKey(t){const parts=new Intl.DateTimeFormat('en-US',{timeZone:C,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(t);const y=parts.find(x=>x.type==='year').value,m=parts.find(x=>x.type==='month').value,day=parts.find(x=>x.type==='day').value;return `${y}-${m}-${day}`;}
function monday(){const date=dateKey(Date.now()),x=new Date(date+'T12:00:00Z');let days=(x.getUTCDay()+6)%7;x.setUTCDate(x.getUTCDate()-days);return x.toISOString().slice(0,10);}
const thisWeek=()=>monday();
function counts(){const wk=thisWeek();let minutes=(d.sessions||[]).reduce((sum,s)=>s?.end&&dateKey(Number(s.end))>=wk?sum+Math.max(0,Number(s.ms)||0):sum,0);minutes=Math.min(10080,Math.round(minutes/60000));const tasks=(d.tasks||[]).filter(t=>t?.done&&t?.date>=wk).length;return {minutes,score:Math.min(20000,minutes+Math.min(tasks,50)*5)};}
let entries=[],myEntry=null,loading=false,error='',loadedWeek='',viewId=0,working=false;
function personal(){let x=counts(),goal=Math.max(60,Number(d.weekGoal)||600),pct=Math.min(100,Math.round(x.minutes/goal*100));let tiers=[['🥉','برونزي',0],['🥈','فضي',150],['🥇','ذهبي',400],['💎','ماسي',900]],i=0;tiers.forEach((t,k)=>{if(x.minutes>=t[2])i=k});return `<div class="card v6-pet tmoh-league-personal"><div class="v6-emoji">${tiers[i][0]}</div><h2>دوري ${tiers[i][1]}</h2><p>ذاكرت ${x.minutes} دقيقة هذا الأسبوع</p><div class="v6-progress"><span style="width:${pct}%"></span></div><p>هدفك ${goal} دقيقة — ${pct}%</p><button class="primary" data-go="focusroom">ابدأ جلسة تركيز</button></div>`;}
function currentAlias(){let a=d?.v6?.leagueAlias||'';return a.replace(/[^\u0621-\u064A\w\s-]/g,'').trim().slice(0,24);}
function board(){const wk=thisWeek();if(loadedWeek!==wk){entries=[];myEntry=null;loadedWeek=wk;}
return `<section class="card tmoh-league-board" id="tmohLeaguePanel"><h3>🌟 دوري الطلاب — مشاركة اختيارية</h3><p class="muted">الترتيب يظهر فقط للطلاب الذين اختاروا المشاركة باسم مستعار. لا يظهر البريد الإلكتروني أو سجل المذاكرة أو بيانات الحساب.</p>${!api()?.status?.().configured?`<div class="warn">الدوري الجماعي لسه غير مفعّل؛ يحتاج ربط Supabase وتشغيل ملف SQL المرفق. الدوري الشخصي أعلاه شغال من غير حساب.</div>`:!signed()?`<p class="muted">للمشاركة أو رؤية الترتيب، سجّل دخولك بحساب اختياري من صفحة الحساب. الحفظ المحلي يظل الافتراضي.</p><button class="soft" data-go="cloudsync">فتح الحساب الاختياري</button>`:
 `<div class="tmoh-league-actions"><label>اسم مستعار للظهور في الدوري<input id="tmohLeagueAlias" maxlength="24" minlength="2" autocomplete="off" placeholder="مثال: نجم طموح" value="${E(currentAlias())}"></label><button class="primary" data-league="publish" ${working?'disabled':''}>${myEntry?'حدّث نتيجتي ومشاركتي':'شارك بنتيجتي هذا الأسبوع'}</button>${myEntry?`<button class="soft" data-league="withdraw" ${working?'disabled':''}>إلغاء مشاركتي</button>`:''}<button class="soft" data-league="refresh" ${working?'disabled':''}>تحديث الترتيب</button></div><p class="tmoh-league-legal">نتائج الدوري يرفعها المشاركون من أجهزتهم ولم تُتحقق منها جهة خادمة مستقلة، لذلك الترتيب تحفيزي وغير رسمي. لا تُشارك اسمك الحقيقي أو بيانات شخصية.</p>${error?`<div class="warn" role="status">${E(error)}</div>`:''}${loading?'<p>جاري تحميل ترتيب الأسبوع…</p>':entries.length?`<div class="tmoh-rank-list">${entries.map((r,i)=>`<div class="tmoh-rank ${r.user_id===api().user?.id?'me':''}"><b>${i+1}. ${E(r.nickname)}</b><span>🌟 ${Math.max(0,Number(r.score)||0)} نقطة</span><small>${Math.max(0,Number(r.minutes)||0)} دقيقة</small></div>`).join('')}</div>`:'<p class="muted">مافيش مشاركات ظاهرة في الدوري ده لسه. تقدر تكون أول واحد!</p>'}`}</section>`;}
function renderLeague(){const html=`<div class="heading"><div><h1>🏆 دوري Tmoh</h1><p>تابع تقدمك وشارك في تحدي الأسبوع مع طلاب اختاروا المشاركة.</p></div></div>${personal()}${board()}`;
if(signed()&&loadedWeek!==thisWeek()){loadedWeek=thisWeek();entries=[];myEntry=null;}
// Queue a read only after the page actually renders. Do not fetch while logged out.
if(signed()&&!loading&&!working&&!initialedWeek.has(thisWeek())){initialedWeek.add(thisWeek());queueMicrotask(()=>fetchBoard());}
return html;}
const initialedWeek=new Set();
async function getClient(){if(!signed()||!api()?.getClient)throw Error('الحساب الاختياري مش متصل');return await api().getClient();}
async function fetchBoard(){if(!signed()||page!=='league')return;const req=++viewId;loading=true;error='';updatePanel();try{
const client=await getClient(),w=thisWeek();
const [all,mine]=await Promise.all([
 client.from('tmoh_league_entries').select('user_id,nickname,minutes,score,week_start').eq('week_start',w).eq('opted_in',true).order('score',{ascending:false}).order('updated_at',{ascending:true}).limit(30),
 client.from('tmoh_league_entries').select('user_id,nickname,minutes,score').eq('user_id',api().user.id).eq('week_start',w).maybeSingle()
]);if(all.error)throw all.error;if(mine.error)throw mine.error;if(req!==viewId||page!=='league')return;entries=all.data||[];myEntry=mine.data||null;loadedWeek=w;
}catch(e){error='تعذر عرض الترتيب. راجع تفعيل قاعدة البيانات والإنترنت.';entries=[];myEntry=null;}finally{if(req===viewId){loading=false;updatePanel();}}}
function updatePanel(){if(page!=='league')return;let el=document.getElementById('tmohLeaguePanel');if(el)el.outerHTML=board();}
async function action(e){const btn=e.target.closest('[data-league]');if(!btn||page!=='league'||working||!signed())return;
const op=btn.dataset.league;if(op==='refresh'){await fetchBoard();return;}
if(op!=='publish'&&op!=='withdraw')return;
let alias=document.getElementById('tmohLeagueAlias')?.value||'';alias=alias.replace(/[^\u0621-\u064A\w\s-]/g,'').trim().slice(0,24);
if(op==='publish'&&(alias.length<2||alias.length>24)){msg('اكتب اسمًا مستعارًا من حرفين إلى 24 حرفًا');return;}
if(op==='withdraw'&&!confirm('هل تريد حذف مشاركتك من دوري الأسبوع الحالي؟'))return;
working=true;error='';updatePanel();try{
 const client=await getClient(),w=thisWeek();let result;
 if(op==='withdraw')result=await client.from('tmoh_league_entries').delete().eq('user_id',api().user.id).eq('week_start',w);
 else {const x=counts();result=await client.from('tmoh_league_entries').upsert({user_id:api().user.id,week_start:w,nickname:alias,minutes:x.minutes,score:x.score,opted_in:true,updated_at:new Date().toISOString()},{onConflict:'user_id,week_start'});}
 if(result.error)throw result.error;
 if(op==='publish'){d.v6=d.v6||{};d.v6.leagueAlias=alias;save();}
 msg(op==='withdraw'?'تم إلغاء مشاركتك في الدوري':'تم نشر نتيجتك باسمك المستعار ✅');
 }catch(e){error='تعذر حفظ المشاركة. تأكد من اتصال الإنترنت وتشغيل SQL في Supabase.';
 }finally{working=false;initialedWeek.delete(thisWeek());await fetchBoard();}}
VIEWS.league=renderLeague;
document.getElementById('content').addEventListener('click',action);
})();
