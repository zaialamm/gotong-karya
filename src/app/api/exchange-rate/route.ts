
import { NextResponse } from 'next/server';

// Fallback SOL to IDR rate if the API fails
const FALLBACK_SOL_TO_IDR_RATE = 2200000; // Approximate value - adjust as needed

export async function GET() {
  try {
    // Add API key if you have one to reduce rate limiting issues
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=idr', {
      next: { revalidate: 60 }, // Revalidate every 60 seconds
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Gotong Karya App'
      }
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
    
    // Return a fallback rate instead of an error
    console.info('Using fallback exchange rate:', FALLBACK_SOL_TO_IDR_RATE);
    return NextResponse.json(
      { rate: FALLBACK_SOL_TO_IDR_RATE, isFallback: true },
      { 
        headers: { 
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Using-Fallback': 'true'
        } 
      }
    );
  }
}
