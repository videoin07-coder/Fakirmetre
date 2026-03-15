/**
 * Fakirmetre – Charts.tsx
 * Gerekli: react-native-gifted-charts, react-native-linear-gradient, react-native-svg
 */
import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import type { ExpenseEntry } from '../types';
import { getCategoryDistribution, isSameMonth } from '../features/finance';
import type { Colors } from '../theme';

const SW = Dimensions.get('window').width;

const CAT_COLORS: Record<string, string> = {
  'Gıda':    '#38bdf8',
  'Ulaşım':  '#818cf8',
  'Fatura':  '#fb923c',
  'Eğlence': '#f472b6',
  'Sağlık':  '#34d399',
  'Eğitim':  '#facc15',
  'Diğer':   '#94a3b8',
};

function buildWeeklyBarData(expenses: ExpenseEntry[], primary: string) {
  const days = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
  const now = new Date();
  const todayIdx = (now.getDay() + 6) % 7;
  return days.map((label, i) => {
    const diff = todayIdx - i;
    const d = new Date(now);
    d.setDate(d.getDate() - diff);
    const total = expenses
      .filter(e => {
        const ed = new Date(e.createdAt);
        return ed.getFullYear()===d.getFullYear() && ed.getMonth()===d.getMonth() && ed.getDate()===d.getDate();
      })
      .reduce((s, e) => s + e.amount, 0);
    return {
      value: Math.round(total),
      label,
      frontColor: diff===0 ? primary : primary+'88',
      topLabelComponent: total > 0
        ? () => <Text style={{fontSize:8,color:primary}}>₺{Math.round(total)}</Text>
        : undefined,
    };
  });
}

function buildMonthlyLineData(expenses: ExpenseEntry[], primary: string) {
  const months = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  const now = new Date();
  return Array.from({length:6}, (_, i) => {
    const ref = new Date(now.getFullYear(), now.getMonth() - (5-i), 1);
    const total = expenses.filter(e => isSameMonth(e.createdAt, ref)).reduce((s,e)=>s+e.amount,0);
    return { value: Math.round(total), label: months[ref.getMonth()], dataPointColor: primary };
  });
}

function buildPieData(expenses: ExpenseEntry[]) {
  const dist = getCategoryDistribution(expenses);
  if (!dist.length) return [];
  return dist.map(d => ({
    value: d.percent,
    color: CAT_COLORS[d.category] ?? '#94a3b8',
    text: `${d.percent}%`,
    label: d.category,
    amount: d.amount,
  }));
}

// ── Haftalık Bar Chart ────────────────────────────────────────────────────────
export function WeeklyBarChart({expenses,colors}:{expenses:ExpenseEntry[];colors:Colors}) {
  const data = useMemo(()=>buildWeeklyBarData(expenses,colors.primary),[expenses,colors.primary]);
  const hasData = data.some(d=>d.value>0);
  return (
    <View>
      <Text style={[cs.title,{color:colors.text}]}>📅 Son 7 Günlük Harcama</Text>
      {!hasData
        ? <EmptyChart colors={colors} message="Henüz harcama kaydı yok"/>
        : <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart
              data={data}
              barWidth={32}
              spacing={14}
              roundedTop
              roundedBottom
              hideRules
              xAxisThickness={1}
              yAxisThickness={0}
              xAxisColor={colors.border}
              yAxisTextStyle={{color:colors.subText,fontSize:10}}
              xAxisLabelTextStyle={{color:colors.subText,fontSize:10}}
              noOfSections={4}
              maxValue={Math.max(...data.map(d=>d.value),100)}
              isAnimated
              animationDuration={600}
              backgroundColor="transparent"
              width={SW-80}
            />
          </ScrollView>
      }
    </View>
  );
}

// ── Aylık Line Chart ──────────────────────────────────────────────────────────
export function MonthlyLineChart({expenses,colors}:{expenses:ExpenseEntry[];colors:Colors}) {
  const data = useMemo(()=>buildMonthlyLineData(expenses,colors.primary),[expenses,colors.primary]);
  const hasData = data.some(d=>d.value>0);
  return (
    <View>
      <Text style={[cs.title,{color:colors.text}]}>📈 Aylık Trend (6 Ay)</Text>
      {!hasData
        ? <EmptyChart colors={colors} message="Henüz yeterli veri yok"/>
        : <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={data}
              color={colors.primary}
              thickness={2.5}
              dataPointsColor={colors.primary}
              dataPointsRadius={5}
              startFillColor={colors.primary+'44'}
              endFillColor={colors.primary+'00'}
              areaChart
              curved
              rulesColor={colors.border}
              rulesType="dashed"
              xAxisColor={colors.border}
              yAxisColor="transparent"
              yAxisTextStyle={{color:colors.subText,fontSize:10}}
              xAxisLabelTextStyle={{color:colors.subText,fontSize:10}}
              noOfSections={4}
              isAnimated
              animationDuration={700}
              backgroundColor="transparent"
              width={SW-80}
              spacing={52}
              initialSpacing={16}
            />
          </ScrollView>
      }
    </View>
  );
}

