import { useId } from 'react';

export type AwardRelicType = 'armor' | 'laurel' | 'helmet' | 'swords' | 'shield' | 'civic-crown';

export type AwardRelicKind = AwardRelicType;

/** Sculpted bronze relics, authored entirely as scalable frontend geometry. */
export function AwardRelic({ kind }: { kind: AwardRelicKind }) {
  const id = useId().replace(/:/g, '');
  const gold = `url(#${id}-gold)`;
  const dark = '#312519';
  return <svg className="award-relic__illustration" viewBox="0 0 200 220" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-gold`} x1="0" x2="1"><stop stopColor="#382b1d"/><stop offset=".23" stopColor="#a98342"/><stop offset=".42" stopColor="#e4bd73"/><stop offset=".56" stopColor="#79603a"/><stop offset=".8" stopColor="#bb9251"/><stop offset="1" stopColor="#43301d"/></linearGradient>
      <linearGradient id={`${id}-steel`}><stop stopColor="#55545a"/><stop offset=".45" stopColor="#d8cdb6"/><stop offset=".5" stopColor="#8f9190"/><stop offset="1" stopColor="#343844"/></linearGradient>
      <linearGradient id={`${id}-red`}><stop stopColor="#270f0b"/><stop offset=".5" stopColor="#9c3420"/><stop offset="1" stopColor="#3b120d"/></linearGradient>
      <linearGradient id={`${id}-civic-gold`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#805016"/><stop offset=".28" stopColor="#ffe9a0"/><stop offset=".48" stopColor="#e9b638"/><stop offset=".7" stopColor="#a56c15"/><stop offset="1" stopColor="#ffdc72"/></linearGradient>
      <g id={`${id}-oak-leaf`}>
        <path d="M0 0 C-5 -5 -14 -3 -11 -11 C-23 -9 -25 -19 -16 -22 C-30 -25 -25 -35 -16 -32 C-23 -43 -15 -48 -8 -42 Q-8 -54 0 -59 Q8 -54 8 -42 C15 -48 23 -43 16 -32 C25 -35 30 -25 16 -22 C25 -19 23 -9 11 -11 C14 -3 5 -5 0 0Z" fill={`url(#${id}-civic-gold)`} stroke="#805016" strokeWidth="1.2"/>
        <path d="M0 -3V-51 M0 -13L-10 -19 M0 -25L-15 -31 M0 -37L-8 -43 M0 -13L10 -19 M0 -25L15 -31 M0 -37L8 -43" fill="none" stroke="#fff0ac" strokeWidth="1"/>
      </g>
    </defs>
    {kind === 'civic-crown' && <g>
      <path d="M98 190 C17 179 21 84 65 42 M102 190 C183 179 179 84 135 42" fill="none" stroke="#976719" strokeWidth="7"/>
      {[-1, 1].map(side => <g key={side} transform={`translate(100 0) scale(${side} 1)`}>
        {[0,1,2,3,4,5].map(i => <g key={i} transform={`translate(${12 + Math.sin(i / 5 * Math.PI * .85) * 48} ${182 - i * 23})`}>
          <use href={`#${id}-oak-leaf`} transform={`rotate(${60 - i * 17}) scale(.65)`}/>
          <use href={`#${id}-oak-leaf`} transform={`rotate(${-48 - i * 10}) scale(.52)`}/>
        </g>)}
        {[0,1,2].map(i => <g key={i} transform={`translate(${36 + i * 11} ${164 - i * 34}) rotate(25)`}>
          <ellipse cy="5" rx="5" ry="8" fill={`url(#${id}-civic-gold)`} stroke="#805016"/>
          <path d="M-6 3Q-6 -6 0 -5Q6 -6 6 3Z" fill="#bd8c28" stroke="#805016"/>
        </g>)}
      </g>)}
      <path d="M88 185Q100 190 112 185L110 194Q100 200 90 194Z" fill={`url(#${id}-civic-gold)`} stroke="#805016"/>
    </g>}
    {kind === 'armor' && <g stroke={dark} strokeWidth="2">
      <path d="M119 21 Q160 15 171 54 L177 213 143 195 116 173Z" fill={`url(#${id}-red)`}/>
      <path d="M145 38 Q151 112 159 195 M157 44 L169 207" fill="none" stroke="#c5632e"/>
      <path d="M62 21 Q79 34 100 32 Q119 33 132 20 L150 40 143 73 135 129 Q108 143 67 129 L59 71 47 42Z" fill={gold}/>
      <path d="M68 22 Q96 49 131 22 L125 40 Q100 58 71 39Z" fill="#201b16" stroke="#ca9d50"/>
      {[0,1,2].map(i=><g key={i}><path d={`M${48+i*10} ${34+i*2} Q${35+i*9} 54 ${33+i*10} 78 L${43+i*10} 82 ${60+i*7} 45Z`} fill={gold}/><path d={`M${134+i*7} ${36+i*2} L${150+i*8} 74 ${141+i*9} 80 ${127+i*8} 45Z`} fill={gold}/></g>)}
      <path d="M65 73 Q82 58 99 75 Q119 60 140 74 M66 88 Q88 105 101 89 Q122 104 139 87 M70 119 Q104 108 135 119" stroke="#e0b872" fill="none"/>
      <path d="M92 60 L103 53 111 61 108 81 101 88 95 78Z" fill={dark}/>
      <path d="M70 133 Q101 144 135 132 L145 167 129 169 119 143 125 176 110 179 102 145 99 180 83 176 85 145 77 171 61 166Z" fill={gold}/>
      {[76,91,106,121].map((x,i)=><g key={x} fill="none" stroke="#d6ae64" strokeWidth="1"><circle cx={x} cy={113+(i%2)*8} r="5"/><path d={`M${x-5} 52 q5 -7 10 0 q-5 8 -10 0`}/></g>)}
      <path d="M69 129 Q103 142 137 130" stroke="#edc378" strokeWidth="5"/>
    </g>}
    {kind === 'laurel' && <g>
      <path d="M25 183 Q30 163 61 164 L140 164 Q171 167 175 184 L167 201 Q99 210 32 200Z" fill={`url(#${id}-red)`} stroke="#b48638" strokeWidth="2"/>
      <path d="M29 190 Q100 204 172 190" fill="none" stroke="#d6ac55" strokeWidth="3"/>
      <path d="M96 175 Q39 160 43 108 Q47 77 67 63 M104 175 Q165 155 155 105 Q151 81 131 65" fill="none" stroke="#a68033" strokeWidth="4"/>
      {Array.from({length:7},(_,i)=><g key={i} fill={gold} stroke="#5f5126" strokeWidth="1"><path d={`M${48+i*4} ${90+i*12} q-27 -7 -23 -27 q25 4 23 27 q15 -18 28 -17 q-1 22 -24 28`}/><path d={`M${151-i*4} ${90+i*12} q27 -7 23 -27 q-25 4 -23 27 q-15 -18 -28 -17 q1 22 24 28`}/></g>)}
      <path d="M91 178 L102 173 113 180 108 189 98 185 89 190Z" fill="#d2a955"/>
    </g>}
    {kind === 'helmet' && <g stroke={dark} strokeWidth="2">
      <path d="M46 139 Q13 69 70 26 Q123 -7 164 39 L153 60 Q112 39 80 77 L66 143Z" fill={`url(#${id}-red)`}/>
      {Array.from({length:19},(_,i)=><path key={i} d={`M${39+i*6} ${78-Math.sin(i/18*Math.PI)*50} l${-9+i*.8} -23`} stroke={i%3 ? '#7c2815':'#b44e27'} strokeWidth="2"/>)}
      <path d="M58 142 Q42 106 66 76 Q96 42 127 66 L145 99 151 112 142 124 134 160 147 198 118 204 94 170 92 202 58 203 70 176Z" fill={gold}/>
      <path d="M64 111 Q106 79 145 104 L148 115 Q107 99 69 126Z" fill={gold}/>
      <path d="M98 123 L132 119 125 130 107 131 112 163 102 165 96 145Z" fill="#171c1a"/>
      <path d="M129 135 L132 157 145 197 124 196 110 163 113 136Z" fill={gold}/>
      <path d="M66 130 L81 128 89 164 73 190 62 190 72 166Z" fill="#73552e"/>
      <path d="M68 93 Q95 59 126 80 M74 97 Q105 71 130 87" stroke="#e2be7a" fill="none"/>
      {[0,1,2,3].map(i=><circle key={i} cx={76+i*17} cy={112-i*2} r="2" fill="#e3bf7b"/>)}
    </g>}
    {kind === 'swords' && <g>{[-1,1].map(side=><g key={side} transform={`translate(100 125) rotate(${side*43}) translate(-100 -125)`} stroke={dark} strokeWidth="2"><path d="M93 99 L107 99 106 195 100 211 94 195Z" fill={`url(#${id}-steel)`}/><path d="M100 103 L100 199" stroke="#d7cbb4" strokeWidth="1"/><path d="M91 48 L107 48 106 93 93 93Z" fill="#322017"/>{[56,64,72,80].map(y=><path key={y} d={`M92 ${y} l15 5`} stroke="#ab8245" strokeWidth="3"/>)}<path d="M78 89 Q100 96 122 88 L125 98 Q100 107 75 100Z" fill={gold}/><circle cx="100" cy="42" r="11" fill={gold}/><path d="M93 42 L100 35 108 42 100 49Z" fill="none" stroke="#d6b56c"/></g>)}</g>}
    {kind === 'shield' && <g stroke={dark} strokeWidth="2">
      <ellipse cx="100" cy="111" rx="75" ry="102" fill={gold}/><ellipse cx="100" cy="111" rx="66" ry="92" fill="#665035" stroke="#d7af62"/><ellipse cx="100" cy="111" rx="59" ry="84" fill="none" stroke="#a98544"/>
      {[-1,1].map(s=><g key={s} transform={`translate(100 0) scale(${s} 1)`}><path d="M0 187 Q66 156 48 74 Q44 54 29 43" fill="none" stroke="#c3a15a" strokeWidth="3"/>{Array.from({length:9},(_,i)=><path key={i} d={`M${31+Math.sin(i/8*Math.PI)*21} ${53+i*14} q-19 -5 -17 -18 q18 4 17 18 q16 -13 18 -3 q-8 15 -18 15`} fill="#b18d44" stroke="#584623" strokeWidth="1"/>)}</g>)}
      <path d="M98 65 L107 57 114 62 106 70 108 86 Q124 81 143 66 L138 91 115 111 106 101 108 122 119 130 100 126 82 130 93 118 93 99 83 109 62 91 56 69 Q79 83 93 85Z" fill={gold}/>
      <path d="M64 82 L84 96 M65 88 L81 102 M116 97 L135 81 M119 102 L134 88" stroke="#392d1e" fill="none"/>
      <path d="M66 135 L135 135 135 160 66 160Z" fill="#45351f" stroke="#bd9855"/>
      <text x="101" y="153" textAnchor="middle" fill="#d8b877" fontSize="20" fontFamily="Georgia, serif" letterSpacing="1">SPQR</text>
      <path d="M100 24 L103 32 112 33 106 38 108 47 100 42 92 47 94 38 88 33 97 32Z" fill="#c3a15a"/>
    </g>}
  </svg>;
}
