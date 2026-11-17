// Пријава са сајта → WhatsApp порука власнику (преко CallMeBot-а).
// Netlify → Site configuration → Environment variables:
//   WHATSAPP_PHONE   — број на који стижу пријаве, у формату +381…  (никад није на сајту)
//   CALLMEBOT_APIKEY — кључ који CallMeBot пошаље на WhatsApp
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});
const str = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST' }, 405);
  let b; try { b = await req.json(); } catch (e) { return json({ error: 'bad request' }, 400); }
  if (b.website) return json({ ok: true }); // замка за спам ботове
  const ime = str(b.ime, 80), telefon = str(b.telefon, 30), termin = str(b.termin, 160);
  if (ime.length < 2 || telefon.replace(/\D/g, '').length < 6) return json({ error: 'missing' }, 400);

  const phone = process.env.WHATSAPP_PHONE, key = process.env.CALLMEBOT_APIKEY;
  if (!phone || !key) return json({ error: 'not configured' }, 500);
  const text = 'Нова пријава — Култура едукација\nТермин: ' + termin + '\nИме: ' + ime + '\nТелефон: ' + telefon;
  const url = 'https://api.callmebot.com/whatsapp.php?phone=' + encodeURIComponent(phone) +
    '&text=' + encodeURIComponent(text) + '&apikey=' + encodeURIComponent(key);
  try {
    const r = await fetch(url);
    const body = await r.text();
    if (!r.ok || /apikey is invalid|error/i.test(body)) return json({ error: 'whatsapp' }, 502);
  } catch (e) { return json({ error: 'whatsapp' }, 502); }
  return json({ ok: true });
};

export const config = { path: '/api/prijava' };
