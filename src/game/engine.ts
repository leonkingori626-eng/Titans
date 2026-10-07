/**
 * PROJECT: AETHER - Complete 3D Tactical Shooter Engine
 * Features:
 * - 1st Person and 3rd Person camera modes
 * - ODM-style Wire Grapple propulsion & swinging
 * - Biomechanical Goliath Titan combat
 * - Energy Core & VIP Infiltration/Extraction
 * - Operable Ground APCs & VTOL Dropships
 * - Neural Recall Revive system
 * - Cross-device controls (PC mouse/WASD & Mobile dual virtual touchpads)
 */
import * as THREE from 'three';
import { CameraViewMode, FactionId, MatchState, PlayerState, Projectile, VehicleState } from '../types/game';
import { buildDystopianWorld, WorldObjects } from './worldBuilder';
import { WEAPONS_PRIMARY, WEAPONS_SECONDARY, GADGETS_SLOT1, GADGETS_SLOT2, ABILITIES, INITIAL_MAP_CONFIG } from './constants';
import { soundEngine } from '../audio/soundEngine';
import { NetworkManager } from './networking';

export interface EngineCallbacks {
  onMatchStateUpdate: (state: MatchState) => void;
  onLocalPlayerUpdate: (player: PlayerState) => void;
  onLoudspeakerAnnouncement: (msg: string) => void;
  onHitmarker: (headshot: boolean) => void;
}

export class GameEngine {
  public container: HTMLElement;
  public renderer: THREE.WebGLRenderer;
  public camera: THREE.PerspectiveCamera;
  public world: WorldObjects;
  public network: NetworkManager;
  public callbacks: EngineCallbacks;

  // View mode
  public cameraMode: CameraViewMode = 'FIRST_PERSON';
  private cameraPitch = 0;
  private cameraYaw = 0;
  private cameraDistance = 4.2;

  // Player representation
  private localPlayerMesh: THREE.Group;
  private weaponViewModel: THREE.Group;
  private remotePlayerMeshes: Map<string, THREE.Group> = new Map();
  private odmCableLine: THREE.Line | null = null;
  private projectiles: Projectile[] = [];
  private projectileMeshes: THREE.Mesh[] = [];

  // Keys & Input
  private keys: Record<string, boolean> = {};
  private isPointerLocked = false;
  private isShooting = false;
  private isAimingDownSights = false;
  private lastFireTime = 0;

  // Mobile virtual joystick input
  public touchMoveDelta = { x: 0, y: 0 };
  public touchAimDelta = { x: 0, y: 0 };
  public isTouchShooting = false;

  // Recall channeling
  public recallTargetId: string | null = null;
  public recallProgressSec = 0;

  // Animation frame & Clock
  private clock = new THREE.Clock();
  private animationFrameId: number | null = null;
  private titanAnimPhase = 0;

  constructor(container: HTMLElement, network: NetworkManager, callbacks: EngineCallbacks) {
    this.container = container;
    this.network = network;
    this.callbacks = callbacks;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    // Camera
    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 500);

    // Build World
    this.world = buildDystopianWorld();

    // Local Player Mesh (used in 3rd person and for shadow)
    this.localPlayerMesh = this.createSoldierMesh(this.network.faction);
    this.world.scene.add(this.localPlayerMesh);

    // 1st Person Weapon View Model
    this.weaponViewModel = this.createWeaponViewModel();
    this.camera.add(this.weaponViewModel);
    this.world.scene.add(this.camera);

    // Setup input listeners
    this.initInputListeners();

    // Resize listener
    window.addEventListener('resize', this.onWindowResize);

