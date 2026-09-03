import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const meetings = pgTable(
  'meetings',
  {
    id: serial('id').primaryKey(),
    body: text('body').notNull(),
    title: text('title').notNull(),
    startAt: timestamp('start_at', { withTimezone: true }).notNull(),
    source: text('source').notNull().default('legistar'),
    sourceId: integer('source_id').notNull(),
    sourceUrl: text('source_url'),
    agendaUrl: text('agenda_url'),
    location: text('location'),
    status: text('status').notNull().default('scheduled'),
    syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    sourceIdIdx: uniqueIndex('meetings_source_id_idx').on(table.sourceId),
    startAtIdx: index('meetings_start_at_idx').on(table.startAt),
    bodyIdx: index('meetings_body_idx').on(table.body),
  }),
);

export const meetingVideos = pgTable(
  'meeting_videos',
  {
    id: serial('id').primaryKey(),
    meetingId: integer('meeting_id')
      .notNull()
      .references(() => meetings.id, { onDelete: 'cascade' }),
    granicusClipId: integer('granicus_clip_id'),
    youtubeId: text('youtube_id'),
    playerUrl: text('player_url'),
    matchMethod: text('match_method').notNull().default('legistar_event_media'),
    matchedAt: timestamp('matched_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    meetingIdx: index('meeting_videos_meeting_idx').on(table.meetingId),
  }),
);

export const meetingFiles = pgTable(
  'meeting_files',
  {
    id: serial('id').primaryKey(),
    meetingId: integer('meeting_id')
      .notNull()
      .references(() => meetings.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    url: text('url').notNull(),
    name: text('name'),
  },
  (table) => ({
    meetingIdx: index('meeting_files_meeting_idx').on(table.meetingId),
  }),
);

export const meetingTranscripts = pgTable(
  'meeting_transcripts',
  {
    id: serial('id').primaryKey(),
    meetingId: integer('meeting_id')
      .notNull()
      .references(() => meetings.id, { onDelete: 'cascade' }),
    videoId: integer('video_id')
      .notNull()
      .references(() => meetingVideos.id, { onDelete: 'cascade' }),
    rawTranscript: text('raw_transcript'),
    segmentsJson: text('segments_json'),
    status: text('status').notNull().default('pending'),
    transcriptSource: text('transcript_source'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    videoIdx: uniqueIndex('meeting_transcripts_video_idx').on(table.videoId),
    meetingIdx: index('meeting_transcripts_meeting_idx').on(table.meetingId),
    statusIdx: index('meeting_transcripts_status_idx').on(table.status),
  }),
);

export type Meeting = typeof meetings.$inferSelect;
export type MeetingVideo = typeof meetingVideos.$inferSelect;
export type MeetingFile = typeof meetingFiles.$inferSelect;
export type MeetingTranscript = typeof meetingTranscripts.$inferSelect;
export type TranscriptStatus = 'pending' | 'processing' | 'completed' | 'failed';
