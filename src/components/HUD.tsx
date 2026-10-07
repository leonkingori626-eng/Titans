/**
 * Tactical Combat HUD Component
 * Responsive across Phones, Tablets, and Desktop PC.
 * Features integrated futuristic weapon optics, squad recall alerts,
 * radar minimap, and mobile touch controls.
 */
import React, { useState, useEffect, useRef } from 'react';
import { MatchState, PlayerState, CameraViewMode } from '../types/game';
import { WEAPONS_PRIMARY, WEAPONS_SECONDARY } from '../game/constants';
import { 
  Shield, 
  Heart, 
  Crosshair, 
  Camera, 
  RotateCcw, 
  Radio, 
  AlertTriangle, 
  Eye, 
  Zap, 
  Users, 
  Compass, 
  Flame, 
  Sparkles 
} from 'lucide-react';

interface HUDProps {
  matchState: MatchState;
  localPlayer: PlayerState;
  cameraMode: CameraViewMode;
  onToggleCamera: () => void;
  onTriggerOdm: () => void;
  onTriggerInteract: () => void;
  onReload: () => void;
  onSwitchWeapon: () => void;
  onTouchMove: (delta: { x: number; y: number }) => void;
  onTouchAim: (delta: { x: number; y: number }) => void;
  onTouchShoot: (isShooting: boolean) => void;
  hitmarkerActive: boolean;
  hitmarkerHeadshot: boolean;
  recallProgress: number; // 0 to 3
}

