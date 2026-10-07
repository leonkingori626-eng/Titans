/**
 * PROJECT: AETHER - War Room Lobby & Room Code Matchmaking
 * Supports 8 players (4v4), cross-device room codes, Internet/Offline modes,
 * Faction assignments, and Tactical AI bot filling.
 */
import React, { useState } from 'react';
import { FactionId, GameMode, MatchState, PlayerLoadout, SquadRole } from '../types/game';
import { FACTIONS_LORE } from '../game/constants';
import { 
  Shield, 
  Flame, 
  Users, 
  Wifi, 
  WifiOff, 
  Crosshair, 
  Sliders, 
  Globe, 
  Copy, 
  Check, 
  Play, 
  Bot, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Zap 
} from 'lucide-react';

interface LobbyProps {
  roomCode: string;
  playerName: string;
  playerFaction: FactionId;
  gameMode: GameMode;
  matchState: MatchState;
  isOffline: boolean;
  onSetRoomCode: (code: string) => void;
  onSetPlayerName: (name: string) => void;
  onSetFaction: (faction: FactionId) => void;
  onSetGameMode: (mode: GameMode) => void;
  onToggleOffline: (offline: boolean) => void;
  onPopulateBots: () => void;
  onOpenLoadout: () => void;
  onOpenFactionWar: () => void;
  onStartMatch: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  roomCode,
  playerName,
  playerFaction,
  gameMode,
  matchState,
  isOffline,
  onSetRoomCode,
  onSetPlayerName,
  onSetFaction,
  onSetGameMode,
  onToggleOffline,
  onPopulateBots,
  onOpenLoadout,
  onOpenFactionWar,
  onStartMatch,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [inputCode, setInputCode] = useState(roomCode);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(window.location.origin + '?room=' + roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const aegisPlayers = Object.values(matchState.players).filter((p) => p.faction === 'AEGIS');
  const vanguardPlayers = Object.values(matchState.players).filter((p) => p.faction === 'VANGUARD');

  return (
    <div className="min-h-screen bg-[#07090d] text-neutral-100 font-mono flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none relative overflow-x-hidden">
      {/* Background Graphic Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none"></div>

      {/* --- TOP BRANDING & CONNECTIVITY BAR --- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4 z-10">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 bg-cyan-950 border border-cyan-800 text-cyan-400 text-[10px] font-bold tracking-widest uppercase rounded">
              MILITARY EXTRACTION ENGINE
            </span>
            <span className="text-xs text-neutral-500 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              <Tablet className="w-3.5 h-3.5" />
              <Monitor className="w-3.5 h-3.5" />
              <span>PHONES • TABLETS • PC</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-neutral-100 mt-1">
            PROJECT: AETHER
          </h1>
          <p className="text-xs text-neutral-400">4v4 Tactical Infiltration & Core Extraction</p>
        </div>

        {/* Room Code & Mode Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Room Code Pill */}
          <div className="flex items-center bg-black/80 border border-neutral-800 rounded px-3 py-1.5 gap-2">
            <span className="text-[10px] text-neutral-500 uppercase">ROOM:</span>
            <span className="text-sm font-bold text-cyan-400 tracking-wider">{roomCode}</span>
            <button
              onClick={handleCopyCode}
              title="Copy share link"
              className="text-neutral-400 hover:text-cyan-300 transition"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Join other room input */}
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="ENTER CODE"
              className="w-24 sm:w-28 px-2 py-1.5 bg-neutral-900 border border-neutral-700 text-xs text-neutral-200 uppercase rounded focus:border-cyan-400 focus:outline-none"
            />
            <button
              onClick={() => onSetRoomCode(inputCode)}
              className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 rounded"
            >
              JOIN
            </button>
          </div>

          {/* Online vs Offline Toggle */}
          <button
            onClick={() => onToggleOffline(!isOffline)}
            className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 border transition ${
              isOffline
                ? 'bg-amber-950/40 border-amber-600 text-amber-300'
                : 'bg-emerald-950/40 border-emerald-600 text-emerald-300'
            }`}
          >
            {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            <span>{isOffline ? 'OFFLINE / BOT PRACTICE' : 'INTERNET MULTIPLAYER'}</span>
          </button>
        </div>
      </div>

      {/* --- MAIN SECTION: FACTION PICKER, OPERATIVE DETAILS & MODE --- */}
      <div className="my-6 grid grid-cols-1 lg:grid-cols-3 gap-6 z-10 flex-1">
        {/* Left Column: Operative Identity & Faction Choice */}
        <div className="flex flex-col gap-4 bg-neutral-950/80 border border-neutral-800 p-5 rounded-md">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-800 pb-2">
            1. OPERATIVE SPECIFICATION
          </h3>

          <div>
            <label className="text-[10px] text-neutral-500 uppercase tracking-widest block mb-1">CALLSIGN / NAME</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => onSetPlayerName(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 text-sm font-bold text-neutral-100 rounded focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-neutral-500 uppercase tracking-widest block mb-2">
              ALLEGIANCE FACTION
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* The Aegis */}
              <div
                onClick={() => onSetFaction('AEGIS')}
                className={`p-3.5 rounded border cursor-pointer transition flex flex-col justify-between ${
                  playerFaction === 'AEGIS'
                    ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_20px_rgba(0,210,255,0.2)]'
                    : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 text-cyan-400 font-extrabold text-sm">
                    <Shield className="w-4 h-4" /> THE AEGIS
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-1">"Order Preserves Life"</div>
                </div>
                <div className="text-[9px] text-neutral-500 mt-3 uppercase">Cyan Optics • High Armor</div>
              </div>

              {/* The Vanguard */}
              <div
                onClick={() => onSetFaction('VANGUARD')}
                className={`p-3.5 rounded border cursor-pointer transition flex flex-col justify-between ${
                  playerFaction === 'VANGUARD'
                    ? 'border-orange-500 bg-orange-950/30 shadow-[0_0_20px_rgba(255,85,0,0.2)]'
                    : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 text-orange-400 font-extrabold text-sm">
                    <Flame className="w-4 h-4" /> THE VANGUARD
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-1">"Power to Everyone"</div>
                </div>
                <div className="text-[9px] text-neutral-500 mt-3 uppercase">Amber Visors • Mobility</div>
              </div>
            </div>
          </div>

          {/* Operation Mode */}
          <div>
            <label className="text-[10px] text-neutral-500 uppercase tracking-widest block mb-2">
              OPERATION PARAMETERS
            </label>
            <div className="space-y-2">
              {[
                {
                  id: 'CORE_EXTRACTION',
                  name: 'AETHER CORE EXTRACTION',
                  desc: 'Infiltrate enemy stronghold, capture core, escape to Dropship LZ.',
                },
                {
                  id: 'VIP_EXTRACTION',
                  name: 'HUMAN VIP EXTRACTION',
                  desc: 'Breach detention chamber and escort Dr. Vance across hostile territory.',
                },
                {
                  id: 'OPERATION_BLACK_VEIL',
                  name: 'OPERATION BLACK VEIL (TITAN COMBAT)',
                  desc: 'Disable Goliath Proto-Titan vents with ODM wires while securing reactor.',
                },
              ].map((m) => (
                <div
                  key={m.id}
                  onClick={() => onSetGameMode(m.id as GameMode)}
                  className={`p-2.5 rounded border cursor-pointer transition ${
                    gameMode === m.id
                      ? 'border-cyan-400 bg-cyan-950/20'
                      : 'border-neutral-800 bg-neutral-900/30 hover:border-neutral-700'
                  }`}
                >
                  <div className="font-bold text-xs text-neutral-100">{m.name}</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">{m.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Buttons: Loadout & Faction War */}
          <div className="pt-2 border-t border-neutral-800 flex gap-2">
            <button
              onClick={onOpenLoadout}
              className="flex-1 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded text-xs font-bold text-neutral-200 flex items-center justify-center gap-1.5 transition"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>CUSTOM ARSENAL</span>
            </button>
            <button
              onClick={onOpenFactionWar}
              className="flex-1 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded text-xs font-bold text-neutral-200 flex items-center justify-center gap-1.5 transition"
            >
              <Globe className="w-3.5 h-3.5 text-orange-400" />
              <span>WAR MAP</span>
            </button>
          </div>
        </div>

        {/* Center/Right Column: 8-Player Tactical Rosters (4v4) */}
        <div className="lg:col-span-2 flex flex-col gap-4 bg-neutral-950/80 border border-neutral-800 p-5 rounded-md">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
              2. SQUAD ROSTER DEPLOYMENT (8 OPERATIVES • 4V4)
            </h3>
            <button
              onClick={onPopulateBots}
              className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-cyan-300 rounded flex items-center gap-1.5 transition"
            >
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              <span>AUTO-FILL TACTICAL BOTS</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {/* The Aegis Squad (4 slots) */}
            <div className="border border-cyan-900/40 bg-cyan-950/10 p-4 rounded flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-extrabold text-sm text-cyan-400 flex items-center gap-1.5">
                    <Shield className="w-4 h-4" /> AEGIS TASK FORCE
                  </span>
                  <span className="text-xs text-neutral-400">{aegisPlayers.length}/4 READY</span>
                </div>

                <div className="space-y-2">
                  {[0, 1, 2, 3].map((slotIdx) => {
                    const p = aegisPlayers[slotIdx];
                    return (
                      <div
                        key={slotIdx}
                        className={`p-2.5 rounded border text-xs flex items-center justify-between ${
                          p
                            ? 'border-cyan-800/80 bg-neutral-900/60'
                            : 'border-dashed border-neutral-800 text-neutral-600'
                        }`}
                      >
                        {p ? (
                          <>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-cyan-400" />
                              <span className="font-bold text-neutral-200">{p.name}</span>
                              {p.isBot && (
                                <span className="text-[9px] text-cyan-400 bg-cyan-950 px-1 py-0.5 rounded">
                                  AI
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-neutral-400 uppercase">{p.role}</span>
                          </>
                        ) : (
                          <span>SLOT {slotIdx + 1} • AWAITING OPERATIVE...</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="text-[10px] text-neutral-500 mt-4">
                BASE OBJECTIVE: Secure Sector 01 Pedestal & Extract Vanguard Core.
              </div>
            </div>

            {/* The Vanguard Squad (4 slots) */}
            <div className="border border-orange-900/40 bg-orange-950/10 p-4 rounded flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-extrabold text-sm text-orange-400 flex items-center gap-1.5">
                    <Flame className="w-4 h-4" /> VANGUARD TASK FORCE
                  </span>
                  <span className="text-xs text-neutral-400">{vanguardPlayers.length}/4 READY</span>
                </div>

                <div className="space-y-2">
                  {[0, 1, 2, 3].map((slotIdx) => {
                    const p = vanguardPlayers[slotIdx];
                    return (
                      <div
                        key={slotIdx}
                        className={`p-2.5 rounded border text-xs flex items-center justify-between ${
                          p
                            ? 'border-orange-800/80 bg-neutral-900/60'
                            : 'border-dashed border-neutral-800 text-neutral-600'
                        }`}
                      >
                        {p ? (
                          <>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-orange-500" />
                              <span className="font-bold text-neutral-200">{p.name}</span>
                              {p.isBot && (
                                <span className="text-[9px] text-orange-400 bg-orange-950 px-1 py-0.5 rounded">
                                  AI
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-neutral-400 uppercase">{p.role}</span>
                          </>
                        ) : (
                          <span>SLOT {slotIdx + 1} • AWAITING OPERATIVE...</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="text-[10px] text-neutral-500 mt-4">
                BASE OBJECTIVE: Breach Sector 04 Bastion & Extract Aegis Core.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- FOOTER: OPERATION DEPLOY BUTTON --- */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-800 pt-4 z-10">
        <div className="text-xs text-neutral-400">
          <span className="text-cyan-400 font-bold">CONTROLS:</span> PC: [WASD] Move • [Mouse] Aim • [Click] Fire • [Space/E] ODM Wire • [F] Recall/Vehicles • [V] 1st/3rd Person. Touch: Dual Joysticks & buttons on screen.
        </div>

        <button
          onClick={onStartMatch}
          className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 active:scale-95 text-neutral-950 font-black text-sm tracking-wider uppercase rounded shadow-[0_0_30px_rgba(0,210,255,0.4)] transition flex items-center justify-center gap-3"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>DEPLOY TO BATTLEFIELD</span>
        </button>
      </div>
    </div>
  );
};
