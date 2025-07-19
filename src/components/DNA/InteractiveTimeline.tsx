
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Music } from "lucide-react";

interface InteractiveTimelineProps {
  chartData: any;
  analysis: any;
}

export function InteractiveTimeline({ chartData, analysis }: InteractiveTimelineProps) {
  const decades = chartData.yearDistribution || [];

  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Your Musical Journey Through Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {analysis.culturalContext.timeline && (
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4 border border-blue-500/20">
              <p className="text-white/80">{analysis.culturalContext.timeline}</p>
            </div>
          )}
          
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500"></div>
            
            <div className="space-y-8">
              {decades.map((decade: any, index: number) => (
                <div key={decade.decade} className="relative flex items-start gap-6">
                  {/* Timeline dot */}
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm border-4 border-slate-900 z-10">
                    {decade.decade}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-bold text-white">{decade.decade}</h3>
                      <Badge className="bg-purple-500/20 text-purple-200 border-purple-500/30">
                        <Music className="h-3 w-3 mr-1" />
                        {decade.count} albums
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-white/80">
                        A significant period in your collection with {decade.count} albums.
                      </div>
                      
                      {/* Cultural context for this decade */}
                      {analysis.culturalContext.movements?.find((movement: string) => 
                        movement.toLowerCase().includes(decade.decade.toLowerCase())
                      ) && (
                        <div className="mt-3 p-3 bg-white/5 rounded border border-white/10">
                          <h4 className="font-semibold text-white text-sm mb-1">Cultural Movement</h4>
                          <p className="text-white/70 text-sm">
                            {analysis.culturalContext.movements.find((movement: string) => 
                              movement.toLowerCase().includes(decade.decade.toLowerCase())
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
