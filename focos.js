import * as THREE from 'three';

export function crearFocos(scene, camera) {
  const geometria = new THREE.PlaneGeometry(1, 1);
  const movimientoReducido = matchMedia('(prefers-reduced-motion: reduce)');
  const eje = new THREE.Vector3();
  const lateral = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const orientacion = new THREE.Matrix4();
  let intensidad = 0;
  let pulso = 1;
  let compas = 0;

  const focos = [
    ['#ff52a6', -2.6, -4, 3.4],
    ['#8be96c', 0, 0, 4.6],
    ['#61d9ff', 2.6, 4, 3.4]
  ].map(([tono, origenX, destinoX, altura]) => {
    const luz = new THREE.SpotLight(tono, 0, 24, 0.29, 0.85, 1);
    luz.position.set(origenX, 0.12, -3.6);
    const haz = new THREE.Mesh(geometria, new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: { color: { value: luz.color }, opacidad: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform vec3 color;
        uniform float opacidad;
        void main() {
          float ancho = mix(0.035, 0.48, vUv.y);
          float borde = abs(vUv.x - 0.5) / ancho;
          float difusion = 1.0 - smoothstep(0.04, 1.0, borde);
          float extremos = smoothstep(0.0, 0.12, vUv.y) *
            (1.0 - smoothstep(0.63, 1.0, vUv.y));
          gl_FragColor = vec4(color, opacidad * difusion * extremos);
          #include <colorspace_fragment>
        }
      `
    }));
    luz.visible = haz.visible = false;
    scene.add(luz, luz.target, haz);
    return { luz, haz, destinoX, altura };
  });

  return function actualizarFocos(delta, tiempoMusica) {
    const activo = tiempoMusica !== null;
    intensidad = THREE.MathUtils.damp(intensidad, Number(activo), activo ? 5 : 3, delta);
    if (activo) {
      compas = movimientoReducido.matches ? 0 : tiempoMusica * Math.PI * 3.6;
      pulso = 0.83 + 0.17 * Math.cos(compas);
    }

    focos.forEach(({ luz, haz, destinoX, altura }, indice) => {
      luz.visible = haz.visible = intensidad > 0.008;
      if (!haz.visible) return;

      const balanceo = movimientoReducido.matches ? 0 : Math.sin(compas / 4 + indice * 1.9);
      luz.target.position.set(destinoX + balanceo * 0.9, altura + balanceo * 0.32, -10);
      luz.intensity = intensidad * pulso * 18;
      haz.material.uniforms.opacidad.value = intensidad * pulso * 0.34;

      eje.subVectors(luz.target.position, luz.position);
      const largo = eje.length();
      haz.position.copy(luz.position).addScaledVector(eje, 0.5);
      eje.normalize();
      normal.subVectors(camera.position, haz.position);
      lateral.crossVectors(eje, normal);
      if (lateral.lengthSq() < 0.000001) lateral.crossVectors(eje, camera.up);
      lateral.normalize();
      normal.crossVectors(lateral, eje);
      haz.quaternion.setFromRotationMatrix(orientacion.makeBasis(lateral, eje, normal));
      haz.scale.set(largo * 0.43, largo, 1);
    });
  };
}
