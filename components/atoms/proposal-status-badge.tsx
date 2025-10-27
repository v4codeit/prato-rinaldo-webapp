import { Badge } from '@/components/ui/badge';
import { PROPOSAL_STATUS } from '@/lib/utils/constants';

type ProposalStatus = typeof PROPOSAL_STATUS[keyof typeof PROPOSAL_STATUS];

interface ProposalStatusBadgeProps {
  status: ProposalStatus;
  className?: string;
}

const statusConfig: Record<ProposalStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  [PROPOSAL_STATUS.PROPOSED]: {
    label: 'Proposta',
    variant: 'outline',
  },
  [PROPOSAL_STATUS.UNDER_REVIEW]: {
    label: 'In Valutazione',
    variant: 'secondary',
  },
  [PROPOSAL_STATUS.APPROVED]: {
    label: 'Approvata',
    variant: 'default',
  },
  [PROPOSAL_STATUS.IN_PROGRESS]: {
    label: 'In Corso',
    variant: 'secondary',
  },
  [PROPOSAL_STATUS.COMPLETED]: {
    label: 'Completata',
    variant: 'default',
  },
  [PROPOSAL_STATUS.DECLINED]: {
    label: 'Respinta',
    variant: 'destructive',
  },
};

export function ProposalStatusBadge({ status, className }: ProposalStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
