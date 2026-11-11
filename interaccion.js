import * as THREE from 'three';

export function conectarPuntero({
  canvas, scene, camera, ambiente, cartel, telefono, botonMover, activarPlantas
}) {
  const { plantas, birome, tableGroup, floor } = ambiente;
  const raycaster = new THREE.Raycaster();
  const puntero = new THREE.Vector2();

  function detectarObjeto(event) {
    const rect = canvas.getBoundingClientRect();

    puntero.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);

    raycaster.setFromCamera(puntero, camera);

    const objetos = [cartel.grupo, plantas, birome, tableGroup, floor];
    const modeloTelefono = telefono.modelo;
    if (modeloTelefono) objetos.push(modeloTelefono);

    const impacto = raycaster.intersectObjects(objetos, true)[0];
    if (!impacto) return null;

    if (impacto.object === cartel.cara && impacto.uv) {
      const { x, y } = impacto.uv;
      if (telefono.estado !== 'reposo' && x > 0.89 && y > 0.88) return 'cerrar';
      if (x > 0.19 && x < 0.81 && y > 0.09 && y < 0.27) {
        if (telefono.estado === 'llamando') return 'atender';
        if (telefono.estado === 'atendida') return 'cerrar';
        if (modeloTelefono) return 'telefono';
      }
      return 'cartel';
    }

    let objeto = impacto.object;
    while (objeto) {
      if (objeto === cartel.grupo) return 'cartel';
      if (telefono.estado === 'reposo') {
        if (objeto === plantas) return 'plantas';
        if (objeto === birome) return 'birome';
        if (objeto === modeloTelefono) return 'telefono';
      }

      objeto = objeto.parent;
    }

    return null;
  }

  const pulsaciones = new Map();
  let gestoMultiple = false;
  let arrastre;

  const flechas = new Map([
    ['ArrowLeft', [-0.035, 0]], ['ArrowRight', [0.035, 0]],
    ['ArrowUp', [0, -0.035]], ['ArrowDown', [0, 0.035]]
  ]);
  botonMover.addEventListener('keydown', (event) => {
    const movimiento = flechas.get(event.key);
    if (!movimiento) return;
    event.preventDefault();
    cartel.mover(...movimiento);
  });

  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || pulsaciones.size || detectarObjeto(event) !== 'cartel') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (arrastre) return;

    arrastre = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = 'grabbing';
  }, { capture: true });

  canvas.addEventListener('lostpointercapture', (event) => {
    if (arrastre?.id !== event.pointerId) return;
    arrastre = null;
    canvas.style.cursor = 'grab';
  });

  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;

    if (pulsaciones.size === 0) {
      gestoMultiple = false;
    }

    pulsaciones.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      movido: false
    });

    if (pulsaciones.size > 1) {
      gestoMultiple = true;
    }
  });

  canvas.addEventListener('pointermove', (event) => {
    if (arrastre?.id === event.pointerId) {
      const { width, height } = canvas.getBoundingClientRect();
      cartel.mover((event.clientX - arrastre.x) / width, (event.clientY - arrastre.y) / height);
      arrastre.x = event.clientX;
      arrastre.y = event.clientY;
      return;
    }

    const inicio = pulsaciones.get(event.pointerId);

    if (
      inicio &&
      Math.hypot(
        event.clientX - inicio.x,
        event.clientY - inicio.y
      ) > 6
    ) {
      inicio.movido = true;
    }

    if (
      event.pointerType === 'mouse' &&
      !event.buttons
    ) {
      const objeto = detectarObjeto(event);
      canvas.style.cursor = objeto && objeto !== 'cartel' ? 'pointer' : 'grab';
    }
  });

  canvas.addEventListener('pointerup', (event) => {
    const inicio = pulsaciones.get(event.pointerId);

    pulsaciones.delete(event.pointerId);

    if (
      !inicio ||
      inicio.movido ||
      gestoMultiple
    ) {
      return;
    }

    const distancia = Math.hypot(
      event.clientX - inicio.x,
      event.clientY - inicio.y
    );

    if (distancia > 6) return;

    const objeto = detectarObjeto(event);

    if (objeto === 'telefono') telefono.llamar();
    if (objeto === 'atender') telefono.atender();
    if (objeto === 'cerrar') telefono.cerrar();
    if (objeto === 'plantas') activarPlantas();
    if (objeto === 'birome') ambiente.moverBirome();
  });

  canvas.addEventListener('pointercancel', (event) => {
    pulsaciones.delete(event.pointerId);
  });

  window.addEventListener('pointerup', (event) => {
    pulsaciones.delete(event.pointerId);
  });

  window.addEventListener('blur', () => {
    pulsaciones.clear();
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;

    pulsaciones.clear();
  });
}
