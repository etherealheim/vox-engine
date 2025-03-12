import { NextResponse } from 'next/server';

// Function to check if a service is running
async function checkService(url: string): Promise<{isRunning: boolean, error?: string}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch(url, { 
      signal: controller.signal,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    return { isRunning: response.ok };
  } catch (error: any) {
    let errorMessage = 'Service unreachable';
    
    if (error.name === 'AbortError') {
      errorMessage = 'Connection timeout';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection refused';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return { 
      isRunning: false, 
      error: errorMessage
    };
  }
}

// GET handler for checking service status
export async function GET() {
  try {
    // Define services to check
    const services = [
      {
        name: "Unified Scraper Service",
        port: 3003,
        url: "http://localhost:3003",
        isRunning: false,
        error: null,
        startCommand: "node src/scraper-ui.js"
      },
      {
        name: "Next.js Server",
        port: 3000,
        url: "http://localhost:3000",
        isRunning: true, // If this API is responding, Next.js is running
        error: null,
        startCommand: "npm run next-dev"
      }
    ];
    
    // Check each service in parallel
    const results = await Promise.all(
      services.map(async (service) => {
        if (service.name === "Next.js Server") {
          return { ...service, isRunning: true };
        }
        
        const status = await checkService(service.url);
        return { 
          ...service, 
          isRunning: status.isRunning,
          error: status.error || null
        };
      })
    );
    
    return NextResponse.json({
      services: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking services:', error);
    return NextResponse.json(
      { error: 'Failed to check services' },
      { status: 500 }
    );
  }
} 