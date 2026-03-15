import { ACCENTS } from './config';
import type { AccentKey, ThemeMode } from './types';

export function getTheme(mode:ThemeMode,accent:AccentKey){
  const ac=ACCENTS[accent][mode==='dark'?'dark':'light'];
  if(mode==='light') return {background:'#eef4ff',backgroundTop:'#dbeafe',surface:'#ffffff',surfaceSoft:'#f8fbff',border:'#d8e3ff',text:'#0f172a',subText:'#64748b',primary:ac,secondary:'#8b5cf6',success:'#16a34a',danger:'#dc2626',warning:'#ea580c',star:'#93c5fd',tabBg:'#ffffff',tabIdle:'#64748b',input:'#f1f5f9',overlay:'rgba(0,0,0,0.55)',gold:'#f59e0b'};
  return {background:'#040b18',backgroundTop:'#091327',surface:'#0d1830',surfaceSoft:'#12203d',border:'#1a2c52',text:'#f8fafc',subText:'#94a3b8',primary:ac,secondary:'#a78bfa',success:'#22c55e',danger:'#ef4444',warning:'#fb923c',star:'#dbeafe',tabBg:'#091327',tabIdle:'#7c8aa5',input:'#0d1830',overlay:'rgba(0,0,0,0.8)',gold:'#fbbf24'};
}

export type Colors=ReturnType<typeof getTheme>;
