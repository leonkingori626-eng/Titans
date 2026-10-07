/**
 * Game Weapons, Gadgets, Abilities, and Lore Constants
 */
import { WeaponDef, GadgetDef, AbilityDef, FactionId, GameMode, MatchState } from '../types/game';

export const WEAPONS_PRIMARY: WeaponDef[] = [
  {
    id: 'xm28_aether',
    name: 'XM-28 Aether Carbine',
    category: 'primary',
    type: 'assault',
    damage: 26,
    fireRate: 11, // rounds/sec
    magSize: 32,
    reloadTime: 2.1,
    range: 120,
    spread: 0.02,
    recoil: 0.035,
    description: 'Standard issue high-velocity kinetic rifle charged with micro-Aether accelerant. Balanced handling.',
  },
  {
    id: 'spectre9_smg',
    name: 'Spectre-9 PDW',
    category: 'primary',
    type: 'smg',
    damage: 18,
    fireRate: 17,
    magSize: 42,
    reloadTime: 1.6,
    range: 65,
    spread: 0.045,
    recoil: 0.025,
    description: 'Blistering close-quarters fire rate designed for rapid facility breaches and carrier escorts.',
  },
  {
    id: 'breach12_shotgun',
    name: 'Breach-12 Mag-Scatter',
    category: 'primary',
    type: 'shotgun',
    damage: 110, // across pellets
    fireRate: 2.2,
    magSize: 8,
    reloadTime: 2.8,
    range: 40,
    spread: 0.08,
    recoil: 0.12,
    description: 'Heavy electromagnetic scattergun. Devastating kinetic knockback in tight corridors.',
  },
  {
    id: 'viper_dmr',
    name: 'Viper .50 DMR',
    category: 'primary',
    type: 'marksman',
    damage: 74,
    fireRate: 3.0,
    magSize: 10,
    reloadTime: 2.4,
    range: 220,
    spread: 0.005,
    recoil: 0.08,
    description: 'High-caliber marksman rifle with high-contrast thermal scope. Essential for perimeter overwatch.',
  },
];

export const WEAPONS_SECONDARY: WeaponDef[] = [
  {
    id: 'g22_tactical',
    name: 'G-22 Cerberus Pistol',
    category: 'secondary',
    type: 'pistol',
    damage: 34,
    fireRate: 5.5,
    magSize: 15,
    reloadTime: 1.4,
    range: 60,
    spread: 0.015,
    recoil: 0.03,
    description: 'Reliable sidearm with match-grade barrel and rapid draw time.',
  },
  {
    id: 'k9_auto',
    name: 'K-9 Shredder Auto-Pistol',
    category: 'secondary',
    type: 'machine_pistol',
    damage: 19,
    fireRate: 15,
    magSize: 24,
    reloadTime: 1.7,
    range: 45,
    spread: 0.05,
    recoil: 0.045,
    description: 'Full-automatic emergency backup spray when primaries run dry in CQB.',
  },
];

export const GADGETS_SLOT1: GadgetDef[] = [
  {
    id: 'frag_grenade',
    name: 'MK-IV Frag Grenade',
    slot: 1,
    cooldown: 18,
    icon: 'Bomb',
    description: 'Timed explosive dealing 120 area damage and shattering light blast covers.',
  },
  {
    id: 'emp_charge',
    name: 'EMP Disruptor',
    slot: 1,
    cooldown: 20,
    icon: 'Zap',
    description: 'Disables enemy shields, scrambles optics, and stalls vehicle engines for 4 seconds.',
  },
  {
    id: 'smoke_canister',
    name: 'Nano-Smoke Canister',
    slot: 1,
    cooldown: 15,
    icon: 'Cloud',
    description: 'Deploys dense thermal-shielding particulate cloud to mask extraction carrier paths.',
  },
  {
    id: 'sensor_dart',
    name: 'Tactical Recon Sensor',
    slot: 1,
    cooldown: 22,
    icon: 'Radio',
    description: 'Pings hostile movement in a 35m radius through concrete facility bulkheads.',
  },
];

