#!/bin/bash
cd ~/Fakirmetre

python3 - << 'PYEOF'
with open('src/core.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# ── 1. Burç yorumlarına daha fazla detay ekle ─────────────────
# Her burç için günlük metinlere 2 yeni detaylı yorum ekle
OLD_KOC = """    Koç:[
      `${name}, bu ${timeOfDay} enerjin doruğa çıkıyor. Hızlı kararlar vermeden önce bir nefes al — özellikle para konularında dürtüsel hareket etme.`,
      `Mars'ın etkisiyle bugün liderlik enerjin yüksek. Bu gücü tasarruf hedeflerini belirlemek için kullan!`,
      `Ateş enerjisi bugün seni harcatabilir. Kredi kartını cebinde bırak, nakit kullan.`,
    ],"""
NEW_KOC = """    Koç:[
      `${name}, bu ${timeOfDay} enerjin doruğa çıkıyor. Hızlı kararlar vermeden önce bir nefes al — özellikle para konularında dürtüsel hareket etme. Mars'ın yönlendirmesiyle bugün cesur adımlar atabilirsin ama önce hesapla, sonra harekete geç.`,
      `Mars'ın etkisiyle bugün liderlik enerjin yüksek. Bu gücü tasarruf hedeflerini belirlemek için kullan! Koç burcu olarak doğal liderliğini finansal disipline yönlendir — bugün bir birikim planı oluştur ve ilk adımı at.`,
      `Ateş enerjisi bugün seni harcatabilir. Kredi kartını cebinde bırak, nakit kullan. Koç'un dürtüsel yanı en çok alışverişte kendini gösterir — bugün mağazaya girmeden önce 'gerçekten ihtiyacım var mı?' diye sor kendine.`,
      `${name}, bugün kararlılığın zirveye çıkıyor. Bu enerjiyi yeni bir finansal hedef belirlemek için kullan. Ay'ın Koç ile olan açısı maddi konularda cesur ama hesaplı adımlar atmaya teşvik ediyor.`,
    ],"""
content = content.replace(OLD_KOC, NEW_KOC)

OLD_BOGA = """    Boğa:[
      `${name}, Venüs'ün yönlendirmesiyle bugün kalite odaklısın. Ama 'kaliteli' ile 'pahalı'yı karıştırma!`,
      `Toprak elementi seni dengeli tutuyor. Uzun vadeli birikim planı yapmak için mükemmel bir ${timeOfDay}.`,
      `Alışverişe çıkmadan önce liste yaz — Boğa olarak bir kez mağazaya girdin mi, çıkmak zor.`,
    ],"""
NEW_BOGA = """    Boğa:[
      `${name}, Venüs'ün yönlendirmesiyle bugün kalite odaklısın. Ama 'kaliteli' ile 'pahalı'yı karıştırma! Boğa burcu olarak güzellik ve konfora yatırım yapma eğilimindesin — bu doğal ama bütçeni aşmadan tatmin yollarını bul.`,
      `Toprak elementi seni dengeli tutuyor. Uzun vadeli birikim planı yapmak için mükemmel bir ${timeOfDay}. Boğa'nın sabırlı doğası yatırımda büyük avantaj — acele etme, tutarlı biriktir.`,
      `Alışverişe çıkmadan önce liste yaz — Boğa olarak bir kez mağazaya girdin mi, çıkmak zor. Venüs etkisi bugün 'küçük bir şey alayım' düşüncesini 'büyük bir harcama'ya dönüştürebilir.`,
      `${name}, bugün maddi güvenlik ihtiyacın ön planda. Acil durum fonunu kontrol et ve eksikse güçlendirmeye başla. Boğa burcu için finansal güvenlik, her şeyin temelidir.`,
    ],"""
content = content.replace(OLD_BOGA, NEW_BOGA)

# Uyarı ve ipucu metinlerini zenginleştir
OLD_WARNINGS = """  const warnings:Record<ZodiacKey,string> = {
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
  };"""
NEW_WARNINGS = """  const warnings:Record<ZodiacKey,string> = {
    Koç:'⚠️ Dürtüsel alışveriş riski yüksek bugün. Sepete eklemeden önce 10 dakika bekle, vazgeçebilirsin. Kart yerine nakit kullanmak harcamayı azaltır.',
    Boğa:'⚠️ Lüks tuzağına düşebilirsin. Venüs etkisi güzel şeylere ilgiyi artırıyor — alışveriş merkezine girme, online mağazaları açma.',
    İkizler:'⚠️ Kararsızlık seni iki kez ödeme yaptırabilir. Hem online hem mağazadan aynı ürünü alma, bir karar ver ve kalıcı ol.',
    Yengeç:'⚠️ Duygusal harcama dönemi dikkatli ol. Üzgün veya mutlu olduğunda alışveriş yapmaktan kaçın — her ikisi de fazla harcatır.',
    Aslan:'⚠️ Gösteriş harcaması yapmaktan kaçın. Başkalarını etkilemek için harcama yapmak uzun vadede seni yorar ve bütçeni eritir.',
    Başak:'⚠️ Aşırı analiz felç edebilir harekete geç. En iyi fiyatı aramak iyidir ama sonsuz araştırma zamanını ve enerjini tüketir.',
    Terazi:'⚠️ Kararsızlık fırsat kaçırttırabilir. İki ürün arasında kalırsın, ikisini de alamazsın — ya ucuzu seç ya hiçbirini.',
    Akrep:'⚠️ Gizli borçlar gün yüzüne çıkabilir. Banka ekstresini dikkatle incele, fark etmediğin otomatik ödemeler veya abonelikler olabilir.',
    Yay:'⚠️ Spontane seyahat/eğlence harcaması riski var. Her çıkışta bütçe belirle ve o miktarı geçme — eğlencenin sonu pişmanlık olmasın.',
    Oğlak:'⚠️ Aşırı çalışma tükenmişliğe yol açabilir. Para kazanmak önemli ama sağlığını ve dinlenme zamanını feda etme.',
    Kova:'⚠️ Teknoloji harcamaları kontrolden çıkabilir. Her yeni gadget veya uygulama gerçek bir ihtiyaç mı, yoksa merak mı — önce sor.',
    Balık:'⚠️ Hayali bütçeyle gerçek alışveriş yapma. Gelecek ayı veya ikramiyeyi sayarak bugün harcama yapma alışkanlığından vazgeç.',
  };"""
content = content.replace(OLD_WARNINGS, NEW_WARNINGS)

OLD_TIPS = """  const tips:Record<ZodiacKey,string> = {
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
  };"""
NEW_TIPS = """  const tips:Record<ZodiacKey,string> = {
    Koç:'💡 Alışveriş listesi yap ve sadece listedekini al. Markete aç karınla gitme — bu dürtüsel alışverişin en büyük tetikleyicisi. Sepetini önceden doldur.',
    Boğa:'💡 İki ürün arasında kalırsan ucuzu seç. Genellikle kalite farkı düşündüğün kadar büyük değildir. Tasarruf ettiğin parayı birikime yönlendir.',
    İkizler:'💡 Karar vermeden önce 24 saat bekle. Özellikle online alışverişte: sepete ekle ama satın alma. Yarın bakınca %60 ihtimalle vazgeçersin.',
    Yengeç:'💡 Evde yemek pişir, dışarı çıkma. Haftalık bir menü planla, malzemeleri toplu al. Bu tek alışkanlık aylık 500-1000₺ tasarruf sağlar.',
    Aslan:'💡 Sosyal medyada gördüğün ürünleri sepete ekleme. Influencer reklamları seni hedef alıyor — reklam mı yoksa gerçek ihtiyaç mı olduğunu sorgula.',
    Başak:'💡 Gider tablosu çıkar, küçük kaçakları bul. Günlük 10₺ gereksiz harcama = aylık 300₺ = yılda 3600₺. Küçük kaçaklar büyük delikler açar.',
    Terazi:'💡 Bir tasarruf ve bir harcama hedefi belirle. Her ay belirli bir miktar biriktir, kalan kısımda serbestçe harca. Denge kurmak Terazi için en kolay yol.',
    Akrep:'💡 Tüm aboneliklerini listele, gereksizleri iptal et. Kullanmadığın Netflix, Spotify, dergi abonelikleri — her birini sorgula. Aylık 200-500₺ kurtarabilirsin.',
    Yay:'💡 Seyahat planını 3 ay önceden yap, fiyatlar düşük olsun. Last minute macera romantik gelir ama cüzdana zarar verir — planlamak özgürlüğü kısıtlamaz.',
    Oğlak:'💡 1 yıllık birikim hedefi belirle ve her ay takip et. Hedefini yaz, görünür bir yere koy. Oğlak burcu hedef belirleyince vazgeçmez — bu güçlü özelliğini kullan.',
    Kova:'💡 Otomatik tasarruf talimatı kur, elle aktarma. Maaş gelince önce %20 otomatik birikime gitsin. Görünmeyen para harcanmaz — sistemi kurduğunda unutursun.',
    Balık:'💡 Hayaller değil, somut rakamlarla bütçe yap. Aylık gelirini yaz, sabit giderleri çıkar, kalan ile harca. Sezgiyle değil, sayılarla karar ver.',
  };"""
content = content.replace(OLD_TIPS, NEW_TIPS)

# ── 2. Rüya tabiri metinlerini detaylandır ────────────────────
content = content.replace(
    "{keyword:'para',emoji:'💰',meaning:'Rüyada para görmek genellikle güç, özgüven ve değer algısıyla ilgilidir.',finance:'💡 Finansal bilinç yüksek. Birikim için olumlu bir dönemin başlangıcı olabilir.'}",
    "{keyword:'para',emoji:'💰',meaning:'Rüyada para görmek güç, özgüven ve değer algısıyla ilgilidir. Para bulmak beklenmedik fırsatları, para kaybetmek ise bir şeyi kaçırma korkusunu simgeler. Maddi kaygılar bilinçaltınızda yoğun olduğunda bu tür rüyalar sıklaşır.',finance:'💡 Finansal bilinciniz yüksek ve aktif. Bu rüya birikim yapmak için içsel bir hazırlık sinyali olabilir. Bugün bir tasarruf hedefi belirlemek için ideal zaman.'}"
)
content = content.replace(
    "{keyword:'altın',emoji:'🥇',meaning:'Altın rüyası kalıcı değerlere, güvenliğe ve bereket beklentisine işaret eder.',finance:'💡 Uzun vadeli yatırım için içsel bir hazırlık işareti olabilir.'}",
    "{keyword:'altın',emoji:'🥇',meaning:'Altın rüyası kalıcı değerlere, güvenliğe ve bereket beklentisine işaret eder. Altın bulmak büyük şans ve beklenmedik kazancı, altın takmak ise toplumsal statü ve başarı arzusunu yansıtır. Altın renginin parlaklığı rüyada ne kadar belirgindeyse, müjdesi o kadar güçlüdür.',finance:'💡 Uzun vadeli yatırım için içsel bir hazırlık işareti. Altın veya döviz gibi güvenli liman yatırımlarını araştırmak için uygun bir dönem. Aceleci karar vermeden, araştırarak ilerle.'}"
)
content = content.replace(
    "{keyword:'ev',emoji:'🏠',meaning:'Ev rüyası kimlik, güvenlik, aile ve temel ihtiyaçları simgeler.',finance:'💡 Ev ve konut odaklı tasarruf için içsel bir mesaj olabilir.'}",
    "{keyword:'ev',emoji:'🏠',meaning:'Ev rüyası kimlik, güvenlik, aile ve temel ihtiyaçları simgeler. Büyük ev görmek büyüme ve gelişme arzusunu, yıkılan ev ise hayatınızdaki köklü değişimlere işaret eder. Evin odaları ruhunuzun farklı bölümlerini temsil eder — karanlık oda bastırılmış duygular, aydınlık oda pozitif enerjinin simgesidir.',finance:'💡 Konut odaklı tasarruf için güçlü bir içsel mesaj. Ev sahibi olmayı düşünüyorsanız, peşinat planlamasına başlamak için bu rüya olumlu bir işaret. Kira mı yoksa satın alma mı kararını da bugün değerlendirebilirsiniz.'}"
)
content = content.replace(
    "{keyword:'su',emoji:'💧',meaning:'Su rüyası duygular, bilinçdışı ve değişimi temsil eder. Temiz su bereket işaretidir.',finance:'💡 Temiz su gördüysen finansal akış pozitif yönde ilerliyor.'}",
    "{keyword:'su',emoji:'💧',meaning:'Su rüyası duygular, bilinçdışı ve değişimi temsil eder. Temiz ve berrak su bolluk, sağlık ve ruhsal arınmanın; bulanık su ise belirsizlik ve duygusal karmaşanın işaretidir. Akarsu görmek hayatın akışına kapılmayı, durgun göl ise bir duraksama dönemini simgeler.',finance:'💡 Temiz su gördüyseniz finansal akış pozitif yönde ilerliyor. Bulanık su gördüyseniz maddi konularda netlik kazanmak için bekleyin, acele kararlar vermeyin. Akan su gelir artışına, kurur su ise tasarrufa işaret eder.'}"
)
content = content.replace(
    "{keyword:'ateş',emoji:'🔥',meaning:'Ateş rüyası tutku, dönüşüm ve enerji demektir. Kontrolsüz ateş uyarıdır.',finance:'⚠️ Duygusal kararlar değil, mantıklı finansal kararlar ver.'}",
    "{keyword:'ateş',emoji:'🔥',meaning:'Ateş rüyası tutku, dönüşüm ve yaratıcı enerjiyi simgeler. Kontrollü bir alevde ısınmak sıcaklık ve güvenliği, büyük yangın ise köklü bir değişimi ya da kontrolden çıkan durumları temsil eder. Ateşin rengi de önemlidir: altın sarısı bereket, kırmızı ateş tutku ve risk işaretidir.',finance:'⚠️ Duygusal ve anlık kararlar yerine mantıklı finansal kararlar verin. Büyük yangın gördüyseniz önemli bir finansal karar arifesinde olabilirsiniz — acele etmeden, danışarak ilerleyin.'}"
)

with open('src/core.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("✅ core.ts güncellendi (burç + rüya detayları)")

# ── 3. App.tsx — Sezon görevleri yuvarlak grafik ─────────────
with open('App.tsx', 'r', encoding='utf-8') as f:
    app = f.read()

OLD_SEASON = """        {seasonChallenges.slice(0,4).map((ch:SeasonChallenge)=>(
          <View key={ch.id} style={{marginBottom:10}}>
            <View style={s.rowBetween}>
              <View style={{flexDirection:'row',gap:8,alignItems:'center',flex:1}}>
                <Text style={{fontSize:16}}>{ch.icon}</Text>
                <View style={{flex:1}}><Text style={{fontSize:12,fontWeight:'900',color:ch.done?colors.success:colors.text}}>{ch.title}{ch.done?' ✓':''}</Text><Text style={{fontSize:10,color:colors.subText}}>{ch.desc}</Text></View>
              </View>
              <View style={[s.xpBadge,{backgroundColor:colors.primary+'22',borderColor:colors.primary}]}><Text style={{fontSize:10,fontWeight:'900',color:colors.primary}}>+{ch.xp}XP</Text></View>
            </View>
            <View style={{marginTop:4}}><AnimBar value={Math.min(100,(ch.current/ch.target)*100)} color={ch.done?colors.success:colors.primary} bg={colors.surfaceSoft} height={4}/></View>
            <Text style={{fontSize:9,color:colors.subText,marginTop:2}}>{ch.current}/{ch.target}</Text>
          </View>
        ))}"""

NEW_SEASON = """        {/* Yuvarlak grafik + liste */}
        <View style={{flexDirection:'row',flexWrap:'wrap',gap:10,justifyContent:'center',marginBottom:8}}>
          {seasonChallenges.slice(0,4).map((ch:SeasonChallenge)=>{
            const pct=Math.min(100,Math.round((ch.current/ch.target)*100));
            const r=28;
            const circ=2*Math.PI*r;
            const offset=circ*(1-pct/100);
            return (
              <View key={ch.id} style={{alignItems:'center',width:'22%'}}>
                <View style={{width:64,height:64,alignItems:'center',justifyContent:'center'}}>
                  <svg width="64" height="64" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r={r} fill="none" stroke={colors.surfaceSoft} strokeWidth="5"/>
                    <circle cx="32" cy="32" r={r} fill="none"
                      stroke={ch.done?colors.success:colors.primary}
                      strokeWidth="5"
                      strokeDasharray={circ}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                      transform="rotate(-90 32 32)"
                    />
                  </svg>
                  <View style={{position:'absolute',alignItems:'center'}}>
                    <Text style={{fontSize:16}}>{ch.icon}</Text>
                    <Text style={{fontSize:9,fontWeight:'900',color:ch.done?colors.success:colors.primary}}>{pct}%</Text>
                  </View>
                </View>
                <Text style={{fontSize:9,fontWeight:'800',color:ch.done?colors.success:colors.text,textAlign:'center',marginTop:4}}>{ch.title}{ch.done?' ✓':''}</Text>
                <Text style={{fontSize:8,color:colors.subText,textAlign:'center'}}>{ch.current}/{ch.target}</Text>
              </View>
            );
          })}
        </View>
        {seasonChallenges.slice(0,4).map((ch:SeasonChallenge)=>(
          <View key={ch.id+'bar'} style={{marginBottom:8}}>
            <View style={s.rowBetween}>
              <View style={{flexDirection:'row',gap:6,alignItems:'center',flex:1}}>
                <Text style={{fontSize:13}}>{ch.icon}</Text>
                <View style={{flex:1}}>
                  <Text style={{fontSize:11,fontWeight:'900',color:ch.done?colors.success:colors.text}}>{ch.title}{ch.done?' ✓':''}</Text>
                  <Text style={{fontSize:10,color:colors.subText}}>{ch.desc}</Text>
                </View>
              </View>
              <View style={[s.xpBadge,{backgroundColor:colors.primary+'22',borderColor:colors.primary}]}>
                <Text style={{fontSize:9,fontWeight:'900',color:colors.primary}}>+{ch.xp}XP</Text>
              </View>
            </View>
            <View style={{marginTop:4}}>
              <AnimBar value={Math.min(100,(ch.current/ch.target)*100)} color={ch.done?colors.success:colors.primary} bg={colors.surfaceSoft} height={6}/>
            </View>
          </View>
        ))}"""

app = app.replace(OLD_SEASON, NEW_SEASON)

# SVG import ekle (react-native-svg zaten kurulu)
if "import Svg" not in app and "from 'react-native-svg'" not in app:
    app = app.replace(
        "import * as Notifications from 'expo-notifications';",
        "import Svg, { Circle } from 'react-native-svg';\nimport * as Notifications from 'expo-notifications';"
    )
    # svg taglerini Svg bileşenleriyle değiştir
    app = app.replace('<svg ', '<Svg ')
    app = app.replace('</svg>', '</Svg>')
    app = app.replace('<circle ', '<Circle ')

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(app)
print("✅ App.tsx güncellendi (yuvarlak grafik)")
print("✅ Tüm değişiklikler tamamlandı!")
PYEOF
