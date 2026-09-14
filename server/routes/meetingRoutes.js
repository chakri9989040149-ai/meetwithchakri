import express from 'express';
import { dbService, inMemoryStore } from '../db/index.js';

const router = express.Router();

// 1. Create a new meeting
router.post('/meetings', async (req, res) => {
  try {
    const { roomId, title, hostName } = req.body;
    if (!roomId) {
      return res.status(400).json({ error: 'Room ID is required.' });
    }

    const meeting = await dbService.createMeeting(
      roomId,
      title || "Chakri's Meet",
      hostName || 'Host',
      null
    );

    return res.status(201).json({
      success: true,
      meeting
    });
  } catch (err) {
    console.error('Error creating meeting:', err);
    return res.status(500).json({ error: 'Failed to create meeting.' });
  }
});

// 2. Validate and get meeting details
router.get('/meetings/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    let meeting = await dbService.getMeeting(roomId);

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found.' });
    }

    return res.json({
      success: true,
      meeting: {
        roomId: meeting.roomId,
        title: meeting.title,
        hostName: meeting.hostName,
        status: meeting.status,
        isLocked: meeting.isLocked,
        createdAt: meeting.createdAt
      }
    });
  } catch (err) {
    console.error('Error fetching meeting:', err);
    return res.status(500).json({ error: 'Failed to fetch meeting info.' });
  }
});

// 3. Get meeting chat messages
router.get('/meetings/:roomId/messages', async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await dbService.getMessages(roomId);
    return res.json({ success: true, messages });
  } catch (err) {
    console.error('Error fetching messages:', err);
    return res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// 4. Admin statistics & system metrics
router.get('/admin/stats', async (req, res) => {
  try {
    const activeMeetings = Array.from(inMemoryStore.meetings.values()).filter(m => m.status === 'active');
    const totalParticipants = inMemoryStore.participants.size;

    return res.json({
      success: true,
      stats: {
        activeMeetingsCount: activeMeetings.length,
        totalMeetingsCreated: inMemoryStore.meetings.size,
        currentOnlineUsers: totalParticipants,
        systemStatus: 'Operational',
        uptime: process.uptime()
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch admin stats.' });
  }
});

export default router;
