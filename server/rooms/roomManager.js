import { dbService, inMemoryStore } from '../db/index.js';

class RoomManager {
  constructor() {
    this.maxParticipants = parseInt(process.env.MAX_PARTICIPANTS || '25', 10);
  }

  /**
   * Create a new room record or retrieve existing
   */
  async createRoom(roomId, title, hostName, hostSocketId) {
    if (!roomId) throw new Error('Room ID is required.');
    
    // Check if room already exists
    let existing = await this.getRoom(roomId);
    if (existing) {
      if (existing.status === 'ended') {
        // Re-activate or return ended
        existing.status = 'active';
      }
      return existing;
    }

    const newMeeting = await dbService.createMeeting(
      roomId,
      title || "Chakri's Meet",
      hostName || 'Host',
      hostSocketId
    );

    return newMeeting;
  }

  /**
   * Get room metadata
   */
  async getRoom(roomId) {
    if (!roomId) return null;
    return await dbService.getMeeting(roomId);
  }

  /**
   * Check if a room is full
   */
  isRoomFull(roomId, currentOccupancy) {
    return currentOccupancy >= this.maxParticipants;
  }

  /**
   * Lock or unlock a room
   */
  async setRoomLock(roomId, isLocked) {
    const room = await this.getRoom(roomId);
    if (room) {
      room.isLocked = Boolean(isLocked);
    }
    return room;
  }

  /**
   * End a room
   */
  async endRoom(roomId) {
    await dbService.endMeeting(roomId);
  }

  /**
   * Validate if user can join room
   */
  async validateJoin(roomId, isHost = false, currentOccupancy = 0) {
    if (!roomId || typeof roomId !== 'string') {
      return { allowed: false, reason: 'Invalid room identifier.' };
    }

    const room = await this.getRoom(roomId);
    if (room) {
      if (room.status === 'ended') {
        return { allowed: false, reason: 'This meeting has ended by the host.' };
      }
      if (room.isLocked && !isHost) {
        return { allowed: false, reason: 'This meeting is locked by the host.' };
      }
    }

    if (this.isRoomFull(roomId, currentOccupancy)) {
      return { allowed: false, reason: 'This meeting room is full.' };
    }

    return { allowed: true, room };
  }
}

export const roomManager = new RoomManager();
export default roomManager;
