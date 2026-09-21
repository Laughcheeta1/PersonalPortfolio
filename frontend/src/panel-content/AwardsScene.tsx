import { useId } from 'react';
import { AwardRelic } from './AwardRelic';
import { awardColumns } from './awardColumns';

const columns = awardColumns.map(column => column.x);
const seeded = (i: number) => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

export function AwardsScene({ activeIndex = null }: { activeIndex?: number | null }) {
  const id = useId().replace(/:/g, '');
  return <svg className="awards-scene" viewBox="0 0 1448 1086" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor="#777380"/><stop offset=".34" stopColor="#e9a363"/><stop offset=".64" stopColor="#ffe2a0"/><stop offset="1" stopColor="#ba8144"/></linearGradient>
      <radialGradient id={`${id}-sun`}><stop stopColor="#fff5bb" stopOpacity=".92"/><stop offset="1" stopColor="#ffbf5c" stopOpacity="0"/></radialGradient>
      <linearGradient id={`${id}-stone`}><stop stopColor="#584637"/><stop offset=".18" stopColor="#cda572"/><stop offset=".35" stopColor="#efd09a"/><stop offset=".53" stopColor="#ad895e"/><stop offset=".83" stopColor="#715840"/><stop offset="1" stopColor="#d9b37b"/></linearGradient>
      <linearGradient id={`${id}-ground`} x2="0" y2="1"><stop stopColor="#71704a"/><stop offset=".5" stopColor="#5e5331"/><stop offset="1" stopColor="#30271b"/></linearGradient>
      <pattern id={`${id}-grain`} width="83" height="61" patternUnits="userSpaceOnUse">{Array.from({length:14},(_,i)=><path key={i} d={`M${seeded(i)*83} ${seeded(i+32)*61} l${1+seeded(i+7)*4} ${seeded(i+8)*2}`} stroke="#2b2218" opacity=".12" strokeWidth="1"/>)}</pattern>
      <g id={`${id}-cypress`}><path d="M0 0 Q-5 -12 -10 -20 Q-9 -45 -6 -66 L-2 -109 1 -128 5 -92 10 -60 12 -32 6 -10Z" fill="#363c28"/><path d="M0 -107 L2 2" stroke="#6e6640" strokeWidth="2"/></g>
      <g id={`${id}-olive`}><path d="M0 2 Q-6 -20 -1 -43 M-2 -20 L-21 -40 M-1 -29 L19 -50" fill="none" stroke="#5e4b2c" strokeWidth="5"/>{Array.from({length:10},(_,i)=><ellipse key={i} cx={(seeded(i+1)-.5)*64} cy={-40-seeded(i+17)*30} rx={16+seeded(i+24)*9} ry={10+seeded(i+43)*9} fill={['#777340','#4c542e','#666b37','#999051'][i%4]}/>)}</g>
    </defs>
    <path d="M0 0H1448V1086H0Z" fill={`url(#${id}-sky)`}/>
    <ellipse cx="599" cy="548" rx="580" ry="460" fill={`url(#${id}-sun)`}/>
    {Array.from({length:38},(_,i)=>{const x=seeded(i+30)*1448,y=seeded(i+71)*530;return <path key={i} d={`M${x} ${y} q20 -18 40 -4 q16 -28 41 -12 q24 -13 45 8 q25 -4 49 13 q-95 15 -175 -5Z`} fill={i%3?'#f4c294':'#8b7c80'} opacity={.17+seeded(i+88)*.22} transform={`rotate(-9 ${x} ${y})`}/>;})}
    <circle cx="615" cy="559" r="17" fill="#fff7c9"/>
    <path d="M0 625L78 575 140 591 231 578 296 610 355 583 414 590 497 568 565 554 622 574 676 555 739 587 825 543 886 580 963 561 1060 601 1143 552 1262 561 1354 500 1448 481V730H0Z" fill="#9c7b61" opacity=".63"/>
    <path d="M0 667 Q312 618 585 637 L749 598 819 517 885 509 961 482 1054 493 1124 471 1219 505 1311 568 1448 512V842H0Z" fill="#73644b"/>
    <path d="M744 641 L821 535 860 528 841 579 884 555 871 595 931 557 975 572 948 624 1078 609 1165 658Z" fill="#9c805a"/>
    <g fill="#a18b69" stroke="#766044" strokeWidth="2"><path d="M1055 463L1088 450 1125 462Z"/><path d="M1061 464H1119V493H1061Z"/>{[1067,1078,1089,1100,1111].map(x=><path key={x} d={`M${x} 465v26`} stroke="#594f42" strokeWidth="4"/>)}<path d="M1157 470H1195V495H1157Z M1190 468L1194 451 1198 468V493H1190Z M966 503H1003V521H966Z M904 517H932V536H904Z"/></g>
    {Array.from({length:37},(_,i)=><path key={i} d={`M${838+seeded(i)*394} ${508+seeded(i+32)*74} h${8+seeded(i+6)*13} v${9+seeded(i+2)*12} h-14Z`} fill={i%2?'#b39870':'#655940'}/>)}
    <path d="M0 710 Q240 651 441 723 Q651 637 848 693 Q1062 626 1448 679V1086H0Z" fill={`url(#${id}-ground)`}/>
    {Array.from({length:43},(_,i)=><use key={i} href={`#${id}-cypress`} transform={`translate(${seeded(i+91)*1448} ${640+seeded(i+39)*184}) scale(${.24+seeded(i+14)*.67})`}/>)}
    {Array.from({length:91},(_,i)=>{const y=679+seeded(i+103)*220;return <use key={i} href={`#${id}-olive`} transform={`translate(${seeded(i+84)*1448} ${y}) scale(${.4+(y-679)/200})`}/>;})}
    {columns.map((x,i)=><g key={x}>
      <path d={`M${x-75} 933l77 27 107 -5 -77 -29Z`} fill="#201e16" opacity=".5"/>
      <g fill={`url(#${id}-stone)`} stroke="#765e43" strokeWidth="2">
        <path d={`M${x-49} 909H${x+49}V940H${x-49}Z M${x-39} 886H${x+40}V908H${x-39}Z`}/>
        <ellipse cx={x} cy="886" rx="44" ry="12"/>
        <path d={`M${x-31} 415 Q${x-25} 630 ${x-31} 874 Q${x} 887 ${x+32} 874 Q${x+25} 629 ${x+31} 415Z`}/>
        {Array.from({length:9},(_,j)=><path key={j} d={`M${x-25+j*6} 423 Q${x-20+j*5} 640 ${x-25+j*6} 869`} stroke={j%2?'#dfbd88':'#65513b'} strokeWidth={j%2?2:3} fill="none" opacity=".67"/>)}
        <ellipse cx={x} cy="416" rx="35" ry="8"/><ellipse cx={x} cy="403" rx="38" ry="8"/>
        <path d={`M${x-34} 401L${x-49} 346H${x+49}L${x+34} 401Z`}/>
        {[-1,1].map(side=><g key={side} transform={`translate(${x} 0) scale(${side} 1)`}><path d="M0 402 Q-2 373 18 360 Q9 382 15 393 Q21 366 38 358 Q27 383 31 397Z" fill="#d0aa76"/><path d="M10 398 Q9 380 25 370 M22 399 Q25 378 35 371" fill="none" stroke="#715639"/><path d="M34 361 C57 368 60 341 42 341 C28 341 28 354 39 356 C47 357 47 348 41 349" fill="none" stroke="#d5b47e" strokeWidth="6"/><path d="M34 361 C57 368 60 341 42 341 C28 341 28 354 39 356" fill="none" stroke="#584832" strokeWidth="2"/></g>)}
        <path d={`M${x-56} 318H${x+56}L${x+52} 340H${x-52}Z`}/><path d={`M${x-52} 341H${x+52}`} stroke="#ebcb95" strokeWidth="5"/>
        <path d={`M${x-29} 438H${x+29}V863H${x-29}Z`} fill={`url(#${id}-grain)`} stroke="none"/>
      </g>
      {i===3&&<path d={`M${x+19} 610l-30 44 15 14 -23 51 M${x-20} 713l9 36 -11 20`} stroke="#584b39" fill="none" strokeWidth="2"/>}
      <svg opacity={activeIndex === i ? 0 : 1} x={x-100} y={103} width={200} height="220" overflow="visible"><AwardRelic kind={awardColumns[i].relic}/></svg>
    </g>)}
    {Array.from({length:64},(_,i)=>{const x=seeded(i+222)*1448,y=879+seeded(i+177)*207,s=12+seeded(i+153)*34;return <g key={i}><path d={`M${x-s} ${y} l${s*.5} ${-s*.6} ${s} ${-s*.1} ${s*.65} ${s*.55} -${s*.23} ${s*.67} -${s*1.4} ${s*.12}Z`} fill={['#a99169','#6b6046','#c1a67c','#554a36'][i%4]} stroke="#393728" strokeWidth="2"/><path d={`M${x-s*.5} ${y-s*.55} l${s} ${-s*.1} ${s*.6} ${s*.5}`} fill="none" stroke="#d9b583" opacity=".65"/></g>;})}
    {Array.from({length:94},(_,i)=>{const x=seeded(i+432)*1448,y=863+seeded(i+256)*223;return <path key={i} d={`M${x} ${y} q-12 -20 -15 -27 m15 27 q8 -27 19 -32 m-19 32 l-1 -38`} fill="none" stroke={i%3?'#ab9450':'#d5b263'} strokeWidth="2" opacity=".7"/>;})}
    <g stroke="#3e3823" fill="none" strokeWidth="12"><path d="M-40 166Q131 33 385 -28 M23 111L70 -30 M90 62L273 68 M144 39L200 -30 M1448 324Q1398 202 1445 53"/></g>
    {Array.from({length:100},(_,i)=>{const right=i>75,x=right?1400+seeded(i)*80:seeded(i+394)*460,y=right?seeded(i+328)*360:seeded(i+328)*135;return <ellipse key={i} cx={x} cy={y} rx="5" ry="18" transform={`rotate(${seeded(i+124)*160} ${x} ${y})`} fill={i%3?'#3d4228':'#737044'}/>;})}
  </svg>;
}
