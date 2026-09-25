"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight, ArrowRight, WandSparkles, Palette, ArrowLeftRight, Ruler,
  ShoppingBag, Users, Check, Plus, Minus, Sparkles, Camera, Sofa, Quote, X,
  Home, Building2, Compass, KeyRound, Upload, Layers, ListChecks,
  Lamp, Armchair, Flower2, Frame,
} from "lucide-react";
import appConfig from "@/app.config";
import { LogoMark } from "@/components/ui/logo";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { RoomScene, type RoomStyle } from "@/components/room-scene";
import { BeforeAfter } from "@/components/before-after";
import { useLang } from "@/components/i18n/language-provider";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const moduleIcons = [WandSparkles, Palette, ArrowLeftRight, Ruler, ShoppingBag, Users];

const brand = appConfig.name;

const content = {
  tr: {
    nav: ["Ne yapar", "Stiller", "Fiyatlar"], signin: "Giriş yap", demo: "Demoyu dene",
    badge: "Yapay zekâ iç mimar",
    h1a: "Odanın fotoğrafını çek.", h1b: "Yeni halini", h1c: "saniyede gör.",
    sub: `${brand}, telefonunla çektiğin bir oda fotoğrafını sessizce alır; İskandinav, Bohem ya da Japandi gibi stillerde yeniden döşer, tadilat sonrası halini öncesi/sonrası olarak gösterir. Mimar randevusu, mood board, tahmin yok — sadece yaşamak isteyeceğin bir oda.`,
    cta1: "Odanı dönüştür", cta2: "Nasıl göründüğüne bak", note: "· kart yok · 60 saniyelik demo",
    proofAvatars: `5.000+ kişi evini ${brand} ile yeniden tasarlıyor.`,
    marqueeTitle: `${brand} her mekânı tanır`,
    marquee: ["Oturma odası", "Yatak odası", "Mutfak", "Banyo", "Çalışma odası", "Çocuk odası", "Hol", "Balkon", "Yemek odası", "Stüdyo daire", "Teras", "Giriş"],
    problemKicker: "İkilem",
    problemH: ["Boş bir oda hayal kurdurmaz.", "İç mimar pahalı, tahmin riskli."],
    problemBody: `Boş ya da eski bir odaya bakıp 'acaba nasıl olurdu' diye düşünürsün. Pinterest'te kaybolursun, mobilyayı kafanda kuramazsın, mimar pahalı, satın alınca beğenmeme riski yüksek. ${brand} bütün bu belirsizliği saniyeler içinde gözünün önüne koyar.`,
    problemStats: [
      { n: "₺18.000", l: "tek oda için iç mimar danışmanlığı" },
      { n: "3 hafta", l: "mood board + revizyon bekleme süresi" },
      { n: "%64", l: "boş odayı kafasında kuramayan kişi" },
      { n: "9", l: "denemeden alınıp pişman olunan mobilya" },
    ],
    whatKicker: "Ne yapar",
    whatH: ["Bir iç mimarlık ekibinin işi,", "tek dokunuşta, sessizce."],
    stepsKicker: "Üç adım",
    stepsH: ["Fotoğraftan yeni odaya,", "üç adımda."],
    steps: [
      { t: "Fotoğrafı yükle", b: "Odanın bir fotoğrafını çek — boş ya da dolu, dağınık olsa bile. Telefon yeter.", icon: Camera },
      { t: "Stili seç", b: "İskandinav'dan Bohem'e 12+ stilden birini seç; istersen tadilat varyantları da ekle.", icon: Palette },
      { t: "Öncesi/sonrası al", b: "Saniyeler içinde gerçek odanın yanında, gözünün önünde duran inandırıcı bir yeni hâl.", icon: ArrowLeftRight },
    ],
    stylesKicker: "Stiller",
    stylesH: ["Bir his seç.", `Gerisini ${brand} halleder.`],
    stylesBody: "Her stil kendi paleti, dokusu ve mobilya diliyle gelir. Tek dokunuşla aynı odayı farklı dünyalarda gör.",
    stylesTry: "Bu stilde dene",
    proof: [
      { big: "8 sn", l: "fotoğraftan yeni stile", c: "Yükle, stili seç, öncesi/sonrası al" },
      { big: "12+", l: "hazır tasarım stili", c: "Her biri kendi paleti ve dokusuyla" },
      { big: "%0", l: "yapısal değişiklik", c: "Pencere, plan, perspektif korunur" },
    ],
    testimonialsKicker: "Sevenler",
    testimonialsH: "Odasını dönüştürenler.",
    testimonials: [
      { q: "Salonumuzun fotoğrafını çektim, beş dakika sonra eşimle hangi stili alacağımıza karar vermiştik. Tartışma bitti.", who: "Elif & Murat", role: "Cihangir · ev sahibi", metric: "5 dk'da karar" },
      { q: "İç mimarım. Müşteriye artık 'hayal edin' demiyorum, öncesi/sonrası galeriyi gönderiyorum. Onay süresi yarı yarıya düştü.", who: "Selin A.", role: "İç mimar · stüdyo", metric: "%50 hızlı onay" },
      { q: `Tadilattan önce mutfak tezgâhının iki rengini de gördüm. Yanlış mermeri almaktan ${brand} kurtardı.`, who: "Kerem T.", role: "Nişantaşı · yenileme", metric: "₺40.000 tasarruf" },
      { q: `Boş daireleri ${brand} ile döşeyip ilana koyuyorum. Aynı portföyle randevu sayım belirgin arttı.`, who: "Deniz Y.", role: "Emlak danışmanı", metric: "+38% randevu" },
      { q: `Kiracıyım, duvara dokunamıyorum. ${brand} toplanabilir mobilya fikirleriyle evimi bana ait yaptı.`, who: "Naz B.", role: "Kadıköy · kiracı", metric: "0 tadilat" },
      { q: "Müşterilerime 3 stili tek linkte gönderiyorum, onlar telefonda seçiyor. Toplantı sayım yarıya indi.", who: "Mert & Ece", role: "Tasarım stüdyosu", metric: "2× verim" },
    ],
    compareKicker: `Neden ${brand}`,
    compareH: ["Eski yol.", `${brand} yolu.`],
    compareOld: ["Aylarca süren mood board turları", "Binlerce liralık danışmanlık", "Kafanda kuramadığın mobilya", "Satın alınca beğenmeme riski", "Tek bir stil önerisi"],
    compareNew: ["Saniyeler içinde öncesi/sonrası", "Ayda bir kahve fiyatına", "Gözünün önünde gerçek oda", "Almadan önce gör, sonra karar ver", "12+ stil, sınırsız varyant"],
    promiseKicker: "Dürüst söz",
    promiseH: ["Odayı yeniden tasarlarız.", "Gerçeği saklamayız."],
    promiseBody: `${brand} mobilyayı, rengi ve ışığı değiştirir — ama duvarı kaldırmaz, pencereyi taşımaz, m²'yi büyütmez. Sonuç inandırıcı bir öneridir; bir tadilat planına dönüştürebileceğin gerçekçi bir başlangıç.`,
    promiseBullets: [
      "Yapısal değişiklik yok: pencere, oda planı ve perspektif korunur.",
      "Orijinal fotoğraf her zaman saklanır; öncesi/sonrası bir arada.",
      "Her görünüm bir öneridir — uygulanabilirliği ustanla teyit et.",
      "Ürettiğin her görsel senindir; filigransız indirebilirsin.",
    ],
    pricingKicker: "Fiyatlar",
    pricingH: ["Bir stüdyo.", "Dürüst fiyat."],
    plans: [
      { name: "Keşif", price: "₺0", cad: "başlangıç", body: "Kendi evinde birkaç oda denemek için.", bullets: ["Ayda 5 oda", "6 temel stil", "Öncesi/sonrası", "Filigranlı indirme"], cta: "Ücretsiz başla", featured: false },
      { name: "Ev", price: "₺249", cad: "/ay", body: "Tüm evini yeniden tasarlayanlar için.", bullets: ["Sınırsız oda", "12+ stil + varyant", "Tadilat keşfi", "Alışveriş listesi", "Filigransız HD"], cta: "30 gün ücretsiz dene", featured: true },
      { name: "Stüdyo", price: "₺899", cad: "/ay", body: "İç mimar ve ofisler için, müşterilerle.", bullets: ["Ev'deki her şey", "Müşteri galerileri", "Marka & logo", "Ekip koltukları"], cta: "Stüdyo kur", featured: false },
    ],
    faqKicker: "Merak edilenler",
    faqH: "Kısa cevaplar.",
    faq: [
      { q: "Denemek için API anahtarı gerekir mi?", a: `Hayır. ${brand} örnek projeler ve üretilmiş öncesi/sonrası görsellerle demo modda açılır — hemen tıklayabilirsin. Canlı üretim için fal.ai / Anthropic anahtarını /setup ile bağlarsın.` },
      { q: "Sonuçlar gerçekçi mi?", a: `Evet. ${brand} odanın yapısını (pencere, plan, perspektif) korur ve sadece yüzeyleri, mobilyayı ve ışığı yeniden tasarlar. Fotomontaj değil, inandırıcı bir öneri.` },
      { q: "Hangi odalar için çalışır?", a: "Oturma odası, yatak odası, mutfak, banyo, çalışma odası, çocuk odası ve dış mekânlar — boş ya da dolu fark etmez." },
      { q: "İç mimarlar kullanabilir mi?", a: "Evet. Stüdyo planı müşteri galerileri, marka ve ekip koltukları getirir; öncesi/sonrası sunumlarını tek linkle paylaşırsın." },
      { q: "Bir oda kaç saniyede dönüşüyor?", a: "Ortalama 8 saniye. Yüklersin, stili seçersin, öncesi/sonrası çift saniyeler içinde gözünün önünde olur." },
      { q: "Alışveriş listesi gerçekten satın alınabilir mi?", a: "Beğendiğin görsellerdeki parçalar — kanepe, halı, lamba — bütçene göre benzer ürünlerle listelenir. Listeyi tek tıkla paylaşır, dilediğin mağazadan alırsın." },
      { q: "Ürettiğim görseller bana mı ait?", a: "Evet. Ev ve Stüdyo planlarında her görseli filigransız, HD olarak indirebilirsin; ticari kullanım dahil senindir." },
      { q: "Emlakçılar sanal home-staging için kullanabilir mi?", a: "Kesinlikle. Boş bir daireyi döşenmiş haliyle gösterip ilan fotoğraflarına eklersin; ziyaretçiye 'burada yaşamak' hissini saniyeler içinde verirsin." },
    ],
    finaleKicker: "Dene · 60 saniye",
    finaleH: ["Bir sonraki odanı", "saniyede yeniden tasarla."],
    finaleBody: "Önceden doldurulmuş canlı bir stüdyo demosunu gez — her ekran tıklanabilir. Kart yok, kayıt yok.",
    footTagline: "Bir oda fotoğrafını yeni bir hayata dönüştüren yapay zekâ iç mimar.",
    product: "Ürün", company: "Şirket", about: "Hakkında", privacy: "Gizlilik",
    footCols: [
      { h: "Ürün", links: ["Ne yapar", "Stiller", "Tadilat keşfi", "Alışveriş listesi", "Fiyatlar"] },
      { h: "Kullanım", links: ["Ev sahipleri", "İç mimarlar", "Emlakçılar", "Kiracılar"] },
      { h: "Kaynaklar", links: ["Stil rehberi", "Yardım merkezi", "Blog", "API"] },
      { h: "Şirket", links: ["Hakkında", "Gizlilik", "Kullanım şartları", "İletişim"] },
    ],
    footRights: "Tüm hakları saklıdır.",

    /* ── Interactive inline demo ── */
    tryKicker: "Canlı · denemelik",
    tryH: ["Odanı şimdi dönüştür.", "Bir oda, bir stil seç."],
    tryBody: "Aşağıdan bir oda tipi ve bir tasarım stili seç; gerçek odanın öncesi/sonrası halini sürükleyip karşılaştır. Hepsi tarayıcında, kayıt gerekmeden.",
    tryRoomLabel: "Oda", tryStyleLabel: "Stil",
    tryRooms: [
      { id: "salon", name: "Salon" },
      { id: "yatak", name: "Yatak odası" },
      { id: "mutfak", name: "Mutfak" },
    ],
    tryDragHint: "Sürükle ya da dokun · öncesi ↔ sonrası",
    tryBefore: "Önce", tryAfter: "Sonra",
    tryShipBtn: "Bu görünümü kaydet",
    tryNote: "Demo modunda örnek oda; canlı üretim için /setup ile anahtarını bağla.",

    /* ── Personas / use-cases ── */
    personasKicker: "Kimler için",
    personasH: ["Bir oda fotoğrafı,", "dört farklı hayat."],
    personasBody: `${brand}; ev sahibinden emlakçıya, iç mimardan kiracıya kadar herkesin aynı sıkıntısını çözer: 'burası nasıl olurdu?'`,
    personas: [
      { icon: Home, t: "Ev sahibi", b: "Taşınmadan ya da tadilattan önce evinin yeni halini gör; eşinle aynı sayfada buluş, yanlış mobilyaya para harcama." },
      { icon: Building2, t: "Emlakçı", b: "Boş ya da eski bir daireyi döşenmiş haliyle göster; ilan fotoğraflarına 'sanal home-staging' ekle, daha hızlı sat." },
      { icon: Compass, t: "İç mimar", b: "Müşteriye 'hayal edin' deme; saniyeler içinde öncesi/sonrası galeri çıkar, onay sürecini yarıya indir." },
      { icon: KeyRound, t: "Kiracı", b: "Duvarı yıkmadan kirayı dönüştür; toplanabilir mobilya ve renk fikirleriyle geçici evini sana ait yap." },
    ],

    /* ── Workflow deep-dive ── */
    flowKicker: "Akış",
    flowH: ["Fotoğraftan alışveriş", "listesine kadar."],
    flowBody: `${brand} tek bir görseli bitmiş bir tasarım sürecine çevirir: oda seç, stil uygula, varyantları gez, beğendiğini alışveriş listesine dök.`,
    flowSteps: [
      { icon: Upload, t: "Oda seç & yükle", b: "Telefonunla çektiğin fotoğrafı sürükle; boş, dolu ya da dağınık fark etmez." },
      { icon: Palette, t: "Stil uygula", b: `12+ stilden birini seç; ${brand} yapıyı koruyup yüzeyleri, mobilyayı ve ışığı yeniden döşer.` },
      { icon: Layers, t: "Varyantları gez", b: "Aynı odanın farklı palet ve zemin varyantlarını yan yana karşılaştır." },
      { icon: ListChecks, t: "Alışveriş listesi", b: "Beğendiğin görseldeki parçalar bütçene göre benzer ürünlerle listeye düşer." },
    ],
    shopKicker: "Görünümü satın al",
    shopH: "Beğendiğin odadaki her parça, tek listede.",
    shopItems: [
      { icon: Armchair, name: "Keten kanepe", price: "₺18.900", tag: "3'lü · bej" },
      { icon: Flower2, name: "Dokuma kilim", price: "₺3.250", tag: "160×230 · toprak" },
      { icon: Lamp, name: "Pirinç lambader", price: "₺2.480", tag: "ayaklı · sıcak ışık" },
      { icon: Frame, name: "Çerçeve seti", price: "₺890", tag: "3 parça · meşe" },
      { icon: Sofa, name: "Bouclé puf", price: "₺1.640", tag: "yuvarlak · krem" },
    ],
    shopTotal: "Tahmini sepet", shopTotalNote: "5 parça · benzerleriyle değiştirilebilir",

    /* ── Styles gallery ── */
    galleryKicker: "Stil galerisi",
    galleryH: ["Aynı oda,", "altı farklı dünya."],
    galleryBody: "Her döşeme kendi paleti, dokusu ve mobilya diliyle gelir. Hangisinde yaşamak istediğini gör.",
    galleryTags: {
      iskandinav: "Açık ahşap · sade · ferah",
      bohem: "Toprak · rattan · katmanlı",
      modern: "Greige · mat · geometrik",
      japandi: "Yulaf · siyah · dingin",
      akdeniz: "Badana · okra · güneşli",
      endustriyel: "Beton · tuğla · pirinç",
    } as Record<string, string>,

    /* ── Comparison table ── */
    tableKicker: "Karşılaştır",
    tableH: ["İç mimar, Pinterest", `ve ${brand}.`],
    tableCols: ["", "İç mimar", "Pinterest", brand],
    tableRows: [
      { f: "Kendi odanı görürsün", a: false, b: false, c: true },
      { f: "Öncesi / sonrası", a: true, b: false, c: true },
      { f: "Saniyeler içinde sonuç", a: false, b: true, c: true },
      { f: "12+ stil & sınırsız varyant", a: false, b: true, c: true },
      { f: "Alışveriş listesi", a: true, b: false, c: true },
      { f: "Aylık kahve fiyatına", a: false, b: true, c: true },
      { f: "Yapıyı korur (gerçekçi)", a: true, b: false, c: true },
      { f: "Müşteriyle paylaşılır galeri", a: true, b: false, c: true },
    ],
    tableYes: "Var", tableNo: "Yok",
  },
  en: {
    nav: ["What it does", "Styles", "Pricing"], signin: "Sign in", demo: "Try the demo",
    badge: "AI interior designer",
    h1a: "Snap a photo of your room.", h1b: "See its new life", h1c: "in seconds.",
    sub: `${brand} quietly takes the photo you shot on your phone — restyles the space in Scandinavian, Bohemian or Japandi, and shows the renovated look as a before/after. No designer appointment, no mood board, no guessing — just a room you'd want to live in.`,
    cta1: "Restyle your room", cta2: "See what it looks like", note: "· no card · 60-second demo",
    proofAvatars: `5,000+ people are redesigning their home with ${brand}.`,
    marqueeTitle: `${brand} knows every kind of space`,
    marquee: ["Living room", "Bedroom", "Kitchen", "Bathroom", "Home office", "Kids' room", "Hallway", "Balcony", "Dining room", "Studio flat", "Terrace", "Entryway"],
    problemKicker: "The dilemma",
    problemH: ["An empty room won't dream for you.", "Designers cost a lot, guessing is risky."],
    problemBody: `You look at an empty or tired room and wonder 'what would it even look like'. You get lost on Pinterest, can't picture the furniture, a designer is expensive, and buying blind risks regret. ${brand} puts the whole uncertainty in front of your eyes in seconds.`,
    problemStats: [
      { n: "$1,200", l: "interior design consult, per room" },
      { n: "3 weeks", l: "mood board + revision turnaround" },
      { n: "64%", l: "of people can't picture an empty room" },
      { n: "9", l: "pieces bought blind and regretted" },
    ],
    whatKicker: "What it does",
    whatH: ["A whole design team's work,", "in one tap, quietly."],
    stepsKicker: "Three steps",
    stepsH: ["From photo to new room,", "in three steps."],
    steps: [
      { t: "Upload a photo", b: "Snap a photo of the room — empty or lived-in, messy is fine. Your phone is enough.", icon: Camera },
      { t: "Pick a style", b: "Choose one of 12+ styles from Scandinavian to Bohemian; add renovation variants if you like.", icon: Palette },
      { t: "Get before/after", b: "In seconds, a believable new look sitting right beside your real room, in front of your eyes.", icon: ArrowLeftRight },
    ],
    stylesKicker: "Styles",
    stylesH: ["Pick a feeling.", `${brand} handles the rest.`],
    stylesBody: "Each style comes with its own palette, texture and furniture language. See the same room in different worlds with one tap.",
    stylesTry: "Try this style",
    proof: [
      { big: "8 s", l: "from photo to new look", c: "Upload, pick a style, get before/after" },
      { big: "12+", l: "ready design styles", c: "Each with its own palette and texture" },
      { big: "0%", l: "structural change", c: "Windows, layout, perspective preserved" },
    ],
    testimonialsKicker: "Loved by",
    testimonialsH: "People who restyled their room.",
    testimonials: [
      { q: "I snapped a photo of our living room and five minutes later my husband and I had agreed on the style. The argument was over.", who: "Elif & Murat", role: "Cihangir · homeowner", metric: "decided in 5 min" },
      { q: "I'm an interior designer. I no longer tell clients to 'imagine it' — I send the before/after gallery. Approval time halved.", who: "Selin A.", role: "Interior designer · studio", metric: "50% faster approvals" },
      { q: `Before renovating I saw both counter colors for the kitchen. ${brand} saved me from buying the wrong marble.`, who: "Kerem T.", role: "Nişantaşı · renovation", metric: "$1,400 saved" },
      { q: `I stage empty flats with ${brand} and put them straight into listings. Viewings on the same portfolio went way up.`, who: "Deniz Y.", role: "Real-estate advisor", metric: "+38% viewings" },
      { q: `I'm a renter, I can't touch the walls. ${brand} made the place mine with movable furniture ideas.`, who: "Naz B.", role: "Kadıköy · renter", metric: "0 renovation" },
      { q: "I send clients 3 styles in one link and they pick on the phone. My number of meetings halved.", who: "Mert & Ece", role: "Design studio", metric: "2× throughput" },
    ],
    compareKicker: `Why ${brand}`,
    compareH: ["The old way.", `The ${brand} way.`],
    compareOld: ["Months of mood board rounds", "Thousands in consulting fees", "Furniture you can't picture", "Risk of regret after buying", "A single style suggestion"],
    compareNew: ["A before/after in seconds", "For the price of a coffee a month", "The real room before your eyes", "See it before you buy, then decide", "12+ styles, unlimited variants"],
    promiseKicker: "The honest promise",
    promiseH: ["We restyle the room.", "We never hide the truth."],
    promiseBody: `${brand} changes the furniture, color and light — but it won't remove walls, move windows, or grow the square meters. The result is a believable proposal; a realistic starting point you can turn into a renovation plan.`,
    promiseBullets: [
      "No structural changes: windows, layout and perspective are preserved.",
      "The original photo is always kept; before/after side by side.",
      "Every look is a proposal — confirm feasibility with your contractor.",
      "Everything you generate is yours; download it without a watermark.",
    ],
    pricingKicker: "Pricing",
    pricingH: ["One studio.", "Honest pricing."],
    plans: [
      { name: "Discover", price: "$0", cad: "to start", body: "To try a few rooms in your own home.", bullets: ["5 rooms / mo", "6 core styles", "Before/after", "Watermarked export"], cta: "Start free", featured: false },
      { name: "Home", price: "$9", cad: "/ mo", body: "For redesigning your whole home.", bullets: ["Unlimited rooms", "12+ styles + variants", "Renovation explorer", "Shoppable looks", "HD, no watermark"], cta: "Try free for 30 days", featured: true },
      { name: "Studio", price: "$39", cad: "/ mo", body: "For designers & studios, with clients.", bullets: ["Everything in Home", "Client galleries", "Brand & logo", "Team seats"], cta: "Set up a studio", featured: false },
    ],
    faqKicker: "Good to know",
    faqH: "The short answers.",
    faq: [
      { q: "Do I need API keys to try it?", a: `No. ${brand} boots in demo mode with sample projects and generated before/after visuals — click around immediately. Wire your fal.ai / Anthropic key via /setup for live generation.` },
      { q: "Are the results realistic?", a: `Yes. ${brand} preserves the room's structure (windows, layout, perspective) and restyles only the surfaces, furniture and light. A believable proposal, not a fake render.` },
      { q: "Which rooms does it work on?", a: "Living room, bedroom, kitchen, bathroom, home office, kids' room and outdoor spaces — empty or furnished, either way." },
      { q: "Can interior designers use it?", a: "Yes. The Studio plan adds client galleries, brand and team seats; you share before/after presentations with a single link." },
      { q: "How fast is a restyle?", a: "About 8 seconds on average. You upload, pick a style, and the before/after pair is in front of your eyes in seconds." },
      { q: "Is the shopping list actually shoppable?", a: "The pieces in looks you love — sofa, rug, lamp — are listed as similar products matched to your budget. Share the list in one click and buy from any store." },
      { q: "Do I own the visuals I generate?", a: "Yes. On Home and Studio plans you download every visual watermark-free in HD; they're yours, commercial use included." },
      { q: "Can realtors use it for virtual staging?", a: "Absolutely. Show an empty flat fully furnished and add it to your listing photos — give viewers the feeling of living there in seconds." },
    ],
    finaleKicker: "Try it · 60 seconds",
    finaleH: ["Redesign your next room", "in seconds."],
    finaleBody: "Take a live studio demo for a spin — pre-loaded, every screen interactive. No card, no signup.",
    footTagline: "The AI interior designer that turns a room photo into a whole new life.",
    product: "Product", company: "Company", about: "About", privacy: "Privacy",
    footCols: [
      { h: "Product", links: ["What it does", "Styles", "Renovation explorer", "Shopping list", "Pricing"] },
      { h: "Use cases", links: ["Homeowners", "Interior designers", "Realtors", "Renters"] },
      { h: "Resources", links: ["Style guide", "Help center", "Blog", "API"] },
      { h: "Company", links: ["About", "Privacy", "Terms of use", "Contact"] },
    ],
    footRights: "All rights reserved.",

    /* ── Interactive inline demo ── */
    tryKicker: "Live · playable",
    tryH: ["Restyle your room now.", "Pick a room, pick a style."],
    tryBody: "Choose a room type and a design style below; drag to compare the real room's before/after. All in your browser, no signup needed.",
    tryRoomLabel: "Room", tryStyleLabel: "Style",
    tryRooms: [
      { id: "salon", name: "Living room" },
      { id: "yatak", name: "Bedroom" },
      { id: "mutfak", name: "Kitchen" },
    ],
    tryDragHint: "Drag or tap · before ↔ after",
    tryBefore: "Before", tryAfter: "After",
    tryShipBtn: "Save this look",
    tryNote: "Sample room in demo mode; wire your key via /setup for live generation.",

    /* ── Personas / use-cases ── */
    personasKicker: "Who it's for",
    personasH: ["One room photo,", "four different lives."],
    personasBody: `${brand} solves the same itch for everyone — from homeowner to realtor, designer to renter: 'what would this even look like?'`,
    personas: [
      { icon: Home, t: "Homeowner", b: "See your home's new look before you move or renovate; get on the same page with your partner, never waste money on the wrong furniture." },
      { icon: Building2, t: "Realtor", b: "Show an empty or tired flat fully furnished; add virtual home-staging to your listing photos and sell faster." },
      { icon: Compass, t: "Interior designer", b: "Stop telling clients to 'imagine it'; produce a before/after gallery in seconds and halve your approval cycle." },
      { icon: KeyRound, t: "Renter", b: "Restyle a rental without touching a wall; make a temporary place yours with movable furniture and color ideas." },
    ],

    /* ── Workflow deep-dive ── */
    flowKicker: "The flow",
    flowH: ["From photo to", "shopping list."],
    flowBody: `${brand} turns a single photo into a finished design process: pick a room, apply a style, browse variants, drop what you love into a shopping list.`,
    flowSteps: [
      { icon: Upload, t: "Pick & upload a room", b: "Drag in the photo you shot on your phone; empty, lived-in or messy — it's fine." },
      { icon: Palette, t: "Apply a style", b: `Choose from 12+ styles; ${brand} keeps the structure and re-dresses surfaces, furniture and light.` },
      { icon: Layers, t: "Browse variants", b: "Compare different palette and flooring variants of the same room, side by side." },
      { icon: ListChecks, t: "Shopping list", b: "The pieces in the look you love drop into a list, matched to your budget with similar products." },
    ],
    shopKicker: "Shop the look",
    shopH: "Every piece in the room you love, in one list.",
    shopItems: [
      { icon: Armchair, name: "Linen sofa", price: "$540", tag: "3-seat · beige" },
      { icon: Flower2, name: "Woven rug", price: "$95", tag: "160×230 · earth" },
      { icon: Lamp, name: "Brass floor lamp", price: "$70", tag: "standing · warm" },
      { icon: Frame, name: "Frame set", price: "$25", tag: "3 piece · oak" },
      { icon: Sofa, name: "Bouclé pouf", price: "$48", tag: "round · cream" },
    ],
    shopTotal: "Estimated basket", shopTotalNote: "5 pieces · swappable with alternatives",

    /* ── Styles gallery ── */
    galleryKicker: "Style gallery",
    galleryH: ["The same room,", "six different worlds."],
    galleryBody: "Each restyle comes with its own palette, texture and furniture language. See which one you'd actually live in.",
    galleryTags: {
      iskandinav: "Light wood · simple · airy",
      bohem: "Earth · rattan · layered",
      modern: "Greige · matte · geometric",
      japandi: "Oat · black · serene",
      akdeniz: "Whitewash · ochre · sunny",
      endustriyel: "Concrete · brick · brass",
    } as Record<string, string>,

    /* ── Comparison table ── */
    tableKicker: "Compare",
    tableH: ["Interior designer, Pinterest", `and ${brand}.`],
    tableCols: ["", "Designer", "Pinterest", brand],
    tableRows: [
      { f: "See your own room", a: false, b: false, c: true },
      { f: "Before / after", a: true, b: false, c: true },
      { f: "Results in seconds", a: false, b: true, c: true },
      { f: "12+ styles & unlimited variants", a: false, b: true, c: true },
      { f: "Shopping list", a: true, b: false, c: true },
      { f: "For the price of a coffee a month", a: false, b: true, c: true },
      { f: "Keeps the structure (realistic)", a: true, b: false, c: true },
      { f: "Client-shareable gallery", a: true, b: false, c: true },
    ],
    tableYes: "Yes", tableNo: "No",
  },
};

