#!/bin/bash
# ╔══════════════════════════════════════════════════════════╗
# ║   Fakirmetre — Kapsamlı Güncelleme                      ║
# ║   Termux: bash guncelle.sh                              ║
# ╚══════════════════════════════════════════════════════════╝

set -e
cd ~/Fakirmetre
echo "🚀 Güncelleme başlıyor..."

# ══════════════════════════════════════════════════════════════
# 1. core.ts — Daha fazla soru + daha fazla yemek
# ══════════════════════════════════════════════════════════════
python3 - << 'PYEOF'
with open('src/core.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# ── Fakir quiz'e yeni sorular ekle ───────────────────────────
OLD_FAKIR_Q = "      {text:'Para yüzünden uyku sorunun olduğu günler oluyor mu?',yes:13,no:0},\n    ],"
NEW_FAKIR_Q = """      {text:'Para yüzünden uyku sorunun olduğu günler oluyor mu?',yes:13,no:0},
      {text:'Restoran menüsünde önce fiyata mı bakıyorsun?',yes:10,no:0},
      {text:'Yakın arkadaşınla hesabı tam bölersin değil mi?',yes:8,no:0},
      {text:'İkinci el ürün almayı düşünüyor musun?',yes:7,no:0},
      {text:'Aboneliklerini sorgulayıp iptal ettiğin oldu mu?',yes:9,no:0},
      {text:'Fatura geldiğinde önce toplamı mı yoksa detayı mı kontrol edersin?',yes:11,no:0},
      {text:'Alışverişte indirimli ürünleri tercih ediyor musun?',yes:8,no:0},
      {text:'Ay ortasında \"bu ay kötü geçiyor\" dediğin oluyor mu?',yes:12,no:0},
    ],"""
content = content.replace(OLD_FAKIR_Q, NEW_FAKIR_Q)

# ── Tasarruf quiz'e yeni sorular ekle ────────────────────────
OLD_TAS_Q = "      {text:'Son ayda bütçeni aştın mı?',yes:13,no:0},\n    ],"
NEW_TAS_Q = """      {text:'Son ayda bütçeni aştın mı?',yes:13,no:0},
      {text:'Düzenli yatırım yapıyor musun?',yes:0,no:12},
      {text:'Gelirinle orantılı yaşıyor musun?',yes:0,no:10},
      {text:'Kredi kartı borcunu her ay tam ödüyor musun?',yes:0,no:11},
      {text:'Gelecek ay için bütçe planı yapıyor musun?',yes:0,no:9},
      {text:'Gereksiz aboneliklerini iptal ettin mi?',yes:0,no:8},
    ],"""
content = content.replace(OLD_TAS_Q, NEW_TAS_Q)

# ── Harcama quiz'e yeni sorular ekle ─────────────────────────
OLD_HAR_Q = "      {text:'Pahalı ama \"kaliteli\" ürünlere yönelme eğilimindesin?',yes:8,no:0},\n    ],"
NEW_HAR_Q = """      {text:'Pahalı ama \"kaliteli\" ürünlere yönelme eğilimindesin?',yes:8,no:0},
      {text:'Giysi satın alırken fiyatı ikinci planda bırakıyor musun?',yes:9,no:0},
      {text:'Sosyal medyada gördüğün ürünleri hemen almak istiyor musun?',yes:11,no:0},
      {text:'Doğum günü hediyelerinde bütçe koyuyor musun?',yes:7,no:0},
      {text:'Alışveriş listesi yapmadan markete giriyor musun?',yes:10,no:0},
      {text:'Tatile çıkınca fazla harcadığını hissediyor musun?',yes:9,no:0},
    ],"""
content = content.replace(OLD_HAR_Q, NEW_HAR_Q)

# ── Risk quiz'e yeni sorular ekle ────────────────────────────
OLD_RISK_Q = "      {text:'Sigorta ve güvence konularında eksiğin var mı?',yes:9,no:0},\n    ],"
NEW_RISK_Q = """      {text:'Sigorta ve güvence konularında eksiğin var mı?',yes:9,no:0},
      {text:'Emeklilik için birikim planın var mı?',yes:0,no:12},
      {text:'Birden fazla gelir kaynağın var mı?',yes:0,no:10},
      {text:'Ani masraflar için para kenara koyuyor musun?',yes:0,no:11},
      {text:'Borçların gelirinin %40\'ını aşıyor mu?',yes:13,no:0},
    ],"""
content = content.replace(OLD_RISK_Q, NEW_RISK_Q)

# ── Yeni yemekler ekle ────────────────────────────────────────
OLD_FOOD_END = "  {name:'Dondurma',emoji:'🍦',calories:207,unit:'1 top',category:'Tatlı',price:25},\n];"
NEW_FOOD_END = """  {name:'Dondurma',emoji:'🍦',calories:207,unit:'1 top',category:'Tatlı',price:25},
  // Kahvaltı ek
  {name:'Sucuk (ızgara)',emoji:'🌭',calories:180,unit:'3 dilim',category:'Kahvaltı',price:15},
  {name:'Pastırmalı yumurta',emoji:'🍳',calories:250,unit:'1 porsiyon',category:'Kahvaltı',price:35},
  {name:'Kaymaklı bal',emoji:'🍯',calories:120,unit:'1 porsiyon',category:'Kahvaltı',price:30},
  {name:'Börek (ıspanaklı)',emoji:'🥐',calories:280,unit:'1 dilim',category:'Kahvaltı',price:25},
  {name:'Gözleme (peynirli)',emoji:'🫓',calories:350,unit:'1 adet',category:'Kahvaltı',price:35},
  // Çorba ek
  {name:'Ezogelin çorbası',emoji:'🍲',calories:145,unit:'1 kase',category:'Çorba',price:28},
  {name:'İşkembe çorbası',emoji:'🥣',calories:160,unit:'1 kase',category:'Çorba',price:40},
  {name:'Yayla çorbası',emoji:'🍜',calories:120,unit:'1 kase',category:'Çorba',price:30},
  {name:'Tarhana çorbası',emoji:'🫙',calories:110,unit:'1 kase',category:'Çorba',price:25},
  // Ana yemek ek
  {name:'Karnıyarık',emoji:'🍆',calories:280,unit:'1 porsiyon',category:'Ana Yemek',price:35},
  {name:'Dolma (yaprak)',emoji:'🌿',calories:220,unit:'1 porsiyon',category:'Ana Yemek',price:40},
  {name:'Et sote',emoji:'🥩',calories:320,unit:'1 porsiyon',category:'Ana Yemek',price:80},
  {name:'Tavuk kanat',emoji:'🍗',calories:290,unit:'4 adet',category:'Ana Yemek',price:65},
  {name:'Balık (ızgara)',emoji:'🐟',calories:200,unit:'150g',category:'Ana Yemek',price:90},
  {name:'Mantı',emoji:'🥟',calories:350,unit:'1 porsiyon',category:'Ana Yemek',price:60},
  {name:'Ispanaklı börek',emoji:'🥬',calories:260,unit:'1 dilim',category:'Ana Yemek',price:30},
  // Fast Food ek
  {name:'Köfte ekmek',emoji:'🌮',calories:380,unit:'1 adet',category:'Fast Food',price:50},
  {name:'Dürüm (tavuk)',emoji:'🌯',calories:400,unit:'1 adet',category:'Fast Food',price:90},
  {name:'Pizza dilimi',emoji:'🍕',calories:285,unit:'1 dilim',category:'Fast Food',price:60},
  {name:'Tost',emoji:'🥪',calories:280,unit:'1 adet',category:'Fast Food',price:45},
  {name:'Patates kızartması',emoji:'🍟',calories:365,unit:'1 porsiyon',category:'Fast Food',price:40},
  {name:'Midye dolma',emoji:'🦪',calories:60,unit:'1 adet',category:'Fast Food',price:8},
  // Meyve ek
  {name:'Karpuz',emoji:'🍉',calories:85,unit:'2 dilim',category:'Meyve',price:10},
  {name:'Kavun',emoji:'🍈',calories:64,unit:'2 dilim',category:'Meyve',price:10},
  {name:'Kiraz',emoji:'🍒',calories:97,unit:'100g',category:'Meyve',price:25},
  {name:'Şeftali',emoji:'🍑',calories:58,unit:'1 adet',category:'Meyve',price:8},
  {name:'Armut',emoji:'🍐',calories:57,unit:'1 adet',category:'Meyve',price:6},
  {name:'Mandalina',emoji:'🍊',calories:47,unit:'1 adet',category:'Meyve',price:4},
  // İçecek ek
  {name:'Limonata (ev yapımı)',emoji:'🍋',calories:45,unit:'1 bardak',category:'İçecek',price:15},
  {name:'Salep',emoji:'☕',calories:180,unit:'1 bardak',category:'İçecek',price:35},
  {name:'Neskafe',emoji:'☕',calories:15,unit:'1 fincan',category:'İçecek',price:25},
  {name:'Meyve suyu (kutu)',emoji:'🧃',calories:130,unit:'1 kutu',category:'İçecek',price:15},
  {name:'Kefir',emoji:'🥛',calories:100,unit:'1 bardak',category:'İçecek',price:20},
  {name:'Bitki çayı',emoji:'🌿',calories:5,unit:'1 bardak',category:'İçecek',price:10},
  // Tatlı ek
  {name:'Tulumba',emoji:'🍩',calories:240,unit:'3 adet',category:'Tatlı',price:25},
  {name:'Lokum',emoji:'🍬',calories:110,unit:'3 adet',category:'Tatlı',price:15},
  {name:'Helva',emoji:'🍮',calories:320,unit:'1 dilim',category:'Tatlı',price:20},
  {name:'Profiterol',emoji:'🍰',calories:380,unit:'1 porsiyon',category:'Tatlı',price:45},
  {name:'Künefe',emoji:'🧇',calories:420,unit:'1 porsiyon',category:'Tatlı',price:50},
  // Salata ek
  {name:'Ton balıklı salata',emoji:'🥗',calories:180,unit:'1 porsiyon',category:'Salata',price:60},
  {name:'Mevsim salatası',emoji:'🥬',calories:60,unit:'1 porsiyon',category:'Salata',price:30},
  {name:'Patates salatası',emoji:'🥔',calories:200,unit:'1 porsiyon',category:'Salata',price:25},
  // Atıştırmalık ek
  {name:'Mısır cipsi',emoji:'🍿',calories:155,unit:'30g',category:'Atıştırmalık',price:12},
  {name:'Fıstık (kavrulmuş)',emoji:'🥜',calories:166,unit:'30g',category:'Atıştırmalık',price:12},
  {name:'Kuru üzüm',emoji:'🍇',calories:129,unit:'30g',category:'Atıştırmalık',price:8},
  {name:'Gofret',emoji:'🍫',calories:140,unit:'1 adet',category:'Atıştırmalık',price:8},
  {name:'Peynirli kraker',emoji:'🧀',calories:120,unit:'5 adet',category:'Atıştırmalık',price:10},
];"""
content = content.replace(OLD_FOOD_END, NEW_FOOD_END)

with open('src/core.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("✅ core.ts güncellendi (sorular + yemekler)")
PYEOF

# ══════════════════════════════════════════════════════════════
# 2. App.tsx — Titan kaldır + yazı büyüt + popup + accordion
# ══════════════════════════════════════════════════════════════
python3 - << 'PYEOF'
with open('App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# ── "Titan" yazısını kaldır ───────────────────────────────────
content = content.replace('Fakirmetre Titan v5.0', 'Fakirmetre')
content = content.replace('Fakirmetre Titan', 'Fakirmetre')
content = content.replace('FakirmetreTitan', 'Fakirmetre')
content = content.replace('#FakirmetreTitan', '#Fakirmetre')
content = content.replace('AI · Premium · Turnuva · Cloud · XP', 'Gelir & Gider · AI · Quiz · Astro')

# ── Yazı boyutlarını büyüt ────────────────────────────────────
# sectionTitle: 17 → 19
content = content.replace('sectionTitle:{fontSize:17,fontWeight:', 'sectionTitle:{fontSize:19,fontWeight:')
# tabLabel: 9 → 11
content = content.replace("tabLabel:{fontSize:9,fontWeight:'800'}", "tabLabel:{fontSize:11,fontWeight:'800'}")
# heroTitle: 24 → 27
content = content.replace('heroTitle:{textAlign:\'center\',fontSize:24,fontWeight:\'900\'}',
                           'heroTitle:{textAlign:\'center\',fontSize:27,fontWeight:\'900\'}')
# appTitle: 20 → 22
content = content.replace('appTitle:{fontSize:20,fontWeight:\'900\'',
                           'appTitle:{fontSize:22,fontWeight:\'900\'')
# GlassCard içi genel metin büyüt: fontSize:13 → 14, fontSize:12 → 13
# (sadece kart içi açıklama metinleri için inline style'larda)
content = content.replace(',fontSize:13,color:colors.subText}', ',fontSize:14,color:colors.subText}')
content = content.replace(',fontSize:12,color:colors.subText}', ',fontSize:13,color:colors.subText}')

# ── Popup bileşenini App fonksiyonunun içine ekle ─────────────
# useState'lerin hemen arkasına welcomePopup state'i ekle
content = content.replace(
    "  const [appState,setAppState]=useState<AppState>('splash');",
    "  const [appState,setAppState]=useState<AppState>('splash');\n  const [welcomePopup,setWelcomePopup]=useState(false);"
)

# handleOnboardingDone'da popup'ı tetikle
content = content.replace(
    "const handleOnboardingDone=(p:Profile)=>{setProfile(p);setAppState('app');setTimeout(()=>setDailyRewardVisible(true),700);",
    "const handleOnboardingDone=(p:Profile)=>{setProfile(p);setAppState('app');setTimeout(()=>setWelcomePopup(true),800);setTimeout(()=>setDailyRewardVisible(true),700);"
)

# handleSplashDone içinde de popup göster (uygulama her açılışında)
content = content.replace(
    "      setAppState(data.settings.pinEnabled && data.settings.pinCode ? 'locked' : 'app');\n      handleDailyLogin();",
    "      setAppState(data.settings.pinEnabled && data.settings.pinCode ? 'locked' : 'app');\n      handleDailyLogin();\n      setTimeout(()=>setWelcomePopup(true),1200);"
)

# ── Popup bileşenini DailyRewardModal'ın hemen arkasına ekle ─
POPUP_JSX = """      {/* 🎯 Hoş Geldin Popup */}
      {welcomePopup&&<Modal transparent animationType="fade" visible onRequestClose={()=>setWelcomePopup(false)}><View style={[s.overlay,{backgroundColor:colors.overlay}]}><Animated.View style={{width:'88%',backgroundColor:colors.surface,borderRadius:28,borderWidth:1.5,borderColor:colors.primary,padding:24,alignItems:'center'}}><Text style={{fontSize:56,marginBottom:8}}>💸</Text><Text style={{fontSize:22,fontWeight:'900',color:colors.text,textAlign:'center',marginBottom:8}}>Fakirmetre'ye Hoş Geldin!</Text><Text style={{fontSize:15,color:colors.subText,textAlign:'center',lineHeight:22,marginBottom:20}}>Fakirlik skorunu öğrenmeye{'\n'}hazır mısın? 😅</Text><TouchableOpacity onPress={()=>{setWelcomePopup(false);setActiveTab('quiz');}} style={[s.mainBtn,{backgroundColor:colors.primary,width:'100%',marginBottom:10}]}><Text style={s.mainBtnTxt}>🎯 Skor Oluştur!</Text></TouchableOpacity><TouchableOpacity onPress={()=>setWelcomePopup(false)}><Text style={{fontSize:13,color:colors.subText}}>Şimdi değil</Text></TouchableOpacity></Animated.View></View></Modal>}
"""

content = content.replace(
    "      <DailyRewardModal visible={dailyRewardVisible}",
    POPUP_JSX + "      <DailyRewardModal visible={dailyRewardVisible}"
)

# ── Ayarlar'da accordion (çekme) yapısı — GlassCard başlıkları tıklanabilir yap ─
# renderSettings içindeki "Görünüm" kartını accordion'a çevir
# Bunun için useState'lere accordion state ekle
content = content.replace(
    "  const [pinSetupVisible,setPinSetupVisible]=useState(false);",
    "  const [pinSetupVisible,setPinSetupVisible]=useState(false);\n  const [accordionOpen,setAccordionOpen]=useState<Record<string,boolean>>({gorunum:true,icerik:false,profil:false,guvenlik:false,araclar:false});\n  const toggleAccordion=(key:string)=>setAccordionOpen(prev=>({...prev,[key]:!prev[key]}));"
)

# renderSettings içindeki GlassCard'lara tıklanabilir başlık ekle
# "Görünüm" kartını accordion yap
content = content.replace(
    "      <GlassCard colors={colors}>\n        <Text style={[s.sectionTitle,{color:colors.text}]}>🎨 Görünüm</Text>",
    "      <GlassCard colors={colors}>\n        <TouchableOpacity onPress={()=>toggleAccordion('gorunum')} style={s.rowBetween}><Text style={[s.sectionTitle,{color:colors.text,marginBottom:0}]}>🎨 Görünüm</Text><Text style={{color:colors.primary,fontSize:18}}>{accordionOpen.gorunum?'▲':'▼'}</Text></TouchableOpacity>\n        {accordionOpen.gorunum&&<>"
)
content = content.replace(
    "        </View>\n      </GlassCard>\n      <GlassCard colors={colors} delay={50}>\n        <Text style={[s.sectionTitle,{color:colors.text}]}>📋 İçerik</Text>",
    "        </View>\n        </>}\n      </GlassCard>\n      <GlassCard colors={colors} delay={50}>\n        <TouchableOpacity onPress={()=>toggleAccordion('icerik')} style={s.rowBetween}><Text style={[s.sectionTitle,{color:colors.text,marginBottom:0}]}>📋 İçerik</Text><Text style={{color:colors.primary,fontSize:18}}>{accordionOpen.icerik?'▲':'▼'}</Text></TouchableOpacity>\n        {accordionOpen.icerik&&<>"
)
content = content.replace(
    "        ))}\n      </GlassCard>\n      <GlassCard colors={colors} delay={90}>\n        <Text style={[s.sectionTitle,{color:colors.text}]}>👤 Profil Düzenle</Text>",
    "        ))}\n        </>}\n      </GlassCard>\n      <GlassCard colors={colors} delay={90}>\n        <TouchableOpacity onPress={()=>toggleAccordion('profil')} style={s.rowBetween}><Text style={[s.sectionTitle,{color:colors.text,marginBottom:0}]}>👤 Profil Düzenle</Text><Text style={{color:colors.primary,fontSize:18}}>{accordionOpen.profil?'▲':'▼'}</Text></TouchableOpacity>\n        {accordionOpen.profil&&<>"
)
content = content.replace(
    "        </View>\n      </GlassCard>\n      <GlassCard colors={colors} delay={100}>\n        <Text style={[s.sectionTitle,{color:colors.text}]}>🔒 Güvenlik",
    "        </View>\n        </>}\n      </GlassCard>\n      <GlassCard colors={colors} delay={100}>\n        <TouchableOpacity onPress={()=>toggleAccordion('guvenlik')} style={s.rowBetween}><Text style={[s.sectionTitle,{color:colors.text,marginBottom:0}]}>🔒 Güvenlik"
)
content = content.replace(
    "        </TouchableOpacity>\n      </GlassCard>\n      <GlassCard colors={colors} delay={110}>\n        <Text style={[s.sectionTitle,{color:colors.text}]}>🔧 Araçlar</Text>",
    "        </TouchableOpacity>\n        </>}\n      </GlassCard>\n      <GlassCard colors={colors} delay={110}>\n        <TouchableOpacity onPress={()=>toggleAccordion('araclar')} style={s.rowBetween}><Text style={[s.sectionTitle,{color:colors.text,marginBottom:0}]}>🔧 Araçlar</Text><Text style={{color:colors.primary,fontSize:18}}>{accordionOpen.araclar?'▲':'▼'}</Text></TouchableOpacity>\n        {accordionOpen.araclar&&<>"
)
content = content.replace(
    "        ))}\n      </GlassCard>\n      <GlassCard colors={colors} delay={115}>\n        <Text style={[s.sectionTitle,{color:colors.text}]}>💼 Aylık Bütçe",
    "        ))}\n        </>}\n      </GlassCard>\n      <GlassCard colors={colors} delay={115}>\n        <Text style={[s.sectionTitle,{color:colors.text}]}>💼 Aylık Bütçe"
)

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("✅ App.tsx güncellendi")
PYEOF

echo ""
echo "════════════════════════════════════════"
echo "✅ Tüm güncellemeler tamamlandı!"
echo ""
echo "📋 Yapılan değişiklikler:"
echo "   • 'Titan' yazısı kaldırıldı → sadece 'Fakirmetre'"
echo "   • Tüm bölümlerde yazı boyutları büyütüldü"
echo "   • Uygulama açılışında 'Skor oluştur' popup'ı eklendi"
echo "   • Ayarlar bölümü accordion (çekme) yapısına döndürüldü"
echo "   • Fakir/Tasarruf/Harcama/Risk quizlerine yeni sorular eklendi"
echo "   • Mutfak'a 40+ yeni yemek eklendi"
echo ""
echo "🚀 Build:"
echo "   EAS_SKIP_AUTO_FINGERPRINT=1 eas build --platform android --profile preview"
echo "════════════════════════════════════════"
