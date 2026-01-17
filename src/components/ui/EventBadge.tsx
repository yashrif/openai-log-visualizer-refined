"use client";

import React from 'react';
import {
  Settings,
  User,
  Bot,
  Wrench,
  Mic,
  FileText,
  AlertTriangle,
  Activity,
  HelpCircle,
} from 'lucide-react';
import { EventCategory } from '@/lib/ui-types';
import { EVENT_CATEGORY_STYLES } from '@/lib/constants';

interface EventBadgeProps {
  category: EventCategory;
  eventType?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
}

const ICONS: Record<string, React.ElementType> = {
  Settings,
  User,
  Bot,
  Wrench,
  Mic,
  FileText,
  AlertTriangle,
  Activity,
  HelpCircle,
};

const EventBadge: React.FC<EventBadgeProps> = ({
  category,
  eventType,
  size = 'md',
  showIcon = true,
  showLabel = true,
}) => {
  const style = EVENT_CATEGORY_STYLES[category];
  const IconComponent = ICONS[style.icon] || HelpCircle;

  const sizeClasses = {
    sm: 'text-[9px] px-2 py-0.5 gap-1',
    md: 'text-[10px] px-2.5 py-1 gap-1.5',
    lg: 'text-xs px-3 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'size-3',
    md: 'size-3.5',
    lg: 'size-4',
  };

  return (
    <div
      className={`inline-flex items-center rounded-full font-bold uppercase tracking-widest ${style.bgColor} ${style.borderColor} border ${style.color} ${sizeClasses[size]}`}
    >
      {showIcon && <IconComponent className={iconSizes[size]} />}
      {showLabel && <span>{eventType || style.label}</span>}
    </div>
  );
};

export default EventBadge;
