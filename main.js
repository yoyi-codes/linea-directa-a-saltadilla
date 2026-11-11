import * as THREE from 'three';
import { crearEscena } from './escena.js';
import { crearAmbiente } from './ambiente.js';
import { crearAudio } from './audio.js';
import { crearCartel } from './cartel.js';
import { crearFocos } from './focos.js';
import { crearTelefono } from './telefono.js';
import { conectarPuntero } from './interaccion.js';

const estado = document.querySelector('#estado');
const botonLlamar = document.querySelector('#llamar');
const botonAtender = document.querySelector('#atender');
const botonCerrar = document.querySelector('#cerrar');
const botonViento = document.querySelector('#viento');
const botonBirome = document.querySelector('#birome');
const botonSonido = document.querySelector('#sonido');
const botonNoche = document.querySelector('#noche');
const vista = crearEscena(document.querySelector('#escena'));
const { scene, camera, renderer, controls } = vista;
const ambiente = crearAmbiente(scene, estado);
const audio = crearAudio(botonSonido, estado);
const cartel = crearCartel(scene, camera);
const actualizarFocos = crearFocos(scene, camera);
const botones = { botonLlamar, botonAtender, botonCerrar, botonBirome };
const telefono = crearTelefono(scene, botones, estado, audio, cartel);
let nocheElegida = false;
let celebrando = false;

function mostrarCielo(esNoche) {
  botonNoche.setAttribute('aria-pressed', String(esNoche));
  vista.cambiarCielo(esNoche, celebrando);
}

botonNoche.addEventListener('click', () => {
  nocheElegida = botonNoche.getAttribute('aria-pressed') !== 'true';
  mostrarCielo(nocheElegida);
});

botonLlamar.addEventListener('click', telefono.llamar);
botonAtender.addEventListener('click', telefono.atender);
botonCerrar.addEventListener('click', () => telefono.cerrar());
botonViento.addEventListener('click', ambiente.activarViento);
botonBirome.addEventListener('click', ambiente.moverBirome);

conectarPuntero({
  canvas: renderer.domElement,
  scene,
  camera,
  ambiente,
  cartel,
  telefono,
  botonMover: document.querySelector('#mover-cartel'),
  activarPlantas() {
    audio.activarPrimerSonido();
    ambiente.activarViento();
  }
});

window.addEventListener('resize', vista.encuadrar);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') telefono.cerrar();
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) return;

  telefono.cerrar();
  audio.silenciarSonido();
});

const reloj = new THREE.Clock();
let tiempo = 0;

function animar() {
  requestAnimationFrame(animar);

  const delta = Math.min(reloj.getDelta(), 0.05);
  tiempo += delta;

  telefono.actualizar(tiempo);
  controls.update();
  const tiempoMusica = audio.tiempoMusica;
  if (celebrando !== (tiempoMusica !== null)) {
    celebrando = tiempoMusica !== null;
    mostrarCielo(celebrando || nocheElegida);
  }
  const noche = vista.actualizarCielo(tiempo);
  ambiente.actualizar(delta, tiempo, noche);
  actualizarFocos(delta, tiempoMusica);
  cartel.actualizar(tiempo);
  renderer.render(scene, camera);
}

animar();
