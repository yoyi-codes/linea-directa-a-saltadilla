import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { gsap } from 'gsap';
import { crearEstrellas } from './cielo.js';

export function crearEscena(contenedor) {
  const scene = new THREE.Scene();

  const colorFondo = '#fbd4e2';
  scene.background = new THREE.Color(colorFondo);
  scene.fog = new THREE.Fog(colorFondo, 12, 32);

  const camera = new THREE.PerspectiveCamera(
    38,
    innerWidth / innerHeight,
    0.1,
    100
  );

  camera.position.set(-0.3, 3.8, 9);

  const renderer = new THREE.WebGLRenderer({ antialias: true });

  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.75;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  contenedor.appendChild(renderer.domElement);

  const controls = new OrbitControls(
    camera,
    renderer.domElement
  );

  controls.target.set(-0.3, 1.5, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = false;
  controls.enableZoom = true;
  controls.zoomSpeed = 0.7;
  controls.minDistance = 4.5;
  controls.maxDistance = 18;


  controls.update();
  controls.minPolarAngle = controls.maxPolarAngle = controls.getPolarAngle();

  function encuadrar() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    const distancia = Math.min(18, Math.max(9.3, 7.5 / camera.aspect));
    const direccion = camera.position.clone().sub(controls.target).normalize();
    camera.position.copy(controls.target).addScaledVector(direccion, distancia);
    controls.update();
  }

  encuadrar();

  const keyLight = new THREE.DirectionalLight('#fff9ef', 1.2);

  keyLight.position.set(-3, 7, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.normalBias = 0.025;

  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight('#eaf3ff', 0.4);
  fillLight.position.set(4, 3, 2);
  scene.add(fillLight);

  const hemisphereLight = new THREE.HemisphereLight(
    '#f1f7ff',
    '#b99daa',
    0.8
  );

  scene.add(hemisphereLight);

  const rimLight = new THREE.DirectionalLight('#fff2f6', 0.25);
  rimLight.position.set(2, 4, -4);
  scene.add(rimLight);

  gsap.to(rimLight.position, {
    x: 2.8,
    duration: 7,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });

  const actualizarEstrellas = crearEstrellas(scene);
  const dia = new THREE.Color(colorFondo);
  const noche = new THREE.Color('#10162f');
  const nocheIluminada = new THREE.Color('#262e60');
  const cieloNocturno = new THREE.Color();
  const cielo = { noche: 0, celebracion: 0 };
  const reducirMovimiento = matchMedia('(prefers-reduced-motion: reduce)');

  function cambiarCielo(esNoche, celebrando) {
    gsap.to(cielo, {
      noche: Number(esNoche),
      celebracion: Number(celebrando),
      duration: reducirMovimiento.matches ? 0 : 1.4,
      ease: 'sine.inOut',
      overwrite: true
    });
  }

  function actualizarCielo(tiempo) {
    cieloNocturno.copy(noche).lerp(nocheIluminada, cielo.celebracion);
    scene.background.copy(dia).lerp(cieloNocturno, cielo.noche);
    scene.fog.color.copy(scene.background);
    keyLight.intensity = THREE.MathUtils.lerp(1.2, 0.48, cielo.noche);
    fillLight.intensity = THREE.MathUtils.lerp(0.4, 0.22, cielo.noche);
    hemisphereLight.intensity = THREE.MathUtils.lerp(0.8, 0.56, cielo.noche);
    actualizarEstrellas(
      cielo.noche, cielo.celebracion, reducirMovimiento.matches ? 0 : tiempo, renderer.getPixelRatio()
    );
    return cielo.noche;
  }

  return { scene, camera, renderer, controls, encuadrar, cambiarCielo, actualizarCielo };
}
