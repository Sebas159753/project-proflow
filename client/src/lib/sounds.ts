
// Importar sonido de notificación de Apple
const notificationSound = new Audio('https://cdn.freesound.org/previews/573/573669_5674468-lq.mp3');

export const playNotificationSound = () => {
  notificationSound.currentTime = 0;
  notificationSound.play().catch(err => console.error('Error playing sound:', err));
};
