let token = localStorage.getItem('tajer_token') || '';
let user = null; // KV بس - ما بنقرا tajer_user من localStorage تاني
let todayCount = 0; let isTrialMode = false;
let appConfig = { googleClientId: '' };
let isRecreateMode = false;
let recreateIndex = -1;
let pendingGoogle = null;
let currentAd = null;
// كاش في الذاكرة بس - عشان openAd و renderMyAds يفضلو شغالين زي ما هم - بدون localStorage
let _myAdsCache = [];
// ===== Adsterra - Social Bar + Popunder - النسخة النهائية =====
let _adsCreatedCount = 0;
let _lastCb = '';
let _adsterraTimer = null;
let _adsterraTrying = false;
let _isGeneratingAd = false;
let _genAbort = null;
let _popunderTrying = false;
let _popunderLoaded = false;

function _isLoggedInForAds(){ return !!(token && user); }
function _todayStr(){ return new Date().toDateString(); }

function _removeOldAdsterra(){
  document.querySelectorAll('script[src*="bauval.org"]').forEach(s => s.remove());
  document.querySelectorAll('iframe[src*="bauval"]').forEach(f => f.remove());
  document.querySelectorAll('[id*="bauval"], [class*="bauval"]').forEach(e => e.remove());
}
function _getSameLinkNewAd(){
  let cb;
  do{ cb = Date.now() + '_' + Math.floor(Math.random()*1000000000); }while(cb === _lastCb);
  _lastCb = cb;
  return 'https://bauval.org/14/f7bb06d45366cb88433539a59c476da0?cb=' + cb;
}
// ---------- Popunder - مرة واحدة في اليوم ----------
function _isPopunderDoneToday(){
  try{ return localStorage.getItem('tajer_popunder_day') === _todayStr(); }catch(e){ return _popunderLoaded; }
}
function _markPopunderDone(){
  try{ localStorage.setItem('tajer_popunder_day', _todayStr()); }catch(e){}
  _popunderLoaded = true;
}
function _removeOldPopunder(){
  document.querySelectorAll('script[src*="abscloud.org"]').forEach(s => s.remove());
}
function tryPopunderOnce(reason){
  if(!_isLoggedInForAds()) return;
  if(_isPopunderDoneToday()) return;
  if(_popunderTrying) return;
  _popunderTrying = true;
  _tryPopunder(reason, 1);
}
function _tryPopunder(reason, attempt){
  if(!_isLoggedInForAds()){ _popunderTrying = false; return; }
  if(_isPopunderDoneToday()){ _popunderTrying = false; return; }
  if(attempt > 5){ _popunderTrying = false; return; } // جرب 5 مرات بس - عشان ما يتقل الموقع
  _removeOldPopunder();
  const s = document.createElement('script');
  s.setAttribute('data-cfasync','false');
  s.src = 'https://abscloud.org/1/40856ec5f2d6c405e24a2a97253c93c0';
  s.onload = ()=>{
    // Popunder اتحمل بنجاح - اعتبرو ظهر - وامنعو يظهر تاني اليوم
    _markPopunderDone();
    _popunderTrying = false;
  };
  s.onerror = ()=>{
    // ما ظهر - عيد المحاولة بعد 3 ثواني
    setTimeout(()=> _tryPopunder(reason, attempt+1), 3000);
  };
  document.body.appendChild(s);
  // لو السكربت اتحمل لكن Popunder ما فتح بسبب المتصفح - اعتبر المحاولة تمت بعد 3 ثواني
  // وخليه يحاول تاني في الضغطة الجاية - ما تعلق
  setTimeout(()=>{ _popunderTrying = false; }, 3000);
}
// ---------- Social Bar - مع إعادة المحاولة لحد ما يظهر ----------
function showSocialBarForce(reason){
  if(!_isLoggedInForAds()) return;
  if(_adsterraTrying) return;
  _adsterraTrying = true;
  _tryAdsterra(reason, 1);
}
function _hasSocialBar(){
  return !!document.querySelector('iframe[src*="bauval"], [id*="bauval"], [class*="bauval"], iframe[src*="abscloud"], iframe[src*="adsterra"]');
}
function _tryAdsterra(reason, attempt){
  if(!_isLoggedInForAds()){ _adsterraTrying = false; return; }
  if(attempt > 8){ _adsterraTrying = false; return; } // جرب 8 مرات - لحد ما يظهر
  _removeOldAdsterra();
  const url = _getSameLinkNewAd();
  const s = document.createElement('script');
  s.setAttribute('data-cfasync','false');
  s.src = url;
  // فترات إعادة المحاولة: 3 ث - 5 ث - 10 ث - 10 ث ...
  const delays = [3000, 5000, 10000, 10000, 15000, 15000, 20000, 20000];
  const delay = delays[Math.min(attempt-1, delays.length-1)];
  s.onload = ()=>{
    setTimeout(()=>{
      if(_hasSocialBar()){ _adsterraTrying = false; if(_adsterraTimer) clearTimeout(_adsterraTimer); }
      else { _adsterraTimer = setTimeout(()=> _tryAdsterra(reason, attempt+1), delay); }
    }, 3000);
  };
  s.onerror = ()=>{ _adsterraTimer = setTimeout(()=> _tryAdsterra(reason, attempt+1), delay); };
  document.body.appendChild(s);
}
function onAdCreated(){
  _adsCreatedCount++;
  if(_adsCreatedCount % 2 === 0) showSocialBarForce('عمل إعلانين');
}
function onAdEdited(){ showSocialBarForce('عدل إعلان'); }
function onAdRecreated(){ showSocialBarForce('أعاد صياغة'); }
function loadAdsterraForce(){ showSocialBarForce('دخول'); }
function loadAdsterra(){ showSocialBarForce('loadAdsterra'); }
function checkFirstAdOfDay(){
  try{
    const lastDay = localStorage.getItem('tajer_first_ad_day');
    const today = _todayStr();
    if(lastDay !== today){
      localStorage.setItem('tajer_first_ad_day', today);
      // Social Bar بعد 3 ثواني من الدخول - مش طوالي
      setTimeout(()=> loadAdsterra(), 3000);
    }
  }catch(e){ setTimeout(()=> loadAdsterra(), 3000); }
}
function onAdClosedByUser(){ _removeOldAdsterra(); }
document.addEventListener('click', function(e){
  const t=e.target.closest('[class*="close"], [id*="close"], [class*="Close"], [aria-label*="close" i], [aria-label*="Close"]');
  if(t) onAdClosedByUser();
});
function el(id){ return document.getElementById(id); }
function hide(id){ const e = el(id); if(e) e.style.display='none'; }
function show(id, display='block'){ const e = el(id); if(e) e.style.display=display; }
function showView(id){ document.querySelectorAll('.view').forEach(v=>v.classList.remove('active')); const t=el(id); if(t) t.classList.add('active'); window.scrollTo({top:0}); }