/* ── Hero illustration: a fanned stack of room cards mid-restyle ─────────── */
function RoomStack({ lang }: { lang: "tr" | "en" }) {
  const t = {
    tr: { before: "Önce", after: "Sonra", styling: "Tasarlanıyor", styled: "Hazır", style1: "İskandinav", style2: "Bohem", room1: "Oturma odası", room2: "Yatak odası" },
    en: { before: "Before", after: "After", styling: "Styling", styled: "Ready", style1: "Scandinavian", style2: "Bohemian", room1: "Living room", room2: "Bedroom" },
  }[lang];
  return (
    <div className="relative h-[460px] sm:h-[520px]">
      {/* back card — empty room */}
      <div className="absolute right-0 top-6 w-[260px] rotate-6 overflow-hidden rounded-2xl bg-card shadow-pop ring-1 ring-border floaty" style={{ animationDelay: "1.2s" }}>
        <RoomScene style="japandi" furnished={false} className="aspect-video w-full" />
        <div className="flex items-center justify-between p-3">
          <p className="text-xs font-medium">{t.room2}</p>
          <span className="rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-medium text-warning-foreground">{t.styling}</span>
        </div>
      </div>
      {/* mid card — interactive before/after */}
      <div className="absolute left-0 top-28 w-[252px] -rotate-3 overflow-hidden rounded-2xl bg-card shadow-pop ring-1 ring-border floaty">
        <BeforeAfter style="bohem" aspect="aspect-video" labels={{ before: t.before, after: t.after }} />
        <div className="p-3">
          <p className="text-xs font-medium">{t.room1}</p>
          <p className="text-[10px] text-muted-foreground">Cihangir · {t.style2}</p>
        </div>
      </div>
      {/* front card — styled result */}
      <div className="absolute bottom-0 right-4 w-[280px] rotate-2 overflow-hidden rounded-2xl bg-card shadow-pop ring-1 ring-border floaty" style={{ animationDelay: "0.6s" }}>
        <div className="relative">
          <RoomScene style="iskandinav" className="aspect-video w-full" />
          <span className="absolute bottom-2 right-2 rounded-full bg-success/90 px-2 py-0.5 text-[10px] font-medium text-success-foreground">{t.styled}</span>
        </div>
        <div className="space-y-2 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">{t.room1}</p>
            <p className="font-display text-xs font-semibold text-primary">{t.style1}</p>
          </div>
          <div className="flex gap-1">
            {["#efe9df", "#d8c3a5", "#a9b6a0", "#8a8d86", "#3c3a36"].map((h) => (
              <span key={h} className="h-3 flex-1 rounded-full" style={{ background: h }} />
            ))}
          </div>
        </div>
      </div>
      {/* float chip */}
      <div className="absolute -left-2 top-2 hidden rounded-xl border border-border bg-card px-3 py-2 shadow-pop sm:block floaty" style={{ animationDelay: "0.3s" }}>
        <p className="flex items-center gap-1.5 text-xs font-medium"><span className="grid h-4 w-4 place-items-center rounded-full bg-primary text-primary-foreground"><Sofa className="h-2.5 w-2.5" /></span> {t.styled}</p>
      </div>
    </div>
  );
}