export const HUD: React.FC<HUDProps> = ({
  matchState,
  localPlayer,
  cameraMode,
  onToggleCamera,
  onTriggerOdm,
  onTriggerInteract,
  onReload,
  onSwitchWeapon,
  onTouchMove,
  onTouchAim,
  onTouchShoot,
  hitmarkerActive,
  hitmarkerHeadshot,
  recallProgress,
}) => {
  const isAegis = localPlayer.faction === 'AEGIS';
  const factionColor = isAegis ? '#00d2ff' : '#ff5500';
  const activeWeapon =
    localPlayer.activeWeaponSlot === 'primary'
      ? WEAPONS_PRIMARY.find((w) => w.id === localPlayer.loadout.primaryWeaponId) || WEAPONS_PRIMARY[0]
      : WEAPONS_SECONDARY.find((w) => w.id === localPlayer.loadout.secondaryWeaponId) || WEAPONS_SECONDARY[0];

  const currentAmmo = localPlayer.activeWeaponSlot === 'primary' ? localPlayer.ammoPrimary : localPlayer.ammoSecondary;

  // Touch joystick tracking
  const joystickRef = useRef<HTMLDivElement>(null);
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });

  const handleJoystickStart = (e: React.TouchEvent) => {
    setJoystickActive(true);
    handleJoystickMove(e);
  };

  const handleJoystickMove = (e: React.TouchEvent) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = rect.width / 2;

    let dx = touch.clientX - centerX;
    let dy = touch.clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setJoystickPos({ x: dx, y: dy });
    // Normalize to -1 to 1
    onTouchMove({ x: dx / maxRadius, y: -dy / maxRadius });
  };

  const handleJoystickEnd = () => {
    setJoystickActive(false);
    setJoystickPos({ x: 0, y: 0 });
    onTouchMove({ x: 0, y: 0 });
  };

  // Right touch aim swipe area
  const lastTouchAimPos = useRef<{ x: number; y: number } | null>(null);

  const handleAimTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    lastTouchAimPos.current = { x: t.clientX, y: t.clientY };
  };

  const handleAimTouchMove = (e: React.TouchEvent) => {
    if (!lastTouchAimPos.current) return;
    const t = e.touches[0];
    const dx = t.clientX - lastTouchAimPos.current.x;
    const dy = t.clientY - lastTouchAimPos.current.y;
    lastTouchAimPos.current = { x: t.clientX, y: t.clientY };
    onTouchAim({ x: dx, y: dy });
  };

  const handleAimTouchEnd = () => {
    lastTouchAimPos.current = null;
  };

  // Squad Members
  const squadMembers = Object.values(matchState.players).filter((p) => p.faction === localPlayer.faction);

  // Time format
  const mins = Math.floor(matchState.timeRemainingSec / 60);
  const secs = Math.floor(matchState.timeRemainingSec % 60);
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const isEnemyCoreCarried =
    (localPlayer.faction === 'AEGIS' && matchState.vanguardCore.state === 'BREACHED_CARRIED') ||
    (localPlayer.faction === 'VANGUARD' && matchState.aegisCore.state === 'BREACHED_CARRIED');

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 font-mono overflow-hidden">
      {/* Dynamic Scanlines Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-transparent pointer-events-none opacity-40"></div>

      {/* --- TOP HEADER: MISSION CLOCK, CORES & SCOREBOARD --- */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-6 px-6 py-2.5 bg-black/80 backdrop-blur-md border border-neutral-800 rounded-sm shadow-2xl">
        {/* Aegis Side */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-bold tracking-wider text-cyan-400">THE AEGIS</div>
            <div className="text-lg font-extrabold text-cyan-300">{matchState.scores.AEGIS}</div>
          </div>
          <div
            className={`w-3.5 h-3.5 rounded-full ${
              matchState.aegisCore.state === 'BREACHED_CARRIED'
                ? 'bg-red-500 animate-ping'
                : 'bg-cyan-400 shadow-[0_0_12px_#00d2ff]'
            }`}
            title="Aegis Energy Core"
          />
        </div>

        {/* Central Operation Clock */}
        <div className="flex flex-col items-center px-4 border-x border-neutral-700">
          <span className="text-[10px] tracking-widest text-neutral-400 uppercase">OPERATION TIME</span>
          <span className="text-xl font-bold tracking-wider text-neutral-100">{timeFormatted}</span>
        </div>

        {/* Vanguard Side */}
        <div className="flex items-center gap-3">
          <div
            className={`w-3.5 h-3.5 rounded-full ${
              matchState.vanguardCore.state === 'BREACHED_CARRIED'
                ? 'bg-red-500 animate-ping'
                : 'bg-orange-500 shadow-[0_0_12px_#ff5500]'
            }`}
            title="Vanguard Energy Core"
          />
          <div className="text-left">
            <div className="text-xs font-bold tracking-wider text-orange-400">THE VANGUARD</div>
            <div className="text-lg font-extrabold text-orange-300">{matchState.scores.VANGUARD}</div>
          </div>
        </div>
      </div>

      {/* --- TOP RIGHT: TACTICAL MINIMAP RADAR & CAMERA TOGGLE --- */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
        {/* Radar Map */}
        <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-md bg-black/85 border border-neutral-800 p-2 relative shadow-lg">
          <div className="absolute inset-2 border border-neutral-800/80 rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-neutral-600 rounded-full"></div>
            {/* Radar sweep animation */}
            <div className="absolute w-full h-0.5 bg-cyan-500/30 animate-spin origin-center"></div>
          </div>

          {/* Minimap blips */}
          {squadMembers.map((m) => {
            const rx = 50 + (m.position[0] / 150) * 40;
            const rz = 50 + (m.position[2] / 150) * 40;
            return (
              <div
                key={m.id}
                style={{ left: `${rx}%`, top: `${rz}%` }}
                className={`absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                  m.id === localPlayer.id ? 'bg-green-400 ring-2 ring-green-500' : 'bg-cyan-400'
                }`}
                title={m.name}
              />
            );
          })}

          {/* Titan Radar Signature */}
          {matchState.titan && matchState.titan.health > 0 && (
            <div
              style={{
                left: `${50 + (matchState.titan.position[0] / 150) * 40}%`,
                top: `${50 + (matchState.titan.position[2] / 150) * 40}%`,
              }}
              className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full animate-ping"
              title="TITAN GOLIATH"
            />
          )}
          <span className="absolute bottom-1 right-2 text-[9px] text-neutral-500 uppercase tracking-widest">
            RADAR 280M
          </span>
        </div>

        {/* Camera Toggle Button (1st / 3rd Person) */}
        <button
          onClick={onToggleCamera}
          className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs rounded transition-colors shadow"
        >
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          <span>{cameraMode === 'FIRST_PERSON' ? 'FPS VIEW' : 'OTS 3RD VIEW'} (V)</span>
        </button>
      </div>

      {/* --- TOP LEFT: SQUAD STATUS & NEURAL RECALL ALERTS --- */}
      <div className="absolute top-4 left-4 flex flex-col gap-1.5 max-w-[220px]">
        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-300 tracking-wider">
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          <span>SQUAD ALPHA (4V4)</span>
        </div>

        {squadMembers.map((squad) => (
          <div
            key={squad.id}
            className={`p-1.5 rounded bg-black/75 border ${
              squad.isDowned
                ? 'border-red-500 bg-red-950/40 animate-pulse'
                : squad.id === localPlayer.id
                ? 'border-cyan-500/50'
                : 'border-neutral-800'
            }`}
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold truncate text-neutral-200">
                {squad.name} {squad.id === localPlayer.id && '(YOU)'}
              </span>
              <span className="text-[10px] text-neutral-400">{squad.role}</span>
            </div>
            {squad.isDowned ? (
              <div className="text-[10px] font-bold text-red-400 mt-0.5 flex items-center justify-between">
                <span>DOWNED - RECALL</span>
                <span>{Math.ceil(squad.downedTimer)}s</span>
              </div>
            ) : (
              <div className="w-full bg-neutral-800 h-1 rounded overflow-hidden mt-1">
                <div
                  className="bg-cyan-400 h-full transition-all"
                  style={{ width: `${squad.health}%` }}
                />
              </div>
            )}
          </div>
        ))}

        {/* Recall Channeling Progress Bar */}
        {recallProgress > 0 && (
          <div className="mt-2 p-2 bg-black/90 border border-emerald-500 rounded text-center">
            <div className="text-xs font-bold text-emerald-400">RECALLING SQUADMATE...</div>
            <div className="w-full bg-neutral-800 h-2 rounded overflow-hidden mt-1">
              <div
                className="bg-emerald-400 h-full transition-all"
                style={{ width: `${(recallProgress / 3) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* --- CENTER: CROSSHAIR, HITMARKER & ODM RETICLE --- */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Tactical Crosshair */}
        <div className="relative w-8 h-8 flex items-center justify-center">
          <div className="absolute w-2 h-0.5 bg-cyan-400/80 -top-1"></div>
          <div className="absolute w-2 h-0.5 bg-cyan-400/80 -bottom-1"></div>
          <div className="absolute h-2 w-0.5 bg-cyan-400/80 -left-1"></div>
          <div className="absolute h-2 w-0.5 bg-cyan-400/80 -right-1"></div>
          <div className="w-1 h-1 bg-cyan-300 rounded-full"></div>

          {/* Hitmarker Flash */}
          {hitmarkerActive && (
            <div className="absolute inset-0 flex items-center justify-center scale-150 animate-ping">
              <span className={`text-xl font-black ${hitmarkerHeadshot ? 'text-red-500' : 'text-neutral-100'}`}>
                ✕
              </span>
            </div>
          )}

          {/* ODM Wire Target Indicator */}
          {localPlayer.odmHookActive && (
            <div className="absolute -inset-4 border-2 border-dashed border-teal-400 rounded-full animate-spin"></div>
          )}
        </div>
      </div>

      {/* --- CENTER BOTTOM: OBJECTIVE NOTIFICATION BANNER --- */}
      {isEnemyCoreCarried && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-6 py-2 bg-red-950/80 border border-red-500/80 rounded flex items-center gap-3 backdrop-blur shadow-2xl animate-pulse">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-xs sm:text-sm font-bold text-red-200 uppercase tracking-wider">
            ENERGY CORE BREACHED • ESCORT CARRIER TO EXTRACTION LZ
          </span>
        </div>
      )}

      {/* --- BOTTOM LEFT: HEALTH, SHIELD, RECALL & ODM PROMPTS --- */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2">
        {/* Health & Shield Bars */}
        <div className="p-3 bg-black/85 backdrop-blur-md border border-neutral-800 rounded-sm shadow-xl min-w-[210px]">
          {/* Shield Bar */}
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <Shield className="w-3.5 h-3.5" /> SHIELD
            </span>
            <span className="text-cyan-300 font-bold">{Math.ceil(localPlayer.shield)}%</span>
          </div>
          <div className="w-full bg-neutral-900 h-2 rounded overflow-hidden mb-2">
            <div
              className="bg-cyan-400 h-full transition-all duration-150"
              style={{ width: `${localPlayer.shield}%` }}
            />
          </div>

          {/* Health Bar */}
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5 text-red-400 font-bold">
              <Heart className="w-3.5 h-3.5" /> VITALITY
            </span>
            <span className="text-red-300 font-bold">{Math.ceil(localPlayer.health)}%</span>
          </div>
          <div className="w-full bg-neutral-900 h-2 rounded overflow-hidden">
            <div
              className={`h-full transition-all duration-150 ${
                localPlayer.health < 30 ? 'bg-red-600 animate-pulse' : 'bg-emerald-500'
              }`}
              style={{ width: `${localPlayer.health}%` }}
            />
          </div>
        </div>

        {/* Tactical Keybind Prompts (PC Desktop) */}
        <div className="hidden md:flex items-center gap-2 text-[10px] text-neutral-400">
          <span className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-700 rounded text-neutral-200">
            SPACE/E
          </span>
          <span>ODM WIRE ZIP</span>
          <span className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-700 rounded text-neutral-200">
            F
          </span>
          <span>RECALL / INTERACT</span>
          <span className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-700 rounded text-neutral-200">
            R
          </span>
          <span>RELOAD</span>
        </div>
      </div>

      {/* --- BOTTOM RIGHT: WEAPON AMMO, FIRE MODE & ABILITIES --- */}
      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2">
        <div className="p-3 bg-black/85 backdrop-blur-md border border-neutral-800 rounded-sm shadow-xl min-w-[210px] text-right">
          <div className="text-xs font-bold text-neutral-400 tracking-wider uppercase mb-1">
            {activeWeapon.name}
          </div>
          <div className="flex items-baseline justify-end gap-2">
            <span className="text-3xl font-black text-neutral-100">{currentAmmo}</span>
            <span className="text-neutral-500 font-bold text-sm">/ {activeWeapon.magSize}</span>
          </div>
          <div className="text-[10px] text-cyan-400 mt-1 uppercase tracking-widest font-semibold">
            {localPlayer.isReloading ? 'RELOADING OPTICS...' : 'AUTO-FIRE • AETHER ACCELERATED'}
          </div>
        </div>

        {/* Ability & Gadget Icons */}
        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1 rounded bg-black/80 border border-neutral-700 text-xs flex items-center gap-1.5 ${
              localPlayer.odmHookActive ? 'border-teal-400 text-teal-300' : 'text-neutral-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>ODM TETHER</span>
          </div>
          <button
            onClick={onSwitchWeapon}
            className="pointer-events-auto px-3 py-1 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-xs rounded text-neutral-200 transition"
          >
            SWITCH (Q)
          </button>
        </div>
      </div>

      {/* --- MOBILE TOUCH CONTROLS (PHONES & TABLETS) --- */}
      <div className="md:hidden">
        {/* Left Virtual Movement Joystick */}
        <div
          ref={joystickRef}
          onTouchStart={handleJoystickStart}
          onTouchMove={handleJoystickMove}
          onTouchEnd={handleJoystickEnd}
          className="pointer-events-auto absolute bottom-8 left-8 w-28 h-28 rounded-full bg-black/40 border-2 border-neutral-700/60 backdrop-blur-sm flex items-center justify-center touch-none"
        >
          <div
            style={{
              transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
            }}
            className="w-12 h-12 rounded-full bg-cyan-500/80 shadow-[0_0_15px_#00d2ff] transition-transform duration-75"
          />
        </div>

        {/* Right Aim Swipe Zone */}
        <div
          onTouchStart={handleAimTouchStart}
          onTouchMove={handleAimTouchMove}
          onTouchEnd={handleAimTouchEnd}
          className="pointer-events-auto absolute top-20 right-0 bottom-36 left-1/2 touch-none"
        />

        {/* Right Mobile Action Buttons */}
        <div className="pointer-events-auto absolute bottom-8 right-6 flex flex-col items-end gap-3">
          <div className="flex items-center gap-3">
            {/* ODM Grapple Button */}
            <button
              onClick={onTriggerOdm}
              className="w-14 h-14 rounded-full bg-teal-600/90 active:bg-teal-500 border border-teal-300 text-white flex flex-col items-center justify-center shadow-lg active:scale-95"
            >
              <Zap className="w-5 h-5" />
              <span className="text-[9px] font-bold">ODM</span>
            </button>

            {/* Interact / Recall Button */}
            <button
              onClick={onTriggerInteract}
              className="w-14 h-14 rounded-full bg-neutral-800/90 active:bg-neutral-700 border border-neutral-500 text-white flex flex-col items-center justify-center shadow-lg active:scale-95"
            >
              <Users className="w-5 h-5 text-emerald-400" />
              <span className="text-[9px] font-bold">RECALL</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Reload Button */}
            <button
              onClick={onReload}
              className="w-12 h-12 rounded-full bg-neutral-900/90 border border-neutral-700 text-white flex items-center justify-center shadow active:scale-95"
            >
              <RotateCcw className="w-4 h-4 text-cyan-400" />
            </button>

            {/* Shoot Button */}
            <button
              onTouchStart={() => onTouchShoot(true)}
              onTouchEnd={() => onTouchShoot(false)}
              className="w-20 h-20 rounded-full bg-red-600/90 active:bg-red-500 border-2 border-red-400 text-white flex flex-col items-center justify-center shadow-[0_0_20px_rgba(255,0,0,0.5)] active:scale-95"
            >
              <Crosshair className="w-7 h-7" />
              <span className="text-[10px] font-extrabold tracking-wider">FIRE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
