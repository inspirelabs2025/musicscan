import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CatalogTest from "./pages/CatalogTest";
import VinylScanComplete from "./pages/VinylScanComplete";
import BulkerImage from "./pages/BulkerImage";
import MarketplaceOverview from "./pages/MarketplaceOverview";
import CollectionOverview from "./pages/CollectionOverview";
import AIScan from "./pages/AIScan";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<VinylScanComplete />} />
          <Route path="/ai-scan" element={<AIScan />} />
          <Route path="/bulkerimage" element={<BulkerImage />} />
          <Route path="/catalog-test" element={<CatalogTest />} />
          <Route path="/index" element={<Index />} />
          <Route path="/marketplace-overview" element={<MarketplaceOverview />} />
          <Route path="/collection-overview" element={<CollectionOverview />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
