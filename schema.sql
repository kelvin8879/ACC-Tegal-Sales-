-- Drop old tables if they exist to ensure a clean slate
DROP TABLE IF EXISTS coordinators CASCADE;
-- KITA HAPUS PERINTAH DROP UNTUK TABEL DATA AGAR CACHE SUPABASE TIDAK ERROR LAGI

-- Create Coordinators Table
CREATE TABLE IF NOT EXISTS coordinators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('master')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Sales Data Table (Stores all records from Excel uploads)
CREATE TABLE IF NOT EXISTS sales_data_v3 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    excel_id TEXT, -- ID from the Excel sheet
    source_type TEXT NOT NULL CHECK (source_type IN ('IN', 'VALID', 'BACKLOG')),
    tanggal DATE NOT NULL, -- The date of the data chosen by the coordinator during upload
    dealer TEXT,
    officer TEXT, -- Officer name matching the Excel sheets
    segment TEXT, -- Segment (Bronze, Flexi, Gold, Platinum, Solitaire, etc.)
    pengajuan TEXT, -- Pengajuan (Top Up, Non Top Up, etc.)
    status TEXT, -- Status/progress (e.g. On Progress, RE, NB, OV, DP OP)
    nama TEXT, -- Customer name
    no_reg TEXT, -- Registration number / Contract number
    wilayah TEXT, -- Area (Tegal, Pekalongan, dll)
    brand TEXT, -- Merek mobil (Toyota, Daihatsu, dll)
    acp TEXT, -- Status ACP (ACP, NonACP)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE coordinators ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_data_v3 ENABLE ROW LEVEL SECURITY;

-- Public read/write policies for MVP simplicity
DROP POLICY IF EXISTS "Allow public read access on coordinators" ON coordinators;
DROP POLICY IF EXISTS "Allow public insert access on coordinators" ON coordinators;
DROP POLICY IF EXISTS "Allow public update access on coordinators" ON coordinators;
DROP POLICY IF EXISTS "Allow public delete access on coordinators" ON coordinators;
CREATE POLICY "Allow public read access on coordinators" ON coordinators FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on coordinators" ON coordinators FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on coordinators" ON coordinators FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on coordinators" ON coordinators FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read access on sales_data_v3" ON sales_data_v3;
DROP POLICY IF EXISTS "Allow public insert access on sales_data_v3" ON sales_data_v3;
DROP POLICY IF EXISTS "Allow public update access on sales_data_v3" ON sales_data_v3;
DROP POLICY IF EXISTS "Allow public delete access on sales_data_v3" ON sales_data_v3;
CREATE POLICY "Allow public read access on sales_data_v3" ON sales_data_v3 FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on sales_data_v3" ON sales_data_v3 FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on sales_data_v3" ON sales_data_v3 FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on sales_data_v3" ON sales_data_v3 FOR DELETE USING (true);

-- Seed Initial Coordinators (Admin & User Baru)
INSERT INTO coordinators (email, password, role) VALUES
('admin@acc.co.id', 'admin123', 'master'),
('muhammad.iman@acc.co.id', 'passkembar', 'master')
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role;


