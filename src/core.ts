import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG, STORAGE_KEYS, XP_PER_LEVEL, zodiacSigns } from './config';
import type {
  BackupSnapshot, ExpenseEntry, HistoryItem, MealEntry, SavingsGoal,
  LeaderboardEntry, HelpRequest, CommunityPost, Profile, QuizMode,
  SettingsState, ZodiacKey
} from './types';

// ─── 💾 STORAGE LAYER ─────────────────────────────────────────────────────
export const Storage = {
  get: async (k:string) => { try { return await AsyncStorage.getItem(k); } catch { return null; } },
  set: async (k:string,v:string) => { try { await AsyncStorage.setItem(k,v); } catch {} },
  remove: async (k:string) => { try { await AsyncStorage.removeItem(k); } catch {} },
  multiSet: async (p:[string,string][]) => { try { await AsyncStorage.multiSet(p); } catch {} },
  multiGet: async (ks:string[]) => { try { return (await AsyncStorage.multiGet(ks)) as [string,string|null][]; } catch { return ks.map(k=>[k,null] as [string,string|null]); } },
  clear: async () => { try { await AsyncStorage.clear(); } catch {} },
};
export const safeJsonParse = <T,>(value:string|null, fallback:T):T => {
  if(!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
};
export const buildBackupSnapshot = (profile:Profile, history:HistoryItem[], settings:SettingsState, source:BackupSnapshot['meta']['source']='manual-export', extras?:{ meals?:MealEntry[]; expenses?:ExpenseEntry[]; savingsGoals?:SavingsGoal[]; }):BackupSnapshot => ({
  version:'5.2',
  exportedAt:new Date().toISOString(),
  profile,
  history:history.slice(0,200),
  settings,
  meals: extras?.meals?.slice(0,200) ?? [],
  expenses: extras?.expenses?.slice(0,300) ?? [],
  savingsGoals: extras?.savingsGoals?.slice(0,50) ?? [],
  meta:{source,app:'Fakirmetre Titan'},
});
export const sanitizeImportedData = (raw:any, current:{profile:Profile;history:HistoryItem[];settings:SettingsState;}):BackupSnapshot | null => {
  if(!raw || typeof raw !== 'object') return null;
  const profile = raw.profile && typeof raw.profile === 'object' ? { ...current.profile, ...raw.profile } : current.profile;
  const settings = raw.settings && typeof raw.settings === 'object' ? { ...current.settings, ...raw.settings } : current.settings;
  const history = Array.isArray(raw.history) ? raw.history.filter(Boolean).slice(0, 200) : current.history;
  const meals = Array.isArray(raw.meals) ? raw.meals.filter(Boolean).slice(0, 200) : [];
  const expenses = Array.isArray(raw.expenses) ? raw.expenses.filter(Boolean).slice(0, 300) : [];
  const savingsGoals = Array.isArray(raw.savingsGoals) ? raw.savingsGoals.filter(Boolean).slice(0, 50) : [];
  if(!profile.name || !settings.accent) return null;
  return {
    version: typeof raw.version === 'string' ? raw.version : '5.2',
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : new Date().toISOString(),
    profile,
    history,
    settings,
    meals,
    expenses,
    savingsGoals,
    meta: {
      source: raw.meta?.source === 'local-cloud' ? 'local-cloud' : 'manual-import',
      app: typeof raw.meta?.app === 'string' ? raw.meta.app : 'Fakirmetre Titan',
    },
  };
};
export const buildExpenseInsights = (expenses:ExpenseEntry[], savingsGoals:SavingsGoal[] = []) => {
  const total = expenses.reduce((sum, item) => sum + item.amount, 0);
  const last7Days = expenses.filter(item => {
    const created = new Date(item.createdAt).getTime();
    return Number.isFinite(created) && (Date.now() - created) <= 7 * 24 * 60 * 60 * 1000;
  });
  const recentTotal = last7Days.reduce((sum, item) => sum + item.amount, 0);
  const categoryTotals = last7Days.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + item.amount;
    return acc;
  }, {});
  const topRecentCategory = Object.entries(categoryTotals).sort((a,b)=>b[1]-a[1])[0];
  const activeGoal = savingsGoals.find(goal => goal.current < goal.target) ?? savingsGoals[0] ?? null;
  const lines:string[] = [];

  if(total === 0){
    lines.push('Henüz harcama kaydı yok. Düzenli kayıt girerek daha net bütçe içgörüsü alabilirsin.');
  } else {
    lines.push(`Toplam kayıtlı harcaman ₺${total.toFixed(0)}.`);
    lines.push(`Son 7 günde ₺${recentTotal.toFixed(0)} harcama girdin.`);
  }

  if(activeGoal){
    const remaining = Math.max(0, activeGoal.target - activeGoal.current);
    lines.push(remaining === 0 ? `"${activeGoal.title}" hedefin tamamlandı.` : `"${activeGoal.title}" hedefi için kalan tutar ₺${remaining.toFixed(0)}.`);
  }

  if(topRecentCategory){
    lines.push(`Bu hafta en yüksek kategori: ${topRecentCategory[0]} (₺${topRecentCategory[1].toFixed(0)}).`);
  }

  return lines.slice(0, 3);
};

export const getOfflineAiReply = (message:string, profile:Profile, history:HistoryItem[]) => {
  const lower = message.toLowerCase();
  const tips:string[] = [];
  if(lower.includes('borç') || lower.includes('kredi')) tips.push('Önce faiz oranı en yüksek borcu hedefle ve minimum ödemeleri aksatma.');
  if(lower.includes('bütçe') || lower.includes('harcama')) tips.push('Gelirini 3 kutuya ayır: zorunlu gider, esnek gider, birikim. Harcamayı 7 gün not et.');
  if(lower.includes('birik') || lower.includes('tasarruf')) tips.push('Otomatik küçük birikim belirle; maaş gelir gelmez %5–10 ayırmak en sürdürülebilir yöntemdir.');
  if(lower.includes('yatırım')) tips.push('Acil durum fonun yoksa önce 3 aylık güvenlik yastığı oluştur, sonra risk seviyene göre ilerle.');
  if(lower.includes('market') || lower.includes('alışveriş')) tips.push('Listeyle çık, tok git ve kampanya diye gereksiz ürün alma.');
  if(!tips.length) tips.push('Hedefini netleştir: bu ay tek bir finansal davranışı iyileştirmen bile ilerleme sayılır.');
  const lastQuiz = history[0]?.title ? `Son quiz sonucun: ${history[0].title}.` : 'Henüz quiz geçmişin oluşmamış.';
  return `${profile.name}, sana hızlı planım şu: ${tips.slice(0,2).join(' ')} ${lastQuiz} Bugün tek bir küçük adım seç ve onunla başla. 💪`;
};
export const askFinanceAssistant = async (message:string, profile:Profile, history:HistoryItem[], systemPrompt:string) => {
  const apiKey = APP_CONFIG.anthropicApiKey.trim();
  if(!apiKey){
    return { text:getOfflineAiReply(message, profile, history), mode:'offline' as const };
  }
  const response = await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'x-api-key': apiKey,
      'anthropic-version':'2023-06-01',
    },
    body:JSON.stringify({
      model:APP_CONFIG.anthropicModel,
      max_tokens:400,
      system:systemPrompt,
      messages:[{role:'user',content:message}],
    }),
  });
  if(!response.ok) throw new Error(`AI ${response.status}`);
  const data = await response.json();
  return { text:data.content?.[0]?.text || getOfflineAiReply(message, profile, history), mode:'remote' as const };
};

