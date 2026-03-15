import { Platform, StatusBar } from 'react-native';
import type { AccentKey, Profile, QuizMode, SettingsState, ZodiacKey } from './types';

export const IS_ANDROID = Platform.OS === 'android';
export const ANDROID_STATUSBAR = IS_ANDROID ? (StatusBar.currentHeight ?? 24) : 0;
export const EXTRA_TOP = IS_ANDROID ? ANDROID_STATUSBAR : 0;

export const AVATARS = ['🧑','👦','👧','🧔','👩','🧑‍💼','👨‍💻','👩‍💻','🧑‍🎓','👨‍🍳','🦸','🧙','👾','🤖','🦊','🐸','🐧','🦁','🐯','🦅'];
export const XP_PER_LEVEL = 200;
export const XP_TABLE:Record<QuizMode,number> = {fakir:50,tasarruf:40,harcama:40,risk:60};
export const ACCENTS:Record<AccentKey,{light:string;dark:string;name:string}> = {
  blue:{light:'#2563eb',dark:'#38bdf8',name:'💙 Mavi'},
  purple:{light:'#8b5cf6',dark:'#a78bfa',name:'💜 Mor'},
  green:{light:'#16a34a',dark:'#22c55e',name:'💚 Yeşil'},
  orange:{light:'#ea580c',dark:'#fb923c',name:'🧡 Turuncu'},
  pink:{light:'#db2777',dark:'#f472b6',name:'💗 Pembe'},
};

export const zodiacSigns:ZodiacKey[] = ['Koç','Boğa','İkizler','Yengeç','Aslan','Başak','Terazi','Akrep','Yay','Oğlak','Kova','Balık'];
export const APP_CONFIG = {
  anthropicApiKey: '',
  anthropicModel: 'claude-3-7-sonnet-latest',
};
export const STORAGE_KEYS = {
  profile:'profile',
  history:'history',
  settings:'settings',
  analytics:'analytics_events',
  cloudBackup:'cloud_last_backup',
  aiUsage:'ai_usage_count',
  premium:'premium_tier',
  notifications:'notifications',
  meals:'meals',
  expenses:'expenses',
  savingsGoals:'savings_goals',
  monthlyBudgetLimit:'monthly_budget_limit',
};

export const DEFAULT_PROFILE:Profile={name:'Kahraman',avatar:'🧑',bio:'',xp:0,level:1,streak:1,lastLoginDate:'',totalTests:0,bestScore:9999,zodiac:'Koç',birthYear:''};
export const DEFAULT_SETTINGS:SettingsState={darkMode:true,starsEnabled:true,showQuote:true,showAstrology:true,showChallenges:true,showInsights:true,accent:'blue',pinEnabled:false,pinCode:'',shareSignature:true};
