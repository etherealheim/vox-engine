import { NextRequest, NextResponse } from 'next/server';

// Base URL for the unified scraper backend
const SCRAPER_API = 'http://localhost:3003';

// Helper function to forward requests to the backend
async function forwardRequest(
  service: string,
  endpoint: string, 
  method: string = 'GET', 
  body?: any
) {
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${SCRAPER_API}/${service}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'An error occurred' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: `Failed to connect to ${service} scraper service` },
      { status: 500 }
    );
  }
}

/**
 * GET handler for fetching scraper data
 * Supports both Twitter and Vote scrapers
 * 
 * Query parameters:
 * - service: 'twitter', 'vote', or 'cache'
 * - action: The specific action to perform
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const service = searchParams.get('service');
  const action = searchParams.get('action') || 'stats';
  
  // Handle cache endpoints
  if (service === 'cache') {
    if (action === 'stats') {
      return forwardRequest('cache', '/stats');
    } else {
      return NextResponse.json(
        { error: 'Invalid action parameter for cache service' },
        { status: 400 }
      );
    }
  }
  
  if (!service || (service !== 'twitter' && service !== 'vote')) {
    return NextResponse.json(
      { error: 'Missing or invalid service parameter (must be "twitter" or "vote")' },
      { status: 400 }
    );
  }
  
  // Map action to endpoint
  let endpoint = '';
  if (service === 'twitter') {
    switch (action) {
      case 'stats':
        endpoint = '/stats';
        break;
      case 'politicians':
        endpoint = '/politicians';
        break;
      case 'status':
        endpoint = '/status';
        break;
      case 'recent-tweets':
        endpoint = '/recent-tweets';
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action parameter for Twitter service' },
          { status: 400 }
        );
    }
  } else if (service === 'vote') {
    switch (action) {
      case 'stats':
        endpoint = '/stats';
        break;
      case 'sessions':
        endpoint = '/sessions';
        break;
      case 'status':
        endpoint = '/status';
        break;
      case 'config':
        endpoint = '/config';
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action parameter for Vote service' },
          { status: 400 }
        );
    }
  }
  
  return forwardRequest(service, endpoint);
}

/**
 * POST handler for scraper operations
 * Supports both Twitter and Vote scrapers
 * 
 * Query parameters:
 * - service: 'twitter', 'vote', or 'cache'
 * - action: The specific action to perform
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const service = searchParams.get('service');
  const action = searchParams.get('action');
  
  // Handle cache endpoints
  if (service === 'cache') {
    if (action === 'clear') {
      return forwardRequest('cache', '/clear', 'POST');
    } else {
      return NextResponse.json(
        { error: 'Invalid action parameter for cache service' },
        { status: 400 }
      );
    }
  }
  
  if (!service || (service !== 'twitter' && service !== 'vote')) {
    return NextResponse.json(
      { error: 'Missing or invalid service parameter (must be "twitter" or "vote")' },
      { status: 400 }
    );
  }
  
  if (!action) {
    return NextResponse.json(
      { error: 'Missing action parameter' },
      { status: 400 }
    );
  }
  
  let endpoint = '';
  if (service === 'twitter') {
    if (action === 'fetch') {
      endpoint = '/fetch';
    } else {
      return NextResponse.json(
        { error: 'Invalid action parameter for Twitter service' },
        { status: 400 }
      );
    }
  } else if (service === 'vote') {
    switch (action) {
      case 'scrape':
        endpoint = '/scrape';
        break;
      case 'stop':
        endpoint = '/stop';
        break;
      case 'config':
        endpoint = '/config';
        break;
      case 'politician':
        endpoint = '/politician';
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action parameter for Vote service' },
          { status: 400 }
        );
    }
  }
  
  const body = await request.json().catch(() => ({}));
  return forwardRequest(service, endpoint, 'POST', body);
} 