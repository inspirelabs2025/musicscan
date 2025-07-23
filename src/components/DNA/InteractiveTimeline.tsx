
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Music, Calendar } from "lucide-react";

interface InteractiveTimelineProps {
  chartData: any;
  analysis: any;
}

export function InteractiveTimeline({ chartData, analysis }: InteractiveTimelineProps) {
  const decades = chartData.yearDistribution || [];

  return (
    <Card variant="dark" className="hover:bg-white/10 transition-all">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2 text-lg md:text-xl">
          <Clock className="h-5 w-5 md:h-6 md:w-6" />
          Your Musical Journey Through Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 md:space-y-8">
          {analysis.culturalContext?.timeline && (
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 md:p-6 border border-blue-500/20">
              <p className="text-white/80 text-sm md:text-base lg:text-lg leading-relaxed">{analysis.culturalContext.timeline}</p>
            </div>
          )}
          
          <div className="relative">
            {/* Timeline line - adjusted for mobile */}
            <div className="absolute left-6 md:left-8 top-0 bottom-0 w-0.5 md:w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 rounded-full"></div>
            
            <div className="space-y-8 md:space-y-12">
              {decades.map((decade: any, index: number) => (
                <div key={decade.decade} className="relative flex items-start gap-4 md:gap-8">
                  {/* Timeline dot - smaller on mobile */}
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm border-2 md:border-4 border-slate-900 z-10 shadow-lg flex-shrink-0">
                    {decade.decade}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/10 hover:bg-white/10 transition-all min-w-0">
                    <div className="flex flex-col gap-3 md:gap-4 mb-3 md:mb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-4">
                        <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-white">{decade.decade}</h3>
                        <Badge className="bg-purple-500/20 text-purple-200 border-purple-500/30 w-fit text-xs md:text-sm">
                          <Music className="h-3 w-3 mr-1" />
                          {decade.count} albums
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-3 md:space-y-4">
                      <div className="text-white/80 text-sm md:text-base leading-relaxed">
                        A significant period in your collection with {decade.count} albums. This decade represents{' '}
                        {((decade.count / chartData.yearDistribution.reduce((sum: number, d: any) => sum + d.count, 0)) * 100).toFixed(1)}%{' '}
                        of your total collection.
                      </div>
                      
                      {/* Cultural context for this decade */}
                      {analysis.culturalContext?.movements?.find((movement: string) => 
                        movement.toLowerCase().includes(decade.decade.toLowerCase())
                      ) && (
                        <div className="mt-3 md:mt-4 p-3 md:p-4 bg-white/5 rounded-lg border border-white/10">
                          <h4 className="font-semibold text-white text-xs md:text-sm mb-2 flex items-center gap-2">
                            <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                            Cultural Movement
                          </h4>
                          <p className="text-white/70 text-xs md:text-sm leading-relaxed">
                            {analysis.culturalContext.movements.find((movement: string) => 
                              movement.toLowerCase().includes(decade.decade.toLowerCase())
                            )}
                          </p>
                        </div>
                      )}

                      {/* Progress bar showing relative size */}
                      <div className="mt-3 md:mt-4">
                        <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                          <span>Collection representation</span>
                          <span>{((decade.count / chartData.yearDistribution.reduce((sum: number, d: any) => sum + d.count, 0)) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5 md:h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-1.5 md:h-2 rounded-full transition-all duration-1000"
                            style={{ 
                              width: `${(decade.count / chartData.yearDistribution.reduce((sum: number, d: any) => sum + d.count, 0)) * 100}%`
                            }}
                          />
                        </div>
                      </div>
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
