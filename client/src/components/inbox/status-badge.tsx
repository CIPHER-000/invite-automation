import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";

export interface ConnectionStatus {
  status: 'active' | 'disconnected' | 'error' | 'checking';
  lastCheck?: string;
  error?: string;
}

interface StatusBadgeProps {
  status: ConnectionStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status.status) {
      case 'active':
        return {
          variant: 'success' as const,
          icon: CheckCircle,
          text: 'Active',
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
        };
      case 'disconnected':
        return {
          variant: 'destructive' as const,
          icon: XCircle,
          text: 'Disconnected',
          className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
        };
      case 'error':
        return {
          variant: 'destructive' as const,
          icon: AlertCircle,
          text: 'Error',
          className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
        };
      case 'checking':
        return {
          variant: 'secondary' as const,
          icon: Clock,
          text: 'Checking...',
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
        };
      default:
        return {
          variant: 'secondary' as const,
          icon: AlertCircle,
          text: 'Unknown',
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant} 
      className={`${config.className} ${className} flex items-center gap-1`}
    >
      <Icon className="h-3 w-3" />
      {config.text}
    </Badge>
  );
}