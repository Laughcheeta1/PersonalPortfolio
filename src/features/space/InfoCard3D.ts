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
  family: 'Art Deco' | 'Modern Minimal' | 'Comic Pop';
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
    id: 'art-deco-1',
    label: 'Art Deco I',
    family: 'Art Deco',
    sideColor: '#3a2a18',
    backColor: '#271b10',
    panelFrom: '#11100b',
    panelTo: '#2f2314',
    borderColor: '#d6b06f',
    subtitleColor: '#f0d9a7',
    titleColor: '#fff0cd',
    accentColor: '#e3be77',
    subtitleFont: '600 38px Georgia, serif',
    titleFont: '700 58px Georgia, serif',
    subtitleTransform: 'uppercase',
    subtitleAlign: 'center',
    titleAlign: 'center',
    subtitleX: 512,
    subtitleY: 124,
    titleX: 512,
    titleY: 236,
    maxTextWidth: 820,
    lineHeight: 70,
    maxLines: 3,
    panelPadding: 20,
    panelRadius: 28,
  },
  {
    id: 'art-deco-2',
    label: 'Art Deco II',
    family: 'Art Deco',
    sideColor: '#2b2b1d',
    backColor: '#1d1e13',
    panelFrom: '#0e1213',
    panelTo: '#1e2f30',
    borderColor: '#f1d48f',
    subtitleColor: '#ffe7bc',
    titleColor: '#fff6e2',
    accentColor: '#d8ab4b',
    subtitleFont: '600 36px Garamond, serif',
    titleFont: '700 56px Garamond, serif',
    subtitleTransform: 'uppercase',
    subtitleAlign: 'left',
    titleAlign: 'left',
    subtitleX: 92,
    subtitleY: 120,
    titleX: 92,
    titleY: 232,
    maxTextWidth: 760,
    lineHeight: 70,
    maxLines: 3,
    panelPadding: 24,
    panelRadius: 20,
  },
  {
    id: 'art-deco-3',
    label: 'Art Deco III',
    family: 'Art Deco',
    sideColor: '#352026',
    backColor: '#25161a',
    panelFrom: '#1f0f16',
    panelTo: '#43222d',
    borderColor: '#d5a5b8',
    subtitleColor: '#f1c7d7',
    titleColor: '#ffe8f1',
    accentColor: '#c7829f',
    subtitleFont: '600 37px Times New Roman, serif',
    titleFont: '700 58px Times New Roman, serif',
    subtitleTransform: 'none',
    subtitleAlign: 'center',
    titleAlign: 'center',
    subtitleX: 512,
    subtitleY: 146,
    titleX: 512,
    titleY: 254,
    maxTextWidth: 780,
    lineHeight: 68,
    maxLines: 3,
    panelPadding: 28,
    panelRadius: 34,
  },
  {
    id: 'art-deco-4',
    label: 'Art Deco IV',
    family: 'Art Deco',
    sideColor: '#2f2f20',
    backColor: '#202016',
    panelFrom: '#101512',
    panelTo: '#253126',
    borderColor: '#ccbd8b',
    subtitleColor: '#ebe1bf',
    titleColor: '#fef6de',
    accentColor: '#9fb387',
    subtitleFont: '600 36px Georgia, serif',
    titleFont: '700 56px Georgia, serif',
    subtitleTransform: 'uppercase',
    subtitleAlign: 'left',
    titleAlign: 'left',
    subtitleX: 86,
    subtitleY: 136,
    titleX: 86,
    titleY: 248,
    maxTextWidth: 780,
    lineHeight: 68,
    maxLines: 3,
    panelPadding: 18,
    panelRadius: 16,
  },
  {
    id: 'art-deco-5',
    label: 'Art Deco V',
    family: 'Art Deco',
    sideColor: '#231f2f',
    backColor: '#181520',
    panelFrom: '#100d16',
    panelTo: '#2c2340',
    borderColor: '#c7b3df',
    subtitleColor: '#dccff2',
    titleColor: '#f5ecff',
    accentColor: '#9f88d4',
    subtitleFont: '600 36px Baskerville, Georgia, serif',
    titleFont: '700 56px Baskerville, Georgia, serif',
    subtitleTransform: 'none',
    subtitleAlign: 'center',
    titleAlign: 'center',
    subtitleX: 512,
    subtitleY: 128,
    titleX: 512,
    titleY: 244,
    maxTextWidth: 760,
    lineHeight: 68,
    maxLines: 3,
    panelPadding: 22,
    panelRadius: 30,
  },
  {
    id: 'modern-minimal-1',
    label: 'Modern Minimal I',
    family: 'Modern Minimal',
    sideColor: '#d8dce1',
    backColor: '#c2c8cf',
    panelFrom: '#f8f9fb',
    panelTo: '#e9edf3',
    borderColor: '#8d98a4',
    subtitleColor: '#6f7a86',
    titleColor: '#18212b',
    accentColor: '#95a5b8',
    subtitleFont: '600 34px Helvetica, Arial, sans-serif',
    titleFont: '700 54px Helvetica, Arial, sans-serif',
    subtitleTransform: 'uppercase',
    subtitleAlign: 'left',
    titleAlign: 'left',
    subtitleX: 84,
    subtitleY: 116,
    titleX: 84,
    titleY: 224,
    maxTextWidth: 820,
    lineHeight: 66,
    maxLines: 3,
    panelPadding: 24,
    panelRadius: 12,
  },
  {
    id: 'modern-minimal-2',
    label: 'Modern Minimal II',
    family: 'Modern Minimal',
    sideColor: '#c8d0d8',
    backColor: '#b4bdc7',
    panelFrom: '#f3f6f9',
    panelTo: '#e1e8ef',
    borderColor: '#6f8093',
    subtitleColor: '#556476',
    titleColor: '#1e2b39',
    accentColor: '#7ca0c2',
    subtitleFont: '600 34px Arial, sans-serif',
    titleFont: '700 52px Arial, sans-serif',
    subtitleTransform: 'none',
    subtitleAlign: 'center',
    titleAlign: 'center',
    subtitleX: 512,
    subtitleY: 132,
    titleX: 512,
    titleY: 240,
    maxTextWidth: 790,
    lineHeight: 64,
    maxLines: 3,
    panelPadding: 18,
    panelRadius: 24,
  },
  {
    id: 'modern-minimal-3',
    label: 'Modern Minimal III',
    family: 'Modern Minimal',
    sideColor: '#dadada',
    backColor: '#c6c6c6',
    panelFrom: '#f4f4f4',
    panelTo: '#dfdfdf',
    borderColor: '#454545',
    subtitleColor: '#383838',
    titleColor: '#111111',
    accentColor: '#7a7a7a',
    subtitleFont: '600 33px Helvetica, Arial, sans-serif',
    titleFont: '700 53px Helvetica, Arial, sans-serif',
    subtitleTransform: 'uppercase',
    subtitleAlign: 'left',
    titleAlign: 'left',
    subtitleX: 88,
    subtitleY: 128,
    titleX: 88,
    titleY: 236,
    maxTextWidth: 700,
    lineHeight: 64,
    maxLines: 3,
    panelPadding: 30,
    panelRadius: 10,
  },
  {
    id: 'modern-minimal-4',
    label: 'Modern Minimal IV',
    family: 'Modern Minimal',
    sideColor: '#d4dde6',
    backColor: '#bec8d3',
    panelFrom: '#edf2f7',
    panelTo: '#dae4ef',
    borderColor: '#89a2be',
    subtitleColor: '#597590',
    titleColor: '#173248',
    accentColor: '#5aa3d6',
    subtitleFont: '600 34px Trebuchet MS, sans-serif',
    titleFont: '700 52px Trebuchet MS, sans-serif',
    subtitleTransform: 'none',
    subtitleAlign: 'center',
    titleAlign: 'left',
    subtitleX: 512,
    subtitleY: 114,
    titleX: 110,
    titleY: 226,
    maxTextWidth: 760,
    lineHeight: 64,
    maxLines: 3,
    panelPadding: 20,
    panelRadius: 20,
  },
  {
    id: 'modern-minimal-5',
    label: 'Modern Minimal V',
    family: 'Modern Minimal',
    sideColor: '#d0d8df',
    backColor: '#bbc4cd',
    panelFrom: '#f7fafc',
    panelTo: '#e9f0f6',
    borderColor: '#7e8fa1',
    subtitleColor: '#5f6f80',
    titleColor: '#10202f',
    accentColor: '#4f7ca5',
    subtitleFont: '600 33px Arial, sans-serif',
    titleFont: '700 52px Arial, sans-serif',
    subtitleTransform: 'uppercase',
    subtitleAlign: 'left',
    titleAlign: 'center',
    subtitleX: 88,
    subtitleY: 106,
    titleX: 512,
    titleY: 238,
    maxTextWidth: 760,
    lineHeight: 64,
    maxLines: 3,
    panelPadding: 16,
    panelRadius: 18,
  },
  {
    id: 'comic-pop-1',
    label: 'Comic Pop I',
    family: 'Comic Pop',
    sideColor: '#2a2562',
    backColor: '#1d1a44',
    panelFrom: '#ffe867',
    panelTo: '#ff9a33',
    borderColor: '#1b1f67',
    subtitleColor: '#1f2c8a',
    titleColor: '#111344',
    accentColor: '#ff2f6e',
    subtitleFont: '700 36px Verdana, sans-serif',
    titleFont: '900 60px Verdana, sans-serif',
    subtitleTransform: 'uppercase',
    subtitleAlign: 'left',
    titleAlign: 'left',
    subtitleX: 92,
    subtitleY: 124,
    titleX: 92,
    titleY: 244,
    maxTextWidth: 780,
    lineHeight: 70,
    maxLines: 3,
    panelPadding: 22,
    panelRadius: 12,
  },
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
    id: 'comic-pop-3',
    label: 'Comic Pop III',
    family: 'Comic Pop',
    sideColor: '#1f4f68',
    backColor: '#15364a',
    panelFrom: '#78f7ff',
    panelTo: '#41d4ff',
    borderColor: '#0f2a63',
    subtitleColor: '#173a7a',
    titleColor: '#081f4f',
    accentColor: '#ff4f58',
    subtitleFont: '700 35px Verdana, sans-serif',
    titleFont: '900 58px Verdana, sans-serif',
    subtitleTransform: 'none',
    subtitleAlign: 'left',
    titleAlign: 'center',
    subtitleX: 94,
    subtitleY: 126,
    titleX: 512,
    titleY: 248,
    maxTextWidth: 740,
    lineHeight: 68,
    maxLines: 3,
    panelPadding: 20,
    panelRadius: 14,
  },
  {
    id: 'comic-pop-4',
    label: 'Comic Pop IV',
    family: 'Comic Pop',
    sideColor: '#633419',
    backColor: '#46250f',
    panelFrom: '#ffb14a',
    panelTo: '#ff5f48',
    borderColor: '#2d174f',
    subtitleColor: '#3b1e63',
    titleColor: '#26123f',
    accentColor: '#fff658',
    subtitleFont: '700 35px Trebuchet MS, sans-serif',
    titleFont: '900 58px Trebuchet MS, sans-serif',
    subtitleTransform: 'uppercase',
    subtitleAlign: 'center',
    titleAlign: 'left',
    subtitleX: 512,
    subtitleY: 116,
    titleX: 102,
    titleY: 238,
    maxTextWidth: 770,
    lineHeight: 68,
    maxLines: 3,
    panelPadding: 18,
    panelRadius: 20,
  },
  {
    id: 'comic-pop-5',
    label: 'Comic Pop V',
    family: 'Comic Pop',
    sideColor: '#19385f',
    backColor: '#112845',
    panelFrom: '#88a9ff',
    panelTo: '#58e2ff',
    borderColor: '#1f145f',
    subtitleColor: '#251770',
    titleColor: '#130f52',
    accentColor: '#ff4fad',
    subtitleFont: '700 35px Arial Black, Arial, sans-serif',
    titleFont: '900 58px Arial Black, Arial, sans-serif',
    subtitleTransform: 'none',
    subtitleAlign: 'left',
    titleAlign: 'left',
    subtitleX: 96,
    subtitleY: 118,
    titleX: 96,
    titleY: 238,
    maxTextWidth: 760,
    lineHeight: 68,
    maxLines: 3,
    panelPadding: 24,
    panelRadius: 24,
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

    const texture = this.createCardTexture(params.item.title, params.subcategoryLabel, design);

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

  private createCardTexture(title: string, subtitle: string, design: CardDesign): THREE.CanvasTexture {
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

    const subtitleText =
      design.subtitleTransform === 'uppercase' ? subtitle.toUpperCase() : subtitle;
    ctx.fillStyle = design.subtitleColor;
    ctx.font = design.subtitleFont;
    this.drawAlignedSingleLine(
      ctx,
      subtitleText,
      design.subtitleX,
      design.subtitleY,
      design.subtitleAlign,
      design.maxTextWidth,
    );

    ctx.fillStyle = design.titleColor;
    ctx.font = design.titleFont;
    this.drawWrappedText(ctx, title, {
      x: design.titleX,
      y: design.titleY,
      maxWidth: design.maxTextWidth,
      lineHeight: design.lineHeight,
      maxLines: design.maxLines,
      align: design.titleAlign,
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

    if (id?.startsWith('art-deco')) {
      ctx.strokeStyle = `${design.accentColor}bb`;
      ctx.lineWidth = 2;
      for (let step = 0; step < 4; step += 1) {
        const inset = padding + 18 + step * 16;
        ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);
      }

      if (id === 'art-deco-2' || id === 'art-deco-4') {
        ctx.fillStyle = `${design.accentColor}55`;
        ctx.fillRect(width - 150, 70, 70, height - 140);
      }

      if (id === 'art-deco-3' || id === 'art-deco-5') {
        ctx.strokeStyle = `${design.borderColor}bb`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(width * 0.5, 56);
        ctx.lineTo(width * 0.5, height - 56);
        ctx.stroke();
      }
    }

    if (id?.startsWith('modern-minimal')) {
      ctx.strokeStyle = `${design.borderColor}88`;
      ctx.lineWidth = 2;
      ctx.strokeRect(padding + 8, padding + 8, width - (padding + 8) * 2, height - (padding + 8) * 2);

      if (id === 'modern-minimal-1') {
        ctx.fillStyle = `${design.accentColor}55`;
        ctx.fillRect(padding + 36, padding + 64, 8, height - (padding + 64) * 2);
      }

      if (id === 'modern-minimal-2') {
        ctx.fillStyle = `${design.accentColor}44`;
        ctx.fillRect(padding + 30, height - 96, width - (padding + 30) * 2, 26);
      }

      if (id === 'modern-minimal-3') {
        ctx.fillStyle = `${design.accentColor}33`;
        ctx.fillRect(width - 240, padding + 34, 170, 94);
      }

      if (id === 'modern-minimal-4') {
        ctx.strokeStyle = `${design.accentColor}aa`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(padding + 36, 74);
        ctx.lineTo(width - padding - 36, 74);
        ctx.stroke();
      }

      if (id === 'modern-minimal-5') {
        ctx.fillStyle = `${design.accentColor}55`;
        ctx.fillRect(width - 120, 70, 44, height - 140);
      }
    }

    if (id?.startsWith('comic-pop')) {
      ctx.strokeStyle = '#141414';
      ctx.lineWidth = 6;
      ctx.strokeRect(padding + 12, padding + 12, width - (padding + 12) * 2, height - (padding + 12) * 2);

      if (id === 'comic-pop-1' || id === 'comic-pop-4') {
        ctx.fillStyle = `${design.accentColor}66`;
        for (let y = 76; y < height - 48; y += 15) {
          for (let x = 70; x < width - 68; x += 15) {
            ctx.beginPath();
            ctx.arc(x, y, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      if (id === 'comic-pop-2') {
        ctx.fillStyle = '#ffffffdd';
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 4;
        this.drawRoundedRect(ctx, 88, 68, 260, 76, 28);
        ctx.fill();
        ctx.stroke();
      }

      if (id === 'comic-pop-3' || id === 'comic-pop-5') {
        ctx.strokeStyle = `${design.accentColor}aa`;
        ctx.lineWidth = 3;
        for (let x = -200; x < width + 100; x += 36) {
          ctx.beginPath();
          ctx.moveTo(x, height - 44);
          ctx.lineTo(x + 220, 44);
          ctx.stroke();
        }
      }
    }

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

  private drawAlignedSingleLine(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    align: HorizontalAlign,
    maxWidth: number,
  ): void {
    const trimmed = this.trimTextToWidth(ctx, text, maxWidth);
    if (align === 'center') {
      const width = ctx.measureText(trimmed).width;
      ctx.fillText(trimmed, x - width * 0.5, y);
      return;
    }
    ctx.fillText(trimmed, x, y);
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
