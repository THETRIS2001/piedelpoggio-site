import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione Supabase
const SUPABASE_URL = 'https://esydnjunqpgyrtfzlejz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWRuanVucXBneXJ0ZnpsZWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMjkwMTgsImV4cCI6MjA3NjYwNTAxOH0.JFnnYI-J_y5tHh6WTjtGkGOAA4ToaoX8F1j6Rlnh7yE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function migrateBookings() {
  try {
    console.log('🚀 Inizio migrazione dati da bookings.json a Supabase...');
    
    // Leggi il file JSON esistente
    const bookingsPath = path.join(__dirname, '..', 'public', 'data', 'bookings.json');
    const fileContent = await fs.readFile(bookingsPath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    console.log(`📄 Trovate ${data.bookings.length} prenotazioni da migrare`);
    
    // Trasforma i dati per Supabase (adatta i nomi dei campi)
    const bookingsForSupabase = data.bookings.map(booking => ({
      id: booking.id,
      date: booking.date,
      start: booking.start,
      end: booking.end,
      title: booking.title || `Prenotazione ${booking.customerName}`,
      customer_name: booking.customerName,
      customer_phone: booking.customerPhone,
      customer_email: booking.customerEmail || null,
      created_at: booking.createdAt
    }));
    
    // Inserisci i dati in Supabase
    console.log('📤 Inserimento dati in Supabase...');
    
    const { data: insertedData, error } = await supabase
      .from('bookings')
      .insert(bookingsForSupabase)
      .select();
    
    if (error) {
      console.error('❌ Errore durante l\'inserimento:', error);
      return;
    }
    
    console.log(`✅ Migrazione completata! ${insertedData.length} prenotazioni inserite con successo.`);
    
    // Verifica i dati inseriti
    const { data: allBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (fetchError) {
      console.error('❌ Errore durante la verifica:', fetchError);
      return;
    }
    
    console.log(`🔍 Verifica: ${allBookings.length} prenotazioni totali nel database Supabase`);
    
    // Mostra un esempio dei dati migrati
    if (allBookings.length > 0) {
      console.log('\n📋 Esempio di prenotazione migrata:');
      console.log(JSON.stringify(allBookings[0], null, 2));
    }
    
  } catch (error) {
    console.error('💥 Errore durante la migrazione:', error);
  }
}

// Esegui la migrazione
migrateBookings();