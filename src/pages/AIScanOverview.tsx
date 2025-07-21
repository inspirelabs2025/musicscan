import { useState, useMemo, useCallback } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/StatCard";
import { AIScanDetailModal } from "@/components/AIScanDetailModal";
import { EditScanModal } from "@/components/EditScanModal";
import { DeleteScanDialog } from "@/components/DeleteScanDialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Search, 
  Download, 
  ChevronUp, 
  ChevronDown, 
  Eye,
  ExternalLink,
  Scan,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Copy,
  Check,
  RotateCcw,
  Edit,
  Trash2,
  Flag,
  FlagOff
} from "lucide-react";
import { useAIScans, useAIScansStats, AIScanResult } from "@/hooks/useAIScans";
import { useToast } from "@/hooks/use-toast";
import { useProcessedRows } from "@/hooks/useProcessedRows";
import { supabase } from "@/integrations/supabase/client";

const AIScanOverview = () => {
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<keyof AIScanResult>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [mediaTypeFilter, setMediaTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedScan, setSelectedScan] = useState<AIScanResult | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [scanToEdit, setScanToEdit] = useState<AIScanResult | null>(null);
  const [scanToDelete, setScanToDelete] = useState<AIScanResult | null>(null);

  const { toast } = useToast();
  const { processedRows, addProcessedRow, resetProcessedRows: resetProcessed, isProcessed } = useProcessedRows();

  const pageSize = 25;

  const { data: scansData, isLoading: scansLoading } = useAIScans({
    page,
    pageSize,
    sortField,
    sortDirection,
    searchTerm,
    mediaTypeFilter,
    statusFilter
  });

  const { data: statsData, isLoading: statsLoading } = useAIScansStats();

  const handleSort = useCallback((field: keyof AIScanResult) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setPage(1);
  }, [sortField]);

  const getSortIcon = useCallback((field: keyof AIScanResult) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  }, [sortField, sortDirection]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "completed": return "bg-success text-success-foreground";
      case "failed": return "bg-destructive text-destructive-foreground";
      case "pending": return "bg-warning text-warning-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  }, []);

  const getMediaTypeColor = useCallback((mediaType: string) => {
    return mediaType === "vinyl" 
      ? "bg-primary text-primary-foreground" 
      : "bg-secondary text-secondary-foreground";
  }, []);

  const exportToCSV = useCallback(() => {
    if (!scansData?.data) return;

    const headers = [
      "Date", "Artist", "Title", "Label", "Catalog Number", "Media Type", 
      "Condition", "Confidence Score", "Status", "Discogs URL", "AI Description"
    ];

    const csvContent = [
      headers.join(","),
      ...scansData.data.map(scan => [
        new Date(scan.created_at).toLocaleDateString(),
        `"${scan.artist || ""}"`,
        `"${scan.title || ""}"`,
        `"${scan.label || ""}"`,
        `"${scan.catalog_number || ""}"`,
        scan.media_type,
        scan.condition_grade,
        scan.confidence_score ? Math.round(scan.confidence_score * 100) : "",
        scan.status,
        `"${scan.discogs_url || ""}"`,
        `"${scan.ai_description || ""}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-scans-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [scansData?.data]);

  const handleViewDetails = useCallback((scan: AIScanResult) => {
    setSelectedScan(scan);
    setShowDetailModal(true);
  }, []);

  const copyDiscogsId = useCallback(async (scan: AIScanResult) => {
    if (!scan.discogs_id) {
      console.warn('⚠️ No Discogs ID to copy for scan:', scan.id);
      return;
    }
    
    console.log('📋 Copying Discogs ID:', scan.discogs_id, 'for scan:', scan.id);
    
    try {
      await navigator.clipboard.writeText(scan.discogs_id.toString());
      
      // Update processed rows with immediate visual feedback
      addProcessedRow(scan.id);
      
      toast({
        title: "📋 Gekopieerd!",
        description: `Discogs ID ${scan.discogs_id} gekopieerd naar klembord en gemarkeerd als verwerkt.`,
      });
    } catch (error) {
      console.error('❌ Failed to copy Discogs ID:', error);
      toast({
        title: "Fout",
        description: "Kon Discogs ID niet kopiëren. Controleer je browser instellingen.",
        variant: "destructive",
      });
    }
  }, [toast, addProcessedRow]);

  const resetProcessedRows = useCallback(() => {
    console.log('🔄 Resetting processed rows');
    resetProcessed();
    toast({
      title: "🔄 Reset voltooid",
      description: "Alle verwerkte rijen zijn gereset.",
    });
  }, [toast, resetProcessed]);

  const handleEditScan = useCallback((scan: AIScanResult) => {
    setScanToEdit(scan);
    setShowEditModal(true);
  }, []);

  const handleDeleteScan = useCallback((scan: AIScanResult) => {
    setScanToDelete(scan);
    setShowDeleteDialog(true);
  }, []);

  const handleEditSuccess = useCallback(() => {
    // Refresh the data by resetting the page - this will trigger a refetch
    setPage(1);
  }, []);

  const handleDeleteSuccess = useCallback(() => {
    // Refresh the data by resetting the page - this will trigger a refetch
    setPage(1);
  }, []);

  const toggleFlagIncorrect = useCallback(async (scan: AIScanResult) => {
    try {
      const newFlaggedStatus = !scan.is_flagged_incorrect;
      
      const { error } = await supabase
        .from('ai_scan_results')
        .update({ is_flagged_incorrect: newFlaggedStatus })
        .eq('id', scan.id);

      if (error) throw error;

      // Refresh the data
      setPage(page); // This will trigger a refetch
      
      toast({
        title: newFlaggedStatus ? "🏴 Gemarkeerd als Incorrect" : "✅ Markering Weggehaald",
        description: newFlaggedStatus 
          ? "Deze scan is gemarkeerd als incorrect." 
          : "De incorrecte markering is weggehaald.",
      });
    } catch (error) {
      console.error('Error toggling flag:', error);
      toast({
        title: "Fout",
        description: "Kon de markering niet wijzigen.",
        variant: "destructive",
      });
    }
  }, [page, toast]);

  if (scansLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading AI scan data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">AI Scan Overzicht</h1>
              <p className="text-muted-foreground mt-2">
                Beheer en analyseer alle AI-gestuurde foto scans
              </p>
            </div>
            <Button onClick={exportToCSV} disabled={!scansData?.data?.length}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Statistics */}
          {statsData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Totaal Scans"
                value={statsData.totalScans}
                icon={Scan}
                subtitle={`${statsData.mediaTypeBreakdown.vinyl} LP • ${statsData.mediaTypeBreakdown.cd} CD`}
              />
              <StatCard
                title="Succesvol"
                value={statsData.completedScans}
                icon={CheckCircle}
                subtitle={`${Math.round(statsData.successRate)}% success rate`}
              />
              <StatCard
                title="Gem. Vertrouwen"
                value={`${Math.round(statsData.avgConfidence * 100)}%`}
                icon={TrendingUp}
                subtitle="AI confidence score"
              />
              <StatCard
                title="Mislukt"
                value={statsData.failedScans}
                icon={XCircle}
                subtitle={`${statsData.pendingScans} nog bezig`}
              />
            </div>
          )}

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters en Zoeken</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Zoek artist, titel, label..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={mediaTypeFilter}
                  onValueChange={(value) => {
                    setMediaTypeFilter(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Media Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Types</SelectItem>
                    <SelectItem value="vinyl">Vinyl</SelectItem>
                    <SelectItem value="cd">CD</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    <SelectItem value="completed">Voltooid</SelectItem>
                    <SelectItem value="failed">Mislukt</SelectItem>
                    <SelectItem value="pending">Bezig</SelectItem>
                  </SelectContent>
                </Select>
                 <Button
                   variant="outline"
                   onClick={() => {
                     setSearchTerm("");
                     setMediaTypeFilter("all");
                     setStatusFilter("all");
                     setPage(1);
                   }}
                 >
                   Reset Filters
                 </Button>
               </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-4">
                    {processedRows.size > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span className="text-sm font-medium">
                            {processedRows.size} rij{processedRows.size !== 1 ? 'en' : ''} verwerkt
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetProcessedRows}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Reset Verwerkt
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Debug info in development */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-muted-foreground font-mono">
                      localStorage: {localStorage.getItem('ai-scan-processed-rows')?.length || 0} chars
                    </div>
                  )}
                </div>
             </CardContent>
           </Card>

          {/* Results Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Foto</TableHead>
                      <TableHead>
                        <Button 
                          variant="ghost" 
                          className="h-auto p-0 font-medium"
                          onClick={() => handleSort("created_at")}
                        >
                          Datum {getSortIcon("created_at")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button 
                          variant="ghost" 
                          className="h-auto p-0 font-medium"
                          onClick={() => handleSort("discogs_id")}
                        >
                          Discogs ID {getSortIcon("discogs_id")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button 
                          variant="ghost" 
                          className="h-auto p-0 font-medium"
                          onClick={() => handleSort("condition_grade")}
                        >
                          Conditie {getSortIcon("condition_grade")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button 
                          variant="ghost" 
                          className="h-auto p-0 font-medium"
                          onClick={() => handleSort("artist")}
                        >
                          Artist - Titel {getSortIcon("artist")}
                        </Button>
                      </TableHead>
                      <TableHead>Label / Cat#</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>
                        <Button 
                          variant="ghost" 
                          className="h-auto p-0 font-medium"
                          onClick={() => handleSort("confidence_score")}
                        >
                          Vertrouwen {getSortIcon("confidence_score")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button 
                          variant="ghost" 
                          className="h-auto p-0 font-medium"
                          onClick={() => handleSort("status")}
                        >
                          Status {getSortIcon("status")}
                        </Button>
                      </TableHead>
                      <TableHead className="w-20">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                    <TableBody>
                      {scansData?.data.map((scan) => {
                        const rowIsProcessed = isProcessed(scan.id);
                        const isIncorrect = scan.is_flagged_incorrect;
                        console.log(`Row ${scan.id}: isProcessed=${rowIsProcessed}, isIncorrect=${isIncorrect}, discogs_id=${scan.discogs_id}`);
                        
                        return (
                          <TableRow 
                            key={scan.id} 
                            className={`transition-all duration-200 ${
                              isIncorrect 
                                ? "bg-purple-100 border-2 border-purple-600 border-l-8 shadow-md" 
                                : rowIsProcessed 
                                ? "bg-green-100 border-2 border-green-600 border-l-8 shadow-md" 
                                : "hover:bg-muted/50"
                            }`}
                          >
                        <TableCell>
                          {scan.photo_urls?.[0] && (
                            <div className="w-12 h-12 bg-muted rounded overflow-hidden">
                              <img 
                                src={scan.photo_urls[0]} 
                                alt="Thumbnail"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(scan.created_at).toLocaleDateString()}
                        </TableCell>
                          <TableCell>
                            <div className="font-mono text-sm relative">
                              {scan.discogs_id ? (
                                <div className="flex items-center gap-2">
                                   <span className={`${rowIsProcessed ? 'text-green-800 font-extrabold bg-white/50 px-2 py-1 rounded' : 'text-primary font-bold'}`}>
                                     {scan.discogs_id}
                                   </span>
                                   <div className="flex items-center gap-1">
                                     <Button 
                                       variant="ghost" 
                                       size="sm"
                                       onClick={() => copyDiscogsId(scan)}
                                       className={`h-6 w-6 p-0 transition-all ${
                                         rowIsProcessed 
                                           ? 'bg-green-600 hover:bg-green-700 text-white scale-110' 
                                           : 'hover:bg-primary/20'
                                       }`}
                                       title={rowIsProcessed ? 'Al gekopieerd en verwerkt' : 'Kopieer Discogs ID'}
                                     >
                                       {rowIsProcessed ? (
                                         <Check className="h-3 w-3 text-success animate-pulse" />
                                       ) : (
                                         <Copy className="h-3 w-3" />
                                       )}
                                     </Button>
                                    {scan.discogs_url && (
                                      <Button variant="ghost" size="sm" asChild className="h-6 w-6 p-0">
                                        <a href={scan.discogs_url} target="_blank" rel="noopener noreferrer">
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      </Button>
                                    )}
                                  </div>
                                   {rowIsProcessed && (
                                     <div className="absolute -top-1 -right-1">
                                       <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                                     </div>
                                   )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </div>
                          </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">
                            {scan.condition_grade}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{scan.artist || "Unknown Artist"}</div>
                            <div className="text-sm text-muted-foreground">{scan.title || "Unknown Title"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{scan.label || "—"}</div>
                            <div className="text-muted-foreground">{scan.catalog_number || "—"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getMediaTypeColor(scan.media_type)}>
                            {scan.media_type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {scan.confidence_score !== null ? (
                            <div className="space-y-1">
                              <div className="text-sm font-medium">
                                {Math.round(scan.confidence_score * 100)}%
                              </div>
                              <Progress value={scan.confidence_score * 100} className="h-1" />
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(scan.status)}>
                            {scan.status === "completed" ? "Voltooid" :
                             scan.status === "failed" ? "Mislukt" : "Bezig"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewDetails(scan)}
                              title="Bekijk details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditScan(scan)}
                              title="Bewerk scan"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => toggleFlagIncorrect(scan)}
                              title={isIncorrect ? "Verwijder markering als incorrect" : "Markeer als incorrect"}
                              className={isIncorrect ? "text-purple-600 hover:text-purple-700" : "hover:text-purple-600"}
                            >
                              {isIncorrect ? <FlagOff className="h-4 w-4" /> : <Flag className="h-4 w-4" />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteScan(scan)}
                              title="Verwijder scan"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                         </TableRow>
                       );
                     })}
                   </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {scansData && scansData.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Pagina {page} van {scansData.totalPages} ({scansData.count} totaal)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  Vorige
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(prev => Math.min(scansData.totalPages, prev + 1))}
                  disabled={page === scansData.totalPages}
                >
                  Volgende
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <AIScanDetailModal
        scan={selectedScan}
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
      />

      {/* Edit Modal */}
      <EditScanModal
        scan={scanToEdit}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setScanToEdit(null);
        }}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Dialog */}
      <DeleteScanDialog
        scan={scanToDelete}
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setScanToDelete(null);
        }}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
};

export default AIScanOverview;