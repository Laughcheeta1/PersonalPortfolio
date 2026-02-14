import * as THREE from 'three/src/Three.js';

import type {
  InformationItemSelection,
  InformationSceneCategory,
  InformationSceneItem,
} from '../information/models';

type HorizontalAlign = 'left' | 'center';

// Required data for creating one visible 3D card.
type InfoCard3DParams = {
  categoryId: InformationSceneCategory['id'];
  subcategoryId: string;
  subcategoryLabel: string;
  item: InformationSceneItem;
  ringIndex: number;
  angle: number;
  designIndex: number;
};

type CardDesign = {
  id: string;
  label: string;
  family: 'Comic Pop';
  sideColor: string;
  backColor: string;
  panelFrom: string;
  panelTo: string;
  borderColor: string;
  subtitleColor: string;
  titleColor: string;
  accentColor: string;
  subtitleFont: string;
  titleFont: string;
  subtitleTransform: 'none' | 'uppercase';
  subtitleAlign: HorizontalAlign;
  titleAlign: HorizontalAlign;
  subtitleX: number;
  subtitleY: number;
  titleX: number;
  titleY: number;
  maxTextWidth: number;
  lineHeight: number;
  maxLines: number;
  panelPadding: number;
  panelRadius: number;
};

const CARD_DESIGNS: CardDesign[] = [
  {
    id: 'comic-pop-2',
    label: 'Comic Pop II',
    family: 'Comic Pop',
    sideColor: '#4a1f46',
    backColor: '#351630',
    panelFrom: '#ff7fb9',
    panelTo: '#ffcf4d',
    borderColor: '#2c1354',
    subtitleColor: '#2d0f5b',
    titleColor: '#1b0f36',
    accentColor: '#23e5f1',
    subtitleFont: '700 35px Tahoma, sans-serif',
    titleFont: '900 60px Tahoma, sans-serif',
    subtitleTransform: 'uppercase',
    subtitleAlign: 'center',
    titleAlign: 'center',
    subtitleX: 512,
    subtitleY: 128,
    titleX: 512,
    titleY: 252,
    maxTextWidth: 760,
    lineHeight: 70,
    maxLines: 3,
    panelPadding: 26,
    panelRadius: 30,
  },
  {
    id: 'comic-pop-2-alt-a',
    label: 'Comic Pop 2A',
    family: 'Comic Pop',
    sideColor: '#45203f',
    backColor: '#2f152a',
    panelFrom: '#ff82bf',
    panelTo: '#ffd45a',
    borderColor: '#31145f',
    subtitleColor: '#2d0f59',
    titleColor: '#1a1035',
    accentColor: '#1de8ff',
    subtitleFont: '700 34px Tahoma, sans-serif',
    titleFont: '900 58px Tahoma, sans-serif',
    subtitleTransform: 'uppercase',
    subtitleAlign: 'left',
    titleAlign: 'left',
    subtitleX: 104,
    subtitleY: 120,
    titleX: 104,
    titleY: 242,
    maxTextWidth: 690,
    lineHeight: 68,
    maxLines: 3,
    panelPadding: 26,
    panelRadius: 28,
  },
  {
    id: 'comic-pop-2-alt-b',
    label: 'Comic Pop 2B',
    family: 'Comic Pop',
    sideColor: '#3e1a46',
    backColor: '#2b1131',
    panelFrom: '#ff8cd2',
    panelTo: '#ffb55a',
    borderColor: '#230f53',
    subtitleColor: '#260f56',
    titleColor: '#1a0f39',
    accentColor: '#50ff84',
    subtitleFont: '700 35px Verdana, sans-serif',
    titleFont: '900 58px Verdana, sans-serif',
    subtitleTransform: 'none',
    subtitleAlign: 'center',
    titleAlign: 'center',
    subtitleX: 512,
    subtitleY: 124,
    titleX: 512,
    titleY: 252,
    maxTextWidth: 760,
    lineHeight: 68,
    maxLines: 3,
    panelPadding: 24,
    panelRadius: 32,
  },
  {
    id: 'comic-pop-2-alt-c',
    label: 'Comic Pop 2C',
    family: 'Comic Pop',
    sideColor: '#4d223e',
    backColor: '#34182b',
    panelFrom: '#ff79b0',
    panelTo: '#ffdf69',
    borderColor: '#2e1457',
    subtitleColor: '#2f125f',
    titleColor: '#1b1136',
    accentColor: '#00e7ff',
    subtitleFont: '700 34px Trebuchet MS, sans-serif',
    titleFont: '900 56px Trebuchet MS, sans-serif',
    subtitleTransform: 'uppercase',
    subtitleAlign: 'left',
    titleAlign: 'center',
    subtitleX: 106,
    subtitleY: 116,
    titleX: 512,
    titleY: 242,
    maxTextWidth: 760,
    lineHeight: 66,
    maxLines: 3,
    panelPadding: 20,
    panelRadius: 16,
  },
  {
    id: 'comic-pop-2-alt-d',
    label: 'Comic Pop 2D',
    family: 'Comic Pop',
    sideColor: '#43215a',
    backColor: '#2d1540',
    panelFrom: '#ffa2da',
    panelTo: '#ffc561',
    borderColor: '#27105a',
    subtitleColor: '#311166',
    titleColor: '#1e1140',
    accentColor: '#fff35a',
    subtitleFont: '700 34px Tahoma, sans-serif',
    titleFont: '900 56px Tahoma, sans-serif',
    subtitleTransform: 'none',
    subtitleAlign: 'center',
    titleAlign: 'left',
    subtitleX: 512,
    subtitleY: 120,
    titleX: 114,
    titleY: 242,
    maxTextWidth: 730,
    lineHeight: 66,
    maxLines: 3,
    panelPadding: 22,
    panelRadius: 26,
  },
  {
    id: 'comic-pop-2-alt-e',
    label: 'Comic Pop 2E',
    family: 'Comic Pop',
    sideColor: '#3a1c4c',
    backColor: '#271234',
    panelFrom: '#ff84c5',
    panelTo: '#ffcf62',
    borderColor: '#1f0f54',
    subtitleColor: '#250f58',
    titleColor: '#180f34',
    accentColor: '#22f0be',
    subtitleFont: '700 33px Verdana, sans-serif',
    titleFont: '900 56px Verdana, sans-serif',
    subtitleTransform: 'uppercase',
    subtitleAlign: 'left',
    titleAlign: 'left',
    subtitleX: 96,
    subtitleY: 118,
    titleX: 96,
    titleY: 238,
    maxTextWidth: 610,
    lineHeight: 66,
    maxLines: 3,
    panelPadding: 24,
    panelRadius: 20,
  },
  {
    id: 'comic-pop-2-alt-f',
    label: 'Comic Pop 2F',
    family: 'Comic Pop',
    sideColor: '#4e2147',
    backColor: '#371631',
    panelFrom: '#ff7fb8',
    panelTo: '#ffd25d',
    borderColor: '#26105b',
    subtitleColor: '#2a1161',
    titleColor: '#1e123a',
    accentColor: '#69e2ff',
    subtitleFont: '700 34px Arial Black, Arial, sans-serif',
    titleFont: '900 54px Arial Black, Arial, sans-serif',
    subtitleTransform: 'uppercase',
    subtitleAlign: 'center',
    titleAlign: 'center',
    subtitleX: 512,
    subtitleY: 110,
    titleX: 512,
    titleY: 230,
    maxTextWidth: 720,
    lineHeight: 64,
    maxLines: 3,
    panelPadding: 28,
    panelRadius: 34,
  },
  {
    id: 'comic-pop-2-alt-g',
    label: 'Comic Pop 2G',
    family: 'Comic Pop',
    sideColor: '#3f1c50',
    backColor: '#2b1238',
    panelFrom: '#ff97ca',
    panelTo: '#ffcb68',
    borderColor: '#2d105d',
    subtitleColor: '#311267',
    titleColor: '#20123f',
    accentColor: '#1ee8ff',
    subtitleFont: '700 33px Trebuchet MS, sans-serif',
    titleFont: '900 56px Trebuchet MS, sans-serif',
    subtitleTransform: 'none',
    subtitleAlign: 'left',
    titleAlign: 'left',
    subtitleX: 98,
    subtitleY: 114,
    titleX: 98,
    titleY: 232,
    maxTextWidth: 700,
    lineHeight: 66,
    maxLines: 3,
    panelPadding: 18,
    panelRadius: 14,
  },
  {
    id: 'comic-pop-2-alt-h',
    label: 'Comic Pop 2H',
    family: 'Comic Pop',
    sideColor: '#4a1d4a',
    backColor: '#331332',
    panelFrom: '#ff8cc8',
    panelTo: '#ffbf5a',
    borderColor: '#231055',
    subtitleColor: '#2b115e',
    titleColor: '#1a1038',
    accentColor: '#53ff77',
    subtitleFont: '700 34px Verdana, sans-serif',
    titleFont: '900 56px Verdana, sans-serif',
    subtitleTransform: 'uppercase',
    subtitleAlign: 'center',
    titleAlign: 'center',
    subtitleX: 512,
    subtitleY: 132,
    titleX: 512,
    titleY: 258,
    maxTextWidth: 700,
    lineHeight: 66,
    maxLines: 3,
    panelPadding: 24,
    panelRadius: 30,
  },
  {
    id: 'comic-pop-2-alt-i',
    label: 'Comic Pop 2I',
    family: 'Comic Pop',
    sideColor: '#40224f',
    backColor: '#2a1735',
    panelFrom: '#ff91d4',
    panelTo: '#ffd466',
    borderColor: '#25125d',
    subtitleColor: '#2c1361',
    titleColor: '#1e123f',
    accentColor: '#ff5e8e',
    subtitleFont: '700 34px Tahoma, sans-serif',
    titleFont: '900 56px Tahoma, sans-serif',
    subtitleTransform: 'uppercase',
    subtitleAlign: 'left',
    titleAlign: 'center',
    subtitleX: 96,
    subtitleY: 122,
    titleX: 512,
    titleY: 246,
    maxTextWidth: 730,
    lineHeight: 66,
    maxLines: 3,
    panelPadding: 26,
    panelRadius: 24,
  },
  {
    id: 'comic-pop-2-alt-j',
    label: 'Comic Pop 2J',
    family: 'Comic Pop',
    sideColor: '#4b1f42',
    backColor: '#35142f',
    panelFrom: '#ff8cc3',
    panelTo: '#ffc95d',
    borderColor: '#231053',
    subtitleColor: '#2b105b',
    titleColor: '#1b1037',
    accentColor: '#15efff',
    subtitleFont: '700 34px Trebuchet MS, sans-serif',
    titleFont: '900 56px Trebuchet MS, sans-serif',
    subtitleTransform: 'none',
    subtitleAlign: 'left',
    titleAlign: 'left',
    subtitleX: 98,
    subtitleY: 118,
    titleX: 98,
    titleY: 236,
    maxTextWidth: 760,
    lineHeight: 66,
    maxLines: 3,
    panelPadding: 20,
    panelRadius: 18,
  },
];

