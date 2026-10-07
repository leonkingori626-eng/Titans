/**
 * PROJECT: AETHER - WebSocket Multiplayer Game Server Handler
 * Synchronizes room sessions, 4v4 team rosters, objectives, and real-time player states.
 */
import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { MatchState, PlayerState, FactionId } from '../types/game';
import { INITIAL_MAP_CONFIG, createInitialMatchState } from '../game/constants';

interface ConnectedClient {
  ws: WebSocket;
  playerId: string;
  roomCode: string;
  lastPing: number;
}

class AetherGameServer {
  private rooms: Map<string, MatchState> = new Map();
  private clients: Map<WebSocket, ConnectedClient> = new Map();

  public attach(wss: WebSocketServer) {
    wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const url = new URL(req.url || '', 'http://localhost');
      const roomCode = (url.searchParams.get('room') || 'AETH-7729').toUpperCase();
      const playerId = url.searchParams.get('player') || 'p_' + Math.random().toString(36).substring(2, 7);
      const playerName = url.searchParams.get('name') || 'OPERATIVE';
      const faction = (url.searchParams.get('faction') || 'AEGIS') as FactionId;

      const clientInfo: ConnectedClient = {
        ws,
        playerId,
        roomCode,
        lastPing: Date.now(),
      };
      this.clients.set(ws, clientInfo);

      let room = this.rooms.get(roomCode);
      if (!room) {
        room = createInitialMatchState(roomCode, 'CORE_EXTRACTION');
        this.rooms.set(roomCode, room);
      }

      // Add or reconnect player
      if (!room.players[playerId]) {
        const teamCount = Object.values(room.players).filter((p) => p.faction === faction).length;
        const assignedTeam: FactionId = teamCount >= 4 ? (faction === 'AEGIS' ? 'VANGUARD' : 'AEGIS') : faction;
        const spawnX = assignedTeam === 'AEGIS' ? INITIAL_MAP_CONFIG.aegisStronghold.x + 10 : INITIAL_MAP_CONFIG.vanguardStronghold.x - 10;

        room.players[playerId] = {
          id: playerId,
          name: playerName,
          faction: assignedTeam,
          role: 'ASSAULT',
          isBot: false,
          isHost: Object.keys(room.players).length === 0,
          loadout: {
            primaryWeaponId: 'xm28_aether',
            secondaryWeaponId: 'g22_tactical',
            gadget1Id: 'frag_grenade',
            gadget2Id: 'deployable_shield',
            abilityId: 'odm_boost',
            role: 'ASSAULT',
          },
          position: [spawnX, 1.5, (Math.random() - 0.5) * 15],
          rotation: [0, assignedTeam === 'AEGIS' ? Math.PI / 2 : -Math.PI / 2, 0],
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
          ping: 15,
        };
      }

      // Send initial room snapshot
      ws.send(
        JSON.stringify({
          type: 'INIT_STATE',
          room,
          yourPlayerId: playerId,
        })
      );

      // Broadcast player joined
      this.broadcastToRoom(roomCode, {
        type: 'PLAYER_JOINED',
        player: room.players[playerId],
      });

      // Handle incoming messages
      ws.on('message', (data: string | Buffer) => {
        try {
          const packet = JSON.parse(data.toString());
          this.handlePacket(ws, clientInfo, packet);
        } catch {
          // ignore malformed
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        const r = this.rooms.get(roomCode);
        if (r && r.players[playerId]) {
          delete r.players[playerId];
          this.broadcastToRoom(roomCode, {
            type: 'PLAYER_LEFT',
            playerId,
          });
          if (Object.keys(r.players).length === 0) {
            this.rooms.delete(roomCode);
          }
        }
      });
    });

