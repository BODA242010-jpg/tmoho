/* طموح — قارئ دروس مستقل، محلي أولًا. لا يستخدم Cloudflare أو المساعد الذكي. */
(function(){
'use strict';
if(typeof VIEWS==='undefined'||typeof d==='undefined'||!window.TMOH_STUDY_CONTENT)return;
const LESSONS=window.TMOH_STUDY_CONTENT.lessons;
const GRADES=['الصف الأول الثانوي','الصف الثاني الثانوي','الصف الثالث الثانوي'];
const E=(v)=>esc(String(v??''));
const NAMES={'اللغة الأجنبية الأولى':'اللغة الإنجليزية','اللغة الإنجليزية':'اللغة الإنجليزية','الرياضيات العامة':'الرياضيات','التاريخ المصري':'التاريخ','إحصاء':'الرياضيات','الإحصاء':'الرياضيات'};
const normalize=(s)=>NAMES[s]||s;
const icons={'اللغة العربية':'📖','اللغة الإنجليزية':'🔤','الرياضيات':'📐','العلوم المتكاملة':'🔬','الفيزياء':'⚡','الكيمياء':'🧪','الأحياء':'🌱','التاريخ':'🏛️','الجغرافيا':'🌍','الفلسفة والمنطق':'💡','الثقافة المالية':'💰'};
const official='https://studentbooks.moe.gov.eg/Books',bacc='https://ellibrary.moe.gov.eg/EgyptianBaccalaureate/';
let selection={grade:null,subject:null,lesson:null,answers:{},checked:false,profile:null};
const orig=VIEWS.curriculum;
function progress(){if(!d.studyV1||typeof d.studyV1!=='object'||Array.isArray(d.studyV1))d.studyV1={};
 const p=d.studyV1;if(!p.completed||typeof p.completed!=='object')p.completed={};if(!p.scores||typeof p.scores!=='object')p.scores={};return p;}
function gradeIndex(){let g=GRADES.indexOf(d.grade);return g>=0?g+1:1;}
function sync(){if(selection.profile!==d.id){selection={grade:gradeIndex(),subject:null,lesson:null,answers:{},checked:false,profile:d.id};}
 if(!Number.isInteger(selection.grade)||selection.grade<1||selection.grade>3)selection.grade=gradeIndex();}
const yearLessons=()=>LESSONS.filter(l=>l.grade===selection.grade);
const subjects=()=>[...new Set(yearLessons().map(l=>l.subject))];
const filtered=()=>yearLessons().filter(l=>l.subject===selection.subject);
const selected=()=>filtered().find(l=>l.id===selection.lesson)||null;
const done=(l)=>!!progress().completed[l.id];
const completedCount=(arr)=>arr.filter(done).length;
function gradeMenu(){return `<label class="tm-study-grade-label">الصف الدراسي <select id="tm-study-grade" data-study="grade" aria-label="اختيار الصف">${GRADES.map((g,i)=>`<option value="${i+1}" ${selection.grade===i+1?'selected':''}>${E(g)}</option>`).join('')}</select></label>`;}
function masthead(label,desc){return `<div class="tm-study-head"><div><h1>${E(label)}</h1><p>${E(desc)}</p></div><button class="soft" data-go="books">📚 كتب الوزارة</button></div>`;}
function disclaimer(){return `<div class="tm-study-notice" role="note">📝 الدروس هنا <b>شروح تأسيسية أصلية للتعلم والمراجعة</b>، وليست فهرسًا رسميًا كاملًا أو نسخًا من كتب وزارة التربية والتعليم. راجع <a href="${official}" target="_blank" rel="noopener noreferrer">الكتب الرسمية</a> لتطابق ترتيب ومحتوى منهج صفك لعام 2026–2027. محتوى البكالوريا يحتاج مراجعة المسار رسميًا.</div>`;}
function catalog(){let all=yearLessons(),have=new Set((d.subjects||[]).map(normalize));return masthead('📚 ذاكر من داخل طموح',`اختار مادّتك وابدأ الشرح والتدريبات — ${E(GRADES[selection.grade-1])}`)+
 `<div class="tm-study-controls">${gradeMenu()}<span>${completedCount(all)} من ${all.length} درسًا تأسيسيًا أنجزتها في الصف المختار</span></div>${disclaimer()}`+
 `<div class="tm-study-grid">${subjects().sort((a,b)=>Number(have.has(b))-Number(have.has(a))).map(s=>{let list=all.filter(l=>l.subject===s),n=completedCount(list),percent=Math.round(100*n/list.length);return `<button type="button" class="tm-study-subject" data-study="subject" data-subject="${E(s)}"><span class="tm-study-icon">${icons[s]||'📘'}</span><b>${E(s)}</b><small>${list.length} دروس • ${n} مكتملة ${have.has(s)?'• من موادك':''}</small><span class="tm-study-bar"><i style="width:${percent}%"></i></span><span class="tm-study-cta">افتح الدروس ←</span></button>`}).join('')}</div>`+
 `<div class="card tm-study-links"><h3>عايز المنهج الرسمي كاملًا؟</h3><p>اختر كتابك من مكتبة الوزارة، أو أضف الدروس المتحقَّق منها عن طريق أدوات الاستيراد الحالية. ما زلنا نوسع الشرح داخل طموح، ومش هنعتبر الدروس دي المنهج الوزاري الكامل.</p><a href="${official}" target="_blank" rel="noopener noreferrer">مكتبة الوزارة الرسمية</a> <a href="${bacc}" target="_blank" rel="noopener noreferrer">بوابة كتب البكالوريا</a></div>`+legacy();}
function legacy(){let exists=Object.values(d.curriculum||{}).some(us=>Array.isArray(us)&&us.length);if(!exists)return '';
 return `<details class="card tm-study-legacy"><summary>دروس المناهج التي أضفتها سابقًا (${Object.values(d.curriculum).reduce((n,u)=>n+(u||[]).length,0)} وحدات) — بياناتك محفوظة</summary>${orig()}</details>`;}
function subjectView(){let list=filtered();if(!list.length){selection.subject=null;return catalog();}
 let units=[...new Set(list.map(l=>l.unit))],cnt=completedCount(list);return masthead(`${icons[selection.subject]||'📖'} ${selection.subject}`,`دروس تأسيسية للصف ${selection.grade} الثانوي — ${cnt} من ${list.length} مكتملة`)+
 `<div class="tm-study-toolbar"><button class="soft" data-study="all">← كل المواد</button>${gradeMenu()}</div>${disclaimer()}`+
 units.map(u=>{let arr=list.filter(l=>l.unit===u);return `<section class="card tm-study-unit"><h2>${E(u)} <small>(${completedCount(arr)}/${arr.length})</small></h2><div class="tm-study-lessons">${arr.map((l,i)=>`<button type="button" data-study="lesson" data-lesson="${E(l.id)}"><span class="tm-study-number">${i+1}</span><span><b>${E(l.title)}</b><small>${E(l.intro.slice(0,105))}${l.intro.length>105?'…':''}</small></span><span class="tm-study-check">${done(l)?'✅':'ابدأ ←'}</span></button>`).join('')}</div></section>`}).join('')+`<button class="soft" data-study="all">عرض باقي المواد</button>`;}
function lessonView(){let l=selected();if(!l){selection.lesson=null;return subjectView();}
 let prev=progress(),questions=l.questions||[],score=prev.scores[l.id],n=filtered().findIndex(x=>x.id===l.id),next=filtered()[n+1];
 return masthead(E(l.title),`${l.subject} • ${GRADES[l.grade-1]} • ${l.unit}`)+`<div class="tm-study-toolbar"><button class="soft" data-study="toSubject">← كل دروس ${E(l.subject)}</button><span class="tag">${done(l)?'✅ تم إنهاء الدرس':'📖 جاري المذاكرة'}</span></div>${disclaimer()}`+`<div class="card tm-study-toolshortcut"><strong>🧰 نفس الدرس في كل أدوات طموح</strong> <button class="primary" data-tm7="select" data-id="${E(l.id)}">فتح مركز أدوات هذا الدرس</button></div>`+
 `<article class="tm-study-article"><div class="card"><span class="tm-study-eyebrow">الفكرة الأساسية</span><h2>${E(l.title)}</h2><p class="tm-study-lead">${E(l.intro)}</p></div><div class="card"><h3>💡 افهم الدرس</h3><p>${E(l.detail)}</p><h3>النقاط المهمة</h3><ul>${l.points.map(p=>`<li>${E(p)}</li>`).join('')}</ul></div><div class="card tm-study-example"><h3>✍️ مثال محلول</h3><p>${E(l.example)}</p><p class="muted">اقرأ المثال مرة، ثم جرّب شرحه لنفسك بأسلوبك قبل حل التدريبات.</p></div>`+
 `<div class="card"><h3>🧠 اختبر فهمك</h3><p class="muted">جاوب على التدريب، وبعدين اضغط «صحّح إجابتي» علشان تشوف التصحيح والتفسير.</p>${questions.map((q,i)=>`<fieldset class="tm-study-question"><legend>${i+1}. ${E(q.question)}</legend>${q.choices.map((c,j)=>`<label class="tm-study-choice ${selection.checked?(j===q.answer?'tm-study-correct':selection.answers[i]===j?'tm-study-incorrect':''):''}"><input type="radio" name="tmq${i}" data-study="answer" data-qi="${i}" data-oi="${j}" ${selection.answers[i]===j?'checked':''} ${selection.checked?'disabled':''}>${E(c)}</label>`).join('')}${selection.checked?`<p class="tm-study-feedback">✅ الإجابة الصحيحة: ${E(q.choices[q.answer])}. ${E(q.explanation)}</p>`:''}</fieldset>`).join('')}`+
 `${selection.checked?`<p class="tm-study-result">نتيجتك في التدريب: ${score?.score??0} من ${questions.length} 🎉</p><button class="soft" data-study="retry">🔁 جرّب الاختبار تاني</button>`:`<button class="primary" data-study="correct">✅ صحّح إجابتي</button>`}</div>`+
 `<div class="card tm-study-footer"><h3>خلصت المذاكرة؟</h3><p>علّم الدرس كمكتمل علشان تتابع تقدمك. تقدر تفتحه في أي وقت للمراجعة.</p><button class="primary" data-study="complete">${done(l)?'✅ تم الإنجاز — يمكنك المراجعة':'✅ أنهيت مذاكرة الدرس'}</button> <button class="soft" data-study="addq">➕ أضف سؤاله لبنك الاختبارات</button>${next?` <button class="soft" data-study="next" data-lesson="${E(next.id)}">الدرس التالي ←</button>`:''}</div></article>`;}
function study(){if(!d)return '';sync();if(!selection.subject)return catalog();return selection.lesson?lessonView():subjectView();}
VIEWS.curriculum=study;
function update(){save();render('curriculum');}
function notify(s){msg(s);}
document.querySelector('#content').addEventListener('click',e=>{
 const b=e.target.closest('[data-study]');if(!b||!d)return;
 const action=b.dataset.study;sync();if(action==='subject'){selection.subject=b.dataset.subject;selection.lesson=null;selection.checked=false;selection.answers={};render('curriculum');}
 else if(action==='all'){selection.subject=null;selection.lesson=null;render('curriculum');}
 else if(action==='toSubject'){selection.lesson=null;selection.answers={};selection.checked=false;render('curriculum');}
 else if(action==='lesson'||action==='next'){if(!filtered().some(x=>x.id===b.dataset.lesson))return;selection.lesson=b.dataset.lesson;selection.checked=false;selection.answers={};render('curriculum');}
 else if(action==='correct'){let l=selected();if(!l)return;const qs=l.questions||[];if(qs.some((q,i)=>!Number.isInteger(selection.answers[i]))){notify('جاوب على كل الأسئلة الأول');return;}
 const n=qs.reduce((sum,q,i)=>sum+(selection.answers[i]===q.answer?1:0),0);progress().scores[l.id]={score:n,total:qs.length,date:Date.now()};selection.checked=true;update();notify('تم التصحيح: '+n+' من '+qs.length);}
 else if(action==='retry'){selection.checked=false;selection.answers={};render('curriculum');}
 else if(action==='complete'){let l=selected();if(!l)return;progress().completed[l.id]=Date.now();update();notify('عاش! الدرس اتحفظ كمكتمل في ملفك ✅');}
 else if(action==='addq'){let l=selected();if(!l)return;const available=2000-(d.qbank||[]).length;if(available<=0)return notify('بنك الأسئلة ممتلئ');let count=0;
 for(let q of l.questions.slice(0,available)){let id='tmoh-study-'+l.id+'-'+q.question;if(d.qbank.some(x=>x.studyId===id))continue;let item=normQ({q:q.question,choices:q.choices,answer:q.answer,type:'mcq',subject:l.subject,lesson:l.title,explain:q.explanation,source:'طموح: تدريبات تأسيسية مستقلة'});item.studyId=id;d.qbank.push(item);count++;}
 if(count){save();notify('اتضاف '+count+' سؤال لبنك الاختبارات ✅')}else notify('الأسئلة دي موجودة في البنك بالفعل');}
});
document.querySelector('#content').addEventListener('change',e=>{
 const el=e.target;if(!d)return;sync();if(el.dataset.study==='grade'){let g=Number(el.value);if(![1,2,3].includes(g))return;selection.grade=g;selection.subject=null;selection.lesson=null;selection.checked=false;selection.answers={};render('curriculum');}
 if(el.dataset.study==='answer'&&!selection.checked){selection.answers[Number(el.dataset.qi)]=Number(el.dataset.oi);}
});
window.TMOH_STUDY={openLesson(id){const l=LESSONS.find(x=>x.id===id);if(!l||!d)return false;sync();selection.grade=l.grade;selection.subject=l.subject;selection.lesson=l.id;selection.answers={};selection.checked=false;go('curriculum');return true;}};
})();
