import * as THREE from 'three';

export function material(color, roughness = 0.7) {
  return new THREE.MeshStandardMaterial({ color, roughness });
}
export function pieza(geo, mat, grupo, x = 0, y = 0, z = 0) {
  const objeto = new THREE.Mesh(geo, mat);
  objeto.position.set(x, y, z);
  objeto.castShadow = true;
  objeto.receiveShadow = true;
  grupo.add(objeto);
  return objeto;
}