// ─── 📊 FIREBASE ANALYTICS LAYER ─────────────────────────────────────────
const _ev: {name:string;params:Record<string,any>;ts:number}[] = [];
export const Analytics = {
  hydrate: (items:{name:string;params:Record<string,any>;ts:number}[] = []) => { _ev.splice(0,_ev.length,...items.slice(-50)); },
  log: (name:string, params:Record<string,any>={}) => { _ev.push({name,params,ts:Date.now()}); if(_ev.length>50) _ev.shift(); Storage.set(STORAGE_KEYS.analytics, JSON.stringify(_ev)); },
  setProp: (_k:string,_v:string) => { /* Firebase.analytics().setUserProperty(_k,_v) */ },
  events: () => _ev.slice(-50),
};

// ─── 🏆 LEADERBOARD DATA ──────────────────────────────────────────────────
export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {name:'Ahmet K.',avatar:'🧔',xp:4200,level:22},
  {name:'Zeynep A.',avatar:'👩',xp:3850,level:20},
  {name:'Mert S.',avatar:'👨‍💻',xp:3100,level:16},
  {name:'Elif B.',avatar:'👧',xp:2750,level:14},
  {name:'Burak T.',avatar:'🧑‍💼',xp:2400,level:13},
  {name:'Selin D.',avatar:'👩‍💻',xp:2100,level:11},
  {name:'Yusuf K.',avatar:'🦸',xp:1800,level:10},
  {name:'Ayşe M.',avatar:'🧙',xp:1500,level:8},
];

// ─── 🎭 SEASON CHALLENGES ─────────────────────────────────────────────────
export const SEASON_BASE = [
  {id:'s1',title:'Quiz Maratonu',desc:'10 quiz tamamla',xp:500,icon:'🏃',target:10},
  {id:'s2',title:'Tasarruf Şampiyonu',desc:'Tasarruf quizinden Sev.1 al',xp:300,icon:'🏦',target:1},
  {id:'s3',title:'7 Gün Serisi',desc:'7 gün üst üste giriş yap',xp:400,icon:'🔥',target:7},
  {id:'s4',title:'Kalori Takipçisi',desc:'20 öğün kayıt et',xp:250,icon:'🥗',target:20},
  {id:'s5',title:'AI Danışman',desc:'Claude ile 5 sohbet başlat',xp:200,icon:'🤖',target:5},
];
export const zodiacEmojis:Record<ZodiacKey,string> = {Koç:'♈',Boğa:'♉',İkizler:'♊',Yengeç:'♋',Aslan:'♌',Başak:'♍',Terazi:'♎',Akrep:'♏',Yay:'♐',Oğlak:'♑',Kova:'♒',Balık:'♓'};

// ─── TOPLULUK MOCK VERİSİ ─────────────────────────────────────────────────────
export const HELP_CATEGORIES = ['Tümü','Bütçe','Borç','Yatırım','Harcama','Tasarruf','Kariyer','Sigorta'];

export const MOCK_HELP: HelpRequest[] = [
  {id:'h1',avatar:'👨‍💻',name:'Mert S.',title:'Kredi kartı borcumu nasıl kapatırım?',desc:'3 farklı kredi kartım var, toplam 15.000₺ borcum var. Hangi stratejiyi uygulamalıyım?',category:'Borç',time:'2 saat önce',likes:12,replies:5,solved:false,level:8},
  {id:'h2',avatar:'👩',name:'Zeynep A.',title:'Aylık bütçe nasıl yapılır?',desc:'Maaşım 15.000₺. Kira, fatura ve gıda harcamalarımı dengelemekte zorlanıyorum.',category:'Bütçe',time:'5 saat önce',likes:8,replies:3,solved:true,level:12},
  {id:'h3',avatar:'🧔',name:'Ahmet K.',title:'İlk yatırımım için ne önerirsiniz?',desc:'5.000₺ birikimim var ve yatırım yapmak istiyorum ama nereden başlayacağımı bilmiyorum.',category:'Yatırım',time:'1 gün önce',likes:20,replies:9,solved:false,level:15},
  {id:'h4',avatar:'👧',name:'Elif B.',title:'Market alışverişi bütçemi nasıl düşürürüm?',desc:'Aylık 3.000₺ markete gidiyorum bu çok fazla. Pratik ipuçları var mı?',category:'Tasarruf',time:'2 gün önce',likes:15,replies:7,solved:true,level:6},
];

export const MOCK_POSTS: CommunityPost[] = [
  {id:'p1',avatar:'🧑‍💼',name:'Burak T.',content:'💡 Günlük kahve yerine evde kahve yaparsanız aylık 600₺ tasarruf edebilirsiniz! Küçük değişiklikler büyük fark yaratır. #tasarruf',likes:24,time:'1 saat önce',tag:'İpucu',likedByMe:false},
  {id:'p2',avatar:'🦸',name:'Yusuf K.',content:'📊 50/30/20 kuralını uygulamaya başladım: Gelirin %50 ihtiyaçlar, %30 istekler, %20 birikim. 3 ayda 4.500₺ biriktirdim! 🔥',likes:41,time:'3 saat önce',tag:'Başarı',likedByMe:false},
  {id:'p3',avatar:'👩‍💻',name:'Selin D.',content:'🛒 Alışverişe liste ile gidiyorum ve listeye bağlı kalıyorum. Plansız harcamalarım %70 azaldı. Deneyin mutlaka!',likes:18,time:'6 saat önce',tag:'İpucu',likedByMe:false},
  {id:'p4',avatar:'🧙',name:'Ayşe M.',content:'⚠️ Aboneliklerimi gözden geçirdim: 4 kullanmadığım abonelik = 280₺/ay gereksiz harcama. İptal ettim, teşekkürler Fakirmetre!',likes:33,time:'1 gün önce',tag:'Uyarı',likedByMe:false},
];

