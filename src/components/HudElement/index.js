import { Group, MeshBasicMaterial, PlaneGeometry, Mesh, Texture } from 'three';

class HudElement {
  constructor({
    name,
    text,
    fontSize = 32,
    textAlign = 'start',
    color = '#FFFFFF',
    image,
    top,
    bottom,
    left,
    right,
    x = 0,
    y = 0,
  }) {
    this.mesh = new Group();
    this.mesh.name = name;
    this.name = name;
    this.text = text;
    this.fontSize = fontSize;
    this.textAlign = textAlign;
    this.color = color;
    this.image = image;
    this.top = top;
    this.bottom = bottom;
    this.left = left;
    this.right = right;
    this.x = x;
    this.y = y;

    this.createHudElement();
  }

  createHudElement() {
    const texture = this.image ? this.createImageTexture() : this.createTextTexture();
    texture.needsUpdate = true;

    const hudMaterial = new MeshBasicMaterial({
      map: texture,
      transparent: true,
    });

    const hudGeometry = new PlaneGeometry(window.innerWidth, window.innerHeight);
    const hudMesh = new Mesh(hudGeometry, hudMaterial);

    this.mesh.add(hudMesh);
  }

  createImageTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const context = canvas.getContext('2d');
    const image = new Image(this.width, this.height);
    image.onload = () => {
      if (this.top !== undefined) this.y = 0 + this.top;
      if (this.bottom !== undefined) this.y = window.innerHeight - (this.bottom + image.height);
      if (this.left !== undefined) this.x = 0 + this.left;
      if (this.right !== undefined) this.x = window.innerWidth - (this.right + image.width);
      if (this.x === 'center') this.x = (window.innerWidth - image.width) / 2;
      if (this.y === 'center') this.y = (window.innerHeight - image.height) / 2;

      context.drawImage(image, this.x, this.y);
    };
    image.src = this.image;

    const hudTexture = new Texture(canvas);

    return hudTexture;
  }

  createTextTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const context = canvas.getContext('2d');
    context.fillStyle = this.color;
    context.textAlign = this.textAlign;
    context.font = `${this.fontSize}px Arial`;

    if (this.text.includes('\n')) {
      this.text.split('\n').forEach((line, index) => {
        context.fillText(line, this.x, this.y + ((index + 1) * this.fontSize * 1.2));
      });
    } else {
      context.fillText(this.text, this.x, this.y);
    }

    const hudTexture = new Texture(canvas);

    return hudTexture;
  }
}

export default HudElement;
