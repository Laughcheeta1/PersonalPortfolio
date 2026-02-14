import * as THREE from 'three/src/Three.js';

import type {
  InformationItemSelection,
  InformationSceneCategory,
  InformationSceneItem,
} from '../information/models';

const MAX_TITLE_CHARACTERS = 88;

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
  id: 'comic-pop-2' | 'comic-pop-2-no-box';
  label: string;
  family: 'Comic Pop';
  sideColor: string;
  backColor: string;
  panelFrom: string;
  panelTo: string;
  borderColor: string;
  titleColor: string;
  titleFont: string;
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
    titleColor: '#1b0f36',
    titleFont: '900 60px Tahoma, sans-serif',
    maxTextWidth: 760,
    lineHeight: 70,
    maxLines: 3,
    panelPadding: 26,
    panelRadius: 30,
  },
  {
    id: 'comic-pop-2-no-box',
    label: 'Comic Pop II (No Box)',
    family: 'Comic Pop',
    sideColor: '#4a1f46',
    backColor: '#351630',
    panelFrom: '#ff7fb9',
    panelTo: '#ffcf4d',
    borderColor: '#2c1354',
    titleColor: '#1b0f36',
    titleFont: '900 60px Tahoma, sans-serif',
    maxTextWidth: 760,
    lineHeight: 70,
    maxLines: 3,
    panelPadding: 26,
    panelRadius: 30,
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

    this.decorateDesign(ctx, design.id, canvas.width, canvas.height, padding);

    ctx.fillStyle = design.titleColor;
    ctx.font = design.titleFont;
    this.drawCenteredWrappedText(ctx, title, {
      centerX: canvas.width * 0.5,
      centerY: canvas.height * 0.53,
      maxWidth: design.maxTextWidth,
      lineHeight: design.lineHeight,
      maxLines: design.maxLines,
      maxChars: MAX_TITLE_CHARACTERS,
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private decorateDesign(
    ctx: CanvasRenderingContext2D,
    designId: CardDesign['id'],
    width: number,
    height: number,
    padding: number,
  ): void {
    ctx.save();
    ctx.strokeStyle = '#141414';
    ctx.lineWidth = 6;
    ctx.strokeRect(padding + 12, padding + 12, width - (padding + 12) * 2, height - (padding + 12) * 2);

    if (designId === 'comic-pop-2') {
      ctx.fillStyle = '#ffffffdd';
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 4;
      this.drawRoundedRect(ctx, 88, 68, 260, 76, 28);
      ctx.fill();
      ctx.stroke();
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

  private drawCenteredWrappedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    options: {
      centerX: number;
      centerY: number;
      maxWidth: number;
      lineHeight: number;
      maxLines: number;
      maxChars: number;
    },
  ): void {
    const lines = this.buildWrappedLines(
      ctx,
      text,
      options.maxWidth,
      options.maxLines,
      options.maxChars,
    );
    if (lines.length === 0) {
      return;
    }

    const yStart = options.centerY - ((lines.length - 1) * options.lineHeight) * 0.5;

    ctx.save();
    ctx.textBaseline = 'middle';
    for (let index = 0; index < lines.length; index += 1) {
      const y = yStart + index * options.lineHeight;
      const value = lines[index];
      const width = ctx.measureText(value).width;
      ctx.fillText(value, options.centerX - width * 0.5, y);
    }
    ctx.restore();
  }

  private buildWrappedLines(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxLines: number,
    maxChars: number,
  ): string[] {
    const compact = text.trim().replace(/\s+/g, ' ');
    if (compact.length === 0) {
      return [];
    }

    const charsCapped = compact.length > maxChars;
    const limitedText = charsCapped ? compact.slice(0, maxChars).trimEnd() : compact;
    const words = limitedText.split(' ').filter(Boolean);
    const lines: string[] = [];
    let current = '';

    for (let index = 0; index < words.length; index += 1) {
      const word = words[index];
      const candidate = current ? `${current} ${word}` : word;

      if (ctx.measureText(candidate).width <= maxWidth) {
        current = candidate;
        continue;
      }

      if (!current) {
        lines.push(this.trimTextToWidth(ctx, word, maxWidth));
      } else {
        lines.push(current);
        current = word;
      }

      if (lines.length === maxLines) {
        lines[maxLines - 1] = this.trimTextToWidth(ctx, `${lines[maxLines - 1]}...`, maxWidth);
        return lines;
      }
    }

    if (current) {
      lines.push(current);
    }

    if (lines.length > maxLines) {
      const limitedLines = lines.slice(0, maxLines);
      limitedLines[maxLines - 1] = this.trimTextToWidth(ctx, `${limitedLines[maxLines - 1]}...`, maxWidth);
      return limitedLines;
    }

    if (charsCapped && lines.length > 0) {
      const last = lines.length - 1;
      lines[last] = this.trimTextToWidth(ctx, `${lines[last]}...`, maxWidth);
    }

    return lines;
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
