-- Create tables for AI Smart Note System (MySQL)

CREATE TABLE IF NOT EXISTS recordings (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255),
  file_path VARCHAR(500) NOT NULL,
  duration DECIMAL(10, 2) NOT NULL,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS summaries (
  id VARCHAR(36) PRIMARY KEY,
  recording_id VARCHAR(36) NOT NULL UNIQUE,
  summary_text LONGTEXT,
  key_points LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (recording_id) REFERENCES recordings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transcripts (
  id VARCHAR(36) PRIMARY KEY,
  recording_id VARCHAR(36) NOT NULL UNIQUE,
  transcript_text LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (recording_id) REFERENCES recordings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS qa_items (
  id VARCHAR(36) PRIMARY KEY,
  recording_id VARCHAR(36) NOT NULL,
  question_text TEXT NOT NULL,
  answer_text LONGTEXT,
  category VARCHAR(100),
  asked_by VARCHAR(255),
  answered_by VARCHAR(255),
  confidence DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (recording_id) REFERENCES recordings(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_recordings_created_at ON recordings(created_at);
CREATE INDEX IF NOT EXISTS idx_summaries_recording_id ON summaries(recording_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_recording_id ON transcripts(recording_id);
CREATE INDEX IF NOT EXISTS idx_qa_items_recording_id ON qa_items(recording_id);
CREATE INDEX IF NOT EXISTS idx_qa_items_category ON qa_items(category);
