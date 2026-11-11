import * as THREE from 'three';
import { gsap } from 'gsap';
import { material, pieza } from './geometria.js';

export function crearAmbiente(scene, estado) {
  const cloudGroup = crearNubes();
  const tableGroup = crearMesa();
  const floor = crearPiso();
  const arcoirisGroup = crearArcoiris();
  const {
    cantidadCopitos, posicionesCopitos, velocidadesCopitos, copitosGeo, copitos
  } = crearCopitos();
  const { plantas, flores, lucesMacetas } = crearPlantas();
  const { birome, moverBirome } = crearBirome();

  scene.add(cloudGroup, tableGroup, floor, arcoirisGroup, copitos, plantas, birome);

  const viento = { fuerza: 0 };
  let rafagaActiva = false;
  function activarViento() {
    if (rafagaActiva) return;
    rafagaActiva = true;
    estado.textContent = 'Las flores mueven los copitos con una ráfaga de viento';
    const tl = gsap.timeline({
      onComplete: () => {
        rafagaActiva = false;
      }
    });
    tl.to(viento, { fuerza: 1, duration: 0.7, ease: 'power2.out' }, 0);
    tl.to(viento, { fuerza: 0, duration: 2.8, ease: 'sine.inOut' }, 1.2);
    flores.forEach((flor, i) => {
      tl.to(flor, { inclinacion: -0.3, duration: 0.8, ease: 'sine.inOut' }, i * 0.08);
      tl.to(flor, { inclinacion: 0, duration: 2.4, ease: 'elastic.out(1,0.4)' }, 1.2 + i * 0.08);
    });
  }

  function actualizar(delta, tiempo, noche) {
    lucesMacetas.forEach((luz, indice) => {
      luz.intensity = 0.3 + 0.05 * Math.sin(tiempo * 1.6 + indice) + noche * 2.1;
    });

    arcoirisGroup.visible = noche < 1;
    for (const franja of arcoirisGroup.children) {
      franja.material.opacity = 1 - noche;
    }

    cloudGroup.children.forEach((nube) => {
      nube.position.x +=
        nube.userData.speed *
        (1 + viento.fuerza * 4) *
        delta;

      nube.position.y =
        nube.userData.altura +
        Math.sin(
          tiempo * 0.7 +
          nube.userData.fase
        ) * 0.08;

      if (nube.position.x > 15) {
        nube.position.x = -15;
      }
    });

    for (let i = 0; i < cantidadCopitos; i++) {
      const indice = i * 3;

      posicionesCopitos[indice] += (
        0.04 +
        Math.sin(tiempo * 0.7 + i) * 0.08 +
        viento.fuerza * 1.6
      ) * delta;

      posicionesCopitos[indice + 1] -=
        velocidadesCopitos[i] * delta;

      if (posicionesCopitos[indice + 1] < -0.2) {
        posicionesCopitos[indice + 1] = 7;
      }

      if (posicionesCopitos[indice] > 7) {
        posicionesCopitos[indice] = -7;
      }

      if (posicionesCopitos[indice] < -7) {
        posicionesCopitos[indice] = 7;
      }
    }

    copitosGeo.attributes.position.needsUpdate = true;

    flores.forEach((f) => {
      f.grupo.rotation.z = Math.sin(tiempo * 1.5 + f.fase) * 0.025 + f.inclinacion;
    });
  }

  return { plantas, birome, tableGroup, floor, activarViento, moverBirome, actualizar };
}

function crearNubes() {
  const cloudGroup = new THREE.Group();

  const cloudMat = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    fog: true
  });

  for (let i = 0; i < 8; i++) {
    const nube = new THREE.Group();
    const cantidad = 3 + Math.floor(Math.random() * 3);

    for (let j = 0; j < cantidad; j++) {
      const radio = 0.4 + Math.random() * 0.5;

      const esfera = new THREE.Mesh(
        new THREE.SphereGeometry(radio, 16, 16),
        cloudMat
      );

      esfera.position.set(
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 0.8,
        Math.random() - 0.5
      );

      nube.add(esfera);
    }

    nube.position.set(
      (Math.random() - 0.5) * 25,
      2 + Math.random() * 3,
      -11 - Math.random() * 4
    );

    nube.userData = {
      speed: 0.18 + Math.random() * 0.3,
      altura: nube.position.y,
      fase: Math.random() * Math.PI * 2
    };

    cloudGroup.add(nube);
  }

  return cloudGroup;
}

