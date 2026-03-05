import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      const { event, ...data } = req.body;

      // In a real application, you would save this data to a database,
      // a dedicated analytics service (e.g., Mixpanel, Segment), or a log file.
      // For this example, we'll just log to the console.
      console.log('AI Feature Usage Event:', { event, ...data, timestamp: new Date().toISOString() });

      // You might also perform additional logic here, like updating user profiles
      // or triggering other system events.

      res.status(200).json({ message: 'AI feature usage tracked successfully' });
    } catch (error) {
      console.error('Error tracking AI feature usage:', error);
      res.status(500).json({ message: 'Failed to track AI feature usage', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
