'use client';

import { UserNotification } from '@/types/notifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { Bell, UserPlus, FileText, Calendar, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface NotificationItemProps {
  notification: UserNotification;
  onRead: (id: string) => void;
  onClose?: () => void;
}

export function NotificationItem({ notification, onRead, onClose }: NotificationItemProps) {
  const isUnread = notification.status === 'unread' || notification.status === 'action_pending';
  const isActionCompleted = notification.status === 'action_completed';

  const getIcon = () => {
    switch (notification.type) {
      case 'user_registration':
        return <UserPlus className="h-5 w-5 text-blue-500" />;
      case 'proposal_status':
        return <FileText className="h-5 w-5 text-purple-500" />;
      case 'event_reminder':
        return <Calendar className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleClick = () => {
    if (isUnread) {
      onRead(notification.id);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div
      className={cn(
        "flex gap-3 p-4 border-b hover:bg-slate-50 transition-colors relative",
        isUnread ? "bg-blue-50/50" : "bg-white",
        isActionCompleted && "opacity-70"
      )}
    >
      <div className="mt-1 flex-shrink-0">
        {getIcon()}
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex justify-between items-start">
          <h4 className={cn("text-sm font-medium", isUnread ? "text-slate-900" : "text-slate-700")}>
            {notification.title}
          </h4>
          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: it })}
          </span>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {notification.message}
        </p>

        {notification.action_url && (
          <div className="pt-2">
            {isActionCompleted ? (
              <div className="flex items-center text-xs text-green-600 font-medium">
                <CheckCircle className="h-3 w-3 mr-1" />
                Azione completata
              </div>
            ) : (
              <Button
                size="sm"
                variant={notification.requires_action ? "default" : "secondary"}
                className="w-full sm:w-auto h-8 text-xs"
                asChild
                onClick={handleClick}
              >
                <Link href={notification.action_url as string}>
                  {notification.requires_action ? "Visualizza e Agisci" : "Vedi Dettagli"}
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>

      {isUnread && (
        <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-blue-500" />
      )}
    </div>
  );
}
