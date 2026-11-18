// تاجر AI - Cloudflare Worker - 12 مفتاح
const INSTRUCTION_GROQ_QWEN = `
أنت كاتب إعلانات محترف.
باللهجة التي يطلبها المستخدم، بطريقة طبيعية مريحة.
كتابتك جذابة، وواضحة، ومقنعة.
هدفك هو مساعدة التاجر على تقديم ما يعلن عنه بطريقة طبيعية ومقنعة.
عندما يطلب منك المستخدم كتابة إعلان، فكّر بهدوء في جميع المعلومات التي يقدمها لك.
لا تتجاهل أي معلومة. استخدم كل معلومة في مكانها المناسب.
العنصر الأول هو البداية. ابدأ بجملة تستهدف القارئ. يمكن أن تبدأ بسؤال، أو بموقف يومي يعيشه القارئ. وإذا كان هناك اسم للمتجر / الخدمة / الموقع / التطبيق، اذكره في البداية.
العنصر الثاني هو الشي المعلن عنه ونوعه. اذكر اسم المنتج / الخدمة / الموقع / التطبيق، ونوعه، بطريقة طبيعية. لا تقل دائما "منتج" - إذا كان خدمة قل "خدمة"، وإذا كان موقعا قل "موقع"، وإذا كان تطبيقا قل "تطبيق"، حسب ما يرسله المستخدم في خانة النوع.
العنصر الثالث هو الجمهور والمكان. وجّه كلامك للجمهور المستهدف. واذكر الدولة والمدينة إذا كانت متوفرة.
العنصر الرابع هو السعر والعرض. اذكر السعر إذا كان متوفرا. واذكر العرض إذا كان موجودا، مثل التوصيل المجاني أو الخصم أو الاشتراك المجاني. واذكر التوصيل / طريقة الاستلام إذا كانت متوفرة.
العنصر الخامس هو الشعور بالفرصة. وضّح أن الفرصة جيدة. وأن من الأفضل أن لا يؤجل، حتى لا تفوته. دون ضغط، وتخويف زائد.
العنصر السادس هو النبرة. التزم بالنبرة التي يطلبها التاجر.
العنصر السابع هو المنصة والطول. إذا كان لفيسبوك اجعله مناسبا للفيسبوك. وإذا كان لواتساب اجعله قصيرا وواضحا. وإذا كان لتيك توك اجعله قصيرا وحماسيا. والتزم بالطول المطلوب.
العنصر الثامن هو التواصل. في النهاية اذكر طريقة التواصل. إذا كان هناك رقم واتساب اذكره. وإذا كان هناك رابط للصفحة أو الموقع أو التطبيق اذكره. إذا لم يكن هناك رقم، اكتب: اطلب عبر الرسائل الخاصة - أو سجّل من الرابط - أو حمّل التطبيق - حسب نوع الشي.
العنصر التاسع هو وصف الصورة. بعد الإعلان النصي، اكتب وصفا كاملا للصورة بالإنجليزية. إذا كان منتجا صف المنتج. وإذا كانت خدمة صف شخصا يستخدم الخدمة. وإذا كان موقعا أو تطبيقا صف شاشة هاتف تعرض الموقع / التطبيق.
ملاحظات: اكتب باللهجة المطلوبة فقط. استخدم كلمات عامية حقيقية من نفس اللهجة. اجعل الجمل قصيرة وواضحة. لا تستخدم كلمات عامة مثل جودة ممتازة، بل اذكر تفاصيل حقيقية. لا تكتب مقدمة عن نفسك، ادخل مباشرة في الإعلان. إذا كانت هناك خانة فارغة، تجاهلها بهدوء، ولا تخترع معلومات.
`;
const INSTRUCTION_GOOGLE_GEMMA = `
أنت خبير في كتابة الإعلانات المقنعة، ومتخصص في اللهجات العربية العامية.
مهمتك ليست الكتابة فقط، بل البيع. هدفك هو أن يجعل القارئ يطلب الآن، ويشعر أنه سيخسر إذا لم يشترِ الآن.
أولا: اللغة واللهجة. اكتب باللهجة المطلوبة فقط. يمنع استخدام الفصحى إلا إذا كانت هي المطلوبة. يمنع استخدام كلمات باردة مثل: اكتشف، سارع، اغتنم الفرصة، نفاد المخزون، الجودة الممتازة. استخدم كلمات عامية حقيقية من نفس اللهجة، مثل: ايه رايك، جامد، تحفة، متضيعش الفرصة، الحق بسرعة، هتندم لو فاتك، الكمية بتخلص، كلهم جابوه إلا انت.
ثانيا: البنية الإلزامية: 1. الخطاف: ابدأ بسؤال مباشر يمس مشكلة يومية. 2. الشي المعلن عنه: اذكر اسم المنتج / الخدمة / الموقع / التطبيق فورا، واربطه بحل المشكلة. لا تقل دائما "منتج" - إذا كان خدمة قل "خدمة"، وإذا كان موقعا قل "موقع"، وإذا كان تطبيقا قل "تطبيق". 3. الإثبات: اذكر تفصيلة واحدة حقيقية من المميزات، ولا تخترع ميزة. إذا كان منتجا اذكر ميزة مادية. وإذا كانت خدمة اذكر فائدة. وإذا كان موقعا أو تطبيقا اذكر ما سيفعله المستخدم داخله، مثل: سجل، احجز، اطلب، حمّل. 4. العرض والسعر: اذكر السعر بوضوح، ثم العرض. اجعل العرض يبدو أكبر من السعر. 5. خوف من الخسارة: اجعل القارئ يشعر بالخسارة. استخدم جملتين متتاليتين للضغط. 6. دعوة للفعل: اختم بأمر مباشر: إذا كان منتجا أو خدمة: اطلب الآن. وإذا كان موقعا: سجّل الآن. وإذا كان تطبيقا: حمّل الآن. ثم اذكر واتساب إن وُجد.
ثالثا: لا تشرح، بل بع. لا تكن مؤدبا زيادة. كن مباشرا، وحماسيا، وواثقا. اجعل الجمل قصيرة. كل جملة في سطر. استخدم الرموز بشكل معتدل. وجه الكلام للجمهور، واذكر المدينة إن وُجدت.
رابعا: استخدم كل ما يرسله المستخدم، ولا تتجاهل أي معلومة. إذا كانت هناك خانة فارغة، تجاهلها بهدوء، ولا تخترع. اذكر اسم المتجر / الخدمة / الموقع / التطبيق، ورقم الواتساب، ورابط الصفحة، في نهاية الإعلان فقط. التزم بالنبرة والمنصة والطول المطلوب.
خامسا: وصف الصورة. بعد الإعلان، اكتب وصفا كاملا للصورة بالإنجليزية. يجب أن يتوافق مع الشي المعلن عنه والعرض والجمهور. إذا كان منتجا صف المنتج. وإذا كانت خدمة صف شخصا يستخدم الخدمة. وإذا كان موقعا أو تطبيقا صف شاشة الهاتف تعرض الموقع / التطبيق. بدون أي نص داخل الصورة.
`;
function getAllKeys(env){
  return [
    { type: 'groq', key: env.GROQ_KEY1 },
    { type: 'groq', key: env.GROQ_KEY2 },
    { type: 'groq', key: env.GROQ_KEY3 },
    { type: 'groq', key: env.GROQ_KEY4 },
    { type: 'groq', key: env.GROQ_KEY5 },
    { type: 'groq', key: env.GROQ_KEY6 },
    { type: 'groq', key: env.GROQ_KEY7 },
    { type: 'groq', key: env.GROQ_KEY8 },
    { type: 'google', key: env.GOOGLE_STUDIO_KEY1 },
    { type: 'google', key: env.GOOGLE_STUDIO_KEY2 },
    { type: 'google', key: env.GOOGLE_STUDIO_KEY3 },
    { type: 'google', key: env.GOOGLE_STUDIO_KEY4 },
  ].filter(k => k.key);
}
async function pickKeyForRequest(env){
  const keys = getAllKeys(env);
  if(keys.length === 0) throw new Error('لا يوجد أي مفتاح');
  let counter = 0;
  try{ counter = parseInt(await env.TAJER_KV.get('unified_key_counter') || '0'); }catch(e){ counter = 0; }
  const index = counter % keys.length;
  try{ await env.TAJER_KV.put('unified_key_counter', String(counter + 1)); }catch(e){}
  return { selected: keys[index], startIndex: index, keys };
}
async function callGroqWithKey(env, key, userPrompt, maxTokens){
  const res = await fetch(`${env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1'}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: env.GROQ_MODEL || 'qwen/qwen3.8-27b',
      messages: [
        { role: 'system', content: INSTRUCTION_GROQ_QWEN },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: maxTokens
    })
  });
  if(!res.ok) throw new Error('Groq failed');
  const d = await res.json();
  const text = d.choices?.[0]?.message?.content;
  if(!text) throw new Error('Groq empty');
  return text;
}
async function callGoogleWithKey(env, key, userPrompt, maxTokens){
  const res = await fetch(`${env.GOOGLE_STUDIO_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta'}/models/${env.GOOGLE_STUDIO_MODEL || 'gemma-4-31b-it'}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: INSTRUCTION_GOOGLE_GEMMA }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.85, maxOutputTokens: maxTokens, topP: 0.95 }
    })
  });
  if(!res.ok) throw new Error('Google Studio failed');
  const d = await res.json();
  const text = d.candidates?.[0]?.content?.parts?.[0]?.text;
  if(!text) throw new Error('Google empty');
  return text;
}
async function callWithRotation(env, picked, userPrompt, maxTokens){
  const { keys, startIndex } = picked;
  for(let i = 0; i < keys.length; i++){
    const k = keys[(startIndex + i) % keys.length];
    try{
      if(k.type === 'groq') return await callGroqWithKey(env, k.key, userPrompt, maxTokens);
      else return await callGoogleWithKey(env, k.key, userPrompt, maxTokens);
    }catch(e){ continue; }
  }
  throw new Error('كل المفاتيح الـ 12 فشلت');
}
function verifyToken(req){
  const auth = req.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  if(!token) return null;
  try{
    const parts = token.split('.');
    if(parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  }catch{ return null; }
}
// جديد: فحص الإجباري في السيرفر - 8 خانات
function validateRequiredServer(b){
  if(!b.product || !String(b.product).trim()) return 'الخانة 1 - اسم المنتج - إجبارية';
  if(!b.productFeatures || !String(b.productFeatures).trim()) return 'الخانة 2 - وصف / مميزات المنتج - إجبارية';
  if(!b.country || !String(b.country).trim()) return 'الخانة 3 - الدولة - إجبارية';
  if(!b.dialect || !String(b.dialect).trim()) return 'الخانة 4 - اللهجة - إجبارية';
  if(!b.category || !String(b.category).trim()) return 'الخانة 6 - التصنيف - إجبارية';
  if(!b.lang || !String(b.lang).trim()) return 'الخانة 11 - لغة الإعلان - إجبارية';
  if(!b.length || !String(b.length).trim()) return 'الخانة 12 - طول الإعلان - إجبارية';
  if(!b.shopName || !String(b.shopName).trim()) return 'الخانة 14 - اسم المتجر - إجبارية';
  return null;
}
function buildUserData(b){
  return `البيانات - 20 خانة:
1. اسم المنتج / الخدمة / الموقع / التطبيق: ${b.product}
2. وصف / مميزات: ${b.productFeatures || 'غير محدد'}
3. الدولة: ${b.country || 'غير محدد'}
4. اللهجة المطلوبة: ${b.dialect || 'فصحى'}
5. المدينة أو المكان: ${b.city || 'غير محدد'}
6. نوع الشي المعلن عنه: ${b.category || 'غير محدد'} - منتج / خدمة / موقع / تطبيق - التزم بهذا النوع ولا تغيره
7. السعر: ${b.price || 'غير محدد'}
8. التوصيل: ${b.delivery || 'غير محدد'}
9. طريقة الاستلام: ${b.pickupMethod || 'غير محدد'}
10. رقم واتساب: ${b.whatsapp || 'غير محدد'}
11. لغة الإعلان: ${b.lang || 'عربي'}
12. طول الإعلان: ${b.length || 'تلقائي'}
13. المنصة التي سينشر فيها الإعلان: ${b.platform || 'جميع المنصات'}
14. اسم المتجر / الخدمة / الموقع / التطبيق: ${b.shopName || 'غير محدد'}
15. العرض: ${b.offer || 'لا يوجد'}
16. الجمهور المستهدف: ${b.audience || 'الجميع'}
17. نبرة الإعلان: ${b.tone || 'حماسية'}
18. رابط الصفحة: ${b.pageLink || 'غير محدد'}
19. هل لديه صورة؟: ${b.hasImage || 'أرغب في وصف صورة'}
20. رابط الخدمة / الموقع / التطبيق: ${b.serviceLink || 'غير محدد'}`;
}
function buildPrompt1(b){
  return `${buildUserData(b)}
المطلوب: اكتب إعلانا واحدا فقط، باللغة: ${b.lang || 'عربي'}، وباللهجة: ${b.dialect || 'فصحى'}، وبالنبرة: ${b.tone || 'حماسية'}، وبالطول: ${b.length || 'تلقائي'}، ومناسبا للمنصة: ${b.platform || 'جميع المنصات'}. أعد الإعلان فقط.`;
}
function buildPrompt2(b){
  return `${buildUserData(b)}
المطلوب: اكتب وصف صورة واحد فقط بالإنجليزية، فقرة واحدة، لصورة إعلانية احترافية للشي أعلاه. إذا كان منتجا صف المنتج، وإذا كانت خدمة صف شخصا يستخدم الخدمة، وإذا كان موقعا أو تطبيقا صف شاشة هاتف تعرض الموقع / التطبيق. بدون أي نص داخل الصورة. أعد وصف الصورة فقط.`;
}
async function generate(env, body){
  const picked = await pickKeyForRequest(env);
  const adText = await callWithRotation(env, picked, buildPrompt1(body), 1500);
  let imagePrompt = '';
  try{ imagePrompt = await callWithRotation(env, picked, buildPrompt2(body), 500); }
  catch(e){ imagePrompt = `Professional advertising photo for ${body.product}, bright natural light, high quality, 4K, attractive background.`; }
  return { adText: adText.trim(), imagePrompt: imagePrompt.trim() };
}
export default {
  async fetch(request, env, ctx){
    const url = new URL(request.url);
    const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };
    if(request.method === 'OPTIONS') return new Response(null, { headers: cors });
    const json = (obj, status=200) => Response.json(obj, { status, headers: cors });
    if(url.pathname === '/api/config' && request.method === 'GET'){
      return json({ googleClientId: env.GOOGLE_CLIENT_ID || '', monetagZoneId: env.MONETAG_ZONE_ID || '' });
    }
    if(url.pathname === '/api/auth/google' && request.method === 'POST'){
      try{
        const { credential } = await request.json();
        const payload = JSON.parse(atob(credential.split('.')[1]));
        const user = { email: payload.email, name: payload.name };
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const body = btoa(JSON.stringify({ ...user, exp: Date.now() + 7*24*3600*1000 }));
        const token = `${header}.${body}.sig`;
        return json({ token, user });
      }catch(e){ return json({ error: 'فشل التحقق من Google' }, 401); }
    }
    if(url.pathname === '/api/quota'){
      const user = verifyToken(request);
      if(!user) return json({ error: 'يرجى تسجيل الدخول أولاً للمتابعة.' }, 401);
      const today = new Date().toISOString().slice(0,10);
      const key = `count:${user.email}:${today}`;
      const count = parseInt(await env.TAJER_KV.get(key) || '0');
      return json({ count, remaining: 10 - count });
    }
    if(url.pathname === '/api/generate-trial' && request.method === 'POST'){
      const body = await request.json();
      const err = validateRequiredServer(body);
      if(err) return json({ error: err }, 400);
      try{ const out = await generate(env, body); return json({ ...out, trial: true }); }
      catch(e){ return json({ error: 'حدثت مشكلة في توليد الإعلان - يرجى المحاولة مرة أخرى' }, 500); }
    }
    if(url.pathname === '/api/generate' && request.method === 'POST'){
      const user = verifyToken(request);
      if(!user) return json({ error: 'يرجى تسجيل الدخول أولاً للمتابعة.' }, 401);
      const today = new Date().toISOString().slice(0,10);
      const key = `count:${user.email}:${today}`;
      let count = parseInt(await env.TAJER_KV.get(key) || '0');
      if(count >= 10) return json({ error: 'لقد استهلكت حصتك اليومية. يمكنك المحاولة غداً.' }, 429);
      const body = await request.json();
      const err = validateRequiredServer(body);
      if(err) return json({ error: err }, 400);
      try{
        const out = await generate(env, body);
        await env.TAJER_KV.put(key, String(count + 1), { expirationTtl: 86400 });
        return json(out);
      }catch(e){ return json({ error: 'حدثت مشكلة في توليد الإعلان - يرجى المحاولة مرة أخرى' }, 500); }
    }
    return new Response('Not Found', { status: 404 });
  }
};