    // Start 20Hz room ticker
    setInterval(() => {
      this.tickRooms();
    }, 50);
  }

  private handlePacket(ws: WebSocket, client: ConnectedClient, packet: any) {
    const room = this.rooms.get(client.roomCode);
    if (!room) return;

    switch (packet.type) {
      case 'PING':
        ws.send(JSON.stringify({ type: 'PONG', timestamp: packet.timestamp }));
        break;

      case 'UPDATE_PLAYER_STATE':
        if (room.players[client.playerId]) {
          Object.assign(room.players[client.playerId], packet.state);
        }
        break;

      case 'START_MATCH':
        room.status = 'IN_PROGRESS';
        room.timeRemainingSec = 720;
        this.broadcastToRoom(client.roomCode, { type: 'MATCH_STARTED', room });
        break;

      case 'SET_LOADOUT':
        if (room.players[client.playerId]) {
          room.players[client.playerId].loadout = packet.loadout;
          room.players[client.playerId].role = packet.loadout.role;
        }
        break;

      case 'COMBAT_EVENT':
        room.combatFeed.unshift({
          id: 'evt_' + Math.random().toString(36).substring(2, 7),
          text: packet.text,
          timestamp: Date.now(),
          type: packet.eventType || 'kill',
        });
        if (room.combatFeed.length > 20) room.combatFeed.pop();
        this.broadcastToRoom(client.roomCode, { type: 'COMBAT_EVENT', feed: room.combatFeed[0] });
        break;

      case 'CORE_STATE_UPDATE':
        if (packet.faction === 'AEGIS') {
          Object.assign(room.aegisCore, packet.core);
        } else {
          Object.assign(room.vanguardCore, packet.core);
        }
        this.broadcastToRoom(client.roomCode, { type: 'SYNC_OBJECTIVES', aegisCore: room.aegisCore, vanguardCore: room.vanguardCore });
        break;

      case 'POPULATE_BOTS':
        this.fillBots(room);
        this.broadcastToRoom(client.roomCode, { type: 'ROOM_UPDATE', room });
        break;
    }
  }

  private fillBots(room: MatchState) {
    const factions: FactionId[] = ['AEGIS', 'VANGUARD'];
    const botNamesAegis = ['Aegis-Praetor-V', 'Aegis-Enforcer-7', 'Aegis-Sentinel-3', 'Aegis-Spectre-9'];
    const botNamesVanguard = ['Vanguard-Wraith-1', 'Vanguard-Rook-4', 'Vanguard-Blaze-8', 'Vanguard-Ghost-2'];

    factions.forEach((f) => {
      const existing = Object.values(room.players).filter((p) => p.faction === f);
      const needed = 4 - existing.length;
      for (let i = 0; i < needed; i++) {
        const botId = `bot_${f.toLowerCase()}_${i + 1}`;
        const nameList = f === 'AEGIS' ? botNamesAegis : botNamesVanguard;
        const name = nameList[i] || `Tactical-Unit-${i + 1}`;
        const spawnX = f === 'AEGIS' ? INITIAL_MAP_CONFIG.aegisStronghold.x + 10 : INITIAL_MAP_CONFIG.vanguardStronghold.x - 10;

        room.players[botId] = {
          id: botId,
          name,
          faction: f,
          role: i === 0 ? 'LEADER' : i === 1 ? 'SCOUT' : i === 2 ? 'SUPPORT' : 'ASSAULT',
          isBot: true,
          isHost: false,
          loadout: {
            primaryWeaponId: 'xm28_aether',
            secondaryWeaponId: 'g22_tactical',
            gadget1Id: 'frag_grenade',
            gadget2Id: 'deployable_shield',
            abilityId: 'odm_boost',
            role: 'ASSAULT',
          },
          position: [spawnX, 1.5, (Math.random() - 0.5) * 20],
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
          ping: 5,
        };
      }
    });
  }

  private tickRooms() {
    this.rooms.forEach((room, roomCode) => {
      if (room.status === 'IN_PROGRESS') {
        room.timeRemainingSec = Math.max(0, room.timeRemainingSec - 0.05);
        if (room.timeRemainingSec <= 0) {
          room.status = 'TIME_EXPIRED';
          room.winnerFaction = room.scores.AEGIS > room.scores.VANGUARD ? 'AEGIS' : 'VANGUARD';
        }
      }

      // Broadcast delta position updates
      const deltaPacket = {
        type: 'DELTA_TICK',
        timeRemainingSec: room.timeRemainingSec,
        scores: room.scores,
        players: room.players,
        aegisCore: room.aegisCore,
        vanguardCore: room.vanguardCore,
        titan: room.titan,
        vehicles: room.vehicles,
      };

      this.broadcastToRoom(roomCode, deltaPacket);
    });
  }

  private broadcastToRoom(roomCode: string, payload: any) {
    const json = JSON.stringify(payload);
    this.clients.forEach((c) => {
      if (c.roomCode === roomCode && c.ws.readyState === WebSocket.OPEN) {
        c.ws.send(json);
      }
    });
  }
}

export const aetherGameServer = new AetherGameServer();
