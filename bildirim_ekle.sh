#!/bin/bash
cd ~/Fakirmetre

python3 - << 'PYEOF'
with open('App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# ── 1. Import ekle ────────────────────────────────────────────
content = content.replace(
    "import { loadPersistedAppData, resetPersistedAppData, savePersistedAppData } from './src/services/persistence';",
    """import { loadPersistedAppData, resetPersistedAppData, savePersistedAppData } from './src/services/persistence';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

// ── Bildirim davranışı ayarla ─────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ── Arka plan görev tanımla ───────────────────────────────────
const DAILY_REMINDER_TASK = 'DAILY_REMINDER';
TaskManager.defineTask(DAILY_REMINDER_TASK, async () => {
  return TaskManager.TaskManagerTaskResult.SUCCESS;
});"""
)

# ── 2. Bildirim izni + helper fonksiyonları ekle ─────────────
# useEffect'lerin bulunduğu yere, handleDailyLogin'den önce ekle
NOTIF_HELPERS = """
  // ── Push bildirim izni al ──────────────────────────────────
  useEffect(()=>{
    (async()=>{
      const {status:existing}=await Notifications.getPermissionsAsync();
      let finalStatus=existing;
      if(existing!=='granted'){
        const {status}=await Notifications.requestPermissionsAsync();
        finalStatus=status;
      }
      if(finalStatus!=='granted') return;
      if(Platform.OS==='android'){
        await Notifications.setNotificationChannelAsync('default',{
          name:'Fakirmetre',
          importance:Notifications.AndroidImportance.MAX,
          vibrationPattern:[0,250,250,250],
          lightColor:'#38bdf8',
        });
      }
    })();
  },[]);

  // ── Bildirim helper fonksiyonları ─────────────────────────
  const scheduleLocalNotif=async(title:string,body:string,seconds=1)=>{
    try{
      await Notifications.scheduleNotificationAsync({
        content:{title,body,sound:true,data:{type:'local'}},
        trigger:{seconds,channelId:'default'},
      });
    }catch(e){console.log('Bildirim hatası:',e);}
  };

  const scheduleDailyReminder=async()=>{
    try{
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.scheduleNotificationAsync({
        content:{
          title:'💸 Fakirmetre Hatırlatma',
          body:'Bugün harcamalarını kaydetmeyi unutma!',
          sound:true,
          data:{type:'daily'},
        },
        trigger:{
          hour:20,
          minute:0,
          repeats:true,
          channelId:'default',
        },
      });
    }catch(e){console.log('Günlük hatırlatma hatası:',e);}
  };

  const scheduleBudgetAlert=async(percent:number)=>{
    if(percent>=80&&percent<100){
      await scheduleLocalNotif(
        '⚠️ Bütçe Uyarısı',
        `Aylık bütçenin %${percent}'ini harcadın! Dikkatli ol.`,
        2
      );
    } else if(percent>=100){
      await scheduleLocalNotif(
        '🚨 Bütçe Aşıldı!',
        'Aylık bütçeni aştın. Harcamalarını kontrol et.',
        2
      );
    }
  };

"""

content = content.replace(
    "  const addXP=useCallback(",
    NOTIF_HELPERS + "  const addXP=useCallback("
)

# ── 3. Harcama eklenince bildirim gönder ──────────────────────
content = content.replace(
    "    addXP(10);\n    addNotif('Harcama eklendi','Bütçe takibine yeni kayıt eklendi.','💸');",
    """    addXP(10);
    addNotif('Harcama eklendi','Bütçe takibine yeni kayıt eklendi.','💸');
    scheduleLocalNotif('💸 Harcama Kaydedildi', `${expenseTitle} - ₺${expenseAmount}`, 1);
    if(monthlyBudgetValue>0){
      const newTotal=expenses.reduce((s,e)=>s+e.amount,0)+Number(expenseAmount.replace(',','.'));
      const pct=Math.round((newTotal/monthlyBudgetValue)*100);
      scheduleBudgetAlert(pct);
    }"""
)

# ── 4. Hedef tamamlanınca bildirim gönder ─────────────────────
content = content.replace(
    "    addXP(20);\n    addNotif('Yeni hedef oluşturuldu','Bir tasarruf hedefi oluşturdun.','🎯');",
    """    addXP(20);
    addNotif('Yeni hedef oluşturuldu','Bir tasarruf hedefi oluşturdun.','🎯');
    scheduleLocalNotif('🎯 Yeni Tasarruf Hedefi!', `"${goalTitle}" hedefi oluşturuldu.`, 1);"""
)

# ── 5. Ayarlar'a günlük hatırlatma switch'i ekle ─────────────
content = content.replace(
    "        <Text style={[s.sectionTitle,{color:colors.text}]}>🔒 Güvenlik",
    """        {/* Günlük Hatırlatma */}
        <GlassCard colors={colors} delay={105}>
          <Text style={[s.sectionTitle,{color:colors.text}]}>🔔 Bildirim Ayarları</Text>
          <View style={[s.settingRow,{borderBottomColor:colors.border}]}>
            <View style={{flex:1,paddingRight:12}}>
              <Text style={{fontSize:14,fontWeight:'800',color:colors.text}}>Günlük Hatırlatma</Text>
              <Text style={{fontSize:12,color:colors.subText}}>Her akşam saat 20:00'da hatırlat</Text>
            </View>
            <TouchableOpacity
              onPress={()=>{
                scheduleDailyReminder();
                addNotif('Günlük Hatırlatma Aktif 🔔','Her akşam 20:00\'da bildirim alacaksın.','🔔');
                Alert.alert('✅','Günlük hatırlatma aktif edildi! Her gece 20:00\'da bildirim gelecek.');
              }}
              style={[s.mainBtn,{backgroundColor:colors.primary,paddingVertical:10,paddingHorizontal:16,marginBottom:0,marginTop:4}]}
            >
              <Text style={{color:'#fff',fontSize:12,fontWeight:'900'}}>Aktif Et</Text>
            </TouchableOpacity>
          </View>
          <View style={[s.settingRow,{borderBottomColor:'transparent'}]}>
            <View style={{flex:1,paddingRight:12}}>
              <Text style={{fontSize:14,fontWeight:'800',color:colors.text}}>Tüm Bildirimleri İptal Et</Text>
              <Text style={{fontSize:12,color:colors.subText}}>Zamanlanmış bildirimleri kapat</Text>
            </View>
            <TouchableOpacity
              onPress={()=>{
                Notifications.cancelAllScheduledNotificationsAsync();
                Alert.alert('🔕','Tüm zamanlanmış bildirimler iptal edildi.');
              }}
              style={[s.mainBtn,{backgroundColor:colors.danger,paddingVertical:10,paddingHorizontal:16,marginBottom:0,marginTop:4}]}
            >
              <Text style={{color:'#fff',fontSize:12,fontWeight:'900'}}>İptal Et</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        <Text style={[s.sectionTitle,{color:colors.text}]}>🔒 Güvenlik"""
)

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("✅ Push bildirimler eklendi!")

# ── AndroidManifest.xml'e izin ekle ──────────────────────────
with open('android/app/src/main/AndroidManifest.xml', 'r') as f:
    manifest = f.read()

if 'RECEIVE_BOOT_COMPLETED' not in manifest:
    manifest = manifest.replace(
        '<uses-permission android:name="android.permission.INTERNET"/>',
        '''<uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
    <uses-permission android:name="android.permission.VIBRATE"/>
    <uses-permission android:name="android.permission.USE_EXACT_ALARM"/>
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM"/>'''
    )
    with open('android/app/src/main/AndroidManifest.xml', 'w') as f:
        f.write(manifest)
    print("✅ AndroidManifest.xml güncellendi!")
else:
    print("ℹ️  AndroidManifest.xml zaten güncel")

print("✅ Tüm bildirim ayarları tamamlandı!")
PYEOF