// ─── ASTROLOJI VERİSİ ─────────────────────────────────────────────────────────
export const ZODIAC_DATES:Record<ZodiacKey,string> = {
  Koç:'21 Mar – 19 Nis',Boğa:'20 Nis – 20 May',İkizler:'21 May – 20 Haz',Yengeç:'21 Haz – 22 Tem',
  Aslan:'23 Tem – 22 Ağu',Başak:'23 Ağu – 22 Eyl',Terazi:'23 Eyl – 22 Eki',Akrep:'23 Eki – 21 Kas',
  Yay:'22 Kas – 21 Ara',Oğlak:'22 Ara – 19 Oca',Kova:'20 Oca – 18 Şub',Balık:'19 Şub – 20 Mar',
};
export const ZODIAC_ELEMENT:Record<ZodiacKey,string> = {
  Koç:'Ateş 🔥',Boğa:'Toprak 🌍',İkizler:'Hava 💨',Yengeç:'Su 💧',Aslan:'Ateş 🔥',Başak:'Toprak 🌍',
  Terazi:'Hava 💨',Akrep:'Su 💧',Yay:'Ateş 🔥',Oğlak:'Toprak 🌍',Kova:'Hava 💨',Balık:'Su 💧',
};
export const ZODIAC_PLANET:Record<ZodiacKey,string> = {
  Koç:'Mars ♂',Boğa:'Venüs ♀',İkizler:'Merkür ☿',Yengeç:'Ay ☽',Aslan:'Güneş ☀',Başak:'Merkür ☿',
  Terazi:'Venüs ♀',Akrep:'Plüton ♇',Yay:'Jüpiter ♃',Oğlak:'Satürn ♄',Kova:'Uranüs ♅',Balık:'Neptün ♆',
};

