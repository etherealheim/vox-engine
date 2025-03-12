'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { useToast } from '../ui/use-toast';

/**
 * CacheManager component
 * 
 * This component displays cache statistics and provides controls for managing the cache.
 */
export default function CacheManager() {
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch cache statistics
  const fetchCacheStats = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const response = await fetch('/api/scrapers?service=cache&action=stats');
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch cache statistics');
      }
      
      const data = await response.json();
      setCacheStats(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching cache statistics');
      toast({
        title: 'Error',
        description: err.message || 'Failed to fetch cache statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Clear the cache
  const clearCache = async () => {
    try {
      setClearing(true);
      setError(null);
      const response = await fetch('/api/scrapers?service=cache&action=clear', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to clear cache');
      }
      
      toast({
        title: 'Success',
        description: 'Cache cleared successfully',
      });
      
      // Refresh cache statistics
      fetchCacheStats();
    } catch (err: any) {
      setError(err.message || 'An error occurred while clearing the cache');
      toast({
        title: 'Error',
        description: err.message || 'Failed to clear cache',
        variant: 'destructive',
      });
    } finally {
      setClearing(false);
    }
  };

  // Fetch cache statistics on component mount
  useEffect(() => {
    fetchCacheStats();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Cache Manager</CardTitle>
        <CardDescription>
          View and manage the application cache
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center text-destructive p-4">
            <p>{error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Cache Size</h3>
                <p className="text-2xl font-bold">
                  {cacheStats?.size || 0} items
                </p>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Hit Rate</h3>
                <p className="text-2xl font-bold">
                  {cacheStats?.hitRate ? `${(cacheStats.hitRate * 100).toFixed(1)}%` : 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Cache Details</h3>
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Hits:</span>
                  <span className="font-medium">{cacheStats?.hits || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Misses:</span>
                  <span className="font-medium">{cacheStats?.misses || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Size:</span>
                  <span className="font-medium">{cacheStats?.maxSize || 0} items</span>
                </div>
                <div className="flex justify-between">
                  <span>TTL:</span>
                  <span className="font-medium">{cacheStats?.ttl ? `${cacheStats.ttl / 1000} seconds` : 'N/A'}</span>
                </div>
              </div>
            </div>
            
            {cacheStats?.keyTypes && (
              <div className="space-y-2">
                <h3 className="font-medium">Cached Data Types</h3>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <ul className="space-y-1">
                    {Object.entries(cacheStats.keyTypes).map(([type, count]: [string, any]) => (
                      <li key={type} className="flex justify-between">
                        <span>{type}:</span>
                        <span className="font-medium">{count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={fetchCacheStats}
          disabled={refreshing || clearing}
        >
          {refreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={clearCache}
          disabled={clearing || refreshing || loading}
        >
          {clearing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Clearing...
            </>
          ) : (
            <>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Cache
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 