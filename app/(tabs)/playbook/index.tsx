/**
 * Playbook Home route — mounts the real <PlaybookHome /> screen.
 *
 * One playbook per (user, interest). Interest is resolved via
 * `useInterest().currentInterest` inside PlaybookHome.
 */

import React from 'react';
import { PlaybookHome } from '@/components/playbook/PlaybookHome';

export default function PlaybookIndexScreen() {
  return <PlaybookHome />;
}
