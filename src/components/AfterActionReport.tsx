/**
 * PROJECT: AETHER - After Action Report (AAR)
 * Displays post-match operational summary, rank CSR adjustments,
 * extraction honors, and combat breakdown.
 */
import React from 'react';
import { FactionId, MatchState, PlayerState } from '../types/game';
import { Award, Trophy, Users, Shield, Flame, RotateCcw, ArrowRight } from 'lucide-react';

interface AfterActionReportProps {
  matchState: MatchState;
  localPlayer: PlayerState;
  onRematch: () => void;
  onReturnToLobby: () => void;
}

export const AfterActionReport: React.FC<AfterActionReportProps> = ({
  matchState,
  localPlayer,
  onRematch,
  onReturnToLobby,
}) => {
  const isWinner = matchState.winnerFaction === localPlayer.faction;
  const winnerFaction = matchState.winnerFaction || 'AEGIS';
  const isAegisWin = winnerFaction === 'AEGIS';

  // Calculate CSR adjustment
  const csrDelta = isWinner ? +35 + Math.floor(localPlayer.kills * 4) : -18;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg p-4 font-mono select-none">
      <div className="w-full max-w-3xl bg-neutral-950 border border-neutral-800 rounded-md shadow-2xl overflow-hidden flex flex-col">
        {/* Banner */}
        <div
          className={`py-8 px-6 text-center border-b ${
            isWinner
              ? 'bg-gradient-to-b from-emerald-950/40 to-transparent border-emerald-500/40'
              : 'bg-gradient-to-b from-red-950/40 to-transparent border-red-500/40'
          }`}
        >
          <div className="text-xs uppercase tracking-widest text-neutral-400 mb-2">OPERATION DEBRIEFING</div>
          <h1
            className={`text-4xl font-black tracking-wider ${
              isWinner ? 'text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'text-red-500'
            }`}
          >
            {isWinner ? 'EXTRACTION SUCCESS' : 'CONTAINMENT FAILED'}
          </h1>
          <p className="text-sm text-neutral-300 mt-2 font-semibold">
            {winnerFaction} HAS SECURED THE AETHER CORE AND RETRACTED TO SAFETY.
          </p>
        </div>

        {/* Combat Stats Grid */}
        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-neutral-900/30 border-b border-neutral-800">
          <div className="p-3 bg-black/50 border border-neutral-800 rounded text-center">
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest">HOSTILES NEUTRALIZED</span>
            <div className="text-2xl font-bold text-neutral-100 mt-1">{localPlayer.kills}</div>
          </div>
          <div className="p-3 bg-black/50 border border-neutral-800 rounded text-center">
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest">NEURAL RECALLS</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{localPlayer.recalls}</div>
          </div>
          <div className="p-3 bg-black/50 border border-neutral-800 rounded text-center">
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest">CORE EXTRACTIONS</span>
            <div className="text-2xl font-bold text-cyan-400 mt-1">{localPlayer.coresCaptured}</div>
          </div>
          <div className="p-3 bg-black/50 border border-neutral-800 rounded text-center">
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest">RANK RATING (CSR)</span>
            <div className={`text-2xl font-bold mt-1 ${csrDelta >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
              {csrDelta >= 0 ? `+${csrDelta}` : csrDelta}
            </div>
          </div>
        </div>

        {/* Squad Performance Table */}
        <div className="p-6 flex-1 overflow-y-auto max-h-[300px]">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
            SQUAD OPERATIONAL BREAKDOWN (8 PLAYERS 4V4)
          </h3>
          <div className="space-y-2">
            {Object.values(matchState.players).map((p) => (
              <div
                key={p.id}
                className={`p-2.5 rounded flex items-center justify-between text-xs border ${
                  p.faction === 'AEGIS'
                    ? 'border-cyan-900/50 bg-cyan-950/15'
                    : 'border-orange-900/50 bg-orange-950/15'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      p.faction === 'AEGIS' ? 'bg-cyan-400' : 'bg-orange-500'
                    }`}
                  />
                  <span className="font-bold text-neutral-200">
                    {p.name} {p.id === localPlayer.id && '(YOU)'}
                  </span>
                  <span className="text-[10px] text-neutral-500 uppercase px-1.5 py-0.5 bg-neutral-900 rounded">
                    {p.role}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-neutral-400">
                  <span>K: {p.kills}</span>
                  <span>D: {p.deaths}</span>
                  <span>RECALLS: {p.recalls}</span>
                  <span className="font-bold text-neutral-200">{p.score} PTS</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-neutral-800 bg-neutral-900/40 flex items-center justify-between">
          <button
            onClick={onReturnToLobby}
            className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs uppercase tracking-wider rounded transition"
          >
            RETURN TO WAR ROOM
          </button>
          <button
            onClick={onRematch}
            className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded transition flex items-center gap-2 shadow-lg active:scale-95"
          >
            <RotateCcw className="w-4 h-4" /> INITIATE NEXT OPERATION
          </button>
        </div>
      </div>
    </div>
  );
};
