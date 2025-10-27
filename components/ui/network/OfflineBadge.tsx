import React from 'react';
import { Badge, BadgeText } from '../badge';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface OfflineBadgeProps {
  showWhenOnline?: boolean;
}

export const OfflineBadge: React.FC<OfflineBadgeProps> = ({ showWhenOnline = false }) => {
  const { isOnline } = useNetworkStatus();

  if (isOnline && !showWhenOnline) {
    return null;
  }

  return (
    <Badge action={isOnline ? 'success' : 'muted'} variant="solid">
      <BadgeText className="text-xs">
        {isOnline ? '📶 Online' : '💾 Cached'}
      </BadgeText>
    </Badge>
  );
};
