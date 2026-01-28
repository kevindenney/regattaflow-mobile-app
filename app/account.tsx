/**
 * Account Modal Route Shell
 *
 * Root-level route that presents the account screen as a modal.
 * The actual content lives in AccountModalContent for reusability.
 */

import React from 'react';
import AccountModalContent from '@/components/account/AccountModalContent';

export default function AccountModal() {
  return <AccountModalContent />;
}
