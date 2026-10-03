export async function onRequestGet() {
  const inviteCode = 'xQSxuEUQH5';

  try {
    const response = await fetch(`https://discord.com/api/v10/invites/${inviteCode}?with_counts=true`, {
      headers: { 'User-Agent': 'VIP-Studios-Website/1.0' }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Discord stats unavailable' }), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=0, s-maxage=60'
        }
      });
    }

    const data = await response.json();

    return new Response(JSON.stringify({
      guildName: data.guild?.name || 'VIP Studios',
      memberCount: data.approximate_member_count || 0,
      onlineCount: data.approximate_presence_count || 0,
      updatedAt: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Unable to retrieve Discord stats' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
