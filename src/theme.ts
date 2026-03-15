import { ACCENTS } from './config';
import type { AccentKey, ThemeMode } from './types';

export function getTheme(mode:ThemeMode,accent:AccentKey){
  const ac=ACCENTS[accent][mode==='dark'?'dark':'light'];
  if(mode==='light') return {background:'#f0f4ff',backgroundTop:'#e0eaff',surface:'#ffffff',surfaceSoft:'#f5f8ff',border:'#c7d9ff',text:'#0f172a',subText:'#556080',primary:ac,secondary:'#7c3aed',success:'#16a34a',danger:'#dc2626',warning:'#d97706',star:'#93c5fd',tabBg:'#ffffff',tabIdle:'#7c8aa5',input:'#eef2ff',overlay:'rgba(0,0,0,0.55)',gold:'#d97706'};
  return {background:'#030a16',backgroundTop:'#07112a',surface:'#0d1b35',surfaceSoft:'#111f3a',border:'#1e3361',text:'#f1f5ff',subText:'#8fa3c8',primary:ac,secondary:'#a78bfa',success:'#22c55e',danger:'#ef4444',warning:'#fb923c',star:'#dbeafe',tabBg:'#07112a',tabIdle:'#5a7099',input:'#0d1b35',overlay:'rgba(0,0,0,0.85)',gold:'#fbbf24'};
}

export type Colors=ReturnType<typeof getTheme>;