export const GADGETS_SLOT2: GadgetDef[] = [
  {
    id: 'deployable_shield',
    name: 'Hardlight Aegis Barrier',
    slot: 2,
    cooldown: 25,
    icon: 'Shield',
    description: 'Deploys a waist-high ballistic shield providing cover during carrier escapes.',
  },
  {
    id: 'breach_charge',
    name: 'Thermal Breach Lance',
    slot: 2,
    cooldown: 20,
    icon: 'Flame',
    description: 'Disintegrates enemy energy barriers and blasts reinforced chamber doors.',
  },
  {
    id: 'motion_detector',
    name: 'Acoustic Trip-Sensor',
    slot: 2,
    cooldown: 22,
    icon: 'Radar',
    description: 'Plants a proximity trap that alerts squad and slows enemy flankers by 50%.',
  },
  {
    id: 'med_stim',
    name: 'Neural Med-Injector',
    slot: 2,
    cooldown: 18,
    icon: 'HeartPulse',
    description: 'Instant 65 HP restoration and 20% sprint acceleration boost for 5 seconds.',
  },
];

export const ABILITIES: AbilityDef[] = [
  {
    id: 'odm_boost',
    name: 'Aether Wire Over-Thruster',
    cooldown: 12,
    duration: 6,
    description: 'Supercharges ODM wire winch velocity by 180%, enabling soaring multi-building aerial leaps.',
  },
  {
    id: 'optical_cloak',
    name: 'Active Stealth Camouflage',
    cooldown: 24,
    duration: 5,
    description: 'Bends light waves around the soldier, rendering them nearly invisible while infiltrating.',
  },
  {
    id: 'overcharge_barrier',
    name: 'Plasma Deflector Overcharge',
    cooldown: 22,
    duration: 4,
    description: 'Generates an omnidirectional magnetic shield absorbing up to 150 incoming kinetic damage.',
  },
  {
    id: 'tactical_scan',
    name: 'Neural Combat Overwatch',
    cooldown: 18,
    duration: 5,
    description: 'Highlights all enemy silhouettes and core extraction trajectories through walls.',
  },
];

export const FACTIONS_LORE = {
  AEGIS: {
    id: 'AEGIS' as FactionId,
    name: 'THE AEGIS',
    motto: 'Order Preserves Life',
    color: '#00d2ff', // Cyan / Electric Blue
    secondaryColor: '#ffffff',
    description: 'Heavily fortified cyber-industrial federation. Holds that centralized military command over the surviving Aether Cores is humanity’s sole safeguard against planetary collapse.',
    armors: 'Polymer heavy composite armor with high-intensity cyan optics and drone linkages.',
  },
  VANGUARD: {
    id: 'VANGUARD' as FactionId,
    name: 'THE VANGUARD',
    motto: 'Power Belongs to Everyone',
    color: '#ff5500', // Deep Ember Orange
    secondaryColor: '#ffbb00',
    description: 'Underground alliance of rogue engineers, orbital defectors, and free militia. Demands decentralized distribution of Aether power to the surviving cities.',
    armors: 'Weathered modular ballistic plating with amber infrared visors and improvised tech enhancements.',
  },
};

export const INITIAL_MAP_CONFIG = {
  mapSize: 280, // 280m x 280m play area
  aegisStronghold: { x: -85, z: 0, y: 0 },
  vanguardStronghold: { x: 85, z: 0, y: 0 },
  aegisCorePedestal: { x: -95, z: 0, y: 1.5 },
  vanguardCorePedestal: { x: 95, z: 0, y: 1.5 },
  titanSpawn: { x: 0, z: -10, y: 0 },
  extractionHelipad: { x: 0, z: 85, y: 2 },
  aegisVehicleSpawn: { x: -60, z: 45, y: 0 },
  vanguardVehicleSpawn: { x: 60, z: 45, y: 0 },
  vtolDropshipSpawn: { x: 0, z: 75, y: 12 },
  vipSpawn: { x: 0, z: 0, y: 1 },
};

