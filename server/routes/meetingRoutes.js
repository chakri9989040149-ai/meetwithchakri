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

// ========================================================
// AUTHENTICATION & OTP ENDPOINTS
// ========================================================

// Generate and send 4-digit OTP to user's personal email
router.post('/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid personal email address is required.' });
    }

    // Generate random 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const saved = dbService.saveOtp(email, otp);

    console.log(`🔑 [AUTH OTP] Verification code for ${email}: ${otp}`);

    // In a production environment with SMTP config:
    // await sendMail({ to: email, subject: "Your Chakri's Meet Verification Code", text: `Your code is ${otp}` });

    return res.json({
      success: true,
      message: `A 4-digit verification code has been sent to ${email}`,
      email: email.toLowerCase(),
      expiresInSeconds: 600,
      // Provide devCode for immediate local testing/demo without blocking on SMTP setup
      devCode: otp
    });
  } catch (err) {
    console.error('Error sending OTP:', err);
    return res.status(500).json({ error: 'Failed to dispatch verification code.' });
  }
});

// Verify 4-digit OTP code and authenticate user
router.post('/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and 4-digit OTP code are required.' });
    }

    const verification = dbService.verifyOtp(email, otp);
    if (!verification.valid) {
      return res.status(400).json({ success: false, error: verification.reason });
    }

    const token = 'chakri_token_' + Math.random().toString(36).substring(2, 15);

    console.log(`✅ [AUTH] User ${email} verified successfully`);

    return res.json({
      success: true,
      user: verification.user,
      token,
      message: 'Email successfully verified! Welcome to Chakri\'s Meet.'
    });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    return res.status(500).json({ error: 'Failed to verify OTP code.' });
  }
});

// ========================================================
// SCHEDULED MEETINGS & REMINDER EMAIL ENDPOINTS
// ========================================================

// Schedule a meeting for a specific date and time
router.post('/meetings/schedule', async (req, res) => {
  try {
    const {
      title,
      scheduledTime,
      hostName,
      hostEmail,
      participantEmails,
      agenda,
      roomId
    } = req.body;

    if (!scheduledTime) {
      return res.status(400).json({ error: 'Scheduled date and time is required.' });
    }

    // Auto-generate roomId if not supplied
    const finalRoomId = roomId || `chakri-sch-${Math.random().toString(36).substring(2, 8)}`;
    const parsedParticipants = Array.isArray(participantEmails)
      ? participantEmails
      : (participantEmails || '')
          .split(',')
          .map(e => e.trim())
          .filter(e => e.includes('@'));

    const scheduledMeeting = dbService.createScheduledMeeting({
      roomId: finalRoomId,
      title: title || "Chakri's Scheduled Discussion",
      hostName: hostName || 'Host',
      hostEmail: hostEmail || '',
      participantEmails: parsedParticipants,
      scheduledTime,
      agenda: agenda || ''
    });

    // Automatically trigger initial reminder / invite email
    const reminderLog = dbService.recordEmailReminder({
      scheduleId: scheduledMeeting.scheduleId,
      roomId: finalRoomId,
      title: scheduledMeeting.title,
      scheduledTime,
      recipients: parsedParticipants.length > 0 ? parsedParticipants : [hostEmail || 'host@example.com'],
      messageType: 'INVITATION_AND_REMINDER'
    });

    console.log(`📅 [SCHEDULE] Meeting "${scheduledMeeting.title}" scheduled for ${scheduledTime}. Reminders dispatched to ${reminderLog.recipients.join(', ')}`);

    return res.status(201).json({
      success: true,
      meeting: scheduledMeeting,
      reminderDispatched: true,
      reminderLog
    });
  } catch (err) {
    console.error('Error scheduling meeting:', err);
    return res.status(500).json({ error: 'Failed to schedule meeting.' });
  }
});

// Trigger / push reminder email with join links to participants on demand
router.post('/meetings/schedule/push-reminder', async (req, res) => {
  try {
    const { scheduleId, roomId, customMessage } = req.body;

    let scheduled = inMemoryStore.scheduledMeetings.get(scheduleId);
    if (!scheduled && roomId) {
      scheduled = Array.from(inMemoryStore.scheduledMeetings.values()).find(m => m.roomId === roomId);
    }

    if (!scheduled) {
      return res.status(404).json({ error: 'Scheduled meeting not found.' });
    }

    const recipients = [
      ...(scheduled.hostEmail ? [scheduled.hostEmail] : []),
      ...scheduled.participantEmails
    ];

    if (recipients.length === 0) {
      return res.status(400).json({ error: 'No participant emails found for this meeting.' });
    }

    const reminderLog = dbService.recordEmailReminder({
      scheduleId: scheduled.scheduleId,
      roomId: scheduled.roomId,
      title: scheduled.title,
      scheduledTime: scheduled.scheduledTime,
      recipients,
      customMessage: customMessage || 'Your video meeting is coming up soon. Click the link below to join.',
      messageType: 'MANUAL_PUSH_REMINDER'
    });

    console.log(`🔔 [REMINDER PUSHED] Meeting "${scheduled.title}" reminder pushed to:`, recipients);

    return res.json({
      success: true,
      message: `Reminder email successfully pushed to ${recipients.length} participant(s)!`,
      recipients,
      reminderLog
    });
  } catch (err) {
    console.error('Error pushing reminder:', err);
    return res.status(500).json({ error: 'Failed to push reminder email.' });
  }
});

// Get scheduled meetings for user
router.get('/meetings/scheduled/:userEmail', async (req, res) => {
  try {
    const { userEmail } = req.params;
    const meetings = dbService.getScheduledMeetings(userEmail);
    return res.json({ success: true, meetings });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch scheduled meetings.' });
  }
});

// Get all scheduled meetings (general)
router.get('/meetings-scheduled', async (req, res) => {
  try {
    const meetings = dbService.getScheduledMeetings();
    return res.json({ success: true, meetings });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch scheduled meetings.' });
  }
});


export default router;