// Kişiselleştirilmiş günlük yorum için şablon
export function getPersonalizedHoroscope(profile:Profile, score:number, history:HistoryItem[]): {
  daily:string; finance:string; lucky:string; energy:string; warning:string; tip:string
} {
  const z = profile.zodiac;
  const day = new Date().getDay(); // 0-6
  const hour = new Date().getHours();
  const isHighRisk = score > 60;
  const testCount = history.length;
  const hasStreak = profile.streak >= 3;
  const lvl = profile.level;
  const name = profile.name;

  const timeOfDay = hour < 12 ? 'sabah' : hour < 17 ? 'öğleden sonra' : 'akşam';

  const dailyMap:Record<ZodiacKey,string[]> = {
    Koç:[
      `${name}, bu ${timeOfDay} enerjin doruğa çıkıyor. Hızlı kararlar vermeden önce bir nefes al — özellikle para konularında dürtüsel hareket etme.`,
      `Mars'ın etkisiyle bugün liderlik enerjin yüksek. Bu gücü tasarruf hedeflerini belirlemek için kullan!`,
      `Ateş enerjisi bugün seni harcatabilir. Kredi kartını cebinde bırak, nakit kullan.`,
    ],
    Boğa:[
      `${name}, Venüs'ün yönlendirmesiyle bugün kalite odaklısın. Ama 'kaliteli' ile 'pahalı'yı karıştırma!`,
      `Toprak elementi seni dengeli tutuyor. Uzun vadeli birikim planı yapmak için mükemmel bir ${timeOfDay}.`,
      `Alışverişe çıkmadan önce liste yaz — Boğa olarak bir kez mağazaya girdin mi, çıkmak zor.`,
    ],
    İkizler:[
      `${name}, bu ${timeOfDay} zihninizde binlerce fikir var. Finansal kararları bugün geciktir, yarın değerlendir.`,
      `Merkür'ün etkisiyle iletişim güçlü — fiyat pazarlığı yapmak için harika bir gün!`,
      `İkizler'in çift doğası seni iki fiyat arasında bırakabilir. Her zaman ucuz olanı seç!`,
    ],
    Yengeç:[
      `${name}, duygusal zirvedeyken alışveriş yapma. Bu ${timeOfDay} market yerine park ziyareti yap.`,
      `Ay'ın etkisiyle aile ve yuva odaklısın. Ev tasarrufu için harika fikirler bugün aklına gelecek.`,
      `Bugün nostalji harcamalarına dikkat — 'hatıra için' diye aldığın şeyler bütçeni zorlayabilir.`,
    ],
    Aslan:[
      `${name}, Güneş'in parlak ışığında bugün gösteriş isteği artıyor. Ama gerçek zenginlik sessiz birikimde.`,
      `Liderlik enerjin yüksek — bu ${timeOfDay} ekibine ilham ver, cüzdanını değil!`,
      `Bugün premium ürünlere ilgin artabilir. Kendine şunu sor: İhtiyaç mı, ego mu?`,
    ],
    Başak:[
      `${name}, Merkür seni bugün analitik tutuyor. Hesap-kitap yapmak için en iyi gün bu!`,
      `Bu ${timeOfDay} bütçe tablosu oluştur veya aboneliklerini gözden geçir — mükemmel olacak.`,
      `Detaycı yapın bugün avantaj: Küçük giderleri topladığında şaşıracaksın.`,
    ],
    Terazi:[
      `${name}, Venüs seni güzele yöneltiyor ama bütçene sadık kal. Dengeyi bul!`,
      `Bu ${timeOfDay} ikili karar verme dönemin. Harcama yapmadan önce bir gece bekle.`,
      `Terazi olarak adalet duygun güçlü — parayı eşit şekilde birikim ve harcamaya böl.`,
    ],
    Akrep:[
      `${name}, bugün gizli harcamalar gün yüzüne çıkabilir. Banka ekstresini incele!`,
      `Plüton dönüşüm getirir — bu ${timeOfDay} eski bir alışkanlığını bırakmak için güçlü bir an.`,
      `Akrep'in sezgisel gücünü kullan: Bir harcamayı yapmadan önce içgüdüne kulak ver.`,
    ],
    Yay:[
      `${name}, macera ruhu seni spontane harcamalara yönlendirebilir. Bu ${timeOfDay} seyahat planına değil tasarrufa odaklan.`,
      `Jüpiter bolluğu temsil eder ama bolluğu harcayarak değil biriktirerek yaratırsın!`,
      `Büyük resmi görme yeteneğin var — 5 yıllık finans hedefi belirle, bugün başla.`,
    ],
    Oğlak:[
      `${name}, Satürn'ün disiplini seninle. Bu ${timeOfDay} uzun vadeli yatırım araştır.`,
      `En güçlü finansal burcusun — ama kendini ödüllendirmeyi de öğren, sadece biriktirme.`,
      `Bugün kariyer hamlesini düşün. Oğlak enerjisi profesyonel büyüme için mükemmel.`,
    ],
    Kova:[
      `${name}, Uranüs yenilik getirir. Bu ${timeOfDay} fintech uygulamaları veya dijital tasarruf araçlarını keşfet.`,
      `Toplumsal düşüncen güçlü — grup alışverişi veya ortak fon havuzu fikirlerin ilgi görebilir.`,
      `Teknoloji odaklı alışverişlere dikkat — her yeni gadget bir ihtiyaç değil!`,
    ],
    Balık:[
      `${name}, Neptune hayalleri geçekten ayırıyor — bugün hayal alışverişi değil, gerçek bütçe yap.`,
      `Bu ${timeOfDay} sezgin keskin. Finansal sezginle hareket et, duygularınla değil.`,
      `Yardımseverliğin güzel ama bugün başkası için harcamadan önce kendi bütçeni düşün.`,
    ],
  };

  const financeMap:Record<ZodiacKey,string> = {
    Koç: isHighRisk ? '⚠️ Risk seviyeniz yüksek. Bugün yeni harcama taahhüdü verme.' : '✅ Finans enerjin dengeli. Küçük bir birikim hamlesi yapabilirsin.',
    Boğa: hasStreak ? '🌟 Düzenli giriş serinle finansal disiplinin güçleniyor!' : '💡 Günlük giriş alışkanlığı kazan — küçük adımlar büyük fark yaratır.',
    İkizler: testCount > 3 ? '📊 Birden fazla test yaptın, büyük resmi görüyorsun!' : '🎯 Farklı quiz modlarını dene — her biri yeni bir bakış açısı katar.',
    Yengeç: '🏠 Ev harcamaları önceliğin olsun. Dışarıda değil evde değer üret.',
    Aslan: lvl >= 3 ? '⭐ Seviye '+lvl+' finansal güç! Liderlik pozisyonuna yaklaşıyorsun.' : '💪 XP biriktir, seviye atla — finansal güç inşa ediyorsun.',
    Başak: '📋 Bugün bütçe analizi için mükemmel enerji. Sayıları incele!',
    Terazi: '⚖️ Harcama ve tasarruf dengesini koru. 50/30/20 kuralını uygula.',
    Akrep: '🔍 Gizli harcamalar tespit et — aboneliklerini tara.',
    Yay: '🌏 Büyük hedefler koy ama küçük adımlarla ilerle.',
    Oğlak: '🏆 Uzun vadeli plan için en güçlü günlerden biri.',
    Kova: '💡 Dijital finans araçlarını keşfet — otomasyon tasarrufu artırır.',
    Balık: '🌊 Sezgine güven ama finansal kararları mantıkla da onayla.',
  };

  const luckyNumbers = [3,7,12,21,33,42,9,18,27];
  const lucky = luckyNumbers[(new Date().getDate() + zodiacSigns.indexOf(z)) % luckyNumbers.length];

  const energyLevels = ['Düşük ⬇️','Orta →','Yüksek ⬆️','Zirve 🔝'];
  const energy = energyLevels[(new Date().getDate() + day) % 4];

  const warnings:Record<ZodiacKey,string> = {
    Koç:'⚠️ Dürtüsel alışveriş riski yüksek bugün.',
    Boğa:'⚠️ Lüks tuzağına düşebilirsin.',
    İkizler:'⚠️ Kararsızlık seni iki kez ödeme yaptırabilir.',
    Yengeç:'⚠️ Duygusal harcama dönemi — dikkatli ol.',
    Aslan:'⚠️ Gösteriş harcaması yapmaktan kaçın.',
    Başak:'⚠️ Aşırı analiz felç edebilir — harekete geç.',
    Terazi:'⚠️ Kararsızlık fırsat kaçırttırabilir.',
    Akrep:'⚠️ Gizli borçlar gün yüzüne çıkabilir.',
    Yay:'⚠️ Spontane seyahat/eğlence harcaması riski.',
    Oğlak:'⚠️ Aşırı çalışma tükenmişliğe yol açabilir.',
    Kova:'⚠️ Teknoloji harcamaları kontrolden çıkabilir.',
    Balık:'⚠️ Hayali bütçeyle gerçek alışveriş yapma.',
  };

  const tips:Record<ZodiacKey,string> = {
    Koç:'💡 Bugünkü ipucu: Alışveriş listesi yap ve sadece listedekini al.',
    Boğa:'💡 Bugünkü ipucu: İki ürün arasında kalırsan ucuzu seç.',
    İkizler:'💡 Bugünkü ipucu: Karar vermeden önce 24 saat bekle.',
    Yengeç:'💡 Bugünkü ipucu: Evde yemek pişir, dışarı çıkma.',
    Aslan:'💡 Bugünkü ipucu: Sosyal medyada gördüğün ürünleri sepete ekleme.',
    Başak:'💡 Bugünkü ipucu: Gider tablosu çıkar, küçük kaçakları bul.',
    Terazi:'💡 Bugünkü ipucu: Bir tasarruf ve bir harcama hedefi belirle.',
    Akrep:'💡 Bugünkü ipucu: Tüm aboneliklerini listele, gereksizleri iptal et.',
    Yay:'💡 Bugünkü ipucu: Seyahat planını erken yap, fiyatlar düşük olsun.',
    Oğlak:'💡 Bugünkü ipucu: 1 yıllık birikim hedefi belirle ve yaz.',
    Kova:'💡 Bugünkü ipucu: Otomatik tasarruf talimatı kur, elle aktarma.',
    Balık:'💡 Bugünkü ipucu: Hayaller değil, somut rakamlarla bütçe yap.',
  };

  const dailyTexts = dailyMap[z] ?? dailyMap['Koç'];
  const dailyIndex = (new Date().getDate() + day) % dailyTexts.length;

  return {
    daily: dailyTexts[dailyIndex],
    finance: financeMap[z],
    lucky: `${lucky} • ${ZODIAC_PLANET[z]}`,
    energy,
    warning: warnings[z],
    tip: tips[z],
  };
}

