import * as THREE from 'three';
import { gsap } from 'gsap';
import { material, pieza } from './geometria.js';

export function crearCartel(scene, camera) {
  const crema = material('#fff2dc');
  const materialEstrellas = material('#8272d8', 0.85);
  const cartel = new THREE.Group();
  scene.add(cartel);
  function rectangulo(ancho, alto, r) {
    const s = new THREE.Shape(),
      x = -ancho / 2,
      y = -alto / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + ancho - r, y);
    s.quadraticCurveTo(x + ancho, y, x + ancho, y + r);
    s.lineTo(x + ancho, y + alto - r);
    s.quadraticCurveTo(x + ancho, y + alto, x + ancho - r, y + alto);
    s.lineTo(x + r, y + alto);
    s.quadraticCurveTo(x, y + alto, x, y + alto - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  const matDorado = material('#e6bd68', 0.45);
  const marco = pieza(
    new THREE.ExtrudeGeometry(rectangulo(2.05, 1.55, 0.16), {
      depth: 0.12,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.035,
      bevelThickness: 0.035
    }),
    matDorado,
    cartel
  );
  marco.castShadow = false;
  const puntosLed = rectangulo(2, 1.5, 0.14).getSpacedPoints(40).slice(0, -1);
  const leds = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.024, 8, 6),
    new THREE.MeshBasicMaterial({ toneMapped: false, fog: false }),
    puntosLed.length
  );
  const posicionLed = new THREE.Matrix4();
  const coloresLed = [new THREE.Color('#fff4c9'), new THREE.Color('#ff97cf')];
  const colorLed = new THREE.Color();
  const reducirMovimiento = matchMedia('(prefers-reduced-motion: reduce)');
  puntosLed.forEach(({ x, y }, indice) => {
    leds.setMatrixAt(indice, posicionLed.makeTranslation(x, y, 0.155));
    leds.setColorAt(indice, coloresLed[indice % coloresLed.length]);
  });
  cartel.add(leds);
  pieza(
    new THREE.ShapeGeometry(rectangulo(1.92, 1.42, 0.12)),
    new THREE.MeshBasicMaterial({ color: '#fff1f5', toneMapped: false }),
    cartel,
    0,
    0,
    0.165
  );
  const lienzo = document.createElement('canvas');
  lienzo.width = 1024;
  lienzo.height = 768;
  const ctx = lienzo.getContext('2d');
  const texturaCartel = new THREE.CanvasTexture(lienzo);
  texturaCartel.colorSpace = THREE.SRGBColorSpace;
  const caraCartel = pieza(
    new THREE.PlaneGeometry(1.9, 1.425),
    new THREE.MeshBasicMaterial({
      map: texturaCartel,
      transparent: true,
      depthWrite: false,
      toneMapped: false
    }),
    cartel,
    0,
    0,
    0.175
  );
  for (let i = 0; i < 5; i++) {
    const nube = pieza(
      new THREE.SphereGeometry(0.22, 16, 12),
      crema,
      cartel,
      (i - 2) * 0.24,
      -0.85 + (i % 2) * 0.07,
      0
    );
    nube.scale.set(1.15, 0.7, 0.7);
    nube.castShadow = false;
  }
  function estrella(r) {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 2 + (i * Math.PI) / 5,
        d = i % 2 ? r * 0.45 : r;
      if (!i) s.moveTo(Math.cos(a) * d, Math.sin(a) * d);
      else s.lineTo(Math.cos(a) * d, Math.sin(a) * d);
    }
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: false });
  }
  [
    [-0.83, 0.51],
    [0.79, 0.36],
    [-0.56, 0.65]
  ].forEach(([x, y], i) => {
    const e = pieza(estrella(i === 2 ? 0.1 : 0.16), materialEstrellas, cartel, x, y, 0.19);
    e.castShadow = false;
    gsap.to(e.rotation, {
      z: i % 2 ? 0.22 : -0.22,
      duration: 2 + i,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });
  });
  const animacionCartel = { escala: 1 };
  const posicionLocal = new THREE.Vector3();
  const posicionPantalla = new THREE.Vector2();
  let centro;
  let limiteX = 0;
  let limiteSuperior = 0;
  let limiteInferior = 1;

  function mover(dx, dy) {
    centro ??= posicionPantalla.clone();
    centro.set(
      THREE.MathUtils.clamp(centro.x + dx, limiteX, 1 - limiteX),
      THREE.MathUtils.clamp(centro.y + dy, limiteSuperior, limiteInferior)
    );
  }
  function texto(texto, y, tamano = 60, color = '#63334f') {
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.font = `bold ${tamano}px "Trebuchet MS",Arial,sans-serif`;
    ctx.fillText(texto, 512, y, 900);
  }
  function dibujar(estadoLlamada) {
    ctx.clearRect(0, 0, 1024, 768);
    if (estadoLlamada === 'reposo') {
      texto('LÍNEA DIRECTA', 160, 70);
      texto('A SALTADILLA', 265, 82, '#ba507f');
      texto('¡El alcalde te necesita!', 375, 44);
      texto('Tocá el teléfono', 455, 42);
    } else if (estadoLlamada === 'llamando') {
      texto('¡RING, RING!', 165, 78, '#ba507f');
      texto('Saltadilla está llamando…', 290, 54);
      texto('La ciudad necesita ayuda.', 390, 42);
      texto('¿Atendés la llamada?', 465, 44);
    } else {
      texto('¡MENSAJE RECIBIDO!', 180, 65, '#ba507f');
      texto('Bombón, Burbuja y Bellota', 315, 46);
      texto('van en camino.', 400, 52);
      texto('Saltadilla está en buenas manos.', 475, 36);
    }
    ctx.fillStyle = '#b85a84';
    ctx.beginPath();
    ctx.roundRect(205, 565, 614, 125, 55);
    ctx.fill();
    texto(
      estadoLlamada === 'reposo' ? 'LLAMAR' : estadoLlamada === 'llamando' ? 'ATENDER' : 'VOLVER',
      646,
      46,
      '#ffffff'
    );
    if (estadoLlamada !== 'reposo') {
      ctx.fillStyle = '#63334f';
      ctx.font = 'bold 66px Arial';
      ctx.textAlign = 'right';
      ctx.fillText('×', 970, 75);
    }
    texturaCartel.needsUpdate = true;
  }
  function animar() {
    gsap.fromTo(
      animacionCartel,
      { escala: 0.93 },
      { escala: 1, duration: 0.65, ease: 'back.out(1.5)', overwrite: true }
    );
  }

  function actualizar(tiempo) {
    const movil = camera.aspect < 0.85,
      d = movil ? 5.3 : 6.2;
    const alto = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * d,
      ancho = alto * camera.aspect;
    const escala = (movil ? ancho * 0.65 : Math.min(0.78, ancho * 0.32)) *
      animacionCartel.escala;
    limiteX = 0.045 + escala * 1.24 / (2 * ancho);
    limiteSuperior = 0.055 + escala * 0.95 / (2 * alto);
    limiteInferior = 0.9 - escala * 1.16 / (2 * alto);
    posicionPantalla.set(
      THREE.MathUtils.clamp(centro?.x ?? (movil ? 0.5 : 0.79), limiteX, 1 - limiteX),
      THREE.MathUtils.clamp(centro?.y ?? (movil ? 0.22 : 0.27), limiteSuperior, limiteInferior)
    );
    posicionLocal.set(
      (posicionPantalla.x * 2 - 1) * ancho,
      (1 - posicionPantalla.y * 2) * alto,
      -d
    );
    cartel.position.copy(camera.localToWorld(posicionLocal));
    cartel.quaternion.copy(camera.quaternion);
    cartel.rotateZ(Math.sin(tiempo * 0.8) * 0.018);
    cartel.scale.setScalar(escala);
    cartel.updateMatrixWorld(true);

    for (let indice = 0; indice < leds.count; indice++) {
      const grupo = indice % coloresLed.length;
      const brillo = reducirMovimiento.matches
        ? 1
        : 0.68 + 0.32 * Math.sin(tiempo * 2.2 + grupo * Math.PI);
      leds.setColorAt(indice, colorLed.copy(coloresLed[grupo]).multiplyScalar(brillo));
    }
    leds.instanceColor.needsUpdate = true;
  }

  return { grupo: cartel, cara: caraCartel, dibujar, animar, actualizar, mover };
}
