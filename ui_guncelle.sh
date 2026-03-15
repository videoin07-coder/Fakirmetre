#!/bin/bash
cd ~/Fakirmetre

python3 - << 'PYEOF'
# ── theme.ts — Daha zengin renkler ───────────────────────────
with open('src/theme.ts', 'r', encoding='utf-8') as f:
    theme = f.read()

theme = theme.replace(
    "if(mode==='light') return {background:'#eef4ff',backgroundTop:'#dbeafe',surface:'#ffffff',surfaceSoft:'#f8fbff',border:'#d8e3ff',text:'#0f172a',subText:'#64748b',primary:ac,secondary:'#8b5cf6',success:'#16a34a',danger:'#dc2626',warning:'#ea580c',star:'#93c5fd',tabBg:'#ffffff',tabIdle:'#64748b',input:'#f1f5f9',overlay:'rgba(0,0,0,0.55)',gold:'#f59e0b'};",
    "if(mode==='light') return {background:'#f0f4ff',backgroundTop:'#e0eaff',surface:'#ffffff',surfaceSoft:'#f5f8ff',border:'#c7d9ff',text:'#0f172a',subText:'#556080',primary:ac,secondary:'#7c3aed',success:'#16a34a',danger:'#dc2626',warning:'#d97706',star:'#93c5fd',tabBg:'#ffffff',tabIdle:'#7c8aa5',input:'#eef2ff',overlay:'rgba(0,0,0,0.55)',gold:'#d97706'};"
)
theme = theme.replace(
    "return {background:'#040b18',backgroundTop:'#091327',surface:'#0d1830',surfaceSoft:'#12203d',border:'#1a2c52',text:'#f8fafc',subText:'#94a3b8',primary:ac,secondary:'#a78bfa',success:'#22c55e',danger:'#ef4444',warning:'#fb923c',star:'#dbeafe',tabBg:'#091327',tabIdle:'#7c8aa5',input:'#0d1830',overlay:'rgba(0,0,0,0.8)',gold:'#fbbf24'};",
    "return {background:'#030a16',backgroundTop:'#07112a',surface:'#0d1b35',surfaceSoft:'#111f3a',border:'#1e3361',text:'#f1f5ff',subText:'#8fa3c8',primary:ac,secondary:'#a78bfa',success:'#22c55e',danger:'#ef4444',warning:'#fb923c',star:'#dbeafe',tabBg:'#07112a',tabIdle:'#5a7099',input:'#0d1b35',overlay:'rgba(0,0,0,0.85)',gold:'#fbbf24'};"
)

with open('src/theme.ts', 'w', encoding='utf-8') as f:
    f.write(theme)
print("✅ theme.ts güncellendi")

