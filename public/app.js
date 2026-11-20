let token = localStorage.getItem('tajer_token') || '';
let user = JSON.parse(localStorage.getItem('tajer_user') || 'null');
let todayCount = 0; let isTrialMode = false;
let appConfig = { googleClientId: '', monetagZoneId: '', monetagPopunderZoneId: '' };
let isRecreateMode = false;
let recreateIndex = -1;
let pendingGoogle = null;
let currentAd = null;
function el(id){ return document.getElementById(id); }
function hide(id){ const e = el(id); if(e) e.style.display='none'; }
function show(id, display='block'){ const e = el(id); if(e) e.style.display=display; }
function showView(id){ document.querySelectorAll('.view').forEach(v=>v.classList.remove('active')); const t=el(id); if(t) t.classList.add('active'); window.scrollTo({top:0}); }
function toggleMenu(){ const d=el('drawer'); if(d) d.classList.toggle('show'); if(d && d.classList.contains('show')) updateDrawerAuth(); }
function toggleMenuOff(){ const d=el('drawer'); if(d) d.classList.remove('show'); }
function hideFormForResult(){
  const f = el('adForm'); if(f) f.style.display='none';
  const r = el('result'); if(r) r.style.display='block';
}
function showFormForNewAd(){
  const f = el('adForm'); if(f) f.style.display='flex';
  hide('result');
  if(isRecreateMode){ hide('createBtn'); show('recreateBtn'); } else { show('createBtn'); hide('recreateBtn'); }
}
function backFromCreate(){ if(isRecreateMode) cancelRecreate(); if(token && user){ showView('view-home'); refreshQuota(); return; } showView('view-landing'); window.scrollTo({top:0}); }
function updateDrawerAuth(){
  const loginB = el('sideLoginBtn'); const logoutB = el('sideLogoutBtn'); const editB = el('editProfileBtn');
  if(token && user){ if(loginB) loginB.style.display='none'; if(logoutB) logoutB.style.display='block'; if(editB) editB.style.display='block'; }
  else { if(loginB) loginB.style.display='block'; if(logoutB) logoutB.style.display='none'; if(editB) editB.style.display='none'; }
}
function getKnownUsers(){ try{ return JSON.parse(localStorage.getItem('tajer_known_users')||'{}'); }catch(e){ return {}; } }
function saveKnownUser(u){ if(!u || !u.email) return; const all=getKnownUsers(); all[u.email]={ name:u.name, email:u.email, pic:u.pic||u.picture||'', picture:u.picture||u.pic||'' }; localStorage.setItem('tajer_known_users', JSON.stringify(all)); }
function openEditProfile(){ toggleMenuOff(); if(!token || !user){ openLoginModal(); return; } if(el('editName')) el('editName').value=user.name||''; if(el('editEmail')) el('editEmail').value=user.email||''; if(el('editAvatar')) el('editAvatar').src=user.pic||user.picture||''; showView('view-edit-profile'); }
function previewEditPic(e){ let f=e.target.files[0]; if(!f) return; let rd=new FileReader(); rd.onload=()=>{ if(el('editAvatar')) el('editAvatar').src=rd.result; }; rd.readAsDataURL(f); }
function saveProfileEdit(){ let newName=el('editName')?.value.trim(); if(!newName){ alert('يرجى كتابة اسمك'); return; } let newPic=el('editAvatar')?.src||user.pic; user.name=newName; user.pic=newPic; user.picture=newPic; localStorage.setItem('tajer_user', JSON.stringify(user)); saveKnownUser(user); try{ localStorage.setItem('tajer_auto_login', JSON.stringify({ user:user, token:token })); }catch(e){} updateHeader(); updateAuthUI(); alert('تم حفظ التعديل ✅'); showView('view-home'); }
function updateAuthUI(){
  const bar = el('stickyBar');
  if(token && user){
    if(bar) bar.style.display = 'none';
    document.body.style.paddingBottom = '0px';
    if(el('loginBtnTop')) el('loginBtnTop').style.display = 'none';
  } else {
    if(bar) bar.style.display = 'flex';
    document.body.style.paddingBottom = '62px';
    if(el('loginBtnTop')) el('loginBtnTop').style.display = 'block';
  }
  updateDrawerAuth();
}
function goLanding(){ toggleMenuOff(); if(token && user){ showView('view-home'); refreshQuota(); return; } showView('view-landing'); }
function goHome(){ toggleMenuOff(); if(!user && !token){ showView('view-landing'); return; } showView('view-home'); refreshQuota(); }
function goCreateAd(){
  toggleMenuOff();
  showFormForNewAd();
  checkFirstAdOfDay();
  if(!token && !isTrialMode && isTrialUsed()){ alert('لقد استخدمت تجربتك المجانية - سجّل الآن للمتابعة مجاناً'); openLoginModal(); return; }
  if(!token && !isTrialMode){ isTrialMode = true; if(el('userInfo')) el('userInfo').textContent='تجربة مجانية - لمرة واحدة فقط'; if(el('quota')) el('quota').textContent='تجربة مجانية - لمرة واحدة فقط - بدون تسجيل'; }
  showView('view-create-ad');
}
async function goMyAds(){ toggleMenuOff(); if(!token){ openLoginModal(); return; } showView('view-my-ads'); await renderMyAds(); }
function logout(){
  if(user && token){ try{ localStorage.setItem('tajer_auto_login', JSON.stringify({ user: user, token: token })); }catch(e){} }
  token=''; user=null;
  localStorage.removeItem('tajer_token'); localStorage.removeItem('tajer_user');
  const b=el('loginBtnTop'); if(b) b.style.display='block';
  const av=el('headerAvatar'); if(av) av.style.display='none';
  toggleMenuOff(); updateAuthUI(); showView('view-landing');
}
function showDashboard(name, remaining){ const w=el('welcomeText'); if(w) w.textContent='مرحباً بك يا '+name+' 👋'; const q=el('quotaText'); if(q) q.textContent='🔢 المتبقي لك '+remaining+' إعلان من 10 اليوم'; const q2=el('quota'); if(q2 && token) q2.textContent='المتبقي لك '+remaining+' إعلان'; updateHeader(); }
function updateHeader(){ if(!user) return; const b=el('loginBtnTop'); if(b) b.style.display='none'; const av=el('headerAvatar'); if(av){ av.src=user.pic||user.picture||('https://ui-avatars.com/api/?name='+encodeURIComponent(user.name)); av.style.display='block'; } const da=el('drawerAvatar'); if(da) da.src=av?av.src:''; const dn=el('drawerName'); if(dn) dn.textContent=user.name; const de=el('drawerEmail'); if(de) de.textContent=user.email||''; const w=el('welcomeText'); if(w) w.textContent='مرحباً بك يا '+user.name+' 👋'; }
function previewPic(e){ let f=e.target.files[0]; if(!f) return; let rd=new FileReader(); rd.onload=()=>{ if(el('accAvatar')) el('accAvatar').src=rd.result; if(pendingGoogle) pendingGoogle.pic=rd.result; }; rd.readAsDataURL(f); }
function finishCreateAccount(){ let name=el('accName')?.value.trim(); if(!name){ alert('يرجى كتابة اسمك'); return; } if(pendingGoogle){ user={...pendingGoogle, name}; pendingGoogle=null; } else if(user){ user.name=name; } else { alert('حدث خطأ - يرجى تسجيل الدخول مرة أخرى'); return; } localStorage.setItem('tajer_user', JSON.stringify(user)); saveKnownUser(user); if(token){ try{ localStorage.setItem('tajer_auto_login', JSON.stringify({ user: user, token: token })); }catch(e){} } updateHeader(); updateAuthUI(); showView('view-home'); refreshQuota(); }
function showForm(){ var heroVal = el('heroProduct') ? el('heroProduct').value : ''; goCreateAd(); var p = el('product'); if(p && heroVal && !p.value){ p.value = heroVal; } if(!token && !isTrialUsed()){ isTrialMode = true; if(el('userInfo')) el('userInfo').textContent = 'تجربة مجانية - لمرة واحدة فقط'; if(el('quota')) el('quota').textContent = 'تجربة مجانية - لمرة واحدة فقط - بدون تسجيل'; } }
function hideForm(){ if(token) showView('view-home'); else showView('view-landing'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
async function loadConfig(){ try{ const r = await fetch('/api/config'); const d = await r.json(); appConfig = d; const g = document.getElementById('g_id_onload'); if(g && d.googleClientId) g.setAttribute('data-client_id', d.googleClientId); if(d.monetagZoneId){ const s = document.createElement('script'); s.src = 'https://alwingulla.com/88/tag.min.js'; s.setAttribute('data-zone', d.monetagZoneId); s.setAttribute('data-cfasync', 'false'); s.async = true; document.head.appendChild(s); } if(d.monetagPopunderZoneId){ const s2 = document.createElement('script'); s2.src = 'https://alwingulla.com/88/tag.min.js'; s2.setAttribute('data-zone', d.monetagPopunderZoneId); s2.setAttribute('data-cfasync', 'false'); s2.async = true; document.head.appendChild(s2); } }catch(e){} }
loadConfig();
async function refreshQuota(){ if(!token) return; try{ const r = await fetch('/api/quota', { headers: { Authorization: 'Bearer '+token }}); const d = await r.json(); todayCount = d.count || 0; if(el('quota')) el('quota').textContent = `المتبقي لك اليوم: ${10 - todayCount} إعلاناً نصياً`; if(typeof showDashboard === 'function' && user) showDashboard(user.name, 10 - todayCount); }catch(e){} }
function isTrialUsed(){ return localStorage.getItem('tajer_trialUsed') === 'yes'; }
function markTrialUsed(){ localStorage.setItem('tajer_trialUsed', 'yes'); }
function openLoginModal(){ const m = el('loginModal'); if(m) m.classList.add('show'); }
function closeLoginModal(){ const m = el('loginModal'); if(m) m.classList.remove('show'); }
document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeLoginModal(); });
el('loginModal')?.addEventListener('click', function(e){ if(e.target === this) closeLoginModal(); });
function heroTry(){ const v = el('heroProduct')?.value || ''; if(v.trim() && el('product')) el('product').value = v.trim(); if(!token && isTrialUsed()){ alert('لقد استخدمت تجربتك المجانية - سجّل الآن للمتابعة مجاناً'); openLoginModal(); return; } showForm(); }
function startTrial(){ if(isTrialUsed()){ alert('لقد استخدمت تجربتك المجانية - سجّل الآن للمتابعة مجاناً'); openLoginModal(); return; } isTrialMode = true; hide('tryArea'); if(el('userInfo')) el('userInfo').textContent = 'تجربة مجانية - لمرة واحدة فقط'; if(el('quota')) el('quota').textContent = 'تجربة مجانية - لمرة واحدة فقط - بدون تسجيل'; showForm(); }
function showLoginRequired(){ if(token && user) return; hide('result'); hide('tryArea'); show('trialDoneBox'); openLoginModal(); showView('view-landing'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function onGoogleLogin(res){
  try{ let payload = JSON.parse(atob(res.credential.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))); pendingGoogle = { name: payload.name, email: payload.email, picture: payload.picture, pic: payload.picture }; }catch(e){}
  fetch('/api/auth/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential: res.credential }) })
  .then(r=>r.json()).then(d=>{
    if(d.token){
      token = d.token; localStorage.setItem('tajer_token', token);
      let saved = localStorage.getItem('tajer_user');
      if(saved && JSON.parse(saved).email === d.user.email){
        user = d.user; localStorage.setItem('tajer_user', JSON.stringify(d.user));
        saveKnownUser(user);
        try{ localStorage.setItem('tajer_auto_login', JSON.stringify({ user: user, token: token })); }catch(e){}
        isTrialMode = false; closeLoginModal(); hide('loginRequiredBox'); hide('tryArea'); hide('trialDoneBox');
        if(el('userInfo')) el('userInfo').textContent = `أهلاً بك، ${user.name}`;
        const loginBtn = el('loginBtnTop'); if(loginBtn) loginBtn.style.display = 'none';
        updateHeader(); updateAuthUI(); refreshQuota(); loadHistory(); syncToMyAds(); showView('view-home');
        alert('تم تسجيل دخولك بنجاح ✅');
        return;
      }
      const knownBefore = getKnownUsers()[d.user.email];
      user = d.user; localStorage.setItem('tajer_user', JSON.stringify(d.user));
      saveKnownUser(user);
      try{ localStorage.setItem('tajer_auto_login', JSON.stringify({ user: user, token: token })); }catch(e){}
      isTrialMode = false; closeLoginModal(); hide('loginRequiredBox'); hide('tryArea'); hide('trialDoneBox');
      if(knownBefore && knownBefore.name){
        if(knownBefore.name) user.name = knownBefore.name;
        if(knownBefore.pic) { user.pic = knownBefore.pic; user.picture = knownBefore.pic; }
        localStorage.setItem('tajer_user', JSON.stringify(user));
        if(el('userInfo')) el('userInfo').textContent = `أهلاً بك، ${user.name}`;
        updateHeader(); updateAuthUI(); refreshQuota(); loadHistory(); syncToMyAds(); showView('view-home');
        alert('مرحباً بعودتك يا '+user.name+' ✅');
        return;
      }
      if(el('accName')) el('accName').value = d.user.name || pendingGoogle?.name || '';
      if(el('accEmail')) el('accEmail').value = d.user.email || pendingGoogle?.email || '';
      if(el('accAvatar')) el('accAvatar').src = d.user.picture || pendingGoogle?.pic || '';
      showView('view-create-account');
    }
    else alert(d.error || 'فشل تسجيل الدخول - يرجى المحاولة مرة أخرى');
  }).catch(()=> alert('حدثت مشكلة في الاتصال - يرجى المحاولة مرة أخرى'));
}
function showMonetagAd(){ if(window.showMonetag) window.showMonetag(); return new Promise(res=>setTimeout(res, 2000)); }
function showMonetagPopunder(){ if(window.showMonetagPopunder) window.showMonetagPopunder(); else if(window.showMonetag) window.showMonetag(); return new Promise(res=>setTimeout(res, 2000)); }
function getPayloadFromForm(){ const v = (id) => (el(id)?.value || '').trim(); return { product: v('product'), productFeatures: v('productFeatures'), country: v('country'), dialect: v('dialect'), city: v('city'), category: v('category'), price: v('price'), delivery: v('delivery'), pickupMethod: v('pickupMethod'), whatsapp: v('whatsapp'), lang: v('lang'), length: v('length'), platform: v('platform') || 'جميع المنصات', shopName: v('shopName'), offer: v('offer'), audience: v('audience') || 'الجميع', tone: v('tone') || 'حماسية', pageLink: v('pageLink'), hasImage: v('hasImage') || 'أرغب في وصف صورة', serviceLink: v('serviceLink'), }; }
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
  for(const [id, msg] of checks){ if(!payload[id] || !payload[id].trim()){ alert(msg); el(id)?.focus(); el(id)?.scrollIntoView({ behavior:'smooth', block:'center' }); return false; } }
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
function getAds(){ try{ return JSON.parse(localStorage.getItem('myAds')||'[]'); }catch{ return []; } }
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
async function syncToMyAds(){
  const localAds = getAds().map(normalizeAd).filter(Boolean);
  const hist = JSON.parse(localStorage.getItem('tajer_history')||'[]');
  const histAds = hist.map(h => normalizeAd({ product: h.payload?.product || 'إعلان', adText: h.adText, imagePrompt: h.imagePrompt, payload: h.payload, date: h.date })).filter(Boolean);
  const cloudAds = await fetchCloudAds();
  const merged = [];
  const seen = new Set();
  const push = (a)=>{ const key = (a.adText||'').trim().slice(0,120); if(!key || seen.has(key)) return; seen.add(key); merged.push(a); };
  cloudAds.forEach(push); localAds.forEach(push); histAds.forEach(push);
  merged.sort((a,b)=> (b.date||0) - (a.date||0));
  localStorage.setItem('myAds', JSON.stringify(merged.slice(0,50)));
  for(const a of localAds){
    const inCloud = cloudAds.some(c => (c.adText||'').trim().slice(0,120) === (a.adText||'').trim().slice(0,120));
    if(!inCloud) await saveAdToCloud(a);
  }
  return merged;
}
async function renderMyAds(){
  const elm = el('myAdsList'); if(!elm) return;
  elm.innerHTML = '<p style="text-align:center;color:#94a3b8">جارٍ تحميل إعلاناتك...</p>';
  const ads = await syncToMyAds();
  if(!ads.length){ elm.innerHTML='<p style="text-align:center;color:#94a3b8">لم تقم بإنشاء أي إعلان بعد</p>'; return; }
  elm.innerHTML = ads.map((a,i)=>{
    const d = a.date ? new Date(a.date).toLocaleString() : '';
    return `<div class="adItem" onclick="openAd(${i})"><b>${a.product||'إعلان'}</b><p style="font-size:12px;color:#94a3b8">${(a.adText||a.text||'').slice(0,80)}...</p><small style="color:#64748b">${d}</small></div>`;
  }).join('');
}
function openAd(i){ const ads = getAds(); currentAd = ads[i]; if(!currentAd) return; if(el('detailTitle')) el('detailTitle').textContent=currentAd.product; if(el('detailText')) el('detailText').textContent=currentAd.adText||currentAd.text; if(el('detailImagePrompt')) el('detailImagePrompt').textContent='🖼️ وصف الصورة: '+(currentAd.imagePrompt||''); showView('view-ad-detail'); }
function copySiteLink(){ if(navigator.clipboard) navigator.clipboard.writeText(location.origin).then(()=>alert('تم نسخ رابط الموقع ✅')); }
function editManual(){ if(!currentAd) return; goCreateAd(); show('result'); if(el('adText')){ el('adText').value=currentAd.adText||currentAd.text; el('adText').readOnly=false; } alert('قم بتعديل الإعلان يدوياً في صندوق النص ثم انسخه'); }
function editWithAI(){ if(!currentAd) return; goCreateAd(); if(el('product')) el('product').value=currentAd.product; alert('قم بتعديل الحقول ثم اضغط إنشاء - سنعدله لك بالذكاء الاصطناعي'); }
function startRecreate(i){
  const hist = JSON.parse(localStorage.getItem('tajer_history')||'[]');
  let h = hist[i];
  if(!h && currentAd){ h = { adText: currentAd.adText||currentAd.text, imagePrompt: currentAd.imagePrompt, payload: currentAd.payload || { product: currentAd.product } }; }
  if(!h) return;
  if(isTrialMode){ alert('انتهت التجربة المجانية - سجّل للمتابعة - إعادة الإنشاء للمشتركين فقط'); showLoginRequired(); return; }
  if(!token){ alert('يرجى تسجيل الدخول أولاً للمتابعة.'); openLoginModal(); return; }
  if(todayCount >= 10){ alert('لقد استهلكت حصتك اليومية. يمكنك المحاولة غداً.'); return; }
  isRecreateMode = true; recreateIndex = i;
  fillFormFromPayload(h.payload || { product: h.product || '' });
  hide('createBtn'); show('recreateBtn'); show('result');
  if(el('adText')) el('adText').value = h.adText;
  if(el('imagePrompt')) el('imagePrompt').value = h.imagePrompt;
  showView('view-create-ad');
  alert('تم تحميل بيانات الإعلان السابق في النموذج - قم بتعديل أي حقل - ثم اضغط إعادة إنشاء بصيغة أخرى - سيتم خصم طلب واحد من حصتك');
}
function cancelRecreate(){ isRecreateMode = false; recreateIndex = -1; show('createBtn'); hide('recreateBtn'); }
function submitRecreate(){
  if(el('view-ad-detail')?.classList.contains('active') && currentAd){
    const hist = JSON.parse(localStorage.getItem('tajer_history')||'[]');
    const hIdx = hist.findIndex(h=>h.adText===(currentAd.adText||currentAd.text));
    if(hIdx>=0){ startRecreate(hIdx); return; }
    fillFormFromPayload(currentAd.payload || { product: currentAd.product }); isRecreateMode=true; showView('view-create-ad'); hide('createBtn'); show('recreateBtn'); return;
  }
  const form = el('adForm'); if(form) form.requestSubmit();
}
el('adForm')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  if(token && user) isTrialMode = false;
  if(isTrialMode){ if(isTrialUsed()){ alert('لقد استخدمت تجربتك المجانية - سجّل الآن للمتابعة مجاناً'); showLoginRequired(); return; } }
  else { if(!token){ alert('يرجى تسجيل الدخول أولاً للمتابعة.'); openLoginModal(); return; } if(todayCount >= 10){ alert('لقد استهلكت حصتك اليومية. يمكنك المحاولة غداً.'); return; } if(todayCount === 0){ await showMonetagAd(); } else if(todayCount === 3){ await showMonetagPopunder(); } }
  const payload = getPayloadFromForm();
  if(!validateRequired(payload)) return;
  if(isRecreateMode){ const ok = confirm(`ستعيد إنشاء هذا الإعلان بصيغة جديدة - وسيتم خصم طلب واحد من حصتك - المتبقي لك: ${10 - todayCount} - هل أنت متأكد؟`); if(!ok) return; }
  const btn = isRecreateMode ? el('recreateBtn') : el('createBtn');
  const oldText = btn ? btn.textContent : '';
  if(btn){ btn.disabled = true; btn.textContent = 'جارٍ التوليد...'; }
  hideFormForResult();
  if(el('adText')) el('adText').value = '⏳ جارٍ توليد إعلانك... انتظر ثواني';
  if(el('imagePrompt')) el('imagePrompt').value = '';
  el('result')?.scrollIntoView({ behavior:'smooth' });
  const endpoint = isTrialMode ? '/api/generate-trial' : '/api/generate';
  const headers = { 'Content-Type': 'application/json' }; if(!isTrialMode) headers.Authorization = 'Bearer '+token;
  try{
    const r = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(payload) });
    const d = await r.json();
    if(btn){ btn.disabled = false; btn.textContent = oldText; }
    if(d.error){
      showFormForNewAd();
      alert(d.error); return;
    }
    show('result');
    if(el('adText')) el('adText').value = d.adText;
    if(el('imagePrompt')) el('imagePrompt').value = d.imagePrompt;
    el('result')?.scrollIntoView({ behavior:'smooth' });
    if(isTrialMode){ markTrialUsed(); setTimeout(()=>{ showLoginRequired(); }, 3000); }
    else {
      const hist = JSON.parse(localStorage.getItem('tajer_history')||'[]');
      hist.unshift({ adText: d.adText, imagePrompt: d.imagePrompt, payload: payload, date: new Date().toLocaleString(), isRecreate: isRecreateMode });
      localStorage.setItem('tajer_history', JSON.stringify(hist.slice(0,20)));
      const newAd = { product: payload.product, adText: d.adText, text: d.adText, imagePrompt: d.imagePrompt, payload: payload, date: Date.now() };
      const local = getAds(); local.unshift(newAd); localStorage.setItem('myAds', JSON.stringify(local.slice(0,50)));
      await saveAdToCloud(newAd);
      _adsCreatedCount++;
      if(isRecreateMode){
        loadAdsterra();
      } else if(_adsCreatedCount % 2 === 0){
        loadAdsterra();
      }
      loadHistory(); refreshQuota(); cancelRecreate();
    }
  }catch(err){
    if(btn){ btn.disabled = false; btn.textContent = oldText; }
    showFormForNewAd();
    alert('حدثت مشكلة في الاتصال - يرجى المحاولة مرة أخرى');
  }
});
function loadHistory(){
  const hist = JSON.parse(localStorage.getItem('tajer_history')||'[]');
  if(!el('history')) return;
  if(el('history')) el('history').style.display = 'none';
  if(el('history')) el('history').innerHTML = '';
  return;
}
function showOld(i){ const hist = JSON.parse(localStorage.getItem('tajer_history')||'[]'); const h = hist[i]; if(!h) return; show('result'); if(el('adText')) el('adText').value = h.adText; if(el('imagePrompt')) el('imagePrompt').value = h.imagePrompt; el('result')?.scrollIntoView({ behavior:'smooth' }); }
function copyText(id){ const elm = el(id); if(!elm) return; let txt = elm.value || elm.textContent; if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(()=> alert('تم النسخ بنجاح ✅ - يمكنك لصقه في أي مكان')); } else { elm.select(); document.execCommand('copy'); alert('تم النسخ بنجاح ✅ - يمكنك لصقه في أي مكان'); } }
async function tryAutoLogin(){
  if(token && user) return;
  const savedAuto = localStorage.getItem('tajer_auto_login');
  if(savedAuto){
    try{
      const d = JSON.parse(savedAuto);
      if(d.token && d.user){
        token = d.token; user = d.user;
        localStorage.setItem('tajer_token', token);
        localStorage.setItem('tajer_user', JSON.stringify(user));
        updateHeader(); updateAuthUI(); refreshQuota(); loadHistory(); syncToMyAds();
        showView('view-home');
        return;
      }
    }catch(e){}
  }
  try{
    const r = await fetch('/api/auto-login');
    const d = await r.json();
    if(d.token && d.user){
      token = d.token; user = d.user;
      localStorage.setItem('tajer_token', token);
      localStorage.setItem('tajer_user', JSON.stringify(user));
      try{ localStorage.setItem('tajer_auto_login', JSON.stringify({ user: user, token: token })); }catch(e){}
      updateHeader(); updateAuthUI(); refreshQuota(); loadHistory(); syncToMyAds();
      showView('view-home');
    }
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
// ===== تقييم + ملاحظات 👎 -> ترسل لبريدك =====
let _lastRatedAd = '';
function rateAd(v, btn){
  if(btn){
    const row = btn.parentElement;
    row.querySelectorAll('.rateBtn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
  }
  try{ localStorage.setItem('tajer_last_rate', v); }catch(e){}
  _lastRatedAd = (el('adText')?.value || el('detailText')?.textContent || currentAd?.adText || '').slice(0,500);
  if(v === -1){
    const fb = el('feedbackBox');
    if(fb) fb.classList.add('show');
    if(el('feedbackText')) el('feedbackText').value = '';
    setTimeout(()=> el('feedbackText')?.focus(), 100);
  } else {
    try{
      const all = JSON.parse(localStorage.getItem('tajer_feedbacks')||'[]');
      all.unshift({ type:'like', ad:_lastRatedAd, date:new Date().toLocaleString(), product: el('product')?.value || currentAd?.product || '' });
      localStorage.setItem('tajer_feedbacks', JSON.stringify(all.slice(0,50)));
    }catch(e){}
  }
}
function closeFeedback(){
  const fb = el('feedbackBox');
  if(fb) fb.classList.remove('show');
}
function submitFeedback(){
  const note = (el('feedbackText')?.value || '').trim();
  if(!note){ alert('اكتب ملاحظتك أولاً'); return; }
  const product = el('product')?.value || currentAd?.product || '';
  const adText = _lastRatedAd || '';
  const body = `ملاحظة جديدة من Tajer AI\n\nالمنتج: ${product}\n\nليه ما عجبو الإعلان:\n${note}\n\n--- نص الإعلان ---\n${adText}\n\nالتاريخ: ${new Date().toLocaleString()}`;
  try{
    const all = JSON.parse(localStorage.getItem('tajer_feedbacks')||'[]');
    all.unshift({ type:'dislike', note, ad:adText, product, date:new Date().toLocaleString() });
    localStorage.setItem('tajer_feedbacks', JSON.stringify(all.slice(0,50)));
  }catch(e){}
  try{
    fetch('/api/feedback', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ note, ad:adText, product, email:'mohelnaji0@gmail.com' }) }).catch(()=>{});
  }catch(e){}
  const subject = encodeURIComponent('ملاحظة 👎 - إعلان ما عجب العميل - Tajer AI');
  const b = encodeURIComponent(body);
  window.open(`mailto:mohelnaji0@gmail.com?subject=${subject}&body=${b}`, '_blank');
  closeFeedback();
  alert('شكراً ليك ❤️ - وصلت ملاحظتك - حنحسن الإعلان الجاي');
}
// ===== Adsterra Social Bar - النظام الجديد =====
let _lastSocialTime = 0, _socialClosedUntil = 0, _socialLoaded = false, _adsCreatedCount = 0;
let _todayStr = function(){ return new Date().toDateString(); };
function _canShowSocial(){
  if(Date.now() < _socialClosedUntil) return false;
  if(Date.now() - _lastSocialTime < 60*1000) return false;
  return true;
}
function loadAdsterra(){
  if(!_canShowSocial()) return;
  if(_socialLoaded) return;
  _lastSocialTime = Date.now();
  _socialLoaded = true;
  const s=document.createElement('script');
  s.setAttribute('data-cfasync','false');
  s.src='https://bauval.org/14/f7bb06d45366cb88433539a59c476da0';
  document.body.appendChild(s);
}
function checkFirstAdOfDay(){
  try{
    const lastDay = localStorage.getItem('tajer_first_ad_day');
    const today = _todayStr();
    if(lastDay !== today){
      localStorage.setItem('tajer_first_ad_day', today);
      loadAdsterra();
    }
  }catch(e){ loadAdsterra(); }
}
function onAdClosedByUser(){
  _socialClosedUntil = Date.now()+5*60*1000;
  _socialLoaded = false;
}
document.addEventListener('click', function(e){
  const t=e.target.closest('[class*="close"], [id*="close"], [class*="Close"], [aria-label*="close" i], [aria-label*="Close"]');
  if(t) onAdClosedByUser();
});
