import { FOOD_PRICES } from './src/data/foodPrices';
import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import {
  Alert, Animated, Easing, KeyboardAvoidingView, Linking, Modal,
  Platform, SafeAreaView, ScrollView, Share,
  StatusBar, StyleSheet, Switch, Text, TextInput,
  TouchableOpacity, View, useWindowDimensions,
} from 'react-native';
import FakirmettreIcon from './src/ui/FakirmettreIcon';
import {
  EXTRA_TOP,
  IS_ANDROID,
  AVATARS,
  zodiacSigns,
  STORAGE_KEYS,
  DEFAULT_PROFILE,
  DEFAULT_SETTINGS,
  XP_TABLE,
  ACCENTS,
} from './src/config';
import type {
  AccentKey,
  AiMessage,
  AppState,
  BackupSnapshot,
  CommunityPost,
  ExpenseEntry,
  HelpRequest,
  HistoryItem,
  MealEntry,
  NotificationItem,
  PremiumTier,
  Profile,
  QuizMode,
  SavingsGoal,
  SeasonChallenge,
  SettingsState,
  TabKey,
  ZodiacKey,
} from './src/types';
import {
  Analytics,
  askFinanceAssistant,
  buildBackupSnapshot,
  buildExpenseInsights,
  CALORIE_DB as FOOD_DB,
  DREAM_DATA,
  FOOD_CATEGORIES,
  getBudgetMenus,
  getDailyChallenge,
  getDailyQuote,
  getDailyReward,
  getOfflineAiReply,
  getPersonalizedHoroscope,
  getResult,
  HELP_CATEGORIES,
  MOCK_HELP,
  MOCK_LEADERBOARD,
  MOCK_POSTS,
  profileLevel,
  QUIZZES,
  safeJsonParse,
  sanitizeImportedData,
  SEASON_BASE,
  Storage,
  today,
  xpProgress,
  zodiacEmojis,
  ZODIAC_DATES,
  ZODIAC_ELEMENT,
  ZODIAC_PLANET,
} from './src/core';
import { getTheme, type Colors } from './src/theme';
import { EXPENSE_CATEGORIES, createExpense, createSavingsGoal, getCategoryDistribution, getGoalProgress, getMonthlyExpenseTotal, getRecentExpenseAverage, isSameMonth, summarizeExpenses } from './src/features/finance';
import { loadPersistedAppData, resetPersistedAppData, savePersistedAppData } from './src/services/persistence';
import Svg, { Circle } from 'react-native-svg';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as Notifications from 'expo-notifications';
GoogleSignin.configure({webClientId:'788519844963-llgv3f0tdeo9q2bbfpabjj4ni2sn6prn.apps.googleusercontent.com'});
import * as TaskManager from 'expo-task-manager';

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
});