// ── Pasta Grafik ─────────────────────────────────────────────────────────────
export function CategoryPieChart({expenses,colors,filter='all'}:{expenses:ExpenseEntry[];colors:Colors;filter?:'all'|'month'}) {
  const filtered = useMemo(()=>filter==='month'?expenses.filter(e=>isSameMonth(e.createdAt)):expenses,[expenses,filter]);
  const pieData = useMemo(()=>buildPieData(filtered),[filtered]);
  const total = filtered.reduce((s,e)=>s+e.amount,0);
  if (!pieData.length) {
    return (
      <View>
        <Text style={[cs.title,{color:colors.text}]}>🥧 Kategori Dağılımı</Text>
        <EmptyChart colors={colors} message="Henüz harcama kaydı yok"/>
      </View>
    );
  }
  return (
    <View>
      <Text style={[cs.title,{color:colors.text}]}>🥧 Kategori Dağılımı {filter==='month'?'(Bu Ay)':'(Tümü)'}</Text>
      <View style={cs.pieRow}>
        <PieChart
          data={pieData}
          donut
          showText
          textColor="#fff"
          textSize={10}
          fontWeight="900"
          innerRadius={52}
          radius={80}
          centerLabelComponent={()=>(
            <View style={{alignItems:'center'}}>
              <Text style={{fontSize:18}}>💸</Text>
              <Text style={{fontSize:9,color:colors.subText,fontWeight:'700'}}>Toplam</Text>
              <Text style={{fontSize:11,color:colors.text,fontWeight:'900'}}>₺{total.toFixed(0)}</Text>
            </View>
          )}
          isAnimated
          animationDuration={600}
        />
        <View style={cs.legend}>
          {pieData.map(item=>(
            <View key={item.label} style={cs.legendItem}>
              <View style={[cs.legendDot,{backgroundColor:item.color}]}/>
              <View style={{flex:1}}>
                <Text style={{fontSize:11,fontWeight:'800',color:colors.text}}>{item.label}</Text>
                <Text style={{fontSize:10,color:colors.subText}}>₺{item.amount.toFixed(0)} • %{item.value}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ── Hedef Bar Chart ───────────────────────────────────────────────────────────
export function SavingsGoalChart({goals,colors}:{goals:{id:string;title:string;current:number;target:number}[];colors:Colors}) {
  const data = useMemo(()=>goals.slice(0,5).map(g=>({
    value: Math.min(100,Math.round((g.current/Math.max(g.target,1))*100)),
    label: g.title.length>8?g.title.slice(0,7)+'…':g.title,
    frontColor: g.current>=g.target?'#34d399':colors.secondary,
    topLabelComponent: ()=><Text style={{fontSize:8,color:colors.subText}}>%{Math.min(100,Math.round((g.current/Math.max(g.target,1))*100))}</Text>,
  })),[goals,colors]);
  if (!data.length) return null;
  return (
    <View>
      <Text style={[cs.title,{color:colors.text}]}>🎯 Hedef İlerlemesi</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <BarChart
          data={data}
          barWidth={38}
          spacing={16}
          roundedTop
          maxValue={100}
          noOfSections={4}
          hideRules
          xAxisThickness={1}
          yAxisThickness={0}
          xAxisColor={colors.border}
          yAxisTextStyle={{color:colors.subText,fontSize:10}}
          xAxisLabelTextStyle={{color:colors.subText,fontSize:10}}
          isAnimated
          animationDuration={700}
          backgroundColor="transparent"
          width={Math.max(SW-80,data.length*60)}
        />
      </ScrollView>
    </View>
  );
}

function EmptyChart({colors,message}:{colors:Colors;message:string}) {
  return (
    <View style={[cs.empty,{backgroundColor:colors.surfaceSoft,borderColor:colors.border}]}>
      <Text style={{fontSize:32}}>📊</Text>
      <Text style={{fontSize:12,color:colors.subText,marginTop:8}}>{message}</Text>
    </View>
  );
}

const cs = StyleSheet.create({
  title:      {fontSize:16,fontWeight:'900',marginBottom:14},
  pieRow:     {flexDirection:'row',alignItems:'center',gap:16},
  legend:     {flex:1,gap:8},
  legendItem: {flexDirection:'row',alignItems:'center',gap:8},
  legendDot:  {width:10,height:10,borderRadius:5},
  empty:      {borderWidth:1,borderRadius:14,padding:24,alignItems:'center',justifyContent:'center',minHeight:120},
});
