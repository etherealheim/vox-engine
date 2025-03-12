"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ScraperStatus } from "../components/shared/scraper-status";
import { DataStats } from "../components/shared/data-stats";

// Define types for our data
interface VoteStats {
  vote: string;
  count: string;
}

interface RecentVote {
  vote: string;
  title: string;
  date: string;
  session_id: string;
}

interface PoliticianData {
  politician: {
    id: number;
    name: string;
    party: string;
  };
  totalVotes: number;
  voteStats: VoteStats[];
  recentVotes: RecentVote[];
}

interface RecentSession {
  session_id: string;
  title: string;
  date: string;
  vote_count: number;
}

export default function VoteScraper() {
  const [serviceConnected, setServiceConnected] = useState(false);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [politicianId, setPoliticianId] = useState<string>('');
  const [politicianData, setPoliticianData] = useState<PoliticianData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch database stats
  const fetchDatabaseStats = async () => {
    try {
      const response = await fetch('/api/scrapers?service=vote&action=stats');
      if (!response.ok) {
        throw new Error('Failed to fetch database stats');
      }
      
      // If we got a response, the service is connected
      setServiceConnected(true);
      
      // We don't need to process the data here as it's handled by the DataStats component
    } catch (err) {
      console.error('Error fetching database stats:', err);
      setServiceConnected(false);
    }
  };

  // Fetch recent sessions
  const fetchRecentSessions = async () => {
    try {
      const response = await fetch('/api/scrapers?service=vote&action=sessions');
      if (!response.ok) {
        throw new Error('Failed to fetch recent sessions');
      }
      
      const data = await response.json();
      setRecentSessions(data || []);
      setServiceConnected(true);
    } catch (err) {
      console.error('Error fetching recent sessions:', err);
      setServiceConnected(false);
    }
  };

  // Fetch politician data
  const fetchPoliticianData = async () => {
    if (!politicianId || politicianId.trim() === '') {
      setPoliticianData(null);
      return;
    }
    
    try {
      const response = await fetch('/api/scrapers?service=vote&action=politician', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ politicianId: parseInt(politicianId) }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch politician data');
      }
      
      const data = await response.json();
      setPoliticianData(data);
    } catch (err) {
      console.error('Error fetching politician data:', err);
      setPoliticianData(null);
    }
  };

  // Start scraping
  const startScraping = async () => {
    setError(null);
    try {
      const response = await fetch('/api/scrapers?service=vote&action=scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          startG: 50000, 
          endG: 100000,
          reverse: true,
          parallelSessions: 10,
          skipExisting: true
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start scraping');
      }
      
      // Fetch recent sessions after starting scraping
      setTimeout(fetchRecentSessions, 3000);
    } catch (err: any) {
      console.error('Error starting scraping:', err);
      setError(err.message || 'Failed to start scraping');
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDatabaseStats();
    fetchRecentSessions();
    
    // Set up polling for recent sessions
    const interval = setInterval(() => {
      fetchRecentSessions();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch politician data when ID changes
  useEffect(() => {
    fetchPoliticianData();
  }, [politicianId]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Vote Scraper</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${serviceConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-muted-foreground">
              {serviceConnected ? 'Service Connected' : 'Service Disconnected'}
            </span>
          </div>
          <Button variant="link" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md">
          {error}
          {!serviceConnected && (
            <div className="mt-2">
              <p className="text-sm">The vote scraper service is not running. Please make sure it's started with:</p>
              <pre className="bg-muted p-2 rounded mt-1 text-xs overflow-x-auto">
                node src/scraper-ui.js
              </pre>
            </div>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ScraperStatus 
          title="Vote Scraper Status" 
          statusEndpoint="/api/scrapers?service=vote&action=status"
          refreshInterval={3000}
        />
        
        <DataStats
          title="Vote Statistics"
          statsEndpoint="/api/scrapers?service=vote&action=stats"
          refreshInterval={30000}
          statMappings={{
            sessions_count: { 
              label: "Voting Sessions", 
              format: (value) => value.toLocaleString() 
            },
            votes_count: { 
              label: "Individual Votes", 
              format: (value) => value.toLocaleString() 
            },
            latest_session: { 
              label: "Latest Session", 
              format: (value) => new Date(value).toLocaleDateString() 
            }
          }}
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Scrape Voting Data</CardTitle>
          <CardDescription>
            Fetch voting data from the Czech Parliament
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            This will scrape voting data from the Czech Parliament website.
            The process runs in the background and can take several minutes to complete.
          </p>
          <div className="bg-muted p-4 rounded-md mb-4">
            <h3 className="text-sm font-medium mb-2">Configuration</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Session Range:</span>{' '}
                <span className="font-medium">50000 - 100000</span>
              </div>
              <div>
                <span className="text-muted-foreground">Direction:</span>{' '}
                <span className="font-medium">Newest First</span>
              </div>
              <div>
                <span className="text-muted-foreground">Parallel Sessions:</span>{' '}
                <span className="font-medium">10</span>
              </div>
              <div>
                <span className="text-muted-foreground">Skip Existing:</span>{' '}
                <span className="font-medium">Yes</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={startScraping} 
            className="bg-green-600 hover:bg-green-700"
          >
            Start Scraping
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Voting Sessions</CardTitle>
          <CardDescription>
            Recently collected voting sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentSessions.length > 0 ? (
            <div className="space-y-4">
              {recentSessions.map((session, index) => (
                <div key={index} className="border border-border rounded-md p-4 bg-card">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Session ID: {session.session_id}</span>
                    <span className="text-muted-foreground text-sm">
                      {session.date ? new Date(session.date).toLocaleDateString() : 'No date'}
                    </span>
                  </div>
                  <p className="text-foreground mb-2">
                    {session.title || 'No title available'}
                  </p>
                  <div className="text-sm text-muted-foreground">
                    Votes recorded: {session.vote_count || 0}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No voting data has been collected yet. Start scraping to see voting sessions here.
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Politician Vote Lookup</CardTitle>
          <CardDescription>
            Look up voting records for a specific politician
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label htmlFor="politician-id" className="block text-sm font-medium mb-1">
              Politician ID
            </label>
            <div className="flex gap-2">
              <input
                id="politician-id"
                type="number"
                value={politicianId}
                onChange={(e) => setPoliticianId(e.target.value)}
                placeholder="Enter politician ID"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button 
                onClick={fetchPoliticianData}
                variant="outline"
              >
                Look Up
              </Button>
            </div>
          </div>
          
          {politicianData && (
            <div className="space-y-4">
              <div className="bg-card border border-border p-4 rounded-md">
                <h3 className="text-lg font-medium mb-2">{politicianData.politician.name}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Party</p>
                    <p className="font-medium">{politicianData.politician.party || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Votes</p>
                    <p className="font-medium">{politicianData.totalVotes}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Vote Statistics</h4>
                <div className="bg-card border border-border p-4 rounded-md">
                  <div className="grid grid-cols-2 gap-4">
                    {politicianData.voteStats.map((stat: VoteStats, index: number) => (
                      <div key={index}>
                        <p className="text-sm text-muted-foreground">{stat.vote}</p>
                        <p className="font-medium">{stat.count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Recent Votes</h4>
                <div className="space-y-2">
                  {politicianData.recentVotes.map((vote: RecentVote, index: number) => (
                    <div key={index} className="bg-card border border-border p-4 rounded-md">
                      <p className="font-medium">{vote.title}</p>
                      <div className="flex justify-between mt-2">
                        <p className="text-sm text-muted-foreground">{new Date(vote.date).toLocaleDateString()}</p>
                        <Badge variant={vote.vote === 'A' ? 'default' : vote.vote === 'N' ? 'destructive' : 'outline'}>
                          {vote.vote === 'A' ? 'Yes' : vote.vote === 'N' ? 'No' : vote.vote}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 