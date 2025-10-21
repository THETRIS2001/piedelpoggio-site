import type { APIRoute } from 'astro';
import { getBookings, createBooking, deleteBooking, checkBookingConflict, type Booking } from '../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get('date');

    const bookings = await getBookings();
    
    // Filtra per data se specificata
    const filteredBookings = date 
      ? bookings.filter(booking => booking.date === date)
      : bookings;

    return new Response(JSON.stringify({ 
      bookings: filteredBookings 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/bookings:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch bookings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    // Validazione dei dati richiesti
    const requiredFields = ['date', 'start', 'end', 'customerName', 'customerPhone'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return new Response(JSON.stringify({ 
          error: `Missing required field: ${field}` 
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
    }

    // Validazione formato data
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(body.date)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid date format. Use YYYY-MM-DD' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Validazione formato orario
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(body.start) || !timeRegex.test(body.end)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid time format. Use HH:mm' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Controlla conflitti di orario
    const hasConflict = await checkBookingConflict(body.date, body.start, body.end);
    if (hasConflict) {
      return new Response(JSON.stringify({ 
        error: 'Time slot conflict. This time is already booked.' 
      }), {
        status: 409,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Crea la prenotazione
    const newBooking = await createBooking({
      date: body.date,
      start: body.start,
      end: body.end,
      title: body.title || `Prenotazione ${body.customerName}`,
      customer_name: body.customerName,
      customer_phone: body.customerPhone,
      customer_email: body.customerEmail,
    });

    return new Response(JSON.stringify({ 
      booking: newBooking,
      message: 'Booking created successfully' 
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error in POST /api/bookings:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create booking',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ 
        error: 'Missing booking ID' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    await deleteBooking(id);

    return new Response(JSON.stringify({ 
      message: 'Booking deleted successfully' 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error in DELETE /api/bookings:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete booking',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};