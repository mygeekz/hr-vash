import db from './src/lib/db';

const notifications = [
  {
    userId: '1',
    title: 'درخواست شما تایید شد',
    body: 'درخواست مرخصی شما برای تاریخ 1403/05/10 تایید شد.',
    isRead: 0,
    createdAt: new Date().toISOString(),
    type: 'approval',
  },
  {
    userId: '1',
    title: 'یادآوری جلسه',
    body: 'جلسه بررسی عملکرد فصلی فردا ساعت 10 صبح برگزار می‌شود.',
    isRead: 1,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    type: 'system',
  },
];

const stmt = db.prepare(
  'INSERT INTO notifications (userId, title, body, isRead, createdAt, type) VALUES (?, ?, ?, ?, ?, ?)'
);

for (const notification of notifications) {
  stmt.run(
    notification.userId,
    notification.title,
    notification.body,
    notification.isRead,
    notification.createdAt,
    notification.type
  );
}

console.log('Database seeded successfully!');
