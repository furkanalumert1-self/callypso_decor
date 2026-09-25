# Callypso Decor

**Bir oda fotoğrafını yeni bir hayata dönüştür.** Callypso Decor, bir odanın
fotoğrafını farklı stillerde (İskandinav, Bohem, Japandi…) yeniden döşeyen ve
öncesi/sonrası karşılaştırması gösteren bir iç mekân tasarım uygulamasıdır.
Bir **CallypsoTech** ürünüdür. Arayüz Türkçe ve İngilizce (TR/EN) destekler.

*Turn a room photo into a whole new look — Callypso Decor restyles a room photo
in different styles and shows a before/after comparison. A CallypsoTech product.*

## Durum: demo

Bu sürüm bir **demo**dur:

- Oda görselleri AI ile üretilmez; hepsi satır içi **SVG** çizimlerdir.
- Projeler, istatistikler ve kullanıcı yorumları **örnek verilerdir**
  (`lib/demo/data.ts`, `app/(marketing)/page.tsx`).
- Gerçek **AI üretimi ve backend bağlı değildir**; panel verileri örnektir.
- **Giriş/kayıt:** `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  tanımlıysa e-posta/şifre ile gerçek Supabase doğrulaması yapılır (kayıtta
  e-posta onayı istenir). Tanımlı değilse ekranlar demo modunda herhangi bir
  e-posta/şifreyi kabul eder. "Demo ile devam et" her zaman demoya girer;
  panel sayfaları henüz oturum kontrolü yapmaz.

Pazarlama sayfasındaki rakamlar ve vaatler örnek metindir, doğrulanmış sonuç
değildir.

## Komutlar

```bash
npm install
npm run dev      # → http://localhost:3000 (demo modu, anahtar gerekmez)
npm run build    # üretim derlemesi
npm run start    # derlenmiş uygulamayı çalıştırır
npm run lint     # ESLint
```

## Sayfalar

`/` (tanıtım) · `/login`, `/signup` · `/dashboard` · `/projects` · `/styles` ·
`/gallery` · `/settings`

## Yapılandırma

Marka, metinler ve menü `app.config.ts` içindedir. `domain` ve `email` alanları
şimdilik boştur; doldurulana kadar arayüzde gösterilmez. Kurulum adımları için
[`SETUP.md`](./SETUP.md) ve [`START-HERE.md`](./START-HERE.md) dosyalarına bakın.

GoatStarter şablonu üzerine kuruludur — Next.js 16 · React 19 · Tailwind v4.
