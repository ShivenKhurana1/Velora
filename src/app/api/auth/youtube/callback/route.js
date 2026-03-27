import { NextResponse } from 'next/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/auth/youtube/callback';

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect('/?yt_auth_error=' + error);
  }

  if (!code) {
    // Redirect to Google OAuth
    const scopes = [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.force-ssl'
    ].join(' ');

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&access_type=offline` +
      `&prompt=consent`;

    return NextResponse.redirect(authUrl);
  }

  // Exchange code for tokens
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokens.error_description || 'Token exchange failed');
    }

    // Redirect back to app with tokens in hash fragment (client-side will extract)
    const redirectUrl = new URL('/', request.url);
    redirectUrl.hash = `yt_access_token=${tokens.access_token}&yt_refresh_token=${tokens.refresh_token || ''}&yt_expires=${Date.now() + tokens.expires_in * 1000}`;
    
    return NextResponse.redirect(redirectUrl.toString());
  } catch (err) {
    return NextResponse.redirect('/?yt_auth_error=' + encodeURIComponent(err.message));
  }
}
