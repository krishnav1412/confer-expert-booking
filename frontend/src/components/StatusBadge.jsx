import Badge from './Badge';

const statusMap = {
  Pending: 'warning',
  Confirmed: 'success',
  Completed: 'info',
};

const StatusBadge = ({ status }) => (
  <Badge variant={statusMap[status] || 'neutral'} dot>
    {status}
  </Badge>
);

export default StatusBadge;
