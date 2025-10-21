import React, { useEffect, useMemo, useState } from 'react';

type Booking = {
  id: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string;   // HH:mm
  title?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  createdAt: string;
};

type BookingFormData = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  title: string;
};

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

function toDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function minutesFromTime(t: string) {
  const [hh, mm] = t.split(':').map(Number);
  return hh * 60 + mm;
}

function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

const WORK_START = 7 * 60; // 07:00
const WORK_END = 24 * 60;  // 24:00 (mezzanotte)
const STEP = 30; // 30 minuti

const generateSlots = () => {
  const slots: string[] = [];
  for (let m = WORK_START; m < WORK_END; m += STEP) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    slots.push(`${hh}:${mm}`);
  }
  return slots;
};

const slots = generateSlots();

const legendColors = {
  available: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  busy: 'bg-rose-100 text-rose-700 border-rose-200',
  selected: 'bg-primary-100 text-primary-700 border-primary-200',
};

const CalendarHeader: React.FC<{ month: number; year: number; onPrev: () => void; onNext: () => void; onToday: () => void; }>
= ({ month, year, onPrev, onNext, onToday }) => {
  const months = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <button aria-label="Mese precedente" className="p-2 rounded-lg hover:bg-gray-100" onClick={onPrev}>
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900">{months[month]} {year}</h2>
        <button aria-label="Mese successivo" className="p-2 rounded-lg hover:bg-gray-100" onClick={onNext}>
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
      <button onClick={onToday} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200">Oggi</button>
    </div>
  );
};

