import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// In-memory store fallback for meetings, participants, messages, notes, and polls
export const inMemoryStore = {
  meetings: new Map(), // roomId -> meeting object
  participants: new Map(), // socketId -> participant object
  messages: new Map(), // roomId -> array of messages
  polls: new Map(), // roomId -> array of polls
  notes: new Map(), // roomId -> string
  history: [],
  otpCodes: new Map(), // email -> { code, expiresAt, createdAt }
  scheduledMeetings: new Map(), // scheduleId -> scheduled meeting object
  emailLogs: [], // Array of dispatched reminder emails
  users: new Map() // email -> user profile
};

let pool = null;
let isPostgresAvailable = false;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 3000,
    });

    pool.on('error', (err) => {
      console.warn('⚠️  PostgreSQL client pool error:', err.message);
      isPostgresAvailable = false;
    });

    // Test connection asynchronously
    pool.query('SELECT NOW()')
      .then(() => {
        isPostgresAvailable = true;
        console.log('✅ PostgreSQL connected successfully to:', process.env.DATABASE_URL.split('@')[1] || 'database');
      })
      .catch((err) => {
        console.warn('ℹ️  PostgreSQL not reachable or credentials require setup (' + err.message + '). Utilizing resilient in-memory store.');
        isPostgresAvailable = false;
      });
  } catch (err) {
    console.warn('ℹ️  PostgreSQL pool initialization skipped. Operating in resilient in-memory mode.');
    isPostgresAvailable = false;
  }
} else {
  console.log('ℹ️  DATABASE_URL not set. Running with built-in in-memory store.');
}

export const query = async (text, params) => {
  if (isPostgresAvailable && pool) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      console.warn('DB query error, falling back to memory store:', err.message);
    }
  }
  return null;
};

