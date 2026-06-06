/**
 * Mission Tracker — otomatis menyelesaikan objective berdasarkan aksi player
 * Dipanggil dari berbagai tempat (Mail, Terminal, World, Dialogue)
 */
import { useGameStore } from '../stores/gameStore';

type TriggerEvent =
  | { type: 'mail_read';      mailId: string }
  | { type: 'terminal_cmd';   command: string; output?: string }
  | { type: 'location_visit'; locationId: string }
  | { type: 'npc_talked';     npcId: string }
  | { type: 'item_collected'; itemId: string }
  | { type: 'scan_run' }
  | { type: 'analyze_run';    targetIp: string }
  | { type: 'computer_used' };

/**
 * Panggil ini setiap kali player melakukan sesuatu.
 * Fungsi ini akan cek semua active mission dan selesaikan objective yang cocok.
 */
export function triggerMissionEvent(event: TriggerEvent) {
  const store = useGameStore.getState();
  const { missions, activeMissionId, completeMissionObjective, completeMission, saveGame } = store;

  // Cek semua mission yang active atau available
  const activeMissions = missions.filter(
    (m) => m.status === 'active' || m.status === 'available'
  );

  let anyCompleted = false;

  for (const mission of activeMissions) {
    for (const obj of mission.objectives) {
      if (obj.completed) continue;

      let shouldComplete = false;

      switch (event.type) {
        case 'mail_read':
          if (obj.type === 'investigate' && obj.targetId === event.mailId) {
            shouldComplete = true;
          }
          break;

        case 'computer_used':
          if (obj.type === 'investigate' && obj.targetId === 'home-computer') {
            shouldComplete = true;
          }
          break;

        case 'scan_run':
          if (obj.type === 'scan' && (!obj.targetId || obj.targetId === 'home-computer')) {
            shouldComplete = true;
          }
          break;

        case 'analyze_run':
          if (obj.type === 'analyze') {
            shouldComplete = true;
          }
          if (obj.type === 'scan' && obj.targetId === 'home-computer') {
            shouldComplete = true;
          }
          break;

        case 'terminal_cmd':
          // Objective "trace email header" selesai saat scan + analyze dijalankan
          if (obj.type === 'scan' && obj.targetId === 'home-computer') {
            if (event.command === 'scan' || event.command === 'analyze') {
              shouldComplete = true;
            }
          }
          break;

        case 'location_visit':
          if (obj.type === 'visit' && obj.targetId === event.locationId) {
            shouldComplete = true;
          }
          break;

        case 'npc_talked':
          if (obj.type === 'talk' && obj.targetId === event.npcId) {
            shouldComplete = true;
          }
          break;

        case 'item_collected':
          if (obj.type === 'collect' && obj.targetId === event.itemId) {
            shouldComplete = true;
          }
          break;
      }

      if (shouldComplete) {
        completeMissionObjective(mission.id, obj.id);
        anyCompleted = true;
      }
    }

    // Cek apakah semua objective sudah selesai setelah update
    const updatedMission = useGameStore.getState().missions.find((m) => m.id === mission.id);
    if (updatedMission && updatedMission.objectives.every((o) => o.completed)) {
      if (updatedMission.status !== 'completed') {
        completeMission(mission.id);
        saveGame();
      }
    }
  }

  return anyCompleted;
}
