import { Texture, MeshBasicMaterial, PlaneGeometry, Mesh } from 'three';

function createHudText(settings) {
  const hudText = [
    `Map: ${settings.map}`,
    `Impostors: ${settings.impostors}`,
    `Confirm Ejects: ${settings.confirmEjects ? 'on' : 'off'}`,
    `Emergency Meetings: ${settings.emergencyMeetings}`,
    `Emergency Cooldown: ${settings.emergencyCooldown}s`,
    `Discussion Time: ${settings.discussionTime}s`,
    `Voting Time: ${settings.votingtime}s`,
    `Player Speed: ${settings.playerSpeed}x`,
    `Crewmate Vision: ${settings.crewmateVision}x`,
    `Impostor Vision: ${settings.impostorVision}x`,
    `Kill Cooldown: ${settings.killCooldown}s`,
    `Kill Distance: ${settings.killDistance}`,
    `Visual Tasks: ${settings.visualTasks ? 'on' : 'off'}`,
    `Common Tasks: ${settings.commonTasks}`,
    `Long Tasks: ${settings.longTasks}`,
    `Short Tasks: ${settings.shortTasks}`,
  ];

  return hudText;
}

function createTextTexture(text, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  context.fillStyle = '#FFFFFF';
  context.textAlign = 'start';
  context.font = '24px Arial';
  createHudText(text).forEach((line, index) => {
    context.fillText(line, 16, 40 + (index * 28.8));
  });

  const hudTexture = new Texture(canvas);
  hudTexture.needsUpdate = true;

  return hudTexture;
}

function createHud({
  text,
  image,
  width = window.innerWidth,
  height = window.innerHeight,
}) {
  const texture = image ? image : createTextTexture(text, width, height);

  const hudMaterial = new MeshBasicMaterial({
    map: texture,
    transparent: true,
  });

  const hudGeometry = new PlaneGeometry(width, height);
  const hudMesh = new Mesh(hudGeometry, hudMaterial);

  return hudMesh;
};

export default createHud;
