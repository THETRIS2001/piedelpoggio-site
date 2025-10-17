import { getCollection } from 'astro:content';
import { isUpcoming, isPast } from './date';

/**
 * Carica tutti gli eventi pubblicati dal sistema di content collection
 */
export async function getAllEvents() {
  return await getCollection('events', ({ data }) => data.published);
}

/**
 * Ottiene gli eventi futuri ordinati per data di inizio
 * Un evento è considerato futuro se non è ancora iniziato
 */
export async function getUpcomingEvents() {
  const events = await getAllEvents();
  return events
    .filter(event => isUpcoming(event.data.startsAt))
    .sort((a, b) => new Date(a.data.startsAt).getTime() - new Date(b.data.startsAt).getTime());
}

/**
 * Ottiene gli eventi passati ordinati per data di inizio (più recenti prima)
 * Un evento è considerato passato se è già iniziato
 */
export async function getPastEvents() {
  const events = await getAllEvents();
  return events
    .filter(event => isPast(event.data.startsAt))
    .sort((a, b) => new Date(b.data.startsAt).getTime() - new Date(a.data.startsAt).getTime());
}

/**
 * Ottiene tutti gli eventi ordinati (futuri prima, poi passati)
 */
export async function getAllEventsOrdered() {
  const upcomingEvents = await getUpcomingEvents();
  const pastEvents = await getPastEvents();
  return [...upcomingEvents, ...pastEvents];
}

/**
 * Ottiene solo gli eventi futuri per la home page
 * Gli eventi passati non vengono mai mostrati nella homepage
 */
export async function getUpcomingEventsForHome(limit?: number) {
  const upcomingEvents = await getUpcomingEvents();
  return limit ? upcomingEvents.slice(0, limit) : upcomingEvents;
}