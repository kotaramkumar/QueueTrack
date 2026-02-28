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

export function buildTrackingLink(mode, queueNumber) {
  return `https://queuetrack.netlify.app/?mode=${mode}&no=${queueNumber}`;
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
  const trackingLink = buildTrackingLink(mode, customer.queueNumber);

  return `${prefix} ${businessName} - Queue Confirmation

Hello ${customer.name}!

Your Queue Number: ${customer.queueNumber}
Position in Queue: ${position}
Estimated Wait: ${formatWait(estimatedWait)}${seatInfo}${doctorInfo}

📲 Track your live queue status:
${trackingLink}

Tap the link to see your real-time position — no app needed.

Thank you for your patience! 🙏`;
}

export function buildCallSmsBody(customer, mode, settings) {
  const prefix = mode === 'restaurant' ? '🍽' : '🏥';
  const businessName = settings?.businessName || 'Queue Smart';
  const doctorInfo =
    mode === 'hospital' && customer.doctor
      ? `\nPlease proceed to ${customer.doctor}'s room.`
      : '';
  return `${prefix} ${businessName} - It's Your Turn!

Hello ${customer.name}!

📣 Your queue number ${customer.queueNumber} is being called NOW.

Please come to the reception immediately.${doctorInfo}

Thank you! 🙏`;
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
