/* Tmoh V8 — student problem/request notebook. Local-first and opt-in AI sending.
   It only PREFILLS the existing chatbot input and never modifies the Worker. */
(function(){
'use strict';
if(typeof VIEWS==='undefined'||typeof d==='undefined')return;
const E=v=>esc(String(v??''));
const previous=VIEWS.assistant;
function entries(){if(!Array.isArray(d.studyRequests))d.studyRequests=[];return d.studyRequests;}
function renderBox(){const notes=entries();const subs=[...new Set(d.subjects||[])];return `<section class="card tm8-help" id="tm8Help">
<h2>💜 صندوق مشكلات المذاكرة وطلب المساعدة</h2>
<p class="muted">اكتبي المشكلة أو الحاجة اللي محتاجة مساعدة فيها. هتتحفظ في ملفك الدراسي محليًا افتراضيًا؛ ولو ربطتي حسابًا سحابيًا اختياريًا ممكن تتزامن مع حسابك. مش هتتبعت للمساعد إلا لما تضغطي إرسال بنفسك.</p>
<form id="tm8HelpForm" class="tm8-help-form">
<label>المادة <select id="tm8HelpSubject"><option value="">عام / تنظيم مذاكرة</option>${subs.map(s=>`<option>${E(s)}</option>`).join('')}</select></label>
<label>المشكلة أو الطلب <textarea id="tm8HelpText" maxlength="700" rows="3" required placeholder="مثال: مش فاهم درس معين، أو عندي تراكمات ومش عارف أبدأ…"></textarea></label>
<button class="primary">احفظ طلبي على الجهاز</button></form>
${notes.length?`<h3>طلباتي المحفوظة (${notes.length})</h3><div class="tm8-requests">${notes.slice().reverse().map(x=>`<div class="tm8-request"><small>${E(x.subject||'عام')} • ${new Date(x.at).toLocaleDateString('ar-EG')}</small><p>${E(x.text)}</p><div class="btnrow"><button type="button" class="soft" data-tm8help="prepare" data-id="${E(x.id)}">جهّز السؤال للمساعد</button><button type="button" class="soft" data-tm8help="delete" data-id="${E(x.id)}">حذف</button></div></div>`).join('')}</div>`:''}
<p class="tiny">مهم: لا تكتب كلمات سر أو أرقام هاتف أو معلومات شخصية حساسة. إجابات AI للمذاكرة ممكن تخطئ؛ راجع المصادر الموثوقة.</p></section>`;}
VIEWS.assistant=()=>previous()+renderBox();
const el=document.getElementById('content');
el.addEventListener('submit',e=>{
 if(e.target.id!=='tm8HelpForm'||!d)return;e.preventDefault();
 const s=document.getElementById('tm8HelpSubject')?.value||'',t=document.getElementById('tm8HelpText')?.value.trim()||'';
 if(t.length<5)return msg('اكتب المشكلة بشكل أوضح');
 const xs=entries();if(xs.length>=60)xs.shift();
 xs.push({id:'req'+Date.now()+Math.random().toString(36).slice(2,7),subject:s.slice(0,80),text:t.slice(0,700),at:Date.now()});
 save();render('assistant');msg('اتحفظ طلبك على الجهاز ✅');
});
el.addEventListener('click',e=>{
 const b=e.target.closest('[data-tm8help]');if(!b||!d)return;
 const v=entries().find(x=>x.id===b.dataset.id);if(!v)return;
 if(b.dataset.tm8help==='delete'){
  if(!confirm('تحذف الطلب المحفوظ؟'))return;
  d.studyRequests=entries().filter(x=>x.id!==v.id);save();render('assistant');msg('اتحذف الطلب');return;
 }
 if(b.dataset.tm8help==='prepare'){
  const field=document.getElementById('aq');if(!field||field.disabled){msg('اتصال المساعد غير متاح حاليًا. طلبك ما زال محفوظًا.');return;}
  field.value=`ساعدني في ${v.subject||'تنظيم المذاكرة'}: ${v.text}`.slice(0,600);
  field.focus();field.scrollIntoView({block:'center',behavior:'smooth'});
  msg('السؤال جاهز. راجعيه واضغطي إرسال لو حابة.');
 }
});
})();