# ── App.tsx — Stil iyileştirmeleri ────────────────────────────
with open('App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# ── Kart stilleri: daha geniş padding, daha büyük radius ─────
content = content.replace(
    "card:{borderWidth:1,borderRadius:24,padding:16,elevation:3,shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.1,shadowRadius:6},",
    "card:{borderWidth:1,borderRadius:28,padding:18,elevation:6,shadowColor:'#000',shadowOffset:{width:0,height:4},shadowOpacity:0.18,shadowRadius:12},"
)

# ── StatBlock: daha büyük değer fontu ─────────────────────────
content = content.replace(
    "statBlock:{flex:1,borderWidth:1,borderRadius:14,paddingVertical:12,alignItems:'center'},",
    "statBlock:{flex:1,borderWidth:1,borderRadius:18,paddingVertical:14,alignItems:'center'},"
)
content = content.replace(
    "statVal:{fontSize:15,fontWeight:'900'},",
    "statVal:{fontSize:17,fontWeight:'900'},"
)
content = content.replace(
    "statLbl:{marginTop:2,fontSize:10,fontWeight:'700'},",
    "statLbl:{marginTop:3,fontSize:11,fontWeight:'700'},"
)

# ── MainBtn: daha yuvarlak ve büyük ───────────────────────────
content = content.replace(
    "mainBtn:{borderRadius:15,paddingVertical:14,alignItems:'center',marginBottom:9},",
    "mainBtn:{borderRadius:18,paddingVertical:15,alignItems:'center',marginBottom:9},"
)
content = content.replace(
    "mainBtnTxt:{color:'#fff',fontSize:14,fontWeight:'900'},",
    "mainBtnTxt:{color:'#fff',fontSize:15,fontWeight:'900',letterSpacing:0.3},"
)

# ── TabBar: daha şık ─────────────────────────────────────────
content = content.replace(
    "tabBar:{flexDirection:'row',borderWidth:1,borderRadius:20,padding:5,marginBottom:8,marginTop:3},",
    "tabBar:{flexDirection:'row',borderWidth:1,borderRadius:24,padding:6,marginBottom:10,marginTop:4},"
)
content = content.replace(
    "tabItem:{flex:1,borderWidth:1,borderRadius:14,paddingVertical:8,alignItems:'center',justifyContent:'center',position:'relative'},",
    "tabItem:{flex:1,borderWidth:1,borderRadius:18,paddingVertical:9,alignItems:'center',justifyContent:'center',position:'relative'},"
)
content = content.replace(
    "tabIcon:{fontSize:15,marginBottom:1},",
    "tabIcon:{fontSize:17,marginBottom:2},"
)
content = content.replace(
    "tabLabel:{fontSize:9,fontWeight:'800'},",
    "tabLabel:{fontSize:10,fontWeight:'900'},"
)

# ── Input stilleri: daha büyük ────────────────────────────────
content = content.replace(
    "inlineInput:{borderWidth:1,borderRadius:11,paddingHorizontal:11,paddingVertical:9,fontSize:13},",
    "inlineInput:{borderWidth:1.5,borderRadius:14,paddingHorizontal:14,paddingVertical:12,fontSize:14},"
)

# ── SearchBar: daha şık ───────────────────────────────────────
content = content.replace(
    "searchBar:{flexDirection:'row',alignItems:'center',borderWidth:1,borderRadius:13,paddingHorizontal:11,paddingVertical:9,marginBottom:10},",
    "searchBar:{flexDirection:'row',alignItems:'center',borderWidth:1.5,borderRadius:16,paddingHorizontal:14,paddingVertical:11,marginBottom:12},"
)

# ── XP Badge: daha dolgun ─────────────────────────────────────
content = content.replace(
    "xpBadge:{borderWidth:1,borderRadius:999,paddingHorizontal:9,paddingVertical:5},",
    "xpBadge:{borderWidth:1.5,borderRadius:999,paddingHorizontal:11,paddingVertical:6},"
)

# ── CatChip: daha büyük ───────────────────────────────────────
content = content.replace(
    "catChip:{borderWidth:1,borderRadius:999,paddingVertical:6,paddingHorizontal:12,marginRight:7},",
    "catChip:{borderWidth:1.5,borderRadius:999,paddingVertical:8,paddingHorizontal:14,marginRight:8},"
)

# ── SubTab: daha yüksek ───────────────────────────────────────
content = content.replace(
    "subTab:{flex:1,borderRadius:12,paddingVertical:9,alignItems:'center'},",
    "subTab:{flex:1,borderRadius:14,paddingVertical:11,alignItems:'center'},"
)

# ── InfoBox: daha geniş padding ───────────────────────────────
content = content.replace(
    "infoBox:{borderWidth:1,borderRadius:16,padding:13,marginTop:10},",
    "infoBox:{borderWidth:1.5,borderRadius:18,padding:15,marginTop:10},"
)

# ── Header: profil bilgisi büyüt ──────────────────────────────
content = content.replace(
    "appSub:{fontSize:10,marginTop:1,fontWeight:'600'},",
    "appSub:{fontSize:12,marginTop:2,fontWeight:'700'},"
)

# ── FoodRow: daha şık ────────────────────────────────────────
content = content.replace(
    "foodRow:{flexDirection:'row',alignItems:'center',borderWidth:1,borderRadius:14,padding:12},",
    "foodRow:{flexDirection:'row',alignItems:'center',borderWidth:1.5,borderRadius:18,padding:14},"
)

# ── scrollContent gap artır ───────────────────────────────────
content = content.replace(
    "scrollContent:{gap:12,paddingBottom:20},",
    "scrollContent:{gap:14,paddingBottom:24},"
)

# ── GlassCard animasyonu iyileştir ────────────────────────────
content = content.replace(
    "Animated.parallel([Animated.timing(op,{toValue:1,duration:420,delay,easing:Easing.out(Easing.cubic),useNativeDriver:true}),Animated.timing(ty,{toValue:0,duration:420,delay,easing:Easing.out(Easing.cubic),useNativeDriver:true})]).start();",
    "Animated.parallel([Animated.timing(op,{toValue:1,duration:480,delay,easing:Easing.out(Easing.cubic),useNativeDriver:true}),Animated.timing(ty,{toValue:0,duration:480,delay,easing:Easing.out(Easing.back(1.2)),useNativeDriver:true})]).start();"
)

# ── Ana ekran hero büyüt ──────────────────────────────────────
content = content.replace(
    "heroTitle:{textAlign:'center',fontSize:24,fontWeight:'900'},",
    "heroTitle:{textAlign:'center',fontSize:28,fontWeight:'900',letterSpacing:0.5},"
)
content = content.replace(
    "powerMark:{fontSize:28,textAlign:'center',marginBottom:2},",
    "powerMark:{fontSize:32,textAlign:'center',marginBottom:4},"
)

# ── Quiz soru metni büyüt ─────────────────────────────────────
content = content.replace(
    "questionTxt:{fontSize:19,lineHeight:28,fontWeight:'900',marginBottom:16},",
    "questionTxt:{fontSize:21,lineHeight:32,fontWeight:'900',marginBottom:20},"
)

# ── Sonuç başlığı büyüt ───────────────────────────────────────
content = content.replace(
    "resultTitle:{marginTop:8,textAlign:'center',fontSize:24,fontWeight:'900'},",
    "resultTitle:{marginTop:8,textAlign:'center',fontSize:26,fontWeight:'900',letterSpacing:0.3},"
)

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("✅ App.tsx UI güncellendi!")
print("✅ Hazır! Build alabilirsin.")
PYEOF