// ─── SPLASH ───────────────────────────────────────────────────────────────────
function SplashScreen({onDone}:{onDone:()=>void}){
  const scale=useRef(new Animated.Value(0.3)).current;
  const opacity=useRef(new Animated.Value(0)).current;
  const tagOp=useRef(new Animated.Value(0)).current;
  const exitOp=useRef(new Animated.Value(1)).current;
  const spin=useRef(new Animated.Value(0)).current;
  useEffect(()=>{
    Animated.sequence([
      Animated.parallel([Animated.spring(scale,{toValue:1,tension:55,friction:8,useNativeDriver:true}),Animated.timing(opacity,{toValue:1,duration:600,useNativeDriver:true})]),
      Animated.parallel([Animated.timing(tagOp,{toValue:1,duration:400,useNativeDriver:true}),Animated.timing(spin,{toValue:1,duration:700,easing:Easing.out(Easing.back(1.5)),useNativeDriver:true})]),
      Animated.delay(1000),
      Animated.timing(exitOp,{toValue:0,duration:400,useNativeDriver:true}),
    ]).start(()=>onDone());
  },[]);
  const rotate=spin.interpolate({inputRange:[0,1],outputRange:['0deg','360deg']});
  return (
    <Animated.View style={[sl.bg,{opacity:exitOp}]}>
      <View style={StyleSheet.absoluteFill}>
        {[...Array(24)].map((_,i)=><View key={i} style={[sl.star,{left:`${(i*17+7)%100}%`,top:`${(i*13+5)%100}%`,opacity:0.2+((i*0.03)%0.6),width:i%3===0?4:2.5,height:i%3===0?4:2.5}]}/>)}
      </View>
      <Animated.View style={{opacity,transform:[{scale}],alignItems:'center'}}>
        <Animated.View style={{transform:[{rotate},{scale:spin.interpolate({inputRange:[0,1],outputRange:[0.8,1]})}]}}>
          <FakirmettreIcon size={160} />
        </Animated.View>
        <Text style={sl.sub}>TITAN</Text>
        <Animated.View style={{opacity:tagOp,alignItems:'center',marginTop:20}}>
          <Text style={sl.tag}>Gelir & Gider · AI · Quiz · Astro</Text>
          <View style={{flexDirection:'row',gap:10,marginTop:18}}>
            {[0,1,2].map(i=><Animated.View key={i} style={[sl.dot,{opacity:tagOp,transform:[{scale:spin.interpolate({inputRange:[0,1],outputRange:[0.5,1]})}]}]}/>)}
          </View>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
function OnboardingScreen({onDone}:{onDone:(p:Profile)=>void}){
  const [step,setStep]=useState(0);
  const [name,setName]=useState('');
  const [avatar,setAvatar]=useState('🧑');
  const [bio,setBio]=useState('');
  const [zodiac,setZodiac]=useState<ZodiacKey>('Koç');
  const slideX=useRef(new Animated.Value(0)).current;
  const opRef=useRef(new Animated.Value(1)).current;
  const next=()=>{ Animated.parallel([Animated.timing(slideX,{toValue:-40,duration:150,useNativeDriver:true}),Animated.timing(opRef,{toValue:0,duration:120,useNativeDriver:true})]).start(()=>{ setStep(s=>s+1); slideX.setValue(40); Animated.parallel([Animated.timing(slideX,{toValue:0,duration:220,easing:Easing.out(Easing.cubic),useNativeDriver:true}),Animated.timing(opRef,{toValue:1,duration:200,useNativeDriver:true})]).start(); }); };
  const finish=()=>onDone({name:name.trim()||'Kahraman',avatar,bio,xp:0,level:1,streak:1,lastLoginDate:today(),totalTests:0,bestScore:9999,zodiac,birthYear:''});
  const total=4;
  return (
    <View style={ob.bg}>
      <View style={[ob.progressRow,{paddingTop:EXTRA_TOP+30}]}>
        {[...Array(total)].map((_,i)=><View key={i} style={[ob.dot,{backgroundColor:i<=step?'#38bdf8':'#1a2c52',flex:1}]}/>)}
      </View>
      <Animated.View style={{flex:1,opacity:opRef,transform:[{translateX:slideX}]}}>
        <KeyboardAvoidingView style={{flex:1}} behavior={IS_ANDROID?undefined:'padding'}>
          <ScrollView contentContainerStyle={{flexGrow:1,justifyContent:'center'}} keyboardShouldPersistTaps="handled">
            {step===0&&<View style={ob.wrap}>
              <Text style={{fontSize:72,textAlign:'center',marginBottom:16}}>🚀</Text>
              <Text style={ob.title}>Fakirmetre</Text>
              <Text style={ob.desc}>AI Danışman • Premium • Turnuva • Cloud Sync</Text>
              <TouchableOpacity style={ob.btn} onPress={next}><Text style={ob.btnTxt}>Haydi Başlayalım →</Text></TouchableOpacity>
            </View>}
            {step===1&&<View style={ob.wrap}>
              <Text style={{fontSize:64,textAlign:'center',marginBottom:12}}>✍️</Text>
              <Text style={ob.title}>Adın ne?</Text>
              <TextInput style={ob.input} value={name} onChangeText={setName} placeholder="Adını yaz..." placeholderTextColor="#64748b" maxLength={20} autoFocus/>
              <TouchableOpacity style={ob.btn} onPress={next}><Text style={ob.btnTxt}>Devam →</Text></TouchableOpacity>
              <TouchableOpacity onPress={next}><Text style={ob.skip}>Atla</Text></TouchableOpacity>
            </View>}
            {step===2&&<View style={ob.wrap}>
              <Text style={{fontSize:52,textAlign:'center',marginBottom:12}}>{avatar}</Text>
              <Text style={ob.title}>Avatar seç</Text>
              <View style={ob.avatarGrid}>
                {AVATARS.map(av=><TouchableOpacity key={av} onPress={()=>setAvatar(av)} style={[ob.avatarBtn,avatar===av&&ob.avatarActive]}><Text style={{fontSize:26}}>{av}</Text></TouchableOpacity>)}
              </View>
              <TouchableOpacity style={ob.btn} onPress={next}><Text style={ob.btnTxt}>Devam →</Text></TouchableOpacity>
            </View>}
            {step===3&&<View style={ob.wrap}>
              <Text style={{fontSize:52,textAlign:'center',marginBottom:12}}>🔮</Text>
              <Text style={ob.title}>Burcun ne?</Text>
              <Text style={ob.desc}>Kişiselleştirilmiş astroloji yorumu için</Text>
              <View style={ob.avatarGrid}>
                {zodiacSigns.map(z=><TouchableOpacity key={z} onPress={()=>setZodiac(z)} style={[ob.avatarBtn,{width:'auto',paddingHorizontal:12},{...(zodiac===z?ob.avatarActive:{})}]}><Text style={{fontSize:12,fontWeight:'900',color:zodiac===z?'#38bdf8':'#94a3b8'}}>{zodiacEmojis[z]} {z}</Text></TouchableOpacity>)}
              </View>
              <TouchableOpacity style={ob.btn} onPress={finish}><Text style={ob.btnTxt}>✦ Uygulamaya Gir</Text></TouchableOpacity>
            </View>}
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}
const ob=StyleSheet.create({
  bg:{flex:1,backgroundColor:'#040b18',paddingHorizontal:22},
  progressRow:{flexDirection:'row',paddingBottom:6,height:36},
  dot:{height:4,borderRadius:99,marginHorizontal:3},
  wrap:{alignItems:'center',paddingVertical:30,paddingHorizontal:8},
  title:{fontSize:24,fontWeight:'900',color:'#f8fafc',textAlign:'center',marginBottom:10},
  desc:{fontSize:14,color:'#94a3b8',textAlign:'center',lineHeight:22,marginBottom:22},
  input:{width:'100%',backgroundColor:'#0d1830',borderWidth:1,borderColor:'#1a2c52',borderRadius:16,padding:16,color:'#f8fafc',fontSize:16,marginBottom:20},
  btn:{backgroundColor:'#38bdf8',borderRadius:18,paddingVertical:16,paddingHorizontal:40,marginTop:8},
  btnTxt:{color:'#fff',fontSize:16,fontWeight:'900'},
  skip:{color:'#64748b',marginTop:16,fontSize:14},
  avatarGrid:{flexDirection:'row',flexWrap:'wrap',gap:9,justifyContent:'center',marginBottom:20,marginTop:4},
  avatarBtn:{width:52,height:52,borderRadius:14,borderWidth:1.5,borderColor:'#1a2c52',alignItems:'center',justifyContent:'center'},
  avatarActive:{borderColor:'#38bdf8',backgroundColor:'#38bdf822'},
});

// ─── REUSABLE COMPONENTS ─────────────────────────────────────────────────────
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


const GlassCard=memo(function GlassCard({children,colors,delay=0,style}:{children:React.ReactNode;colors:Colors;delay?:number;style?:any}){
  const op=useRef(new Animated.Value(0)).current;
  const ty=useRef(new Animated.Value(14)).current;
  useEffect(()=>{Animated.parallel([Animated.timing(op,{toValue:1,duration:480,delay,easing:Easing.out(Easing.cubic),useNativeDriver:true}),Animated.timing(ty,{toValue:0,duration:480,delay,easing:Easing.out(Easing.back(1.2)),useNativeDriver:true})]).start();},[]);
  return <Animated.View style={[s.card,{backgroundColor:colors.surface,borderColor:colors.border,opacity:op,transform:[{translateY:ty}]},style]}>{children}</Animated.View>;
});

const StarField=memo(function StarField({enabled,color}:{enabled:boolean;color:string}){
  const {width,height}=useWindowDimensions();
  const stars=useMemo(()=>Array.from({length:32}).map((_,i)=>({id:i,left:Math.random()*width,top:Math.random()*(height*0.8),size:Math.random()*2.5+1,duration:1900+Math.random()*2400,delay:Math.random()*1600})),[width,height]);
  if(!enabled) return null;
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>{stars.map(st=><TwinkStar key={st.id} star={st} color={color}/>)}</View>;
});
function TwinkStar({star,color}:{star:any;color:string}){
  const op=useRef(new Animated.Value(0.15)).current;
  const sc=useRef(new Animated.Value(0.8)).current;
  useEffect(()=>{const loop=Animated.loop(Animated.sequence([Animated.parallel([Animated.timing(op,{toValue:1,duration:star.duration/2,delay:star.delay,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),Animated.timing(sc,{toValue:1.4,duration:star.duration/2,delay:star.delay,easing:Easing.inOut(Easing.sin),useNativeDriver:true})]),Animated.parallel([Animated.timing(op,{toValue:0.15,duration:star.duration/2,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),Animated.timing(sc,{toValue:0.8,duration:star.duration/2,easing:Easing.inOut(Easing.sin),useNativeDriver:true})])]));loop.start();return()=>loop.stop();},[]);
  return <Animated.View style={{position:'absolute',left:star.left,top:star.top,width:star.size,height:star.size,borderRadius:99,backgroundColor:color,opacity:op,transform:[{scale:sc}]}}/>;
}

const PressBtn=memo(function PressBtn({onPress,style,children}:{onPress:()=>void;style:any;children:React.ReactNode}){
  const sc=useRef(new Animated.Value(1)).current;
  return <Animated.View style={{transform:[{scale:sc}]}}><TouchableOpacity style={style} onPressIn={()=>Animated.spring(sc,{toValue:0.95,useNativeDriver:true,speed:60}).start()} onPressOut={()=>{Animated.spring(sc,{toValue:1,useNativeDriver:true,speed:25}).start();onPress();}} activeOpacity={1}>{children}</TouchableOpacity></Animated.View>;
});

function AnimBar({value,color,bg,delayed=false,height=10}:{value:number;color:string;bg:string;delayed?:boolean;height?:number}){
  const anim=useRef(new Animated.Value(0)).current;
  useEffect(()=>{Animated.timing(anim,{toValue:value,duration:700,delay:delayed?350:0,easing:Easing.out(Easing.cubic),useNativeDriver:false}).start();},[value]);
  const width=anim.interpolate({inputRange:[0,100],outputRange:['0%','100%']});
  return <View style={{height,borderRadius:999,overflow:'hidden',backgroundColor:bg}}><Animated.View style={{height:'100%',borderRadius:999,width,backgroundColor:color}}/></View>;
}

function MiniBar({label,value,color,colors,delayed=false}:{label:string;value:number;color:string;colors:Colors;delayed?:boolean}){
  return <View style={{marginBottom:11}}><View style={s.rowBetween}><Text style={{fontSize:13,fontWeight:'700',color:colors.text}}>{label}</Text><Text style={{fontSize:11,fontWeight:'900',color}}>{value}%</Text></View><View style={{marginTop:5}}><AnimBar value={value} color={color} bg={colors.surfaceSoft} delayed={delayed}/></View></View>;
}

function StatBlock({label,value,color,colors}:{label:string;value:string|number;color:string;colors:Colors}){
  return <View style={[s.statBlock,{backgroundColor:colors.surfaceSoft,borderColor:colors.border}]}><Text style={[s.statVal,{color}]}>{value}</Text><Text style={[s.statLbl,{color:colors.subText}]}>{label}</Text></View>;
}

function SearchBar2({value,onChangeText,placeholder,colors}:{value:string;onChangeText:(t:string)=>void;placeholder:string;colors:Colors}){
  return <View style={[s.searchBar,{backgroundColor:colors.input,borderColor:colors.border}]}><Text style={{fontSize:14,marginRight:7,color:colors.subText}}>🔍</Text><TextInput style={[s.searchInput,{color:colors.text}]} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.subText} autoCorrect={false}/>{value.length>0&&<TouchableOpacity onPress={()=>onChangeText('')}><Text style={{fontSize:14,color:colors.subText,paddingLeft:7}}>✕</Text></TouchableOpacity>}</View>;
}

function DailyRewardModal({visible,xp,streak,onClose,colors}:{visible:boolean;xp:number;streak:number;onClose:()=>void;colors:Colors}){
  const sc=useRef(new Animated.Value(0.6)).current;
  const op=useRef(new Animated.Value(0)).current;
  useEffect(()=>{if(visible){Animated.parallel([Animated.spring(sc,{toValue:1,tension:60,friction:7,useNativeDriver:true}),Animated.timing(op,{toValue:1,duration:280,useNativeDriver:true})]).start();}else{sc.setValue(0.6);op.setValue(0);}},[visible]);
  if(!visible) return null;
  return <Modal transparent animationType="none" visible onRequestClose={onClose}><View style={[s.overlay,{backgroundColor:colors.overlay}]}><Animated.View style={[s.rewardBox,{backgroundColor:colors.surface,borderColor:colors.border,transform:[{scale:sc}],opacity:op}]}><Text style={{fontSize:54,textAlign:'center'}}>🎁</Text><Text style={[s.rewardTitle,{color:colors.text}]}>Günlük Ödül!</Text><View style={[s.xpBadge,{backgroundColor:colors.primary+'22',borderColor:colors.primary,alignSelf:'center',marginBottom:10}]}><Text style={{fontSize:26,fontWeight:'900',color:colors.primary}}>+{xp} XP</Text></View><View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:10}}><Text style={{fontSize:22}}>🔥</Text><Text style={{fontSize:17,fontWeight:'900',color:colors.warning}}>{streak} günlük seri!</Text></View><Text style={{fontSize:13,color:colors.subText,textAlign:'center',marginBottom:18}}>Her gün giriş yaparak daha büyük ödüller kazan.</Text><PressBtn onPress={onClose} style={[s.mainBtn,{backgroundColor:colors.primary}]}><Text style={s.mainBtnTxt}>Harika! 🎉</Text></PressBtn></Animated.View></View></Modal>;
}

function LevelUpModal({visible,newLevel,onClose,colors}:{visible:boolean;newLevel:number;onClose:()=>void;colors:Colors}){
  const sc=useRef(new Animated.Value(0.5)).current;
  const rot=useRef(new Animated.Value(0)).current;
  useEffect(()=>{if(visible){Animated.parallel([Animated.spring(sc,{toValue:1,tension:50,friction:6,useNativeDriver:true}),Animated.timing(rot,{toValue:1,duration:700,easing:Easing.out(Easing.back(2)),useNativeDriver:true})]).start();}else{sc.setValue(0.5);rot.setValue(0);}},[visible]);
  const r=rot.interpolate({inputRange:[0,1],outputRange:['0deg','360deg']});
  if(!visible) return null;
  return <Modal transparent animationType="none" visible onRequestClose={onClose}><View style={[s.overlay,{backgroundColor:colors.overlay}]}><Animated.View style={[s.rewardBox,{backgroundColor:colors.surface,borderColor:colors.primary,transform:[{scale:sc}]}]}><Animated.Text style={{fontSize:60,textAlign:'center',transform:[{rotate:r}]}}>⭐</Animated.Text><Text style={[s.rewardTitle,{color:colors.primary}]}>SEVİYE ATLADI!</Text><View style={[s.xpBadge,{backgroundColor:colors.primary+'22',borderColor:colors.primary,alignSelf:'center',marginBottom:12}]}><Text style={{fontSize:26,fontWeight:'900',color:colors.primary}}>Seviye {newLevel}</Text></View><Text style={{fontSize:13,color:colors.subText,textAlign:'center',marginBottom:18}}>Finansal yolculuğunda büyük adım!</Text><PressBtn onPress={onClose} style={[s.mainBtn,{backgroundColor:colors.primary}]}><Text style={s.mainBtnTxt}>Devam Et 🚀</Text></PressBtn></Animated.View></View></Modal>;
}


// ─── 🔒 PIN LOCK SCREEN ────────────────────────────────────────────────────────
function PinLockScreen({correctPin,onUnlock,colors}:{correctPin:string;onUnlock:()=>void;colors:Colors}){
  const [input,setInput]=useState('');
  const [error,setError]=useState(false);
  const [attempts,setAttempts]=useState(0);
  const shake=useRef(new Animated.Value(0)).current;

  const doShake=()=>{
    Animated.sequence([
      Animated.timing(shake,{toValue:10,duration:60,useNativeDriver:true}),
      Animated.timing(shake,{toValue:-10,duration:60,useNativeDriver:true}),
      Animated.timing(shake,{toValue:8,duration:60,useNativeDriver:true}),
      Animated.timing(shake,{toValue:0,duration:60,useNativeDriver:true}),
    ]).start();
  };

  const press=(d:string)=>{
    if(input.length>=4) return;
    const next=input+d;
    setInput(next);
    if(next.length===4){
      if(next===correctPin){
        onUnlock();
      } else {
        setAttempts(a=>a+1);
        setError(true);
        doShake();
        setTimeout(()=>{setInput('');setError(false);},900);
      }
    }
  };

  const del=()=>setInput(p=>p.slice(0,-1));

  const KEYS=['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <SafeAreaView style={{flex:1,backgroundColor:colors.background,paddingTop:EXTRA_TOP,alignItems:'center',justifyContent:'center'}}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background}/>
      <Text style={{fontSize:48,marginBottom:16}}>🔐</Text>
      <Text style={{fontSize:22,fontWeight:'900',color:colors.text,marginBottom:6}}>PIN Gir</Text>
      <Text style={{fontSize:13,color:colors.subText,marginBottom:32}}>Fakirmetre&apos;a hoş geldin</Text>

      <Animated.View style={{flexDirection:'row',gap:16,marginBottom:40,transform:[{translateX:shake}]}}>
        {[0,1,2,3].map(i=>(
          <View key={i} style={{
            width:18,height:18,borderRadius:9,
            backgroundColor: i < input.length ? (error ? colors.danger : colors.primary) : colors.surfaceSoft,
            borderWidth:2,
            borderColor: i < input.length ? (error ? colors.danger : colors.primary) : colors.border,
          }}/>
        ))}
      </Animated.View>

      {error&&<Text style={{fontSize:13,color:colors.danger,marginBottom:16,fontWeight:'800'}}>❌ Yanlış PIN {attempts>2?`(${attempts} deneme)`:''}</Text>}

      <View style={{width:260,flexDirection:'row',flexWrap:'wrap',gap:12,justifyContent:'center'}}>
        {KEYS.map((k,i)=>(
          <TouchableOpacity
            key={i}
            onPress={()=>{ if(k==='⌫') del(); else if(k!=='') press(k); }}
            style={{
              width:72,height:72,borderRadius:36,
              backgroundColor: k==='' ? 'transparent' : colors.surface,
              borderWidth: k==='' ? 0 : 1,
              borderColor: colors.border,
              alignItems:'center',justifyContent:'center',
            }}
            activeOpacity={k===''?1:0.7}
          >
            <Text style={{fontSize:k==='⌫'?22:26,fontWeight:'700',color:k==='⌫'?colors.subText:colors.text}}>{k}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ─── 🔒 PIN SETUP MODAL ────────────────────────────────────────────────────────
function PinSetupModal({visible,onClose,onSave,colors}:{visible:boolean;onClose:()=>void;onSave:(pin:string)=>void;colors:Colors}){
  const [step,setStep]=useState<'set'|'confirm'>('set');
  const [first,setFirst]=useState('');
  const [input,setInput]=useState('');
  const [error,setError]=useState('');

  useEffect(()=>{if(visible){setStep('set');setFirst('');setInput('');setError('');}},[visible]);

  const press=(d:string)=>{
    if(input.length>=4) return;
    const next=input+d;
    setInput(next);
    if(next.length===4){
      if(step==='set'){
        setFirst(next);
        setTimeout(()=>{setStep('confirm');setInput('');},300);
      } else {
        if(next===first){
          onSave(next);
          onClose();
        } else {
          setError('PIN eşleşmedi. Tekrar dene.');
          setTimeout(()=>{setStep('set');setFirst('');setInput('');setError('');},1000);
        }
      }
    }
  };
  const del=()=>setInput(p=>p.slice(0,-1));

  const KEYS=['1','2','3','4','5','6','7','8','9','','0','⌫'];
  if(!visible) return null;

  return (
    <Modal animationType="slide" transparent={false} visible onRequestClose={onClose}>
      <SafeAreaView style={{flex:1,backgroundColor:colors.background,paddingTop:EXTRA_TOP,alignItems:'center',justifyContent:'center'}}>
        <TouchableOpacity onPress={onClose} style={{position:'absolute',top:EXTRA_TOP+16,left:16}}>
          <Text style={{color:colors.primary,fontSize:16,fontWeight:'800'}}>← İptal</Text>
        </TouchableOpacity>
        <Text style={{fontSize:40,marginBottom:14}}>🔐</Text>
        <Text style={{fontSize:20,fontWeight:'900',color:colors.text,marginBottom:6}}>{step==='set'?'Yeni PIN Belirle':'PIN\u2019i Onayla'}</Text>
        <Text style={{fontSize:13,color:colors.subText,marginBottom:28}}>{step==='set'?'4 haneli bir PIN oluştur':'Aynı PIN\u2019i tekrar gir'}</Text>
        {error!==''&&<Text style={{fontSize:13,color:colors.danger,marginBottom:14,fontWeight:'800'}}>{error}</Text>}
        <View style={{flexDirection:'row',gap:16,marginBottom:36}}>
          {[0,1,2,3].map(i=>(
            <View key={i} style={{width:16,height:16,borderRadius:8,backgroundColor:i<input.length?colors.primary:colors.surfaceSoft,borderWidth:2,borderColor:i<input.length?colors.primary:colors.border}}/>
          ))}
        </View>
        <View style={{width:260,flexDirection:'row',flexWrap:'wrap',gap:12,justifyContent:'center'}}>
          {KEYS.map((k,i)=>(
            <TouchableOpacity key={i} onPress={()=>{if(k==='⌫') del(); else if(k!=='') press(k);}} style={{width:72,height:72,borderRadius:36,backgroundColor:k===''?'transparent':colors.surface,borderWidth:k===''?0:1,borderColor:colors.border,alignItems:'center',justifyContent:'center'}} activeOpacity={k===''?1:0.7}>
              <Text style={{fontSize:k==='⌫'?22:26,fontWeight:'700',color:k==='⌫'?colors.subText:colors.text}}>{k}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App(){
  const [appState,setAppState]=useState<AppState>('splash');
  const [welcomePopup,setWelcomePopup]=useState(false);
  const [firebaseUser,setFirebaseUser]=useState<any>(null);
  const [authLoading,setAuthLoading]=useState(false);
  const [globalSearch,setGlobalSearch]=useState('');
  const [searchVisible,setSearchVisible]=useState(false);
  const [aboutVisible,setAboutVisible]=useState(false);
  const [activeTab,setActiveTab]=useState<TabKey>('home');
  const [settings,setSettings]=useState<SettingsState>(DEFAULT_SETTINGS);
  const [profile,setProfile]=useState<Profile>(DEFAULT_PROFILE);
  const [history,setHistory]=useState<HistoryItem[]>([]);
  const [challengeDone,setChallengeDone]=useState(false);
  // Quiz
  const [activeQuiz,setActiveQuiz]=useState<QuizMode|null>(null);
  const [quizStarted,setQuizStarted]=useState(false);
  const [quizFinished,setQuizFinished]=useState(false);
  const [questionIndex,setQuestionIndex]=useState(0);
  const [score,setScore]=useState(0);
  // Kitchen
  const [meals,setMeals]=useState<MealEntry[]>([]);
  const [mealSearch,setMealSearch]=useState('');
  const [budgetInput,setBudgetInput]=useState('');
  const [budgetResult,setBudgetResult]=useState<{maxBudget:number;name:string;emoji:string;items:{food:string;price:number}[];totalCal:number}[]|null>(null);
  const [kitchenTab,setKitchenTab]=useState<'kalori'|'butce'|'takip'|'gelir'>('kalori');
  const [foodCat,setFoodCat]=useState('Tümü');
  const [expenses,setExpenses]=useState<ExpenseEntry[]>([]);
  const [savingsGoals,setSavingsGoals]=useState<SavingsGoal[]>([]);
  const [expenseTitle,setExpenseTitle]=useState('');
  const [incomeTitle,setIncomeTitle]=useState('');
  const [incomeAmount,setIncomeAmount]=useState('');
  const [incomeCategory,setIncomeCategory]=useState('Maaş');
  const [incomes,setIncomes]=useState<{id:string;title:string;amount:number;category:string;createdAt:string}[]>([]);
  const [expenseAmount,setExpenseAmount]=useState('');
  const [expenseCategory,setExpenseCategory]=useState<(typeof EXPENSE_CATEGORIES)[number]>('Gıda');
  const [goalTitle,setGoalTitle]=useState('');
  const [goalTarget,setGoalTarget]=useState('');
  const [monthlyBudgetLimit,setMonthlyBudgetLimit]=useState('');
  const [expenseSearch,setExpenseSearch]=useState('');
  const [expenseFilter,setExpenseFilter]=useState<'Tümü' | 'Bu Ay' | (typeof EXPENSE_CATEGORIES)[number]>('Bu Ay');
  // Astro
  const [astroTab,setAstroTab]=useState<'burç'|'rüya'>('burç');
  const [dreamSearch,setDreamSearch]=useState('');
  const [selectedDream,setSelectedDream]=useState<{keyword:string;emoji:string;meaning:string;finance:string}|null>(null);
  // Modals
  const [dailyRewardVisible,setDailyRewardVisible]=useState(false);
  const [levelUpVisible,setLevelUpVisible]=useState(false);
  const [newLevel,setNewLevel]=useState(1);
  // ── YENİ SİSTEM STATE ──
  const [premium,setPremium]=useState<PremiumTier>('free');
  const [aiAdvisorVisible,setAiAdvisorVisible]=useState(false);
  const [premiumModalVisible,setPremiumModalVisible]=useState(false);
  const [notificationModalVisible,setNotificationModalVisible]=useState(false);
  const [tournamentVisible,setTournamentVisible]=useState(false);
  const [cloudSyncVisible,setCloudSyncVisible]=useState(false);
  const [lastCloudBackupAt,setLastCloudBackupAt]=useState<string>('');
  const [aiUsageCount,setAiUsageCount]=useState(0);
  // Topluluk
  const [helpRequests,setHelpRequests]=useState<HelpRequest[]>(MOCK_HELP);
  const [communityPosts,setCommunityPosts]=useState<CommunityPost[]>(MOCK_POSTS);
  const [helpModalVisible,setHelpModalVisible]=useState(false);
  const [communityTab,setCommunityTab]=useState<'feed'|'yardim'|'benim'>('feed');
  const [helpCat,setHelpCat]=useState('Tümü');
  const [newPostText,setNewPostText]=useState('');
  const [newHelpTitle,setNewHelpTitle]=useState('');
  const [newHelpDesc,setNewHelpDesc]=useState('');
  const [newHelpCat,setNewHelpCat]=useState('Bütçe');
  const [aiHelpLoading,setAiHelpLoading]=useState(false);
  const [aiHelpAnswer,setAiHelpAnswer]=useState('');
  const [selectedHelp,setSelectedHelp]=useState<HelpRequest|null>(null);
  const [rewardedAdVisible,setRewardedAdVisible]=useState(false);
  const [pinSetupVisible,setPinSetupVisible]=useState(false);
  const [resultCardVisible,setResultCardVisible]=useState(false);
  const [notifications,setNotifications]=useState<NotificationItem[]>([
    {id:'n1',title:'Hoş Geldin! 🎉',body:'Fakirmetre başladı.',time:new Date().toLocaleString('tr-TR'),read:false,icon:'🚀'},
    {id:'n2',title:'Günlük Görev',body:'Bugünkü finansal görevi tamamla!',time:new Date().toLocaleString('tr-TR'),read:false,icon:'🎯'},
    {id:'n3',title:'Haftalık Turnuva',body:'Bu hafta liderlik tablosuna gir!',time:new Date().toLocaleString('tr-TR'),read:true,icon:'🏆'},
  ]);
  const [seasonChallenges,setSeasonChallenges]=useState<SeasonChallenge[]>(
    SEASON_BASE.map(c=>({...c,done:false,current:0}))
  );

  const colors=useMemo(()=>getTheme(settings.darkMode?'dark':'light',settings.accent),[settings.darkMode,settings.accent]);
  const quote=useMemo(()=>getDailyQuote(),[]);
  const challenge=useMemo(()=>getDailyChallenge(),[]);
  const horoscope=useMemo(()=>getPersonalizedHoroscope(profile,score,history),[profile,score,history]);
  const currentQuiz=activeQuiz?QUIZZES[activeQuiz]:null;
  const currentQs=currentQuiz?.questions??[];
  const maxScore=useMemo(()=>currentQs.reduce((a,q)=>a+q.yes,0),[currentQs]);
  const result=useMemo(()=>getResult(score,maxScore||1),[score,maxScore]);
  const progress=useMemo(()=>{if(!quizStarted)return 0;if(quizFinished)return 100;return Math.round((questionIndex/currentQs.length)*100);},[quizStarted,quizFinished,questionIndex,currentQs.length]);
  const totalCalories=useMemo(()=>meals.reduce((a,m)=>a+m.calories,0),[meals]);
  const foodCategories=useMemo(()=>['Tümü',...new Set(FOOD_DB.map(f=>f.category))],[]);
  const filteredFoods=useMemo(()=>FOOD_DB.filter(f=>(foodCat==='Tümü'||f.category===foodCat)&&f.name.toLowerCase().includes(mealSearch.toLowerCase())),[foodCat,mealSearch]);
  const filteredDreams=useMemo(()=>dreamSearch.length>1?DREAM_DATA.filter(d=>d.keyword.includes(dreamSearch.toLowerCase())||d.meaning.toLowerCase().includes(dreamSearch.toLowerCase())):[],[dreamSearch]);
  const unreadNotifs=useMemo(()=>notifications.filter(n=>!n.read).length,[notifications]);
  const expenseSummary=useMemo(()=>summarizeExpenses(expenses),[expenses]);
  const recentDailyExpenseAverage=useMemo(()=>getRecentExpenseAverage(expenses),[expenses]);
  const weeklyExpenseTotal=useMemo(()=>expenses.filter(item=>{const ts=new Date(item.createdAt).getTime();return Number.isFinite(ts)&&Date.now()-ts<=7*24*60*60*1000;}).reduce((sum,item)=>sum+item.amount,0),[expenses]);
  const budgetInsights=useMemo(()=>buildExpenseInsights(expenses, savingsGoals),[expenses,savingsGoals]);
  const activeGoals=useMemo(()=>savingsGoals.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),[savingsGoals]);
  const monthlyExpenseTotal=useMemo(()=>getMonthlyExpenseTotal(expenses),[expenses]);
  const monthlyBudgetValue=useMemo(()=>Number(monthlyBudgetLimit.replace(',', '.')) || 0,[monthlyBudgetLimit]);
  const monthlyBudgetRemaining=useMemo(()=>Math.max(0, monthlyBudgetValue - monthlyExpenseTotal),[monthlyBudgetValue,monthlyExpenseTotal]);
  const monthlyBudgetPercent=useMemo(()=>monthlyBudgetValue>0?Math.min(100,Math.round((monthlyExpenseTotal/monthlyBudgetValue)*100)):0,[monthlyBudgetValue,monthlyExpenseTotal]);
  const expenseCategoryDistribution=useMemo(()=>getCategoryDistribution(expenses.filter(item=>expenseFilter==='Bu Ay'?isSameMonth(item.createdAt):expenseFilter==='Tümü'?true:item.category===expenseFilter)),[expenses,expenseFilter]);
  const visibleExpenses=useMemo(()=>expenses.filter(item=>{
    const q=expenseSearch.trim().toLowerCase();
    const matchesFilter = expenseFilter==='Tümü' ? true : expenseFilter==='Bu Ay' ? isSameMonth(item.createdAt) : item.category===expenseFilter;
    const matchesSearch = q==='' ? true : item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  }),[expenses,expenseSearch,expenseFilter]);


  const globalSearchResults=useMemo(()=>{
    const q=globalSearch.trim().toLowerCase();
    if(q.length<2) return [];
    const results:any[]=[];
    expenses.filter(e=>e.title.toLowerCase().includes(q)||e.category.toLowerCase().includes(q)).slice(0,5).forEach(e=>results.push({type:'expense',icon:'💸',title:e.title,sub:`${e.category} • ₺${e.amount.toFixed(0)}`,action:()=>{setActiveTab('kitchen');setSearchVisible(false);}}));
    incomes.filter(i=>i.title.toLowerCase().includes(q)||i.category.toLowerCase().includes(q)).slice(0,5).forEach(i=>results.push({type:'income',icon:'💵',title:i.title,sub:`${i.category} • ₺${i.amount.toFixed(0)}`,action:()=>{setActiveTab('kitchen');setSearchVisible(false);}}));
    FOOD_DB.filter(f=>f.name.toLowerCase().includes(q)).slice(0,4).forEach(f=>results.push({type:'food',icon:f.emoji,title:f.name,sub:`${f.calories} kcal • ₺${f.price}`,action:()=>{setActiveTab('kitchen');setSearchVisible(false);}}));
    DREAM_DATA.filter(d=>d.keyword.includes(q)||d.meaning.toLowerCase().includes(q)).slice(0,3).forEach(d=>results.push({type:'dream',icon:d.emoji,title:d.keyword,sub:'Ruya Tabiri',action:()=>{setActiveTab('astro');setSearchVisible(false);}}));
    return results;
  },[globalSearch,expenses,incomes]);

  const headerGlow=useRef(new Animated.Value(0.7)).current;
  const questionFade=useRef(new Animated.Value(1)).current;
  const questionSlide=useRef(new Animated.Value(0)).current;
  const resultScale=useRef(new Animated.Value(0.8)).current;
  const resultOpacity=useRef(new Animated.Value(0)).current;

  useEffect(()=>{const loop=Animated.loop(Animated.sequence([Animated.timing(headerGlow,{toValue:1,duration:2200,useNativeDriver:true,easing:Easing.inOut(Easing.quad)}),Animated.timing(headerGlow,{toValue:0.7,duration:2200,useNativeDriver:true,easing:Easing.inOut(Easing.quad)})]));loop.start();return()=>loop.stop();},[]);

  // 💾 AsyncStorage: veri kaydetme
  useEffect(()=>{
    if(appState==='app'||appState==='locked'){
      savePersistedAppData({
        profile,
        history,
        settings,
        premium,
        notifications,
        aiUsageCount,
        lastCloudBackupAt,
        meals,
        expenses,
        incomes,
        savingsGoals,
        monthlyBudgetLimit: monthlyBudgetValue,
      });
    }
  },[profile,history,settings,premium,notifications,aiUsageCount,lastCloudBackupAt,meals,expenses,savingsGoals,monthlyBudgetValue,appState]);
  // 📊 Analytics kullanıcı prop
  useEffect(()=>{Analytics.setProp('level',String(profile.level));Analytics.setProp('premium',premium);Analytics.setProp('zodiac',profile.zodiac);},[profile.level,premium,profile.zodiac]);



  useEffect(()=>{
    const subscriber=auth().onAuthStateChanged(user=>{setFirebaseUser(user);});
    return subscriber;
  },[]);
  const signInWithGoogle=async()=>{
    try{
      setAuthLoading(true);
      await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog:true});
      const {data}=await GoogleSignin.signIn();
      const googleCredential=auth.GoogleAuthProvider.credential(data?.idToken??'');
      await auth().signInWithCredential(googleCredential);
      addNotif('Google ile Giris Yapildi!','Hesabin Firebase ile senkronize edildi.','🔐');
    }catch(e:any){
      if(e.code!=='SIGN_IN_CANCELLED'){Alert.alert('Hata','Google ile giris yapilamadi.');}
    }finally{setAuthLoading(false);}
  };
  const signOut=async()=>{
    try{await GoogleSignin.signOut();await auth().signOut();addNotif('Cikis Yapildi','Hesabindan guvenli cikis yapildi.','👋');}
    catch(e:any){Alert.alert('Hata','Cikis yapilamadi.');}
  };

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

  const addXP=useCallback((xpGain:number)=>{
    setProfile(prev=>{
      const oldLvl=profileLevel(prev.xp);
      const nXP=prev.xp+xpGain;
      const nLvl=profileLevel(nXP);
      if(nLvl>oldLvl){setNewLevel(nLvl);setTimeout(()=>setLevelUpVisible(true),700);Analytics.log('level_up',{newLevel:nLvl});}
      return {...prev,xp:nXP,level:nLvl};
    });
  },[]);

  const handleDailyLogin=useCallback(()=>{
    const t=today();
    setProfile(prev=>{
      if(prev.lastLoginDate===t) return prev;
      const xpR=getDailyReward();
      const nStreak=prev.lastLoginDate?prev.streak+1:1;
      setTimeout(()=>setDailyRewardVisible(true),400);
      const oldLvl=profileLevel(prev.xp);
      const nXP=prev.xp+xpR;
      const nLvl=profileLevel(nXP);
      if(nLvl>oldLvl){setNewLevel(nLvl);setTimeout(()=>setLevelUpVisible(true),1400);}
      return {...prev,lastLoginDate:t,streak:nStreak,xp:nXP,level:nLvl};
    });
  },[]);

  const animQ=useCallback((cb:()=>void)=>{
    Animated.parallel([Animated.timing(questionFade,{toValue:0,duration:130,useNativeDriver:true}),Animated.timing(questionSlide,{toValue:-18,duration:130,useNativeDriver:true})]).start(()=>{cb();questionSlide.setValue(18);Animated.parallel([Animated.timing(questionFade,{toValue:1,duration:170,useNativeDriver:true}),Animated.timing(questionSlide,{toValue:0,duration:170,useNativeDriver:true})]).start();});
  },[questionFade,questionSlide]);

  const answerQuestion=useCallback((kind:'yes'|'no')=>{
    if(!currentQuiz) return;
    const q=currentQs[questionIndex];
    const pt=kind==='yes'?q.yes:q.no;
    const ns=score+pt;
    if(questionIndex===currentQs.length-1){
      animQ(()=>{
        const fr=getResult(ns,maxScore);
        setScore(ns);setQuizFinished(true);
        const xpGain=XP_TABLE[activeQuiz!];
        setHistory(prev=>[{id:`${Date.now()}`,score:ns,maxScore,title:fr.title,emoji:fr.emoji,level:fr.level,date:new Date().toLocaleString('tr-TR'),quizMode:activeQuiz!,xpEarned:xpGain},...prev]);
        setProfile(prev=>({...prev,totalTests:prev.totalTests+1,bestScore:Math.min(prev.bestScore,ns)}));
        setSeasonChallenges(sc=>sc.map(c=>c.id==='s1'?{...c,current:Math.min(c.current+1,c.target),done:c.current+1>=c.target}:c));
        Analytics.log('quiz_completed',{quizMode:activeQuiz,score:ns,maxScore,title:fr.title});
        addXP(xpGain);
        resultScale.setValue(0.8);resultOpacity.setValue(0);
        setTimeout(()=>Animated.parallel([Animated.spring(resultScale,{toValue:1,useNativeDriver:true,tension:60,friction:7}),Animated.timing(resultOpacity,{toValue:1,duration:400,useNativeDriver:true})]).start(),100);
      });
      return;
    }
    animQ(()=>{setScore(ns);setQuestionIndex(p=>p+1);});
  },[animQ,currentQs,currentQuiz,questionIndex,score,maxScore,activeQuiz,addXP,resultScale,resultOpacity]);

  const addNotif=(title:string,body:string,icon:string)=>setNotifications((p:NotificationItem[])=>[{id:`n${Date.now()}`,title,body,time:new Date().toLocaleString('tr-TR'),read:false,icon},...p]);
  const resetQuiz=()=>{setActiveQuiz(null);setQuizStarted(false);setQuizFinished(false);setQuestionIndex(0);setScore(0);questionFade.setValue(1);questionSlide.setValue(0);};
  const handleShare=async()=>{ setResultCardVisible(true); Analytics.log('result_card_open',{quizMode:activeQuiz}); };
  const updateSetting=<K extends keyof SettingsState>(key:K,value:SettingsState[K])=>setSettings(prev=>({...prev,[key]:value}));
  const addMeal=(food:typeof FOOD_DB[0])=>{setMeals(prev=>[...prev,{id:`${Date.now()}`,name:food.name,calories:food.calories,time:new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}]);setSeasonChallenges(sc=>sc.map(c=>c.id==='s4'?{...c,current:Math.min(c.current+1,c.target),done:c.current+1>=c.target}:c));Analytics.log('meal_added',{name:food.name,calories:food.calories});};
  const removeMeal=(id:string)=>setMeals(prev=>prev.filter(m=>m.id!==id));
  const addExpenseEntry=()=>{
    const amount=Number(expenseAmount.replace(',', '.'));
    if(!expenseTitle.trim() || !Number.isFinite(amount) || amount<=0){
      Alert.alert('Eksik bilgi','Harcama adı ve geçerli tutar gir.');
      return;
    }
    setExpenses(prev=>[createExpense({title:expenseTitle, amount, category:expenseCategory}),...prev]);
    setExpenseTitle('');
    setExpenseAmount('');
    addXP(10);
    addNotif('Harcama eklendi','Bütçe takibine yeni kayıt eklendi.','💸');
    scheduleLocalNotif('💸 Harcama Kaydedildi', `${expenseTitle} - ₺${expenseAmount}`, 1);
    if(monthlyBudgetValue>0){
      const newTotal=expenses.reduce((s,e)=>s+e.amount,0)+Number(expenseAmount.replace(',','.'));
      const pct=Math.round((newTotal/monthlyBudgetValue)*100);
      scheduleBudgetAlert(pct);
    }
  };
  const addSavingsGoalEntry=()=>{
    const target=Number(goalTarget.replace(',', '.'));
    if(!goalTitle.trim() || !Number.isFinite(target) || target<=0){
      Alert.alert('Eksik bilgi','Hedef adı ve hedef tutar gir.');
      return;
    }
    setSavingsGoals(prev=>[createSavingsGoal({title:goalTitle, target}),...prev]);
    setGoalTitle('');
    setGoalTarget('');
    addXP(20);
    addNotif('Yeni hedef oluşturuldu','Bir tasarruf hedefi oluşturdun.','🎯');
    scheduleLocalNotif('🎯 Yeni Tasarruf Hedefi!', `"${goalTitle}" hedefi oluşturuldu.`, 1);
  };
  const contributeGoal=(goalId:string, amount:number)=>setSavingsGoals(prev=>prev.map(goal=>goal.id===goalId?{...goal,current:Math.min(goal.target, goal.current+amount)}:goal));
  const removeExpense=(expenseId:string)=>setExpenses(prev=>prev.filter(item=>item.id!==expenseId));
  const removeGoal=(goalId:string)=>setSavingsGoals(prev=>prev.filter(goal=>goal.id!==goalId));
  const exportExpensesReport=async()=>{
    if(expenses.length===0){
      Alert.alert('Veri yok','Dışa aktarmak için önce harcama ekle.');
      return;
    }
    const rows = ['Tarih;Başlık;Kategori;Tutar'];
    expenses.forEach(item=>rows.push(`${new Date(item.createdAt).toLocaleDateString('tr-TR')};${item.title};${item.category};${item.amount.toFixed(2)}`));
    const goalRows = ['', 'Hedefler', 'Başlık;Mevcut;Hedef'];
    activeGoals.forEach(goal=>goalRows.push(`${goal.title};${goal.current.toFixed(2)};${goal.target.toFixed(2)}`));
    await Share.share({message:['Fakirmetre harcama raporu', rows.join('\n'), goalRows.join('\n')].join('\n\n')});
  };

  const handleSplashDone=()=>{
    loadPersistedAppData().then(data=>{
      if(!data){
        setAppState('onboarding');
        return;
      }
      setProfile(data.profile);
      setHistory(data.history);
      setSettings(data.settings);
      setPremium(data.premium);
      setNotifications(data.notifications.length?data.notifications:[
        {id:'n1',title:'Hoş Geldin! 🎉',body:'Fakirmetre başladı.',time:new Date().toLocaleString('tr-TR'),read:false,icon:'🚀'},
      ]);
      setAiUsageCount(data.aiUsageCount);
      setLastCloudBackupAt(data.lastCloudBackupAt);
      setMeals(data.meals);
      setExpenses(data.expenses);
      setSavingsGoals(data.savingsGoals);
      setMonthlyBudgetLimit(data.monthlyBudgetLimit ? String(data.monthlyBudgetLimit) : '');
      setAppState(data.settings.pinEnabled && data.settings.pinCode ? 'locked' : 'app');
      handleDailyLogin();
      setTimeout(()=>setWelcomePopup(true),1200);
    }).catch(()=>setAppState('onboarding'));
  };
  const handleOnboardingDone=(p:Profile)=>{setProfile(p);setAppState('app');setTimeout(()=>setWelcomePopup(true),800);setTimeout(()=>setDailyRewardVisible(true),700);Analytics.log('onboarding_completed',{zodiac:p.zodiac});};

  // ─── ASTRO TAB ─────────────────────────────────────────────────────────────
  const renderAstro=()=>(
    <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} removeClippedSubviews={true}>
      {/* Sub Tabs */}
      <View style={[s.subTabRow,{backgroundColor:colors.surfaceSoft,borderColor:colors.border}]}>
        {(['burç','rüya'] as const).map(t=><TouchableOpacity key={t} onPress={()=>setAstroTab(t)} style={[s.subTab,{backgroundColor:astroTab===t?colors.primary:'transparent'}]}><Text style={{fontSize:13,fontWeight:'900',color:astroTab===t?'#fff':colors.subText}}>{t==='burç'?'🔮 Burç Yorumu':'🌙 Rüya Tabiri'}</Text></TouchableOpacity>)}
      </View>

      {astroTab==='burç'&&<>
        <GlassCard colors={colors}>
          <View style={{flexDirection:'row',alignItems:'center',gap:12,marginBottom:14}}>
            <Text style={{fontSize:44}}>{zodiacEmojis[profile.zodiac]}</Text>
            <View style={{flex:1}}>
              <Text style={[s.sectionTitle,{color:colors.text,marginBottom:2}]}>{profile.zodiac} Burcu</Text>
              <Text style={{fontSize:12,color:colors.subText}}>{ZODIAC_DATES[profile.zodiac]} • {ZODIAC_ELEMENT[profile.zodiac]}</Text>
              <Text style={{fontSize:12,color:colors.subText}}>{ZODIAC_PLANET[profile.zodiac]} • {profile.name}</Text>
            </View>
          </View>
          <View style={[s.infoBox,{backgroundColor:colors.surfaceSoft,borderColor:colors.primary+'44',marginTop:0}]}>
            <Text style={{fontSize:13,fontWeight:'900',color:colors.primary,marginBottom:6}}>🌟 Bugünkü Kişisel Yorumun</Text>
            <Text style={{fontSize:14,lineHeight:22,color:colors.text}}>{horoscope.daily}</Text>
          </View>
        </GlassCard>

        <GlassCard colors={colors} delay={70}>
          <Text style={[s.sectionTitle,{color:colors.text}]}>💰 Finansal Enerji</Text>
          <Text style={{fontSize:14,lineHeight:22,color:colors.subText,marginBottom:12}}>{horoscope.finance}</Text>
          <View style={{flexDirection:'row',gap:10}}>
            <View style={[s.xpBadge,{backgroundColor:colors.primary+'22',borderColor:colors.primary}]}><Text style={{fontSize:12,fontWeight:'800',color:colors.primary}}>🍀 Şanslı: {horoscope.lucky}</Text></View>
            <View style={[s.xpBadge,{backgroundColor:colors.warning+'22',borderColor:colors.warning}]}><Text style={{fontSize:12,fontWeight:'800',color:colors.warning}}>⚡ Enerji: {horoscope.energy}</Text></View>
          </View>
        </GlassCard>

        <GlassCard colors={colors} delay={120}>
          <Text style={[s.sectionTitle,{color:colors.text}]}>⚠️ Dikkat ve İpucu</Text>
          <View style={[s.infoBox,{backgroundColor:colors.danger+'11',borderColor:colors.danger+'44',marginTop:0,marginBottom:10}]}>
            <Text style={{fontSize:13,lineHeight:21,color:colors.text}}>{horoscope.warning}</Text>
          </View>
          <View style={[s.infoBox,{backgroundColor:colors.success+'11',borderColor:colors.success+'44',marginTop:0}]}>
            <Text style={{fontSize:13,lineHeight:21,color:colors.text}}>{horoscope.tip}</Text>
          </View>
        </GlassCard>

        <GlassCard colors={colors} delay={170}>
          <Text style={[s.sectionTitle,{color:colors.text}]}>🔮 Tüm Burçlar</Text>
          <View style={s.zodiacGrid}>
            {zodiacSigns.map(sign=>{
              const active=profile.zodiac===sign;
              return <TouchableOpacity key={sign} onPress={()=>setProfile(p=>({...p,zodiac:sign}))} style={[s.zodiacChip,{backgroundColor:active?colors.primary:colors.surfaceSoft,borderColor:active?colors.primary:colors.border}]}><Text style={{fontSize:11}}>{zodiacEmojis[sign]}</Text><Text style={{fontSize:11,fontWeight:'800',color:active?'#fff':colors.text}}>{sign}</Text></TouchableOpacity>;
            })}
          </View>
        </GlassCard>
      </>}

      {astroTab==='rüya'&&<>
        <GlassCard colors={colors}>
          <Text style={[s.sectionTitle,{color:colors.text}]}>🌙 Rüya Tabiri</Text>
          <Text style={{fontSize:13,color:colors.subText,marginBottom:12}}>Rüyanızda gördüğünüz nesneyi veya olayı yazın. Anlamını ve finansal mesajını öğrenin.</Text>
          <SearchBar2 value={dreamSearch} onChangeText={setDreamSearch} placeholder="Rüyanızı yazın... (para, ev, su...)" colors={colors}/>
          {dreamSearch.length>1&&filteredDreams.length===0&&<View style={[s.infoBox,{backgroundColor:colors.surfaceSoft,borderColor:colors.border,marginTop:8}]}><Text style={{color:colors.subText,textAlign:'center'}}>"{dreamSearch}" için tabir bulunamadı. Başka kelime deneyin.</Text></View>}
          {filteredDreams.map(d=>(
            <TouchableOpacity key={d.keyword} onPress={()=>setSelectedDream(selectedDream?.keyword===d.keyword?null:d)} style={[s.infoBox,{backgroundColor:selectedDream?.keyword===d.keyword?colors.primary+'18':colors.surfaceSoft,borderColor:selectedDream?.keyword===d.keyword?colors.primary:colors.border,marginTop:10}]}>
              <View style={s.rowBetween}>
                <View style={{flexDirection:'row',gap:8,alignItems:'center'}}>
                  <Text style={{fontSize:22}}>{d.emoji}</Text>
                  <Text style={{fontSize:15,fontWeight:'900',color:colors.text,textTransform:'capitalize'}}>{d.keyword}</Text>
                </View>
                <Text style={{color:colors.subText,fontSize:16}}>{selectedDream?.keyword===d.keyword?'▲':'▼'}</Text>
              </View>
              {selectedDream?.keyword===d.keyword&&<>
                <Text style={{fontSize:13,lineHeight:21,color:colors.text,marginTop:10}}>{d.meaning}</Text>
                <View style={[{backgroundColor:colors.success+'18',borderRadius:12,padding:10,marginTop:8}]}>
                  <Text style={{fontSize:13,lineHeight:20,color:colors.text}}>{d.finance}</Text>
                </View>
              </>}
            </TouchableOpacity>
          ))}
          {dreamSearch.length<2&&<>
            <Text style={{fontSize:13,fontWeight:'800',color:colors.subText,marginTop:8,marginBottom:6}}>Popüler Semboller:</Text>
            <View style={s.zodiacGrid}>
              {DREAM_DATA.slice(0,12).map(d=><TouchableOpacity key={d.keyword} onPress={()=>{setDreamSearch(d.keyword);setSelectedDream(d);}} style={[s.zodiacChip,{backgroundColor:colors.surfaceSoft,borderColor:colors.border}]}><Text style={{fontSize:14}}>{d.emoji}</Text><Text style={{fontSize:10,fontWeight:'700',color:colors.subText}}>{d.keyword}</Text></TouchableOpacity>)}
            </View>
          </>}
        </GlassCard>
      </>}
    </ScrollView>
  );

  // ─── KITCHEN TAB ───────────────────────────────────────────────────────────
  const renderKitchen=()=>(
    <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" removeClippedSubviews={true}>
      {/* Sub Tabs */}
      <View style={[s.subTabRow,{backgroundColor:colors.surfaceSoft,borderColor:colors.border}]}>
        {(['kalori','butce','takip','gelir'] as const).map(t=><TouchableOpacity key={t} onPress={()=>setKitchenTab(t)} style={[s.subTab,{backgroundColor:kitchenTab===t?colors.primary:'transparent'}]}><Text style={{fontSize:13,fontWeight:'900',color:kitchenTab===t?'#fff':colors.subText}}>{t==='kalori'?'🥗 Kalori':t==='butce'?'💰 Bütçe':t==='takip'?'📒 Gider':'💵 Gelir'}</Text></TouchableOpacity>)}
      </View>

      {kitchenTab==='kalori'&&<>
        {/* Daily Summary */}
        <GlassCard colors={colors}>
          <View style={s.rowBetween}>
            <Text style={[s.sectionTitle,{color:colors.text,marginBottom:0}]}>📊 Bugünkü Toplam</Text>
            <TouchableOpacity onPress={()=>setMeals([])}><Text style={{fontSize:12,fontWeight:'900',color:colors.danger}}>Sıfırla</Text></TouchableOpacity>
          </View>
          <View style={[s.statsRow,{marginTop:12}]}>
            <StatBlock label="Kalori" value={totalCalories} color={totalCalories>2000?colors.danger:totalCalories>1500?colors.warning:colors.success} colors={colors}/>
            <StatBlock label="Öğün" value={meals.length} color={colors.primary} colors={colors}/>
            <StatBlock label="Hedef" value="2000" color={colors.subText} colors={colors}/>
          </View>
          <View style={{marginTop:10}}>
            <AnimBar value={Math.min(100,(totalCalories/2000)*100)} color={totalCalories>2000?colors.danger:colors.primary} bg={colors.surfaceSoft} height={12}/>
          </View>
          <Text style={{fontSize:11,color:colors.subText,marginTop:6,textAlign:'right'}}>{totalCalories}/2000 kcal • {Math.max(0,2000-totalCalories)} kcal kaldı</Text>
        </GlassCard>

        {/* Öğün listesi */}
        {meals.length>0&&<GlassCard colors={colors} delay={60}>
          <Text style={[s.sectionTitle,{color:colors.text}]}>🍽️ Öğünlerim</Text>
          {meals.map(m=>(
            <View key={m.id} style={[s.rowBetween,{paddingVertical:10,borderBottomWidth:1,borderBottomColor:colors.border}]}>
              <View style={{flex:1}}>
                <Text style={{fontSize:14,fontWeight:'800',color:colors.text}}>{m.name}</Text>
                <Text style={{fontSize:11,color:colors.subText,marginTop:2}}>{m.time}</Text>
              </View>
              <Text style={{fontSize:14,fontWeight:'900',color:colors.primary,marginRight:12}}>{m.calories} kcal</Text>
              <TouchableOpacity onPress={()=>removeMeal(m.id)}><Text style={{color:colors.danger,fontSize:16}}>✕</Text></TouchableOpacity>
            </View>
          ))}
        </GlassCard>}

        {/* Yemek ekle */}
        <GlassCard colors={colors} delay={100}>
          <Text style={[s.sectionTitle,{color:colors.text}]}>➕ Öğün Ekle</Text>
          <SearchBar2 value={mealSearch} onChangeText={setMealSearch} placeholder="Yemek ara..." colors={colors}/>
          {/* Kategori filtresi */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:10}}>
            {foodCategories.map(cat=><TouchableOpacity key={cat} onPress={()=>setFoodCat(cat)} style={[s.catChip,{backgroundColor:foodCat===cat?colors.primary:colors.surfaceSoft,borderColor:foodCat===cat?colors.primary:colors.border}]}><Text style={{fontSize:11,fontWeight:'800',color:foodCat===cat?'#fff':colors.subText}}>{cat}</Text></TouchableOpacity>)}
          </ScrollView>
          <View style={{gap:8}}>
            {filteredFoods.slice(0,15).map(food=>(
              <TouchableOpacity key={food.name} onPress={()=>addMeal(food)} style={[s.foodRow,{backgroundColor:colors.surfaceSoft,borderColor:colors.border}]}>
                <Text style={{fontSize:22,marginRight:10}}>{food.emoji}</Text>
                <View style={{flex:1}}>
                  <Text style={{fontSize:13,fontWeight:'800',color:colors.text}}>{food.name}</Text>
                  <Text style={{fontSize:11,color:colors.subText}}>{food.unit}</Text>
                </View>
                <View style={{alignItems:'flex-end'}}>
                  <Text style={{fontSize:13,fontWeight:'900',color:colors.primary}}>{food.calories} kcal</Text>
                  <Text style={{fontSize:10,color:colors.subText}}>~₺{food.price}</Text>
                </View>
                <Text style={{fontSize:18,color:colors.success,marginLeft:8}}>＋</Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>
      </>}

      {kitchenTab==='butce'&&<>
        <GlassCard colors={colors}>
          <Text style={[s.sectionTitle,{color:colors.text}]}>💰 Bütçene Göre Yemek</Text>
          <Text style={{fontSize:13,color:colors.subText,marginBottom:14}}>Güncel piyasa fiyatlarına göre bütçen dahilinde öneriler sunulur.</Text>
          <View style={[s.budgetInputRow,{backgroundColor:colors.surfaceSoft,borderColor:colors.border}]}>
            <Text style={{fontSize:22,marginRight:8}}>₺</Text>
            <TextInput style={[s.budgetInput,{color:colors.text}]} value={budgetInput} onChangeText={setBudgetInput} placeholder="Bütçeni yaz (₺)" placeholderTextColor={colors.subText} keyboardType="numeric" maxLength={6}/>
          </View>
          <PressBtn onPress={()=>{const b=parseInt(budgetInput||'0');if(b<10){Alert.alert('Uyarı','En az 10 ₺ giriniz.');return;}setBudgetResult(getBudgetMenus(b));}} style={[s.mainBtn,{backgroundColor:colors.primary,marginTop:12}]}>
            <Text style={s.mainBtnTxt}>🔍 Ne Yiyebilirim?</Text>
          </PressBtn>
        </GlassCard>

        {budgetResult&&budgetResult.map((menu,i)=>(
          <GlassCard key={i} colors={colors} delay={i*70}>
            <View style={s.rowBetween}>
              <Text style={{fontSize:20}}>{menu.emoji}</Text>
              <Text style={[s.sectionTitle,{color:colors.text,marginBottom:0,flex:1,marginLeft:10}]}>{menu.name}</Text>
              <View style={[s.xpBadge,{backgroundColor:colors.success+'22',borderColor:colors.success}]}><Text style={{fontSize:11,fontWeight:'900',color:colors.success}}>~{menu.totalCal} kcal</Text></View>
            </View>
            <View style={{marginTop:12,gap:8}}>
              {menu.items.map((item,j)=>(
                <View key={j} style={[s.rowBetween,{paddingVertical:8,borderBottomWidth:1,borderBottomColor:colors.border}]}>
                  <Text style={{fontSize:14,color:colors.text,flex:1}}>{item.food}</Text>
                  <Text style={{fontSize:14,fontWeight:'900',color:colors.warning}}>₺{item.price}</Text>
                </View>
              ))}
            </View>
            <View style={[s.rowBetween,{marginTop:12,paddingTop:10,borderTopWidth:1,borderTopColor:colors.border}]}>
              <Text style={{fontSize:14,fontWeight:'900',color:colors.text}}>Toplam</Text>
              <Text style={{fontSize:16,fontWeight:'900',color:colors.primary}}>₺{menu.items.reduce((a,it)=>a+it.price,0)}</Text>
            </View>
          </GlassCard>
        ))}

        {!budgetResult&&<GlassCard colors={colors} delay={60}>
          <Text style={[s.sectionTitle,{color:colors.text}]}>📋 Piyasa Fiyat Rehberi</Text>
          {FOOD_PRICES.map((item,j)=>(
              <Text style={{fontSize:18}}>{item.emoji}</Text>
              <Text style={{flex:1,marginLeft:10,fontSize:14,fontWeight:'700',color:colors.text}}>{item.cat}</Text>
              <Text style={{fontSize:14,fontWeight:'900',color:colors.primary}}>{item.range}</Text>
            </View>
          ))}
        </GlassCard>}
      </>}


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

      {kitchenTab==='takip'&&<>
        <GlassCard colors={colors}>
          <Text style={[s.sectionTitle,{color:colors.text}]}>📒 Harcama Takibi</Text>
          <TextInput style={[s.inlineInput,{backgroundColor:colors.surfaceSoft,borderColor:colors.border,color:colors.text}]} value={expenseTitle} onChangeText={setExpenseTitle} placeholder="Harcama adı" placeholderTextColor={colors.subText}/>
          <View style={{height:10}}/>
          <TextInput style={[s.inlineInput,{backgroundColor:colors.surfaceSoft,borderColor:colors.border,color:colors.text}]} value={expenseAmount} onChangeText={setExpenseAmount} placeholder="Tutar (₺)" placeholderTextColor={colors.subText} keyboardType="numeric"/>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical:10}}>
            {EXPENSE_CATEGORIES.map(cat=><TouchableOpacity key={cat} onPress={()=>setExpenseCategory(cat)} style={[s.catChip,{backgroundColor:expenseCategory===cat?colors.primary:colors.surfaceSoft,borderColor:expenseCategory===cat?colors.primary:colors.border}]}><Text style={{fontSize:11,fontWeight:'800',color:expenseCategory===cat?'#fff':colors.subText}}>{cat}</Text></TouchableOpacity>)}
          </ScrollView>
          <PressBtn onPress={addExpenseEntry} style={[s.mainBtn,{backgroundColor:colors.primary}]}><Text style={s.mainBtnTxt}>➕ Harcama Ekle</Text></PressBtn>
          <View style={[s.statsRow,{marginTop:12}]}> 
            <StatBlock label="Toplam" value={`₺${expenseSummary.total.toFixed(0)}`} color={colors.warning} colors={colors}/>
            <StatBlock label="Bu Ay" value={`₺${monthlyExpenseTotal.toFixed(0)}`} color={colors.primary} colors={colors}/>
            <StatBlock label="Kayıt" value={expenses.length} color={colors.success} colors={colors}/>
          </View>
        </GlassCard>

        <GlassCard colors={colors} delay={32}>
          <Text style={[s.sectionTitle,{color:colors.text}]}>🗓️ Aylık Bütçe Planlayıcı</Text>
          <Text style={{fontSize:12,color:colors.subText,marginBottom:12}}>Bu ay için bir limit belirle. Harcamalarına göre kalan bütçeyi canlı takip et.</Text>
          <TextInput style={[s.inlineInput,{backgroundColor:colors.surfaceSoft,borderColor:colors.border,color:colors.text}]} value={monthlyBudgetLimit} onChangeText={setMonthlyBudgetLimit} placeholder="Aylık bütçe limiti (₺)" placeholderTextColor={colors.subText} keyboardType="numeric"/>
          <View style={[s.statsRow,{marginTop:12}]}>
            <StatBlock label="Limit" value={monthlyBudgetValue>0?`₺${monthlyBudgetValue.toFixed(0)}`:'—'} color={colors.primary} colors={colors}/>
            <StatBlock label="Kalan" value={monthlyBudgetValue>0?`₺${monthlyBudgetRemaining.toFixed(0)}`:'—'} color={monthlyBudgetPercent>=100?colors.danger:colors.success} colors={colors}/>
            <StatBlock label="Doluluk" value={monthlyBudgetValue>0?`%${monthlyBudgetPercent}`:'—'} color={colors.warning} colors={colors}/>
          </View>
          {monthlyBudgetValue>0&&<View style={{marginTop:12}}><AnimBar value={monthlyBudgetPercent} color={monthlyBudgetPercent>=100?colors.danger:colors.success} bg={colors.backgroundTop} height={12}/></View>}
        </GlassCard>

        <GlassCard colors={colors} delay={35}>
          <Text style={[s.sectionTitle,{color:colors.text}]}>🧠 Akıllı Bütçe İçgörüsü</Text>
          <View style={s.statsRow}>
            <StatBlock label="7 Gün Ort." value={`₺${recentDailyExpenseAverage.toFixed(0)}`} color={colors.danger} colors={colors}/>
            <StatBlock label="Bu Hafta" value={`₺${weeklyExpenseTotal.toFixed(0)}`} color={colors.warning} colors={colors}/>
            <StatBlock label="Trend" value={expenseSummary.topCategory?.category || 'Stabil'} color={colors.primary} colors={colors}/>
          </View>
          <View style={{marginTop:12,gap:8}}>
            {budgetInsights.map((line, index)=><Text key={index} style={{fontSize:12,lineHeight:18,color:colors.subText}}>• {line}</Text>)}
          </View>
          {expenseCategoryDistribution.length>0&&<View style={{marginTop:14,gap:10}}>
            {expenseCategoryDistribution.slice(0,4).map(item=><View key={item.category}><View style={[s.rowBetween,{marginBottom:4}]}><Text style={{fontSize:12,fontWeight:'800',color:colors.text}}>{item.category}</Text><Text style={{fontSize:11,color:colors.subText}}>₺{item.amount.toFixed(0)} • %{item.percent}</Text></View><AnimBar value={item.percent} color={colors.primary} bg={colors.backgroundTop} height={8}/></View>)}
          </View>}
        </GlassCard>

        <GlassCard colors={colors} delay={40}>
          <Text style={[s.sectionTitle,{color:colors.text}]}>🎯 Hedefler</Text>
          <TextInput style={[s.inlineInput,{backgroundColor:colors.surfaceSoft,borderColor:colors.border,color:colors.text}]} value={goalTitle} onChangeText={setGoalTitle} placeholder="Hedef adı" placeholderTextColor={colors.subText}/>
          <View style={{height:10}}/>
          <TextInput style={[s.inlineInput,{backgroundColor:colors.surfaceSoft,borderColor:colors.border,color:colors.text}]} value={goalTarget} onChangeText={setGoalTarget} placeholder="Hedef tutar (₺)" placeholderTextColor={colors.subText} keyboardType="numeric"/>
          <PressBtn onPress={addSavingsGoalEntry} style={[s.mainBtn,{backgroundColor:colors.secondary,marginTop:12}]}><Text style={s.mainBtnTxt}>🎯 Hedef Oluştur</Text></PressBtn>
          <View style={{gap:10,marginTop:12}}>
            {activeGoals.length===0?<Text style={{fontSize:13,color:colors.subText}}>Henüz hedef oluşturmadın.</Text>:activeGoals.map(goal=>{const meta=getGoalProgress(goal);return <View key={goal.id} style={[s.foodRow,{backgroundColor:colors.surfaceSoft,borderColor:colors.border,alignItems:'stretch'}]}><View style={{flex:1}}><Text style={{fontSize:14,fontWeight:'800',color:colors.text}}>{goal.title}</Text><Text style={{fontSize:11,color:colors.subText,marginVertical:4}}>₺{goal.current.toFixed(0)} / ₺{goal.target.toFixed(0)} • %{meta.percent}</Text><AnimBar value={meta.percent} color={meta.completed?colors.success:colors.secondary} bg={colors.backgroundTop} height={10}/><Text style={{fontSize:11,color:colors.subText,marginTop:6}}>{meta.completed?'Hedef tamamlandı 🎉':`Kalan: ₺${meta.remaining.toFixed(0)}`}</Text></View><View style={{justifyContent:'center',marginLeft:10,gap:8}}><TouchableOpacity onPress={()=>contributeGoal(goal.id,50)} style={[s.miniChip,{backgroundColor:colors.secondary+'22',borderColor:colors.secondary}]}><Text style={{color:colors.secondary,fontWeight:'900'}}>+₺50</Text></TouchableOpacity><TouchableOpacity onPress={()=>contributeGoal(goal.id,100)} style={[s.miniChip,{backgroundColor:colors.success+'22',borderColor:colors.success}]}><Text style={{color:colors.success,fontWeight:'900'}}>+₺100</Text></TouchableOpacity><TouchableOpacity onPress={()=>contributeGoal(goal.id,250)} style={[s.miniChip,{backgroundColor:colors.primary+'22',borderColor:colors.primary}]}><Text style={{color:colors.primary,fontWeight:'900'}}>+₺250</Text></TouchableOpacity><TouchableOpacity onPress={()=>removeGoal(goal.id)} style={[s.miniChip,{backgroundColor:colors.danger+'12',borderColor:colors.danger}]}><Text style={{color:colors.danger,fontWeight:'900'}}>Sil</Text></TouchableOpacity></View></View>})}
          </View>
        </GlassCard>

        {expenses.length>0&&<GlassCard colors={colors} delay={70}>
          <View style={[s.rowBetween,{marginBottom:10}]}>
            <Text style={[s.sectionTitle,{color:colors.text,marginBottom:0}]}>🧾 Son Harcamalar</Text>
            <TouchableOpacity onPress={exportExpensesReport} style={[s.miniChip,{backgroundColor:colors.primary+'12',borderColor:colors.primary}]}>
              <Text style={{color:colors.primary,fontWeight:'900'}}>Dışa Aktar</Text>
            </TouchableOpacity>
          </View>
          <SearchBar2 value={expenseSearch} onChangeText={setExpenseSearch} placeholder="Harcama ara..." colors={colors}/>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop:12,marginBottom:4}}>
            {(['Tümü','Bu Ay',...EXPENSE_CATEGORIES] as const).map(filter=><TouchableOpacity key={filter} onPress={()=>setExpenseFilter(filter)} style={[s.catChip,{backgroundColor:expenseFilter===filter?colors.primary:colors.surfaceSoft,borderColor:expenseFilter===filter?colors.primary:colors.border}]}><Text style={{fontSize:11,fontWeight:'800',color:expenseFilter===filter?'#fff':colors.subText}}>{filter}</Text></TouchableOpacity>)}
          </ScrollView>
          {visibleExpenses.slice(0,12).map(item=><View key={item.id} style={[s.rowBetween,{paddingVertical:10,borderBottomWidth:1,borderBottomColor:colors.border,alignItems:'flex-start'}]}><View style={{flex:1,paddingRight:10}}><Text style={{fontSize:14,fontWeight:'800',color:colors.text}}>{item.title}</Text><Text style={{fontSize:11,color:colors.subText}}>{item.category} • {new Date(item.createdAt).toLocaleDateString('tr-TR')}</Text></View><View style={{alignItems:'flex-end',gap:8}}><Text style={{fontSize:14,fontWeight:'900',color:colors.warning}}>₺{item.amount.toFixed(0)}</Text><TouchableOpacity onPress={()=>removeExpense(item.id)} style={[s.miniChip,{backgroundColor:colors.danger+'12',borderColor:colors.danger,paddingVertical:5,paddingHorizontal:8}]}><Text style={{fontSize:11,color:colors.danger,fontWeight:'900'}}>Sil</Text></TouchableOpacity></View></View>)}
          {visibleExpenses.length===0&&<Text style={{fontSize:12,color:colors.subText,marginTop:10}}>Bu filtre için kayıt bulunamadı.</Text>}
        </GlassCard>}
      </>}
    </ScrollView>
  );

  // ─── HOME TAB ──────────────────────────────────────────────────────────────
  const renderHome=()=>(
    <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} removeClippedSubviews={true}>
      <GlassCard colors={colors}>
        <Animated.View style={{opacity:headerGlow}}><Text style={[s.powerMark,{color:colors.primary}]}>✦</Text></Animated.View>
        <Text style={[s.heroTitle,{color:colors.text}]}>SKOR</Text>
        <View style={{flexDirection:'row',justifyContent:'center',gap:8,marginTop:4}}>
          <View style={[s.xpBadge,{backgroundColor:colors.primary+'22',borderColor:colors.primary}]}><Text style={{fontSize:11,fontWeight:'900',color:colors.primary}}>⚡ Sev. {profile.level}</Text></View>
          <View style={[s.xpBadge,{backgroundColor:colors.warning+'22',borderColor:colors.warning}]}><Text style={{fontSize:11,fontWeight:'900',color:colors.warning}}>🔥 {profile.streak} gün</Text></View>
          <View style={[s.xpBadge,{backgroundColor:colors.secondary+'22',borderColor:colors.secondary}]}><Text style={{fontSize:11,fontWeight:'900',color:colors.secondary}}>{zodiacEmojis[profile.zodiac]} {profile.zodiac}</Text></View>
        </View>
        <View style={s.statsRow}>
          <StatBlock label="Skor" value={score||'—'} color={colors.warning} colors={colors}/>
          <StatBlock label="XP" value={profile.xp} color={colors.primary} colors={colors}/>
          <StatBlock label="Kalori" value={totalCalories} color={totalCalories>1800?colors.danger:colors.success} colors={colors}/>
        </View>
      </GlassCard>

      <GlassCard colors={colors} delay={60}>
        <Text style={[s.sectionTitle,{color:colors.text}]}>📊 Finansal Panel</Text>
        <MiniBar label="Finansal Dayanıklılık" value={Math.max(5,result.power)} color={colors.success} colors={colors} delayed/>
        <MiniBar label="Tasarruf Disiplini" value={Math.min(100,Math.max(8,100-score))} color={colors.primary} colors={colors} delayed/>
        <MiniBar label="Risk Sıcaklığı" value={Math.min(100,Math.max(8,score))} color={colors.danger} colors={colors} delayed/>
      </GlassCard>

      <GlassCard colors={colors} delay={65}>
        <Text style={[s.sectionTitle,{color:colors.text}]}>💸 Bütçe Özeti</Text>
        <View style={s.statsRow}>
          <StatBlock label="Bu Ay" value={`₺${monthlyExpenseTotal.toFixed(0)}`} color={colors.warning} colors={colors}/>
          <StatBlock label="Kalan" value={monthlyBudgetValue>0?`₺${monthlyBudgetRemaining.toFixed(0)}`:'—'} color={colors.secondary} colors={colors}/>
          <StatBlock label="Kategori" value={expenseSummary.topCategory?.category || '—'} color={colors.primary} colors={colors}/>
        </View>
        {monthlyBudgetValue>0&&<View style={{marginTop:10}}><MiniBar label="Aylık bütçe doluluğu" value={monthlyBudgetPercent} color={monthlyBudgetPercent>=100?colors.danger:colors.success} colors={colors} delayed/></View>}
        <Text style={{fontSize:12,color:colors.subText,marginTop:8}}>{activeGoals[0] ? `${activeGoals[0].title}: ₺${activeGoals[0].current.toFixed(0)} / ₺${activeGoals[0].target.toFixed(0)}` : 'Hedef oluşturmak için Mutfak > Bütçe Takibi sekmesine git.'}</Text>
      </GlassCard>

      {/* Hızlı Aksiyonlar */}
      <GlassCard colors={colors} delay={80}>
        <Text style={[s.sectionTitle,{color:colors.text}]}>⚡ Hızlı Aksiyonlar</Text>
        <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
          <TouchableOpacity onPress={()=>{if(premium==='free'){setPremiumModalVisible(true);}else{setAiAdvisorVisible(true);setSeasonChallenges((sc:any)=>sc.map((c:SeasonChallenge)=>c.id==='s5'?{...c,current:Math.min(c.current+1,c.target),done:c.current+1>=c.target}:c));}}} style={{flex:1,borderWidth:1,borderRadius:14,paddingVertical:14,alignItems:'center',backgroundColor:colors.primary+'22',borderColor:colors.primary}}>
            <Text style={{fontSize:20}}>🤖</Text><Text style={{fontSize:10,fontWeight:'900',color:colors.primary,marginTop:2}}>AI Danışman</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>setTournamentVisible(true)} style={{flex:1,borderWidth:1,borderRadius:14,paddingVertical:14,alignItems:'center',backgroundColor:colors.gold+'22',borderColor:colors.gold}}>
            <Text style={{fontSize:20}}>🏆</Text><Text style={{fontSize:10,fontWeight:'900',color:colors.gold,marginTop:2}}>Turnuva</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>setRewardedAdVisible(true)} style={{flex:1,borderWidth:1,borderRadius:14,paddingVertical:14,alignItems:'center',backgroundColor:colors.success+'22',borderColor:colors.success}}>
            <Text style={{fontSize:20}}>📺</Text><Text style={{fontSize:10,fontWeight:'900',color:colors.success,marginTop:2}}>+100 XP</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>setNotificationModalVisible(true)} style={{flex:1,borderWidth:1,borderRadius:14,paddingVertical:14,alignItems:'center',backgroundColor:colors.secondary+'22',borderColor:colors.secondary}}>
            <Text style={{fontSize:20}}>🔔</Text><Text style={{fontSize:10,fontWeight:'900',color:colors.secondary,marginTop:2}}>{unreadNotifs>0?`(${unreadNotifs}) `:''}Bildirim</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>

      {/* Sezon Görevleri */}
      <GlassCard colors={colors} delay={90}>
        <Text style={[s.sectionTitle,{color:colors.text}]}>🎭 Sezon Görevleri</Text>
        {/* Yuvarlak grafik + liste */}
        <View style={{flexDirection:'row',flexWrap:'wrap',gap:10,justifyContent:'center',marginBottom:8}}>
          {seasonChallenges.slice(0,4).map((ch:SeasonChallenge)=>{
            const pct=Math.min(100,Math.round((ch.current/ch.target)*100));
            const r=28;
            const circ=2*Math.PI*r;
            const offset=circ*(1-pct/100);
            return (
              <View key={ch.id} style={{alignItems:'center',width:'22%'}}>
                <View style={{width:64,height:64,alignItems:'center',justifyContent:'center'}}>
                  <Svg width="64" height="64" viewBox="0 0 64 64">
                    <Circle cx="32" cy="32" r={r} fill="none" stroke={colors.surfaceSoft} strokeWidth="5"/>
                    <Circle cx="32" cy="32" r={r} fill="none"
                      stroke={ch.done?colors.success:colors.primary}
                      strokeWidth="5"
                      strokeDasharray={circ}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                      transform="rotate(-90 32 32)"
                    />
                  </Svg>
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
        ))}
      </GlassCard>

      {/* Astro Preview */}
      <GlassCard colors={colors} delay={100}>
        <View style={s.rowBetween}>
          <Text style={[s.sectionTitle,{color:colors.text,marginBottom:0}]}>🔮 Günlük Burç</Text>
          <Text style={{fontSize:22}}>{zodiacEmojis[profile.zodiac]}</Text>
        </View>
        <Text style={{fontSize:13,color:colors.subText,marginTop:8,lineHeight:20}}>{horoscope.daily}</Text>
        <TouchableOpacity onPress={()=>setActiveTab('astro')} style={{marginTop:10}}><Text style={{fontSize:12,fontWeight:'900',color:colors.primary}}>Tam yoruma git →</Text></TouchableOpacity>
      </GlassCard>

      {settings.showQuote&&<GlassCard colors={colors} delay={130}><Text style={[s.sectionTitle,{color:colors.text}]}>🌟 Günün Sözü</Text><Text style={{fontSize:14,lineHeight:22,color:colors.subText,fontStyle:'italic'}}>"{quote}"</Text></GlassCard>}

      {settings.showChallenges&&(
        <GlassCard colors={colors} delay={160}>
          <View style={s.rowBetween}>
            <Text style={[s.sectionTitle,{color:colors.text,marginBottom:0}]}>🔥 Günlük Görev</Text>
            <Text style={{fontSize:12,fontWeight:'900',color:challengeDone?colors.success:colors.warning}}>{challengeDone?'✅':'⚡ Aktif'}</Text>
          </View>
          <Text style={{fontSize:13,color:colors.subText,marginTop:8,marginBottom:12}}>{challenge}</Text>
          <PressBtn onPress={()=>{setChallengeDone(p=>!p);if(!challengeDone)addXP(25);}} style={[s.mainBtn,{backgroundColor:challengeDone?colors.success:colors.primary}]}>
            <Text style={s.mainBtnTxt}>{challengeDone?'Tamamlandı ✓':'Görevi Tamamladım (+25 XP)'}</Text>
          </PressBtn>
        </GlassCard>
      )}
    </ScrollView>
  );

  // ─── QUIZ TAB ──────────────────────────────────────────────────────────────
  const renderQuiz=()=>{
    if(!activeQuiz) return (
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} removeClippedSubviews={true}>
        <GlassCard colors={colors}><Text style={[s.sectionTitle,{color:colors.text}]}>🎯 Quiz Seç</Text><Text style={{fontSize:13,color:colors.subText}}>4 farklı finans testi. Her quiz tamamlandığında XP kazanırsın!</Text></GlassCard>
        {(Object.keys(QUIZZES) as QuizMode[]).map((mode,i)=>{
          const q=QUIZZES[mode];const done=history.filter(h=>h.quizMode===mode).length;
          return <GlassCard key={mode} colors={colors} delay={i*60}><View style={s.rowBetween}><Text style={{fontSize:30}}>{q.icon}</Text><View style={[s.xpBadge,{backgroundColor:colors.primary+'22',borderColor:colors.primary}]}><Text style={{fontSize:11,fontWeight:'900',color:colors.primary}}>+{XP_TABLE[mode]} XP</Text></View></View><Text style={[s.sectionTitle,{color:colors.text,marginTop:8}]}>{q.title}</Text><Text style={{fontSize:13,color:colors.subText,marginBottom:6}}>{q.desc}</Text><Text style={{fontSize:11,color:colors.subText}}>✓ {done} kez • {q.questions.length} soru</Text><PressBtn onPress={()=>setActiveQuiz(mode)} style={[s.mainBtn,{backgroundColor:q.color,marginTop:12}]}><Text style={s.mainBtnTxt}>{q.icon} Başla</Text></PressBtn></GlassCard>;
        })}
      </ScrollView>
    );
    return (
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} removeClippedSubviews={true}>
        <GlassCard colors={colors}>
          <View style={s.rowBetween}>
            <TouchableOpacity onPress={resetQuiz}><Text style={{color:colors.subText,fontSize:13,fontWeight:'800'}}>← Geri</Text></TouchableOpacity>
            <Text style={[s.sectionTitle,{color:colors.text,marginBottom:0,flex:1,textAlign:'center'}]}>{currentQuiz?.title}</Text>
            <Text style={{fontSize:14,fontWeight:'900',color:colors.primary}}>%{progress}</Text>
          </View>
          <View style={{marginTop:10}}><AnimBar value={progress} color={colors.primary} bg={colors.surfaceSoft}/></View>
          {!quizStarted?(
            <View style={[s.bigPanel,{backgroundColor:colors.surfaceSoft,borderColor:colors.border}]}>
              <Text style={{fontSize:44,textAlign:'center'}}>{currentQuiz?.icon}</Text>
              <Text style={[s.bigTitle,{color:colors.text}]}>{currentQuiz?.title}</Text>
              <Text style={{fontSize:13,color:colors.subText,marginBottom:12}}>{currentQuiz?.desc}</Text>
              <View style={[s.xpBadge,{alignSelf:'center',backgroundColor:colors.primary+'22',borderColor:colors.primary,marginBottom:14}]}><Text style={{fontSize:13,fontWeight:'900',color:colors.primary}}>+{activeQuiz?XP_TABLE[activeQuiz]:0} XP kazanacaksın!</Text></View>
              <PressBtn onPress={()=>setQuizStarted(true)} style={[s.mainBtn,{backgroundColor:colors.primary}]}><Text style={s.mainBtnTxt}>✦ Başlat</Text></PressBtn>
            </View>
          ):!quizFinished?(
            <Animated.View style={[s.bigPanel,{backgroundColor:colors.surfaceSoft,borderColor:colors.border,opacity:questionFade,transform:[{translateY:questionSlide}]}]}>
              <View style={[s.stepBadge,{backgroundColor:colors.primary+'22'}]}><Text style={{fontSize:12,fontWeight:'900',color:colors.primary}}>Soru {questionIndex+1} / {currentQs.length}</Text></View>
              <Text style={[s.questionTxt,{color:colors.text}]}>{currentQs[questionIndex]?.text}</Text>
              <PressBtn onPress={()=>answerQuestion('yes')} style={[s.mainBtn,{backgroundColor:colors.success}]}><Text style={s.mainBtnTxt}>✅  Evet</Text></PressBtn>
              <PressBtn onPress={()=>answerQuestion('no')} style={[s.mainBtn,{backgroundColor:colors.danger}]}><Text style={s.mainBtnTxt}>❌  Hayır</Text></PressBtn>
            </Animated.View>
          ):(
            <Animated.View style={[s.bigPanel,{backgroundColor:colors.surfaceSoft,borderColor:colors.border,opacity:resultOpacity,transform:[{scale:resultScale}]}]}>
              <Text style={{fontSize:58,textAlign:'center'}}>{result.emoji}</Text>
              <View style={[s.levelBadge,{borderColor:result.color,backgroundColor:result.color+'18',alignSelf:'center',marginTop:10}]}><Text style={[s.levelBadgeTxt,{color:result.color}]}>{result.level}</Text></View>
              <Text style={[s.resultTitle,{color:result.color}]}>{result.title}</Text>
              <View style={[s.scorePill,{backgroundColor:colors.surface,borderColor:colors.border}]}><Text style={{fontSize:15,fontWeight:'900',color:colors.text}}>🎯 {score}/{maxScore}</Text></View>
              <View style={{width:'100%',marginTop:8}}><AnimBar value={(score/maxScore)*100} color={result.color} bg={colors.surface}/></View>
              <View style={[s.xpBadge,{alignSelf:'center',backgroundColor:colors.primary+'22',borderColor:colors.primary,marginTop:12}]}><Text style={{fontSize:14,fontWeight:'900',color:colors.primary}}>+{activeQuiz?XP_TABLE[activeQuiz]:0} XP ⚡</Text></View>
              <Text style={{fontSize:13,color:colors.subText,textAlign:'center',marginTop:10,lineHeight:20}}>{result.advice}</Text>
              <PressBtn onPress={handleShare} style={[s.mainBtn,{backgroundColor:colors.secondary,marginTop:14}]}><Text style={s.mainBtnTxt}>📸 Sonuç Kartı Paylaş</Text></PressBtn>
              <PressBtn onPress={resetQuiz} style={[s.mainBtn,{backgroundColor:colors.primary}]}><Text style={s.mainBtnTxt}>🔄 Başka Quiz</Text></PressBtn>
            </Animated.View>
          )}
        </GlassCard>
      </ScrollView>
    );
  };

  // ─── TOPLULUK TAB ─────────────────────────────────────────────────────────
  const renderTopluluk=()=>{
    const filteredHelp = helpCat==='Tümü' ? helpRequests : helpRequests.filter(h=>h.category===helpCat);
    const getAiHelp=async(req:HelpRequest)=>{
      setSelectedHelp(req);setAiHelpLoading(true);setAiHelpAnswer('');
      try{
        const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:300,system:'Sen Türkçe konuşan bir kişisel finans danışmanısın. Kısa, pratik, motive edici cevaplar ver. Emojiler kullan.',messages:[{role:'user',content:`Bu kişiye yardım et: "${req.title}" - Detay: ${req.desc} - Kategori: ${req.category} - 3-4 cümle pratik tavsiye ver.`}]})});
        const d=await res.json();
        setAiHelpAnswer(d.content?.[0]?.text||'Cevap alınamadı.');
      }catch{setAiHelpAnswer('Bağlantı hatası. Tekrar dene. 🔄');}
      setAiHelpLoading(false);
      Analytics.log('community_ai_help',{category:req.category});
    };
    const submitPost=()=>{
      if(!newPostText.trim()) return;
      const post:CommunityPost={id:`p${Date.now()}`,avatar:profile.avatar,name:profile.name,content:newPostText.trim(),likes:0,time:'Şimdi',tag:'İpucu',likedByMe:false};
      setCommunityPosts(p=>[post,...p]);setNewPostText('');addXP(15);
      Analytics.log('community_post',{});
    };
    const submitHelp=()=>{
      if(!newHelpTitle.trim()||!newHelpDesc.trim()) return;
      const req:HelpRequest={id:`h${Date.now()}`,avatar:profile.avatar,name:profile.name,title:newHelpTitle.trim(),desc:newHelpDesc.trim(),category:newHelpCat,time:'Şimdi',likes:0,replies:0,solved:false,level:profile.level};
      setHelpRequests(p=>[req,...p]);setNewHelpTitle('');setNewHelpDesc('');setHelpModalVisible(false);
      addNotif('Yardım Talebiniz Paylaşıldı! 🆘','Topluluk yakında yardımcı olacak.','🆘');
      Analytics.log('help_request_posted',{category:newHelpCat});
    };
    const toggleLike=(id:string)=>setCommunityPosts(p=>p.map(post=>post.id===id?{...post,likes:post.likedByMe?post.likes-1:post.likes+1,likedByMe:!post.likedByMe}:post));
    return (
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" removeClippedSubviews={true}>
        {/* Header */}
        <GlassCard colors={colors}>
          <View style={s.rowBetween}>
            <View>
              <Text style={[s.sectionTitle,{color:colors.text,marginBottom:2}]}>👥 Topluluk</Text>
              <Text style={{fontSize:12,color:colors.subText}}>{helpRequests.length} yardım talebi • {communityPosts.length} paylaşım</Text>
            </View>
            <TouchableOpacity onPress={()=>setHelpModalVisible(true)} style={[s.mainBtn,{backgroundColor:colors.danger,paddingVertical:10,paddingHorizontal:14,marginBottom:0}]}>
              <Text style={s.mainBtnTxt}>🆘 Yardım İste</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Sub Tabs */}
        <View style={[s.subTabRow,{backgroundColor:colors.surfaceSoft,borderColor:colors.border}]}>
          {(['feed','yardim','benim'] as const).map(t=>(
            <TouchableOpacity key={t} onPress={()=>setCommunityTab(t)} style={[s.subTab,{backgroundColor:communityTab===t?colors.primary:'transparent'}]}>
              <Text style={{fontSize:11,fontWeight:'900',color:communityTab===t?'#fff':colors.subText}}>{t==='feed'?'📢 Feed':t==='yardim'?'🆘 Yardım':'👤 Benim'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FEED TAB */}
        {communityTab==='feed'&&<>
          <GlassCard colors={colors}>
            <Text style={{fontSize:13,fontWeight:'800',color:colors.text,marginBottom:10}}>✍️ Paylaşım Yap</Text>
            <TextInput style={[s.inlineInput,{backgroundColor:colors.surfaceSoft,borderColor:colors.border,color:colors.text,height:80,textAlignVertical:'top',marginBottom:10}]} value={newPostText} onChangeText={setNewPostText} placeholder="Finans ipucunu toplulukla paylaş... (+15 XP)" placeholderTextColor={colors.subText} multiline/>
            <PressBtn onPress={submitPost} style={[s.mainBtn,{backgroundColor:colors.primary}]}>
              <Text style={s.mainBtnTxt}>📢 Paylaş (+15 XP)</Text>
            </PressBtn>
          </GlassCard>
          {communityPosts.map((post,i)=>(
            <GlassCard key={post.id} colors={colors} delay={i*40}>
              <View style={{flexDirection:'row',gap:10,alignItems:'center',marginBottom:10}}>
                <Text style={{fontSize:28}}>{post.avatar}</Text>
                <View style={{flex:1}}>
                  <Text style={{fontSize:13,fontWeight:'900',color:colors.text}}>{post.name}</Text>
                  <View style={{flexDirection:'row',gap:6,marginTop:2}}>
                    <View style={[s.xpBadge,{backgroundColor:colors.primary+'22',borderColor:colors.primary}]}><Text style={{fontSize:9,fontWeight:'900',color:colors.primary}}>{post.tag}</Text></View>
                    <Text style={{fontSize:10,color:colors.subText}}>{post.time}</Text>
                  </View>
                </View>
              </View>
              <Text style={{fontSize:14,lineHeight:21,color:colors.text,marginBottom:12}}>{post.content}</Text>
              <View style={s.rowBetween}>
                <TouchableOpacity onPress={()=>toggleLike(post.id)} style={{flexDirection:'row',alignItems:'center',gap:6}}>
                  <Text style={{fontSize:18}}>{post.likedByMe?'❤️':'🤍'}</Text>
                  <Text style={{fontSize:12,fontWeight:'900',color:post.likedByMe?colors.danger:colors.subText}}>{post.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{flexDirection:'row',alignItems:'center',gap:6}}>
                  <Text style={{fontSize:16}}>💬</Text>
                  <Text style={{fontSize:12,color:colors.subText}}>Yorum yap</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={()=>Share.share({message:post.content+`\n\n— ${profile.name} via Fakirmetre 💸\n#FakirmetreTitan`})}>
                  <Text style={{fontSize:16}}>🔗</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          ))}
        </>}

        {/* YARDIM TAB */}
        {communityTab==='yardim'&&<>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:4}}>
            {HELP_CATEGORIES.map(cat=>(
              <TouchableOpacity key={cat} onPress={()=>setHelpCat(cat)} style={[s.catChip,{backgroundColor:helpCat===cat?colors.primary:colors.surfaceSoft,borderColor:helpCat===cat?colors.primary:colors.border}]}>
                <Text style={{fontSize:11,fontWeight:'900',color:helpCat===cat?'#fff':colors.subText}}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {filteredHelp.map((req,i)=>(
            <GlassCard key={req.id} colors={colors} delay={i*50}>
              <View style={{flexDirection:'row',gap:10,alignItems:'flex-start'}}>
                <Text style={{fontSize:28}}>{req.avatar}</Text>
                <View style={{flex:1}}>
                  <View style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:4}}>
                    <Text style={{fontSize:13,fontWeight:'900',color:colors.text,flex:1}}>{req.name}</Text>
                    {req.solved&&<View style={[s.xpBadge,{backgroundColor:colors.success+'22',borderColor:colors.success}]}><Text style={{fontSize:9,fontWeight:'900',color:colors.success}}>✅ Çözüldü</Text></View>}
                    <View style={[s.xpBadge,{backgroundColor:colors.warning+'22',borderColor:colors.warning}]}><Text style={{fontSize:9,fontWeight:'900',color:colors.warning}}>{req.category}</Text></View>
                  </View>
                  <Text style={{fontSize:14,fontWeight:'900',color:colors.text,marginBottom:6}}>{req.title}</Text>
                  <Text style={{fontSize:12,color:colors.subText,lineHeight:18,marginBottom:10}}>{req.desc}</Text>
                  <View style={s.rowBetween}>
                    <View style={{flexDirection:'row',gap:12}}>
                      <Text style={{fontSize:11,color:colors.subText}}>❤️ {req.likes}</Text>
                      <Text style={{fontSize:11,color:colors.subText}}>💬 {req.replies}</Text>
                      <Text style={{fontSize:11,color:colors.subText}}>{req.time}</Text>
                    </View>
                    <TouchableOpacity onPress={()=>getAiHelp(req)} style={[s.xpBadge,{backgroundColor:colors.primary+'22',borderColor:colors.primary}]}>
                      <Text style={{fontSize:10,fontWeight:'900',color:colors.primary}}>🤖 AI Yardım</Text>
                    </TouchableOpacity>
                  </View>
                  {selectedHelp?.id===req.id&&(
                    <View style={[s.infoBox,{backgroundColor:colors.primary+'11',borderColor:colors.primary+'44',marginTop:10}]}>
                      {aiHelpLoading?<Text style={{color:colors.subText,fontSize:13}}>🤖 AI yanıt hazırlıyor...</Text>:<Text style={{fontSize:13,lineHeight:20,color:colors.text}}>{aiHelpAnswer}</Text>}
                    </View>
                  )}
                </View>
              </View>
            </GlassCard>
          ))}
        </>}

        {/* BENİM TAB */}
        {communityTab==='benim'&&<>
          <GlassCard colors={colors}>
            <Text style={[s.sectionTitle,{color:colors.text}]}>👤 Senin Paylaşımların</Text>
            <View style={s.statsRow}>
              <StatBlock label="Paylaşım" value={communityPosts.filter(p=>p.name===profile.name).length} color={colors.primary} colors={colors}/>
              <StatBlock label="Beğeni" value={communityPosts.filter(p=>p.name===profile.name).reduce((a,p)=>a+p.likes,0)} color={colors.danger} colors={colors}/>
              <StatBlock label="Yardım" value={helpRequests.filter(h=>h.name===profile.name).length} color={colors.warning} colors={colors}/>
            </View>
          </GlassCard>
          {communityPosts.filter(p=>p.name===profile.name).length===0&&helpRequests.filter(h=>h.name===profile.name).length===0&&(
            <GlassCard colors={colors} delay={50}>
              <Text style={{fontSize:44,textAlign:'center'}}>🌱</Text>
              <Text style={{fontSize:15,fontWeight:'900',color:colors.text,textAlign:'center',marginTop:8}}>Henüz paylaşım yok</Text>
              <Text style={{fontSize:12,color:colors.subText,textAlign:'center',marginTop:4}}>Feed&apos;den paylaşım yap veya yardım iste!</Text>
            </GlassCard>
          )}
          {communityPosts.filter(p=>p.name===profile.name).map((post,i)=>(
            <GlassCard key={post.id} colors={colors} delay={i*40}>
              <Text style={{fontSize:13,color:colors.text,lineHeight:20}}>{post.content}</Text>
              <Text style={{fontSize:11,color:colors.subText,marginTop:8}}>❤️ {post.likes} • {post.time}</Text>
            </GlassCard>
          ))}
        </>}

        {/* YARDIM MODAL */}
        <Modal visible={helpModalVisible} animationType="slide" transparent={false} onRequestClose={()=>setHelpModalVisible(false)}>
          <SafeAreaView style={{flex:1,backgroundColor:colors.background,paddingTop:EXTRA_TOP}}>
            <View style={{flexDirection:'row',alignItems:'center',padding:16,borderBottomWidth:1,borderBottomColor:colors.border}}>
              <TouchableOpacity onPress={()=>setHelpModalVisible(false)}><Text style={{color:colors.primary,fontSize:16,fontWeight:'800'}}>← Geri</Text></TouchableOpacity>
              <Text style={{flex:1,textAlign:'center',fontSize:17,fontWeight:'900',color:colors.text}}>🆘 Yardım İste</Text>
            </View>
            <ScrollView contentContainerStyle={{padding:16,gap:12}} keyboardShouldPersistTaps="handled">
              <View style={[s.card,{backgroundColor:colors.surface,borderColor:colors.border}]}>
                <Text style={{fontSize:13,fontWeight:'800',color:colors.text,marginBottom:8}}>Kategori Seç</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {HELP_CATEGORIES.filter(c=>c!=='Tümü').map(cat=>(
                    <TouchableOpacity key={cat} onPress={()=>setNewHelpCat(cat)} style={[s.catChip,{backgroundColor:newHelpCat===cat?colors.danger:colors.surfaceSoft,borderColor:newHelpCat===cat?colors.danger:colors.border}]}>
                      <Text style={{fontSize:11,fontWeight:'900',color:newHelpCat===cat?'#fff':colors.subText}}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={[s.card,{backgroundColor:colors.surface,borderColor:colors.border}]}>
                <Text style={{fontSize:13,fontWeight:'800',color:colors.text,marginBottom:8}}>Sorunun başlığı</Text>
                <TextInput style={[s.inlineInput,{backgroundColor:colors.surfaceSoft,borderColor:colors.border,color:colors.text}]} value={newHelpTitle} onChangeText={setNewHelpTitle} placeholder="Kısa ve öz yaz..." placeholderTextColor={colors.subText} maxLength={80}/>
              </View>
              <View style={[s.card,{backgroundColor:colors.surface,borderColor:colors.border}]}>
                <Text style={{fontSize:13,fontWeight:'800',color:colors.text,marginBottom:8}}>Detay anlat</Text>
                <TextInput style={[s.inlineInput,{backgroundColor:colors.surfaceSoft,borderColor:colors.border,color:colors.text,height:120,textAlignVertical:'top'}]} value={newHelpDesc} onChangeText={setNewHelpDesc} placeholder="Durumunu açıkla, ne kadar detay verirsen o kadar iyi yardım alırsın..." placeholderTextColor={colors.subText} multiline maxLength={400}/>
              </View>
              <PressBtn onPress={submitHelp} style={[s.mainBtn,{backgroundColor:colors.danger}]}>
                <Text style={s.mainBtnTxt}>🆘 Yardım Talebi Gönder</Text>
              </PressBtn>
              <Text style={{fontSize:11,color:colors.subText,textAlign:'center'}}>Topluluğa ve AI&apos;ya gönderilecek</Text>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </ScrollView>
    );
  };

  // ─── SETTINGS TAB ──────────────────────────────────────────────────────────
  const renderSettings=()=>(
    <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} removeClippedSubviews={true}>
      {premium==='free'&&<TouchableOpacity onPress={()=>setPremiumModalVisible(true)} style={[s.card,{backgroundColor:colors.gold+'18',borderColor:colors.gold,borderWidth:2,padding:16,flexDirection:'row',alignItems:'center',gap:12}]}>
        <Text style={{fontSize:28}}>💎</Text>
        <View style={{flex:1}}><Text style={{fontSize:16,fontWeight:'900',color:colors.gold}}>Premium&apos;a Geç</Text><Text style={{fontSize:12,color:colors.subText}}>AI Danışman, Turnuva, Cloud Sync ve daha fazlası</Text></View>
        <Text style={{fontSize:16,color:colors.gold}}>→</Text>
      </TouchableOpacity>}
      {premium!=='free'&&<View style={[s.card,{backgroundColor:colors.gold+'18',borderColor:colors.gold,borderWidth:1.5,flexDirection:'row',alignItems:'center',gap:8,padding:14}]}><Text style={{fontSize:24}}>💎</Text><View><Text style={{fontSize:15,fontWeight:'900',color:colors.gold}}>{premium.toUpperCase()} Üye</Text><Text style={{fontSize:12,color:colors.subText}}>Tüm özellikler aktif</Text></View></View>}
      <AccordionCard title="🎨 Görünüm" defaultOpen={true} colors={colors}>
        {([{key:'darkMode',title:'Koyu Tema',desc:'Arayüz rengini değiştirir'},{key:'starsEnabled',title:'Yıldız Animasyonu',desc:'Arka plan efektini açar/kapatır'}] as {key:keyof SettingsState;title:string;desc:string}[]).map((item,i,arr)=>(
          <View key={item.key} style={[s.settingRow,{borderBottomColor:i<arr.length-1?colors.border:'transparent'}]}>
            <View style={{flex:1,paddingRight:12}}><Text style={{fontSize:14,fontWeight:'800',color:colors.text}}>{item.title}</Text><Text style={{marginTop:3,fontSize:12,color:colors.subText}}>{item.desc}</Text></View>
            <Switch value={settings[item.key] as boolean} onValueChange={v=>updateSetting(item.key,v)} trackColor={{false:'#334155',true:colors.primary+'88'}} thumbColor={settings[item.key]?colors.primary:'#94a3b8'}/>
          </View>
        ))}
        <View style={{marginTop:14}}>
          <Text style={{fontSize:13,fontWeight:'800',color:colors.text,marginBottom:10}}>🎨 Renk Teması</Text>
          <View style={{flexDirection:'row',gap:10}}>
            {(Object.keys(ACCENTS) as AccentKey[]).map(ac=>{const ac2=ACCENTS[ac][settings.darkMode?'dark':'light'];const active=settings.accent===ac;return <TouchableOpacity key={ac} onPress={()=>updateSetting('accent',ac)} style={[s.accentBtn,{backgroundColor:ac2,borderWidth:active?3:0,borderColor:'#fff'}]}><Text style={{fontSize:9,color:'#fff',fontWeight:'900'}}>{active?'✓':''}</Text></TouchableOpacity>;})}
          </View>
          <View style={{flexDirection:'row',gap:8,marginTop:6,flexWrap:'wrap'}}>
            {(Object.keys(ACCENTS) as AccentKey[]).map(ac=><Text key={ac} style={{fontSize:10,color:settings.accent===ac?colors.primary:colors.subText,fontWeight:settings.accent===ac?'900':'500'}}>{ACCENTS[ac].name}</Text>)}
          </View>
        </View>
      </AccordionCard>
      <AccordionCard title="📋 İçerik" defaultOpen={false} colors={colors} delay={50}>
        {([{key:'showQuote',title:'Günün Sözü',desc:'Motivasyon kartını göster'},{key:'showChallenges',title:'Günlük Görev',desc:'Meydan okuma kartını göster'},{key:'showInsights',title:'Burç Önizleme',desc:'Ana ekranda burç yorumu göster'}] as {key:keyof SettingsState;title:string;desc:string}[]).map((item,i,arr)=>(
          <View key={item.key} style={[s.settingRow,{borderBottomColor:i<arr.length-1?colors.border:'transparent'}]}>
            <View style={{flex:1,paddingRight:12}}><Text style={{fontSize:14,fontWeight:'800',color:colors.text}}>{item.title}</Text><Text style={{marginTop:3,fontSize:12,color:colors.subText}}>{item.desc}</Text></View>
            <Switch value={settings[item.key] as boolean} onValueChange={v=>updateSetting(item.key,v)} trackColor={{false:'#334155',true:colors.primary+'88'}} thumbColor={settings[item.key]?colors.primary:'#94a3b8'}/>
          </View>
        ))}
      </AccordionCard>
      <AccordionCard title="👤 Profil Düzenle" defaultOpen={false} colors={colors} delay={90}>
        <View style={{flexDirection:'row',gap:10,marginBottom:10}}>
          <Text style={{fontSize:36}}>{profile.avatar}</Text>
          <View style={{flex:1}}>
            <TextInput style={[s.inlineInput,{backgroundColor:colors.surfaceSoft,borderColor:colors.border,color:colors.text}]} value={profile.name} onChangeText={v=>setProfile(p=>({...p,name:v}))} placeholder="İsim..." placeholderTextColor={colors.subText} maxLength={20}/>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {AVATARS.map(av=><TouchableOpacity key={av} onPress={()=>setProfile(p=>({...p,avatar:av}))} style={[s.avatarMini,{borderColor:profile.avatar===av?colors.primary:colors.border,backgroundColor:profile.avatar===av?colors.primary+'22':colors.surfaceSoft}]}><Text style={{fontSize:20}}>{av}</Text></TouchableOpacity>)}
        </ScrollView>
        <Text style={{fontSize:12,fontWeight:'800',color:colors.text,marginTop:14,marginBottom:8}}>Burcum:</Text>
        <View style={s.zodiacGrid}>
          {zodiacSigns.map(z=><TouchableOpacity key={z} onPress={()=>setProfile(p=>({...p,zodiac:z}))} style={[s.zodiacChip,{backgroundColor:profile.zodiac===z?colors.primary:colors.surfaceSoft,borderColor:profile.zodiac===z?colors.primary:colors.border}]}><Text style={{fontSize:10}}>{zodiacEmojis[z]}</Text><Text style={{fontSize:10,fontWeight:'800',color:profile.zodiac===z?'#fff':colors.text}}>{z}</Text></TouchableOpacity>)}
        </View>
      </AccordionCard>
      <GlassCard colors={colors} delay={95}>
        <Text style={[s.sectionTitle,{color:colors.text}]}>🔐 Hesap</Text>
        {firebaseUser?(<View><View style={{flexDirection:"row",alignItems:"center",gap:12,marginBottom:14}}><Text style={{fontSize:36}}>👤</Text><View style={{flex:1}}><Text style={{fontSize:14,fontWeight:"900",color:colors.text}}>{firebaseUser.displayName||"Kullanici"}</Text><Text style={{fontSize:12,color:colors.subText}}>{firebaseUser.email}</Text><Text style={{fontSize:11,color:colors.success,marginTop:2}}>Bagli</Text></View></View><TouchableOpacity onPress={signOut} style={[s.mainBtn,{backgroundColor:colors.danger,marginBottom:0}]}><Text style={s.mainBtnTxt}>Cikis Yap</Text></TouchableOpacity></View>):(<View><Text style={{fontSize:13,color:colors.subText,marginBottom:14}}>Google hesabinla giris yap, verilerini bulutta yedekle.</Text><TouchableOpacity onPress={signInWithGoogle} disabled={authLoading} style={[s.mainBtn,{backgroundColor:"#4285F4",marginBottom:0}]}><Text style={s.mainBtnTxt}>{authLoading?"Giris yapiliyor...":"Google ile Giris Yap"}</Text></TouchableOpacity></View>)}
      </GlassCard>
      <AccordionCard title="🔐 Hesap">
              {GOOGLE_CARD}
            </AccordionCard>
            <AccordionCard title="🔒 Güvenlik" defaultOpen={false} colors={colors} delay={100}>
        <View style={[s.settingRow,{borderBottomColor:colors.border}]}>
          <View style={{flex:1,paddingRight:12}}>
            <Text style={{fontSize:14,fontWeight:'800',color:colors.text}}>PIN Kilidi</Text>
            <Text style={{fontSize:12,color:colors.subText}}>Uygulama açılışında PIN iste</Text>
          </View>
          <Switch value={settings.pinEnabled} onValueChange={v=>{
            if(v){
              if(settings.pinCode===''){setPinSetupVisible(true);}
              else{updateSetting('pinEnabled',true);Alert.alert('🔒','PIN kilidi aktif!');}
            } else {
              Alert.alert('PIN Kilidini Kapat','Emin misin?',[{text:'İptal'},{text:'Kapat',style:'destructive',onPress:()=>{updateSetting('pinEnabled',false);}}]);
            }
          }} trackColor={{false:'#334155',true:colors.primary+'88'}} thumbColor={settings.pinEnabled?colors.primary:'#94a3b8'}/>
        </View>
        {settings.pinEnabled&&(
          <TouchableOpacity onPress={()=>setPinSetupVisible(true)} style={[s.settingRow,{borderBottomColor:colors.border}]}>
            <View style={{flex:1}}><Text style={{fontSize:14,fontWeight:'800',color:colors.text}}>PIN Değiştir</Text><Text style={{fontSize:12,color:colors.subText}}>Yeni 4 haneli PIN belirle</Text></View>
            <Text style={{color:colors.primary,fontSize:16}}>→</Text>
          </TouchableOpacity>
        )}
        <View style={[s.settingRow,{borderBottomColor:'transparent'}]}>
          <View style={{flex:1,paddingRight:12}}>
            <Text style={{fontSize:14,fontWeight:'800',color:colors.text}}>Paylaşım İmzası</Text>
            <Text style={{fontSize:12,color:colors.subText}}>Paylaşımlarda Fakirmetre damgası</Text>
          </View>
          <Switch value={settings.shareSignature} onValueChange={v=>updateSetting('shareSignature',v)} trackColor={{false:'#334155',true:colors.primary+'88'}} thumbColor={settings.shareSignature?colors.primary:'#94a3b8'}/>
        </View>
        <TouchableOpacity onPress={()=>{Alert.alert('⚠️ Tüm Verileri Sil','Profilin, quiz geçmişin ve tüm verilerin silinecek. Bu işlem geri alınamaz!',[{text:'İptal'},{text:'Sil',style:'destructive',onPress:()=>{resetPersistedAppData();setProfile({...DEFAULT_PROFILE});setHistory([]);setSettings({...DEFAULT_SETTINGS});setPremium('free');setNotifications([]);setAiUsageCount(0);setLastCloudBackupAt('');setMeals([]);setExpenses([]);setSavingsGoals([]);setMonthlyBudgetLimit('');setAppState('onboarding');Analytics.log('data_reset',{});}}]);}} style={{marginTop:12,borderWidth:1,borderColor:colors.danger+'44',borderRadius:12,paddingVertical:12,alignItems:'center',backgroundColor:colors.danger+'11'}}>
          <Text style={{fontSize:13,fontWeight:'900',color:colors.danger}}>🗑️ Tüm Verileri Sil</Text>
        </TouchableOpacity>
      </AccordionCard>
      <AccordionCard title="🔧 Araçlar" defaultOpen={false} colors={colors} delay={110}>
        {[
          {title:'🤖 AI Danışman',desc:'Claude ile finans sohbeti (Plus/Pro)',action:()=>premium==='free'?setPremiumModalVisible(true):setAiAdvisorVisible(true)},
          {title:'🏆 Haftalık Turnuva',desc:'Liderlik yarışı — haftalık ödüller',action:()=>setTournamentVisible(true)},
          {title:'☁️ Yedekleme',desc:'Veri yedekleme ve geri yükleme',action:()=>setCloudSyncVisible(true)},
          {title:'🔔 Bildirimler',desc:`${unreadNotifs} okunmamış`,action:()=>setNotificationModalVisible(true)},
          {title:'📺 Reklam İzle',desc:'+100 XP ücretsiz kazan',action:()=>setRewardedAdVisible(true)},
          {title:'📧 Geri Bildirim',desc:'Öneri ve şikayetlerinizi bildirin',action:()=>{Linking.openURL('mailto:destek@fakirmetre.com?subject=Fakirmetre%20Geri%20Bildirim').catch(()=>Alert.alert('Hata','Mail uygulaması açılamadı.'));}},
          {title:'⭐ Uygulamayı Değerlendir',desc:'Play Store da puan ver',action:()=>{Linking.openURL('market://details?id=com.fakirmetre').catch(()=>Alert.alert('Hata','Play Store açılamadı.'));}},
        ].map((item,i,arr)=>(
          <TouchableOpacity key={item.title} onPress={item.action} style={[s.settingRow,{borderBottomColor:i<arr.length-1?colors.border:'transparent'}]}>
            <View style={{flex:1}}><Text style={{fontSize:14,fontWeight:'800',color:colors.text}}>{item.title}</Text><Text style={{fontSize:12,color:colors.subText}}>{item.desc}</Text></View>
            <Text style={{color:colors.primary,fontSize:16}}>→</Text>
          </TouchableOpacity>
        ))}
      </AccordionCard>
      <GlassCard colors={colors} delay={125}>
        <TouchableOpacity onPress={()=>setAboutVisible(true)} style={{flexDirection:"row",alignItems:"center",gap:12}}>
          <Text style={{fontSize:32}}>💸</Text>
          <View style={{flex:1}}>
            <Text style={{fontSize:16,fontWeight:"900",color:colors.text}}>Hakkinda</Text>
            <Text style={{fontSize:12,color:colors.subText}}>Uygulama bilgileri ve ozellikler</Text>
          </View>
          <Text style={{fontSize:18,color:colors.primary}}>→</Text>
        </TouchableOpacity>
      </GlassCard>
    </ScrollView>
  );

  // ─── TAB BAR ───────────────────────────────────────────────────────────────
  const tabs=[
    {key:'home',label:'Ana',icon:'⌂'},
    {key:'quiz',label:'Quiz',icon:'✦'},
    {key:'astro',label:'Astro',icon:'🔮'},
    {key:'kitchen',label:'Mutfak',icon:'🥗'},
    {key:'topluluk',label:'Topluluk',icon:'👥'},
    {key:'settings',label:'Ayar',icon:'⚙'},
  ] as {key:TabKey;label:string;icon:string}[];

  if(appState==='splash') return <SplashScreen onDone={handleSplashDone}/>;
  if(appState==='locked') return <PinLockScreen correctPin={settings.pinCode} onUnlock={()=>{setAppState('app');Analytics.log('pin_unlocked',{});}} colors={colors}/>;
  if(appState==='onboarding') return <OnboardingScreen onDone={handleOnboardingDone}/>;

  return (
    <SafeAreaView style={[s.safe,{backgroundColor:colors.background,paddingTop:EXTRA_TOP}]}>
      <StatusBar barStyle={settings.darkMode?'light-content':'dark-content'} backgroundColor={colors.backgroundTop} translucent={IS_ANDROID}/>
      <View style={[StyleSheet.absoluteFillObject,{backgroundColor:colors.backgroundTop,height:'42%',top:EXTRA_TOP}]}/>
      <StarField enabled={settings.starsEnabled} color={colors.star}/>
{welcomePopup&&<Modal transparent animationType="fade" visible onRequestClose={()=>setWelcomePopup(false)}><View style={[s.overlay,{backgroundColor:colors.overlay}]}><View style={{width:"88%",backgroundColor:colors.surface,borderRadius:28,borderWidth:1.5,borderColor:colors.primary,padding:24,alignItems:"center"}}><Text style={{fontSize:56,marginBottom:8}}>💸</Text><Text style={{fontSize:22,fontWeight:"900",color:colors.text,textAlign:"center",marginBottom:8}}>Fakirmetre Hos Geldin!</Text><Text style={{fontSize:15,color:colors.subText,textAlign:"center",lineHeight:22,marginBottom:20}}>Fakirlik skorunu ogrenmeye hazir misin?</Text><TouchableOpacity onPress={()=>{setWelcomePopup(false);setActiveTab("quiz");}} style={[s.mainBtn,{backgroundColor:colors.primary,width:"100%",marginBottom:10}]}><Text style={s.mainBtnTxt}>Skoru Olustur!</Text></TouchableOpacity><TouchableOpacity onPress={()=>setWelcomePopup(false)}><Text style={{fontSize:13,color:colors.subText}}>Simdi degil</Text></TouchableOpacity></View></View></Modal>}
{aboutVisible&&<Modal transparent animationType="fade" visible onRequestClose={()=>setAboutVisible(false)}><View style={[s.overlay,{backgroundColor:colors.overlay}]}><View style={{width:"92%",backgroundColor:colors.surface,borderRadius:28,borderWidth:1.5,borderColor:colors.primary,padding:24}}><View style={{alignItems:"center",marginBottom:16}}><Text style={{fontSize:52}}>💸</Text><Text style={{fontSize:22,fontWeight:"900",color:colors.text,marginTop:8}}>Fakirmetre</Text><Text style={{fontSize:12,color:colors.primary,fontWeight:"800",marginTop:4}}>v5.0 Kisisel Finans Asistani</Text></View><View style={{gap:10,marginBottom:20}}><View style={[s.infoBox,{backgroundColor:colors.surfaceSoft,borderColor:colors.border,marginTop:0}]}><Text style={{fontSize:13,fontWeight:"900",color:colors.text,marginBottom:6}}>Uygulama Hakkinda</Text><Text style={{fontSize:13,color:colors.subText,lineHeight:20}}>Fakirmetre, harcamalarini takip etmeni, tasarruf hedefleri kurmanı ve finansal aliskanlıklarını gelistirmeni saglayan kisisel finans uygulamasidır.</Text></View><View style={[s.infoBox,{backgroundColor:colors.surfaceSoft,borderColor:colors.border,marginTop:0}]}><Text style={{fontSize:13,fontWeight:"900",color:colors.text,marginBottom:6}}>Ozellikler</Text><Text style={{fontSize:12,color:colors.subText,lineHeight:20}}>Gelir Gider takibi, Tasarruf hedefleri, Fakirlik skoru quizleri, Burc yorumu, Ruya tabiri, Kalori Butce takibi, AI Finans Danismani, Akilli bildirimler, Topluluk destegi</Text></View><View style={[s.infoBox,{backgroundColor:colors.primary+"11",borderColor:colors.primary+"44",marginTop:0}]}><Text style={{fontSize:13,fontWeight:"900",color:colors.primary,marginBottom:4}}>Gelistirici</Text><Text style={{fontSize:12,color:colors.subText}}>videoin07-coder - Surum 5.0.0</Text></View></View><TouchableOpacity onPress={()=>setAboutVisible(false)} style={[s.mainBtn,{backgroundColor:colors.primary,marginBottom:0}]}><Text style={s.mainBtnTxt}>Kapat</Text></TouchableOpacity></View></View></Modal>}
      <DailyRewardModal visible={dailyRewardVisible} xp={getDailyReward()} streak={profile.streak} onClose={()=>setDailyRewardVisible(false)} colors={colors}/>
      {/* 💎 Premium */}
      {premiumModalVisible&&<PremiumPaywall visible onClose={()=>setPremiumModalVisible(false)} onUpgrade={(t)=>{setPremium(t);addNotif('Premium Aktif! 💎',`${t.toUpperCase()} planına hoş geldin!`,'💎');Analytics.log('premium_purchased',{tier:t});}} colors={colors}/>}
      {/* 📺 Rewarded Ad */}
      {rewardedAdVisible&&<RewardedAd visible onClose={()=>setRewardedAdVisible(false)} onReward={(xp)=>{addXP(xp);setNotifications((p:NotificationItem[])=>[{id:`n${Date.now()}`,title:'Reklam Ödülü! 📺',body:`+${xp} XP kazandın!`,time:new Date().toLocaleString('tr-TR'),read:false,icon:'📺'},...p]);Analytics.log('rewarded_ad_watched',{xp});}} colors={colors}/>}
      {/* 📸 Result Card */}
      {resultCardVisible&&<ResultCard visible onClose={()=>setResultCardVisible(false)} result={result} score={score} maxScore={maxScore} profile={profile} quizMode={activeQuiz} colors={colors}/>}
      {/* 🤖 AI Advisor */}
      {aiAdvisorVisible&&<AiAdvisor visible onClose={()=>setAiAdvisorVisible(false)} profile={profile} history={history} premium={premium} colors={colors} usageCount={aiUsageCount} onUsageChange={setAiUsageCount}/>}
      {/* 🔔 Notifications */}
      {notificationModalVisible&&<NotifCenter visible onClose={()=>setNotificationModalVisible(false)} notifications={notifications} onMarkRead={(id)=>setNotifications((p:NotificationItem[])=>p.map(n=>n.id===id?{...n,read:true}:n))} colors={colors}/>}
      {/* 🏆 Tournament */}
      {tournamentVisible&&<Tournament visible onClose={()=>setTournamentVisible(false)} profile={profile} colors={colors}/>}
      {/* ☁️ Cloud Sync */}
      {cloudSyncVisible&&<CloudSync visible onClose={()=>setCloudSyncVisible(false)} profile={profile} history={history} settings={settings} meals={meals} expenses={expenses} savingsGoals={savingsGoals} onImport={(data:BackupSnapshot)=>{if(data.profile)setProfile(data.profile);if(data.history)setHistory(data.history);if(data.settings)setSettings(data.settings);if(data.meals)setMeals(data.meals);if(data.expenses)setExpenses(data.expenses);if(data.savingsGoals)setSavingsGoals(data.savingsGoals);}} colors={colors} lastBackupAt={lastCloudBackupAt} onBackupAtChange={setLastCloudBackupAt}/>}
      <LevelUpModal visible={levelUpVisible} newLevel={newLevel} onClose={()=>setLevelUpVisible(false)} colors={colors}/>

      <View style={s.container}>
        <View style={s.header}>
          <View style={{flex:1}}>
            <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
              <FakirmettreIcon size={36} />
              <Text style={[s.appTitle,{color:colors.text}]}>Fakirmetre</Text>
            </View>
            <Text style={[s.appSub,{color:colors.subText}]}>{profile.avatar} {profile.name} • Sev.{profile.level} • {profile.xp}XP</Text>
          </View>
          <TouchableOpacity onPress={()=>setSearchVisible(true)} style={[s.xpBadge,{backgroundColor:colors.surfaceSoft,borderColor:colors.border,marginRight:6}]}>
            <Text style={{fontSize:14}}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>setNotificationModalVisible(true)} style={[s.xpBadge,{backgroundColor:unreadNotifs>0?colors.danger+'22':colors.primary+'22',borderColor:unreadNotifs>0?colors.danger:colors.primary}]}>
            <Text style={{fontSize:10,fontWeight:'900',color:unreadNotifs>0?colors.danger:colors.primary}}>{unreadNotifs>0?`🔔${unreadNotifs}`:`🔥${profile.streak}`}</Text>
          </TouchableOpacity>
        </View>

        <View style={{flex:1}}>
          <View style={{flex:1,display:activeTab==='home'?'flex':'none'}}>{renderHome()}</View>
          <View style={{flex:1,display:activeTab==='quiz'?'flex':'none'}}>{renderQuiz()}</View>
          <View style={{flex:1,display:activeTab==='astro'?'flex':'none'}}>{renderAstro()}</View>
          <View style={{flex:1,display:activeTab==='kitchen'?'flex':'none'}}>{renderKitchen()}</View>
          <View style={{flex:1,display:activeTab==='topluluk'?'flex':'none'}}>{renderTopluluk()}</View>
          <View style={{flex:1,display:activeTab==='settings'?'flex':'none'}}>{renderSettings()}</View>
        </View>

        <View style={[s.tabBar,{backgroundColor:colors.tabBg,borderColor:colors.border}]}>
          {tabs.map(tab=>{
            const active=activeTab===tab.key;
            return (
              <TouchableOpacity key={tab.key} onPress={()=>{setActiveTab(tab.key);Analytics.log('tab_changed',{tab:tab.key});}} style={[s.tabItem,{backgroundColor:active?colors.surfaceSoft:'transparent',borderColor:active?colors.border:'transparent'}]} activeOpacity={0.84}>
                {active&&<View style={[s.tabDot,{backgroundColor:colors.primary}]}/>}
                <Text style={[s.tabIcon,{color:active?colors.primary:colors.tabIdle}]}>{tab.icon}</Text>
                <Text style={[s.tabLabel,{color:active?colors.text:colors.tabIdle}]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── 💎 PREMIUM PAYWALL ─────────────────────────────────────────────────────
function PremiumPaywall({visible,onClose,onUpgrade,colors}:{visible:boolean;onClose:()=>void;onUpgrade:(t:PremiumTier)=>void;colors:Colors}){
  const sc=useRef(new Animated.Value(0.85)).current,op=useRef(new Animated.Value(0)).current;
  useEffect(()=>{if(visible){Animated.parallel([Animated.spring(sc,{toValue:1,tension:55,friction:8,useNativeDriver:true}),Animated.timing(op,{toValue:1,duration:300,useNativeDriver:true})]).start();}else{sc.setValue(0.85);op.setValue(0);}},[visible]);
  if(!visible) return null;
  return <Modal transparent animationType="none" visible onRequestClose={onClose}><View style={[s.overlay,{backgroundColor:colors.overlay}]}><Animated.View style={{width:'92%',backgroundColor:colors.surface,borderRadius:28,borderWidth:1.5,borderColor:colors.gold,padding:20,transform:[{scale:sc}],opacity:op}}><TouchableOpacity onPress={onClose} style={{alignSelf:'flex-end'}}><Text style={{color:colors.subText,fontSize:18}}>✕</Text></TouchableOpacity><Text style={{fontSize:38,textAlign:'center'}}>💎</Text><Text style={[s.rewardTitle,{color:colors.gold}]}>Premium&apos;a Geç</Text><Text style={{fontSize:13,color:colors.subText,textAlign:'center',marginBottom:16}}>AI Danışman, Turnuva ve çok daha fazlası!</Text><TouchableOpacity onPress={()=>{onUpgrade('plus');onClose();}} style={[s.mainBtn,{backgroundColor:colors.primary,marginBottom:10}]}><Text style={s.mainBtnTxt}>⚡ PLUS — ₺29.99/ay</Text></TouchableOpacity><TouchableOpacity onPress={()=>{onUpgrade('pro');onClose();}} style={[s.mainBtn,{backgroundColor:colors.gold,marginBottom:10}]}><Text style={s.mainBtnTxt}>🌟 PRO — ₺79.99/ay</Text></TouchableOpacity><Text style={{fontSize:11,color:colors.subText,textAlign:'center'}}>İptal edilebilir • Güvenli ödeme</Text></Animated.View></View></Modal>;
}

// ─── 📺 REWARDED AD ───────────────────────────────────────────────────────────
function RewardedAd({visible,onClose,onReward,colors}:{visible:boolean;onClose:()=>void;onReward:(xp:number)=>void;colors:Colors}){
  const [watching,setWatching]=useState(false),[done,setDone]=useState(false);
  const prog=useRef(new Animated.Value(0)).current;
  useEffect(()=>{if(visible){setWatching(false);setDone(false);prog.setValue(0);}},[visible]);
  const startAd=()=>{setWatching(true);Animated.timing(prog,{toValue:100,duration:5000,useNativeDriver:false}).start(()=>setDone(true));};
  const w=prog.interpolate({inputRange:[0,100],outputRange:['0%','100%']});
  if(!visible) return null;
  return <Modal transparent animationType="fade" visible onRequestClose={onClose}><View style={[s.overlay,{backgroundColor:'rgba(0,0,0,0.92)'}]}><View style={{width:'88%',backgroundColor:colors.surface,borderRadius:24,borderWidth:1,borderColor:colors.border,padding:22,alignItems:'center'}}><Text style={{fontSize:44}}>📺</Text><Text style={[s.rewardTitle,{color:colors.text}]}>Reklam İzle</Text><Text style={{fontSize:13,color:colors.subText,textAlign:'center',marginBottom:16}}>5 saniyelik reklam → +100 XP!</Text>{!watching&&!done&&<PressBtn onPress={startAd} style={[s.mainBtn,{backgroundColor:colors.primary,width:'100%'}]}><Text style={s.mainBtnTxt}>▶ Başlat</Text></PressBtn>}{watching&&!done&&<><Text style={{fontSize:12,color:colors.subText,marginBottom:8}}>Oynatılıyor...</Text><View style={{height:8,borderRadius:99,width:'100%',backgroundColor:colors.surfaceSoft,overflow:'hidden'}}><Animated.View style={{height:'100%',backgroundColor:colors.warning,width:w}}/></View></>}{done&&<><Text style={{fontSize:28,marginVertical:8}}>🎉</Text><PressBtn onPress={()=>{onReward(100);onClose();}} style={[s.mainBtn,{backgroundColor:colors.success,width:'100%'}]}><Text style={s.mainBtnTxt}>+100 XP Al!</Text></PressBtn></>}<TouchableOpacity onPress={onClose} style={{marginTop:12}}><Text style={{color:colors.subText,fontSize:13}}>{done?'Kapat':'Atla'}</Text></TouchableOpacity></View></View></Modal>;
}

// ─── 📸 RESULT CARD ──────────────────────────────────────────────────────────
function ResultCard({visible,onClose,result,score,maxScore,profile,quizMode,colors}:{visible:boolean;onClose:()=>void;result:any;score:number;maxScore:number;profile:Profile;quizMode:QuizMode|null;colors:Colors}){
  const sc=useRef(new Animated.Value(0.8)).current;
  useEffect(()=>{if(visible)Animated.spring(sc,{toValue:1,tension:60,friction:7,useNativeDriver:true}).start();},[visible]);
  const share=async()=>{const sig=`\n\n━━━━━━━━━━━━━━\n💸 Fakirmetre\n${profile.avatar} ${profile.name} • Sev.${profile.level} • ${profile.streak}🔥 gün\n#FakirmetreTitan`;await Share.share({message:`${result.emoji} ${result.title} — ${result.level}\n🎯 ${score}/${maxScore} puan\n\n${result.advice}${sig}`});};
  if(!visible||!quizMode) return null;
  return <Modal transparent animationType="fade" visible onRequestClose={onClose}><View style={[s.overlay,{backgroundColor:colors.overlay}]}><Animated.View style={{width:'90%',backgroundColor:colors.surface,borderRadius:28,borderWidth:2,borderColor:result.color,padding:24,alignItems:'center',transform:[{scale:sc}]}}><Text style={{fontSize:60}}>{result.emoji}</Text><View style={[s.levelBadge,{borderColor:result.color,backgroundColor:result.color+'18',alignSelf:'center',marginTop:8}]}><Text style={[s.levelBadgeTxt,{color:result.color}]}>{result.level}</Text></View><Text style={[s.resultTitle,{color:result.color}]}>{result.title}</Text><Text style={{fontSize:13,color:colors.subText,textAlign:'center',marginTop:6,marginBottom:12}}>{result.desc}</Text><View style={{flexDirection:'row',gap:8,marginBottom:16}}><View style={[s.xpBadge,{backgroundColor:colors.primary+'22',borderColor:colors.primary}]}><Text style={{fontSize:12,fontWeight:'900',color:colors.primary}}>🎯 {score}/{maxScore}</Text></View><View style={[s.xpBadge,{backgroundColor:colors.warning+'22',borderColor:colors.warning}]}><Text style={{fontSize:12,fontWeight:'900',color:colors.warning}}>🔥 {profile.streak} gün</Text></View></View><PressBtn onPress={share} style={[s.mainBtn,{backgroundColor:result.color,width:'100%'}]}><Text style={s.mainBtnTxt}>📤 Paylaş</Text></PressBtn><TouchableOpacity onPress={onClose} style={{marginTop:10}}><Text style={{color:colors.subText}}>Kapat</Text></TouchableOpacity></Animated.View></View></Modal>;
}

// ─── 🤖 AI ADVISOR ───────────────────────────────────────────────────────────
function AiAdvisor({visible,onClose,profile,history,premium,colors,usageCount,onUsageChange}:{visible:boolean;onClose:()=>void;profile:Profile;history:HistoryItem[];premium:PremiumTier;colors:Colors;usageCount:number;onUsageChange:(next:number)=>void;}){
  const [msgs,setMsgs]=useState<AiMessage[]>([]);
  const [input,setInput]=useState('');
  const [loading,setLoading]=useState(false);
  const ref=useRef<ScrollView>(null);
  const canChat=premium==='pro'||(premium==='plus'&&usageCount<10);

  useEffect(()=>{
    if(visible&&msgs.length===0){
      setMsgs([{
        role:'assistant',
        content:`Merhaba ${profile.name}! 👋 Ben Fakirmetre AI Danışmanın. Finans, birikim ve harcama alışkanlıkların hakkında sorularını yanıtlayabilirim.\n\nAPI anahtarı tanımlanmadıysa güvenli yerel tavsiyeler veririm.`,
      }]);
    }
  },[visible,msgs.length,profile.name]);

  const send=async()=>{
    if(!input.trim()||loading||!canChat) return;
    const userText=input.trim();
    setMsgs(prev=>[...prev,{role:'user',content:userText}]);
    setInput('');
    setLoading(true);
    const nextCount=usageCount+1;
    onUsageChange(nextCount);
    Analytics.log('ai_chat_sent',{premium,count:nextCount});
    const sys=`Sen Fakirmetre AI finans danışmanısın. Kullanıcı: ${profile.name}, ${profile.zodiac} burcu, Sev.${profile.level}, ${profile.streak} gün seri. Son quizler: ${history.slice(0,3).map(h=>h.quizMode+':'+h.title).join(', ')||'yok'}. Kısa (3-5 cümle), pratik, Türkçe, emoji kullan.`;
    try{
      const result=await askFinanceAssistant(userText, profile, history, sys);
      const suffix=result.mode==='offline' ? '\n\n🛠️ Demo modu: yerel finans önerisi gösteriliyor.' : '';
      setMsgs(prev=>[...prev,{role:'assistant',content:(result.text||'Şu an yanıt üretemiyorum.')+suffix}]);
    }catch{
      setMsgs(prev=>[...prev,{role:'assistant',content:getOfflineAiReply(userText, profile, history)+'\n\n🔄 Ağ hatası nedeniyle yerel öneri gösterildi.'}]);
    }finally{
      setLoading(false);
      setTimeout(()=>ref.current?.scrollToEnd({animated:true}),100);
    }
  };

  if(!visible) return null;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{flex:1,backgroundColor:colors.background,paddingTop:EXTRA_TOP}}>
        <View style={{flexDirection:'row',alignItems:'center',padding:16,borderBottomWidth:1,borderBottomColor:colors.border}}>
          <TouchableOpacity onPress={onClose}>
            <Text style={{color:colors.primary,fontSize:16,fontWeight:'800'}}>← Geri</Text>
          </TouchableOpacity>
          <Text style={{flex:1,textAlign:'center',fontSize:17,fontWeight:'900',color:colors.text}}>🤖 Claude AI Danışman</Text>
          <View style={[s.xpBadge,{backgroundColor:colors.gold+'22',borderColor:colors.gold}]}>
            <Text style={{fontSize:10,fontWeight:'900',color:colors.gold}}>
              {premium==='free'?'KİLİTLİ':premium==='plus'?`${Math.max(0,10-usageCount)} HAK`:'PRO'}
            </Text>
          </View>
        </View>

        {!canChat ? (
          <View style={{flex:1,alignItems:'center',justifyContent:'center',padding:24}}>
            <Text style={{fontSize:44}}>🔒</Text>
            <Text style={{fontSize:18,fontWeight:'900',color:colors.text,textAlign:'center',marginTop:12}}>Plus/Pro Gerekli</Text>
            <Text style={{fontSize:13,color:colors.subText,textAlign:'center',marginTop:8}}>AI Danışman Plus ve Pro planlarda kullanılabilir.</Text>
          </View>
        ) : (
          <>
            <ScrollView ref={ref} style={{flex:1}} contentContainerStyle={{padding:14}}>
              {msgs.map((m,i)=>(
                <View key={i} style={{alignItems:m.role==='user'?'flex-end':'flex-start',marginBottom:10}}>
                  <View style={{maxWidth:'85%',backgroundColor:m.role==='user'?colors.primary:colors.surface,borderRadius:18,borderBottomRightRadius:m.role==='user'?4:18,borderBottomLeftRadius:m.role==='user'?18:4,padding:13,borderWidth:1,borderColor:m.role==='user'?colors.primary:colors.border}}>
                    <Text style={{fontSize:14,lineHeight:21,color:m.role==='user'?'#fff':colors.text}}>{m.content}</Text>
                  </View>
                </View>
              ))}
              {loading&&<View style={{alignItems:'flex-start',marginBottom:10}}><View style={{backgroundColor:colors.surface,borderRadius:18,padding:13,borderWidth:1,borderColor:colors.border}}><Text style={{color:colors.subText}}>✦ Yanıt hazırlanıyor...</Text></View></View>}
            </ScrollView>
            <KeyboardAvoidingView behavior={IS_ANDROID?undefined:'padding'}>
              <View style={{paddingHorizontal:12,paddingTop:6}}>
                <Text style={{fontSize:11,color:colors.subText,textAlign:'center'}}>AI servisi kapalıysa uygulama yerel öneri moduna düşer.</Text>
              </View>
              <View style={{flexDirection:'row',gap:10,padding:12,borderTopWidth:1,borderTopColor:colors.border}}>
                <TextInput style={{flex:1,backgroundColor:colors.input,borderRadius:20,paddingHorizontal:16,paddingVertical:10,fontSize:14,color:colors.text,borderWidth:1,borderColor:colors.border}} value={input} onChangeText={setInput} placeholder="Finansal sorunuzu yazın..." placeholderTextColor={colors.subText} multiline/>
                <TouchableOpacity onPress={send} style={{backgroundColor:colors.primary,borderRadius:20,paddingHorizontal:16,justifyContent:'center'}}>
                  <Text style={{color:'#fff',fontWeight:'900',fontSize:16}}>→</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─── 🔔 NOTIFICATION CENTER ───────────────────────────────────────────────────
function NotifCenter({visible,onClose,notifications,onMarkRead,colors}:{visible:boolean;onClose:()=>void;notifications:NotificationItem[];onMarkRead:(id:string)=>void;colors:Colors}){
  if(!visible) return null;
  const unread=notifications.filter(n=>!n.read).length;
  return <Modal animationType="slide" transparent={false} visible onRequestClose={onClose}><SafeAreaView style={{flex:1,backgroundColor:colors.background,paddingTop:EXTRA_TOP}}><View style={{flexDirection:'row',alignItems:'center',padding:16,borderBottomWidth:1,borderBottomColor:colors.border}}><TouchableOpacity onPress={onClose}><Text style={{color:colors.primary,fontSize:16,fontWeight:'800'}}>← Geri</Text></TouchableOpacity><Text style={{flex:1,textAlign:'center',fontSize:17,fontWeight:'900',color:colors.text}}>🔔 Bildirimler</Text>{unread>0&&<View style={[s.xpBadge,{backgroundColor:colors.danger+'22',borderColor:colors.danger}]}><Text style={{fontSize:10,fontWeight:'900',color:colors.danger}}>{unread} yeni</Text></View>}</View><ScrollView contentContainerStyle={{gap:8,padding:14}}>{notifications.length===0&&<View style={{alignItems:'center',padding:40}}><Text style={{fontSize:44}}>🔕</Text><Text style={{fontSize:16,color:colors.subText,marginTop:12}}>Henüz bildirim yok</Text></View>}{notifications.map(n=><TouchableOpacity key={n.id} onPress={()=>onMarkRead(n.id)} style={[s.card,{backgroundColor:n.read?colors.surface:colors.primary+'11',borderColor:n.read?colors.border:colors.primary+'44'}]}><View style={{flexDirection:'row',gap:12,alignItems:'center'}}><Text style={{fontSize:26}}>{n.icon}</Text><View style={{flex:1}}><Text style={{fontSize:14,fontWeight:'900',color:colors.text}}>{n.title}</Text><Text style={{fontSize:12,color:colors.subText,marginTop:2}}>{n.body}</Text><Text style={{fontSize:10,color:colors.subText,marginTop:4}}>{n.time}</Text></View>{!n.read&&<View style={{width:8,height:8,borderRadius:4,backgroundColor:colors.primary}}/>}</View></TouchableOpacity>)}</ScrollView></SafeAreaView></Modal>;
}

// ─── 🏆 TOURNAMENT ────────────────────────────────────────────────────────────
function Tournament({visible,onClose,profile,colors}:{visible:boolean;onClose:()=>void;profile:Profile;colors:Colors}){
  if(!visible) return null;
  const end=new Date();
  end.setDate(end.getDate()+(7-end.getDay()));
  const daysLeft=Math.max(0,Math.ceil((end.getTime()-Date.now())/864e5));
  const ranking=[...MOCK_LEADERBOARD,{name:profile.name,avatar:profile.avatar,xp:profile.xp,level:profile.level}].sort((a,b)=>b.xp-a.xp);
  const myRank=ranking.findIndex(e=>e.name===profile.name)+1;

  return (
    <Modal animationType="slide" transparent={false} visible onRequestClose={onClose}>
      <SafeAreaView style={{flex:1,backgroundColor:colors.background,paddingTop:EXTRA_TOP}}>
        <View style={{flexDirection:'row',alignItems:'center',padding:16,borderBottomWidth:1,borderBottomColor:colors.border}}>
          <TouchableOpacity onPress={onClose}>
            <Text style={{color:colors.primary,fontSize:16,fontWeight:'800'}}>← Geri</Text>
          </TouchableOpacity>
          <Text style={{flex:1,textAlign:'center',fontSize:17,fontWeight:'900',color:colors.text}}>🏆 Haftalık Turnuva</Text>
        </View>

        <ScrollView contentContainerStyle={{padding:14,gap:12}}>
          <View style={[s.card,{backgroundColor:colors.surface,borderColor:colors.border,flexDirection:'row',justifyContent:'space-around'}]}>
            <View style={{alignItems:'center'}}>
              <Text style={{fontSize:26}}>⏳</Text>
              <Text style={{fontSize:20,fontWeight:'900',color:colors.warning}}>{daysLeft}</Text>
              <Text style={{fontSize:10,color:colors.subText}}>gün kaldı</Text>
            </View>
            <View style={{alignItems:'center'}}>
              <Text style={{fontSize:26}}>📍</Text>
              <Text style={{fontSize:20,fontWeight:'900',color:colors.primary}}>#{myRank}</Text>
              <Text style={{fontSize:10,color:colors.subText}}>senin sıran</Text>
            </View>
            <View style={{alignItems:'center'}}>
              <Text style={{fontSize:26}}>🎁</Text>
              <Text style={{fontSize:20,fontWeight:'900',color:colors.gold}}>500XP</Text>
              <Text style={{fontSize:10,color:colors.subText}}>1. ödül</Text>
            </View>
          </View>

          <Text style={[s.sectionTitle,{color:colors.text,marginTop:4}]}>🏅 Sıralama</Text>

          {ranking.slice(0,10).map((e,i)=>{
            const isMe=e.name===profile.name;
            return (
              <View key={`${e.name}-${i}`} style={[s.card,{backgroundColor:isMe?colors.primary+'18':colors.surface,borderColor:isMe?colors.primary:colors.border,flexDirection:'row',alignItems:'center',gap:12,padding:12}]}>
                <Text style={{fontSize:16,fontWeight:'900',color:i<3?colors.gold:colors.subText,width:26}}>
                  {i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}
                </Text>
                <Text style={{fontSize:20}}>{e.avatar}</Text>
                <View style={{flex:1}}>
                  <Text style={{fontSize:13,fontWeight:'900',color:isMe?colors.primary:colors.text}}>{e.name}{isMe?' (Sen)':''}</Text>
                  <Text style={{fontSize:10,color:colors.subText}}>Sev.{e.level}</Text>
                </View>
                <Text style={{fontSize:12,fontWeight:'900',color:colors.warning}}>{e.xp} XP</Text>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── ☁️ CLOUD SYNC ────────────────────────────────────────────────────────────
function CloudSync({visible,onClose,profile,history,settings,meals,expenses,savingsGoals,onImport,colors,lastBackupAt,onBackupAtChange}:{visible:boolean;onClose:()=>void;profile:Profile;history:HistoryItem[];settings:SettingsState;meals:MealEntry[];expenses:ExpenseEntry[];savingsGoals:SavingsGoal[];onImport:(d:BackupSnapshot)=>void;colors:Colors;lastBackupAt:string;onBackupAtChange:(value:string)=>void;}){
  const [syncing,setSyncing]=useState(false),[synced,setSynced]=useState(false),[importText,setImportText]=useState(''),[tab,setTab]=useState<'export'|'import'>('export');
  const [savedBackup,setSavedBackup]=useState<BackupSnapshot|null>(null);
  useEffect(()=>{
    if(!visible) return;
    Storage.get(STORAGE_KEYS.cloudBackup).then(raw=>setSavedBackup(safeJsonParse(raw, null as BackupSnapshot|null)));
  },[visible,lastBackupAt]);
  const exportData=()=>{
    const d=buildBackupSnapshot(profile, history, settings, 'manual-export', { meals, expenses, savingsGoals });
    Share.share({message:'Fakirmetre Verilerim\n\n'+JSON.stringify(d,null,2),title:'Fakirmetre Yedek'});
    Analytics.log('data_exported',{historyCount:history.length});
  };
  const applyImport = (raw:any) => {
    const parsed = sanitizeImportedData(raw, {profile,history,settings});
    if(!parsed){ Alert.alert('❌','Geçersiz veya eksik veri.'); return; }
    onImport(parsed);
    Storage.set(STORAGE_KEYS.cloudBackup, JSON.stringify({...parsed, meta:{...parsed.meta, source:'manual-import'}}));
    onBackupAtChange(parsed.exportedAt);
    setSavedBackup(parsed);
    Alert.alert('✅','Veriler içe aktarıldı!');
    Analytics.log('data_imported',{historyCount:parsed.history.length});
  };
  const doImport=()=>{ try{ applyImport(JSON.parse(importText)); }catch{ Alert.alert('❌','JSON formatı hatalı.'); } };
  const sync=async()=>{
    setSyncing(true);
    const snapshot = buildBackupSnapshot(profile, history, settings, 'local-cloud', { meals, expenses, savingsGoals });
    await Storage.set(STORAGE_KEYS.cloudBackup, JSON.stringify(snapshot));
    setSavedBackup(snapshot);
    onBackupAtChange(snapshot.exportedAt);
    setSyncing(false);setSynced(true);
    Analytics.log('cloud_sync',{status:'success',historyCount:history.length});
    setTimeout(()=>setSynced(false),3000);
  };
  const restoreLocalBackup=()=>{
    if(!savedBackup){ Alert.alert('ℹ️','Kayıtlı yedek bulunamadı.'); return; }
    applyImport(savedBackup);
  };
  const deleteLocalBackup=()=>{
    Alert.alert('Yedeği Sil','Kayıtlı yerel bulut yedeği silinsin mi?',[{text:'İptal'},{text:'Sil',style:'destructive',onPress:()=>{Storage.remove(STORAGE_KEYS.cloudBackup);setSavedBackup(null);onBackupAtChange('');}}]);
  };
  if(!visible) return null;
  return <Modal animationType="slide" transparent={false} visible onRequestClose={onClose}><SafeAreaView style={{flex:1,backgroundColor:colors.background,paddingTop:EXTRA_TOP}}><View style={{flexDirection:'row',alignItems:'center',padding:16,borderBottomWidth:1,borderBottomColor:colors.border}}><TouchableOpacity onPress={onClose}><Text style={{color:colors.primary,fontSize:16,fontWeight:'800'}}>← Geri</Text></TouchableOpacity><Text style={{flex:1,textAlign:'center',fontSize:17,fontWeight:'900',color:colors.text}}>☁️ Yedekleme ve Geri Yükleme</Text></View><ScrollView contentContainerStyle={{padding:14,gap:12}}><View style={[s.card,{backgroundColor:colors.surface,borderColor:colors.border}]}><Text style={[s.sectionTitle,{color:colors.text}]}>☁️ Yerel Yedekleme</Text><Text style={{fontSize:13,color:colors.subText,marginBottom:8}}>Bu sürüm gerçek sunucuya eşitleme yapmaz; cihaz içinde güvenli bir yedek anlık görüntüsü oluşturur.</Text><Text style={{fontSize:12,color:colors.subText,marginBottom:14}}>Son yedek: {lastBackupAt?new Date(lastBackupAt).toLocaleString('tr-TR'):'henüz yok'}</Text><PressBtn onPress={sync} style={[s.mainBtn,{backgroundColor:synced?colors.success:colors.primary}]}><Text style={s.mainBtnTxt}>{syncing?'⏳ Yedek oluşturuluyor...':synced?'✅ Yedek kaydedildi!':'☁️ Şimdi Yedekle'}</Text></PressBtn>{savedBackup&&<><PressBtn onPress={restoreLocalBackup} style={[s.mainBtn,{backgroundColor:colors.secondary}]}><Text style={s.mainBtnTxt}>♻️ Son Yedeği Geri Yükle</Text></PressBtn><TouchableOpacity onPress={deleteLocalBackup} style={{alignSelf:'center',marginTop:4}}><Text style={{color:colors.danger,fontWeight:'800'}}>🗑️ Kayıtlı yedeği sil</Text></TouchableOpacity></>}</View><View style={[s.subTabRow,{backgroundColor:colors.surfaceSoft,borderColor:colors.border}]}><TouchableOpacity onPress={()=>setTab('export')} style={[s.subTab,{backgroundColor:tab==='export'?colors.primary:'transparent'}]}><Text style={{fontWeight:'900',color:tab==='export'?'#fff':colors.subText}}>📤 Dışa Aktar</Text></TouchableOpacity><TouchableOpacity onPress={()=>setTab('import')} style={[s.subTab,{backgroundColor:tab==='import'?colors.primary:'transparent'}]}><Text style={{fontWeight:'900',color:tab==='import'?'#fff':colors.subText}}>📥 İçe Aktar</Text></TouchableOpacity></View>{tab==='export'&&<View style={[s.card,{backgroundColor:colors.surface,borderColor:colors.border}]}><Text style={[s.sectionTitle,{color:colors.text}]}>📤 Export</Text><Text style={{fontSize:13,color:colors.subText,marginBottom:14}}>{history.length} quiz kaydı export edilecek. Paylaş menüsüyle JSON yedeğini dışa verebilirsin.</Text><PressBtn onPress={exportData} style={[s.mainBtn,{backgroundColor:colors.secondary}]}><Text style={s.mainBtnTxt}>📤 JSON Export</Text></PressBtn></View>}{tab==='import'&&<View style={[s.card,{backgroundColor:colors.surface,borderColor:colors.border}]}><Text style={[s.sectionTitle,{color:colors.text}]}>📥 Import</Text><TextInput style={[s.inlineInput,{backgroundColor:colors.surfaceSoft,borderColor:colors.border,color:colors.text,height:120,textAlignVertical:'top',marginBottom:12}]} value={importText} onChangeText={setImportText} placeholder='JSON verini yapıştır...' placeholderTextColor={colors.subText} multiline/><PressBtn onPress={doImport} style={[s.mainBtn,{backgroundColor:colors.success}]}><Text style={s.mainBtnTxt}>📥 İçe Aktar</Text></PressBtn></View>}</ScrollView></SafeAreaView></Modal>;
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s=StyleSheet.create({
  safe:{flex:1},container:{flex:1,paddingHorizontal:12,paddingTop:4},
  header:{flexDirection:'row',alignItems:'center',paddingBottom:6,paddingTop:2,gap:8},
  appTitle:{fontSize:22,fontWeight:'900',letterSpacing:0.2},
  appSub:{fontSize:12,marginTop:2,fontWeight:'700'},
  scrollContent:{gap:14,paddingBottom:24},
  card:{borderWidth:1,borderRadius:28,padding:18,elevation:6,shadowColor:'#000',shadowOffset:{width:0,height:4},shadowOpacity:0.18,shadowRadius:12},
  powerMark:{fontSize:32,textAlign:'center',marginBottom:4},
  heroTitle:{textAlign:'center',fontSize:27,fontWeight:'900'},
  statsRow:{flexDirection:'row',gap:8,marginTop:14},
  statBlock:{flex:1,borderWidth:1,borderRadius:18,paddingVertical:14,alignItems:'center'},
  statVal:{fontSize:17,fontWeight:'900'},
  statLbl:{marginTop:3,fontSize:11,fontWeight:'700'},
  sectionTitle:{fontSize:19,fontWeight:'900',marginBottom:10},
  rowBetween:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  searchBar:{flexDirection:'row',alignItems:'center',borderWidth:1.5,borderRadius:16,paddingHorizontal:14,paddingVertical:11,marginBottom:12},
  searchInput:{flex:1,fontSize:13,paddingVertical:0},
  zodiacGrid:{flexDirection:'row',flexWrap:'wrap',gap:7,marginTop:4},
  zodiacChip:{flexDirection:'row',alignItems:'center',gap:3,borderWidth:1,borderRadius:999,paddingVertical:7,paddingHorizontal:9},
  infoBox:{borderWidth:1.5,borderRadius:18,padding:15,marginTop:10},
  bigPanel:{borderWidth:1,borderRadius:20,padding:16,marginTop:8},
  bigTitle:{fontSize:19,fontWeight:'900',marginBottom:8},
  stepBadge:{alignSelf:'flex-start',borderRadius:999,paddingHorizontal:12,paddingVertical:4,marginBottom:12},
  questionTxt:{fontSize:21,lineHeight:32,fontWeight:'900',marginBottom:20},
  mainBtn:{borderRadius:18,paddingVertical:15,alignItems:'center',marginBottom:9},
  mainBtnTxt:{color:'#fff',fontSize:15,fontWeight:'900',letterSpacing:0.3},
  levelBadge:{borderWidth:1.5,borderRadius:999,paddingHorizontal:14,paddingVertical:6},
  levelBadgeTxt:{fontSize:11,fontWeight:'900',textTransform:'uppercase'},
  resultTitle:{marginTop:8,textAlign:'center',fontSize:26,fontWeight:'900',letterSpacing:0.3},
  scorePill:{alignSelf:'center',marginTop:10,borderWidth:1,borderRadius:999,paddingHorizontal:14,paddingVertical:8},
  xpBadge:{borderWidth:1.5,borderRadius:999,paddingHorizontal:11,paddingVertical:6},
  emptyBox:{borderWidth:1,borderRadius:16,padding:24,marginTop:8},
  settingRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:12,borderBottomWidth:1},
  accentBtn:{width:32,height:32,borderRadius:16,alignItems:'center',justifyContent:'center'},
  inlineInput:{borderWidth:1.5,borderRadius:14,paddingHorizontal:14,paddingVertical:12,fontSize:14},
  avatarMini:{width:42,height:42,borderRadius:11,borderWidth:2,alignItems:'center',justifyContent:'center',marginRight:7},
  overlay:{flex:1,alignItems:'center',justifyContent:'center'},
  rewardBox:{width:'84%',borderRadius:26,borderWidth:1,padding:22,alignItems:'center'},
  rewardTitle:{fontSize:21,fontWeight:'900',marginTop:10,marginBottom:8,textAlign:'center'},
  foodRow:{flexDirection:'row',alignItems:'center',borderWidth:1.5,borderRadius:18,padding:14},
  catChip:{borderWidth:1.5,borderRadius:999,paddingVertical:8,paddingHorizontal:14,marginRight:8},
  miniChip:{borderWidth:1,borderRadius:12,paddingHorizontal:10,paddingVertical:8,alignItems:'center'},
  budgetInputRow:{flexDirection:'row',alignItems:'center',borderWidth:1,borderRadius:14,paddingHorizontal:14,paddingVertical:12},
  budgetInput:{flex:1,fontSize:18,fontWeight:'800',paddingVertical:0},
  subTabRow:{flexDirection:'row',borderWidth:1,borderRadius:16,padding:5,marginBottom:4},
  subTab:{flex:1,borderRadius:14,paddingVertical:11,alignItems:'center'},
  tabBar:{flexDirection:'row',borderWidth:1,borderRadius:24,padding:6,marginBottom:10,marginTop:4},
  tabItem:{flex:1,borderWidth:1,borderRadius:18,paddingVertical:9,alignItems:'center',justifyContent:'center',position:'relative'},
  tabDot:{position:'absolute',top:4,width:4,height:4,borderRadius:2},
  tabIcon:{fontSize:17,marginBottom:2},
  tabLabel:{fontSize:11,fontWeight:'800'},
});

const sl=StyleSheet.create({
  bg:{flex:1,backgroundColor:'#040b18',alignItems:'center',justifyContent:'center'},
  star:{position:'absolute',borderRadius:2,backgroundColor:'#dbeafe'},
  coin:{fontSize:68,marginBottom:8},
  title:{fontSize:36,fontWeight:'900',color:'#f8fafc',letterSpacing:1},
  sub:{fontSize:18,fontWeight:'700',color:'#38bdf8',letterSpacing:5,marginTop:2},
  tag:{fontSize:12,color:'#64748b',letterSpacing:0.5,marginTop:4},
  dot:{width:8,height:8,borderRadius:4,backgroundColor:'#38bdf8'},
});