function crearMesa() {
  const tableGroup = new THREE.Group();

  const tableMat = new THREE.MeshStandardMaterial({
    color: '#6e6b6d',
    roughness: 0.8,
    metalness: 0.1
  });

  const tableTop = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 1.8, 0.1, 64),
    tableMat
  );

  tableTop.position.y = 1;
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;

  tableGroup.add(tableTop);

  const legGeo = new THREE.CylinderGeometry(
    0.06,
    0.04,
    1,
    32
  );

  const posicionesPatas = [
    [-1.1, -1.1],
    [1.1, -1.1],
    [-1.1, 1.1],
    [1.1, 1.1]
  ];

  posicionesPatas.forEach(([x, z]) => {
    const pata = new THREE.Mesh(legGeo, tableMat);

    pata.position.set(x, 0.5, z);
    pata.castShadow = true;
    pata.receiveShadow = true;

    tableGroup.add(pata);
  });

  return tableGroup;
}

function crearPiso() {
  const materialPiso = new THREE.MeshStandardMaterial({
    color: '#dce8c8',
    roughness: 1
  });
  new THREE.TextureLoader().load(
    new URL('./assets/cespedtextura.jpg', import.meta.url).href,
    (textura) => {
      textura.colorSpace = THREE.SRGBColorSpace;
      textura.wrapS = textura.wrapT = THREE.RepeatWrapping;
      textura.repeat.set(100, 100);
      textura.anisotropy = 4;
      materialPiso.map = textura;
      materialPiso.needsUpdate = true;
    }
  );

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    materialPiso
  );

  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;

  return floor;
}

function crearArcoiris() {
  const arcoirisGroup = new THREE.Group();

  const coloresArcoiris = [
    '#f4b6c2',
    '#f6e2b5',
    '#c3e8bd',
    '#b5dcf6'
  ];

  coloresArcoiris.forEach((color, index) => {
    const tubo = new THREE.Mesh(
      new THREE.TorusGeometry(
        4.5 + index * 0.4,
        0.25,
        32,
        100,
        Math.PI
      ),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        depthWrite: false,
        fog: true
      })
    );

    tubo.position.set(0, 0, -10);
    arcoirisGroup.add(tubo);
  });

  return arcoirisGroup;
}

function crearCopitos() {
  const canvasCopito = document.createElement('canvas');
  canvasCopito.width = 64;
  canvasCopito.height = 64;

  const contexto = canvasCopito.getContext('2d');

  const degradado = contexto.createRadialGradient(
    32, 32, 0,
    32, 32, 30
  );

  degradado.addColorStop(0, 'rgba(255,255,255,1)');
  degradado.addColorStop(0.45, 'rgba(255,255,255,0.95)');
  degradado.addColorStop(0.75, 'rgba(255,255,255,0.4)');
  degradado.addColorStop(1, 'rgba(255,255,255,0)');

  contexto.fillStyle = degradado;
  contexto.fillRect(0, 0, 64, 64);

  const texturaCopito = new THREE.CanvasTexture(canvasCopito);

  const cantidadCopitos = 110;

  const posicionesCopitos = new Float32Array(
    cantidadCopitos * 3
  );

  const velocidadesCopitos = new Float32Array(
    cantidadCopitos
  );

  for (let i = 0; i < cantidadCopitos; i++) {
    posicionesCopitos[i * 3] =
      (Math.random() - 0.5) * 14;

    posicionesCopitos[i * 3 + 1] =
      Math.random() * 7;

    posicionesCopitos[i * 3 + 2] =
      -7 + Math.random() * 9;

    velocidadesCopitos[i] =
      0.12 + Math.random() * 0.18;
  }

  const copitosGeo = new THREE.BufferGeometry();

  copitosGeo.setAttribute(
    'position',
    new THREE.BufferAttribute(posicionesCopitos, 3)
  );

  const copitosMat = new THREE.PointsMaterial({
    map: texturaCopito,
    color: '#ffffff',
    size: 0.12,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    alphaTest: 0.01,
    sizeAttenuation: true,
    fog: true
  });

  const copitos = new THREE.Points(
    copitosGeo,
    copitosMat
  );

  return { cantidadCopitos, posicionesCopitos, velocidadesCopitos, copitosGeo, copitos };
}

