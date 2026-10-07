/**
 * Client Networking Manager for PROJECT: AETHER
 * Handles real-time WebSocket connection, auto-reconnect, and BroadcastChannel offline fallback.
 */
import { MatchState, PlayerState, FactionId, PlayerLoadout } from '../types/game';
import { createInitialMatchState } from './constants';

export type NetworkEventCallback = (data: any) => void;

export class NetworkManager {
  private ws: WebSocket | null = null;
  private bc: BroadcastChannel | null = null;
  private listeners: Map<string, NetworkEventCallback[]> = new Map();
  public currentRoom: MatchState;
  public playerId: string;
  public playerName: string;
  public faction: FactionId;
  public isConnected: boolean = false;
  public isOfflineMode: boolean = false;
  private pingInterval: any = null;

  constructor(roomCode = 'AETH-7729', playerName = 'OPERATIVE-7', faction: FactionId = 'AEGIS') {
    this.playerId = 'ply_' + Math.random().toString(36).substring(2, 8);
    this.playerName = playerName;
    this.faction = faction;
    this.currentRoom = createInitialMatchState(roomCode, 'CORE_EXTRACTION');

    // Setup fallback BroadcastChannel for local/offline tabs
    try {
      this.bc = new BroadcastChannel('aether_bc_' + roomCode);
      this.bc.onmessage = (event) => {
        this.handleMessage(event.data);
      };
    } catch {
      // BroadcastChannel not supported in some older environments
    }
  }

