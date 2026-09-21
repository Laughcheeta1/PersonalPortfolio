import { useEffect, useRef, type ReactElement } from 'react';

// Fixed scene coordinates keep the illustrated sky aligned with the hobby controls.
const WIDTH = 900;
const HEIGHT = 1600;
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 900;

function paintLookout(ctx: CanvasRenderingContext2D): void {
  ctx.setTransform(CANVAS_WIDTH / WIDTH, 0, 0, CANVAS_HEIGHT / HEIGHT, 0, 0);
  let seed = 61827;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const dot = (x: number, y: number, radius: number, color: string | CanvasGradient) => {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  };
  const path = (d: string, color: string | CanvasGradient, stroke?: string, width = 1) => {
    const shape = new Path2D(d);
    ctx.fillStyle = color; ctx.fill(shape);
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(shape); }
  };
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, '#020914'); sky.addColorStop(.43, '#101e30');
  sky.addColorStop(.53, '#465063'); sky.addColorStop(.565, '#d69a60'); sky.addColorStop(.63, '#172232');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Thousands of softly layered dust particles create an irregular diagonal galaxy.
  for (let i = 0; i < 8500; i++) {
    const x = random() * 1150 - 120;
    const spread = (random() + random() + random() - 1.5) * 160;
    const y = 30 + x * .63 + spread + Math.sin(x / 85) * 24;
    const radius = 2 + random() * 18;
    const warm = Math.abs(spread) < 38;
    dot(x, y, radius, warm ? `rgba(220,183,159,${.008 + random() * .024})` : `rgba(117,151,191,${.006 + random() * .02})`);
  }
  for (let i = 0; i < 1450; i++) {
    const x = random() * WIDTH;
    const y = x * .63 + 37 + Math.sin(x / 59) * 23 + (random() - .5) * 70;
    dot(x, y, 4 + random() * 17, `rgba(2,7,17,${random() * .19})`);
  }
  for (let i = 0; i < 3600; i++) {
    const x = random() * WIDTH, y = random() * 860;
    dot(x, y, .25 + random() ** 5 * 1.8, `rgba(210,230,255,${(.15 + random() * .75) * (1 - y / 1150)})`);
  }
  for (const [x, y] of [[61, 235], [270, 388], [840, 300], [522, 60], [389, 546], [738, 654]]) {
    const halo = ctx.createRadialGradient(x, y, 0, x, y, 13);
    halo.addColorStop(0, '#e9f5ff'); halo.addColorStop(.1, '#bcd6ff'); halo.addColorStop(.3, '#7899c755'); halo.addColorStop(1, '#7899c700');
    dot(x, y, 13, halo);
    ctx.strokeStyle = '#c6dfff88'; ctx.lineWidth = .7;
    ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x + 8, y); ctx.moveTo(x, y - 10); ctx.lineTo(x, y + 10); ctx.stroke();
  }
  const meteor = ctx.createLinearGradient(606, 625, 655, 572);
  meteor.addColorStop(0, '#b5cfff00'); meteor.addColorStop(1, '#d5e5ff');
  ctx.strokeStyle = meteor; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(606, 625); ctx.lineTo(655, 572); ctx.stroke();

  // Cloud banks retain warm horizon rims and cool shadowed bodies.
  for (const [cx, cy, scale] of [[38, 420, 1], [100, 668, 1.5], [278, 735, .65], [800, 797, .65], [710, 848, .35]]) {
    for (let i = 0; i < 95; i++) {
      const x = cx + (random() - .5) * 250 * scale;
      const y = cy + (random() - .5) * 74 * scale;
      const r = (8 + random() * 30) * scale;
      const cloud = ctx.createRadialGradient(x, y - r * .4, 0, x, y, r);
      cloud.addColorStop(0, cy > 600 ? '#3e4148ee' : '#263545ee');
      cloud.addColorStop(.5, '#233040cc'); cloud.addColorStop(.8, '#2a374655');
      cloud.addColorStop(1, '#23304400');
      ctx.fillStyle = cloud; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }
  const ridge = (base: number, amplitude: number, color: string, phase: number) => {
    ctx.beginPath(); ctx.moveTo(0, HEIGHT);
    for (let x = 0; x <= WIDTH; x += 8) {
      const y = base + Math.sin(x / 89 + phase) * amplitude + Math.sin(x / 29 + phase) * amplitude * .22 + (random() - .5) * 10;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(WIDTH, HEIGHT); ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  };
  ridge(894, 29, '#303947', 2);
  ridge(926, 43, '#202c3b', .5);
  ridge(981, 51, '#182432', 2.4);
  ridge(1052, 55, '#111c27', .7);

  // Roads and settlement lights narrow toward the distant valley.
  const road = new Path2D('M573 918 C686 944 467 964 635 1000 S526 1057 691 1091 S673 1160 809 1199');
  ctx.save(); ctx.shadowColor = '#ffb65a'; ctx.shadowBlur = 10;
  ctx.strokeStyle = '#e8b36c'; ctx.lineWidth = 2.3; ctx.stroke(road); ctx.restore();
  for (let i = 0; i < 2200; i++) {
    const y = 917 + random() * 355;
    const t = (y - 917) / 355;
    const center = 566 + Math.sin(y / 57) * 59;
    const x = center + (random() - .5) * (90 + t * 840);
    if (x < 65 || x > WIDTH - 25) continue;
    const district = Math.sin(x / 43 + y / 17) + Math.cos(x / 22 - y / 29);
    if (district < -.4) continue;
    dot(x, y, .35 + t * random() * 1.25, ['#ffdba0', '#eab578', '#aa7948', '#fff0c5'][Math.floor(random() * 4)]);
  }
  for (let i = 0; i < 115; i++) {
    const x = 490 + random() * 380, y = 1100 + random() * 153;
    const w = 3 + random() * 8, h = 7 + random() * 34;
    ctx.fillStyle = '#111c29'; ctx.fillRect(x, y - h, w, h);
    ctx.fillStyle = '#b79768'; ctx.fillRect(x, y - h, 1, h);
    for (let row = 3; row < h; row += 4) for (let col = 2; col < w; col += 3) {
      if (random() > .4) { ctx.fillStyle = '#f7c67f'; ctx.fillRect(x + col, y - h + row, 1, 1.5); }
    }
  }
  path('M0 1030 Q120 1040 249 1167L310 1350H0Z', '#09131d');
  path('M900 1130 Q825 1130 749 1230L628 1390H900Z', '#09131b');
  for (let i = 0; i < 210; i++) {
    const x = random() * WIDTH, y = 1240 + random() * 280;
    if (x > 155 && x < 635) continue;
    const r = 2 + random() * 13;
    dot(x, y, r, random() > .8 ? '#51462b' : '#0b1517');
  }
  // Faceted, fissured rocks beneath the seated lookout.
  path('M0 1333L94 1300 186 1323 289 1295 411 1348 523 1315 684 1360 795 1344 900 1426V1600H0Z', '#171b1e');
  for (let i = 0; i < 190; i++) {
    const x = random() * WIDTH, y = 1370 + random() * 280, w = 12 + random() * 120, h = 7 + random() * 65;
    path(`M${x} ${y}l${w * .3} ${-h} ${w * .6} ${h * .1} ${w * .3} ${h * .7} ${-w * .4} ${h * .65}Z`, ['#292b29', '#3a3a32', '#171c20', '#45433a'][Math.floor(random() * 4)], '#080f15', 2);
    ctx.strokeStyle = '#a28f6644'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w * .3, y - h); ctx.lineTo(x + w * .9, y - h * .9); ctx.stroke();
  }
  // Recompose the figure independently so landscape framing never stretches its anatomy.
  ctx.setTransform(.7, 0, 0, .7, 120, -80);
  // Back-facing figure: bent right knee, draped shirt, tousled rim-lit hair.
  const clothing = ctx.createLinearGradient(180, 1040, 529, 1310);
  clothing.addColorStop(0, '#202326'); clothing.addColorStop(.35, '#0c1117'); clothing.addColorStop(1, '#02070c');
  path('M306 1249Q412 1204 467 1180Q493 1167 515 1195L553 1310 522 1351 481 1320 458 1266Q405 1354 337 1343Z', '#070c12', '#847359', 2);
  path('M514 1320Q534 1299 551 1304L571 1339Q577 1352 556 1361L510 1358 498 1347Z', '#10171d', '#726756', 2);
  path('M535 1318l19 20m-22-12 21 18m-21-8 18 15', 'transparent', '#7b776b', 2);
  path('M266 1038Q232 1049 204 1077Q178 1099 180 1149L190 1297Q227 1346 328 1346L389 1320 401 1195 467 1176 483 1146Q450 1090 359 1064L346 1033Z', clothing, '#847357', 2);
  path('M442 1122Q469 1131 482 1144L519 1164Q538 1180 529 1196Q516 1206 501 1191L460 1180Z', '#aa8969', '#d4b589', 2);
  path('M448 1116L470 1127 469 1169 447 1176 423 1147Z', '#11171d');
  path('M510 1161l13 8-9 25-12-9Z', '#11171b');
  path('M203 1094Q225 1135 211 1208M244 1128Q249 1231 275 1278M265 1320Q305 1301 345 1261M343 1078Q351 1130 380 1150M227 1081Q267 1099 313 1081', 'transparent', '#343639', 2);
  path('M285 1051L286 1011 341 997 352 1047 336 1070Z', '#947353');
  path('M280 1050Q304 1061 345 1044L355 1070Q315 1091 271 1069Z', '#0b121a', '#5f5546', 2);
  path('M253 1004Q237 971 258 943L250 924 282 926Q308 898 333 916L356 910 367 934Q388 943 368 980L357 1015 338 1037 309 1035 283 1040Z', '#241f1b', '#c29b67', 2);
  for (let i = 0; i < 105; i++) {
    const x = 260 + random() * 102, y = 934 + random() * 85;
    if (((x - 309) / 58) ** 2 + ((y - 974) / 58) ** 2 > 1) continue;
    ctx.strokeStyle = ['#745a3b', '#bb9460', '#40362a', '#14191b'][Math.floor(random() * 4)];
    ctx.lineWidth = 1 + random() * 2;
    ctx.beginPath(); ctx.moveTo(x, y + 18); ctx.bezierCurveTo(x - 17, y - 18, x + 23, y - 32, x + 7, y - 39); ctx.stroke();
  }
}

export function HobbyScene(): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const context = canvasRef.current?.getContext('2d');
    if (context) paintLookout(context);
  }, []);
  return <canvas aria-hidden="true" className="hobby-sky__scene" height={CANVAS_HEIGHT} ref={canvasRef} width={CANVAS_WIDTH} />;
}
