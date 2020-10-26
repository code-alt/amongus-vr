import { Group, MeshBasicMaterial, PlaneGeometry, Mesh, Texture } from 'three';

class Hud {
  constructor({
    name,
    text,
    fontSize = 32,
    textAlign = 'start',
    color = '#FFFFFF',
    image,
    width,
    height,
  }) {
    this.mesh = new Group();
    this.mesh.name = name;
    this.name = name;
    this.text = text;
    this.fontSize = fontSize;
    this.textAlign = textAlign;
    this.color = color;
    this.image = image;
    this.width = width;
    this.height = height;

    this.createHudElement();
  }

  createHudElement() {
    const texture = this.image
      ? this.createImageTexture()
      : this.createTextTexture();
    texture.needsUpdate = true;

    const hudMaterial = new MeshBasicMaterial({
      map: texture,
      depthTest: false,
      transparent: true,
    });

    const hudGeometry = new PlaneGeometry(1, 1, 1, 1);
    const hudMesh = new Mesh(hudGeometry, hudMaterial);

    this.mesh.add(hudMesh);
  }

  createImageTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;

    const context = canvas.getContext('2d');
    const image = new Image();
    image.onload = () => context.drawImage(image, 0, 0);
    image.src = this.image;

    const hudTexture = new Texture(canvas);

    return hudTexture;
  }

  createTextTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;

    const context = canvas.getContext('2d');
    context.fillStyle = this.color;
    context.textAlign = this.textAlign;
    context.font = `${this.fontSize}px Arial`;

    if (this.text.includes('\n')) {
      this.text.split('\n').forEach((line, index) => {
        context.fillText(line, 0, (index + 1) * this.fontSize * 1.2);
      });
    } else {
      context.fillText(this.text, 0, 0);
    }

    const hudTexture = new Texture(canvas);

    return hudTexture;
  }
}

export default Hud;