const BookingCalendar: React.FC = () => {
  const now = new Date();
  const [visibleMonth, setVisibleMonth] = useState(now.getMonth());
  const [visibleYear, setVisibleYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>(toDateKey(now));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('11:00');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState<BookingFormData>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    title: ''
  });

  // Fetch dati prenotazioni
  const loadBookings = async () => {
    try {
      const res = await fetch('/api/bookings', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data?.bookings)) {
        setBookings(data.bookings);
      }
    } catch (e) {
      console.error('Errore nel caricamento delle prenotazioni:', e);
    }
  };

  useEffect(() => {
    loadBookings();
    const id = setInterval(loadBookings, 30000); // Aggiorna ogni 30 secondi
    return () => clearInterval(id);
  }, []);

  // Mostra messaggio temporaneo
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const daysMatrix = useMemo(() => {
    const firstOfMonth = new Date(visibleYear, visibleMonth, 1);
    const lastOfMonth = new Date(visibleYear, visibleMonth + 1, 0);
    // Allineare a settimana che inizia di lunedì
    const offset = (firstOfMonth.getDay() + 6) % 7; // 0 lunedì
    const totalDays = lastOfMonth.getDate();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(new Date(visibleYear, visibleMonth, d));
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
  }, [visibleMonth, visibleYear]);

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    bookings.forEach(b => {
      const arr = map.get(b.date) || [];
      arr.push(b);
      map.set(b.date, arr);
    });
    return map;
  }, [bookings]);

  const occupiedForDate = useMemo(() => bookingsByDate.get(selectedDate) || [], [bookingsByDate, selectedDate]);

  const isSlotBusy = (dateKey: string, slotStart: string, slotEnd: string) => {
    const s = minutesFromTime(slotStart);
    const e = minutesFromTime(slotEnd);
    const list = bookingsByDate.get(dateKey) || [];
    return list.some(b => rangesOverlap(s, e, minutesFromTime(b.start), minutesFromTime(b.end)));
  };

  const canBookSlot = () => {
    const selectedDateObj = new Date(selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDateObj.setHours(0, 0, 0, 0);
    
    // Non si può prenotare nel passato
    if (selectedDateObj < today) return false;
    
    // Controlla se lo slot è già occupato
    return !isSlotBusy(selectedDate, startTime, endTime);
  };

  const handleBooking = async () => {
    if (!canBookSlot()) {
      showMessage('error', 'Slot non disponibile per la prenotazione');
      return;
    }

    if (!formData.customerName.trim() || !formData.customerPhone.trim()) {
      showMessage('error', 'Nome e telefono sono obbligatori');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate,
          start: startTime,
          end: endTime,
          title: formData.title.trim(),
          customerName: formData.customerName.trim(),
          customerPhone: formData.customerPhone.trim(),
          customerEmail: formData.customerEmail.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showMessage('success', 'Prenotazione creata con successo!');
        setShowBookingForm(false);
        setFormData({ customerName: '', customerPhone: '', customerEmail: '', title: '' });
        await loadBookings(); // Ricarica le prenotazioni
      } else {
        showMessage('error', result.error || 'Errore nella creazione della prenotazione');
      }
    } catch (error) {
      showMessage('error', 'Errore di connessione');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Sei sicuro di voler cancellare questa prenotazione?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/bookings?id=${bookingId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        showMessage('success', 'Prenotazione cancellata con successo!');
        await loadBookings(); // Ricarica le prenotazioni
      } else {
        showMessage('error', result.error || 'Errore nella cancellazione della prenotazione');
      }
    } catch (error) {
      showMessage('error', 'Errore di connessione');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrev = () => {
    const d = new Date(visibleYear, visibleMonth - 1, 1);
    setVisibleMonth(d.getMonth());
    setVisibleYear(d.getFullYear());
  };
  const handleNext = () => {
    const d = new Date(visibleYear, visibleMonth + 1, 1);
    setVisibleMonth(d.getMonth());
    setVisibleYear(d.getFullYear());
  };
  const handleToday = () => {
    const d = new Date();
    setVisibleMonth(d.getMonth());
    setVisibleYear(d.getFullYear());
    setSelectedDate(toDateKey(d));
  };

  // Assicurare che fine sia sempre dopo inizio
  useEffect(() => {
    if (minutesFromTime(endTime) <= minutesFromTime(startTime)) {
      const next = minutesFromTime(startTime) + STEP;
      const hh = String(Math.floor(next / 60)).padStart(2, '0');
      const mm = String(next % 60).padStart(2, '0');
      setEndTime(`${hh}:${mm}`);
    }
  }, [startTime, endTime]);

  return (
    <div>
      {/* Messaggio di stato */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg border ${message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Intestazione calendario */}
      <CalendarHeader month={visibleMonth} year={visibleYear} onPrev={handlePrev} onNext={handleNext} onToday={handleToday} />

      {/* Giorni della settimana */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{w}</div>
        ))}
      </div>

      {/* Griglia calendario */}
      <div role="grid" aria-label="Calendario prenotazioni" className="grid grid-cols-7 gap-2">
        {daysMatrix.map((week, wi) => (
          <React.Fragment key={wi}>
            {week.map((day, di) => {
              if (!day) return <div key={`${wi}-${di}`} className="h-24 rounded-xl border border-dashed border-gray-200 bg-gray-50" />;
              const key = toDateKey(day);
              const isSelected = key === selectedDate;
              const count = (bookingsByDate.get(key) || []).length;
              const isToday = key === toDateKey(new Date());
              
              // Controlla se il giorno è nel passato
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const dayDate = new Date(day);
              dayDate.setHours(0, 0, 0, 0);
              const isPastDay = dayDate < today;
              
              return (
                <button
                  key={key}
                  role="gridcell"
                  aria-selected={isSelected}
                  onClick={() => !isPastDay && setSelectedDate(key)}
                  disabled={isPastDay}
                  className={`h-24 w-full rounded-xl border transition-all duration-200 text-left p-2 focus:outline-none ${
                    isPastDay 
                      ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60' 
                      : isSelected 
                        ? 'border-primary-300 bg-primary-50 focus:ring-2 focus:ring-primary-500' 
                        : 'border-gray-200 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary-500'
                  } ${isToday && !isPastDay ? 'shadow-inner' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${isPastDay ? 'text-gray-400' : 'text-gray-800'}`}>
                      {day.getDate()}
                    </span>
                    {count > 0 && (
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border ${
                        isPastDay 
                          ? 'bg-gray-200 text-gray-500 border-gray-300' 
                          : 'bg-rose-100 text-rose-700 border-rose-200'
                      }`}>
                        {count} occupato
                      </span>
                    )}
                  </div>
                  <div className="mt-2 space-y-1">
                    {(bookingsByDate.get(key) || []).slice(0,2).map((b, idx) => (
                      <div key={idx} className={`text-[11px] px-2 py-1 rounded-md ${
                        isPastDay 
                          ? 'bg-gray-200 text-gray-500' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {b.start}–{b.end} {b.title ? `· ${b.title}` : ''}
                      </div>
                    ))}
                    {(count > 2) && (
                      <div className={`text-[11px] ${isPastDay ? 'text-gray-400' : 'text-gray-500'}`}>
                        + {count - 2}
                      </div>
                    )}
                  </div>
                </button>
               );
             })}
           </React.Fragment>
        ))}
      </div>

      {/* Selezione dettagli */}
      <div className="mt-6 grid md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Dettagli prenotazione</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600">Giorno</label>
                <div className="mt-1 px-3 py-2 bg-white rounded-lg border border-gray-200 text-gray-800">{selectedDate}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="start" className="text-xs text-gray-600">Ora inizio</label>
                  <select id="start" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1 w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500">
                    {slots.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="end" className="text-xs text-gray-600">Ora fine</label>
                  <select id="end" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1 w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500">
                    {slots.map((s, i) => {
                      // mostriamo solo slot dopo start
                      if (minutesFromTime(s) <= minutesFromTime(startTime)) return null;
                      return <option key={s} value={s}>{s}</option>;
                    })}
                  </select>
                </div>
              </div>
              
              {/* Pulsante per prenotare */}
              <div className="pt-2">
                {canBookSlot() ? (
                  <button
                    onClick={() => setShowBookingForm(true)}
                    disabled={isLoading}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Caricamento...' : 'Prenota questo slot'}
                  </button>
                ) : (
                  <div className="w-full px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-center">
                    Slot non disponibile
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className={`px-2 py-1 rounded-md border ${legendColors.available}`}>Disponibile</span>
                <span className={`px-2 py-1 rounded-md border ${legendColors.busy}`}>Occupato</span>
                <span className={`px-2 py-1 rounded-md border ${legendColors.selected}`}>Selezionato</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline oraria per il giorno selezionato */}
        <div className="md:col-span-2">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Orari disponibili per {selectedDate}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {slots.map((s, idx) => {
              const slotEndMinutes = minutesFromTime(s) + STEP;
              const eh = String(Math.floor(slotEndMinutes / 60)).padStart(2, '0');
              const em = String(slotEndMinutes % 60).padStart(2, '0');
              const eStr = `${eh}:${em}`;
              const busy = isSlotBusy(selectedDate, s, eStr);
              const selected = minutesFromTime(s) >= minutesFromTime(startTime) && minutesFromTime(eStr) <= minutesFromTime(endTime);
              return (
                <div key={`${selectedDate}-${s}`} className={`px-3 py-2 rounded-lg border text-sm text-center ${busy ? 'bg-rose-100 text-rose-700 border-rose-200' : selected ? 'bg-primary-100 text-primary-700 border-primary-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'} `}>
                  {s}
                </div>
              );
            })}
          </div>

          {/* Prenotazioni visibili a tutti */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Prenotazioni del giorno</h4>
            {occupiedForDate.length === 0 ? (
              <p className="text-sm text-gray-600">Nessuna prenotazione presente.</p>
            ) : (
              <ul className="space-y-2">
                {occupiedForDate.map((b, i) => (
                  <li key={i} className="px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm text-gray-800 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{b.start}–{b.end} {b.title ? `· ${b.title}` : ''}</div>
                      <div className="text-xs text-gray-600">{b.customerName}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200">occupato</span>
                      <button
                        onClick={() => handleCancelBooking(b.id)}
                        disabled={isLoading}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                      >
                        Cancella
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Form di prenotazione */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Prenota il campo</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Il tuo nome"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefono *</label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Il tuo numero di telefono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="La tua email (opzionale)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Es: Allenamento calcio (opzionale)"
                />
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">
                  <strong>Riepilogo:</strong><br />
                  Data: {selectedDate}<br />
                  Orario: {startTime} - {endTime}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBookingForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Annulla
              </button>
              <button
                onClick={handleBooking}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Prenotando...' : 'Conferma prenotazione'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingCalendar;