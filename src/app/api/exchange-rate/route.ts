
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=idr', {
      next: { revalidate: 60 } // Revalidate every 60 seconds
    });

    if (!response.ok) {
      console.error(`Failed to fetch from CoinGecko: ${response.status} ${response.statusText}`);
      // Attempt to parse error body if available
      let errorBody = 'Failed to fetch from CoinGecko';
      try {
        errorBody = await response.text();
      } catch (e) { /* ignore */ }
      throw new Error(`CoinGecko API Error: ${response.status} ${errorBody}`);
    }

    const data = await response.json();
    const rate = data?.solana?.idr;

    if (typeof rate !== 'number') {
      console.error('Invalid data format from CoinGecko:', data);
      throw new Error('Invalid data format received from CoinGecko');
    }

    return NextResponse.json({ rate }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300', // Client-side and CDN caching
      },
    });
  } catch (error) {
    console.error('Error in /api/exchange-rate:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch exchange rate' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } } // Don't cache errors
    );
  }
}