    // Start Loop
    this.animate();
  }

  // --- Soldier 3D Model Generator ---
  private createSoldierMesh(faction: FactionId): THREE.Group {
    const group = new THREE.Group();
    const isAegis = faction === 'AEGIS';

    const armorMat = new THREE.MeshStandardMaterial({
      color: isAegis ? 0x1b2838 : 0x2b1d16,
      metalness: 0.8,
      roughness: 0.35,
    });
    const glowMat = new THREE.MeshBasicMaterial({
      color: isAegis ? 0x00d2ff : 0xff5500,
    });

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.8, 1.1, 0.45);
    const torso = new THREE.Mesh(torsoGeo, armorMat);
    torso.position.y = 1.05;
    group.add(torso);

    // Head / Tactical Helmet
    const headGeo = new THREE.BoxGeometry(0.45, 0.5, 0.5);
    const head = new THREE.Mesh(headGeo, armorMat);
    head.position.y = 1.85;
    group.add(head);

    // Glowing Visor / Optics
    const visorGeo = new THREE.BoxGeometry(0.35, 0.14, 0.1);
    const visor = new THREE.Mesh(visorGeo, glowMat);
    visor.position.set(0, 1.85, 0.26);
    group.add(visor);

    // ODM Gear Harness Winch on hips
    const odmPackGeo = new THREE.BoxGeometry(0.3, 0.25, 0.6);
    const leftOdm = new THREE.Mesh(odmPackGeo, armorMat);
    leftOdm.position.set(-0.48, 0.75, 0);
    const rightOdm = new THREE.Mesh(odmPackGeo, armorMat);
    rightOdm.position.set(0.48, 0.75, 0);
    group.add(leftOdm);
    group.add(rightOdm);

    // Aether Reactor Core Harness on back (lights up if carrying core)
    const corePackGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 8);
    const corePack = new THREE.Mesh(corePackGeo, glowMat);
    corePack.position.set(0, 1.1, -0.3);
    corePack.name = 'coreCarrierPack';
    corePack.visible = false;
    group.add(corePack);

    // Limbs
    const limbMat = new THREE.MeshStandardMaterial({ color: 0x181a1f, roughness: 0.6 });
    const armGeo = new THREE.BoxGeometry(0.26, 0.8, 0.26);
    const leftArm = new THREE.Mesh(armGeo, limbMat);
    leftArm.position.set(-0.55, 1.0, 0);
    const rightArm = new THREE.Mesh(armGeo, limbMat);
    rightArm.position.set(0.55, 1.0, 0);
    group.add(leftArm);
    group.add(rightArm);

    const legGeo = new THREE.BoxGeometry(0.3, 0.95, 0.3);
    const leftLeg = new THREE.Mesh(legGeo, limbMat);
    leftLeg.position.set(-0.25, 0.45, 0);
    const rightLeg = new THREE.Mesh(legGeo, limbMat);
    rightLeg.position.set(0.25, 0.45, 0);
    group.add(leftLeg);
    group.add(rightLeg);

    return group;
  }

  // --- 1st Person Weapon Viewmodel ---
  private createWeaponViewModel(): THREE.Group {
    const group = new THREE.Group();
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x1f242d, metalness: 0.9, roughness: 0.2 });
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x0f1115, metalness: 0.95 });

    // Gun body
    const bodyGeo = new THREE.BoxGeometry(0.12, 0.18, 0.75);
    const body = new THREE.Mesh(bodyGeo, gunMat);
    body.position.set(0.28, -0.25, -0.55);
    group.add(body);

    // Barrel
    const barrelGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8);
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0.28, -0.22, -0.95);
    group.add(barrel);

    // Holographic Sight
    const sightGeo = new THREE.BoxGeometry(0.06, 0.08, 0.1);
    const sightMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true });
    const sight = new THREE.Mesh(sightGeo, sightMat);
    sight.position.set(0.28, -0.12, -0.5);
    group.add(sight);

    return group;
  }

  // --- Input Setup ---
  private initInputListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Toggle 1st / 3rd Person View (Key: V)
      if (e.code === 'KeyV') {
        this.toggleCameraMode();
      }

      // Reload (Key: R)
      if (e.code === 'KeyR') {
        this.startReload();
      }

      // Switch Weapon (Key: 1, 2, or Q)
      if (e.code === 'Digit1') this.switchWeaponSlot('primary');
      if (e.code === 'Digit2') this.switchWeaponSlot('secondary');
      if (e.code === 'KeyQ') this.switchWeaponSlot();

      // Grapple / ODM Wire launch (Key: Space while aiming at structure or Key: E)
      if (e.code === 'KeyE') {
        this.triggerOdmGrapple();
      }

      // Interact / Recall / Vehicle Mount (Key: F)
      if (e.code === 'KeyF') {
        this.triggerInteractOrRecall();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Pointer Lock on Canvas Click
    this.renderer.domElement.addEventListener('click', () => {
      if (!this.isPointerLocked && document.pointerLockElement !== this.renderer.domElement) {
        try {
          this.renderer.domElement.requestPointerLock();
        } catch {
          // ignore
        }
      }
      soundEngine.init();
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
    });

    // Mouse Look
    window.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked) {
        const sens = 0.0022;
        this.cameraYaw -= e.movementX * sens;
        this.cameraPitch -= e.movementY * sens;
        this.cameraPitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.cameraPitch));
      }
    });

    // Mouse Click Fire & Scope
    window.addEventListener('mousedown', (e) => {
      soundEngine.init();
      if (e.button === 0) {
        this.isShooting = true;
      } else if (e.button === 2) {
        this.isAimingDownSights = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isShooting = false;
      } else if (e.button === 2) {
        this.isAimingDownSights = false;
      }
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  public toggleCameraMode() {
    this.cameraMode = this.cameraMode === 'FIRST_PERSON' ? 'THIRD_PERSON' : 'FIRST_PERSON';
    this.weaponViewModel.visible = this.cameraMode === 'FIRST_PERSON';
    this.localPlayerMesh.visible = this.cameraMode === 'THIRD_PERSON';
  }

  // --- Main Game Loop ---
  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);
    this.titanAnimPhase += delta;

    this.updateLocalPlayer(delta);
    this.updateProjectiles(delta);
    this.updateTitanAi(delta);
    this.updateBotsAi(delta);
    this.updateObjectives(delta);
    this.updateCamera(delta);

    // Weather & Animations
    this.world.updateRain(delta);
    if (this.network.currentRoom.titan) {
      this.world.updateTitanMesh(
        this.network.currentRoom.titan.position,
        this.network.currentRoom.titan.rotation,
        this.titanAnimPhase
      );
    }
    this.world.updateVehiclesMesh(this.network.currentRoom.vehicles);

    // Render
    this.renderer.render(this.world.scene, this.camera);
  };

  // --- Local Player Physics & Input Processing ---
  private updateLocalPlayer(delta: number) {
    const player = this.network.currentRoom.players[this.network.playerId];
    if (!player) return;

    if (player.isDowned) {
      player.downedTimer = Math.max(0, player.downedTimer - delta);
      if (player.downedTimer <= 0) {
        // Bleedout -> Respawn at base
        this.respawnPlayer(player);
      }
      return;
    }

    // Touch Delta Aiming
    if (this.touchAimDelta.x !== 0 || this.touchAimDelta.y !== 0) {
      this.cameraYaw -= this.touchAimDelta.x * delta * 2.5;
      this.cameraPitch -= this.touchAimDelta.y * delta * 2.5;
      this.cameraPitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.cameraPitch));
      this.touchAimDelta.x = 0;
      this.touchAimDelta.y = 0;
    }

    // Movement Vectors
    let moveForward = 0;
    let moveRight = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveForward += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveForward -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveRight += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveRight -= 1;

    // Mobile virtual touch movement
    if (this.touchMoveDelta.x !== 0 || this.touchMoveDelta.y !== 0) {
      moveRight += this.touchMoveDelta.x;
      moveForward += this.touchMoveDelta.y;
    }

    const moveSpeed = player.isCarryingCore ? 9.5 : 13.0;
    const forwardVec = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw));
    const rightVec = new THREE.Vector3(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw));

    const desiredMove = new THREE.Vector3()
      .addScaledVector(forwardVec, moveForward)
      .addScaledVector(rightVec, moveRight);

    if (desiredMove.lengthSq() > 0.001) {
      desiredMove.normalize().multiplyScalar(moveSpeed);
      player.velocity[0] = desiredMove.x;
      player.velocity[2] = desiredMove.z;
    } else {
      player.velocity[0] *= 0.85;
      player.velocity[2] *= 0.85;
    }

    // Jump (Space key)
    if (this.keys['Space'] && player.position[1] <= 1.55 && !player.odmHookActive) {
      player.velocity[1] = 9.5;
    }

    // Gravity
    if (player.position[1] > 1.5 && !player.odmHookActive) {
      player.velocity[1] -= 22 * delta;
    }

    // --- ODM WIRE PROPULSION PHYSICS ---
    if (player.odmHookActive && player.odmHookTarget) {
      const targetPos = new THREE.Vector3(...player.odmHookTarget);
      const currentPos = new THREE.Vector3(...player.position);
      const dirToTarget = new THREE.Vector3().subVectors(targetPos, currentPos);
      const dist = dirToTarget.length();

      if (dist > 3.0) {
        dirToTarget.normalize();
        const pullSpeed = 34.0; // Rapid high-speed winch
        player.velocity[0] = dirToTarget.x * pullSpeed;
        player.velocity[1] = dirToTarget.y * pullSpeed;
        player.velocity[2] = dirToTarget.z * pullSpeed;

        // Render Glowing ODM Cable Line
        this.renderOdmCable(currentPos, targetPos);
      } else {
        // Reached destination -> Release hook with boost jump
        player.odmHookActive = false;
        player.velocity[1] = 12.0; // boost leap off structure
        this.clearOdmCable();
      }
    } else {
      this.clearOdmCable();
    }

    // Apply Velocity
    player.position[0] += player.velocity[0] * delta;
    player.position[1] += player.velocity[1] * delta;
    player.position[2] += player.velocity[2] * delta;

    // Floor clamp
    if (player.position[1] < 1.5) {
      player.position[1] = 1.5;
      player.velocity[1] = 0;
    }

    // Player Rotation
    player.rotation[1] = this.cameraYaw;

    // Update Local 3D Mesh
    this.localPlayerMesh.position.set(player.position[0], player.position[1] - 0.75, player.position[2]);
    this.localPlayerMesh.rotation.y = this.cameraYaw;

    // Core carrier visual
    const corePack = this.localPlayerMesh.getObjectByName('coreCarrierPack');
    if (corePack) {
      corePack.visible = player.isCarryingCore;
    }

    // Weapon Firing
    if ((this.isShooting || this.isTouchShooting) && !player.isReloading) {
      this.attemptFireWeapon(player);
    }

    // Reload Progress
    if (player.isReloading) {
      player.reloadProgress += delta;
      if (player.reloadProgress >= 2.0) {
        player.isReloading = false;
        player.ammoPrimary = 32;
        player.ammoSecondary = 15;
      }
    }

    // Vehicle Driving Integration
    if (player.inVehicleId) {
      const v = this.network.currentRoom.vehicles.find((veh) => veh.id === player.inVehicleId);
      if (v && player.isVehicleDriver) {
        v.position[0] = player.position[0];
        v.position[2] = player.position[2];
        v.rotation[1] = this.cameraYaw;
      }
    }

    // Network Sync
    this.network.sendPlayerUpdate({
      position: player.position,
      rotation: player.rotation,
      velocity: player.velocity,
      health: player.health,
      shield: player.shield,
      isCarryingCore: player.isCarryingCore,
      isDowned: player.isDowned,
      ammoPrimary: player.ammoPrimary,
      ammoSecondary: player.ammoSecondary,
    });

    this.callbacks.onLocalPlayerUpdate(player);
  }

  // --- Weapon Firing & Raycast Trajectories ---
  private attemptFireWeapon(player: PlayerState) {
    const now = performance.now();
    const weapon = WEAPONS_PRIMARY.find((w) => w.id === player.loadout.primaryWeaponId) || WEAPONS_PRIMARY[0];
    const fireIntervalMs = 1000 / weapon.fireRate;

    if (now - this.lastFireTime < fireIntervalMs) return;
    if (player.ammoPrimary <= 0) {
      this.startReload();
      return;
    }

    this.lastFireTime = now;
    player.ammoPrimary -= 1;

    // Audio SFX
    soundEngine.playGunfire(weapon.type);

    // Muzzle flash / recoil
    if (this.weaponViewModel) {
      this.weaponViewModel.position.z += 0.08;
      setTimeout(() => {
        if (this.weaponViewModel) this.weaponViewModel.position.z -= 0.08;
      }, 50);
    }

    // Calculate Shoot Direction
    const shootDir = new THREE.Vector3();
    this.camera.getWorldDirection(shootDir);

    // Add spread
    shootDir.x += (Math.random() - 0.5) * weapon.spread;
    shootDir.y += (Math.random() - 0.5) * weapon.spread;
    shootDir.z += (Math.random() - 0.5) * weapon.spread;
    shootDir.normalize();

    // Spawn Projectile Tracer
    const proj: Projectile = {
      id: 'proj_' + Math.random().toString(36).substring(2, 7),
      ownerId: player.id,
      team: player.faction,
      position: [player.position[0], player.position[1] + (this.cameraMode === 'FIRST_PERSON' ? 0.2 : 0.8), player.position[2]],
      direction: [shootDir.x, shootDir.y, shootDir.z],
      speed: 160,
      damage: weapon.damage,
      rangeRemaining: weapon.range,
      color: player.faction === 'AEGIS' ? '#00d2ff' : '#ff5500',
    };
    this.projectiles.push(proj);

    // Check Raycast against Titan Goliath
    if (this.network.currentRoom.titan) {
      const titanPos = new THREE.Vector3(...this.network.currentRoom.titan.position);
      const playerPos = new THREE.Vector3(...player.position);
      const toTitan = new THREE.Vector3().subVectors(titanPos, playerPos);
      const dist = toTitan.length();

      if (dist < 120) {
        toTitan.normalize();
        if (shootDir.dot(toTitan) > 0.94) {
          // Hit Titan!
          this.network.currentRoom.titan.health = Math.max(0, this.network.currentRoom.titan.health - weapon.damage);
          this.callbacks.onHitmarker(true);
          soundEngine.playHitmarker(true);
          if (this.network.currentRoom.titan.health <= 0) {
            this.network.broadcastCombatEvent(
              `${player.name} [${player.faction}] DISABLED THE GOLIATH PROTO-TITAN!`,
              'alarm'
            );
          }
        }
      }
    }

    // Check Hit against Remote Players & Bots
    Object.values(this.network.currentRoom.players).forEach((target) => {
      if (target.id === player.id || target.faction === player.faction || target.isDowned) return;

      const targetPos = new THREE.Vector3(...target.position);
      const playerPos = new THREE.Vector3(...player.position);
      const toTarget = new THREE.Vector3().subVectors(targetPos, playerPos);
      const dist = toTarget.length();

      if (dist < weapon.range) {
        toTarget.normalize();
        if (shootDir.dot(toTarget) > 0.975) {
          // Hit enemy soldier!
          this.callbacks.onHitmarker(false);
          soundEngine.playHitmarker(false);

          let remDamage = weapon.damage;
          if (target.shield > 0) {
            const shieldDmg = Math.min(target.shield, remDamage);
            target.shield -= shieldDmg;
            remDamage -= shieldDmg;
          }
          if (remDamage > 0) {
            target.health = Math.max(0, target.health - remDamage);
          }

          if (target.health <= 0) {
            target.isDowned = true;
            target.downedTimer = 30;
            player.kills += 1;
            player.score += 250;

            // If target was carrying core, drop it!
            if (target.isCarryingCore) {
              target.isCarryingCore = false;
              this.dropCore(target.faction === 'AEGIS' ? 'VANGUARD' : 'AEGIS', target.position);
            }

            this.network.broadcastCombatEvent(
              `${player.name} [${player.faction}] downed ${target.name} [${target.faction}]`,
              'kill'
            );
          }
        }
      }
    });
  }

  // --- Projectile Tracers Update ---
  private updateProjectiles(delta: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.position[0] += p.direction[0] * p.speed * delta;
      p.position[1] += p.direction[1] * p.speed * delta;
      p.position[2] += p.direction[2] * p.speed * delta;
      p.rangeRemaining -= p.speed * delta;

      if (p.rangeRemaining <= 0 || p.position[1] < 0) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  // --- ODM Wire Grapple Hook Trigger ---
  public triggerOdmGrapple() {
    const player = this.network.currentRoom.players[this.network.playerId];
    if (!player || player.isDowned) return;

    if (player.odmHookActive) {
      // Disengage wire
      player.odmHookActive = false;
      this.clearOdmCable();
      return;
    }

    // Raycast forward to find anchor point
    const raycaster = new THREE.Raycaster();
    const screenCenter = new THREE.Vector2(0, 0);
    raycaster.setFromCamera(screenCenter, this.camera);

    const intersects = raycaster.intersectObjects(this.world.grappleTargets, true);
    if (intersects.length > 0 && intersects[0].distance < 85) {
      const hit = intersects[0].point;
      player.odmHookActive = true;
      player.odmHookTarget = [hit.x, hit.y, hit.z];
      soundEngine.playOdmLaunch();
      soundEngine.playOdmZip();
    }
  }

  private renderOdmCable(from: THREE.Vector3, to: THREE.Vector3) {
    if (!this.odmCableLine) {
      const mat = new THREE.LineBasicMaterial({ color: 0x00ffcc, linewidth: 2 });
      const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
      this.odmCableLine = new THREE.Line(geo, mat);
      this.world.scene.add(this.odmCableLine);
    } else {
      this.odmCableLine.geometry.setFromPoints([from, to]);
      this.odmCableLine.visible = true;
    }
  }

  private clearOdmCable() {
    if (this.odmCableLine) {
      this.odmCableLine.visible = false;
    }
  }

  // --- Objective Handling: Energy Cores & Extraction ---
  private updateObjectives(delta: number) {
    const player = this.network.currentRoom.players[this.network.playerId];
    if (!player) return;

    const aegisCore = this.network.currentRoom.aegisCore;
    const vanguardCore = this.network.currentRoom.vanguardCore;
    const lz = this.network.currentRoom.extractionZones[0];

    // Check pickup of enemy core
    const enemyCore = player.faction === 'AEGIS' ? vanguardCore : aegisCore;
    const enemyBasePos = new THREE.Vector3(...enemyCore.position);
    const playerPos = new THREE.Vector3(...player.position);

    if (!player.isCarryingCore && !player.isDowned && enemyBasePos.distanceTo(playerPos) < 4.0) {
      // Pick up enemy core!
      player.isCarryingCore = true;
      enemyCore.state = 'BREACHED_CARRIED';
      enemyCore.carrierId = player.id;

      // Emergency alarms activate!
      soundEngine.startEmergencySiren();
      const warning = `WARNING: ${player.faction === 'AEGIS' ? 'VANGUARD' : 'AEGIS'} ENERGY CORE CONTAINMENT BREACHED!`;
      soundEngine.announceLoudspeaker(warning);
      this.network.broadcastCombatEvent(warning, 'core');
    }

    // Keep core position synced with carrier
    if (player.isCarryingCore) {
      enemyCore.position = [player.position[0], player.position[1] + 0.5, player.position[2]];
    }

    // Check Extraction Helipad LZ
    if (player.isCarryingCore && lz) {
      const lzPos = new THREE.Vector3(...lz.position);
      if (playerPos.distanceTo(lzPos) < lz.radius) {
        lz.isExtracting = true;
        lz.progressPercent = Math.min(100, lz.progressPercent + delta * 12); // ~8 sec extraction

        if (lz.progressPercent >= 100) {
          // Extraction Victory!
          this.network.currentRoom.status = 'EXTRACTION_COMPLETED';
          this.network.currentRoom.winnerFaction = player.faction;
          this.network.currentRoom.scores[player.faction] += 1000;
          soundEngine.stopEmergencySiren();
          soundEngine.announceLoudspeaker(`${player.faction} HAS SUCCESSFULLY EXTRACTED THE ENERGY CORE. MISSION ACCOMPLISHED.`);
          this.network.broadcastCombatEvent(`OPERATION SUCCESS: ${player.faction} SECURED EXTRACTION!`, 'core');
        }
      } else {
        lz.isExtracting = false;
      }
    }

    // Rotate Cores in 3D
    this.world.aegisCoreMesh.position.set(aegisCore.position[0], aegisCore.position[1], aegisCore.position[2]);
    this.world.aegisCoreMesh.rotation.y += delta * 1.5;
    this.world.vanguardCoreMesh.position.set(vanguardCore.position[0], vanguardCore.position[1], vanguardCore.position[2]);
    this.world.vanguardCoreMesh.rotation.y += delta * 1.5;
  }

  private dropCore(faction: FactionId, pos: [number, number, number]) {
    const core = faction === 'AEGIS' ? this.network.currentRoom.aegisCore : this.network.currentRoom.vanguardCore;
    core.state = 'DROPPED_FIELD';
    core.carrierId = null;
    core.position = [pos[0], 1.2, pos[2]];
    this.network.broadcastCombatEvent(`ENERGY CORE DROPPED ON THE BATTLEFIELD!`, 'core');
  }

  // --- Neural Recall Reviving ---
  public triggerInteractOrRecall() {
    const player = this.network.currentRoom.players[this.network.playerId];
    if (!player || player.isDowned) return;

    // Check downed friendly squadmates in 3.5m radius
    const downedTeammate = Object.values(this.network.currentRoom.players).find(
      (p) => p.faction === player.faction && p.isDowned && p.id !== player.id &&
      new THREE.Vector3(...p.position).distanceTo(new THREE.Vector3(...player.position)) < 4.0
    );

    if (downedTeammate) {
      // Channel Neural Recall
      this.recallTargetId = downedTeammate.id;
      this.recallProgressSec = 0;
      const interval = setInterval(() => {
        this.recallProgressSec += 0.5;
        if (this.recallProgressSec >= 3.0) {
          clearInterval(interval);
          downedTeammate.isDowned = false;
          downedTeammate.health = 75;
          downedTeammate.shield = 50;
          player.recalls += 1;
          player.score += 300;
          soundEngine.playRecallSuccess();
          this.network.broadcastCombatEvent(
            `NEURAL LINK RESTORED: ${player.name} RECALLED ${downedTeammate.name}!`,
            'recall'
          );
          this.recallTargetId = null;
        }
      }, 500);
      return;
    }

    // Check mountable vehicle in 4.5m radius
    const nearVehicle = this.network.currentRoom.vehicles.find(
      (v) => new THREE.Vector3(...v.position).distanceTo(new THREE.Vector3(...player.position)) < 5.0
    );

    if (nearVehicle) {
      if (player.inVehicleId) {
        // Exit vehicle
        player.inVehicleId = null;
        player.isVehicleDriver = false;
        nearVehicle.driverId = null;
      } else {
        // Enter vehicle
        player.inVehicleId = nearVehicle.id;
        player.isVehicleDriver = true;
        nearVehicle.driverId = player.id;
      }
    }
  }

  // --- Attack on Titan Goliath AI Behavior ---
  private updateTitanAi(delta: number) {
    const titan = this.network.currentRoom.titan;
    if (!titan || titan.health <= 0) return;

    titan.stompCooldown = Math.max(0, titan.stompCooldown - delta);

    // Slowly advance down central trench
    const speed = 4.2;
    titan.position[2] += Math.sin(this.titanAnimPhase * 0.25) * speed * delta;
    titan.position[0] += Math.cos(this.titanAnimPhase * 0.15) * speed * 0.6 * delta;

    // Titan Ground Stomp
    if (titan.stompCooldown <= 0) {
      titan.stompCooldown = 8.0;
      soundEngine.playTitanStomp();

      // Check proximity to local player
      const player = this.network.currentRoom.players[this.network.playerId];
      if (player && !player.isDowned) {
        const titanPos = new THREE.Vector3(...titan.position);
        const playerPos = new THREE.Vector3(...player.position);
        const dist = titanPos.distanceTo(playerPos);

        if (dist < 22) {
          // Shockwave knockback
          const knockDir = new THREE.Vector3().subVectors(playerPos, titanPos).normalize();
          player.velocity[0] = knockDir.x * 24;
          player.velocity[1] = 8;
          player.velocity[2] = knockDir.z * 24;
          player.shield = Math.max(0, player.shield - 35);
        }
      }
    }
  }

  // --- Tactical Bot Squad AI ---
  private updateBotsAi(delta: number) {
    const bots = Object.values(this.network.currentRoom.players).filter((p) => p.isBot);
    const player = this.network.currentRoom.players[this.network.playerId];

    bots.forEach((bot) => {
      if (bot.isDowned) {
        bot.downedTimer = Math.max(0, bot.downedTimer - delta);
        if (bot.downedTimer <= 0) this.respawnPlayer(bot);
        return;
      }

      // Target opposite stronghold
      const targetX = bot.faction === 'AEGIS' ? INITIAL_MAP_CONFIG.vanguardCorePedestal.x : INITIAL_MAP_CONFIG.aegisCorePedestal.x;
      const targetZ = 0;

      const dirX = targetX - bot.position[0];
      const dirZ = targetZ - bot.position[2];
      const dist = Math.sqrt(dirX * dirX + dirZ * dirZ);

      if (dist > 5) {
        const speed = 7.5;
        bot.position[0] += (dirX / dist) * speed * delta;
        bot.position[2] += (dirZ / dist) * speed * delta;
        bot.rotation[1] = Math.atan2(dirX, dirZ);
      }

      // Check combat range against human player
      if (player && !player.isDowned && player.faction !== bot.faction) {
        const botPos = new THREE.Vector3(...bot.position);
        const plyPos = new THREE.Vector3(...player.position);
        const pDist = botPos.distanceTo(plyPos);

        if (pDist < 45 && Math.random() < 0.03) {
          // Bot fires burst
          soundEngine.playGunfire('assault');
          if (pDist < 25 && Math.random() < 0.45) {
            // Hit local player
            player.shield = Math.max(0, player.shield - 14);
            if (player.shield <= 0) {
              player.health = Math.max(0, player.health - 16);
              if (player.health <= 0) {
                player.isDowned = true;
                player.downedTimer = 30;
                this.network.broadcastCombatEvent(`${bot.name} downed ${player.name}`, 'kill');
              }
            }
          }
        }
      }

      // Update bot mesh
      this.updateRemotePlayerMesh(bot);
    });
  }

  private updateRemotePlayerMesh(player: PlayerState) {
    let mesh = this.remotePlayerMeshes.get(player.id);
    if (!mesh) {
      mesh = this.createSoldierMesh(player.faction);
      this.world.scene.add(mesh);
      this.remotePlayerMeshes.set(player.id, mesh);
    }

    mesh.position.set(player.position[0], player.position[1] - 0.75, player.position[2]);
    mesh.rotation.y = player.rotation[1];

    // Downed crawling posture
    if (player.isDowned) {
      mesh.rotation.x = Math.PI / 2;
    } else {
      mesh.rotation.x = 0;
    }

    const corePack = mesh.getObjectByName('coreCarrierPack');
    if (corePack) {
      corePack.visible = player.isCarryingCore;
    }
  }

  private respawnPlayer(player: PlayerState) {
    const isAegis = player.faction === 'AEGIS';
    player.position = [isAegis ? -80 : 80, 1.5, (Math.random() - 0.5) * 15];
    player.health = 100;
    player.shield = 100;
    player.isDowned = false;
    player.downedTimer = 30;
    player.isCarryingCore = false;
    player.ammoPrimary = 32;
    player.deaths += 1;
  }

  public switchWeaponSlot(slot?: 'primary' | 'secondary') {
    const player = this.network.currentRoom.players[this.network.playerId];
    if (!player) return;
    if (slot) {
      player.activeWeaponSlot = slot;
    } else {
      player.activeWeaponSlot = player.activeWeaponSlot === 'primary' ? 'secondary' : 'primary';
    }
  }

  public startReload() {
    const player = this.network.currentRoom.players[this.network.playerId];
    if (!player || player.isReloading) return;
    player.isReloading = true;
    player.reloadProgress = 0;
  }

  // --- Camera Update (1st Person vs 3rd Person OTS) ---
  private updateCamera(delta: number) {
    const player = this.network.currentRoom.players[this.network.playerId];
    if (!player) return;

    if (this.cameraMode === 'FIRST_PERSON') {
      this.camera.position.set(player.position[0], player.position[1] + 0.65, player.position[2]);
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = this.cameraYaw;
      this.camera.rotation.x = this.cameraPitch;
      this.camera.rotation.z = 0;
    } else {
      // 3rd Person Over-the-shoulder
      const eyePos = new THREE.Vector3(player.position[0], player.position[1] + 1.2, player.position[2]);
      const offset = new THREE.Vector3(
        0.9 * Math.cos(this.cameraYaw) + this.cameraDistance * Math.sin(this.cameraYaw),
        1.0 - this.cameraDistance * Math.sin(this.cameraPitch) * 0.4,
        -0.9 * Math.sin(this.cameraYaw) + this.cameraDistance * Math.cos(this.cameraYaw)
      );

      this.camera.position.copy(eyePos).add(offset);
      this.camera.lookAt(eyePos.x, eyePos.y + 0.3, eyePos.z);
    }
  }

  private onWindowResize = () => {
    if (!this.container) return;
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  };

  public destroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize);
    soundEngine.stopEmergencySiren();
    this.renderer.dispose();
  }
}