// ─── RÜYA TABİRİ VERİSİ ──────────────────────────────────────────────────────
export const DREAM_DATA: {keyword:string; emoji:string; meaning:string; finance:string}[] = [
  {keyword:'para',emoji:'💰',meaning:'Rüyada para görmek genellikle güç, özgüven ve değer algısıyla ilgilidir.',finance:'💡 Finansal bilinç yüksek. Birikim için olumlu bir dönemin başlangıcı olabilir.'},
  {keyword:'altın',emoji:'🥇',meaning:'Altın rüyası kalıcı değerlere, güvenliğe ve bereket beklentisine işaret eder.',finance:'💡 Uzun vadeli yatırım için içsel bir hazırlık işareti olabilir.'},
  {keyword:'borç',emoji:'📋',meaning:'Borç rüyası sorumluluk hissi, yük veya taahhütlerle ilgili kaygıları yansıtır.',finance:'⚠️ Gerçek borçlarınızı gözden geçirme vakti gelmiş olabilir.'},
  {keyword:'dükkan',emoji:'🏪',meaning:'Dükkan rüyası seçenekler, kararlar ve hayattaki fırsatları simgeler.',finance:'💡 Farklı seçenekleri değerlendirme zamanı. Aceleci karar verme.'},
  {keyword:'kayıp',emoji:'😟',meaning:'Kayıp rüyası kontrol kaybı, belirsizlik veya bir şeyi geride bırakma korkusunu temsil eder.',finance:'⚠️ Finansal kaygıların bilinçaltını etkileyebilir. Bütçeni gözden geçir.'},
  {keyword:'uçmak',emoji:'🦅',meaning:'Uçma rüyası özgürlük, sınırları aşma ve yüksek hedeflere ulaşma arzusunu simgeler.',finance:'💡 Büyük finansal hedefler kurmak için motivasyon yüksek.'},
  {keyword:'düşmek',emoji:'⬇️',meaning:'Düşme rüyası kontrol yitimi, başarısızlık korkusu veya güvensizlik hissini yansıtır.',finance:'⚠️ Risk almadan önce güvenlik ağını kontrol et.'},
  {keyword:'ev',emoji:'🏠',meaning:'Ev rüyası kimlik, güvenlik, aile ve temel ihtiyaçları simgeler.',finance:'💡 Ev ve konut odaklı tasarruf için içsel bir mesaj olabilir.'},
  {keyword:'araba',emoji:'🚗',meaning:'Araba rüyası kişisel kontrol, yön ve hayattaki hız ile ilgili mesajlar taşır.',finance:'💡 Gidişatı kontrol ediyorsun. Mali hedeflerin net.'},
  {keyword:'çocuk',emoji:'👶',meaning:'Çocuk rüyası yeni başlangıçlar, sorumluluk ve yaratıcılık potansiyelini simgeler.',finance:'💡 Yeni bir finansal proje başlatmak için uygun bir dönem.'},
  {keyword:'su',emoji:'💧',meaning:'Su rüyası duygular, bilinçdışı ve değişimi temsil eder. Temiz su bereket işaretidir.',finance:'💡 Temiz su gördüysen finansal akış pozitif yönde ilerliyor.'},
  {keyword:'ateş',emoji:'🔥',meaning:'Ateş rüyası tutku, dönüşüm ve enerji demektir. Kontrolsüz ateş uyarıdır.',finance:'⚠️ Duygusal kararlar değil, mantıklı finansal kararlar ver.'},
  {keyword:'ölüm',emoji:'☯️',meaning:'Ölüm rüyası genellikle son değil, köklü bir dönüşüm ve yeni başlangıcı simgeler.',finance:'💡 Eski para alışkanlıklarını bırakma vakti gelmiş.'},
  {keyword:'yılan',emoji:'🐍',meaning:'Yılan rüyası iyileşme, dönüşüm veya bazı kültürlerde servet ve bilgeliği simgeler.',finance:'💡 Sezgine güven, finansal tuzaklara karşı dikkatli ol.'},
  {keyword:'kuş',emoji:'🐦',meaning:'Kuş rüyası özgürlük, umut ve yeni fırsatların habercisidir.',finance:'💡 Yeni bir gelir fırsatı kapıda olabilir.'},
  {keyword:'deniz',emoji:'🌊',meaning:'Deniz rüyası bilinçdışı, duygusal derinlik ve sınırsız potansiyeli simgeler.',finance:'💡 Büyük finansal dalgalanmalara hazırlıklı ol.'},
  {keyword:'dağ',emoji:'⛰️',meaning:'Dağ rüyası zorlu hedefler, engeller ve başarmanın sembolüdür.',finance:'💡 Finansal hedefe ulaşmak zaman alacak ama mümkün.'},
  {keyword:'köpek',emoji:'🐕',meaning:'Köpek rüyası sadakat, güven ve korunan ilişkileri temsil eder.',finance:'💡 Güvendiğin kişilerle finansal iş birliği yapabilirsin.'},
  {keyword:'kedi',emoji:'🐈',meaning:'Kedi rüyası bağımsızlık, sezgi ve gizem ile ilişkilidir.',finance:'💡 Gizli bir fırsat veya beklenmedik kazanç yakın olabilir.'},
  {keyword:'okul',emoji:'🏫',meaning:'Okul rüyası öğrenme, sınanma ve kişisel gelişim isteğini yansıtır.',finance:'💡 Finansal eğitim veya yeni beceri kazanmak için olumlu dönem.'},
  {keyword:'sınav',emoji:'📝',meaning:'Sınav rüyası değerlendirilme kaygısı, hazırlık ve performans baskısını simgeler.',finance:'⚠️ Finansal kararlar öncesi iyi analiz yap, hazırlıksız adım atma.'},
  {keyword:'yemek',emoji:'🍽️',meaning:'Yemek rüyası beslenme, paylaşım ve temel ihtiyaçların karşılanmasını simgeler.',finance:'💡 Temel harcamaların karşılandığı, güvenli bir dönemdesin.'},
  {keyword:'çiçek',emoji:'🌸',meaning:'Çiçek rüyası güzellik, büyüme ve olumlu gelişmelerin işaretidir.',finance:'💡 Finansal açılım için tohumlar atılıyor.'},
  {keyword:'yağmur',emoji:'🌧️',meaning:'Yağmur rüyası arınma, bereket ve yenilenmesyi simgeler.',finance:'💡 Zorlu dönem geçiyor, sonrasında bereket bekleniyor.'},
  {keyword:'karanlık',emoji:'🌑',meaning:'Karanlık rüyası bilinmeyen, belirsizlik ve keşfedilmemiş olasılıkları temsil eder.',finance:'⚠️ Finansal belirsizlik var — plan yapmak için acele et.'},
  {keyword:'ışık',emoji:'💡',meaning:'Işık rüyası netlik, aydınlanma ve doğru yönü gösterir.',finance:'💡 Finansal hedeflerin belirginleşiyor, devam et!'},
  {keyword:'hediye',emoji:'🎁',meaning:'Hediye rüyası beklenmedik kazanç, şans ve alışveriş dönemini müjdeler.',finance:'💡 Beklenmedik bir gelir veya fırsat yakın olabilir.'},
  {keyword:'kaçmak',emoji:'🏃',meaning:'Kaçma rüyası sorundan kaçınma, stres veya yüzleşilemeyen korkuları yansıtır.',finance:'⚠️ Finansal sorundan kaçmak yerine doğrudan yüzleş.'},
  {keyword:'uçak',emoji:'✈️',meaning:'Uçak rüyası yüksek hedefler, uzak yolculuklar ve büyük değişimleri simgeler.',finance:'💡 Uzun vadeli yatırım veya büyük bir kariyer hamlesi zamanı.'},
  {keyword:'hastane',emoji:'🏥',meaning:'Hastane rüyası iyileşme, bakım ve sağlıkla ilgili endişeleri temsil eder.',finance:'⚠️ Sağlık sigortası ve acil fon için tasarruf yap.'},
];

