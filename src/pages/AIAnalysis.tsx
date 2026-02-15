import React from 'react';
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MusicDNAExplorer } from "@/components/MusicDNAExplorer";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AIAnalysis() {
  const navigate = useNavigate();
  const { tr } = useLanguage();

  return (
    <>
      <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate('/collection-overview')} className="w-fit">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {tr.common.back}
              </Button>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold">{tr.aiAnalysis.title}</h1>
                <p className="text-sm sm:text-base text-muted-foreground">{tr.aiAnalysis.subtitle}</p>
              </div>
            </div>
          </div>
        </div>
        <MusicDNAExplorer />
      </div>
    </>
  );
}