function crearPlantas() {
  const crema = material('#fff2dc');
  const rosa = material('#e6a1c3');
  const verde = material('#79ab85');
  const amarillo = material('#efbf5a');
  const esfera = new THREE.SphereGeometry(1, 20, 16);
  const plantas = new THREE.Group();
  const macetaFlores = new THREE.Group();
  const matMaceta = material('#cc85a7');
  pieza(new THREE.CylinderGeometry(0.46, 0.32, 0.56, 40), matMaceta, macetaFlores, 0, 0.28);
  pieza(new THREE.CylinderGeometry(0.49, 0.49, 0.1, 40), matMaceta, macetaFlores, 0, 0.54);
  pieza(new THREE.CylinderGeometry(0.43, 0.43, 0.025, 40), material('#69505c'), macetaFlores, 0, 0.59);
  const macetaHojas = macetaFlores.clone();
  macetaHojas.position.set(2.25, 0, 0.57);
  macetaHojas.scale.setScalar(0.88);
  macetaFlores.position.set(-2.03, 0, 0.5);
  plantas.add(macetaFlores, macetaHojas);
  const flores = [];
  const posicionesFlores = [
    [-0.25, 0, 0.8],
    [0, 0, 1.05],
    [0.25, 0, 0.9],
    [-0.13, 0.2, 0.68],
    [0.17, 0.2, 0.88]
  ];
  posicionesFlores.forEach(([x, z, h], i) => {
    const grupo = new THREE.Group();
    grupo.position.set(x, 0.59, z);
    macetaFlores.add(grupo);
    pieza(new THREE.CylinderGeometry(0.022, 0.027, h, 12), verde, grupo, 0, h / 2);
    [-1, 1].forEach((lado) => {
      const hoja = pieza(esfera, verde, grupo, lado * 0.1, h * (lado < 0 ? 0.35 : 0.6));
      hoja.scale.set(0.14, 0.055, 0.035);
      hoja.rotation.z = lado * 0.5;
    });
    for (let j = 0; j < 6; j++) {
      const a = (j * Math.PI) / 3;
      const petalo = pieza(
        esfera,
        i % 2 ? rosa : crema,
        grupo,
        Math.sin(a) * 0.14,
        h + Math.cos(a) * 0.14
      );
      petalo.scale.set(0.085, 0.15, 0.05);
      petalo.rotation.z = -a;
    }
    pieza(esfera, amarillo, grupo, 0, h, 0.055).scale.set(0.1, 0.1, 0.065);
    flores.push({ grupo, inclinacion: 0, fase: i * 0.8 });
  });
  const verdeClaro = material('#a9c69a');
  [
    [-0.15, 0.12, 0.65, 0.54],
    [-0.07, -0.12, 0.88, 0.24],
    [0.03, 0.04, 1.04, -0.12],
    [0.14, -0.09, 0.94, -0.36],
    [0.18, 0.11, 0.67, -0.62]
  ].forEach(([x, z, largo, angulo], i) => {
    const grupo = new THREE.Group();
    grupo.position.set(x, 0.58, z);
    macetaHojas.add(grupo);
    const hoja = pieza(esfera, i % 2 ? verdeClaro : verde, grupo);
    hoja.rotation.z = angulo;
    hoja.position.set(-Math.sin(angulo) * largo * 0.44, Math.cos(angulo) * largo * 0.44, 0);
    hoja.scale.set(0.13, largo * 0.54, 0.045);
    flores.push({ grupo, inclinacion: 0, fase: i * 0.7 });
  });

  const lucesMacetas = [crearGuirnalda(macetaFlores, 1), crearGuirnalda(macetaHojas, -1)];
  return { plantas, flores, lucesMacetas };
}

