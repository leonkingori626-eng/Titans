/**
 * 3D Procedural Dystopian Battlefield Builder
 * Generates dark industrial strongholds, central Aether reactor crater,
 * ODM grapple vantage points, and atmospheric lighting.
 */
import * as THREE from 'three';
import { INITIAL_MAP_CONFIG } from './constants';

export interface WorldObjects {
  scene: THREE.Scene;
  colliders: THREE.Box3[];
  grappleTargets: THREE.Object3D[];
  aegisPedestalMesh: THREE.Mesh;
  vanguardPedestalMesh: THREE.Mesh;
  aegisCoreMesh: THREE.Mesh;
  vanguardCoreMesh: THREE.Mesh;
  extractionPadMesh: THREE.Mesh;
  titanGroup: THREE.Group;
  vehiclesMap: Map<string, THREE.Group>;
  rainSystem: THREE.Points;
  alarmLights: THREE.PointLight[];
  updateRain: (delta: number) => void;
  updateTitanMesh: (pos: [number, number, number], rot: number, animPhase: number) => void;
  updateVehiclesMesh: (vehicles: any[]) => void;
}

export function buildDystopianWorld(): WorldObjects {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0c10);
  scene.fog = new THREE.FogExp2(0x0c0f16, 0.012);

  const colliders: THREE.Box3[] = [];
  const grappleTargets: THREE.Object3D[] = [];
  const alarmLights: THREE.PointLight[] = [];

  // --- Lighting: Dystopian Mood ---
  const ambientLight = new THREE.AmbientLight(0x222a36, 1.2);
  scene.add(ambientLight);

  const moonLight = new THREE.DirectionalLight(0x4a6582, 1.4);
  moonLight.position.set(50, 120, -40);
  scene.add(moonLight);

  // --- Ground Plane (Blackened wet industrial concrete/metal) ---
  const groundGeo = new THREE.PlaneGeometry(INITIAL_MAP_CONFIG.mapSize + 40, INITIAL_MAP_CONFIG.mapSize + 40, 32, 32);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x11141a,
    roughness: 0.45,
    metalness: 0.75,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Ground collider
  colliders.push(new THREE.Box3(new THREE.Vector3(-150, -2, -150), new THREE.Vector3(150, 0, 150)));

  // Grid lines on ground
  const gridHelper = new THREE.GridHelper(INITIAL_MAP_CONFIG.mapSize, 56, 0x00d2ff, 0x1f2937);
  gridHelper.position.y = 0.02;
  (gridHelper.material as THREE.Material).opacity = 0.2;
  (gridHelper.material as THREE.Material).transparent = true;
  scene.add(gridHelper);

  // --- Procedural Materials ---
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1b1e24,
    metalness: 0.85,
    roughness: 0.35,
  });

  const aegisArmorMat = new THREE.MeshStandardMaterial({
    color: 0x16222f,
    emissive: 0x003355,
    emissiveIntensity: 0.3,
    metalness: 0.9,
    roughness: 0.3,
  });

  const vanguardArmorMat = new THREE.MeshStandardMaterial({
    color: 0x271912,
    emissive: 0x441b00,
    emissiveIntensity: 0.3,
    metalness: 0.85,
    roughness: 0.4,
  });

  const neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x00d2ff });
  const neonOrangeMat = new THREE.MeshBasicMaterial({ color: 0xff5500 });
  const warningYellowMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });

  // Helper to add structural building
  function createStructure(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    isGrappleTarget = true
  ) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + h / 2, z);
    scene.add(mesh);

    const box = new THREE.Box3().setFromObject(mesh);
    colliders.push(box);

    if (isGrappleTarget) {
      grappleTargets.push(mesh);
    }
    return mesh;
  }

  // --- SECTOR 01: AEGIS FORTIFIED BASTION (West) ---
  const aegisX = INITIAL_MAP_CONFIG.aegisStronghold.x;
  // Main fortress keep
  createStructure(aegisX, 0, 0, 36, 18, 50, aegisArmorMat);
  // Upper battlements
  createStructure(aegisX, 18, 0, 24, 8, 36, darkMetalMat);
  // Aegis Defense Towers
  [-24, 24].forEach((zOff) => {
    const tower = createStructure(aegisX + 16, 0, zOff, 10, 28, 10, aegisArmorMat);
    // Cyan beacon on top
    const light = new THREE.PointLight(0x00d2ff, 2.5, 30);
    light.position.set(aegisX + 16, 29, zOff);
    scene.add(light);
    alarmLights.push(light);

    const beacon = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), neonCyanMat);
    beacon.position.set(aegisX + 16, 29, zOff);
    scene.add(beacon);
  });

  // --- SECTOR 04: VANGUARD INDUSTRIAL FOUNDRY (East) ---
  const vanguardX = INITIAL_MAP_CONFIG.vanguardStronghold.x;
  // Main foundry fortress
  createStructure(vanguardX, 0, 0, 36, 18, 50, vanguardArmorMat);
  // Smelting towers / upper scaffolding
  createStructure(vanguardX, 18, 0, 24, 10, 32, darkMetalMat);
  // Vanguard Exhaust Stacks
  [-24, 24].forEach((zOff) => {
    const tower = createStructure(vanguardX - 16, 0, zOff, 10, 28, 10, vanguardArmorMat);
    // Orange beacon on top
    const light = new THREE.PointLight(0xff5500, 2.5, 30);
    light.position.set(vanguardX - 16, 29, zOff);
    scene.add(light);
    alarmLights.push(light);

    const beacon = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), neonOrangeMat);
    beacon.position.set(vanguardX - 16, 29, zOff);
    scene.add(beacon);
  });

  // --- CATWALKS, GANTRY BRIDGES & ODM VANTAGE POSTS ---
  // High catwalk bridges connecting industrial quadrants
  createStructure(-40, 10, 0, 42, 1.5, 8, darkMetalMat);
  createStructure(40, 10, 0, 42, 1.5, 8, darkMetalMat);
  createStructure(0, 12, -45, 12, 1.5, 45, darkMetalMat);

  // Central battlefield sniper towers & blast walls
  const wallPositions = [
    { x: -35, z: 30, w: 20, h: 6, d: 3 },
    { x: -35, z: -30, w: 20, h: 6, d: 3 },
    { x: 35, z: 30, w: 20, h: 6, d: 3 },
    { x: 35, z: -30, w: 20, h: 6, d: 3 },
    { x: 0, z: -40, w: 4, h: 22, d: 4 }, // central spire tower
    { x: -18, z: 0, w: 4, h: 14, d: 4 },
    { x: 18, z: 0, w: 4, h: 14, d: 4 },
  ];

  wallPositions.forEach((wp) => {
    createStructure(wp.x, 0, wp.z, wp.w, wp.h, wp.d, darkMetalMat);
  });

  // Shipping containers / blast barriers for tactical cover
  const containers = [
    { x: -60, z: 18, rot: 0.1, color: 0x2d3748 },
    { x: -62, z: -18, rot: -0.2, color: 0x1e293b },
    { x: 60, z: 18, rot: 0.3, color: 0x475569 },
    { x: 62, z: -18, rot: -0.15, color: 0x334155 },
    { x: -20, z: 45, rot: 0.4, color: 0x222222 },
    { x: 20, z: 45, rot: -0.3, color: 0x222222 },
    { x: 0, z: -25, rot: 0, color: 0x1f2937 },
  ];

  containers.forEach((c) => {
    const geo = new THREE.BoxGeometry(6, 4, 14);
    const mat = new THREE.MeshStandardMaterial({ color: c.color, roughness: 0.6, metalness: 0.5 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(c.x, 2, c.z);
    mesh.rotation.y = c.rot;
    scene.add(mesh);
    colliders.push(new THREE.Box3().setFromObject(mesh));
    grappleTargets.push(mesh);
  });

  // --- CENTRAL AETHER CRATER & WELLHEAD ---
  const craterGeo = new THREE.CylinderGeometry(14, 18, 3, 24);
  const craterMat = new THREE.MeshStandardMaterial({
    color: 0x0d1117,
    roughness: 0.9,
    metalness: 0.2,
  });
  const crater = new THREE.Mesh(craterGeo, craterMat);
  crater.position.set(0, 1.5, 0);
  scene.add(crater);

  // Aether Core Wellhead Reactor glow
  const wellheadLight = new THREE.PointLight(0x00f0ff, 3, 40);
  wellheadLight.position.set(0, 4, 0);
  scene.add(wellheadLight);

  const wellheadCore = new THREE.Mesh(
    new THREE.OctahedronGeometry(2.5, 2),
    new THREE.MeshBasicMaterial({ color: 0x88ffff, wireframe: true })
  );
  wellheadCore.position.set(0, 5, 0);
  scene.add(wellheadCore);

  // --- ENERGY CORE PEDESTALS & CORES ---
  // Aegis Pedestal
  const aegisPedGeo = new THREE.CylinderGeometry(2.2, 3, 1.5, 16);
  const aegisPedMat = new THREE.MeshStandardMaterial({ color: 0x0c253d, metalness: 0.9, roughness: 0.2 });
  const aegisPedestalMesh = new THREE.Mesh(aegisPedGeo, aegisPedMat);
  aegisPedestalMesh.position.set(INITIAL_MAP_CONFIG.aegisCorePedestal.x, 0.75, INITIAL_MAP_CONFIG.aegisCorePedestal.z);
  scene.add(aegisPedestalMesh);

  // Aegis Core (Cyan glowing crystalline sphere)
  const coreGeo = new THREE.IcosahedronGeometry(1.2, 2);
  const aegisCoreMat = new THREE.MeshStandardMaterial({
    color: 0x00d2ff,
    emissive: 0x00d2ff,
    emissiveIntensity: 1.8,
    roughness: 0.1,
    metalness: 0.1,
  });
  const aegisCoreMesh = new THREE.Mesh(coreGeo, aegisCoreMat);
  aegisCoreMesh.position.set(INITIAL_MAP_CONFIG.aegisCorePedestal.x, 2.2, INITIAL_MAP_CONFIG.aegisCorePedestal.z);
  scene.add(aegisCoreMesh);

  // Vanguard Pedestal
  const vanguardPedMat = new THREE.MeshStandardMaterial({ color: 0x3d1a0c, metalness: 0.9, roughness: 0.2 });
  const vanguardPedestalMesh = new THREE.Mesh(aegisPedGeo, vanguardPedMat);
  vanguardPedestalMesh.position.set(INITIAL_MAP_CONFIG.vanguardCorePedestal.x, 0.75, INITIAL_MAP_CONFIG.vanguardCorePedestal.z);
  scene.add(vanguardPedestalMesh);

  // Vanguard Core (Amber glowing crystalline sphere)
  const vanguardCoreMat = new THREE.MeshStandardMaterial({
    color: 0xff5500,
    emissive: 0xff5500,
    emissiveIntensity: 1.8,
    roughness: 0.1,
    metalness: 0.1,
  });
  const vanguardCoreMesh = new THREE.Mesh(coreGeo, vanguardCoreMat);
  vanguardCoreMesh.position.set(INITIAL_MAP_CONFIG.vanguardCorePedestal.x, 2.2, INITIAL_MAP_CONFIG.vanguardCorePedestal.z);
  scene.add(vanguardCoreMesh);

  // --- EXTRACTION HELIPAD LZ (South) ---
  const padGeo = new THREE.CylinderGeometry(14, 15, 1.2, 32);
  const padMat = new THREE.MeshStandardMaterial({
    color: 0x15181f,
    roughness: 0.5,
    metalness: 0.6,
  });
  const extractionPadMesh = new THREE.Mesh(padGeo, padMat);
  extractionPadMesh.position.set(INITIAL_MAP_CONFIG.extractionHelipad.x, 0.6, INITIAL_MAP_CONFIG.extractionHelipad.z);
  scene.add(extractionPadMesh);

  // Holographic boundary ring on extraction pad
  const padRingGeo = new THREE.RingGeometry(12, 13, 32);
  const padRingMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, side: THREE.DoubleSide });
  const padRing = new THREE.Mesh(padRingGeo, padRingMat);
  padRing.rotation.x = -Math.PI / 2;
  padRing.position.set(INITIAL_MAP_CONFIG.extractionHelipad.x, 1.25, INITIAL_MAP_CONFIG.extractionHelipad.z);
  scene.add(padRing);

  // --- THE GOLIATH PROTO-TITAN (Attack on Titan Inspired Biomechanical War Colossus) ---
  const titanGroup = new THREE.Group();
  titanGroup.position.set(INITIAL_MAP_CONFIG.titanSpawn.x, 0, INITIAL_MAP_CONFIG.titanSpawn.z);

  // Massive torso & spine
  const titanTorsoGeo = new THREE.BoxGeometry(6, 12, 5);
  const titanArmorMat = new THREE.MeshStandardMaterial({
    color: 0x1a1c20,
    roughness: 0.5,
    metalness: 0.8,
  });
  const titanTorso = new THREE.Mesh(titanTorsoGeo, titanArmorMat);
  titanTorso.position.y = 14;
  titanGroup.add(titanTorso);

  // Nape / Vulnerable Reactor Vent (Glowing weakpoint on neck)
  const napeGeo = new THREE.BoxGeometry(2, 3, 1.5);
  const napeMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
  const napeMesh = new THREE.Mesh(napeGeo, napeMat);
  napeMesh.position.set(0, 18, -2.6);
  titanGroup.add(napeMesh);

  // Head / Skull with dual glowing optics
  const titanHeadGeo = new THREE.BoxGeometry(3.5, 4, 3.5);
  const titanHead = new THREE.Mesh(titanHeadGeo, titanArmorMat);
  titanHead.position.set(0, 21.5, 0.5);
  titanGroup.add(titanHead);

  const titanEyeGeo = new THREE.BoxGeometry(0.8, 0.4, 0.5);
  const titanEyeMat = new THREE.MeshBasicMaterial({ color: 0xff1100 });
  const leftEye = new THREE.Mesh(titanEyeGeo, titanEyeMat);
  leftEye.position.set(-1, 21.6, 2.3);
  const rightEye = new THREE.Mesh(titanEyeGeo, titanEyeMat);
  rightEye.position.set(1, 21.6, 2.3);
  titanGroup.add(leftEye);
  titanGroup.add(rightEye);

  // Massive arms with hydraulic pistons
  const titanArmGeo = new THREE.BoxGeometry(2.5, 11, 2.5);
  const leftArm = new THREE.Mesh(titanArmGeo, titanArmorMat);
  leftArm.position.set(-5, 12, 0);
  const rightArm = new THREE.Mesh(titanArmGeo, titanArmorMat);
  rightArm.position.set(5, 12, 0);
  titanGroup.add(leftArm);
  titanGroup.add(rightArm);

  // Massive pillar legs
  const titanLegGeo = new THREE.BoxGeometry(3, 11, 3);
  const leftLeg = new THREE.Mesh(titanLegGeo, titanArmorMat);
  leftLeg.position.set(-2.2, 5.5, 0);
  const rightLeg = new THREE.Mesh(titanLegGeo, titanArmorMat);
  rightLeg.position.set(2.2, 5.5, 0);
  titanGroup.add(leftLeg);
  titanGroup.add(rightLeg);

  // Shoulder grapples: players can hook wire directly onto Titan!
  grappleTargets.push(titanTorso);
  grappleTargets.push(titanHead);

  scene.add(titanGroup);

  // --- VEHICLES: Ground APCs & VTOL Dropship ---
  const vehiclesMap = new Map<string, THREE.Group>();

  function createApcMesh(faction: 'AEGIS' | 'VANGUARD'): THREE.Group {
    const group = new THREE.Group();
    const hullMat = faction === 'AEGIS' ? aegisArmorMat : vanguardArmorMat;
    const trimMat = faction === 'AEGIS' ? neonCyanMat : neonOrangeMat;

    // Chassis
    const chassisGeo = new THREE.BoxGeometry(5.2, 2.2, 8.5);
    const chassis = new THREE.Mesh(chassisGeo, hullMat);
    chassis.position.y = 1.6;
    group.add(chassis);

    // Cab
    const cabGeo = new THREE.BoxGeometry(4.2, 1.4, 4.5);
    const cab = new THREE.Mesh(cabGeo, darkMetalMat);
    cab.position.set(0, 3.1, -0.6);
    group.add(cab);

    // Turret
    const turretGeo = new THREE.CylinderGeometry(1.2, 1.4, 1.2, 12);
    const turret = new THREE.Mesh(turretGeo, hullMat);
    turret.position.set(0, 4.2, -0.4);
    group.add(turret);

    // Twin Autocannon barrels
    const barrelGeo = new THREE.CylinderGeometry(0.2, 0.2, 3.5, 8);
    const b1 = new THREE.Mesh(barrelGeo, darkMetalMat);
    b1.rotation.x = Math.PI / 2;
    b1.position.set(-0.5, 4.2, 2);
    const b2 = new THREE.Mesh(barrelGeo, darkMetalMat);
    b2.rotation.x = Math.PI / 2;
    b2.position.set(0.5, 4.2, 2);
    group.add(b1);
    group.add(b2);

    // Wheels (6 heavy military tires)
    const wheelGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.8, 16);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
    const wheelPositions = [
      [-2.8, 1.1, -2.8],
      [2.8, 1.1, -2.8],
      [-2.8, 1.1, 0],
      [2.8, 1.1, 0],
      [-2.8, 1.1, 2.8],
      [2.8, 1.1, 2.8],
    ];
    wheelPositions.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, tireMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, wy, wz);
      group.add(wheel);
    });

    // Light trim
    const lightBar = new THREE.Mesh(new THREE.BoxGeometry(3, 0.3, 0.3), trimMat);
    lightBar.position.set(0, 2.5, 4.3);
    group.add(lightBar);

    grappleTargets.push(chassis);
    return group;
  }

  function createVtolDropshipMesh(): THREE.Group {
    const group = new THREE.Group();
    // Fuselage
    const fuseGeo = new THREE.BoxGeometry(6, 4, 16);
    const fuse = new THREE.Mesh(fuseGeo, darkMetalMat);
    group.add(fuse);

    // Dual Tilt-Rotors / Wings
    const wingGeo = new THREE.BoxGeometry(22, 0.6, 3.5);
    const wings = new THREE.Mesh(wingGeo, aegisArmorMat);
    wings.position.set(0, 1.5, 0);
    group.add(wings);

    // Turbines
    const turbineGeo = new THREE.CylinderGeometry(2.4, 2.4, 1.5, 16);
    const t1 = new THREE.Mesh(turbineGeo, neonCyanMat);
    t1.position.set(-11, 2, 0);
    const t2 = new THREE.Mesh(turbineGeo, neonCyanMat);
    t2.position.set(11, 2, 0);
    group.add(t1);
    group.add(t2);

    grappleTargets.push(fuse);
    return group;
  }

  const apcAegis = createApcMesh('AEGIS');
  apcAegis.position.set(INITIAL_MAP_CONFIG.aegisVehicleSpawn.x, 0, INITIAL_MAP_CONFIG.aegisVehicleSpawn.z);
  scene.add(apcAegis);
  vehiclesMap.set('apc_aegis', apcAegis);

  const apcVanguard = createApcMesh('VANGUARD');
  apcVanguard.position.set(INITIAL_MAP_CONFIG.vanguardVehicleSpawn.x, 0, INITIAL_MAP_CONFIG.vanguardVehicleSpawn.z);
  scene.add(apcVanguard);
  vehiclesMap.set('apc_vanguard', apcVanguard);

  const vtolDropship = createVtolDropshipMesh();
  vtolDropship.position.set(INITIAL_MAP_CONFIG.vtolDropshipSpawn.x, INITIAL_MAP_CONFIG.vtolDropshipSpawn.y, INITIAL_MAP_CONFIG.vtolDropshipSpawn.z);
  scene.add(vtolDropship);
  vehiclesMap.set('vtol_extraction', vtolDropship);

  // --- DYNAMIC WEATHER: RAIN PARTICLES ---
  const rainCount = 1800;
  const rainGeo = new THREE.BufferGeometry();
  const rainPos = new Float32Array(rainCount * 3);

  for (let i = 0; i < rainCount; i++) {
    rainPos[i * 3] = (Math.random() - 0.5) * 260;
    rainPos[i * 3 + 1] = Math.random() * 80;
    rainPos[i * 3 + 2] = (Math.random() - 0.5) * 260;
  }

  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rainMat = new THREE.PointsMaterial({
    color: 0x6e88a3,
    size: 0.35,
    transparent: true,
    opacity: 0.6,
  });
  const rainSystem = new THREE.Points(rainGeo, rainMat);
  scene.add(rainSystem);

  const updateRain = (delta: number) => {
    const pos = rainGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < rainCount; i++) {
      pos[i * 3 + 1] -= delta * 75; // falling speed
      if (pos[i * 3 + 1] < 0) {
        pos[i * 3 + 1] = 75;
      }
    }
    rainGeo.attributes.position.needsUpdate = true;
  };

  const updateTitanMesh = (pos: [number, number, number], rot: number, animPhase: number) => {
    titanGroup.position.set(pos[0], pos[1], pos[2]);
    titanGroup.rotation.y = rot;

    // Heavy biological walking stride
    leftLeg.rotation.x = Math.sin(animPhase * 3) * 0.35;
    rightLeg.rotation.x = -Math.sin(animPhase * 3) * 0.35;
    leftArm.rotation.x = -Math.sin(animPhase * 3) * 0.25;
    rightArm.rotation.x = Math.sin(animPhase * 3) * 0.25;
  };

  const updateVehiclesMesh = (vehicles: any[]) => {
    vehicles.forEach((v) => {
      const g = vehiclesMap.get(v.id);
      if (g) {
        g.position.set(v.position[0], v.position[1], v.position[2]);
        g.rotation.set(v.rotation[0], v.rotation[1], v.rotation[2]);
      }
    });
  };

  return {
    scene,
    colliders,
    grappleTargets,
    aegisPedestalMesh,
    vanguardPedestalMesh,
    aegisCoreMesh,
    vanguardCoreMesh,
    extractionPadMesh,
    titanGroup,
    vehiclesMap,
    rainSystem,
    alarmLights,
    updateRain,
    updateTitanMesh,
    updateVehiclesMesh,
  };
}