export function createInitialMatchState(roomCode = 'AETH-7729', mode: GameMode = 'CORE_EXTRACTION'): MatchState {
  return {
    matchId: 'match_' + Math.random().toString(36).substring(2, 9),
    roomCode,
    mode,
    status: 'LOBBY',
    timeRemainingSec: 720, // 12 minutes
    winnerFaction: null,
    aegisCore: {
      faction: 'AEGIS',
      position: [INITIAL_MAP_CONFIG.aegisCorePedestal.x, INITIAL_MAP_CONFIG.aegisCorePedestal.y, INITIAL_MAP_CONFIG.aegisCorePedestal.z],
      basePosition: [INITIAL_MAP_CONFIG.aegisCorePedestal.x, INITIAL_MAP_CONFIG.aegisCorePedestal.y, INITIAL_MAP_CONFIG.aegisCorePedestal.z],
      carrierId: null,
      state: 'SECURE_IN_PEDESTAL',
      resetTimer: 0,
    },
    vanguardCore: {
      faction: 'VANGUARD',
      position: [INITIAL_MAP_CONFIG.vanguardCorePedestal.x, INITIAL_MAP_CONFIG.vanguardCorePedestal.y, INITIAL_MAP_CONFIG.vanguardCorePedestal.z],
      basePosition: [INITIAL_MAP_CONFIG.vanguardCorePedestal.x, INITIAL_MAP_CONFIG.vanguardCorePedestal.y, INITIAL_MAP_CONFIG.vanguardCorePedestal.z],
      carrierId: null,
      state: 'SECURE_IN_PEDESTAL',
      resetTimer: 0,
    },
    vip: mode === 'VIP_EXTRACTION' ? {
      id: 'vip_vance',
      name: 'Dr. H. Vance (Core Architect)',
      position: [INITIAL_MAP_CONFIG.vipSpawn.x, INITIAL_MAP_CONFIG.vipSpawn.y, INITIAL_MAP_CONFIG.vipSpawn.z],
      basePosition: [INITIAL_MAP_CONFIG.vipSpawn.x, INITIAL_MAP_CONFIG.vipSpawn.y, INITIAL_MAP_CONFIG.vipSpawn.z],
      carrierId: null,
      controllingFaction: null,
      state: 'IN_DETENTION',
      health: 200,
    } : null,
    titan: {
      id: 'titan_goliath_01',
      name: 'GOLIATH PROTO-TITAN',
      position: [INITIAL_MAP_CONFIG.titanSpawn.x, INITIAL_MAP_CONFIG.titanSpawn.y, INITIAL_MAP_CONFIG.titanSpawn.z],
      rotation: 0,
      health: 850,
      maxHealth: 850,
      state: 'PATROL',
      targetPlayerId: null,
      ventVulnerable: false,
      stompCooldown: 6,
    },
    vehicles: [
      {
        id: 'apc_aegis',
        type: 'GROUND_APC',
        faction: 'AEGIS',
        position: [INITIAL_MAP_CONFIG.aegisVehicleSpawn.x, 0, INITIAL_MAP_CONFIG.aegisVehicleSpawn.z],
        rotation: [0, Math.PI / 2, 0],
        velocity: [0, 0, 0],
        health: 500,
        maxHealth: 500,
        driverId: null,
        passengerIds: [],
        turretCooldown: 0,
      },
      {
        id: 'apc_vanguard',
        type: 'GROUND_APC',
        faction: 'VANGUARD',
        position: [INITIAL_MAP_CONFIG.vanguardVehicleSpawn.x, 0, INITIAL_MAP_CONFIG.vanguardVehicleSpawn.z],
        rotation: [0, -Math.PI / 2, 0],
        velocity: [0, 0, 0],
        health: 500,
        maxHealth: 500,
        driverId: null,
        passengerIds: [],
        turretCooldown: 0,
      },
      {
        id: 'vtol_extraction',
        type: 'VTOL_DROPSHIP',
        faction: 'AEGIS',
        position: [INITIAL_MAP_CONFIG.vtolDropshipSpawn.x, INITIAL_MAP_CONFIG.vtolDropshipSpawn.y, INITIAL_MAP_CONFIG.vtolDropshipSpawn.z],
        rotation: [0, 0, 0],
        velocity: [0, 0, 0],
        health: 800,
        maxHealth: 800,
        driverId: null,
        passengerIds: [],
        turretCooldown: 0,
        altitude: 12,
      },
    ],
    extractionZones: [
      {
        id: 'lz_central',
        faction: 'AEGIS',
        position: [INITIAL_MAP_CONFIG.extractionHelipad.x, INITIAL_MAP_CONFIG.extractionHelipad.y, INITIAL_MAP_CONFIG.extractionHelipad.z],
        radius: 12,
        progressPercent: 0,
        isExtracting: false,
      },
    ],
    scores: {
      AEGIS: 0,
      VANGUARD: 0,
    },
    players: {},
    alarmActive: false,
    alarmMessage: '',
    loudspeakerAudioQueue: [],
    combatFeed: [
      {
        id: 'init_feed',
        text: 'SYSTEM INITIALIZED: OPERATION BLACK VEIL PROTOCOL ENGAGED.',
        timestamp: Date.now(),
        type: 'alarm',
      },
    ],
  };
}
