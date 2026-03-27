import { NextResponse } from 'next/server';

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const accessToken = searchParams.get('access_token');

  if (!accessToken) {
    return NextResponse.json({ error: 'No access token provided' }, { status: 401 });
  }

  try {
    // Fetch user's playlists with content details
    const playlistsRes = await fetch(
      'https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=50',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!playlistsRes.ok) {
      const error = await playlistsRes.json();
      return NextResponse.json({ error: error.error?.message || 'Failed to fetch playlists' }, { status: playlistsRes.status });
    }

    const data = await playlistsRes.json();
    
    const playlists = data.items?.map(item => ({
      id: item.id,
      label: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.default?.url,
      itemCount: item.contentDetails?.itemCount || 0
    })) || [];

    return NextResponse.json({ playlists });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
