-- Creazione tabella bookings per Supabase
-- Esegui questo script nel SQL Editor di Supabase

CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  start TIME NOT NULL,
  "end" TIME NOT NULL,
  title TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per migliorare le performance
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_date_time ON bookings(date, start, "end");

-- RLS (Row Level Security) - opzionale, per ora disabilitato
-- ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policy per permettere lettura a tutti (per ora)
-- CREATE POLICY "Allow public read access" ON bookings FOR SELECT USING (true);

-- Policy per permettere inserimento a tutti (per ora)
-- CREATE POLICY "Allow public insert access" ON bookings FOR INSERT WITH CHECK (true);

-- Policy per permettere cancellazione a tutti (per ora)
-- CREATE POLICY "Allow public delete access" ON bookings FOR DELETE USING (true);

-- Inserimento dati di esempio (opzionale)
INSERT INTO bookings (date, start, "end", title, customer_name, customer_phone, customer_email) VALUES
('2025-01-21', '09:00', '11:00', 'Allenamento calcio', 'Società Sportiva Piedelpoggio', '0746123456', 'info@piedelpoggio.it'),
('2025-01-21', '15:30', '17:00', 'Scuola calcio', 'Società Sportiva Piedelpoggio', '0746123456', 'info@piedelpoggio.it'),
('2025-01-22', '18:00', '20:00', 'Partita amichevole', 'ASD Leonessa', '0746654321', 'asd.leonessa@email.it'),
('2025-01-23', '07:00', '08:30', 'Manutenzione campo', 'Comune di Leonessa', '0746987654', 'tecnico@comune.leonessa.ri.it'),
('2025-01-23', '10:00', '12:00', 'Torneo giovanile', 'Oratorio San Giuseppe', '0746111222', 'oratorio@sangiuseppe.it')
ON CONFLICT DO NOTHING;