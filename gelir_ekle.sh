#!/bin/bash
cd ~/Fakirmetre

python3 - << 'PYEOF'
with open('App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# ── 1. State'lere gelir state'lerini ekle ─────────────────────
content = content.replace(
    "  const [expenseTitle,setExpenseTitle]=useState('');",
    """  const [expenseTitle,setExpenseTitle]=useState('');
  const [incomeTitle,setIncomeTitle]=useState('');
  const [incomeAmount,setIncomeAmount]=useState('');
  const [incomeCategory,setIncomeCategory]=useState('Maaş');
  const [incomes,setIncomes]=useState<{id:string;title:string;amount:number;category:string;createdAt:string}[]>([]);"""
)

# ── 2. Persistence'a gelir kaydetmeyi ekle ────────────────────
content = content.replace(
    "        meals,\n        expenses,",
    "        meals,\n        expenses,\n        incomes,"
)

# ── 3. kitchenTab tipine 'gelir' ekle ─────────────────────────
content = content.replace(
    "useState<'kalori'|'butce'|'takip'>('kalori')",
    "useState<'kalori'|'butce'|'takip'|'gelir'>('kalori')"
)

# ── 4. Sekme listesine Gelir sekmesini ekle ───────────────────
content = content.replace(
    "t==='kalori'?'🥗 Kalori Takibi':t==='butce'?'💰 Bütçe Asistanı':'📒 Bütçe Takibi'",
    "t==='kalori'?'🥗 Kalori':t==='butce'?'💰 Bütçe':t==='takip'?'📒 Gider':'💵 Gelir'"
)
content = content.replace(
    "(['kalori','butce','takip'] as const)",
    "(['kalori','butce','takip','gelir'] as const)"
)

# ── 5. Gelir sekmesi içeriğini takip'ten sonra ekle ──────────
GELIR_TAB = """
      {kitchenTab==='gelir'&&<>
        {/* Özet Kartı */}
        <GlassCard colors={colors}>
          <Text style={[s.sectionTitle,{color:colors.text}]}>💵 Gelir Takibi</Text>
          <View style={s.statsRow}>
            <StatBlock
              label="Toplam Gelir"
              value={`₺${incomes.reduce((s,i)=>s+i.amount,0).toFixed(0)}`}
              color={colors.success}
              colors={colors}
            />
            <StatBlock
              label="Bu Ay"
              value={`₺${incomes.filter(i=>isSameMonth(i.createdAt)).reduce((s,i)=>s+i.amount,0).toFixed(0)}`}
              color={colors.primary}
              colors={colors}
            />
            <StatBlock
              label="Net Durum"
              value={`₺${(incomes.reduce((s,i)=>s+i.amount,0) - expenseSummary.total).toFixed(0)}`}
              color={incomes.reduce((s,i)=>s+i.amount,0) - expenseSummary.total >= 0 ? colors.success : colors.danger}
              colors={colors}
            />
          </View>
        </GlassCard>

        {/* Gelir vs Gider Karşılaştırma */}
        <GlassCard colors={colors} delay={30}>
          <Text style={[s.sectionTitle,{color:colors.text}]}>📊 Gelir vs Gider</Text>
          {[
            {label:'💵 Toplam Gelir', amount:incomes.reduce((s,i)=>s+i.amount,0), color:colors.success},
            {label:'💸 Toplam Gider', amount:expenseSummary.total, color:colors.danger},
          ].map(item=>(
            <View key={item.label} style={{marginBottom:12}}>
              <View style={s.rowBetween}>
                <Text style={{fontSize:14,fontWeight:'800',color:colors.text}}>{item.label}</Text>
                <Text style={{fontSize:14,fontWeight:'900',color:item.color}}>₺{item.amount.toFixed(0)}</Text>
              </View>
              <View style={{marginTop:6}}>
                <AnimBar
                  value={Math.min(100, incomes.reduce((s,i)=>s+i.amount,0) > 0
                    ? Math.round((item.amount / Math.max(incomes.reduce((s,i)=>s+i.amount,0), expenseSummary.total)) * 100)
                    : 0)}
                  color={item.color}
                  bg={colors.surfaceSoft}
                  height={10}
                />
              </View>
            </View>
          ))}
          <View style={[s.infoBox,{
            backgroundColor: incomes.reduce((s,i)=>s+i.amount,0) >= expenseSummary.total ? colors.success+'18' : colors.danger+'18',
            borderColor: incomes.reduce((s,i)=>s+i.amount,0) >= expenseSummary.total ? colors.success : colors.danger,
            marginTop:4
          }]}>
            <Text style={{fontSize:13,fontWeight:'900',color:colors.text,textAlign:'center'}}>
              {incomes.reduce((s,i)=>s+i.amount,0) >= expenseSummary.total
                ? `✅ ${(incomes.reduce((s,i)=>s+i.amount,0) - expenseSummary.total).toFixed(0)}₺ tasarruf ettiniz!`
                : `⚠️ ${(expenseSummary.total - incomes.reduce((s,i)=>s+i.amount,0)).toFixed(0)}₺ açık var!`}
            </Text>
          </View>
        </GlassCard>

        {/* Gelir Ekle */}
        <GlassCard colors={colors} delay={50}>
          <Text style={[s.sectionTitle,{color:colors.text}]}>➕ Gelir Ekle</Text>
          <TextInput
            style={[s.inlineInput,{backgroundColor:colors.surfaceSoft,borderColor:colors.border,color:colors.text}]}
            value={incomeTitle}
            onChangeText={setIncomeTitle}
            placeholder="Gelir adı (Maaş, Freelance...)"
            placeholderTextColor={colors.subText}
          />
          <View style={{height:10}}/>
          <TextInput
            style={[s.inlineInput,{backgroundColor:colors.surfaceSoft,borderColor:colors.border,color:colors.text}]}
            value={incomeAmount}
            onChangeText={setIncomeAmount}
            placeholder="Tutar (₺)"
            placeholderTextColor={colors.subText}
            keyboardType="numeric"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical:10}}>
            {['Maaş','Freelance','Kira Geliri','Yatırım','Ek İş','Diğer'].map(cat=>(
              <TouchableOpacity
                key={cat}
                onPress={()=>setIncomeCategory(cat)}
                style={[s.catChip,{
                  backgroundColor:incomeCategory===cat?colors.success:colors.surfaceSoft,
                  borderColor:incomeCategory===cat?colors.success:colors.border
                }]}
              >
                <Text style={{fontSize:11,fontWeight:'800',color:incomeCategory===cat?'#fff':colors.subText}}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <PressBtn
            onPress={()=>{
              const amount=Number(incomeAmount.replace(',','.'));
              if(!incomeTitle.trim()||!Number.isFinite(amount)||amount<=0){
                Alert.alert('Eksik bilgi','Gelir adı ve geçerli tutar gir.');
                return;
              }
              setIncomes(prev=>[{
                id:`inc_${Date.now()}`,
                title:incomeTitle.trim(),
                amount,
                category:incomeCategory,
                createdAt:new Date().toISOString()
              },...prev]);
              setIncomeTitle('');
              setIncomeAmount('');
              addXP(15);
              addNotif('Gelir eklendi 💵','Yeni gelir kaydın oluşturuldu.','💵');
            }}
            style={[s.mainBtn,{backgroundColor:colors.success}]}
          >
            <Text style={s.mainBtnTxt}>💵 Gelir Ekle (+15 XP)</Text>
          </PressBtn>
        </GlassCard>

        {/* Gelir Listesi */}
        {incomes.length>0&&<GlassCard colors={colors} delay={70}>
          <View style={s.rowBetween}>
            <Text style={[s.sectionTitle,{color:colors.text,marginBottom:0}]}>📋 Gelirlerim</Text>
            <TouchableOpacity onPress={()=>setIncomes([])}>
              <Text style={{fontSize:12,fontWeight:'900',color:colors.danger}}>Temizle</Text>
            </TouchableOpacity>
          </View>
          <View style={{marginTop:12}}>
            {incomes.slice(0,15).map(item=>(
              <View key={item.id} style={[s.rowBetween,{paddingVertical:10,borderBottomWidth:1,borderBottomColor:colors.border,alignItems:'flex-start'}]}>
                <View style={{flex:1,paddingRight:10}}>
                  <Text style={{fontSize:14,fontWeight:'800',color:colors.text}}>{item.title}</Text>
                  <Text style={{fontSize:11,color:colors.subText}}>{item.category} • {new Date(item.createdAt).toLocaleDateString('tr-TR')}</Text>
                </View>
                <View style={{alignItems:'flex-end',gap:8}}>
                  <Text style={{fontSize:14,fontWeight:'900',color:colors.success}}>+₺{item.amount.toFixed(0)}</Text>
                  <TouchableOpacity
                    onPress={()=>setIncomes(prev=>prev.filter(i=>i.id!==item.id))}
                    style={[s.miniChip,{backgroundColor:colors.danger+'12',borderColor:colors.danger,paddingVertical:5,paddingHorizontal:8}]}
                  >
                    <Text style={{fontSize:11,color:colors.danger,fontWeight:'900'}}>Sil</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </GlassCard>}
      </>}
"""

# takip sekmesinden sonra ekle
content = content.replace(
    "      {kitchenTab==='takip'&&<>",
    GELIR_TAB + "\n      {kitchenTab==='takip'&&<>"
)

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("✅ Gelir takibi eklendi!")
PYEOF
