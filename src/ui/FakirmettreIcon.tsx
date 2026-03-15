import React from 'react';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect, Path, Circle, Ellipse, Text as SvgText, G, Polygon, ClipPath } from 'react-native-svg';

export default function FakirmettreIcon({ size = 120 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Defs>
        <LinearGradient id="bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#1ab8c4" />
          <Stop offset="1" stopColor="#0a7a8a" />
        </LinearGradient>
        <LinearGradient id="gaugeG" x1="0" y1="0" x2="328" y2="0" gradientUnits="userSpaceOnUse">
          <Stop offset="0"   stopColor="#3ecf3e" />
          <Stop offset="0.4" stopColor="#f5c518" />
          <Stop offset="0.7" stopColor="#f58518" />
          <Stop offset="1"   stopColor="#e82020" />
        </LinearGradient>
        <LinearGradient id="walG" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#c8733a" />
          <Stop offset="1" stopColor="#7a3a0a" />
        </LinearGradient>
        <LinearGradient id="walLid" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#e08840" />
          <Stop offset="1" stopColor="#a05010" />
        </LinearGradient>
        <RadialGradient id="fOuter" cx="50%" cy="88%" r="68%">
          <Stop offset="0"   stopColor="#ff8800" />
          <Stop offset="0.5" stopColor="#cc2200" />
          <Stop offset="1"   stopColor="#880000" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="fMid" cx="50%" cy="82%" r="62%">
          <Stop offset="0"   stopColor="#ffcc00" />
          <Stop offset="0.4" stopColor="#ff6600" />
          <Stop offset="1"   stopColor="#cc1100" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="fCore" cx="50%" cy="75%" r="58%">
          <Stop offset="0"   stopColor="#ffffff" />
          <Stop offset="0.2" stopColor="#fffaaa" />
          <Stop offset="0.5" stopColor="#ffcc00" />
          <Stop offset="1"   stopColor="#ff4400" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="txtG" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0"   stopColor="#fff700" />
          <Stop offset="0.5" stopColor="#ffaa00" />
          <Stop offset="1"   stopColor="#ff6600" />
        </LinearGradient>
        <LinearGradient id="ndlG" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#1a2a55" />
          <Stop offset="1" stopColor="#2d4080" />
        </LinearGradient>
        <ClipPath id="clip">
          <Rect width="512" height="512" rx="110" ry="110" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#clip)">
        <Rect width="512" height="512" fill="url(#bg)" />
        {[...Array(24)].map((_,i)=>(
          <Path key={`gv${i}`} d={`M${i*22} 0 L${i*22} 512`} stroke="rgba(255,255,255,0.08)" strokeWidth="0.7"/>
        ))}
        {[...Array(24)].map((_,i)=>(
          <Path key={`gh${i}`} d={`M0 ${i*22} L512 ${i*22}`} stroke="rgba(255,255,255,0.08)" strokeWidth="0.7"/>
        ))}
        <Ellipse cx="108" cy="72" rx="108" ry="60" fill="rgba(255,255,255,0.07)" transform="rotate(-28 108 72)"/>
        <Ellipse cx="195" cy="330" rx="150" ry="11" fill="rgba(0,0,0,0.18)"/>
        <Path d="M 62 315 A 133 133 0 0 1 328 315" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="42" strokeLinecap="round"/>
        <Path d="M 62 315 A 133 133 0 0 1 328 315" fill="none" stroke="url(#gaugeG)" strokeWidth="34" strokeLinecap="round"/>
        <Circle cx="195" cy="320" r="24" fill="#162248"/>
        <Circle cx="195" cy="320" r="18" fill="#1e3066"/>
        <SvgText x="195" y="327" textAnchor="middle" fontSize="18" fontWeight="900" fill="#f5c518">$</SvgText>
        <Path d="M195 320 L285 196" stroke="url(#ndlG)" strokeWidth="8" strokeLinecap="round"/>
        <Path d="M195 320 L285 196" stroke="rgba(255,255,255,0.22)" strokeWidth="2.5" strokeLinecap="round"/>
        <SvgText x="82"  y="278" textAnchor="middle" fontSize="13" fontWeight="800" fill="white" transform="rotate(-50 82 278)">RICH</SvgText>
        <SvgText x="195" y="192" textAnchor="middle" fontSize="13" fontWeight="800" fill="white">FAKIR</SvgText>
        <SvgText x="307" y="260" textAnchor="middle" fontSize="12" fontWeight="800" fill="white" transform="rotate(50 307 260)">FAKIR</SvgText>
        <Rect x="280" y="290" width="155" height="105" rx="12" fill="url(#walG)"/>
        <Rect x="290" y="300" width="130" height="60"  rx="6"  fill="#4e2208"/>
        <Rect x="280" y="278" width="155" height="28"  rx="12" fill="url(#walLid)"/>
        <Rect x="280" y="290" width="155" height="16"        fill="url(#walLid)"/>
        <Circle cx="435" cy="344" r="10" fill="#b8832a"/>
        <Circle cx="435" cy="344" r="7"  fill="#d8a030"/>
        <Circle cx="435" cy="344" r="4"  fill="#b8832a"/>
        <Path d="M294 292 C272 244 292 194 278 146 C304 180 298 235 316 254 C306 218 320 186 310 146 C338 202 322 256 330 280 C342 240 332 204 344 166 C368 222 352 275 356 292 Z" fill="url(#fOuter)"/>
        <Path d="M302 292 C284 240 304 186 290 140 C316 176 312 232 332 252 C320 214 336 180 326 140 C354 194 338 252 346 276 C358 232 348 194 364 158 C390 212 372 270 374 292 Z" fill="url(#fMid)"/>
        <Path d="M314 292 C302 252 320 212 310 178 C330 206 326 252 340 268 C332 238 344 210 336 178 C358 210 348 256 354 278 C364 246 356 214 370 188 C386 224 374 266 376 292 Z" fill="url(#fCore)"/>
        <Circle cx="295" cy="182" r="5"   fill="#ffee00" opacity="0.9"/>
        <Circle cx="398" cy="168" r="4"   fill="#ffaa00" opacity="0.85"/>
        <Circle cx="306" cy="154" r="3.5" fill="#ff8800" opacity="0.8"/>
        <Circle cx="412" cy="196" r="3.5" fill="#ffdd00" opacity="0.85"/>
        <Rect x="296" y="194" width="92" height="54" rx="18" fill="#ffd700"/>
        <Rect x="296" y="194" width="92" height="54" rx="18" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5"/>
        <Polygon points="332,244 314,272 356,250" fill="#ffd700"/>
        <SvgText x="342" y="232" textAnchor="middle" fontSize="27" fontWeight="900" fill="#1a2d5a">₺0</SvgText>
        <SvgText x="260" y="455" textAnchor="middle" fontSize="64" fontWeight="900" fill="#3d0d00" stroke="#3d0d00" strokeWidth="12">Fakirmetre</SvgText>
        <SvgText x="260" y="455" textAnchor="middle" fontSize="64" fontWeight="900" fill="#7a2500" stroke="#7a2500" strokeWidth="7">Fakirmetre</SvgText>
        <SvgText x="256" y="449" textAnchor="middle" fontSize="64" fontWeight="900" fill="url(#txtG)">Fakirmetre</SvgText>
        <SvgText x="256" y="449" textAnchor="middle" fontSize="64" fontWeight="900" fill="rgba(255,255,255,0.18)">Fakirmetre</SvgText>
      </G>
    </Svg>
  );
}