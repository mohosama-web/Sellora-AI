let token = localStorage.getItem('tajer_token') || '';
let user = null; let todayCount = 0; let isTrialMode = false;
let appConfig = { googleClientId: '', monetagZoneId: '' };
let isRecreateMode = false;
let recreateIndex = -1;
function el(id){ return document.getElementById(id); }
function hide(id){ const e = el(id); if(e) e.style.display='none'; }
function show(id, display='block'){ const e = el(id); if(e) e.style.display=display; }
async function loadConfig(){
  try{
    const r = await fetch('/api/config');
    const d = await r.json();
    appConfig = d;
    const g = document.getElementById('g_id_onload');
    if(g && d.googleClientId) g.setAttribute('data-client_id', d.googleClientId);
    if(d.monetagZoneId){
      const s = document.createElement('script');
      s.src = 'https://alwingulla.com/88/tag.min.js';
      s.setAttribute('data-zone', d.monetagZoneId);
      s.setAttribute('data-cfasync', 'false');
      s.async = true;
      document.head.appendChild(s);
    }
  }catch(e){}
}
loadConfig();
async function refreshQuota(){ if(!token) return; try{ const r = await fetch('/api/quota', { headers: { Authorization: 'Bearer '+token }}); const d = await r.json(); todayCount = d.count || 0; if(el('quota')) el('quota').textContent = `المتبقي لك اليوم: ${10 - todayCount} إعلاناً نصياً`; }catch(e){} }
function isTrialUsed(){ return localStorage.getItem('tajer_trialUsed') === 'yes'; }
function markTrialUsed(){ localStorage.setItem('tajer_trialUsed', 'yes'); }
function openLoginModal(){ const m = el('loginModal'); if(m) m.classList.add('open'); }
function closeLoginModal(){ const m = el('loginModal'); if(m) m.classList.remove('open'); }
document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeLoginModal(); });
function heroTry(){ const v = el('heroProduct')?.value || ''; if(v.trim() && el('product')) el('product').value = v.trim(); startTrial(); }
function startTrial(){
  if(isTrialUsed()){ alert('لقد استخدمت تجربتك المجانية - سجّل الآن للمتابعة مجاناً'); openLoginModal(); return; }
  isTrialMode = true; hide('tryArea'); show('appBox');
  if(el('userInfo')) el('userInfo').textContent = 'تجربة مجانية - لمرة واحدة فقط';
  if(el('quota')) el('quota').textContent = 'تجربة مجانية - لمرة واحدة فقط - بدون تسجيل';
  const app = el('appBox'); if(app) app.scrollIntoView({ behavior:'smooth' });
}
function showLoginRequired(){ hide('appBox'); hide('result'); show('loginRequiredBox'); hide('tryArea'); show('trialDoneBox'); openLoginModal(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function onGoogleLogin(res){
  fetch('/api/auth/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential: res.credential }) })
  .then(r=>r.json()).then(d=>{
    if(d.token){ token = d.token; localStorage.setItem('tajer_token', token); user = d.user; isTrialMode = false; closeLoginModal(); hide('loginRequiredBox'); hide('tryArea'); hide('trialDoneBox'); show('appBox'); if(el('userInfo')) el('userInfo').textContent = `أهلاً بك، ${user.name}`; const loginBtn = document.querySelector('.btn-login-small'); if(loginBtn) loginBtn.textContent = `👋 ${user.name}`; refreshQuota(); loadHistory(); const app = el('appBox'); if(app) app.scrollIntoView({ behavior:'smooth' }); }
    else alert(d.error || 'فشل تسجيل الدخول - يرجى المحاولة مرة أخرى');
  }).catch(()=> alert('حدثت مشكلة في الاتصال - يرجى المحاولة مرة أخرى'));
}
function showMonetagAd(){ if(window.showMonetag) window.showMonetag(); return new Promise(res=>setTimeout(res, 2000)); }

// ===== جديد: افتراضيات الاختياري - لو المستخدم ما اختار =====
function getPayloadFromForm(){
  const v = (id) => (el(id)?.value || '').trim();
  return {
    product: v('product'),
    productFeatures: v('productFeatures'),
    country: v('country'),
    dialect: v('dialect'),
    city: v('city'),
    category: v('category'),
    price: v('price'),
    delivery: v('delivery'), // اختياري - مافي افتراضي - لو فاضي بيرسل فاضي
    pickupMethod: v('pickupMethod'),
    whatsapp: v('whatsapp'),
    lang: v('lang'),
    length: v('length'),
    platform: v('platform') || 'جميع المنصات', // 13 اختياري - افتراضي جميع المنصات
    shopName: v('shopName'),
    offer: v('offer'),
    audience: v('audience') || 'الجميع', // 16 اختياري - افتراضي الجميع
    tone: v('tone') || 'حماسية', // 17 اختياري - افتراضي حماسية
    pageLink: v('pageLink'),
    hasImage: v('hasImage') || 'أرغب في وصف صورة', // 19 اختياري - افتراضي أرغب في وصف صورة
    serviceLink: v('serviceLink'),
  };
}

// ===== جديد: فحص الإجباري - 8 خانات فقط =====
function validateRequired(payload){
  const checks = [
    ['product', 'يرجى كتابة اسم المنتج / الخدمة / الموقع / التطبيق - الخانة 1 إجبارية'],
    ['productFeatures', 'يرجى كتابة وصف / مميزات المنتج - الخانة 2 إجبارية'],
    ['country', 'يرجى اختيار الدولة - الخانة 3 إجبارية'],
    ['dialect', 'يرجى اختيار اللهجة - الخانة 4 إجبارية'],
    ['category', 'يرجى اختيار التصنيف - الخانة 6 إجبارية'],
    ['lang', 'يرجى اختيار لغة الإعلان - الخانة 11 إجبارية'],
    ['length', 'يرجى اختيار طول الإعلان - الخانة 12 إجبارية'],
    ['shopName', 'يرجى كتابة اسم المتجر / الخدمة / الموقع / التطبيق - الخانة 14 إجبارية'],
  ];
  for(const [id, msg] of checks){
    if(!payload[id] || !payload[id].trim()){
      alert(msg);
      el(id)?.focus();
      el(id)?.scrollIntoView({ behavior:'smooth', block:'center' });
      return false;
    }
  }
  return true;
}

function fillFormFromPayload(p){
  if(!p) return;
  const set = (id, v) => { if(el(id) && v !== undefined) el(id).value = v; };
  set('product', p.product); set('productFeatures', p.productFeatures); set('country', p.country);
  set('dialect', p.dialect); set('city', p.city); set('category', p.category);
  set('price', p.price); set('delivery', p.delivery); set('pickupMethod', p.pickupMethod);
  set('whatsapp', p.whatsapp); set('lang', p.lang); set('length', p.length);
  set('platform', p.platform); set('shopName', p.shopName); set('offer', p.offer);
  set('audience', p.audience); set('tone', p.tone); set('pageLink', p.pageLink);
  set('hasImage', p.hasImage); set('serviceLink', p.serviceLink);
}
function startRecreate(i){
  const hist = JSON.parse(localStorage.getItem('tajer_history')||'[]');
  const h = hist[i];
  if(!h) return;
  if(isTrialMode){ alert('التجربة المجانية انتهت - سجّل للمتابعة - إعادة الإنشاء للمشتركين فقط'); showLoginRequired(); return; }
  if(!token){ alert('يرجى تسجيل الدخول أولاً للمتابعة.'); openLoginModal(); return; }
  if(todayCount >= 10){ alert('لقد استهلكت حصتك اليومية. يمكنك المحاولة غداً.'); return; }
  isRecreateMode = true; recreateIndex = i;
  fillFormFromPayload(h.payload || { product: '' });
  hide('createBtn'); show('recreateBtn'); show('recreateHint');
  show('result');
  if(el('adText')) el('adText').value = h.adText;
  if(el('imagePrompt')) el('imagePrompt').value = h.imagePrompt;
  const form = el('adForm'); if(form) form.scrollIntoView({ behavior:'smooth' });
  alert('تم تحميل بيانات الإعلان القديم في الفورم - عدّل أي خانة - واضغط إعادة إنشاء بصيغة أخرى - حيستهلك طلب واحد من حصتك');
}
function cancelRecreate(){ isRecreateMode = false; recreateIndex = -1; show('createBtn'); hide('recreateBtn'); hide('recreateHint'); }
function submitRecreate(){ const form = el('adForm'); if(form) form.requestSubmit(); }
el('adForm')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  if(isTrialMode){ if(isTrialUsed()){ alert('لقد استخدمت تجربتك المجانية - سجّل الآن للمتابعة مجاناً'); showLoginRequired(); return; } }
  else { if(!token){ alert('يرجى تسجيل الدخول أولاً للمتابعة.'); openLoginModal(); return; } if(todayCount >= 10){ alert('لقد استهلكت حصتك اليومية. يمكنك المحاولة غداً.'); return; } if(todayCount === 0){ await showMonetagAd(); } else if(todayCount === 3){ await showMonetagAd(); } }
  const payload = getPayloadFromForm();
  // فحص الإجباري - قبل ما يخصم أي طلب
  if(!validateRequired(payload)) return;
  if(isRecreateMode){
    const ok = confirm(`حتعيد إنشاء هذا الإعلان بصيغة جديدة - وحيتم خصم طلب واحد من حصتك - المتبقي لك: ${10 - todayCount} - متأكد؟`);
    if(!ok) return;
  }
  const btn = isRecreateMode ? el('recreateBtn') : el('createBtn');
  const oldText = btn ? btn.textContent : '';
  if(btn){ btn.disabled = true; btn.textContent = 'جارٍ الإنشاء...'; }
  const endpoint = isTrialMode ? '/api/generate-trial' : '/api/generate';
  const headers = { 'Content-Type': 'application/json' }; if(!isTrialMode) headers.Authorization = 'Bearer '+token;
  try{
    const r = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(payload) });
    const d = await r.json();
    if(btn){ btn.disabled = false; btn.textContent = oldText; }
    if(d.error){ alert(d.error); return; }
    show('result');
    if(el('adText')) el('adText').value = d.adText;
    if(el('imagePrompt')) el('imagePrompt').value = d.imagePrompt;
    el('result')?.scrollIntoView({ behavior:'smooth' });
    if(isTrialMode){ markTrialUsed(); setTimeout(()=>{ showLoginRequired(); }, 3000); }
    else {
      const hist = JSON.parse(localStorage.getItem('tajer_history')||'[]');
      hist.unshift({ adText: d.adText, imagePrompt: d.imagePrompt, payload: payload, date: new Date().toLocaleString(), isRecreate: isRecreateMode });
      localStorage.setItem('tajer_history', JSON.stringify(hist.slice(0,20)));
      loadHistory(); refreshQuota();
    }
  }catch(err){ if(btn){ btn.disabled = false; btn.textContent = oldText; } alert('حدثت مشكلة في الاتصال - يرجى المحاولة مرة أخرى'); }
});
function loadHistory(){
  const hist = JSON.parse(localStorage.getItem('tajer_history')||'[]');
  if(!el('history')) return;
  if(hist.length === 0){ el('history').innerHTML = ''; return; }
  el('history').innerHTML = '<h3 style="margin:18px 0 8px">📜 إعلاناتك السابقة</h3>' + hist.map((h,i)=>{
    const label = h.isRecreate ? '🔁 إعادة صياغة' : '✨ جديد';
    return `<div class="card" style="text-align:right">
      <small>${h.date} - ${label}</small>
      <p>${(h.adText||'').slice(0,120)}...</p>
      <div style="display:flex;gap:8px">
        <button onclick="showOld(${i})" style="flex:1">عرض + نسخ</button>
        <button onclick="startRecreate(${i})" style="flex:1;background:#7c3aed">🔁 إعادة إنشاء بصيغة أخرى</button>
      </div>
    </div>`;
  }).join('');
}
function showOld(i){ const hist = JSON.parse(localStorage.getItem('tajer_history')||'[]'); const h = hist[i]; if(!h) return; show('result'); if(el('adText')) el('adText').value = h.adText; if(el('imagePrompt')) el('imagePrompt').value = h.imagePrompt; el('result')?.scrollIntoView({ behavior:'smooth' }); }
function copyText(id){ const elm = el(id); if(!elm) return; elm.select(); if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(elm.value).then(()=> alert('تم النسخ بنجاح ✅ - يمكنك لصقه في أي مكان')); } else { document.execCommand('copy'); alert('تم النسخ بنجاح ✅ - يمكنك لصقه في أي مكان'); } }
if(!token && isTrialUsed()){ hide('tryArea'); show('trialDoneBox'); }
if(token){ hide('tryArea'); hide('trialDoneBox'); show('appBox'); refreshQuota(); loadHistory(); }