/** Footer links that point at sections of this page; the rest are full-version pages. */
const footAnchors: Record<string, string> = { "0-0": "#what", "0-1": "#styles", "0-4": "#pricing" };

export default function OdaLanding() {
  const { lang, ui } = useLang();
  const c = content[lang];
  const [open, setOpen] = useState<number | null>(0);
  const [activeStyle, setActiveStyle] = useState<RoomStyle>("bohem");

  /* Interactive inline demo state */
  const [demoRoom, setDemoRoom] = useState("salon");
  const [demoStyle, setDemoStyle] = useState<RoomStyle>("iskandinav");
  const [reveal, setReveal] = useState(55); // 0 = all before, 100 = all after

  const styleTabs: { id: RoomStyle; name: { tr: string; en: string }; palette: string[] }[] = [
    { id: "iskandinav", name: { tr: "İskandinav", en: "Scandinavian" }, palette: ["#efe9df", "#d8c3a5", "#a9b6a0", "#3c3a36"] },
    { id: "bohem", name: { tr: "Bohem", en: "Bohemian" }, palette: ["#f3e2d0", "#dca06a", "#c1582f", "#5a3922"] },
    { id: "japandi", name: { tr: "Japandi", en: "Japandi" }, palette: ["#ece6da", "#c9bba4", "#8d9a86", "#2b2824"] },
    { id: "modern", name: { tr: "Modern", en: "Modern" }, palette: ["#f1ede8", "#cfc6ba", "#9a8f80", "#c2754a"] },
    { id: "akdeniz", name: { tr: "Akdeniz", en: "Mediterranean" }, palette: ["#faf4e8", "#e8c98a", "#7e8f5b", "#3f5b8a"] },
    { id: "endustriyel", name: { tr: "Endüstriyel", en: "Industrial" }, palette: ["#cdbfae", "#6c6359", "#3a342e", "#caa15a"] },
  ];
  const showcase: RoomStyle[] = ["iskandinav", "bohem", "modern", "japandi", "akdeniz", "endustriyel"];

  return (
    <div className="min-h-dvh">
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-5 lg:px-8">
          <Link href="/" aria-label={brand} className="inline-flex shrink-0 items-center gap-2.5"><LogoMark className="h-8 w-8 shrink-0" /><span className="max-w-[5.5rem] font-display text-[15px] font-semibold leading-[1.05] tracking-tight max-[359px]:hidden sm:max-w-none sm:text-lg sm:leading-normal">{brand}</span></Link>
          <nav className="ml-auto hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#what" className="hover:text-foreground transition-colors">{c.nav[0]}</a>
            <a href="#styles" className="hover:text-foreground transition-colors">{c.nav[1]}</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">{c.nav[2]}</a>
          </nav>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2 md:ml-7">
            <LanguageToggle className="mr-1" />
            <Link href="/login" className="hidden px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground sm:inline-flex">{c.signin}</Link>
            <Link href="/signup" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-foreground px-3.5 py-2 text-[13px] font-medium text-background transition hover:opacity-90 sm:px-4">{c.demo} <ArrowUpRight className="hidden h-3.5 w-3.5 sm:block" /></Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10" style={{ background: "var(--grad-hero)", opacity: 0.6 }} />
        <span className="blob -left-24 -top-20 -z-10 h-96 w-96 bg-primary/25 drift" aria-hidden />
        <span className="blob right-1/4 top-32 -z-10 h-72 w-72 drift" aria-hidden style={{ background: "color-mix(in oklch, var(--color-serif) 26%, transparent)", animationDelay: "2s" }} />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.1fr_1fr] lg:px-8 lg:py-24">
          <div>
            <p className="rise label-mono inline-flex items-center gap-2 text-primary"><span className="h-px w-7 bg-primary" /> {c.badge}</p>
            <h1 className="rise mt-6 font-display text-[clamp(40px,6.5vw,76px)] font-semibold leading-[0.96] tracking-tight" style={{ animationDelay: "0.08s" }}>
              {c.h1a}<br />
              <span className="hl-primary">{c.h1b}</span> <span className="display-accent font-normal">{c.h1c}</span>
            </h1>
            <p className="rise mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground" style={{ animationDelay: "0.18s" }}>{c.sub}</p>
            <div className="rise mt-8 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "0.28s" }}>
              <Link href="/signup" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-[15px] font-medium text-primary-foreground shadow-sm shadow-primary/25 transition hover:opacity-90">{c.cta1} <ArrowRight className="h-4 w-4" /></Link>
              <a href="#what" className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-medium text-foreground ring-1 ring-border transition hover:bg-muted">{c.cta2}</a>
              <span className="hidden self-center label-mono text-muted-foreground sm:inline">{c.note}</span>
            </div>
            <div className="rise mt-9 flex items-center gap-3 text-sm text-muted-foreground" style={{ animationDelay: "0.38s" }}>
              <div className="flex -space-x-2">
                {["EM", "SA", "KT", "DZ", "NB"].map((i, k) => (
                  <span key={i} className="grid h-7 w-7 place-items-center rounded-full text-[10px] font-semibold text-foreground/70 ring-2 ring-background" style={{ background: `oklch(${84 - k * 4}% 0.06 ${40 + k * 22})` }}>{i}</span>
                ))}
              </div>
              <span>{c.proofAvatars}</span>
            </div>
          </div>
          <div className="rise" style={{ animationDelay: "0.3s" }}><RoomStack lang={lang} /></div>
        </div>
      </section>

      {/* ── Marquee ─────────────────────────────────────────────────── */}
      <section className="overflow-hidden border-y border-border py-7">
        <p className="label-mono mb-4 text-center text-muted-foreground">{c.marqueeTitle}</p>
        <div className="marquee gap-10">
          {[...c.marquee, ...c.marquee].map((it, i) => (
            <span key={i} className="display-accent whitespace-nowrap px-2 text-2xl text-muted-foreground/70">{it}<span className="ml-10 text-primary">·</span></span>
          ))}
        </div>
      </section>

      {/* ── Interactive inline demo ─────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        <span className="blob right-0 top-20 -z-10 h-80 w-80 bg-primary/15 drift" aria-hidden />
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="label-mono inline-flex items-center justify-center gap-2 text-primary"><span className="h-1.5 w-1.5 rounded-full bg-primary pulse-dot" /> {c.tryKicker}</p>
            <h2 className="mt-4 font-display text-[clamp(28px,4.5vw,48px)] font-semibold leading-[1.04] tracking-tight">{c.tryH[0]} <span className="display-accent font-normal">{c.tryH[1]}</span></h2>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted-foreground">{c.tryBody}</p>
          </div>

          <div className="grid items-center gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            {/* controls */}
            <div className="space-y-6">
              <div>
                <p className="label-mono mb-3 text-muted-foreground">{c.tryRoomLabel}</p>
                <div className="flex flex-wrap gap-2.5">
                  {c.tryRooms.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setDemoRoom(r.id)}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium ring-1 transition",
                        demoRoom === r.id ? "bg-foreground text-background ring-foreground" : "ring-border text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="label-mono mb-3 text-muted-foreground">{c.tryStyleLabel}</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {styleTabs.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setDemoStyle(s.id)}
                      className={cn(
                        "flex flex-col items-start gap-2 rounded-2xl p-3 text-left ring-1 transition",
                        demoStyle === s.id ? "bg-card shadow-soft ring-border" : "ring-transparent hover:bg-card/60",
                      )}
                    >
                      <span className="flex gap-1">
                        {s.palette.slice(0, 3).map((h) => <span key={h} className="h-3.5 w-3.5 rounded-full ring-1 ring-black/5" style={{ background: h }} />)}
                      </span>
                      <span className={cn("text-[12.5px] font-medium leading-tight", demoStyle === s.id ? "text-foreground" : "text-muted-foreground")}>{s.name[lang]}</span>
                    </button>
                  ))}
                </div>
              </div>
              <Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90">
                {c.tryShipBtn} <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="label-mono text-muted-foreground">{c.tryNote}</p>
            </div>

            {/* drag-reveal preview */}
            <div>
              <div className="relative overflow-hidden rounded-[1.75rem] bg-card shadow-pop ring-1 ring-border">
                {/* after (base) — defines the box size */}
                <RoomScene style={demoStyle} furnished className="aspect-[16/10] w-full" />
                {/* before (clipped overlay) — inner scene spans the full box, clip reveals the left */}
                <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - reveal}% 0 0)` }}>
                  <RoomScene style={demoStyle} furnished={false} className="absolute inset-0 h-full w-full" />
                </div>
                {/* labels */}
                <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">{c.tryBefore}</span>
                <span className="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">{c.tryAfter}</span>
                {/* divider handle */}
                <div className="pointer-events-none absolute inset-y-0" style={{ left: `${reveal}%` }}>
                  <div className="absolute inset-y-0 -ml-px w-0.5 bg-white/90 shadow-[0_0_10px_rgba(0,0,0,0.25)]" />
                  <div className="absolute top-1/2 -ml-4 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white text-foreground shadow-pop ring-1 ring-black/5">
                    <ArrowLeftRight className="h-4 w-4 text-primary" />
                  </div>
                </div>
                {/* range slider on top */}
                <input
                  type="range" min={0} max={100} value={reveal}
                  onChange={(e) => setReveal(Number(e.target.value))}
                  aria-label={c.tryDragHint}
                  className="absolute inset-x-0 bottom-0 h-full w-full cursor-ew-resize opacity-0"
                />
              </div>
              <p className="mt-3 text-center label-mono text-muted-foreground">
                <ArrowLeftRight className="mr-1 inline h-3 w-3" /> {c.tryDragHint}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Problem ─────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-[1fr_1.05fr] lg:px-8">
          <div>
            <p className="label-mono inline-flex items-center gap-2 text-primary"><span className="h-px w-7 bg-primary" /> {c.problemKicker}</p>
            <h2 className="mt-4 font-display text-[clamp(30px,4.5vw,52px)] font-semibold leading-[1.02] tracking-tight">{c.problemH[0]} <span className="display-accent font-normal">{c.problemH[1]}</span></h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">{c.problemBody}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:gap-4">
            {c.problemStats.map((s, i) => (
              <div key={s.l} className="rounded-3xl bg-card p-6 shadow-soft ring-1 ring-border" style={{ transform: `rotate(${i % 2 ? 1.2 : -1.2}deg)` }}>
                <p className="font-display text-[34px] font-semibold leading-none tabular-nums text-primary">{s.n}</p>
                <p className="mt-2 text-[13px] text-muted-foreground">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Modules ─────────────────────────────────────────────────── */}
      <section id="what" className="border-t border-border bg-muted/40 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="max-w-2xl">
            <p className="label-mono inline-flex items-center gap-2 text-primary"><span className="h-px w-7 bg-primary" /> {c.whatKicker}</p>
            <h2 className="mt-4 font-display text-[clamp(30px,4.5vw,52px)] font-semibold leading-[1.02] tracking-tight">{c.whatH[0]} <span className="display-accent font-normal">{c.whatH[1]}</span></h2>
          </div>
          <div className="mt-12 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {appFeatures(lang).map((mod, i) => {
              const Icon = moduleIcons[i];
              return (
                <article key={mod.t} className="group rounded-3xl bg-card p-7 shadow-soft ring-1 ring-border transition-all hover:-translate-y-1 hover:shadow-pop">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary transition group-hover:scale-110"><Icon className="h-5 w-5" /></span>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight">{mod.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{mod.b}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Personas / use-cases ────────────────────────────────────── */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="label-mono inline-flex items-center justify-center gap-2 text-primary"><span className="h-px w-7 bg-primary" /> {c.personasKicker}</p>
            <h2 className="mt-4 font-display text-[clamp(28px,4.5vw,48px)] font-semibold leading-[1.04] tracking-tight">{c.personasH[0]} <span className="display-accent font-normal">{c.personasH[1]}</span></h2>
            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">{c.personasBody}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {c.personas.map((p, i) => {
              const Icon = p.icon;
              return (
                <article key={p.t} className="group relative overflow-hidden rounded-3xl bg-card p-7 shadow-soft ring-1 ring-border transition-all hover:-translate-y-1 hover:shadow-pop">
                  <span className="font-display text-5xl font-semibold leading-none text-primary/12">{`0${i + 1}`}</span>
                  <span className="absolute right-6 top-6 grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary transition group-hover:scale-110"><Icon className="h-5 w-5" /></span>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight">{p.t}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{p.b}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Steps ───────────────────────────────────────────────────── */}
      <section className="border-t border-border py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="mx-auto mb-14 max-w-xl text-center">
            <p className="label-mono inline-flex items-center justify-center gap-2 text-primary"><span className="h-px w-7 bg-primary" /> {c.stepsKicker}</p>
            <h2 className="mt-4 font-display text-[clamp(28px,4.5vw,48px)] font-semibold leading-[1.04] tracking-tight">{c.stepsH[0]} <span className="display-accent font-normal">{c.stepsH[1]}</span></h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {c.steps.map((st, i) => {
              const Icon = st.icon;
              return (
                <div key={st.t} className="relative rounded-3xl bg-card p-7 shadow-soft ring-1 ring-border">
                  <span className="font-display text-5xl font-semibold leading-none text-primary/15">{`0${i + 1}`}</span>
                  <span className="absolute right-7 top-7 grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight">{st.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{st.b}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Styles showcase (interactive) ───────────────────────────── */}
      <section id="styles" className="border-y border-border bg-muted/40 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="label-mono inline-flex items-center justify-center gap-2 text-primary"><span className="h-px w-7 bg-primary" /> {c.stylesKicker}</p>
            <h2 className="mt-4 font-display text-[clamp(28px,4.5vw,48px)] font-semibold leading-[1.04] tracking-tight">{c.stylesH[0]} <span className="display-accent font-normal">{c.stylesH[1]}</span></h2>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted-foreground">{c.stylesBody}</p>
          </div>
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.2fr]">
            {/* tabs */}
            <div className="flex flex-wrap gap-2.5 lg:flex-col">
              {styleTabs.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveStyle(s.id)}
                  className={cn(
                    "group flex flex-1 items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium ring-1 transition lg:flex-none",
                    activeStyle === s.id ? "bg-card shadow-soft ring-border" : "ring-transparent hover:bg-card/60",
                  )}
                >
                  <span className="flex gap-1">
                    {s.palette.map((h) => <span key={h} className="h-4 w-4 rounded-full ring-1 ring-black/5" style={{ background: h }} />)}
                  </span>
                  <span className={cn("flex-1", activeStyle === s.id ? "text-foreground" : "text-muted-foreground")}>{s.name[lang]}</span>
                  {activeStyle === s.id && <ArrowRight className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
            {/* preview */}
            <div className="overflow-hidden rounded-3xl bg-card shadow-pop ring-1 ring-border">
              <BeforeAfter style={activeStyle} aspect="aspect-[16/10]" labels={{ before: lang === "tr" ? "Önce" : "Before", after: lang === "tr" ? "Sonra" : "After" }} />
              <div className="flex items-center justify-between p-4">
                <p className="font-display text-lg font-semibold tracking-tight">{styleTabs.find((s) => s.id === activeStyle)?.name[lang]}</p>
                <Link href="/signup" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition hover:opacity-90">{c.stylesTry} <ArrowRight className="h-3.5 w-3.5" /></Link>
              </div>
            </div>
          </div>
          {/* showcase strip */}
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {showcase.map((s, i) => (
              <div key={i} className="overflow-hidden rounded-xl shadow-soft ring-1 ring-border transition hover:-translate-y-1"><RoomScene style={s} className="aspect-[4/3] w-full" /></div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Styles gallery ──────────────────────────────────────────── */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="label-mono inline-flex items-center justify-center gap-2 text-primary"><span className="h-px w-7 bg-primary" /> {c.galleryKicker}</p>
            <h2 className="mt-4 font-display text-[clamp(28px,4.5vw,48px)] font-semibold leading-[1.04] tracking-tight">{c.galleryH[0]} <span className="display-accent font-normal">{c.galleryH[1]}</span></h2>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted-foreground">{c.galleryBody}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {styleTabs.map((s) => (
              <article key={s.id} className="group overflow-hidden rounded-3xl bg-card shadow-soft ring-1 ring-border transition-all hover:-translate-y-1 hover:shadow-pop">
                <div className="relative">
                  <RoomScene style={s.id} className="aspect-[16/10] w-full" />
                  <span className="absolute bottom-2.5 left-2.5 flex gap-1 rounded-full bg-white/85 px-2 py-1 shadow-sm ring-1 ring-black/5 backdrop-blur">
                    {s.palette.map((h) => <span key={h} className="h-3 w-3 rounded-full ring-1 ring-black/5" style={{ background: h }} />)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-display font-semibold tracking-tight">{s.name[lang]}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{c.galleryTags[s.id]}</p>
                  </div>
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary opacity-0 transition group-hover:opacity-100"><ArrowUpRight className="h-4 w-4" /></span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workflow deep-dive + shop the look ───────────────────────── */}
      <section className="border-t border-border bg-muted/40 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="max-w-2xl">
            <p className="label-mono inline-flex items-center gap-2 text-primary"><span className="h-px w-7 bg-primary" /> {c.flowKicker}</p>
            <h2 className="mt-4 font-display text-[clamp(28px,4.5vw,48px)] font-semibold leading-[1.04] tracking-tight">{c.flowH[0]} <span className="display-accent font-normal">{c.flowH[1]}</span></h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">{c.flowBody}</p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            {/* numbered flow rail */}
            <ol className="relative space-y-4">
              <span className="absolute left-[26px] top-6 bottom-6 hidden w-px bg-border sm:block" aria-hidden />
              {c.flowSteps.map((st, i) => {
                const Icon = st.icon;
                return (
                  <li key={st.t} className="relative flex gap-4 rounded-3xl bg-card p-5 shadow-soft ring-1 ring-border">
                    <span className="relative z-10 grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-sm font-semibold text-primary">{`0${i + 1}`}</span>
                        <h3 className="text-[15px] font-semibold tracking-tight">{st.t}</h3>
                      </div>
                      <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">{st.b}</p>
                    </div>
                  </li>
                );
              })}
            </ol>

            {/* shop the look strip */}
            <aside className="rounded-3xl bg-card p-6 shadow-soft ring-1 ring-border">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary"><ShoppingBag className="h-4 w-4" /></span>
                <div>
                  <p className="label-mono text-primary">{c.shopKicker}</p>
                  <p className="text-[13px] font-medium leading-tight">{c.shopH}</p>
                </div>
              </div>
              <ul className="mt-5 space-y-2.5">
                {c.shopItems.map((it) => {
                  const Icon = it.icon;
                  return (
                    <li key={it.name} className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3 ring-1 ring-border/60 transition hover:bg-muted">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-card text-foreground/70 ring-1 ring-border"><Icon className="h-[18px] w-[18px]" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{it.name}</p>
                        <p className="text-[11px] text-muted-foreground">{it.tag}</p>
                      </div>
                      <span className="font-display text-sm font-semibold tabular-nums">{it.price}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <div>
                  <p className="text-[13px] font-medium">{c.shopTotal}</p>
                  <p className="text-[11px] text-muted-foreground">{c.shopTotalNote}</p>
                </div>
                <span className="font-display text-xl font-semibold tabular-nums text-primary">{lang === "tr" ? "₺27.160" : "$778"}</span>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── Proof ───────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-card py-14">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-3 lg:px-8">
          {c.proof.map((p) => (
            <div key={p.l}>
              <p className="font-display text-[64px] font-semibold leading-none tracking-tight text-primary">{p.big}</p>
              <p className="mt-2 text-sm font-medium">{p.l}</p>
              <p className="mt-1 text-xs text-muted-foreground">{p.c}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="mb-12 text-center">
            <p className="label-mono inline-flex items-center justify-center gap-2 text-primary"><span className="h-px w-7 bg-primary" /> {c.testimonialsKicker}</p>
            <h2 className="mt-4 font-display text-[clamp(28px,4vw,46px)] font-semibold tracking-tight">{c.testimonialsH}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {c.testimonials.map((tm, i) => (
              <figure key={tm.who} className="flex flex-col rounded-3xl bg-card p-7 shadow-soft ring-1 ring-border" style={{ transform: `rotate(${i % 3 === 1 ? 0 : i % 3 === 0 ? -0.8 : 0.8}deg)` }}>
                <div className="flex items-center justify-between">
                  <Quote className="h-7 w-7 text-primary/25" />
                  <span className="rounded-full bg-success/12 px-2.5 py-0.5 text-[11px] font-semibold text-success">{tm.metric}</span>
                </div>
                <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed">{tm.q}</blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                  <span className="grid h-9 w-9 place-items-center rounded-full text-xs font-semibold text-foreground/70 ring-2 ring-background" style={{ background: `oklch(${84 - (i % 5) * 4}% 0.06 ${40 + (i % 5) * 22})` }}>{tm.who.split(/[ &]+/).map((s) => s[0]).join("").slice(0, 2)}</span>
                  <div><p className="text-sm font-semibold">{tm.who}</p><p className="text-xs text-muted-foreground">{tm.role}</p></div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison ──────────────────────────────────────────────── */}
      <section className="px-5 pb-8 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <p className="label-mono inline-flex items-center justify-center gap-2 text-primary"><span className="h-px w-7 bg-primary" /> {c.compareKicker}</p>
            <h2 className="mt-4 font-display text-[clamp(28px,4vw,46px)] font-semibold tracking-tight">{c.compareH[0]} <span className="display-accent font-normal">{c.compareH[1]}</span></h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-card p-7 shadow-soft ring-1 ring-border lg:p-8">
              <p className="label-mono text-muted-foreground">{c.compareH[0]}</p>
              <ul className="mt-5 space-y-3">
                {c.compareOld.map((o) => (
                  <li key={o} className="flex items-start gap-3 text-[14.5px] text-muted-foreground"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"><X className="h-3 w-3" /></span>{o}</li>
                ))}
              </ul>
            </div>
            <div className="relative overflow-hidden rounded-3xl bg-sidebar p-7 text-sidebar-foreground shadow-pop lg:p-8">
              <span className="blob -right-16 -top-16 h-56 w-56 bg-primary/40 drift" aria-hidden />
              <p className="label-mono relative text-sidebar-muted">{c.compareH[1]}</p>
              <ul className="relative mt-5 space-y-3">
                {c.compareNew.map((o) => (
                  <li key={o} className="flex items-start gap-3 text-[14.5px]"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="h-3 w-3" /></span>{o}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comparison table (designer / Pinterest / Callypso Decor) ───────────── */}
      <section className="px-5 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="label-mono inline-flex items-center justify-center gap-2 text-primary"><span className="h-px w-7 bg-primary" /> {c.tableKicker}</p>
            <h2 className="mt-4 font-display text-[clamp(28px,4vw,46px)] font-semibold tracking-tight">{c.tableH[0]} <span className="display-accent font-normal">{c.tableH[1]}</span></h2>
          </div>
          <div className="overflow-hidden rounded-3xl bg-card shadow-soft ring-1 ring-border">
            <div className="grid grid-cols-[1.6fr_repeat(3,1fr)] border-b border-border bg-muted/50">
              {c.tableCols.map((col, i) => (
                <div key={i} className={cn(
                  "px-4 py-4 text-center label-mono",
                  i === 0 ? "text-left text-muted-foreground" : i === 3 ? "text-primary" : "text-muted-foreground",
                )}>
                  {i === 3 ? <span className="inline-flex items-center gap-1.5"><LogoMark className="h-4 w-4" /> {col}</span> : col}
                </div>
              ))}
            </div>
            {c.tableRows.map((row, ri) => (
              <div key={row.f} className={cn("grid grid-cols-[1.6fr_repeat(3,1fr)] items-center", ri % 2 ? "bg-muted/20" : "")}>
                <div className="px-4 py-3.5 text-[13.5px] font-medium">{row.f}</div>
                {[row.a, row.b, row.c].map((on, ci) => (
                  <div key={ci} className={cn("flex justify-center px-4 py-3.5", ci === 2 && "bg-primary/[0.04]")}>
                    {on ? (
                      <span className={cn("grid h-6 w-6 place-items-center rounded-full", ci === 2 ? "bg-primary text-primary-foreground" : "bg-success/15 text-success")}><Check className="h-3.5 w-3.5" /></span>
                    ) : (
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-muted text-muted-foreground/60"><X className="h-3.5 w-3.5" /></span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Promise (inverted) ──────────────────────────────────────── */}
      <section className="px-5 py-8 lg:px-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-sidebar p-10 text-sidebar-foreground lg:p-16">
          <span className="blob -right-20 -top-20 h-72 w-72 bg-primary/40 drift" aria-hidden />
          <div className="relative grid gap-12 lg:grid-cols-[1fr_1.15fr]">
            <div>
              <p className="label-mono inline-flex items-center gap-2 text-sidebar-muted"><span className="h-px w-7 bg-primary" /> {c.promiseKicker}</p>
              <h2 className="mt-4 font-display text-[clamp(28px,4vw,48px)] font-semibold leading-[1.04] tracking-tight">{c.promiseH[0]} <span className="display-accent font-normal" style={{ color: "var(--color-serif)" }}>{c.promiseH[1]}</span></h2>
              <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-sidebar-muted">{c.promiseBody}</p>
            </div>
            <ul className="space-y-3">
              {c.promiseBullets.map((b) => (
                <li key={b} className="flex gap-3 rounded-2xl bg-white/[0.05] px-4 py-3.5 ring-1 ring-white/10"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p className="text-[13.5px] leading-relaxed text-sidebar-foreground/85">{b}</p></li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 lg:py-28">
        <div className="mx-auto max-w-5xl px-5 lg:px-8">
          <div className="mx-auto mb-12 max-w-xl text-center">
            <p className="label-mono text-primary">{c.pricingKicker}</p>
            <h2 className="mt-3 font-display text-[clamp(28px,4.5vw,48px)] font-semibold leading-[1.04] tracking-tight">{c.pricingH[0]} <span className="display-accent font-normal">{c.pricingH[1]}</span></h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {c.plans.map((p) => (
              <article key={p.name} className={cn("relative rounded-3xl p-7 lg:p-8", p.featured ? "bg-sidebar text-sidebar-foreground shadow-pop" : "bg-card ring-1 ring-border shadow-soft")}>
                {p.featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground">{lang === "tr" ? "Önerilen" : "Recommended"}</span>}
                <p className={cn("label-mono", p.featured ? "text-sidebar-muted" : "text-muted-foreground")}>{p.name}</p>
                <p className="mt-3 flex items-end gap-1"><span className="font-display text-5xl font-semibold leading-none tracking-tight">{p.price}</span><span className={cn("pb-1.5 text-[13px]", p.featured ? "text-sidebar-muted" : "text-muted-foreground")}>{p.cad}</span></p>
                <p className={cn("mt-3 text-[13px] leading-relaxed", p.featured ? "text-sidebar-foreground/75" : "text-muted-foreground")}>{p.body}</p>
                <ul className="mt-6 space-y-2.5">
                  {p.bullets.map((b) => <li key={b} className="flex items-start gap-2 text-[13px]"><Check className={cn("mt-0.5 h-4 w-4 shrink-0", p.featured ? "text-primary" : "text-success")} />{b}</li>)}
                </ul>
                <Link href="/signup" className={cn("mt-7 inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-[13px] font-medium transition", p.featured ? "bg-primary text-primary-foreground hover:opacity-90" : "ring-1 ring-border hover:bg-muted")}>{p.cta}</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/40 py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-5 lg:px-8">
          <div className="mb-10 text-center">
            <p className="label-mono text-primary">{c.faqKicker}</p>
            <h2 className="mt-3 font-display text-[clamp(26px,4vw,42px)] font-semibold tracking-tight">{c.faqH}</h2>
          </div>
          <ul className="space-y-2.5">
            {c.faq.map((item, i) => (
              <li key={item.q} className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
                <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                  <span className="text-[15px] font-semibold tracking-tight">{item.q}</span>
                  {open === i ? <Minus className="h-4 w-4 shrink-0 text-muted-foreground" /> : <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />}
                </button>
                {open === i && <p className="px-5 pb-4 text-[13.5px] leading-relaxed text-muted-foreground">{item.a}</p>}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Finale ──────────────────────────────────────────────────── */}
      <section className="px-5 py-20 lg:px-8 lg:py-28">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] p-10 text-center text-white lg:p-16" style={{ background: "var(--grad-brand)" }}>
          <span className="blob left-1/4 -top-12 h-64 w-64 bg-white/20 drift" aria-hidden />
          <div className="relative">
            <p className="label-mono inline-flex items-center justify-center gap-2 text-white/70"><Sparkles className="h-3 w-3" /> {c.finaleKicker}</p>
            <h2 className="mx-auto mt-4 max-w-3xl font-display text-[clamp(32px,5.5vw,68px)] font-semibold leading-[1] tracking-tight">{c.finaleH[0]} <span className="italic" style={{ fontFamily: "var(--font-display)" }}>{c.finaleH[1]}</span></h2>
            <p className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-white/85">{c.finaleBody}</p>
            <div className="mt-9"><Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[15px] font-medium text-foreground transition hover:bg-white/90">{c.cta1} <ArrowRight className="h-4 w-4" /></Link></div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_3fr]">
            <div>
              <Link href="/" className="inline-flex min-w-0 items-center gap-2.5"><LogoMark className="h-8 w-8 shrink-0" /><span className="truncate font-display text-lg font-semibold tracking-tight text-foreground">{brand}</span></Link>
              <p className="display-accent mt-4 max-w-[30ch] text-[14px] leading-relaxed text-muted-foreground">{c.footTagline}</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex gap-1.5">
                  {["#efe9df", "#dca06a", "#c1582f", "#a9b6a0", "#3c3a36"].map((h) => (
                    <span key={h} className="h-3.5 w-3.5 rounded-full ring-1 ring-black/5" style={{ background: h }} />
                  ))}
                </div>
                <p className="label-mono text-muted-foreground">{appConfig.domain || appConfig.company}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {c.footCols.map((col, ci) => (
                <div key={col.h}>
                  <p className="label-mono mb-4 text-primary">{col.h}</p>
                  <ul className="space-y-2.5">
                    {col.links.map((l, li) => (
                      <li key={l}>
                        {footAnchors[`${ci}-${li}`] ? (
                          <a href={footAnchors[`${ci}-${li}`]} className="text-[13px] text-muted-foreground transition hover:text-foreground">{l}</a>
                        ) : (
                          <button type="button" onClick={() => toast(ui.fullVersion, "info")} className="text-left text-[13px] text-muted-foreground transition hover:text-foreground">{l}</button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-[12px] text-muted-foreground md:flex-row md:items-center">
            <p>© 2026 {appConfig.company} · {brand}{appConfig.email ? ` · ${appConfig.email}` : ""} · {c.footRights}</p>
            <p className="label-mono inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success pulse-dot" /> {lang === "tr" ? "TR & EN · demo modu" : "TR & EN · demo mode"}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* Module copy, bilingual — kept here so the act stays self-contained. */
function appFeatures(lang: "tr" | "en") {
  return {
    tr: [
      { t: "Anında yeniden döşeme", b: `Boş ya da dolu bir odanın fotoğrafını yükle; ${brand} onu seçtiğin stilde, gerçekçi mobilya ve ışıkla yeniden döşer.` },
      { t: "12+ tasarım stili", b: "İskandinav, Bohem, Japandi, Modern, Akdeniz, Endüstriyel… Her stil kendi paleti, dokusu ve mobilya diliyle gelir." },
      { t: "Öncesi / sonrası", b: "Her sonuç gerçek odanın yanında öncesi-sonrası olarak gelir — hayal etme, gör. Tek dokunuşla karşılaştır." },
      { t: "Tadilat keşfi", b: "Sadece mobilya değil: zemin, duvar rengi, tezgâh varyantlarını dene; tadilat sonrası halini öngör." },
      { t: "Alışveriş listesi", b: "Beğendiğin görseldeki parçalar — kanepe, halı, lamba — bütçeye göre benzer ürünlerle listelenir." },
      { t: "Müşteriyle paylaş", b: "İç mimarlar için: her projeyi müşteriye gönderilebilir bir öncesi/sonrası galerisi olarak paylaş, onay topla." },
    ],
    en: [
      { t: "Instant restyle", b: `Upload a photo of an empty or lived-in room; ${brand} redresses it in your chosen style with believable furniture and light.` },
      { t: "12+ design styles", b: "Scandinavian, Bohemian, Japandi, Modern, Mediterranean, Industrial… each with its own palette, texture and furniture language." },
      { t: "Before / after", b: "Every result comes as a before/after against your real room — don't imagine it, see it. Compare with one tap." },
      { t: "Renovation explorer", b: "Beyond furniture: try flooring, wall color and counter variants; preview the post-renovation look." },
      { t: "Shoppable looks", b: "The pieces in a look you love — sofa, rug, lamp — are listed as similar products matched to your budget." },
      { t: "Share with clients", b: "For designers: share each project as a client-ready before/after gallery, collect approvals." },
    ],
  }[lang];
}