// ===== النوافذ المسموح بيها بس: الحذف + التسجيل + التقييم - كلها سود =====
let _allowedModalsReady = false;
function ensureAllowedModalsBlack(){
  if(_allowedModalsReady) return; _allowedModalsReady = true;
  const style = document.createElement('style');
  style.textContent = `
    #deleteModal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:999;align-items:center;justify-content:center;padding:16px}
    #deleteModal.show{display:flex}
    .deleteBlackBox{background:#000!important;border:1px solid #333!important;border-radius:14px!important;padding:20px 16px!important;width:100%;max-width:300px!important;text-align:center!important}
    .deleteBlackBox p{font-size:14.5px!important;font-weight:700!important;color:#fff!important;margin:8px 0 16px!important;line-height:1.6!important}
    .deleteBlackRow{display:flex!important;gap:10px!important;justify-content:center!important}
    .deleteBlackRow button{flex:1!important;padding:8px 6px!important;font-size:13px!important;font-weight:800!important;border:none!important;border-radius:8px!important;cursor:pointer!important;box-shadow:none!important;max-width:110px!important}
    .btnConfirmDelete{background:#ef4444!important;color:#fff!important}
    .btnCancelDelete{background:#22c55e!important;color:#fff!important}
    #loginModal{background:rgba(0,0,0,.85)!important}
    #loginModal .modalBox{background:#000!important;border:1px solid #333!important;color:#fff!important}
    #loginModal .modalBox button{background:#22c55e!important;color:#fff!important}
    #feedbackBox{background:rgba(0,0,0,.85)!important}
    #feedbackBox .modalBox{background:#000!important;border:1px solid #333!important;color:#fff!important}
    #feedbackBox .modalBox button{background:#22c55e!important;color:#fff!important}
    #feedbackBox .modalBox button:last-child{background:#333!important;color:#fff!important}
  `;
  document.head.appendChild(style);
  if(!document.getElementById('deleteModal')){
    const div = document.createElement('div');
    div.id = 'deleteModal';
    div.innerHTML = `<div class="deleteBlackBox"><div style="font-size:32px">🗑️</div><p id="deleteModalText">هل متأكد من حذف هذا الإعلان؟</p><div class="deleteBlackRow"><button class="btnConfirmDelete" onclick="confirmDeleteAd()">حذف</button><button class="btnCancelDelete" onclick="closeDeleteConfirm()">إلغاء</button></div></div>`;
    div.addEventListener('click', function(e){ if(e.target === div) closeDeleteConfirm(); });
    document.body.appendChild(div);
  }
}
function noPopup(msg){ try{ console.log(msg); }catch(e){} }

