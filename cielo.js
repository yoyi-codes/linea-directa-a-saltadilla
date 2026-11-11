import * as THREE from 'three';

export function crearEstrellas(scene) {
  const posiciones = [];
  for (let i = 0; i < 540; i++) {
    const altura = Math.random() * 30 + 0.5;
    const angulo = Math.random() * Math.PI * 2;
    const radio = Math.sqrt(52 ** 2 - altura ** 2);
    posiciones.push(Math.cos(angulo) * radio, altura, Math.sin(angulo) * radio);
  }

  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute('position', new THREE.Float32BufferAttribute(posiciones, 3));
  const uniforms = {
    noche: { value: 0 },
    celebracion: { value: 0 },
    tiempo: { value: 0 },
    escala: { value: 1 }
  };
  const estrellas = new THREE.Points(geometria, new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: `
      uniform float noche;
      uniform float celebracion;
      uniform float tiempo;
      uniform float escala;
      varying float brillo;
      void main() {
        float fase = position.x * 1.7 + position.z * 0.8;
        float pulso = 0.5 + 0.5 * sin(tiempo * (1.4 + 0.7 * sin(fase)) + fase);
        brillo = noche * (0.28 + 0.35 * pulso + celebracion * 0.34);
        gl_PointSize = escala * (2.5 + 3.5 * pulso + celebracion * 2.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying float brillo;
      void main() {
        float distancia = length(gl_PointCoord - 0.5);
        float halo = 1.0 - smoothstep(0.04, 0.5, distancia);
        gl_FragColor = vec4(1.0, 1.0, 1.0, brillo * halo);
      }
    `
  }));
  estrellas.visible = false;
  scene.add(estrellas);

  return function actualizarEstrellas(noche, celebracion, tiempo, escala) {
    estrellas.visible = noche > 0.002;
    uniforms.noche.value = noche;
    uniforms.celebracion.value = celebracion;
    uniforms.tiempo.value = tiempo;
    uniforms.escala.value = escala;
  };
}
