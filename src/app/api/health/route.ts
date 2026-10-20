export const dynamic = 'force-dynamic';

export const GET = () =>
  Response.json({ status: 'ok', release: process.env.BLOG_RELEASE_ID }, { headers: { 'Cache-Control': 'no-store' } });
