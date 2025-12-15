import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { AIScanDetailModal } from "@/components/AIScanDetailModal";
import { EditScanModal } from "@/components/EditScanModal";
import { DeleteScanDialog } from "@/components/DeleteScanDialog";
import { CommentsModal } from "@/components/CommentsModal";
import { ImageLightboxModal } from "@/components/ImageLightboxModal";
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
  FlagOff,
  MessageSquare,
  X,
  Loader2,
  Users,
  Database,
  Disc,
  ShoppingCart
} from "lucide-react";
import { useUnifiedScans, useUnifiedScansStats, UnifiedScanResult } from "@/hooks/useUnifiedScans";
import { useToast } from "@/hooks/use-toast";
import { useProcessedRows } from "@/hooks/useProcessedRows";
import { useDuplicateDetection } from "@/hooks/useDuplicateDetection";
import { useMarketplaceStatus } from "@/hooks/useMarketplaceStatus";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const UnifiedScanOverview = () => {
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [mediaTypeFilter, setMediaTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
  const [selectedScan, setSelectedScan] = useState<UnifiedScanResult | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [scanToEdit, setScanToEdit] = useState<UnifiedScanResult | null>(null);
  const [scanToDelete, setScanToDelete] = useState<UnifiedScanResult | null>(null);
  const [scanToComment, setScanToComment] = useState<UnifiedScanResult | null>(null);
  
  // Lightbox state
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { processedRows, addProcessedRow, resetProcessedRows: resetProcessed, isProcessed } = useProcessedRows();
  const loadingRef = useRef<HTMLDivElement>(null);

  const pageSize = 25;

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    data: scansData,
    isLoading: scansLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useUnifiedScans({
    pageSize,
    sortField,
    sortDirection,
    searchTerm: debouncedSearchTerm,
    mediaTypeFilter,
    statusFilter
  });

  const { data: statsData, isLoading: statsLoading } = useUnifiedScansStats();
  const stats = statsData?.pages?.[0];

  // Flatten all pages of scans
  const allScans = useMemo(() => {
    return scansData?.pages?.flatMap(page => page.data) || [];
  }, [scansData]);

  // Initialize duplicate detection and marketplace status
  const duplicateInfo = useDuplicateDetection(allScans as any[]); // Type assertion for compatibility
  const { data: marketplaceStatusData } = useMarketplaceStatus(allScans as any[]); // Type assertion for compatibility
  const marketplaceStatuses = marketplaceStatusData || new Map<string, boolean>();

  // Filter scans based on showDuplicatesOnly
  const filteredScans = useMemo(() => {
    if (!showDuplicatesOnly) return allScans;
    return allScans.filter(scan => duplicateInfo.getDuplicateInfo(scan.id).isDuplicate);
  }, [allScans, showDuplicatesOnly, duplicateInfo]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!loadingRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadingRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "failed": return "bg-red-100 text-red-800 border-red-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getMediaTypeColor = (mediaType: string) => {
    switch (mediaType) {
      case "vinyl": return "bg-purple-100 text-purple-800 border-purple-200";
      case "cd": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getSourceIcon = (sourceTable: string) => {
    switch (sourceTable) {
      case "ai_scan_results": return <Scan className="w-4 h-4" />;
      case "cd_scan": return <Disc className="w-4 h-4" />;
      case "vinyl2_scan": return <Disc className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const getSourceLabel = (sourceTable: string) => {
    switch (sourceTable) {
      case "ai_scan_results": return "Smart Scan";
      case "cd_scan": return "Collection (CD)";
      case "vinyl2_scan": return "Collection (Vinyl)";
      default: return "Unknown";
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Date", "Source", "Media Type", "Artist", "Title", "Label", "Catalog Number", 
      "Condition", "Status", "Discogs ID", "Confidence Score"
    ];
    
    const csvContent = [
      headers.join(","),
      ...filteredScans.map(scan => [
        new Date(scan.created_at).toLocaleDateString(),
        getSourceLabel(scan.source_table),
        scan.media_type,
        scan.artist || "",
        scan.title || "",
        scan.label || "",
        scan.catalog_number || "",
        scan.condition_grade || "",
        scan.status,
        scan.discogs_id || "",
        scan.confidence_score || ""
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `unified-scans-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewDetails = (scan: UnifiedScanResult) => {
    // Convert UnifiedScanResult to AIScanResult format for the modal
    const aiScanResult = {
      ...scan,
      analysis_data: null,
      edit_history: [],
      manual_edits: {},
      master_id: null,
      search_queries: [],
      updated_by: null
    };
    setSelectedScan(aiScanResult as any);
    setShowDetailModal(true);
  };

  const handleImageClick = (photoUrls: string[], imageIndex: number = 0) => {
    setLightboxImages(photoUrls);
    setLightboxInitialIndex(imageIndex);
    setShowLightbox(true);
  };

  const copyDiscogsId = (scan: UnifiedScanResult) => {
    if (scan.discogs_id) {
      navigator.clipboard.writeText(scan.discogs_id.toString());
      addProcessedRow(scan.id);
      toast({
        title: "Copied!",
        description: "Discogs ID copied to clipboard",
      });
    }
  };

  const resetProcessedRows = () => {
    resetProcessed();
    toast({
      title: "Reset complete",
      description: "All processed row indicators have been cleared",
    });
  };

  const handleEditScan = (scan: UnifiedScanResult) => {
    if (scan.source_table === "ai_scan_results") {
      setScanToEdit(scan as any);
      setShowEditModal(true);
    } else {
      toast({
        title: "Not available",
        description: "Collection items cannot be edited from this view. Use the My Collection page instead.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteScan = (scan: UnifiedScanResult) => {
    setScanToDelete(scan as any);
    setShowDeleteDialog(true);
  };

  const handleCommentScan = (scan: UnifiedScanResult) => {
    if (scan.source_table === "ai_scan_results") {
      setScanToComment(scan as any);
      setShowCommentsModal(true);
    } else {
      toast({
        title: "Not available",
        description: "Collection items cannot have comments added from this view.",
        variant: "destructive"
      });
    }
  };

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["unified-scans"] });
    queryClient.invalidateQueries({ queryKey: ["unified-scans-stats"] });
  };

  const handleEditSuccess = () => {
    invalidateQueries();
    toast({
      title: "Success",
      description: "Scan updated successfully",
    });
  };

  const handleDeleteSuccess = () => {
    invalidateQueries();
    toast({
      title: "Success",
      description: "Scan deleted successfully",
    });
  };

  const handleCommentsSuccess = () => {
    invalidateQueries();
    toast({
      title: "Success",
      description: "Comments updated successfully",
    });
  };

  const toggleFlagIncorrect = async (scan: UnifiedScanResult) => {
    if (scan.source_table !== "ai_scan_results") {
      toast({
        title: "Not available",
        description: "Only AI scan results can be flagged as incorrect.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("ai_scan_results")
        .update({ is_flagged_incorrect: !scan.is_flagged_incorrect })
        .eq("id", scan.id);

      if (error) throw error;

      invalidateQueries();
      toast({
        title: "Success",
        description: scan.is_flagged_incorrect ? "Flag removed" : "Flagged as incorrect",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update flag status",
        variant: "destructive"
      });
    }
  };

  if (scansLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading unified scan overview...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto p-6">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Alle Gescande Items</h1>
              <p className="text-muted-foreground">
                Overzicht van alle {stats?.totalScans || 0} gescande items uit AI scans en collectie
              </p>
            </div>
            <Badge variant="outline" className="px-3 py-1">
              <Users className="w-4 h-4 mr-2" />
              Complete Overzicht
            </Badge>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Totaal Items"
              value={stats?.totalScans || 0}
              icon={Database}
            />
            <StatCard
              title="Smart Scans (V2)"
              value={stats?.v2Scans || 0}
              icon={Scan}
            />
            <StatCard
              title="Collectie Items"
              value={stats?.collectionItems || 0}
              icon={ShoppingCart}
            />
            <StatCard
              title="Succes Rate"
              value={`${(stats?.successRate || 0).toFixed(1)}%`}
              icon={TrendingUp}
            />
          </div>

          {/* Filter and Search Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Filters en Zoeken</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Zoek op artiest, titel of label..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                
                <Select value={mediaTypeFilter} onValueChange={setMediaTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Media type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle types</SelectItem>
                    <SelectItem value="cd">CD</SelectItem>
                    <SelectItem value="vinyl">Vinyl</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle statussen</SelectItem>
                    <SelectItem value="completed">Voltooid</SelectItem>
                    <SelectItem value="pending">In behandeling</SelectItem>
                    <SelectItem value="failed">Mislukt</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant={showDuplicatesOnly ? "default" : "outline"}
                  onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)}
                >
                  {showDuplicatesOnly ? "Alle items" : "Alleen duplicaten"}
                </Button>

                <Button variant="outline" onClick={exportToCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>

                <Button variant="outline" onClick={resetProcessedRows}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Scan Resultaten ({filteredScans.length} items)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Foto</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("created_at")}
                      >
                        <div className="flex items-center">
                          Datum {getSortIcon("created_at")}
                        </div>
                      </TableHead>
                      <TableHead>Bron</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("discogs_id")}
                      >
                        <div className="flex items-center">
                          Discogs ID {getSortIcon("discogs_id")}
                        </div>
                      </TableHead>
                      <TableHead>Conditie</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("artist")}
                      >
                        <div className="flex items-center">
                          Artiest / Titel {getSortIcon("artist")}
                        </div>
                      </TableHead>
                      <TableHead>Label / Cat#</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("media_type")}
                      >
                        <div className="flex items-center">
                          Type {getSortIcon("media_type")}
                        </div>
                      </TableHead>
                      <TableHead>Vertrouwen</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("status")}
                      >
                        <div className="flex items-center">
                          Status {getSortIcon("status")}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {filteredScans.map((scan) => {
                       const isDuplicate = duplicateInfo.getDuplicateInfo(scan.id).isDuplicate;
                       const isInMarketplace = marketplaceStatuses.get(scan.id) || false;
                      const processed = isProcessed(scan.id);
                      
                      return (
                        <TableRow 
                          key={`${scan.source_table}-${scan.id}`}
                          className={`
                            ${processed ? 'bg-green-50 border-green-200' : ''}
                            ${scan.is_flagged_incorrect ? 'bg-red-50 border-red-200' : ''}
                            ${isDuplicate ? 'bg-yellow-50 border-yellow-200' : ''}
                            ${isInMarketplace ? 'bg-blue-50 border-blue-200' : ''}
                          `}
                        >
                          <TableCell>
                            {scan.photo_urls.length > 0 ? (
                              <div className="flex gap-1">
                                {scan.photo_urls.slice(0, 2).map((photo, index) => (
                                  <img
                                    key={index}
                                    src={photo}
                                    alt={`Scan ${index + 1}`}
                                    className="w-8 h-8 object-cover rounded cursor-pointer hover:scale-110 transition-transform"
                                    onClick={() => handleImageClick(scan.photo_urls, index)}
                                  />
                                ))}
                                {scan.photo_urls.length > 2 && (
                                  <div className="w-8 h-8 bg-muted rounded flex items-center justify-center text-xs cursor-pointer hover:bg-muted/80"
                                       onClick={() => handleImageClick(scan.photo_urls, 2)}>
                                    +{scan.photo_urls.length - 2}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                                <X className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(scan.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(scan.created_at).toLocaleTimeString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getSourceIcon(scan.source_table)}
                              <span className="text-xs">{getSourceLabel(scan.source_table)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {scan.discogs_id ? (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyDiscogsId(scan)}
                                  className="h-6 px-2 hover:bg-muted"
                                >
                                  {processed ? (
                                    <Check className="w-3 h-3 text-green-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                  <span className="ml-1 text-xs">{scan.discogs_id}</span>
                                </Button>
                                {scan.discogs_url && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(scan.discogs_url!, '_blank')}
                                    className="h-6 px-1"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {scan.condition_grade ? (
                              <Badge variant="outline" className="text-xs">
                                {scan.condition_grade}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-sm truncate max-w-[200px]" title={scan.artist || undefined}>
                                {scan.artist || "Unknown Artist"}
                              </div>
                              <div className="text-sm text-muted-foreground truncate max-w-[200px]" title={scan.title || undefined}>
                                {scan.title || "Unknown Title"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm truncate max-w-[150px]" title={scan.label || undefined}>
                                {scan.label || "-"}
                              </div>
                              <div className="text-xs text-muted-foreground truncate max-w-[150px]" title={scan.catalog_number || undefined}>
                                {scan.catalog_number || "-"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getMediaTypeColor(scan.media_type)}>
                              {scan.media_type?.toUpperCase() || "Unknown"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {scan.confidence_score !== null ? (
                              <div className="flex items-center gap-1">
                                <div className="w-12 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${(scan.confidence_score || 0) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {Math.round((scan.confidence_score || 0) * 100)}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(scan.status)}>
                              {scan.status === "completed" && <CheckCircle className="w-3 h-3 mr-1" />}
                              {scan.status === "failed" && <XCircle className="w-3 h-3 mr-1" />}
                              {scan.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                              {scan.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(scan)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              
                              {scan.source_table === "ai_scan_results" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditScan(scan)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCommentScan(scan)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                  </Button>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleFlagIncorrect(scan)}
                                    className={`h-8 w-8 p-0 ${scan.is_flagged_incorrect ? 'text-red-600' : ''}`}
                                  >
                                    {scan.is_flagged_incorrect ? <FlagOff className="w-4 h-4" /> : <Flag className="w-4 h-4" />}
                                  </Button>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteScan(scan)}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Load More Button */}
              {hasNextPage && (
                <div className="flex justify-center mt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="min-w-[200px]"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Laden...
                      </>
                    ) : (
                      "Meer laden"
                    )}
                  </Button>
                </div>
              )}

              {/* Loading indicator for infinite scroll */}
              <div ref={loadingRef} className="h-10" />

              {!hasNextPage && filteredScans.length > 0 && (
                <div className="text-center mt-6 text-muted-foreground">
                  Alle resultaten geladen ({filteredScans.length} items)
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {selectedScan && (
        <AIScanDetailModal
          scan={selectedScan as any}
          open={showDetailModal}
          onOpenChange={setShowDetailModal}
        />
      )}

      {scanToEdit?.source_table === "ai_scan_results" && (
        <EditScanModal
          scan={scanToEdit as any}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {scanToDelete && (
        <DeleteScanDialog
          scan={scanToDelete as any}
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onSuccess={handleDeleteSuccess}
        />
      )}

      {scanToComment?.source_table === "ai_scan_results" && (
        <CommentsModal
          scan={scanToComment as any}
          isOpen={showCommentsModal}
          onClose={() => setShowCommentsModal(false)}
          onSuccess={handleCommentsSuccess}
        />
      )}

      <ImageLightboxModal
        images={lightboxImages}
        initialIndex={lightboxInitialIndex}
        isOpen={showLightbox}
        onClose={() => setShowLightbox(false)}
      />
    </div>
  );
};

export default UnifiedScanOverview;