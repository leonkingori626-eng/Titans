/**
 * PROJECT: AETHER - Game Types & Interfaces
 */

export type FactionId = 'AEGIS' | 'VANGUARD';

export type SquadRole = 'LEADER' | 'SCOUT' | 'ASSAULT' | 'SUPPORT';

export type GameMode = 'CORE_EXTRACTION' | 'VIP_EXTRACTION' | 'OPERATION_BLACK_VEIL';

export type CameraViewMode = 'FIRST_PERSON' | 'THIRD_PERSON';

export interface WeaponDef {
  id: string;
  name: string;
  category: 'primary' | 'secondary';
  type: 'assault' | 'smg' | 'shotgun' | 'marksman' | 'pistol' | 'machine_pistol';
  damage: number;
  fireRate: number; // shots per sec
  magSize: number;
  reloadTime: number; // seconds
  range: number;
  spread: number;
  recoil: number;
  description: string;
}

export interface GadgetDef {
  id: string;
  name: string;
  slot: 1 | 2;
  cooldown: number; // seconds
  icon: string;
  description: string;
}

export interface AbilityDef {
  id: string;
  name: string;
  cooldown: number;
  duration: number;
  description: string;
}

export interface PlayerLoadout {
  primaryWeaponId: string;
  secondaryWeaponId: string;
  gadget1Id: string;
  gadget2Id: string;
  abilityId: string;
  role: SquadRole;
}

export interface PlayerState {
  id: string;
  name: string;
  faction: FactionId;
  role: SquadRole;
  isBot: boolean;
  isHost: boolean;
  loadout: PlayerLoadout;
  
  // Position & physics
  position: [number, number, number];
  rotation: [number, number, number]; // [pitch, yaw, roll]
  velocity: [number, number, number];
  
  // Status
  health: number; // 0-100
  maxHealth: number;
  shield: number; // 0-100
  maxShield: number;
  isDowned: boolean;
  downedTimer: number; // 30s bleedout
  isCarryingCore: boolean;
  isEscortingVIP: boolean;
  inVehicleId: string | null;
  isVehicleDriver: boolean;
  
  // Weapon & abilities
  activeWeaponSlot: 'primary' | 'secondary';
  ammoPrimary: number;
  ammoSecondary: number;
  isReloading: boolean;
  reloadProgress: number;
  abilityCooldown: number;
  abilityActive: boolean;
  abilityDurationTimer: number;
  gadget1Cooldown: number;
  gadget2Cooldown: number;
  
  // ODM Grappling Wire
  odmHookActive: boolean;
  odmHookTarget: [number, number, number] | null;
  odmCableLength: number;
  
  // Stats
  kills: number;
  deaths: number;
  recalls: number;
  coresCaptured: number;
  score: number;
  ping: number;
}

export interface ObjectiveCore {
  faction: FactionId; // which faction owns this core
  position: [number, number, number];
  basePosition: [number, number, number];
  carrierId: string | null;
  state: 'SECURE_IN_PEDESTAL' | 'BREACHED_CARRIED' | 'DROPPED_FIELD';
  resetTimer: number; // timer if dropped in field
}

export interface ObjectiveVIP {
  id: string;
  name: string;
  position: [number, number, number];
  basePosition: [number, number, number];
  carrierId: string | null; // who is leading/escorting
  controllingFaction: FactionId | null;
  state: 'IN_DETENTION' | 'BEING_ESCORTED' | 'DOWNED' | 'EXTRACTED';
  health: number;
}

export interface VehicleState {
  id: string;
  type: 'GROUND_APC' | 'VTOL_DROPSHIP';
  faction: FactionId;
  position: [number, number, number];
  rotation: [number, number, number];
  velocity: [number, number, number];
  health: number;
  maxHealth: number;
  driverId: string | null;
  passengerIds: string[];
  turretCooldown: number;
  altitude?: number;
}

export interface TitanState {
  id: string;
  name: string; // 'GOLIATH PROTO-TITAN'
  position: [number, number, number];
  rotation: number;
  health: number; // 0-1000
  maxHealth: number;
  state: 'PATROL' | 'AGGRESSIVE' | 'STEAM_BURST' | 'GROUND_STOMP' | 'STUNNED';
  targetPlayerId: string | null;
  ventVulnerable: boolean;
  stompCooldown: number;
}

export interface ExtractionZone {
  id: string;
  faction: FactionId;
  position: [number, number, number];
  radius: number;
  progressPercent: number; // 0-100 extraction countdown
  isExtracting: boolean;
}

export interface MatchState {
  matchId: string;
  roomCode: string;
  mode: GameMode;
  status: 'LOBBY' | 'WARMUP' | 'IN_PROGRESS' | 'EXTRACTION_COMPLETED' | 'TIME_EXPIRED';
  timeRemainingSec: number; // default 720 (12 mins)
  winnerFaction: FactionId | null;
  
  aegisCore: ObjectiveCore;
  vanguardCore: ObjectiveCore;
  vip: ObjectiveVIP | null;
  titan: TitanState | null;
  vehicles: VehicleState[];
  extractionZones: ExtractionZone[];
  
  scores: {
    AEGIS: number;
    VANGUARD: number;
  };
  
  players: Record<string, PlayerState>;
  alarmActive: boolean;
  alarmMessage: string;
  loudspeakerAudioQueue: string[];
  combatFeed: {
    id: string;
    text: string;
    timestamp: number;
    type: 'kill' | 'core' | 'recall' | 'alarm' | 'vehicle';
  }[];
}

export interface Projectile {
  id: string;
  ownerId: string;
  team: FactionId;
  position: [number, number, number];
  direction: [number, number, number];
  speed: number;
  damage: number;
  rangeRemaining: number;
  color: string;
}

export interface UserRankProfile {
  username: string;
  faction: FactionId;
  skillRating: number; // CSR (e.g. 1450)
  rankTitle: string; // "Recruit", "Spec-Ops", "Praetor", "Titan Slayer", "Apex Commander"
  totalMatches: number;
  victories: number;
  coresSecured: number;
  titanDisablings: number;
  recallsPerformed: number;
  territoryControlledPercent: {
    AEGIS: number;
    VANGUARD: number;
  };
}