function crearGuirnalda(maceta, lado) {
  const puntosCable = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40,
      a = t * Math.PI * 3;
    puntosCable.push(new THREE.Vector3(Math.cos(a) * 0.34, 0.65 + t * 0.7, Math.sin(a) * 0.26));
  }
  const curvaCable = new THREE.CatmullRomCurve3(puntosCable);
  pieza(new THREE.TubeGeometry(curvaCable, 80, 0.009, 6, false), material('#998566'), maceta);
  for (let i = 0; i < 8; i++) {
    const color = i % 2 ? '#ff9cc8' : '#ffe1a0';
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.65,
      roughness: 0.3
    });
    const punto = curvaCable.getPoint(i / 7);
    const luz = pieza(
      new THREE.SphereGeometry(0.045, 12, 12),
      mat,
      maceta,
      punto.x,
      punto.y,
      punto.z
    );
    luz.castShadow = false;
    gsap.to(mat, {
      emissiveIntensity: 1.05,
      duration: 1.8 + i * 0.15,
      delay: i * 0.2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }
  const luzCalida = new THREE.PointLight('#ffdeb0', 0.3, 4, 2);
  luzCalida.position.set(lado * 0.4, 1.35, 0.3);
  maceta.add(luzCalida);
  const luzFloresRosa = new THREE.PointLight('#ff9fc5', 0.15, 2.2, 2);
  luzFloresRosa.position.set(lado * 0.3, 0.9, 0.3);
  maceta.add(luzFloresRosa);
  gsap.to(luzFloresRosa, {
    intensity: 0.25,
    duration: 2.4,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });

  return luzCalida;
}

function crearBirome() {
  const rosa = material('#e6a1c3');
  const birome = new THREE.Group();
  const alturaMesa = 1.105;
  birome.position.set(0.85, alturaMesa, 1.28);
  birome.rotation.y = 0.55;
  const ejeBirome = new THREE.Group();
  ejeBirome.rotation.z = Math.PI / 2;
  birome.add(ejeBirome);
  pieza(new THREE.CylinderGeometry(0.035, 0.035, 0.62, 20), material('#fff9f5', 0.38), ejeBirome);
  pieza(new THREE.CylinderGeometry(0.041, 0.041, 0.18, 20), rosa, ejeBirome, 0, -0.3);
  const punta = pieza(
    new THREE.ConeGeometry(0.034, 0.1, 20),
    material('#b4acb2', 0.35),
    ejeBirome,
    0,
    -0.44
  );
  punta.rotation.z = Math.PI;
  pieza(new THREE.CylinderGeometry(0.03, 0.03, 0.07, 20), rosa, ejeBirome, 0, 0.345);
  pieza(new THREE.BoxGeometry(0.014, 0.18, 0.025), rosa, ejeBirome, 0.025, 0.22, 0.027);
  let biromeActiva = false;
  function moverBirome() {
    if (biromeActiva) return;
    biromeActiva = true;
    gsap
      .timeline({
        onComplete: () => {
          ejeBirome.rotation.y = 0;
          biromeActiva = false;
        }
      })
      .to(birome.position, { y: alturaMesa + 0.24, duration: 0.34, ease: 'power2.out' })
      .to(ejeBirome.rotation, { y: Math.PI * 2, duration: 0.68, ease: 'none' }, 0)
      .to(birome.position, { y: alturaMesa, duration: 0.34, ease: 'bounce.out' }, 0.34);
  }

  return { birome, moverBirome };
}
