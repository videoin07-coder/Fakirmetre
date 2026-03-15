#!/bin/bash
cd ~/Fakirmetre

python3 - << 'PYEOF'
with open('App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# ── 1. AccordionCard bileşenini GlassCard'ın hemen altına ekle ──
ACCORDION_COMPONENT = """
function AccordionCard({title,defaultOpen=false,colors,delay=0,children}:{title:string;defaultOpen?:boolean;colors:Colors;delay?:number;children:React.ReactNode}){
  const [open,setOpen]=React.useState(defaultOpen);
  const anim=React.useRef(new Animated.Value(defaultOpen?1:0)).current;
  const toggle=()=>{
    const toVal=open?0:1;
    setOpen(!open);
    Animated.timing(anim,{toValue:toVal,duration:250,easing:Easing.out(Easing.cubic),useNativeDriver:false}).start();
  };
  return (
    <GlassCard colors={colors} delay={delay} style={{padding:0,overflow:'hidden'}}>
      <TouchableOpacity onPress={toggle} style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:16}}>
        <Text style={{fontSize:19,fontWeight:'900',color:colors.text}}>{title}</Text>
        <Text style={{fontSize:18,color:colors.primary}}>{open?'▲':'▼'}</Text>
      </TouchableOpacity>
      {open&&<View style={{paddingHorizontal:16,paddingBottom:16}}>{children}</View>}
    </GlassCard>
  );
}

"""

# GlassCard fonksiyonundan önce ekle
content = content.replace(
    '\nfunction GlassCard(',
    ACCORDION_COMPONENT + '\nfunction GlassCard('
)

# ── 2. renderSettings içindeki GlassCard'ları AccordionCard'a çevir ──

# Görünüm
content = content.replace(
    "      <GlassCard colors={colors}>\n        <Text style={[s.sectionTitle,{color:colors.text}]}>🎨 Görünüm</Text>",
    "      <AccordionCard title=\"🎨 Görünüm\" defaultOpen={true} colors={colors}>"
)
# Görünüm kapanışı — renk teması View'ından sonra
content = content.replace(
    "          </View>\n        </View>\n      </GlassCard>\n      <GlassCard colors={colors} delay={50}>\n        <Text style={[s.sectionTitle,{color:colors.text}]}>📋 İçerik</Text>",
    "          </View>\n        </View>\n      </AccordionCard>\n      <AccordionCard title=\"📋 İçerik\" defaultOpen={false} colors={colors} delay={50}>"
)

# İçerik kapanışı
content = content.replace(
    "        ))}\n      </GlassCard>\n      <GlassCard colors={colors} delay={90}>\n        <Text style={[s.sectionTitle,{color:colors.text}]}>👤 Profil Düzenle</Text>",
    "        ))}\n      </AccordionCard>\n      <AccordionCard title=\"👤 Profil Düzenle\" defaultOpen={false} colors={colors} delay={90}>"
)

# Profil kapanışı
content = content.replace(
    "        </View>\n      </GlassCard>\n      <GlassCard colors={colors} delay={100}>\n        <Text style={[s.sectionTitle,{color:colors.text}]}>🔒 Güvenlik & Gizlilik</Text>",
    "        </View>\n      </AccordionCard>\n      <AccordionCard title=\"🔒 Güvenlik\" defaultOpen={false} colors={colors} delay={100}>"
)

# Güvenlik kapanışı
content = content.replace(
    "        </TouchableOpacity>\n      </GlassCard>\n      <GlassCard colors={colors} delay={110}>\n        <Text style={[s.sectionTitle,{color:colors.text}]}>🔧 Araçlar</Text>",
    "        </TouchableOpacity>\n      </AccordionCard>\n      <AccordionCard title=\"🔧 Araçlar\" defaultOpen={false} colors={colors} delay={110}>"
)

# Araçlar kapanışı
content = content.replace(
    "        ))}\n      </GlassCard>\n      <GlassCard colors={colors} delay={115}>\n        <Text style={[s.sectionTitle,{color:colors.text}]}>💼 Aylık Bütçe",
    "        ))}\n      </AccordionCard>\n      <GlassCard colors={colors} delay={115}>\n        <Text style={[s.sectionTitle,{color:colors.text}]}>💼 Aylık Bütçe"
)

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

# Kontrol
errors = []
if 'AccordionCard title' in content:
    import re
    opens = len(re.findall(r'<AccordionCard ', content))
    closes = len(re.findall(r'</AccordionCard>', content))
    print(f"AccordionCard: {opens} açık, {closes} kapalı")
    if opens != closes:
        errors.append(f"Mismatch! {opens} açık vs {closes} kapalı")

if errors:
    print("❌ HATALAR:", errors)
else:
    print("✅ Accordion eklendi!")
PYEOF