// ─── KALORİ VERİTABANI ────────────────────────────────────────────────────────
export const CALORIE_DB: {name:string; emoji:string; calories:number; unit:string; category:string; price:number}[] = [
  // Kahvaltı
  {name:'Yumurta (haşlanmış)',emoji:'🥚',calories:78,unit:'1 adet',category:'Kahvaltı',price:4},
  {name:'Yumurta (omlet 2 yumurta)',emoji:'🍳',calories:180,unit:'1 porsiyon',category:'Kahvaltı',price:8},
  {name:'Menemen (2 yumurta)',emoji:'🍅',calories:220,unit:'1 porsiyon',category:'Kahvaltı',price:25},
  {name:'Beyaz peynir',emoji:'🧀',calories:75,unit:'30g',category:'Kahvaltı',price:8},
  {name:'Ekmek (beyaz)',emoji:'🍞',calories:80,unit:'1 dilim',category:'Kahvaltı',price:2},
  {name:'Ekmek (tam tahıl)',emoji:'🥖',calories:70,unit:'1 dilim',category:'Kahvaltı',price:3},
  {name:'Tereyağı',emoji:'🧈',calories:102,unit:'1 çay kaşığı',category:'Kahvaltı',price:3},
  {name:'Reçel',emoji:'🍓',calories:50,unit:'1 çay kaşığı',category:'Kahvaltı',price:2},
  {name:'Bal',emoji:'🍯',calories:64,unit:'1 çay kaşığı',category:'Kahvaltı',price:5},
  {name:'Simit',emoji:'🥯',calories:280,unit:'1 adet',category:'Kahvaltı',price:12},
  {name:'Poğaça (peynirli)',emoji:'🥐',calories:320,unit:'1 adet',category:'Kahvaltı',price:20},
  // Öğle/Akşam
  {name:'Mercimek çorbası',emoji:'🍲',calories:130,unit:'1 kase',category:'Çorba',price:30},
  {name:'Tavuk çorbası',emoji:'🍜',calories:100,unit:'1 kase',category:'Çorba',price:35},
  {name:'Domates çorbası',emoji:'🍅',calories:80,unit:'1 kase',category:'Çorba',price:25},
  {name:'Pilav (beyaz pirinç)',emoji:'🍚',calories:200,unit:'1 kase (150g)',category:'Ana Yemek',price:15},
  {name:'Makarna (sade)',emoji:'🍝',calories:220,unit:'1 porsiyon',category:'Ana Yemek',price:20},
  {name:'Tavuk göğsü (ızgara)',emoji:'🍗',calories:165,unit:'150g',category:'Ana Yemek',price:60},
  {name:'Köfte (ızgara, 4 adet)',emoji:'🥩',calories:280,unit:'4 adet',category:'Ana Yemek',price:70},
  {name:'Kuru fasulye',emoji:'🫘',calories:175,unit:'1 kase',category:'Ana Yemek',price:20},
  {name:'Nohut yemeği',emoji:'🥘',calories:180,unit:'1 kase',category:'Ana Yemek',price:18},
  {name:'İmam bayıldı',emoji:'🍆',calories:140,unit:'1 porsiyon',category:'Ana Yemek',price:25},
  {name:'Tavuk döner',emoji:'🌯',calories:350,unit:'1 porsiyon',category:'Fast Food',price:120},
  {name:'Lahmacun',emoji:'🫓',calories:220,unit:'1 adet',category:'Fast Food',price:40},
  {name:'Pide (kaşarlı)',emoji:'🍕',calories:400,unit:'1 adet',category:'Fast Food',price:70},
  {name:'Hamburger',emoji:'🍔',calories:450,unit:'1 adet',category:'Fast Food',price:130},
  // Ara Öğün/Meyve
  {name:'Elma',emoji:'🍎',calories:95,unit:'1 orta boy',category:'Meyve',price:5},
  {name:'Muz',emoji:'🍌',calories:105,unit:'1 adet',category:'Meyve',price:5},
  {name:'Portakal',emoji:'🍊',calories:62,unit:'1 adet',category:'Meyve',price:4},
  {name:'Üzüm',emoji:'🍇',calories:104,unit:'100g',category:'Meyve',price:15},
  {name:'Çilek',emoji:'🍓',calories:50,unit:'100g',category:'Meyve',price:20},
  // Atıştırmalık
  {name:'Ceviz',emoji:'🌰',calories:185,unit:'30g',category:'Atıştırmalık',price:15},
  {name:'Badem',emoji:'🥜',calories:170,unit:'30g',category:'Atıştırmalık',price:20},
  {name:'Çikolata (sütlü)',emoji:'🍫',calories:150,unit:'30g',category:'Atıştırmalık',price:15},
  {name:'Bisküvi (5 adet)',emoji:'🍪',calories:100,unit:'5 adet',category:'Atıştırmalık',price:5},
  // İçecek
  {name:'Çay (şekersiz)',emoji:'🍵',calories:2,unit:'1 bardak',category:'İçecek',price:3},
  {name:'Türk kahvesi',emoji:'☕',calories:12,unit:'1 fincan',category:'İçecek',price:20},
  {name:'Ayran',emoji:'🥛',calories:65,unit:'1 bardak',category:'İçecek',price:10},
  {name:'Portakal suyu',emoji:'🍊',calories:112,unit:'1 bardak (250ml)',category:'İçecek',price:20},
  {name:'Kola/gazlı içecek',emoji:'🥤',calories:140,unit:'1 kutu (330ml)',category:'İçecek',price:25},
  {name:'Su',emoji:'💧',calories:0,unit:'1 bardak',category:'İçecek',price:0},
  // Salata
  {name:'Çoban salatası',emoji:'🥗',calories:80,unit:'1 porsiyon',category:'Salata',price:30},
  {name:'Yeşil salata',emoji:'🥬',calories:50,unit:'1 porsiyon',category:'Salata',price:25},
  {name:'Cacık',emoji:'🫙',calories:90,unit:'1 kase',category:'Salata',price:20},
  // Tatlı
  {name:'Baklava (1 dilim)',emoji:'🍮',calories:330,unit:'1 dilim',category:'Tatlı',price:35},
  {name:'Kadayıf',emoji:'🍯',calories:280,unit:'1 porsiyon',category:'Tatlı',price:30},
  {name:'Sütlaç',emoji:'🍚',calories:180,unit:'1 kase',category:'Tatlı',price:25},
  {name:'Dondurma',emoji:'🍦',calories:207,unit:'1 top',category:'Tatlı',price:25},
  {name:'Sucuk (ızgara)',emoji:'🌭',calories:180,unit:'3 dilim',category:'Kahvaltı',price:15},
  {name:'Gözleme',emoji:'🫓',calories:350,unit:'1 adet',category:'Kahvaltı',price:35},
  {name:'Ezogelin çorbası',emoji:'🍲',calories:145,unit:'1 kase',category:'Çorba',price:28},
  {name:'Mantı',emoji:'🥟',calories:350,unit:'1 porsiyon',category:'Ana Yemek',price:60},
  {name:'Balık ızgara',emoji:'🐟',calories:200,unit:'150g',category:'Ana Yemek',price:90},
  {name:'Karnıyarık',emoji:'🍆',calories:280,unit:'1 porsiyon',category:'Ana Yemek',price:35},
  {name:'Tost',emoji:'🥪',calories:280,unit:'1 adet',category:'Fast Food',price:45},
  {name:'Köfte ekmek',emoji:'🌮',calories:380,unit:'1 adet',category:'Fast Food',price:50},
  {name:'Karpuz',emoji:'🍉',calories:85,unit:'2 dilim',category:'Meyve',price:10},
  {name:'Kiraz',emoji:'🍒',calories:97,unit:'100g',category:'Meyve',price:25},
  {name:'Künefe',emoji:'🧇',calories:420,unit:'1 porsiyon',category:'Tatlı',price:50},
];

