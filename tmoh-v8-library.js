/* Tmoh V8 — local personal library: genuine IndexedDB file storage.
   File bytes never leave the device. Completely independent of the original AI, account
   and localStorage profile formats. Existing link library stays unchanged. */
(function(){
'use strict';
if(typeof VIEWS==='undefined'||typeof d==='undefined')return;
const DB='tmoh-personal-docs-v1',STORE='files',MAX=10*1024*1024,MAX_ALL=60*1024*1024;
const E=s=>esc(String(s??''));
const allowed=/\.(pdf|txt|md|png|jpe?g|webp)$/i;
const oldLibrary=VIEWS.library;
let database=null, previewURL=null, activeProfile=null;
function openDB(){
 if(database)return database;
 database=new Promise((yes,no)=>{
  if(!window.indexedDB)return no(Error('المتصفح لا يدعم حفظ الملفات'));
  const req=indexedDB.open(DB,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};
  req.onsuccess=()=>yes(req.result);req.onerror=()=>{database=null;no(req.error||Error('فشل فتح تخزين الملفات'))};
 });return database;
}
async function operation(mode,key,value){const db=await openDB();return new Promise((resolve,reject)=>{
 let txn=db.transaction(STORE,mode),store=txn.objectStore(STORE),request;
 try{request=mode==='readwrite'?(value===undefined?store.delete(key):store.put(value,key)):store.get(key)}catch(e){reject(e);return}
 txn.oncomplete=()=>resolve(request?.result);
 txn.onerror=()=>reject(txn.error||Error('فشل حفظ الملف'));
 txn.onabort=()=>reject(txn.error||Error('أُلغي حفظ الملف'));
 });}
function docs(){if(!Array.isArray(d.localDocs))d.localDocs=[];return d.localDocs;}
function pretty(n){return n>=1048576?(n/1048576).toFixed(1)+' MB':Math.ceil(n/1024)+' KB';}
function clearPreview(){if(previewURL){URL.revokeObjectURL(previewURL);previewURL=null;}}
function renderLibrary(){if(!d)return '';const list=docs(),subjects=[...new Set([...(d.subjects||[]), ...list.map(x=>x.subject).filter(Boolean)])];
 return oldLibrary()+`<section class="card tm8-library" id="tm8Library">
 <h2>📂 مكتبتي الشخصية — ملفات على جهازي</h2>
 <p class="muted">ارفع كتبك ومذكراتك الخاصة؛ الملفات نفسها محفوظة على جهازك فقط ولا تُرسل إلى المساعد الذكي. إذا فعّلت حسابًا سحابيًا اختياريًا، قد تتم مزامنة أسماء الملفات والمواد ضمن ملف الطالب، لكن ليس محتوى الملفات.</p>
 <form id="tm8Upload" class="tm8-upload">
 <label>المادة أو المجلد <input id="tm8Subject" list="tm8Subjects" maxlength="65" placeholder="مثال: اللغة العربية" required></label>
 <datalist id="tm8Subjects">${subjects.map(s=>`<option value="${E(s)}"></option>`).join('')}</datalist>
 <label>ملف الدراسة <input id="tm8File" type="file" accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.webp" required></label>
 <button type="submit" class="primary">حفظ الملف على الجهاز</button>
 </form>
 <p class="tiny">PDF أو نصوص أو صور • 10 MB كحد أقصى للملف و60 MB للمكتبة. احفظ نسخة من ملفاتك الأصلية؛ النسخة الاحتياطية JSON تحفظ فهرس الملفات فقط وليس الملف نفسه.</p>
 <h3>ملفاتي (${list.length})</h3>
 ${list.length?`<div class="tm8-files">${list.slice().reverse().map(x=>`<div class="tm8-file" data-tm8-row="${E(x.id)}"><span class="tm8-file-ico">${/\.pdf$/i.test(x.name)?'📕':/\.(png|jpe?g|webp)$/i.test(x.name)?'🖼️':'📝'}</span><span class="tm8-file-info"><b>${E(x.name)}</b><small>${E(x.subject)} • ${pretty(x.size||0)}</small></span><span class="tm8-file-actions"><button class="soft" data-tm8="open" data-id="${E(x.id)}">فتح</button><button class="soft" data-tm8="download" data-id="${E(x.id)}">تنزيل</button><button class="soft" data-tm8="delete" data-id="${E(x.id)}" aria-label="حذف ${E(x.name)}">حذف</button></span></div>`).join('')}</div>`:'<p class="muted">مافيش ملفات مرفوعة لسه. روابطك التعليمية القديمة موجودة فوق كما هي.</p>'}
 <div id="tm8Preview" class="tm8-preview" role="region" aria-label="معاينة الملف" hidden></div>
 </section>`;
}
VIEWS.library=renderLibrary;
function notify(s){msg(s)}
async function addFile(form){const file=form.querySelector('#tm8File')?.files?.[0];const subject=form.querySelector('#tm8Subject')?.value.trim();
 if(!file||!subject){notify('اختار ملفًا ومادة الأول');return}
 if(!allowed.test(file.name)){notify('الملف لازم يكون PDF أو نص أو صورة مدعومة');return}
 if(file.size===0||file.size>MAX){notify('الملف فارغ أو أكبر من 10 MB');return}
 if(docs().length>=100){notify('الحد الأقصى 100 ملف للمكتبة');return}
 if(docs().reduce((sum,x)=>sum+(Number(x.size)||0),0)+file.size>MAX_ALL){notify('مكتبتك وصلت لحد 60 MB');return}
 const profileId=d.id;
 const id='doc-'+Date.now()+'-'+Math.random().toString(36).slice(2,10),key=profileId+':'+id;
 const button=form.querySelector('button[type=submit]');if(button){button.disabled=true;button.textContent='جاري الحفظ…'}
 try{await operation('readwrite',key,file);
  if(!d||d.id!==profileId){await operation('readwrite',key);return}
  docs().push({id,name:file.name.slice(0,130),subject:subject.slice(0,65),type:file.type,size:file.size,added:Date.now()});save();render('library');notify('الملف اتحفظ في مكتبتك على الجهاز ✅');
 }catch(e){notify('تعذر حفظ الملف: ربما مساحة التخزين غير كافية. جرّب ملفًا أصغر.');if(button){button.disabled=false;button.textContent='حفظ الملف على الجهاز'}}
}
async function findBlob(id){const m=docs().find(x=>x.id===id);if(!m)return null;const b=await operation('readonly',d.id+':'+id);if(!(b instanceof Blob)){notify('الملف غير موجود على هذا الجهاز. ربما تم استيراد الفهرس فقط من نسخة احتياطية.');return null;}return {meta:m,blob:b};}
async function handleButton(b){const id=b.dataset.id,action=b.dataset.tm8;let record;
 if(!id||!['open','download','delete'].includes(action))return;
 if(action==='delete'){
  const m=docs().find(x=>x.id===id);if(!m||!confirm('هل تريد حذف الملف «'+m.name+'» من هذا الجهاز نهائيًا؟'))return;
  try{await operation('readwrite',d.id+':'+id);const n=docs().findIndex(x=>x.id===id);if(n>=0){docs().splice(n,1);save()}clearPreview();render('library');notify('تم حذف الملف')}catch(e){notify('تعذر حذف الملف')};return;
 }
 try{record=await findBlob(id)}catch(e){notify('تعذر فتح الملف المحفوظ');return}if(!record)return;
 clearPreview();const url=URL.createObjectURL(record.blob),filename=record.meta.name;
 if(action==='download'){const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);return}
 previewURL=url;const el=document.getElementById('tm8Preview');if(!el)return;
 const type=filename.toLowerCase();let node;
 if(/\.pdf$/.test(type)){node=document.createElement('iframe');node.title='معاينة '+filename;node.src=url;node.setAttribute('sandbox','allow-same-origin');node.className='tm8-preview-pdf';}
 else if(/\.(jpg|jpeg|png|webp)$/.test(type)){node=document.createElement('img');node.alt='معاينة '+filename;node.src=url;node.className='tm8-preview-img';}
 else {node=document.createElement('pre');node.className='tm8-preview-text';node.textContent=(await record.blob.text()).slice(0,200000);}
 el.replaceChildren(node);el.hidden=false;el.scrollIntoView({block:'nearest',behavior:'smooth'});
}
const root=document.getElementById('content');
root.addEventListener('submit',e=>{if(e.target.id==='tm8Upload'){e.preventDefault();addFile(e.target);}});
root.addEventListener('click',e=>{const b=e.target.closest('[data-tm8]');if(b&&d)handleButton(b);});
// Ensure object URLs don't linger when the student changes pages or profiles.
window.addEventListener('hashchange',()=>{clearPreview()});
// When the original "delete profile" action succeeds, erase its private Blobs too.
const originalDeleteProfile=acts.delp;
acts.delp=function(button){
 const pid=d?.id,keys=Array.isArray(d?.localDocs)?d.localDocs.map(x=>pid+':'+x.id):[];
 originalDeleteProfile(button);
 if(pid&&!R.profiles[pid])Promise.allSettled(keys.map(key=>operation('readwrite',key))).catch(()=>{});
};
window.TMOH_LIBRARY={openDB,docs};
})();
