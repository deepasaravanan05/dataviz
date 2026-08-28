/**
 * THE COLOUR OF A RIDE SEAT.
 *
 * Every seat in the park is grey — empty, occupied, or waiting to be occupied.
 * It used to carry the rider's delay band, so a stopped ride was a bar chart of
 * green, yellow and red cushions, and a seat's colour changed meaning depending
 * on who was in it. That is now stated by the person, not the furniture: the
 * employees keep their worn check-in band exactly as it is, and what a seat
 * says is only whether somebody is sitting in it.
 *
 * The delay CLASSIFICATION is untouched. `classifyDelay()`, `DELAY_THRESHOLDS`,
 * the 20/20/20 seat manifests and every count derived from them all still work
 * the way they did — the bands are still what decides who wears what, and the
 * ride pages' legends still read off them. Only the material a seat is drawn
 * with stops depending on them.
 *
 * Two tones rather than one, because a single flat grey on a pan, a backrest
 * and a headrest reads as one undifferentiated block: the moulding catches the
 * park's low light at different angles, which is what keeps the seat shape
 * legible now that colour is not doing it.
 */

/** Seat cushions and pans — a mid grey with a slight sheen, like moulded stock. */
export const SEAT_GREY = "#787d85";

/** Backs, shells and headrests, a shade down so the form reads. */
export const SEAT_GREY_DARK = "#5b6068";

/** Matte-with-a-hint-of-metal, the finish moulded ride furniture actually has. */
export const SEAT_ROUGHNESS = 0.58;
export const SEAT_METALNESS = 0.18;
