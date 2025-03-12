"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  WrenchIcon, 
  TwitterIcon, 
  BarChart3, 
  Clock, 
  Users, 
  MessageSquare,
  ThumbsUp,
  Repeat,
  ExternalLink,
  ChevronLeft
} from "lucide-react";
import { ScraperStatus } from "../components/shared/scraper-status";
import { DataStats } from "../components/shared/data-stats";

// Define types for our data
interface Politician {
  id: number;
  name: string;
  twitter: string;
}

interface Tweet {
  id: string;
  tweet_id?: string;
  politician_id: number;
  politician_name?: string;
  content: string;
  url?: string;
  posted_at?: string;
  created_at: string;
}

interface FetchResults {
  totalPoliticians: number;
  processedPoliticians: number;
  totalNewTweets: number;
  totalSkippedTweets: number;
  details: {
    politicianId: number;
    name: string;
    twitterHandle: string;
    newTweets: number;
    skippedTweets: number;
    totalTweets: number;
    error?: string;
  }[];
  rateLimited: boolean;
}

export default function TwitterScraper() {
  // State for Twitter Scraper
  const [recentTweets, setRecentTweets] = useState<Tweet[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // State for TwitterFetcher
  const [isLoading, setIsLoading] = useState(false);
  const [isFixingHandles, setIsFixingHandles] = useState(false);
  const [politicians, setPoliticians] = useState<Politician[]>([]);
  const [results, setResults] = useState<FetchResults | null>(null);
  const [fixResults, setFixResults] = useState<any | null>(null);
  const [newHandle, setNewHandle] = useState<string>('');
  const [selectedPolitician, setSelectedPolitician] = useState<number | null>(null);
  const [isAddingHandle, setIsAddingHandle] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Fetch politicians with Twitter handles
  const fetchPoliticians = useCallback(async () => {
    try {
      const response = await fetch('/api/twitter?action=politicians');
      if (!response.ok) {
        throw new Error('Failed to fetch politicians');
      }
      const data = await response.json();
      setPoliticians(data);
    } catch (err: any) {
      console.error('Error fetching politicians:', err);
      setError(err.message || 'Failed to fetch politicians');
    }
  }, []);

  // Fetch recent tweets
  const fetchRecentTweets = useCallback(async () => {
    try {
      // Try the new endpoint first
      const response = await fetch('/api/scrapers?service=twitter&action=recent-tweets');
      if (!response.ok) {
        // Fall back to the old endpoint
        const fallbackResponse = await fetch('/api/twitter?action=recent-tweets&limit=5');
        if (!fallbackResponse.ok) {
          throw new Error('Failed to fetch recent tweets');
        }
        const data = await fallbackResponse.json();
        setRecentTweets(data);
        return;
      }
      
      const data = await response.json();
      setRecentTweets(data || []);
    } catch (err) {
      console.error('Error fetching recent tweets:', err);
      // Don't set error for tweets, just log it
    }
  }, []);

  // Fetch politicians and recent tweets on mount
  useEffect(() => {
    fetchPoliticians();
    fetchRecentTweets();
    
    // Set up polling for recent tweets
    const interval = setInterval(fetchRecentTweets, 10000);
    
    return () => clearInterval(interval);
  }, [fetchPoliticians, fetchRecentTweets]);

  // Refetch recent tweets when results change
  useEffect(() => {
    if (results) {
      fetchRecentTweets();
    }
  }, [results, fetchRecentTweets]);

  // Start scraping from the new endpoint
  const startScraping = async () => {
    setError(null);
    try {
      const response = await fetch('/api/scrapers?service=twitter&action=fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start scraping');
      }
      
      // Fetch recent tweets after starting scraping
      setTimeout(fetchRecentTweets, 3000);
    } catch (err: any) {
      console.error('Error starting scraping:', err);
      setError(err.message || 'Failed to start scraping');
    }
  };

  // Fetch tweets from the old endpoint
  const fetchTweets = async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      // Use a smaller batch size to avoid rate limiting
      const maxTweets = 10; // Reduced from 100 to avoid rate limiting

      const response = await fetch('/api/twitter?action=fetch-tweets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ maxTweets }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Special handling for rate limiting
        if (response.status === 429) {
          throw new Error('Twitter API rate limit exceeded. Please try again in a few minutes.');
        }
        
        throw new Error(errorData.error || 'Failed to fetch tweets');
      }

      const data = await response.json();
      setResults(data.results);
      
      // Show warning if rate limited
      if (data.results.rateLimited) {
        setError('Some requests were rate limited. Not all tweets could be fetched. Try again later.');
      }
      
      // Refresh politicians list after fetching tweets
      fetchPoliticians();
    } catch (err: any) {
      console.error('Error fetching tweets:', err);
      setError(err.message || 'Failed to fetch tweets');
    } finally {
      setIsLoading(false);
    }
  };

  // Check and fix Twitter handles
  const checkAndFixHandles = async () => {
    setIsFixingHandles(true);
    setError(null);
    setFixResults(null);

    try {
      const response = await fetch('/api/twitter?action=fix-handles');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fix Twitter handles');
      }

      const data = await response.json();
      setFixResults(data);
      
      // Refresh politicians list after fixing handles
      fetchPoliticians();
    } catch (err: any) {
      console.error('Error fixing Twitter handles:', err);
      setError(err.message || 'Failed to fix Twitter handles');
    } finally {
      setIsFixingHandles(false);
    }
  };

  // Add or update a Twitter handle for a politician
  const addTwitterHandle = async () => {
    if (!selectedPolitician || !newHandle) {
      setError('Please select a politician and enter a Twitter handle');
      return;
    }

    setIsAddingHandle(true);
    setError(null);

    try {
      const response = await fetch('/api/twitter?action=update-handle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          politicianId: selectedPolitician,
          twitterHandle: newHandle.startsWith('@') ? newHandle.substring(1) : newHandle,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update Twitter handle');
      }

      const data = await response.json();
      
      // Refresh politicians list after updating handle
      fetchPoliticians();
      
      // Reset form
      setNewHandle('');
      setSelectedPolitician(null);
      
      // Show success alert
      alert('Twitter handle updated successfully');
    } catch (err: any) {
      console.error('Error updating Twitter handle:', err);
      setError(err.message || 'Failed to update Twitter handle');
    } finally {
      setIsAddingHandle(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-2 mb-8">
        <Link 
          href="/"
          className="bg-secondary hover:bg-secondary/90 text-secondary-foreground py-1 px-3 rounded-md text-sm flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-8">Twitter Data Collection</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Tools</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ScraperStatus 
              title="Twitter Scraper Status" 
              statusEndpoint="/api/scrapers?service=twitter&action=status"
              refreshInterval={3000}
            />
            
            <DataStats
              title="Twitter Statistics"
              statsEndpoint="/api/scrapers?service=twitter&action=stats"
              refreshInterval={30000}
              statMappings={{
                total_tweets: { 
                  label: "Total Tweets", 
                  format: (value) => value.toLocaleString() 
                },
                politicians_with_tweets: { 
                  label: "Politicians with Tweets", 
                  format: (value) => value.toLocaleString() 
                },
                latest_tweet: { 
                  label: "Latest Tweet", 
                  format: (value) => new Date(value).toLocaleDateString() 
                }
              }}
            />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Scrape Tweets from Politicians</CardTitle>
              <CardDescription>
                Fetch tweets from politicians with Twitter handles in the database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                This will fetch tweets from all politicians in the database who have Twitter handles.
                The process runs in the background and can take several minutes depending on the number of politicians.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={startScraping} 
                className="bg-blue-600 hover:bg-blue-700"
              >
                Start Scraping
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Tweets</CardTitle>
              <CardDescription>
                Sample of recently collected tweets
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentTweets.length > 0 ? (
                <div className="space-y-4">
                  {recentTweets.map((tweet) => (
                    <div key={tweet.id} className="bg-card border border-border rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-foreground">{tweet.politician_name || "Unknown Politician"}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(tweet.created_at || tweet.posted_at || new Date()).toLocaleString()}
                          </p>
                        </div>
                        {tweet.url && (
                          <a 
                            href={tweet.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                      </div>
                      <p className="text-foreground">{tweet.content || "No content available"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No tweets have been collected yet. Start scraping to see tweets here.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Twitter Tools</CardTitle>
              <CardDescription>
                Additional tools for managing Twitter data collection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Fetch Tweets Manually */}
              <div className="border border-border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2">Fetch Tweets Manually</h3>
                <p className="text-muted-foreground mb-4">
                  Manually fetch tweets from politicians with Twitter handles. This uses the legacy API endpoint.
                </p>
                <Button 
                  onClick={fetchTweets} 
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <TwitterIcon className="h-4 w-4" />
                      Fetch Tweets
                    </>
                  )}
                </Button>
                
                {results && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Results</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Politicians Processed:</span>{' '}
                        <span className="font-medium">{results.processedPoliticians} / {results.totalPoliticians}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">New Tweets:</span>{' '}
                        <span className="font-medium">{results.totalNewTweets}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Skipped Tweets:</span>{' '}
                        <span className="font-medium">{results.totalSkippedTweets}</span>
                      </div>
                      {results.rateLimited && (
                        <div className="col-span-2">
                          <Badge variant="destructive">Rate Limited</Badge>
                          <span className="ml-2 text-muted-foreground">Some requests were rate limited</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Fix Twitter Handles */}
              <div className="border border-border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2">Fix Twitter Handles</h3>
                <p className="text-muted-foreground mb-4">
                  Check and fix Twitter handles in the database. This will clean up URLs and remove invalid characters.
                </p>
                <Button 
                  onClick={checkAndFixHandles} 
                  disabled={isFixingHandles}
                  className="flex items-center gap-2"
                >
                  {isFixingHandles ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Fixing...
                    </>
                  ) : (
                    <>
                      <WrenchIcon className="h-4 w-4" />
                      Fix Handles
                    </>
                  )}
                </Button>
                
                {fixResults && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Results</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total Handles:</span>{' '}
                        <span className="font-medium">{fixResults.total}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fixed Handles:</span>{' '}
                        <span className="font-medium">{fixResults.fixed}</span>
                      </div>
                    </div>
                    
                    {fixResults.details && fixResults.details.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Fixed Handles</h4>
                        <div className="max-h-60 overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2">Name</th>
                                <th className="text-left py-2">Original</th>
                                <th className="text-left py-2">Fixed</th>
                              </tr>
                            </thead>
                            <tbody>
                              {fixResults.details.map((detail: any, index: number) => (
                                <tr key={index} className="border-b">
                                  <td className="py-2">{detail.name}</td>
                                  <td className="py-2">{detail.original}</td>
                                  <td className="py-2">{detail.fixed}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Add/Update Twitter Handle */}
              <div className="border border-border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2">Add/Update Twitter Handle</h3>
                <p className="text-muted-foreground mb-4">
                  Add or update a Twitter handle for a politician in the database.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="politician" className="block text-sm font-medium mb-1">
                      Politician
                    </label>
                    <select
                      id="politician"
                      value={selectedPolitician || ''}
                      onChange={(e) => setSelectedPolitician(Number(e.target.value))}
                      className="w-full p-2 border border-border rounded-md"
                    >
                      <option value="">Select a politician</option>
                      {politicians.map((politician) => (
                        <option key={politician.id} value={politician.id}>
                          {politician.name} {politician.twitter ? `(@${politician.twitter})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="twitterHandle" className="block text-sm font-medium mb-1">
                      Twitter Handle
                    </label>
                    <input
                      id="twitterHandle"
                      type="text"
                      value={newHandle}
                      onChange={(e) => setNewHandle(e.target.value)}
                      placeholder="@username"
                      className="w-full p-2 border border-border rounded-md"
                    />
                  </div>
                </div>
                <Button 
                  onClick={addTwitterHandle} 
                  disabled={isAddingHandle || !selectedPolitician || !newHandle}
                  className="flex items-center gap-2"
                >
                  {isAddingHandle ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <TwitterIcon className="h-4 w-4" />
                      Update Handle
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 