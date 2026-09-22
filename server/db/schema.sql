-- EIC-SiteSight Database Schema
-- Run this in psql or pgAdmin after creating the database

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS defect_reports (
  id SERIAL PRIMARY KEY,
  defect_type VARCHAR(100) NOT NULL,
  materials_required TEXT,
  notes TEXT,
  photo_path VARCHAR(500),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Ongoing', 'Done')),
  submitted_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default admin user (password: admin123)
-- Change this password immediately after first login
INSERT INTO users (email, password_hash)
VALUES ('admin@eicadvance.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (email) DO NOTHING;