// High-level meeting management helpers that support both DB and in-memory fallback
export const dbService = {
  async createMeeting(roomId, title, hostName, hostSocketId) {
    const meeting = {
      roomId,
      title: title || "Chakri's Meeting",
      hostName,
      hostSocketId,
      status: 'active',
      isLocked: false,
      createdAt: new Date().toISOString(),
      participants: []
    };
    inMemoryStore.meetings.set(roomId, meeting);
    inMemoryStore.messages.set(roomId, []);
    inMemoryStore.polls.set(roomId, []);
    inMemoryStore.notes.set(roomId, "");

    if (isPostgresAvailable) {
      try {
        await query(
          `INSERT INTO meetings (room_id, title, host_name, host_socket_id) 
           VALUES ($1, $2, $3, $4) ON CONFLICT (room_id) DO NOTHING`,
          [roomId, meeting.title, hostName, hostSocketId]
        );
      } catch (e) {
        // Table might not exist yet if user hasn't run schema.sql
      }
    }
    return meeting;
  },

  async getMeeting(roomId) {
    if (inMemoryStore.meetings.has(roomId)) {
      return inMemoryStore.meetings.get(roomId);
    }
    if (isPostgresAvailable) {
      try {
        const res = await query('SELECT * FROM meetings WHERE room_id = $1', [roomId]);
        if (res && res.rows.length > 0) {
          const row = res.rows[0];
          const meeting = {
            roomId: row.room_id,
            title: row.title,
            hostName: row.host_name,
            hostSocketId: row.host_socket_id,
            status: row.status,
            isLocked: row.is_locked,
            createdAt: row.created_at,
            participants: []
          };
          inMemoryStore.meetings.set(roomId, meeting);
          return meeting;
        }
      } catch (e) {
        // Ignore fallback
      }
    }
    return null;
  },

  async endMeeting(roomId) {
    const meeting = inMemoryStore.meetings.get(roomId);
    if (meeting) {
      meeting.status = 'ended';
      meeting.endedAt = new Date().toISOString();
    }
    if (isPostgresAvailable) {
      try {
        await query('UPDATE meetings SET status = $1, ended_at = NOW() WHERE room_id = $2', ['ended', roomId]);
      } catch (e) {}
    }
  },

  async saveMessage(roomId, senderName, senderId, message) {
    const msg = {
      id: Math.random().toString(36).substring(2, 9),
      roomId,
      senderName,
      senderId,
      message,
      sentAt: new Date().toISOString()
    };
    if (!inMemoryStore.messages.has(roomId)) {
      inMemoryStore.messages.set(roomId, []);
    }
    inMemoryStore.messages.get(roomId).push(msg);

    if (isPostgresAvailable) {
      try {
        await query(
          `INSERT INTO meeting_messages (meeting_id, sender_name, sender_id, message) 
           SELECT id, $2, $3, $4 FROM meetings WHERE room_id = $1 LIMIT 1`,
          [roomId, senderName, senderId, message]
        );
      } catch (e) {}
    }
    return msg;
  },

  async getMessages(roomId) {
    return inMemoryStore.messages.get(roomId) || [];
  },

  async updateNotes(roomId, content) {
    inMemoryStore.notes.set(roomId, content);
    if (isPostgresAvailable) {
      try {
        await query(
          `INSERT INTO meeting_notes (meeting_id, content)
           SELECT id, $2 FROM meetings WHERE room_id = $1
           ON CONFLICT (meeting_id) DO UPDATE SET content = $2, updated_at = NOW()`,
          [roomId, content]
        );
      } catch (e) {}
    }
  },

  async getNotes(roomId) {
    return inMemoryStore.notes.get(roomId) || "";
  },

  // Authentication & OTP helpers
  saveOtp(email, code) {
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    inMemoryStore.otpCodes.set(email.toLowerCase(), {
      code,
      expiresAt,
      createdAt: new Date().toISOString()
    });
    return { email, code, expiresAt };
  },

  verifyOtp(email, code) {
    const record = inMemoryStore.otpCodes.get(email.toLowerCase());
    if (!record) return { valid: false, reason: 'No OTP requested for this email.' };
    if (Date.now() > record.expiresAt) {
      inMemoryStore.otpCodes.delete(email.toLowerCase());
      return { valid: false, reason: 'OTP has expired. Please request a new code.' };
    }
    if (record.code !== code.trim()) {
      return { valid: false, reason: 'Invalid 4-digit verification code.' };
    }
    // Delete OTP once used
    inMemoryStore.otpCodes.delete(email.toLowerCase());
    
    // Register or retrieve user profile
    let user = inMemoryStore.users.get(email.toLowerCase());
    if (!user) {
      user = {
        email: email.toLowerCase(),
        name: email.split('@')[0],
        avatarBg: 'from-amber-500 to-orange-600',
        joinedAt: new Date().toISOString()
      };
      inMemoryStore.users.set(email.toLowerCase(), user);
    }
    return { valid: true, user };
  },

  // Scheduled meeting helpers
  createScheduledMeeting(data) {
    const scheduleId = data.scheduleId || 'sch-' + Math.random().toString(36).substring(2, 9);
    const meeting = {
      scheduleId,
      roomId: data.roomId,
      title: data.title || "Chakri's Scheduled Discussion",
      hostName: data.hostName || 'Host',
      hostEmail: data.hostEmail ? data.hostEmail.toLowerCase() : '',
      participantEmails: Array.isArray(data.participantEmails) ? data.participantEmails : [],
      scheduledTime: data.scheduledTime, // ISO string or timestamp
      agenda: data.agenda || '',
      createdAt: new Date().toISOString(),
      status: 'scheduled',
      remindersSentCount: 0,
      lastReminderSentAt: null
    };

    inMemoryStore.scheduledMeetings.set(scheduleId, meeting);

    // Also register meeting room in dbService so roomId is instantly valid when joined
    this.createMeeting(data.roomId, meeting.title, meeting.hostName, null);

    return meeting;
  },

  getScheduledMeetings(userEmail) {
    const list = Array.from(inMemoryStore.scheduledMeetings.values());
    if (!userEmail) return list;
    const cleanEmail = userEmail.toLowerCase();
    return list.filter(m => 
      m.hostEmail === cleanEmail || 
      m.participantEmails.some(e => e.toLowerCase() === cleanEmail)
    );
  },

  recordEmailReminder(reminderData) {
    const record = {
      id: 'rem-' + Math.random().toString(36).substring(2, 9),
      ...reminderData,
      sentAt: new Date().toISOString()
    };
    inMemoryStore.emailLogs.push(record);

    if (reminderData.scheduleId && inMemoryStore.scheduledMeetings.has(reminderData.scheduleId)) {
      const sch = inMemoryStore.scheduledMeetings.get(reminderData.scheduleId);
      sch.remindersSentCount = (sch.remindersSentCount || 0) + 1;
      sch.lastReminderSentAt = record.sentAt;
    }
    return record;
  }
};

export default { query, dbService, inMemoryStore };