  public connect(roomCode: string, name: string, faction: FactionId, forceOffline = false) {
    this.playerName = name;
    this.faction = faction;
    this.isOfflineMode = forceOffline;

    if (forceOffline) {
      this.isConnected = true;
      this.currentRoom = createInitialMatchState(roomCode, 'CORE_EXTRACTION');
      this.spawnLocalSquadAndEnemies();
      this.emit('CONNECTED', { offline: true });
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws?room=${encodeURIComponent(
        roomCode
      )}&player=${this.playerId}&name=${encodeURIComponent(name)}&faction=${faction}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.emit('CONNECTED', { offline: false });
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data);
          this.handleMessage(packet);
        } catch {
          // ignore
        }
      };

      this.ws.onerror = () => {
        // Fallback to local offline mode seamlessly
        if (!this.isConnected) {
          this.isOfflineMode = true;
          this.isConnected = true;
          this.spawnLocalSquadAndEnemies();
          this.emit('CONNECTED', { offline: true });
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        clearInterval(this.pingInterval);
      };
    } catch {
      // If WebSocket setup throws, fallback to offline local mode
      this.isOfflineMode = true;
      this.isConnected = true;
      this.spawnLocalSquadAndEnemies();
      this.emit('CONNECTED', { offline: true });
    }
  }

  private startPing() {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
      }
    }, 5000);
  }

  private handleMessage(packet: any) {
    switch (packet.type) {
      case 'INIT_STATE':
        this.currentRoom = packet.room;
        this.emit('ROOM_SYNC', this.currentRoom);
        break;

      case 'DELTA_TICK':
        this.currentRoom.timeRemainingSec = packet.timeRemainingSec;
        this.currentRoom.scores = packet.scores;
        // Merge players
        Object.entries(packet.players).forEach(([pid, pData]: [string, any]) => {
          if (pid !== this.playerId) {
            this.currentRoom.players[pid] = pData;
          }
        });
        this.currentRoom.aegisCore = packet.aegisCore;
        this.currentRoom.vanguardCore = packet.vanguardCore;
        if (packet.titan) this.currentRoom.titan = packet.titan;
        if (packet.vehicles) this.currentRoom.vehicles = packet.vehicles;
        this.emit('DELTA_TICK', this.currentRoom);
        break;

      case 'COMBAT_EVENT':
        this.currentRoom.combatFeed.unshift(packet.feed);
        if (this.currentRoom.combatFeed.length > 20) this.currentRoom.combatFeed.pop();
        this.emit('COMBAT_EVENT', packet.feed);
        break;

      case 'MATCH_STARTED':
        this.currentRoom.status = 'IN_PROGRESS';
        this.emit('MATCH_STARTED', this.currentRoom);
        break;

      case 'ROOM_UPDATE':
        this.currentRoom = packet.room;
        this.emit('ROOM_SYNC', this.currentRoom);
        break;
    }
  }

  public sendPlayerUpdate(playerState: Partial<PlayerState>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'UPDATE_PLAYER_STATE',
          state: playerState,
        })
      );
    } else if (this.bc) {
      this.bc.postMessage({
        type: 'UPDATE_PLAYER_STATE',
        playerId: this.playerId,
        state: playerState,
      });
    }
  }

  public startMatch() {
    this.currentRoom.status = 'IN_PROGRESS';
    this.currentRoom.timeRemainingSec = 720;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'START_MATCH' }));
    } else {
      this.emit('MATCH_STARTED', this.currentRoom);
    }
  }

  public updateLoadout(loadout: PlayerLoadout) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'SET_LOADOUT', loadout }));
    }
  }

  public broadcastCombatEvent(text: string, eventType: 'kill' | 'core' | 'recall' | 'alarm' | 'vehicle' = 'kill') {
    const feedItem = {
      id: 'feed_' + Math.random().toString(36).substring(2, 7),
      text,
      timestamp: Date.now(),
      type: eventType,
    };
    this.currentRoom.combatFeed.unshift(feedItem);
    if (this.currentRoom.combatFeed.length > 20) this.currentRoom.combatFeed.pop();

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'COMBAT_EVENT', text, eventType }));
    } else {
      this.emit('COMBAT_EVENT', feedItem);
    }
  }

  public populateBots() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'POPULATE_BOTS' }));
    } else {
      this.spawnLocalSquadAndEnemies();
      this.emit('ROOM_SYNC', this.currentRoom);
    }
  }

  public spawnLocalSquadAndEnemies() {
    const factions: FactionId[] = ['AEGIS', 'VANGUARD'];
    const botNamesAegis = ['Praetor-Vance', 'Enforcer-Kael', 'Sentinel-Aria', 'Guardian-Reeve'];
    const botNamesVanguard = ['Rook-01', 'Ghost-Shadow', 'Wraith-Corvus', 'Blaze-Pyre'];

    // Ensure our player exists
    if (!this.currentRoom.players[this.playerId]) {
      this.currentRoom.players[this.playerId] = {
        id: this.playerId,
        name: this.playerName,
        faction: this.faction,
        role: 'LEADER',
        isBot: false,
        isHost: true,
        loadout: {
          primaryWeaponId: 'xm28_aether',
          secondaryWeaponId: 'g22_tactical',
          gadget1Id: 'frag_grenade',
          gadget2Id: 'deployable_shield',
          abilityId: 'odm_boost',
          role: 'LEADER',
        },
        position: [this.faction === 'AEGIS' ? -75 : 75, 1.5, 0],
        rotation: [0, this.faction === 'AEGIS' ? Math.PI / 2 : -Math.PI / 2, 0],
        velocity: [0, 0, 0],
        health: 100,
        maxHealth: 100,
        shield: 100,
        maxShield: 100,
        isDowned: false,
        downedTimer: 30,
        isCarryingCore: false,
        isEscortingVIP: false,
        inVehicleId: null,
        isVehicleDriver: false,
        activeWeaponSlot: 'primary',
        ammoPrimary: 32,
        ammoSecondary: 15,
        isReloading: false,
        reloadProgress: 0,
        abilityCooldown: 0,
        abilityActive: false,
        abilityDurationTimer: 0,
        gadget1Cooldown: 0,
        gadget2Cooldown: 0,
        odmHookActive: false,
        odmHookTarget: null,
        odmCableLength: 0,
        kills: 0,
        deaths: 0,
        recalls: 0,
        coresCaptured: 0,
        score: 0,
        ping: 1,
      };
    }

    factions.forEach((f) => {
      const existing = Object.values(this.currentRoom.players).filter((p) => p.faction === f);
      const needed = 4 - existing.length;
      for (let i = 0; i < needed; i++) {
        const botId = `bot_${f.toLowerCase()}_${i + 1}`;
        const nameList = f === 'AEGIS' ? botNamesAegis : botNamesVanguard;
        const name = nameList[i] || `Tactical-Unit-${i + 1}`;
        const spawnX = f === 'AEGIS' ? -75 : 75;

        this.currentRoom.players[botId] = {
          id: botId,
          name,
          faction: f,
          role: i === 0 ? 'LEADER' : i === 1 ? 'SCOUT' : i === 2 ? 'SUPPORT' : 'ASSAULT',
          isBot: true,
          isHost: false,
          loadout: {
            primaryWeaponId: i % 2 === 0 ? 'xm28_aether' : 'spectre9_smg',
            secondaryWeaponId: 'g22_tactical',
            gadget1Id: 'frag_grenade',
            gadget2Id: 'deployable_shield',
            abilityId: 'odm_boost',
            role: 'ASSAULT',
          },
          position: [spawnX, 1.5, (i - 1.5) * 8],
          rotation: [0, f === 'AEGIS' ? Math.PI / 2 : -Math.PI / 2, 0],
          velocity: [0, 0, 0],
          health: 100,
          maxHealth: 100,
          shield: 100,
          maxShield: 100,
          isDowned: false,
          downedTimer: 30,
          isCarryingCore: false,
          isEscortingVIP: false,
          inVehicleId: null,
          isVehicleDriver: false,
          activeWeaponSlot: 'primary',
          ammoPrimary: 32,
          ammoSecondary: 15,
          isReloading: false,
          reloadProgress: 0,
          abilityCooldown: 0,
          abilityActive: false,
          abilityDurationTimer: 0,
          gadget1Cooldown: 0,
          gadget2Cooldown: 0,
          odmHookActive: false,
          odmHookTarget: null,
          odmCableLength: 0,
          kills: 0,
          deaths: 0,
          recalls: 0,
          coresCaptured: 0,
          score: 0,
          ping: 2,
        };
      }
    });
  }

  public on(event: string, cb: NetworkEventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(cb);
  }

  public off(event: string, cb: NetworkEventCallback) {
    const list = this.listeners.get(event);
    if (list) {
      this.listeners.set(
        event,
        list.filter((l) => l !== cb)
      );
    }
  }

  public emit(event: string, data: any) {
    const list = this.listeners.get(event);
    if (list) {
      list.forEach((cb) => cb(data));
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.bc) {
      this.bc.close();
      this.bc = null;
    }
    clearInterval(this.pingInterval);
    this.isConnected = false;
  }
}
