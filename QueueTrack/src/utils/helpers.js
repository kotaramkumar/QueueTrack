export function formatTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatWait(minutes) {
  if (minutes === null || minutes === undefined) return 'N/A';
  if (minutes === 0) return 'Your turn!';
  if (minutes < 60) return `~${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `~${h}h ${m}m` : `~${h}h`;
}

export function buildSmsBody(customer, mode, position, estimatedWait, settings) {
  const prefix = mode === 'restaurant' ? '🍽' : '🏥';
  const businessName = settings?.businessName || 'Queue Track';
  const seatInfo =
    mode === 'restaurant'
      ? `\nAvailable Seats: ${settings?.availableSeats ?? 'N/A'}`
      : '';
  const doctorInfo =
    mode === 'hospital' && customer.doctor
      ? `\nAssigned Doctor: ${customer.doctor}`
      : '';

  return `${prefix} ${businessName} - Queue Confirmation

Hello ${customer.name}!

Your Queue Number: ${customer.queueNumber}
Position in Queue: ${position}
Estimated Wait: ${formatWait(estimatedWait)}${seatInfo}${doctorInfo}

Open the QueueTrack app and enter your Queue No. to track live status.

Thank you for your patience! 🙏`;
}

export function statusColor(status) {
  switch (status) {
    case 'waiting':
      return '#FF9800';
    case 'called':
      return '#4CAF50';
    case 'served':
      return '#9E9E9E';
    default:
      return '#2196F3';
  }
}

export function statusLabel(status) {
  switch (status) {
    case 'waiting':
      return 'Waiting';
    case 'called':
      return 'Called';
    case 'served':
      return 'Served';
    default:
      return status;
  }
}
