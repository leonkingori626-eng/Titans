/**
 * PROJECT: AETHER - Main Application Component
 * 4v4 Tactical Extraction Shooter
 */
import React, { useState, useEffect, useRef } from 'react';
import { GameEngine } from './game/engine';
import { NetworkManager } from './game/networking';
import { HUD } from './components/HUD';
import { Lobby } from './components/Lobby';
import { LoadoutBuilder } from './components/LoadoutBuilder';
import { FactionWarMap } from './components/FactionWarMap';
import { AfterActionReport } from './components/AfterActionReport';
import { 
  CameraViewMode, 
  FactionId, 
  GameMode, 
  MatchState, 
  PlayerLoadout, 
  PlayerState 
} from './types/game';
import { soundEngine } from './audio/soundEngine';

export default function App() {
  // Query params check for room code
  const initialRoom = new URLSearchParams(window.location.search).get('room') || 'AETH-7729';
  const [roomCode, setRoomCode] = useState(initialRoom.toUpperCase());
  const [playerName, setPlayerName] = useState('OPERATIVE-7');
  const [playerFaction, setPlayerFaction] = useState<FactionId>('AEGIS');
  const [gameMode, setGameMode] = useState<GameMode>('CORE_EXTRACTION');
  const [isOffline, setIsOffline] = useState(false);

  // Screen State
  const [viewState, setViewState] = useState<'LOBBY' | 'IN_GAME' | 'AAR'>('LOBBY');
  const [showLoadoutModal, setShowLoadoutModal] = useState(false);
  const [showFactionWarModal, setShowFactionWarModal] = useState(false);

  // Network & Engine Refs
  const networkRef = useRef<NetworkManager | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  // In-Game Tactical State
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [localPlayer, setLocalPlayer] = useState<PlayerState | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('FIRST_PERSON');
  const [hitmarkerActive, setHitmarkerActive] = useState(false);
  const [hitmarkerHeadshot, setHitmarkerHeadshot] = useState(false);
  const [recallProgress, setRecallProgress] = useState(0);

  // Custom player loadout
  const [currentLoadout, setCurrentLoadout] = useState<PlayerLoadout>({
    primaryWeaponId: 'xm28_aether',
    secondaryWeaponId: 'g22_tactical',
    gadget1Id: 'frag_grenade',
    gadget2Id: 'deployable_shield',
    abilityId: 'odm_boost',
    role: 'ASSAULT',
  });

  // Initialize Network Manager on Mount
  useEffect(() => {
    const net = new NetworkManager(roomCode, playerName, playerFaction);
    networkRef.current = net;

    net.on('CONNECTED', (data) => {
      setMatchState({ ...net.currentRoom });
      setLocalPlayer(net.currentRoom.players[net.playerId]);
    });

    net.on('ROOM_SYNC', (room: MatchState) => {
      setMatchState({ ...room });
      if (room.players[net.playerId]) {
        setLocalPlayer({ ...room.players[net.playerId] });
      }
      if (room.status === 'IN_PROGRESS' && viewState === 'LOBBY') {
        setViewState('IN_GAME');
      }
      if (room.status === 'EXTRACTION_COMPLETED' || room.status === 'TIME_EXPIRED') {
        setViewState('AAR');
      }
    });

    net.on('MATCH_STARTED', (room: MatchState) => {
      setMatchState({ ...room });
      setViewState('IN_GAME');
    });

    net.connect(roomCode, playerName, playerFaction, isOffline);

    return () => {
      net.disconnect();
    };
  }, []);

  // Update room/faction when changed in Lobby
  const handleSetRoomCode = (code: string) => {
    setRoomCode(code);
    if (networkRef.current) {
      networkRef.current.disconnect();
      networkRef.current.connect(code, playerName, playerFaction, isOffline);
    }
  };

  const handleSetFaction = (faction: FactionId) => {
    setPlayerFaction(faction);
    if (networkRef.current && localPlayer) {
      localPlayer.faction = faction;
      networkRef.current.faction = faction;
      networkRef.current.sendPlayerUpdate({ faction });
    }
  };

  const handleToggleOffline = (offline: boolean) => {
    setIsOffline(offline);
    if (networkRef.current) {
      networkRef.current.disconnect();
      networkRef.current.connect(roomCode, playerName, playerFaction, offline);
    }
  };

  const handlePopulateBots = () => {
    if (networkRef.current) {
      networkRef.current.populateBots();
      setMatchState({ ...networkRef.current.currentRoom });
    }
  };

  const handleSaveLoadout = (loadout: PlayerLoadout) => {
    setCurrentLoadout(loadout);
    if (networkRef.current) {
      networkRef.current.updateLoadout(loadout);
      if (localPlayer) {
        localPlayer.loadout = loadout;
        localPlayer.role = loadout.role;
      }
    }
  };

  // Launch Operation
  const handleStartMatch = () => {
    soundEngine.init();
    soundEngine.playRadioChirp();

    if (networkRef.current) {
      // Ensure bots are populated if fewer than 8 players
      const count = Object.keys(networkRef.current.currentRoom.players).length;
      if (count < 8) {
        networkRef.current.populateBots();
      }
      networkRef.current.startMatch();
    }
    setViewState('IN_GAME');
  };

  // Mount 3D Engine when in-game
  useEffect(() => {
    if (viewState === 'IN_GAME' && canvasContainerRef.current && networkRef.current) {
      // Destroy existing engine if any
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }

      const engine = new GameEngine(canvasContainerRef.current, networkRef.current, {
        onMatchStateUpdate: (state) => {
          setMatchState({ ...state });
          if (state.status === 'EXTRACTION_COMPLETED' || state.status === 'TIME_EXPIRED') {
            setViewState('AAR');
          }
        },
        onLocalPlayerUpdate: (player) => {
          setLocalPlayer({ ...player });
        },
        onLoudspeakerAnnouncement: (msg) => {
          soundEngine.announceLoudspeaker(msg);
        },
        onHitmarker: (headshot) => {
          setHitmarkerHeadshot(headshot);
          setHitmarkerActive(true);
          setTimeout(() => setHitmarkerActive(false), 90);
        },
      });

      engineRef.current = engine;

      return () => {
        engine.destroy();
        engineRef.current = null;
      };
    }
  }, [viewState]);

  // Sync recall progress from engine
  useEffect(() => {
    const interval = setInterval(() => {
      if (engineRef.current) {
        setRecallProgress(engineRef.current.recallProgressSec);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-screen h-screen bg-[#07090d] overflow-hidden select-none relative font-mono">
      {/* 1. LOBBY VIEW */}
      {viewState === 'LOBBY' && matchState && (
        <Lobby
          roomCode={roomCode}
          playerName={playerName}
          playerFaction={playerFaction}
          gameMode={gameMode}
          matchState={matchState}
          isOffline={isOffline}
          onSetRoomCode={handleSetRoomCode}
          onSetPlayerName={setPlayerName}
          onSetFaction={handleSetFaction}
          onSetGameMode={setGameMode}
          onToggleOffline={handleToggleOffline}
          onPopulateBots={handlePopulateBots}
          onOpenLoadout={() => setShowLoadoutModal(true)}
          onOpenFactionWar={() => setShowFactionWarModal(true)}
          onStartMatch={handleStartMatch}
        />
      )}

      {/* 2. IN-GAME 3D VIEW */}
      {viewState === 'IN_GAME' && (
        <div className="relative w-full h-full">
          {/* 3D WebGL Canvas Container */}
          <div ref={canvasContainerRef} className="w-full h-full cursor-crosshair" />

          {/* Tactical Combat HUD */}
          {matchState && localPlayer && (
            <HUD
              matchState={matchState}
              localPlayer={localPlayer}
              cameraMode={cameraMode}
              onToggleCamera={() => {
                if (engineRef.current) {
                  engineRef.current.toggleCameraMode();
                  setCameraMode(engineRef.current.cameraMode);
                }
              }}
              onTriggerOdm={() => engineRef.current?.triggerOdmGrapple()}
              onTriggerInteract={() => engineRef.current?.triggerInteractOrRecall()}
              onReload={() => engineRef.current?.startReload()}
              onSwitchWeapon={() => engineRef.current?.switchWeaponSlot()}
              onTouchMove={(delta) => {
                if (engineRef.current) engineRef.current.touchMoveDelta = delta;
              }}
              onTouchAim={(delta) => {
                if (engineRef.current) engineRef.current.touchAimDelta = delta;
              }}
              onTouchShoot={(shooting) => {
                if (engineRef.current) engineRef.current.isTouchShooting = shooting;
              }}
              hitmarkerActive={hitmarkerActive}
              hitmarkerHeadshot={hitmarkerHeadshot}
              recallProgress={recallProgress}
            />
          )}
        </div>
      )}

      {/* 3. AFTER ACTION REPORT (AAR) */}
      {viewState === 'AAR' && matchState && localPlayer && (
        <AfterActionReport
          matchState={matchState}
          localPlayer={localPlayer}
          onRematch={() => {
            if (networkRef.current) {
              networkRef.current.startMatch();
            }
            setViewState('IN_GAME');
          }}
          onReturnToLobby={() => {
            setViewState('LOBBY');
          }}
        />
      )}

      {/* MODALS */}
      {showLoadoutModal && (
        <LoadoutBuilder
          currentLoadout={currentLoadout}
          onSaveLoadout={handleSaveLoadout}
          onClose={() => setShowLoadoutModal(false)}
        />
      )}

      {showFactionWarModal && (
        <FactionWarMap
          playerFaction={playerFaction}
          userRankRating={1450}
          onDeployOperation={(mode) => {
            setGameMode(mode);
            handleStartMatch();
          }}
          onClose={() => setShowFactionWarModal(false)}
        />
      )}
    </div>
  );
}
