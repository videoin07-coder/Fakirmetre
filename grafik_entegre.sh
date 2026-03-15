#!/bin/bash
# ╔══════════════════════════════════════════════════════════╗
# ║   Fakirmetre — Grafik Sekme Kaldır + Entegre Et         ║
# ║   Termux: bash grafik_entegre.sh                        ║
# ╚══════════════════════════════════════════════════════════╝

set -e
cd ~/Fakirmetre
echo ""
echo "🔧 Grafik sekmesi kaldırılıyor, mevcut sekmelere entegre ediliyor..."

# ── Python ile App.tsx'i düzenle ─────────────────────────────────────────────
python3 - << 'PYEOF'
with open('App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# ── 1. Tabs dizisinden 'charts' satırını kaldır ───────────────────────────────
content = content.replace(
    "{key:'charts',label:'Grafik',icon:'📊'},\n    ",
    ""
)
# Alternatif format
content = content.replace(
    "    {key:'charts',label:'Grafik',icon:'📊'},\n",
    ""
)

# ── 2. TabKey'den 'charts' kaldır ─────────────────────────────────────────────
content = content.replace(
    "'home' | 'quiz' | 'astro' | 'charts' | 'kitchen'",
    "'home' | 'quiz' | 'astro' | 'kitchen'"
)

# ── 3. Render bloğundan charts satırını kaldır ────────────────────────────────
content = content.replace(
    "          {activeTab==='charts'&&renderCharts()}\n",
    ""
)

# ── 4. renderCharts fonksiyonunu kaldır (CHARTS TAB'dan SETTINGS TAB'a kadar) ─
import re
content = re.sub(
    r'\s*// ─── CHARTS TAB.*?(?=// ─── SETTINGS TAB)',
    '\n  ',
    content,
    flags=re.DOTALL
)

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("✅ Charts sekmesi kaldırıldı")
PYEOF

# ── types.ts güncelle ─────────────────────────────────────────────────────────
python3 - << 'PYEOF'
with open('src/types.ts', 'r') as f:
    c = f.read()
c = c.replace(
    "'home' | 'quiz' | 'astro' | 'charts' | 'kitchen'",
    "'home' | 'quiz' | 'astro' | 'kitchen'"
)
with open('src/types.ts', 'w') as f:
    f.write(c)
print("✅ types.ts güncellendi")
PYEOF

# ── Grafikleri renderHome ve renderKitchen'a entegre et ───────────────────────
python3 - << 'PYEOF'
with open('App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# ── Ana ekrana grafik ekle (Bütçe Özeti kartının hemen ALTINA) ────────────────
home_chart_block = """
      {/* 📊 Finansal Grafikler — Ana Ekran */}
      {expenses.length>0&&(
        <GlassCard colors={colors} delay={70}>
          <Text style={[s.sectionTitle,{color:colors.text}]}>📊 Harcama Grafikleri</Text>
          <CategoryPieChart expenses={expenses} colors={colors} filter="month"/>
          <View style={{height:16}}/>
          <WeeklyBarChart expenses={expenses} colors={colors}/>
        </GlassCard>
      )}
"""

# Bütçe özeti kartından sonraki Hızlı Aksiyonlar kartının önüne ekle
content = content.replace(
    "      {/* Hızlı Aksiyonlar */}",
    home_chart_block + "      {/* Hızlı Aksiyonlar */"
)

# ── Mutfak/Bütçe Takibi sekmesine aylık grafik ekle ──────────────────────────
# expenses.length>0 koşullu Son Harcamalar kartından önce ekle
kitchen_chart_block = """
        {expenses.length>0&&<GlassCard colors={colors} delay={55}>
          <Text style={[s.sectionTitle,{color:colors.text}]}>📈 Aylık Trend</Text>
          <MonthlyLineChart expenses={expenses} colors={colors}/>
          <View style={{height:14}}/>
          <CategoryPieChart expenses={expenses} colors={colors} filter="month"/>
        </GlassCard>}
"""

content = content.replace(
    "        {expenses.length>0&&<GlassCard colors={colors} delay={70}>",
    kitchen_chart_block + "        {expenses.length>0&&<GlassCard colors={colors} delay={70}>"
)

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("✅ Grafikler Ana Ekran ve Mutfak'a eklendi")
PYEOF

echo ""
echo "════════════════════════════════════════"
echo "✅ Düzenleme tamamlandı!"
echo ""
echo "📋 Değişiklikler:"
echo "   • Grafik sekmesi kaldırıldı"
echo "   • Ana ekrana: Pasta + Haftalık bar grafik eklendi"
echo "   • Mutfak > Bütçe Takibi'ne: Aylık trend + Pasta grafik eklendi"
echo ""
echo "🚀 Build:"
echo "   EAS_SKIP_AUTO_FINGERPRINT=1 eas build --platform android --profile preview"
echo "════════════════════════════════════════"
