// Firebase Cloud Messaging worker for Trading Desk push alerts (background only).
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp(Object.fromEntries(new URL(self.location).searchParams));
firebase.messaging();

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && (event.notification.data.FCM_MSG?.data?.url || event.notification.data.url)) || '/trading';
  event.waitUntil(clients.openWindow(url));
});