export const CARD_DESIGN_OPTIONS = CARD_DESIGNS.map((design, index) => ({
  index,
  id: design.id,
  label: design.label,
  family: design.family,
}));
export const CARD_DESIGN_COUNT = CARD_DESIGNS.length;

export class InfoCard3D {
  readonly mesh: THREE.Mesh;
  readonly categoryId: InformationSceneCategory['id'];
  readonly subcategoryId: string;
  readonly item: InformationSceneItem;
  readonly ringIndex: number;
  readonly angle: number;
  readonly designIndex: number;

  constructor(params: InfoCard3DParams) {
    this.categoryId = params.categoryId;
    this.subcategoryId = params.subcategoryId;
    this.item = params.item;
    this.ringIndex = params.ringIndex;
    this.angle = params.angle;
    this.designIndex = this.normalizeDesignIndex(params.designIndex);

    const geometry = new THREE.BoxGeometry(2.2, 1.08, 0.5);
    const design = CARD_DESIGNS[this.designIndex];

    const texture = this.createCardTexture(params.item.title, design);

    const frontMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      opacity: 0.96,
      roughness: 0.38,
      metalness: 0.08,
    });

    const sideMaterial = new THREE.MeshStandardMaterial({
      color: design.sideColor,
      roughness: 0.55,
      metalness: 0.15,
    });
    const backMaterial = new THREE.MeshStandardMaterial({
      color: design.backColor,
      roughness: 0.6,
      metalness: 0.05,
    });

    this.mesh = new THREE.Mesh(geometry, [
      sideMaterial,
      sideMaterial,
      sideMaterial,
      sideMaterial,
      frontMaterial,
      backMaterial,
    ]);

    this.mesh.userData.infoCard = true;
  }

  setPickIndex(index: number): void {
    this.mesh.userData.infoCardIndex = index;
  }

  setLocalRingPosition(rowRadius: number): void {
    const x = Math.cos(this.angle) * rowRadius;
    const z = Math.sin(this.angle) * rowRadius;
    this.mesh.position.set(x, 0, z);
  }

  face(cameraPosition: THREE.Vector3): void {
    this.mesh.lookAt(cameraPosition);
  }

  toSelection(): InformationItemSelection {
    return {
      categoryId: this.categoryId,
      subcategoryId: this.subcategoryId,
      item: this.item,
    };
  }

  dispose(): void {
    const material = this.mesh.material;
    this.mesh.geometry.dispose();

    if (Array.isArray(material)) {
      for (const mat of material) {
        const mapCarrier = mat as THREE.MeshStandardMaterial;
        if (mapCarrier.map) {
          mapCarrier.map.dispose();
        }
        mat.dispose();
      }
      return;
    }

    const mapCarrier = material as THREE.MeshStandardMaterial;
    if (mapCarrier.map) {
      mapCarrier.map.dispose();
    }
    material.dispose();
  }

  private createCardTexture(title: string, design: CardDesign): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return new THREE.CanvasTexture(canvas);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const panelGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    panelGradient.addColorStop(0, design.panelFrom);
    panelGradient.addColorStop(1, design.panelTo);

    ctx.fillStyle = panelGradient;
    ctx.strokeStyle = design.borderColor;
    ctx.lineWidth = 6;

    const padding = design.panelPadding;
    const radius = design.panelRadius;
    const width = canvas.width - padding * 2;
    const height = canvas.height - padding * 2;

    this.drawRoundedRect(ctx, padding, padding, width, height, radius);
    ctx.fill();
    ctx.stroke();

    this.decorateDesign(ctx, design, this.designIndex, canvas.width, canvas.height, padding);

    ctx.fillStyle = design.titleColor;
    ctx.font = design.titleFont;
    this.drawWrappedText(ctx, title, {
      x: canvas.width * 0.5,
      y: design.titleY - 40,
      maxWidth: design.maxTextWidth,
      lineHeight: design.lineHeight,
      maxLines: design.maxLines,
      align: 'center',
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private decorateDesign(
    ctx: CanvasRenderingContext2D,
    design: CardDesign,
    designIndex: number,
    width: number,
    height: number,
    padding: number,
  ): void {
    ctx.save();

    const id = CARD_DESIGNS[designIndex]?.id;

    if (id?.startsWith('comic-pop')) {
      ctx.strokeStyle = '#141414';
      ctx.lineWidth = 6;
      ctx.strokeRect(padding + 12, padding + 12, width - (padding + 12) * 2, height - (padding + 12) * 2);

      if (id === 'comic-pop-2') {
        ctx.fillStyle = '#ffffffdd';
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 4;
        this.drawRoundedRect(ctx, 88, 68, 260, 76, 28);
        ctx.fill();
        ctx.stroke();
      }

      if (id?.startsWith('comic-pop-2-alt-')) {
        this.drawComicPop2AltDecor(ctx, id, design, width, height);
      }
    }

    ctx.restore();
  }

  private drawComicPop2AltDecor(
    ctx: CanvasRenderingContext2D,
    id: string,
    design: CardDesign,
    width: number,
    height: number,
  ): void {
    if (id === 'comic-pop-2-alt-a') {
      this.drawStickerBurst(ctx, width - 170, 120, 58, '#ffffffcc', design.accentColor);
      this.drawIconHeart(ctx, width - 170, 120, 22, '#ff2f6e');
      this.drawSpeechBubble(ctx, 82, 66, 300, 92, '#ffffffdd', '#1a1a1a');
      return;
    }

    if (id === 'comic-pop-2-alt-b') {
      this.drawIconLightning(ctx, width - 190, 80, 64, '#fff658');
      this.drawIconStar(ctx, width - 90, 150, 24, '#23e5f1');
      this.drawHalftoneDots(ctx, 72, 62, width - 144, height - 124, '#ffffff66', 17, 2.2);
      return;
    }

    if (id === 'comic-pop-2-alt-c') {
      this.drawIconRocket(ctx, width - 140, 108, 72, '#ffffffd8', '#ff4f58');
      this.drawSpeechBubble(ctx, 74, 68, 270, 88, '#fff9ffdd', '#1a1a1a');
      return;
    }

    if (id === 'comic-pop-2-alt-d') {
      this.drawIconController(ctx, width - 170, 110, 120, '#ffffffdd', '#1a1a1a');
      this.drawIconStar(ctx, width - 84, 76, 18, '#fff658');
      this.drawIconStar(ctx, width - 236, 82, 14, '#fff658');
      return;
    }

    if (id === 'comic-pop-2-alt-e') {
      this.drawIconRobotHead(ctx, width - 166, 118, 122, '#ffffffdd', '#1a1a1a');
      this.drawHalftoneDots(ctx, 72, 66, 330, height - 132, '#ffffff66', 16, 2.4);
      return;
    }

    if (id === 'comic-pop-2-alt-f') {
      this.drawIconBoltBadge(ctx, 120, 98, 90, '#fff658', '#1a1a1a');
      this.drawIconStar(ctx, width - 112, 108, 24, '#69e2ff');
      this.drawIconStar(ctx, width - 72, 158, 14, '#69e2ff');
      return;
    }

    if (id === 'comic-pop-2-alt-g') {
      this.drawIconPlanet(ctx, width - 130, 120, 54, '#ffffffdd', '#1a1a1a', design.accentColor);
      this.drawSpeedLines(ctx, 70, 74, width - 250, height - 130, '#ffffff77', 22);
      return;
    }

    if (id === 'comic-pop-2-alt-h') {
      this.drawSpeechBubble(ctx, width - 350, 66, 274, 86, '#fffdf0dd', '#1a1a1a');
      this.drawIconCamera(ctx, 108, 98, 122, '#ffffffdd', '#1a1a1a', design.accentColor);
      return;
    }

    if (id === 'comic-pop-2-alt-i') {
      this.drawIconShield(ctx, width - 164, 120, 92, '#ffffffdd', '#1a1a1a', '#ff5e8e');
      this.drawIconStar(ctx, width - 228, 96, 15, '#ff5e8e');
      this.drawIconStar(ctx, width - 98, 90, 12, '#ff5e8e');
      return;
    }

    if (id === 'comic-pop-2-alt-j') {
      this.drawIconSmiley(ctx, width - 150, 118, 100, '#fff658', '#1a1a1a');
      this.drawHalftoneDots(ctx, 74, 72, width - 260, height - 138, '#ffffff55', 18, 2.4);
    }
  }

  private drawStickerBurst(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    fill: string,
    stroke: string,
  ): void {
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 20; i += 1) {
      const angle = (Math.PI * 2 * i) / 20;
      const r = i % 2 === 0 ? radius : radius * 0.62;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 4;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private drawIconStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, color: string): void {
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const angle = -Math.PI / 2 + (Math.PI * i) / 5;
      const r = i % 2 === 0 ? radius : radius * 0.45;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  private drawIconHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string): void {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy + size * 0.6);
    ctx.bezierCurveTo(cx - size, cy - size * 0.1, cx - size * 0.9, cy - size, cx, cy - size * 0.35);
    ctx.bezierCurveTo(cx + size * 0.9, cy - size, cx + size, cy - size * 0.1, cx, cy + size * 0.6);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  private drawIconLightning(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + size * 0.44, y);
    ctx.lineTo(x + size * 0.24, y + size * 0.38);
    ctx.lineTo(x + size * 0.58, y + size * 0.38);
    ctx.lineTo(x + size * 0.16, y + size);
    ctx.lineTo(x + size * 0.28, y + size * 0.56);
    ctx.lineTo(x, y + size * 0.56);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawSpeechBubble(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    fill: string,
    stroke: string,
  ): void {
    ctx.save();
    this.drawRoundedRect(ctx, x, y, w, h, 22);
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 4;
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 58, y + h);
    ctx.lineTo(x + 96, y + h);
    ctx.lineTo(x + 74, y + h + 28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private drawHalftoneDots(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    step: number,
    radius: number,
  ): void {
    ctx.save();
    ctx.fillStyle = color;
    for (let py = y; py < y + h; py += step) {
      for (let px = x; px < x + w; px += step) {
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private drawSpeedLines(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    step: number,
  ): void {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    for (let py = y; py < y + h; py += step) {
      ctx.beginPath();
      ctx.moveTo(x, py);
      ctx.lineTo(x + w, py - 26);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawIconRocket(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    h: number,
    bodyColor: string,
    finColor: string,
  ): void {
    const w = h * 0.46;
    ctx.save();
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y);
    ctx.lineTo(x + w, y + h * 0.38);
    ctx.lineTo(x + w, y + h * 0.84);
    ctx.lineTo(x, y + h * 0.84);
    ctx.lineTo(x, y + h * 0.38);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = finColor;
    ctx.fillRect(x - w * 0.18, y + h * 0.56, w * 0.24, h * 0.28);
    ctx.fillRect(x + w * 0.94, y + h * 0.56, w * 0.24, h * 0.28);
    ctx.fillStyle = '#23e5f1';
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y + h * 0.44, w * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawIconController(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    fill: string,
    stroke: string,
  ): void {
    const h = w * 0.58;
    ctx.save();
    this.drawRoundedRect(ctx, x, y, w, h, 28);
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 4;
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.26, y + h * 0.46);
    ctx.lineTo(x + w * 0.40, y + h * 0.46);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + w * 0.33, y + h * 0.36);
    ctx.lineTo(x + w * 0.33, y + h * 0.56);
    ctx.stroke();
    ctx.fillStyle = stroke;
    ctx.beginPath();
    ctx.arc(x + w * 0.72, y + h * 0.43, 8, 0, Math.PI * 2);
    ctx.arc(x + w * 0.82, y + h * 0.53, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawIconRobotHead(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    fill: string,
    stroke: string,
  ): void {
    ctx.save();
    this.drawRoundedRect(ctx, x, y, size, size * 0.82, 18);
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 4;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = stroke;
    ctx.fillRect(x + size * 0.24, y + size * 0.28, size * 0.14, size * 0.12);
    ctx.fillRect(x + size * 0.62, y + size * 0.28, size * 0.14, size * 0.12);
    ctx.fillRect(x + size * 0.28, y + size * 0.56, size * 0.44, size * 0.08);
    ctx.beginPath();
    ctx.moveTo(x + size * 0.5, y - 18);
    ctx.lineTo(x + size * 0.5, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + size * 0.5, y - 22, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawIconBoltBadge(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number,
    fill: string,
    stroke: string,
  ): void {
    ctx.save();
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    this.drawIconLightning(ctx, cx - size * 0.18, cy - size * 0.24, size * 0.42, stroke);
    ctx.restore();
  }

  private drawIconPlanet(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    fill: string,
    stroke: string,
    ringColor: string,
  ): void {
    ctx.save();
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, radius * 1.4, radius * 0.38, -0.24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawIconCamera(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    fill: string,
    stroke: string,
    lensColor: string,
  ): void {
    const h = w * 0.64;
    ctx.save();
    this.drawRoundedRect(ctx, x, y, w, h, 16);
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 4;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = stroke;
    ctx.fillRect(x + 14, y - 16, 48, 16);
    ctx.fillStyle = lensColor;
    ctx.beginPath();
    ctx.arc(x + w * 0.54, y + h * 0.5, h * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawIconShield(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    fill: string,
    stroke: string,
    centerColor: string,
  ): void {
    const h = w * 1.1;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y);
    ctx.lineTo(x + w, y + h * 0.22);
    ctx.lineTo(x + w * 0.84, y + h * 0.8);
    ctx.lineTo(x + w * 0.5, y + h);
    ctx.lineTo(x + w * 0.16, y + h * 0.8);
    ctx.lineTo(x, y + h * 0.22);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 4;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = centerColor;
    ctx.fillRect(x + w * 0.44, y + h * 0.2, w * 0.12, h * 0.52);
    ctx.fillRect(x + w * 0.28, y + h * 0.4, w * 0.44, h * 0.12);
    ctx.restore();
  }

  private drawIconSmiley(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    fill: string,
    stroke: string,
  ): void {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 4;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = stroke;
    ctx.beginPath();
    ctx.arc(x - size * 0.17, y - size * 0.1, size * 0.06, 0, Math.PI * 2);
    ctx.arc(x + size * 0.17, y - size * 0.1, size * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y + size * 0.02, size * 0.2, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.restore();
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ): void {
    const r = Math.max(0, Math.min(radius, Math.min(width, height) * 0.5));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private drawWrappedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    options: {
      x: number;
      y: number;
      maxWidth: number;
      lineHeight: number;
      maxLines: number;
      align: HorizontalAlign;
    },
  ): void {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      return;
    }

    const lines: string[] = [];
    let current = '';

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (ctx.measureText(candidate).width <= options.maxWidth) {
        current = candidate;
        continue;
      }

      if (current) {
        lines.push(current);
      }
      current = word;
    }

    if (current) {
      lines.push(current);
    }

    const limitedLines = lines.slice(0, options.maxLines);
    const wasTruncated = lines.length > options.maxLines;

    if (wasTruncated && limitedLines.length > 0) {
      const lastIndex = limitedLines.length - 1;
      limitedLines[lastIndex] = this.trimTextToWidth(ctx, `${limitedLines[lastIndex]}...`, options.maxWidth);
    }

    for (let index = 0; index < limitedLines.length; index += 1) {
      const value = limitedLines[index];
      const y = options.y + index * options.lineHeight;
      if (options.align === 'center') {
        const width = ctx.measureText(value).width;
        ctx.fillText(value, options.x - width * 0.5, y);
      } else {
        ctx.fillText(value, options.x, y);
      }
    }
  }

  private trimTextToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
    if (ctx.measureText(text).width <= maxWidth) {
      return text;
    }

    let value = text;
    while (value.length > 0 && ctx.measureText(value).width > maxWidth) {
      value = value.slice(0, -1);
    }

    if (text.endsWith('...') && !value.endsWith('...')) {
      let base = value;
      while (base.length > 0 && ctx.measureText(`${base}...`).width > maxWidth) {
        base = base.slice(0, -1);
      }
      return `${base}...`;
    }

    return value;
  }

  private normalizeDesignIndex(index: number): number {
    if (!Number.isFinite(index)) {
      return 0;
    }

    const normalized = Math.floor(index);
    if (normalized < 0) {
      return 0;
    }
    if (normalized >= CARD_DESIGNS.length) {
      return CARD_DESIGNS.length - 1;
    }

    return normalized;
  }
}
