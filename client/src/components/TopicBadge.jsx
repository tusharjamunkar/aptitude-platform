export default function TopicBadge({ topic, percentage }) {
  const getColor = () => {
    if (percentage < 60) return 'bg-danger-100 text-danger-800 border-danger-200';
    if (percentage < 80) return 'bg-warning-100 text-warning-800 border-warning-200';
    return 'bg-success-100 text-success-800 border-success-200';
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getColor()}`}>
      {topic} • {percentage}%
    </span>
  );
}