// ─── BÜTÇE YEMEĞİ ÖNERİLERİ ──────────────────────────────────────────────────
const BUDGET_MENUS: {maxBudget:number; name:string; emoji:string; items:{food:string;price:number}[]; totalCal:number}[] = [
  {
    maxBudget:50,
    name:'Ekonomik Menü',
    emoji:'💚',
    items:[
      {food:'Mercimek çorbası',price:30},
      {food:'Ekmek (2 dilim)',price:4},
      {food:'Ayran',price:10},
    ],
    totalCal:302,
  },
  {
    maxBudget:100,
    name:'Orta Bütçe Menü',
    emoji:'💛',
    items:[
      {food:'Pilav + Kuru fasulye',price:35},
      {food:'Çoban salatası',price:30},
      {food:'Ayran',price:10},
      {food:'Ekmek',price:4},
    ],
    totalCal:480,
  },
  {
    maxBudget:150,
    name:'Dengeli Menü',
    emoji:'🔵',
    items:[
      {food:'Tavuk göğsü ızgara',price:60},
      {food:'Pilav',price:15},
      {food:'Yeşil salata',price:25},
      {food:'Çay',price:3},
    ],
    totalCal:417,
  },
  {
    maxBudget:200,
    name:'Tam Menü',
    emoji:'🟣',
    items:[
      {food:'Mercimek çorbası',price:30},
      {food:'Köfte ızgara',price:70},
      {food:'Pilav',price:15},
      {food:'Çoban salatası',price:30},
      {food:'Ayran',price:10},
    ],
    totalCal:765,
  },
  {
    maxBudget:300,
    name:'Premium Menü',
    emoji:'🌟',
    items:[
      {food:'Tavuk çorbası',price:35},
      {food:'Köfte ızgara (4 adet)',price:70},
      {food:'Pilav',price:15},
      {food:'Çoban salatası',price:30},
      {food:'Sütlaç',price:25},
      {food:'Ayran',price:10},
    ],
    totalCal:933,
  },
];

export const FOOD_CATEGORIES = Array.from(new Set(CALORIE_DB.map(food => food.category)));

export function getBudgetMenus(budget:number) {
  const suitable = BUDGET_MENUS.filter(m=>m.maxBudget<=budget);
  if(suitable.length===0 && budget>=20) {
    return [{maxBudget:30,name:'Mini Menü',emoji:'💚',items:[{food:'Ekmek (2 dilim)',price:4},{food:'Çay',price:3},{food:'Beyaz peynir',price:8}],totalCal:152}];
  }
  return suitable.slice(-3);
}

