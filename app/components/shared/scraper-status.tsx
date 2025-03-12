'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

interface ScraperStatusProps {
  title: string;
  statusEndpoint: string;
  refreshInterval?: number;
}

interface StatusData {
  isRunning: boolean;
  progress: number;
  totalItems: number;
  processedItems: number;
  startTime: string | null;
  errors: Array<{ time: string; message: string }>;
  logs: Array<{ time: string; message: string }>;
}

export function ScraperStatus({ 
  title, 
  statusEndpoint, 
  refreshInterval = 5000 
}: ScraperStatusProps) {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(statusEndpoint);
        if (!response.ok) {
          throw new Error('Failed to fetch status');
        }
        const data = await response.json();
        setStatus(data);
        setError(null);
      } catch (err) {
        setError('Failed to connect to scraper service');
        console.error('Error fetching status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, refreshInterval);
    
    return () => clearInterval(interval);
  }, [statusEndpoint, refreshInterval]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="animate-pulse text-muted-foreground">Loading status...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">No status data available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <Badge variant={status.isRunning ? "default" : "outline"}>
            {status.isRunning ? "Running" : "Idle"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1 text-sm">
              <span>Progress</span>
              <span>{status.progress}%</span>
            </div>
            <Progress value={status.progress} />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Items Processed:</span>{' '}
              <span className="font-medium">{status.processedItems} / {status.totalItems}</span>
            </div>
            {status.startTime && (
              <div>
                <span className="text-muted-foreground">Started:</span>{' '}
                <span className="font-medium">{new Date(status.startTime).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
          
          {status.errors.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Errors</h4>
              <div className="bg-destructive/10 p-2 rounded-md max-h-24 overflow-y-auto text-xs">
                {status.errors.map((err, i) => (
                  <div key={i} className="mb-1">
                    <span className="text-muted-foreground">{new Date(err.time).toLocaleTimeString()}: </span>
                    {err.message}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {status.logs.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Recent Logs</h4>
              <div className="bg-muted p-2 rounded-md max-h-32 overflow-y-auto text-xs">
                {status.logs.slice(-5).map((log, i) => (
                  <div key={i} className="mb-1">
                    <span className="text-muted-foreground">{new Date(log.time).toLocaleTimeString()}: </span>
                    {log.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 