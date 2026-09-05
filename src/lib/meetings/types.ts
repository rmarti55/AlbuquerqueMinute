export type MeetingStatus = 'scheduled' | 'canceled';

export type MeetingFileInput = {
  type: string;
  url: string;
  name: string;
};

export type MeetingVideoInput = {
  granicusClipId?: number | null;
  youtubeId?: string | null;
  playerUrl?: string | null;
  matchMethod: string;
};

export type NormalizedMeeting = {
  source: string;
  sourceId: string;
  body: string;
  title: string;
  startAt: Date;
  status: MeetingStatus;
  sourceUrl?: string | null;
  agendaUrl?: string | null;
  location?: string | null;
  files?: MeetingFileInput[];
  /** Present = write/merge. Omit = leave existing video row alone. */
  video?: MeetingVideoInput | null;
};

export type SourceSyncCounts = {
  source: string;
  fetched: number;
  upserted: number;
  withVideo: number;
  error?: string;
};
