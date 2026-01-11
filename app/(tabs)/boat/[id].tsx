/**
 * Boat Detail Screen - Tufte-inspired design
 *
 * Single-scroll layout showing all boat information at a glance:
 * - Vessel details
 * - Sail inventory (with condition)
 * - Equipment log
 * - Crew assignments
 *
 * No hidden tabs - everything visible on one page.
 */

import { TufteBoatDetail } from '@/components/boats/TufteBoatDetail';

export default function BoatDetailScreen() {
  return <TufteBoatDetail />;
}