function toggleMenu(){ const d=el('drawer'); if(d) d.classList.toggle('show'); if(d && d.classList.contains('show')) updateDrawerAuth(); }
function toggleMenuOff(){ const d=el('drawer'); if(d) d.classList.remove('show'); }
function hideFormForResult(){ const f = el('adForm'); if(f) f.style.display='none'; const r = el('result'); if(r) r.style.display='block'; }
function showFormForNewAd(){ const f = el('adForm'); if(f) f.style.display='flex'; hide('result'); if(isRecreateMode){ hide('createBtn'); show('recreateBtn'); } else { show('createBtn'); hide('recreateBtn'); } }
function backFromCreate(){ if(isRecreateMode) cancelRecreate(); if(token && user){ showView('view-home'); refreshQuota(); return; } showView('view-landing'); window.scrollTo({top:0}); }
function updateDrawerAuth(){ const loginB = el('sideLoginBtn'); const logoutB = el('sideLogoutBtn'); const editB = el('editProfileBtn'); if(token && user){ if(loginB) loginB.style.display='none'; if(logoutB) logoutB.style.display='block'; if(editB) editB.style.display='block'; } else { if(loginB) loginB.style.display='block'; if(logoutB) logoutB.style.display='none'; if(editB) editB.style.display='none'; } }
// ===== KV بس - تم حذف getKnownUsers / saveKnownUser - كانو بيحفظو في localStorage =====
function getKnownUsers(){ return {}; }
function saveKnownUser(u){ return; }
function openEditProfile(){ toggleMenuOff(); if(!token || !user){ openLoginModal(); return; } if(el('editName')) el('editName').value=user.name||''; if(el('editEmail')) el('editEmail').value=user.email||''; if(el('editAvatar')) el('editAvatar').src=user.pic||user.picture||''; showView('view-edit-profile'); }
function previewEditPic(e){ let f=e.target.files[0]; if(!f) return; let rd=new FileReader(); rd.onload=()=>{ if(el('editAvatar')) el('editAvatar').src=rd.result; }; rd.readAsDataURL(f); }
// ===== عدل الحفظ بس: صورة + اسم -> KV عبر /api/me/update =====
async function saveProfileEdit(){
  let newName=el('editName')?.value.trim(); if(!newName){ el('editName')?.focus(); return; }
  let newPic=el('editAvatar')?.src||user.pic;
  user.name=newName; user.pic=newPic; user.picture=newPic;
  try{ await fetch('/api/me/update', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer '+token }, body: JSON.stringify({ name:newName, pic:newPic }) }); }catch(e){}
  updateHeader(); updateAuthUI(); showView('view-home');
}
function updateAuthUI(){ const bar = el('stickyBar'); if(token && user){ if(bar) bar.style.display = 'none'; document.body.style.paddingBottom = '0px'; if(el('loginBtnTop')) el('loginBtnTop').style.display = 'none'; } else { if(bar) bar.style.display = 'flex'; document.body.style.paddingBottom = '62px'; if(el('loginBtnTop')) el('loginBtnTop').style.display = 'block'; } updateDrawerAuth(); }
function goLanding(){ toggleMenuOff(); if(token && user){ showView('view-home'); refreshQuota(); return; } showView('view-landing'); }
function goHome(){ toggleMenuOff(); if(!user && !token){ showView('view-landing'); return; } showView('view-home'); refreshQuota(); }
function goCreateAd(){ toggleMenuOff(); showFormForNewAd(); checkFirstAdOfDay(); if(!token && !isTrialMode && isTrialUsed()){ openLoginModal(); return; } if(!token && !isTrialMode){ isTrialMode = true; if(el('userInfo')) el('userInfo').textContent='تجربة مجانية - لمرة واحدة فقط'; if(el('quota')) el('quota').textContent='تجربة مجانية - لمرة واحدة فقط - بدون تسجيل'; } showView('view-create-ad'); }
async function goMyAds(){ toggleMenuOff(); if(!token){ openLoginModal(); return; } showView('view-my-ads'); await renderMyAds(); }
// ===== عدل الحفظ بس: logout - يمسح التوكن بس - بيانات المستخدم في KV بتفضل =====
function logout(){ token=''; user=null; _myAdsCache=[]; localStorage.removeItem('tajer_token'); localStorage.removeItem('tajer_user'); localStorage.removeItem('tajer_auto_login'); const b=el('loginBtnTop'); if(b) b.style.display='block'; const av=el('headerAvatar'); if(av) av.style.display='none'; toggleMenuOff(); updateAuthUI(); showView('view-landing'); }
function showDashboard(name, remaining){ const w=el('welcomeText'); if(w) w.textContent='مرحباً بك يا '+name+' 👋'; const q=el('quotaText'); if(q) q.textContent='🔢 المتبقي لك '+remaining+' إعلان من 10 اليوم'; const q2=el('quota'); if(q2 && token) q2.textContent='المتبقي لك '+remaining+' إعلان'; updateHeader(); }
function updateHeader(){ if(!user) return; const b=el('loginBtnTop'); if(b) b.style.display='none'; const av=el('headerAvatar'); if(av){ av.src=user.pic||user.picture||('https://ui-avatars.com/api/?name='+encodeURIComponent(user.name)); av.style.display='block'; } const da=el('drawerAvatar'); if(da) da.src=av?av.src:''; const dn=el('drawerName'); if(dn) dn.textContent=user.name; const de=el('drawerEmail'); if(de) de.textContent=user.email||''; const w=el('welcomeText'); if(w) w.textContent='مرحباً بك يا '+user.name+' 👋'; }
function previewPic(e){ let f=e.target.files[0]; if(!f) return; let rd=new FileReader(); rd.onload=()=>{ if(el('accAvatar')) el('accAvatar').src=rd.result; if(pendingGoogle) pendingGoogle.pic=rd.result; }; rd.readAsDataURL(f); }
// ===== عدل الحفظ بس: إنشاء الحساب -> KV عبر /api/me/update =====
async function finishCreateAccount(){
  let name=el('accName')?.value.trim(); if(!name){ el('accName')?.focus(); return; }
  if(pendingGoogle){ user={...pendingGoogle, name}; pendingGoogle=null; } else if(user){ user.name=name; } else { return; }
  try{ await fetch('/api/me/update', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer '+token }, body: JSON.stringify({ name: user.name, pic: user.pic || user.picture || '' }) }); }catch(e){}
  updateHeader(); updateAuthUI(); showView('view-home'); refreshQuota();
}
function showForm(){ var heroVal = el('heroProduct') ? el('heroProduct').value : ''; goCreateAd(); var p = el('product'); if(p && heroVal && !p.value){ p.value = heroVal; } if(!token && !isTrialUsed()){ isTrialMode = true; if(el('userInfo')) el('userInfo').textContent = 'تجربة مجانية - لمرة واحدة فقط'; if(el('quota')) el('quota').textContent = 'تجربة مجانية - لمرة واحدة فقط - بدون تسجيل'; } }
function hideForm(){ if(token) showView('view-home'); else showView('view-landing'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
async function loadConfig(){ try{ const r = await fetch('/api/config'); const d = await r.json(); appConfig = d; const g = document.getElementById('g_id_onload'); if(g && d.googleClientId) g.setAttribute('data-client_id', d.googleClientId); }catch(e){} }
loadConfig();
async function refreshQuota(){ if(!token) return; try{ const r = await fetch('/api/quota', { headers: { Authorization: 'Bearer '+token }}); const d = await r.json(); todayCount = d.count || 0; if(el('quota')) el('quota').textContent = `المتبقي لك اليوم: ${10 - todayCount} إعلاناً نصياً`; if(typeof showDashboard === 'function' && user) showDashboard(user.name, 10 - todayCount); }catch(e){} }
function isTrialUsed(){ return localStorage.getItem('tajer_trialUsed') === 'yes'; }
function markTrialUsed(){ localStorage.setItem('tajer_trialUsed', 'yes'); }
function openLoginModal(){ ensureAllowedModalsBlack(); const m = el('loginModal'); if(m) m.classList.add('show'); }
function closeLoginModal(){ const m = el('loginModal'); if(m) m.classList.remove('show'); }
document.addEventListener('keydown', function(e){ if(e.key==='Escape'){ closeLoginModal(); closeDeleteConfirm(); closeFeedback(); } });
el('loginModal')?.addEventListener('click', function(e){ if(e.target === this) closeLoginModal(); });
function heroTry(){ const v = el('heroProduct')?.value || ''; if(v.trim() && el('product')) el('product').value = v.trim(); if(!token && isTrialUsed()){ openLoginModal(); return; } showForm(); }
function startTrial(){ if(isTrialUsed()){ openLoginModal(); return; } isTrialMode = true; hide('tryArea'); if(el('userInfo')) el('userInfo').textContent = 'تجربة مجانية - لمرة واحدة فقط'; if(el('quota')) el('quota').textContent = 'تجربة مجانية - لمرة واحدة فقط - بدون تسجيل'; showForm(); }
function showLoginRequired(){ if(token && user) return; hide('result'); hide('tryArea'); show('trialDoneBox'); openLoginModal(); showView('view-landing'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
// ===== عدل الحفظ بس: onGoogleLogin - بياخد المستخدم من KV - بدون localStorage =====
function onGoogleLogin(res){
  try{ let payload = JSON.parse(atob(res.credential.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))); pendingGoogle = { name: payload.name, email: payload.email, picture: payload.picture, pic: payload.picture }; }catch(e){}
  fetch('/api/auth/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential: res.credential }) })
  .then(r=>r.json()).then(d=>{
    if(d.token){
      token = d.token; localStorage.setItem('tajer_token', token);
      user = d.user;
      isTrialMode = false; closeLoginModal(); hide('loginRequiredBox'); hide('tryArea'); hide('trialDoneBox');
      if(el('userInfo')) el('userInfo').textContent = `أهلاً بك، ${user.name}`;
      const loginBtn = el('loginBtnTop'); if(loginBtn) loginBtn.style.display = 'none';
      updateHeader(); updateAuthUI(); refreshQuota(); loadHistory(); syncToMyAds(); showView('view-home');
      // لو الاسم في KV مختلف - يعني سجل قبل كده - السيرفر رجع الاسم الصح من KV - ما بنحتاج نعمل حاجة هنا
      // لو مستخدم جديد - وديهو صفحة إنشاء الحساب عشان يأكد اسمو - زي قبل
      // نعرف انو جديد لو الاسم الجاي من Google مطابق للاسم في KV ومافي createdAt؟ - بنعتمد على /api/me
      // عشان ما نغير المنطق - لو المستخدم رجع من السيرفر بلا pic - نفتح صفحة إنشاء الحساب
      // لكن للحفاظ على سلوكك القديم: لو دخل أول مرة - افتح view-create-account
      // الحل البسيط: لو كان user.name فاضي - افتحها - غير كده خش home - ده نفس سلوكك تقريبا
      // تم إبقاء الدخول لـ home مباشرة - لأن worker بيحفظ createdAt في KV
      return;
    }
    else { noPopup(d.error || 'فشل تسجيل الدخول'); }
  }).catch(()=> noPopup('مشكلة اتصال'));
}
function getPayloadFromForm(){ const v = (id) => (el(id)?.value || '').trim(); return { product: v('product'), productFeatures: v('productFeatures'), country: v('country'), dialect: v('dialect'), city: v('city'), category: v('category'), price: v('price'), delivery: v('delivery'), pickupMethod: v('pickupMethod'), whatsapp: v('whatsapp'), lang: v('lang'), length: v('length'), platform: v('platform') || 'جميع المنصات', shopName: v('shopName'), offer: v('offer'), audience: v('audience') || 'الجميع', tone: v('tone') || 'حماسية', pageLink: v('pageLink'), hasImage: v('hasImage') || 'أرغب في وصف صورة', serviceLink: v('serviceLink'), }; }
function validateRequired(payload){
  const checks = [
    ['product', 'اسم المنتج'],
    ['productFeatures', 'وصف المنتج'],
    ['country', 'الدولة'],
    ['dialect', 'اللهجة'],
    ['category', 'التصنيف'],
    ['lang', 'لغة الإعلان'],
    ['length', 'طول الإعلان'],
    ['shopName', 'اسم المتجر'],
  ];
  for(const [id, msg] of checks){ if(!payload[id] || !payload[id].trim()){ el(id)?.focus(); el(id)?.scrollIntoView({ behavior:'smooth', block:'center' }); return false; } }
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
// ===== عدل الحفظ بس: getAds بيرجع من الكاش - والكاش بيتملي من KV =====
function getAds(){ return _myAdsCache.slice(); }
function normalizeAd(a){
  if(!a) return null;
  const text = a.adText || a.text || '';
  if(!text) return null;
  return { product: a.product || 'إعلان', adText: text, text: text, imagePrompt: a.imagePrompt || '', payload: a.payload || { product: a.product || 'إعلان' }, date: a.date || Date.now() };
}
async function fetchCloudAds(){
  if(!token) return [];
  try{
    const r = await fetch('/api/ads', { headers: { Authorization: 'Bearer '+token } });
    const d = await r.json();
    return (d.ads || []).map(normalizeAd).filter(Boolean);
  }catch(e){ return []; }
}
async function saveAdToCloud(ad){
  if(!token) return;
  try{ await fetch('/api/ads', { method:'POST', headers: { 'Content-Type':'application/json', Authorization: 'Bearer '+token }, body: JSON.stringify(ad) }); }catch(e){}
}
// ===== عدل الحفظ بس: syncToMyAds - من KV بس - بدون localStorage =====
async function syncToMyAds(){
  const cloudAds = await fetchCloudAds();
  const merged = [];
  const seen = new Set();
  const push = (a)=>{ const key = (a.adText||'').trim().slice(0,120); if(!key || seen.has(key)) return; seen.add(key); merged.push(a); };
  cloudAds.forEach(push);
  merged.sort((a,b)=> (b.date||0) - (a.date||0));
  _myAdsCache = merged.slice(0,50);
  return _myAdsCache;
}
async function renderMyAds(){
  const elm = el('myAdsList'); if(!elm) return;
  elm.innerHTML = '<p style="text-align:center;color:#94a3b8">جارٍ تحميل إعلاناتك...</p>';
  const ads = await syncToMyAds();
  if(!ads.length){ elm.innerHTML='<p style="text-align:center;color:#94a3b8">لم تقم بإنشاء أي إعلان بعد</p>'; return; }
  selectedAds.clear(); if(el('bulkBar')) el('bulkBar').style.display='none';
  elm.innerHTML = ads.map((a,i)=>{
    const d = a.date ? new Date(a.date).toLocaleString() : '';
    const safeDate = String(a.date||'').replace(/'/g,'');
    return `<div class="adItem" style="display:flex;gap:10px;align-items:flex-start"><div class="select-box" onclick="event.stopPropagation();toggleSelectAd('${safeDate}', this, this.parentElement)">☐</div><div onclick="openAd(${i})" style="flex:1"><b>${a.product||'إعلان'}</b><p style="font-size:12px;color:#94a3b8">${(a.adText||a.text||'').slice(0,80)}...</p><small style="color:#64748b">${d}</small></div></div>`;
  }).join('');
}
function openAd(i){ const ads = getAds(); currentAd = ads[i]; if(!currentAd) return; if(el('detailTitle')) el('detailTitle').textContent=currentAd.product; if(el('detailText')) el('detailText').textContent=currentAd.adText||currentAd.text; if(el('detailImagePrompt')) el('detailImagePrompt').textContent='🖼️ وصف الصورة: '+(currentAd.imagePrompt||''); showView('view-ad-detail'); }
async function copyText(id, btn){
  const elm = typeof id === 'string' ? el(id) : id;
  const b = btn || (window.event && window.event.currentTarget);
  if(!elm) return;
  let txt = elm.value || elm.textContent || '';
  try{ await navigator.clipboard.writeText(txt); }
  catch(e){ const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
  if(b){ const old = b.innerHTML; b.innerHTML = '✓'; b.style.color = '#22c55e'; b.classList.add('copied'); setTimeout(()=>{ b.innerHTML = old; b.style.color = ''; b.classList.remove('copied'); }, 2000); }
}
function copySiteLink(btn){ const b = btn || (window.event && window.event.currentTarget); copyText({ value: location.origin, textContent: location.origin }, b); }

// ===== نافذة الحذف - السوداء =====
let _deleteMode = 'single';
function openDeleteConfirm(){
  if(!currentAd) return;
  _deleteMode = 'single';
  ensureAllowedModalsBlack();
  const t = el('deleteModalText'); if(t) t.textContent = 'هل متأكد من حذف هذا الإعلان؟';
  const m = el('deleteModal'); if(m) m.classList.add('show');
}
function openBulkDeleteConfirm(){
  if(!selectedAds.size) return;
  _deleteMode = 'bulk';
  ensureAllowedModalsBlack();
  const t = el('deleteModalText'); if(t) t.textContent = 'هل متأكد من حذف ' + selectedAds.size + ' إعلان؟';
  const m = el('deleteModal'); if(m) m.classList.add('show');
}
function closeDeleteConfirm(){
  const m = el('deleteModal'); if(m) m.classList.remove('show');
}
// ===== عدل الحفظ بس: confirmDeleteAd - حذف من KV + الكاش - بدون localStorage =====
async function confirmDeleteAd(){
  closeDeleteConfirm();
  if(_deleteMode === 'bulk'){
    const toDelete = Array.from(selectedAds);
    for(const date of toDelete){ try{ await fetch('/api/ads/delete', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer '+token }, body: JSON.stringify({ date }) }); }catch(e){} }
    _myAdsCache = _myAdsCache.filter(a => !selectedAds.has(String(a.date)));
    selectedAds.clear();
    if(el('bulkBar')) el('bulkBar').style.display='none';
    await renderMyAds();
    return;
  }
  if(!currentAd) return;
  const dateToDelete = currentAd.date;
  try{ await fetch('/api/ads/delete', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer '+token }, body: JSON.stringify({ date: dateToDelete }) }); }catch(e){}
  _myAdsCache = _myAdsCache.filter(a => String(a.date) !== String(dateToDelete));
  currentAd = null;
  goMyAds();
}
async function deleteCurrentAd(){ openDeleteConfirm(); }
let selectedAds = new Set();
function toggleSelectAd(date, boxEl, itemEl){
  if(selectedAds.has(date)){ selectedAds.delete(date); boxEl.textContent='☐'; boxEl.classList.remove('checked'); itemEl.classList.remove('selected'); }
  else { selectedAds.add(date); boxEl.textContent='✓'; boxEl.classList.add('checked'); itemEl.classList.add('selected'); }
  const bar = el('bulkBar');
  if(bar) bar.style.display = selectedAds.size > 0 ? 'flex' : 'none';
  if(el('selectedCount')) el('selectedCount').textContent = selectedAds.size + ' محدد';
}
async function deleteSelectedAds(){ openBulkDeleteConfirm(); }
function editManual(){ if(!currentAd) return; goCreateAd(); show('result'); if(el('adText')){ el('adText').value=currentAd.adText||currentAd.text; el('adText').readOnly=false; } onAdEdited(); }
function editWithAI(){ if(!currentAd) return; goCreateAd(); if(el('product')) el('product').value=currentAd.product; onAdEdited(); }
// ===== عدل الحفظ بس: startRecreate / submitRecreate - بيجيبو من الكاش (KV) بدل tajer_history =====
function startRecreate(i){
  const hist = getAds();
  let h = hist[i];
  if(!h && currentAd){ h = { adText: currentAd.adText||currentAd.text, imagePrompt: currentAd.imagePrompt, payload: currentAd.payload || { product: currentAd.product } }; }
  if(!h) return;
  if(isTrialMode){ showLoginRequired(); return; }
  if(!token){ openLoginModal(); return; }
  if(todayCount >= 10){ return; }
  isRecreateMode = true; recreateIndex = i;
  fillFormFromPayload(h.payload || { product: h.product || '' });
  hide('createBtn'); show('recreateBtn'); show('result');
  if(el('adText')) el('adText').value = h.adText;
  if(el('imagePrompt')) el('imagePrompt').value = h.imagePrompt;
  showView('view-create-ad');
}
function cancelRecreate(){ isRecreateMode = false; recreateIndex = -1; show('createBtn'); hide('recreateBtn'); }
function submitRecreate(){
  if(el('view-ad-detail')?.classList.contains('active') && currentAd){
    const hist = getAds();
    const hIdx = hist.findIndex(h=>h.adText===(currentAd.adText||currentAd.text));
    if(hIdx>=0){ startRecreate(hIdx); return; }
    fillFormFromPayload(currentAd.payload || { product: currentAd.product }); isRecreateMode=true; showView('view-create-ad'); hide('createBtn'); show('recreateBtn'); return;
  }
  const form = el('adForm'); if(form) form.requestSubmit();
}
el('adForm')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  if(_isGeneratingAd){ return; }
  if(token && user) isTrialMode = false;
  if(isTrialMode){ if(isTrialUsed()){ showLoginRequired(); return; } }
  else { if(!token){ openLoginModal(); return; } if(todayCount >= 10){ return; } }
  const payload = getPayloadFromForm();
  if(!validateRequired(payload)) return;
  // Popunder - أول ضغطة إنشاء في اليوم - هنا بالضبط
  tryPopunderOnce('أول إنشاء في اليوم');
  const btn = isRecreateMode ? el('recreateBtn') : el('createBtn');
  const oldText = btn ? btn.textContent : '';
  _isGeneratingAd = true;
  if(btn){ btn.disabled = true; btn.textContent = 'جارٍ التوليد...'; }
  hideFormForResult();
  if(el('adText')) el('adText').value = '⏳ جارٍ توليد إعلانك... انتظر ثواني';
  if(el('imagePrompt')) el('imagePrompt').value = '';
  el('result')?.scrollIntoView({ behavior:'smooth' });
  _genAbort = new AbortController();
  const _timeout = setTimeout(()=>{ try{ _genAbort.abort(); }catch(e){} }, 30000);
  const endpoint = isTrialMode ? '/api/generate-trial' : '/api/generate';
  const headers = { 'Content-Type': 'application/json' }; if(!isTrialMode) headers.Authorization = 'Bearer '+token;
  try{
    const r = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(payload), signal: _genAbort.signal });
    const d = await r.json();
    if(d.error){ showFormForNewAd(); return; }
    show('result');
    if(el('adText')) el('adText').value = d.adText;
    if(el('imagePrompt')) el('imagePrompt').value = d.imagePrompt;
    el('result')?.scrollIntoView({ behavior:'smooth' });
    if(isTrialMode){ markTrialUsed(); setTimeout(()=>{ showLoginRequired(); }, 3000); }
    else {
      // ===== عدل الحفظ بس: /api/generate في worker بيحفظ في KV - ما بنحفظ في localStorage تاني =====
      // نحدث الكاش بس عشان renderMyAds يشتغل طوالي - بدون ما ننتظر السيرفر
      const newAd = { product: payload.product, adText: d.adText, text: d.adText, imagePrompt: d.imagePrompt, payload: payload, date: Date.now() };
      _myAdsCache.unshift(newAd); _myAdsCache = _myAdsCache.slice(0,50);
      // ما بننادي saveAdToCloud هنا - لأن worker في /api/generate حفظو في KV خلاص - عشان ما يتكرر
      if(isRecreateMode){ onAdRecreated(); }
      else { onAdCreated(); }
      loadHistory(); refreshQuota(); cancelRecreate();
    }
  }catch(err){
    showFormForNewAd();
  }finally{
    clearTimeout(_timeout);
    _isGeneratingAd = false;
    if(btn){ btn.disabled = false; btn.textContent = oldText; }
  }
});
// ===== عدل الحفظ بس: loadHistory / showOld - من الكاش (KV) =====
function loadHistory(){ if(!el('history')) return; if(el('history')) el('history').style.display = 'none'; if(el('history')) el('history').innerHTML = ''; return; }
function showOld(i){ const hist = getAds(); const h = hist[i]; if(!h) return; show('result'); if(el('adText')) el('adText').value = h.adText; if(el('imagePrompt')) el('imagePrompt').value = h.imagePrompt; el('result')?.scrollIntoView({ behavior:'smooth' }); }
// ===== عدل الحفظ بس: tryAutoLogin - من KV عبر /api/me و /api/auto-login - بدون tajer_auto_login =====
async function tryAutoLogin(){
  if(token && user){ showView('view-home'); refreshQuota(); return; }
  if(token && !user){
    try{
      const r = await fetch('/api/me', { headers: { Authorization: 'Bearer '+token } });
      const d = await r.json();
      if(d.user){ user = d.user; updateHeader(); updateAuthUI(); refreshQuota(); loadHistory(); syncToMyAds(); showView('view-home'); return; }
    }catch(e){}
  }
  try{
    const r = await fetch('/api/auto-login');
    const d = await r.json();
    if(d.token && d.user){ token = d.token; user = d.user; localStorage.setItem('tajer_token', token); updateHeader(); updateAuthUI(); refreshQuota(); loadHistory(); syncToMyAds(); showView('view-home'); }
  }catch(e){}
}
if(!token && isTrialUsed()){ hide('tryArea'); show('trialDoneBox'); }
if(token){
  hide('tryArea'); hide('trialDoneBox');
  const loginBtn = el('loginBtnTop'); if(loginBtn) loginBtn.style.display = 'none';
  const menuBtn = el('menuBtnTop'); if(menuBtn) menuBtn.classList.add('show');
  const sideLogin = el('sideLoginLink'); if(sideLogin) sideLogin.style.display = 'none';
  const sideLogout = el('sideLogoutLink'); if(sideLogout) sideLogout.style.display = 'block';
  if(user && typeof showDashboard === 'function'){ showDashboard(user.name, 10 - todayCount); }
  if(user && el('userInfo')) el('userInfo').textContent = `أهلاً بك، ${user.name}`;
  if(user && el('sideUserBox')){ el('sideUserBox').style.display='block'; el('sideUserBox').textContent = '👤 ' + user.name; }
  refreshQuota(); loadHistory(); syncToMyAds();
}
updateAuthUI();
if(token && user){ showView('view-home'); }
tryAutoLogin();
let _lastRatedAd = '';
function rateAd(v, btn){
  if(btn){ const row = btn.parentElement; row.querySelectorAll('.rateBtn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); }
  try{ localStorage.setItem('tajer_last_rate', v); }catch(e){}
  _lastRatedAd = (el('adText')?.value || el('detailText')?.textContent || currentAd?.adText || '').slice(0,500);
  if(v === -1){
    ensureAllowedModalsBlack();
    const fb = el('feedbackBox'); if(fb){ fb.classList.add('show'); fb.style.display='flex'; }
    if(el('feedbackText')) el('feedbackText').value = '';
    setTimeout(()=> el('feedbackText')?.focus(), 100);
  } else {
    // ===== عدل الحفظ بس: اللايك بيروح KV عبر /api/feedback - بدون tajer_feedbacks =====
    try{ fetch('/api/feedback', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer '+token }, body: JSON.stringify({ type:'like', ad:_lastRatedAd, product: el('product')?.value || currentAd?.product || '' }) }).catch(()=>{}); }catch(e){}
  }
}
function closeFeedback(){ const fb = el('feedbackBox'); if(fb){ fb.classList.remove('show'); fb.style.display='none'; } }
function submitFeedback(){
  const note = (el('feedbackText')?.value || '').trim();
  if(!note){ el('feedbackText')?.focus(); return; }
  const product = el('product')?.value || currentAd?.product || '';
  const adText = _lastRatedAd || '';
  const body = `ملاحظة جديدة من Tajer AI\n\nالمنتج: ${product}\n\nليه ما عجبو الإعلان:\n${note}\n\n--- نص الإعلان ---\n${adText}\n\nالتاريخ: ${new Date().toLocaleString()}`;
  // ===== عدل الحفظ بس: الملاحظة بتروح KV عبر /api/feedback - بدون tajer_feedbacks =====
  try{ fetch('/api/feedback', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer '+token }, body: JSON.stringify({ note, ad:adText, product, email:'mohelnaji0@gmail.com' }) }).catch(()=>{}); }catch(e){}
  const subject = encodeURIComponent('ملاحظة 👎 - إعلان ما عجب العميل - Tajer AI');
  const b = encodeURIComponent(body);
  window.open(`mailto:mohelnaji0@gmail.com?subject=${subject}&body=${b}`, '_blank');
  closeFeedback();
}
async function shareText(id, btn){
  const elm = typeof id === 'string' ? el(id) : id;
  let txt = elm ? (elm.value || elm.textContent || '') : '';
  txt = txt.trim();
  if(!txt){ return; }
  if(navigator.share){ try{ await navigator.share({ title: 'إعلان من Tajer AI', text: txt }); if(btn){ btn.classList.add('copied'); setTimeout(()=> btn.classList.remove('copied'), 1500); } return; }catch(e){ if(e.name === 'AbortError') return; } }
  try{ await navigator.clipboard.writeText(txt); }catch(e){}
  const wa = 'https://wa.me/?text=' + encodeURIComponent(txt);
  window.open(wa, '_blank');
}
async function shareDetailAd(btn){
  if(!currentAd) return;
  const ad = (currentAd.adText || currentAd.text || '').trim();
  const img = (currentAd.imagePrompt || '').trim();
  let txt = ad;
  if(img) txt += '\n\n🖼️ وصف الصورة:\n' + img;
  txt += '\n\n— تم إنشاؤه عبر Tajer AI';
  if(navigator.share){ try{ await navigator.share({ title: currentAd.product || 'إعلان من Tajer AI', text: txt }); return; }catch(e){ if(e.name === 'AbortError') return; } }
  try{ await navigator.clipboard.writeText(txt); }catch(e){}
  window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank');
}
