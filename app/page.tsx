"use client";

import { useState, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { AlertCircle, Database, Twitter, Vote, CheckCircle, XCircle, Server } from "lucide-react";
import { Button } from "./components/ui/button";

/**
 * Stats interface
 */
interface Stats {
  politicians: number | null;
  sessions: number | null;
  votes: number | null;
  tweets: number | null;
}

/**
 * Service Status interface
 */
interface ServiceStatus {
  name: string;
  port: number;
  isRunning: boolean;
  icon: React.ReactNode;
  color: string;
  url: string;
  error?: string | null;
  startCommand?: string;
}

// Memoized StatCard component
const StatCard = memo(({ 
  title, 
  value, 
  loading 
}: { 
  title: string; 
  value: number | null; 
  loading: boolean;
}) => {
  return (
    <div className="bg-muted/50 p-4 rounded-md">
      <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
      <p className="text-2xl font-bold">
        {loading ? (
          <div className="h-8 bg-muted animate-pulse rounded" />
        ) : (
          value !== null ? value.toLocaleString() : "N/A"
        )}
      </p>
    </div>
  );
});

StatCard.displayName = 'StatCard';

// Service Status Component
const ServiceStatusCard = memo(({ service }: { service: ServiceStatus }) => {
  return (
    <div className="flex flex-col p-4 border rounded-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`${service.color} p-2 rounded-full`}>
            {service.icon}
          </div>
          <div>
            <h3 className="font-medium">{service.name}</h3>
            <p className="text-sm text-muted-foreground">Port: {service.port}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className={`flex items-center gap-1 ${service.isRunning ? 'text-green-500' : 'text-red-500'}`}>
            {service.isRunning ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <span className="text-sm">{service.isRunning ? 'Running' : 'Offline'}</span>
          </div>
          {service.isRunning && (
            <a 
              href={service.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline"
            >
              Open service
            </a>
          )}
        </div>
      </div>
      
      {!service.isRunning && (
        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded text-sm">
          <p className="text-amber-800 dark:text-amber-400 mb-1">
            {service.error ? `Error: ${service.error}` : 'Service is not running'}
          </p>
          {service.startCommand && (
            <div className="font-mono text-xs bg-black/5 dark:bg-white/10 p-1.5 rounded">
              {service.startCommand}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

ServiceStatusCard.displayName = 'ServiceStatusCard';

/**
 * Home page component
 */
export default function Home() {
  // State
  const [stats, setStats] = useState<Stats>({
    politicians: null,
    sessions: null,
    votes: null,
    tweets: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: "Unified Scraper Service",
      port: 3003,
      isRunning: false,
      icon: <Database className="h-4 w-4 text-white" />,
      color: "bg-blue-500",
      url: "http://localhost:3003",
      error: null,
      startCommand: "node src/scraper-ui.js"
    },
    {
      name: "Next.js Server",
      port: 3000,
      isRunning: true, // If we're viewing the page, Next.js is running
      icon: <Server className="h-4 w-4 text-white" />,
      color: "bg-purple-500",
      url: "http://localhost:3000",
      error: null,
      startCommand: "npm run next-dev"
    }
  ]);

  /**
   * Check if services are running
   */
  const checkServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/services');
      
      if (!response.ok) {
        throw new Error('Failed to check services');
      }
      
      const data = await response.json();
      
      // Update services with the response data
      setServices(prevServices => {
        return prevServices.map(service => {
          const matchedService = data.services.find((s: any) => s.name === service.name);
          
          if (matchedService) {
            return {
              ...service,
              isRunning: matchedService.isRunning,
              error: matchedService.error,
              startCommand: matchedService.startCommand
            };
          }
          
          return service;
        });
      });
      
      setLastChecked(data.timestamp);
    } catch (err) {
      console.error('Error checking services:', err);
      setError('Failed to check services');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch statistics from both services with retry logic
   */
  const fetchStats = useCallback(async (retryCount = 0) => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to fetch from vote scraper
      let voteData = null;
      try {
        const voteResponse = await fetch('/api/scrapers?service=vote&action=stats');
        if (voteResponse.ok) {
          voteData = await voteResponse.json();
          console.log('Vote data:', voteData); // Debug log
        } else {
          throw new Error(`HTTP error! status: ${voteResponse.status}`);
        }
      } catch (err) {
        console.error('Error fetching vote stats:', err);
      }
      
      // Try to fetch from twitter scraper
      let twitterData = null;
      try {
        const twitterResponse = await fetch('/api/scrapers?service=twitter&action=stats');
        if (twitterResponse.ok) {
          twitterData = await twitterResponse.json();
          console.log('Twitter data:', twitterData); // Debug log
        } else {
          throw new Error(`HTTP error! status: ${twitterResponse.status}`);
        }
      } catch (err) {
        console.error('Error fetching twitter stats:', err);
      }
      
      // If both failed, retry with exponential backoff
      if (!voteData && !twitterData) {
        if (retryCount < 3) {
          const backoffDelay = Math.pow(2, retryCount) * 1000;
          console.log(`Retrying in ${backoffDelay}ms...`);
          setTimeout(() => fetchStats(retryCount + 1), backoffDelay);
          return;
        }
        throw new Error('Failed to fetch data from both services after retries');
      }
      
      // Update stats with the data we got
      setStats({
        politicians: twitterData?.politicians_with_tweets || null,
        sessions: voteData?.sessions_count || null,
        votes: voteData?.votes_count || null,
        tweets: twitterData?.total_tweets || null,
      });
      
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    checkServices();
    fetchStats();
    
    // Set up interval for periodic updates
    const interval = setInterval(() => {
      fetchStats();
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [checkServices, fetchStats]);

  // Handle refresh button click
  const handleRefresh = () => {
    checkServices();
    fetchStats();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Data collection and analysis engine for political data
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Database Statistics
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRefresh}
                      disabled={loading}
                    >
                      Refresh
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Current data in the database
                    {lastChecked && (
                      <span className="text-xs text-muted-foreground ml-2">
                        Last checked: {new Date(lastChecked).toLocaleTimeString()}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {error ? (
                    <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                      <AlertCircle className="h-4 w-4 inline-block mr-2" />
                      {error}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <StatCard title="Politicians" value={stats.politicians} loading={loading} />
                      <StatCard title="Voting Sessions" value={stats.sessions} loading={loading} />
                      <StatCard title="Votes" value={stats.votes} loading={loading} />
                      <StatCard title="Tweets" value={stats.tweets} loading={loading} />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Link href="/twitter" className="text-sm text-blue-500 hover:underline">
                    View Twitter data
                  </Link>
                  <Link href="/vote" className="text-sm text-blue-500 hover:underline">
                    View voting data
                  </Link>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Scraper Tools</CardTitle>
                  <CardDescription>
                    Tools for data collection
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link href="/twitter-scraper" className="block">
                      <div className="border rounded-md p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="bg-blue-500 p-2 rounded-full">
                            <Twitter className="h-4 w-4 text-white" />
                          </div>
                          <h3 className="font-medium">Twitter Scraper</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Collect tweets from politicians
                        </p>
                      </div>
                    </Link>
                    
                    <Link href="/vote-scraper" className="block">
                      <div className="border rounded-md p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="bg-green-500 p-2 rounded-full">
                            <Vote className="h-4 w-4 text-white" />
                          </div>
                          <h3 className="font-medium">Vote Scraper</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Collect voting data from Parliament
                        </p>
                      </div>
                    </Link>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-purple-500 p-2 rounded-full">
                        <Database className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="font-medium">Database Tools</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <a 
                        href="https://local.drizzle.studio" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:underline"
                      >
                        Open Drizzle Studio
                      </a>
                      <Link href="/database" className="text-sm text-blue-500 hover:underline">
                        Database Dashboard
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="services" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Service Status
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefresh}
                    disabled={loading}
                  >
                    Refresh
                  </Button>
                </CardTitle>
                <CardDescription>
                  Status of backend services
                  {lastChecked && (
                    <span className="text-xs text-muted-foreground ml-2">
                      Last checked: {new Date(lastChecked).toLocaleTimeString()}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  {services.map((service, index) => (
                    <ServiceStatusCard key={index} service={service} />
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Services can be started manually using the commands shown above or by running <code className="bg-muted px-1 py-0.5 rounded text-xs">npm run dev</code>
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
