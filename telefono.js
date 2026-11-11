import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function crearTelefono(scene, botones, estado, audio, cartel) {
  const luzNariz = new THREE.PointLight(
    '#ff0020',
    0,
    2.4,
    2
  );

  scene.add(luzNariz);

  let modeloTelefono = null;
  let nariz = null;
  let estadoLlamada = 'reposo';
  const { botonLlamar, botonAtender, botonCerrar, botonBirome } = botones;

  function actualizarControles() {
    botonLlamar.disabled = !modeloTelefono || estadoLlamada !== 'reposo';
    botonAtender.disabled = estadoLlamada !== 'llamando';
    botonCerrar.disabled = estadoLlamada === 'reposo';
    botonBirome.disabled = estadoLlamada !== 'reposo';
    cartel.dibujar(estadoLlamada);
  }

  function llamar() {
    if (!modeloTelefono || estadoLlamada !== 'reposo') return;

    audio.activarPrimerSonido();
    estadoLlamada = 'llamando';
    estado.textContent = 'Saltadilla está llamando. Tocá Atender en el cartel.';
    actualizarControles();
    cartel.animar();
    audio.reproducirTimbre();
  }

  function atender() {
    if (estadoLlamada !== 'llamando') return;

    audio.detenerTimbre();
    modeloTelefono.rotation.z = 0;
    estadoLlamada = 'atendida';
    audio.iniciarMusica();
    estado.textContent = 'Mensaje recibido. Las chicas van en camino.';
    actualizarControles();
    cartel.animar();
  }

  function cerrar() {
    if (estadoLlamada === 'reposo') return;

    audio.detenerTimbre();
    audio.detenerMusica();
    modeloTelefono.rotation.z = 0;
    estadoLlamada = 'reposo';
    estado.textContent = 'Llamada finalizada';
    actualizarControles();
  }

  actualizarControles();

  const loader = new GLTFLoader();

  loader.load(
    new URL(
      './assets/powerpuff_girls_phone.glb',
      import.meta.url
    ).href,

    (gltf) => {
      modeloTelefono = gltf.scene;

      const sueloOriginal =
        modeloTelefono.getObjectByName('ground_msh');

      if (sueloOriginal) {
        sueloOriginal.removeFromParent();
      }

      modeloTelefono.rotation.set(0, 0, 0);

      let box = new THREE.Box3().setFromObject(
        modeloTelefono
      );

      const size = box.getSize(new THREE.Vector3());

      modeloTelefono.scale.setScalar(
        2.85 / Math.max(size.x, size.y, size.z)
      );

      box = new THREE.Box3().setFromObject(
        modeloTelefono
      );

      const center = box.getCenter(
        new THREE.Vector3()
      );

      modeloTelefono.position.set(
        -center.x,
        1.05 - box.min.y,
        -center.z
      );

      modeloTelefono.traverse((child) => {
        if (!child.isMesh) return;

        child.castShadow = true;
        child.receiveShadow = true;

        const materiales = Array.isArray(child.material)
          ? child.material
          : [child.material];

        materiales.forEach((material) => {
          if (material.emissive) {
            material.emissiveIntensity = 0;
          }

          if ('roughness' in material) {
            material.roughness = Math.max(
              material.roughness,
              0.32
            );
          }
        });
      });

      nariz = modeloTelefono.getObjectByName(
        'nose_msh_nose_0'
      );

      if (nariz && nariz.material?.emissive) {
        nariz.material = nariz.material.clone();
        nariz.material.emissive.set('#ff0016');
      } else {
        nariz = null;
      }

      scene.add(modeloTelefono);

      botonLlamar.disabled = false;
      estado.textContent = 'Teléfono listo para interactuar';
    },

    undefined,

    () => {
      estado.textContent =
        'No se pudo cargar el archivo GLB';
    }
  );

  function actualizar(tiempo) {
    const llamando = estadoLlamada === 'llamando';
    if (modeloTelefono) {
      modeloTelefono.rotation.z = llamando
        ? Math.sin(tiempo * 60) * 0.025
        : 0;
    }

    if (nariz) {
      const pulso =
        0.5 +
        0.5 * Math.sin(
          tiempo * (llamando ? 18 : 3)
        );

      nariz.material.emissiveIntensity =
        0.08 +
        pulso * (llamando ? 0.85 : 0.5);

      nariz.getWorldPosition(luzNariz.position);
      luzNariz.position.z += 0.6;

      luzNariz.intensity =
        0.05 +
        pulso * (llamando ? 0.7 : 0.4);
    }
  }

  return {
    get modelo() { return modeloTelefono; },
    get estado() { return estadoLlamada; },
    llamar,
    atender,
    cerrar,
    actualizar
  };
}