// ─── QUIZ VERİSİ ──────────────────────────────────────────────────────────────
export const QUIZZES:Record<QuizMode,{title:string;icon:string;color:string;desc:string;questions:{text:string;yes:number;no:number}[]}> = {
  fakir:{
    title:'💸 Fakirmetre',icon:'💸',color:'#ef4444',
    desc:'Finansal durumunu klasik Fakirmetre sorularıyla ölç.',
    questions:[
      {text:'Markete girince önce fiyat etiketine bakıyor musun?',yes:10,no:0},
      {text:'Ay sonuna gelmeden hesap alarm vermeye başlıyor mu?',yes:14,no:0},
      {text:'Kargo ücreti yüzünden siparişten vazgeçtiğin oluyor mu?',yes:8,no:0},
      {text:'İndirim görünce ihtiyacın olmasa da ilgini çekiyor mu?',yes:7,no:0},
      {text:'Kafede fiyat listesi görünce içten içe sarsılıyor musun?',yes:11,no:0},
      {text:'Arkadaş "hesabı bölüşelim" deyince rahatlıyor musun?',yes:10,no:0},
      {text:'Banka bildirimlerini açmaktan çekiniyor musun?',yes:11,no:0},
      {text:'Fatura günleri yaklaştığında için sıkışıyor mu?',yes:12,no:0},
      {text:'Dışarıda yemek yedikten sonra "evde yeseydim keşke" diyor musun?',yes:9,no:0},
      {text:'Para yüzünden uyku sorunun olduğu günler oluyor mu?',yes:13,no:0},
      {text:'Restoran menüsünde önce fiyata mı bakıyorsun?',yes:10,no:0},
      {text:'Ay ortasında bu ay kötü geçiyor dediğin oluyor mu?',yes:12,no:0},
    ],
  },
  tasarruf:{
    title:'🏦 Tasarruf',icon:'🏦',color:'#22c55e',
    desc:'Ne kadar iyi tasarruf ediyorsun?',
    questions:[
      {text:'Her ay düzenli birikim yapıyor musun?',yes:0,no:12},
      {text:'Maaş gelince önce tasarruf kısmını ayırıyor musun?',yes:0,no:10},
      {text:'Acil durum fonu oluşturmuş musun?',yes:0,no:14},
      {text:'Son 3 ayda büyük bir plansız harcama yaptın mı?',yes:12,no:0},
      {text:'Bütçe takibi yapıyor musun?',yes:0,no:10},
      {text:'Alışveriş öncesi liste hazırlıyor musun?',yes:0,no:9},
      {text:'"Bir dahaki maaşa kalır" dediğin harcamalar var mı?',yes:11,no:0},
      {text:'Son ayda bütçeni aştın mı?',yes:13,no:0},
      {text:'Düzenli yatırım yapıyor musun?',yes:0,no:12},
      {text:'Kredi kartı borcunu her ay tam ödüyor musun?',yes:0,no:11},
    ],
  },
  harcama:{
    title:'🛍️ Harcama',icon:'🛍️',color:'#f97316',
    desc:'Harcama alışkanlıklarını keşfet.',
    questions:[
      {text:'İndirim bildirimi gelince hemen bakıyor musun?',yes:9,no:0},
      {text:'"Kendini ödüllendirmek" için harcama yapıyor musun?',yes:12,no:0},
      {text:'Arkadaşlarla dışarı çıkınca harcamak kolay geliyor mu?',yes:10,no:0},
      {text:'Mağazaya girince planlı olmayan şeyler alıyor musun?',yes:11,no:0},
      {text:'Kredi kartı limitini bazen aşıyor musun?',yes:14,no:0},
      {text:'Online alışveriş uygulamaları telefonunda açık mı?',yes:8,no:0},
      {text:'Pahalı ama "kaliteli" ürünlere yönelme eğilimindesin?',yes:8,no:0},
    ],
  },
  risk:{
    title:'⚠️ Risk',icon:'⚠️',color:'#8b5cf6',
    desc:'Mali risk eşiğini ölç.',
    questions:[
      {text:'Borç almak seni çok rahatsız ediyor mu?',yes:0,no:10},
      {text:'Ani gelir kaybında 3 ay yaşayacak birikim var mı?',yes:0,no:14},
      {text:'Yüksek getiri için yüksek risk alabilir misin?',yes:12,no:0},
      {text:'Piyasa dalgalanmaları seni endişelendiriyor mu?',yes:0,no:9},
      {text:'Tüm birikimini tek yere yatırır mısın?',yes:11,no:0},
      {text:'Son 6 ayda planlanmamış büyük harcama yaptın mı?',yes:10,no:0},
      {text:'Sigorta ve güvence konularında eksiğin var mı?',yes:9,no:0},
    ],
  },
};

export const DAILY_QUOTES=['Bir adım tasarruf, bir adım özgürlüktür.','Paranı yönetmezsen, o seni yönetir.','Bugünün disiplini yarının huzurudur.','Az harcamak eksiklik değil, bilinçtir.','Gerçek zenginlik bazen ihtiyaç duymamaktır.','Küçük birikimler büyük rahatlık doğurur.','Harcamayı değil dengeyi büyüt.'];
export const DAILY_CHALLENGES=['Bugün dışarıdan kahve alma!','Bugün sepete hiçbir şey ekleme.','Bugün yalnızca listeyle alışveriş yap.','Bugün bir harcamanı not et.','Bugün gereksiz bir aboneliği iptal et.'];
export const DAILY_REWARDS=[50,30,40,25,60,35,45];

export const getDailyQuote=()=>DAILY_QUOTES[new Date().getDate()%DAILY_QUOTES.length];
export const getDailyChallenge=()=>DAILY_CHALLENGES[new Date().getDate()%DAILY_CHALLENGES.length];
export const getDailyReward=()=>DAILY_REWARDS[new Date().getDate()%DAILY_REWARDS.length];
export const today=()=>new Date().toDateString();
export const profileLevel=(xp:number)=>Math.floor(xp/XP_PER_LEVEL)+1;
export const xpProgress=(xp:number)=>xp%XP_PER_LEVEL;

export function getResult(score:number,maxScore:number){
  const p=(score/(maxScore||1))*100;
  if(p<=18) return {title:'Ekonomik Usta',emoji:'😎',color:'#22c55e',level:'Seviye 1',desc:'Harcamalarını kontrollü yönetiyorsun.',advice:'Küçük birikim hedefleri ekle.',power:92};
  if(p<=38) return {title:'Dengeli Harcayan',emoji:'🙂',color:'#eab308',level:'Seviye 2',desc:'Kontrol sende ama küçük kaçaklar var.',advice:'Plansız harcamaları kıs.',power:71};
  if(p<=58) return {title:'Orta Risk',emoji:'🥲',color:'#f97316',level:'Seviye 3',desc:'Bütçe zorlanmaya başladı.',advice:'Haftalık limit belirle.',power:48};
  if(p<=78) return {title:'Riskli Bölge',emoji:'😵',color:'#ef4444',level:'Seviye 4',desc:'Fakirmetre güçlü sinyal veriyor.',advice:'Abonelikleri gözden geçir.',power:28};
  return {title:'Kritik Seviye',emoji:'💸',color:'#dc2626',level:'Seviye 5',desc:'Cüzdan dinlenmek istiyor.',advice:'Sadece zorunlu harcama yap.',power:12};
}


