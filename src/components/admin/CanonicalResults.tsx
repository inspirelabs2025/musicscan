import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CanonicalCheckResult } from "./CanonicalChecker";
import { ExternalLink, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const FIX_HINTS = {
  MISSING: "Voeg <link rel='canonical' href='{SELF_URL}'> toe in de <head> van deze template.",
  HOMEPAGE_CANONICAL: "Canonical verwijst naar home. Zet canonical naar de eigen URL: {EXPECTED_URL}",
  DIFFERENT_DOMAIN: "Gebruik consequent https://www.musicscan.app of pas canonical + redirects aan.",
  DIFFERENT_PATH: "Canonical wijst naar een andere pagina. Check of dit intentioneel is. Anders: gebruik self-canonical.",
  MULTIPLE_CANONICALS: "Verwijder dubbele <link rel='canonical'> tags; slechts één canonical toegestaan.",
  OK_SELF: "✅ Canonical is correct geconfigureerd!"
};

const ADDITIONAL_HINTS = {
  noindex: "Verwijder <meta name='robots' content='noindex'> als indexatie gewenst is.",
  soft404: "Pagina returnt 200 maar lijkt op 404. Vul content aan of retourneer correcte 404 status.",
  thinContent: "Pagina heeft weinig content (< 150 woorden). Voeg meer relevante content toe.",
  redirect: "Pagina redirect. Check of canonical naar de finale URL wijst."
};

interface CanonicalResultsProps {
  results: CanonicalCheckResult[];
}

export function CanonicalResults({ results }: CanonicalResultsProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedResult, setSelectedResult] = useState<CanonicalCheckResult | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Filter results
  let filteredResults = results;

  if (search) {
    filteredResults = filteredResults.filter(r => 
      r.url.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (statusFilter !== "all") {
    if (statusFilter === "problems") {
      filteredResults = filteredResults.filter(r => 
        r.canonicalStatus !== 'OK_SELF' || r.noindex || r.soft404 || r.thinContent
      );
    } else {
      filteredResults = filteredResults.filter(r => r.canonicalStatus === statusFilter);
    }
  }

  // Pagination
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResults = filteredResults.slice(startIndex, startIndex + itemsPerPage);

  function getStatusBadge(status: string) {
    const variants: Record<string, any> = {
      OK_SELF: { variant: "default", className: "bg-green-500 hover:bg-green-600" },
      MISSING: { variant: "default", className: "bg-orange-500 hover:bg-orange-600" },
      HOMEPAGE_CANONICAL: { variant: "default", className: "bg-orange-500 hover:bg-orange-600" },
      DIFFERENT_PATH: { variant: "default", className: "bg-orange-500 hover:bg-orange-600" },
      DIFFERENT_DOMAIN: { variant: "destructive", className: "" },
      MULTIPLE_CANONICALS: { variant: "destructive", className: "" },
    };

    const config = variants[status] || { variant: "secondary", className: "" };
    return (
      <Badge {...config}>
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  }

  function getFixHint(result: CanonicalCheckResult): string {
    let hint = FIX_HINTS[result.canonicalStatus] || '';
    hint = hint.replace('{SELF_URL}', result.url);
    hint = hint.replace('{EXPECTED_URL}', result.url);

    const additional: string[] = [];
    if (result.noindex) additional.push(ADDITIONAL_HINTS.noindex);
    if (result.soft404) additional.push(ADDITIONAL_HINTS.soft404);
    if (result.thinContent) additional.push(ADDITIONAL_HINTS.thinContent);
    if (result.redirected) additional.push(ADDITIONAL_HINTS.redirect);

    if (additional.length > 0) {
      hint += '\n\nExtra aandachtspunten:\n' + additional.join('\n');
    }

    return hint;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Resultaten</CardTitle>
              <CardDescription>
                {filteredResults.length} van {results.length} URLs
              </CardDescription>
            </div>

            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Zoek URL..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="problems">🚨 Alleen problemen</SelectItem>
                  <SelectItem value="OK_SELF">✅ OK</SelectItem>
                  <SelectItem value="MISSING">⚠️ Missing</SelectItem>
                  <SelectItem value="HOMEPAGE_CANONICAL">🏠 Homepage</SelectItem>
                  <SelectItem value="DIFFERENT_PATH">🔀 Different Path</SelectItem>
                  <SelectItem value="DIFFERENT_DOMAIN">🌐 Different Domain</SelectItem>
                  <SelectItem value="MULTIPLE_CANONICALS">📋 Multiple</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>HTTP</TableHead>
                  <TableHead>Canonical Status</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead>Words</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedResults.map((result) => (
                  <TableRow key={result.url}>
                    <TableCell>
                      <Badge variant={result.status === 200 ? "default" : "destructive"}>
                        {result.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate font-mono text-xs">
                      <a 
                        href={result.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline"
                        title={result.url}
                      >
                        {result.url}
                      </a>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(result.canonicalStatus)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {result.canonical ? '✓' : '✗'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 text-sm">
                        {result.noindex && <span title="Noindex">🚫</span>}
                        {result.redirected && <span title="Redirect">↩️</span>}
                        {result.soft404 && <span title="Soft-404">⚠️</span>}
                        {result.thinContent && <span title="Thin content">📄</span>}
                      </div>
                    </TableCell>
                    <TableCell>{result.wordCount}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedResult(result)}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Vorige
              </Button>
              <span className="text-sm text-muted-foreground">
                Pagina {currentPage} van {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Volgende
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Canonical Details</DialogTitle>
            <DialogDescription>
              Uitgebreide informatie en fix hints
            </DialogDescription>
          </DialogHeader>

          {selectedResult && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">URL</h4>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted p-2 rounded break-all">
                    {selectedResult.url}
                  </code>
                  <Button variant="ghost" size="icon" asChild>
                    <a href={selectedResult.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Canonical Status</h4>
                {getStatusBadge(selectedResult.canonicalStatus)}
              </div>

              <div>
                <h4 className="font-medium mb-2">Expected Canonical</h4>
                <code className="block text-xs bg-muted p-2 rounded break-all">
                  {selectedResult.url}
                </code>
              </div>

              <div>
                <h4 className="font-medium mb-2">Found Canonical</h4>
                {selectedResult.canonical ? (
                  <code className="block text-xs bg-muted p-2 rounded break-all">
                    {selectedResult.canonical}
                  </code>
                ) : (
                  <p className="text-sm text-muted-foreground">Geen canonical gevonden</p>
                )}
              </div>

              {selectedResult.multipleCanonicals && selectedResult.multipleCanonicals.length > 1 && (
                <div>
                  <h4 className="font-medium mb-2 text-red-600">Multiple Canonicals Gevonden</h4>
                  <ul className="space-y-1">
                    {selectedResult.multipleCanonicals.map((canonical, i) => (
                      <li key={i}>
                        <code className="block text-xs bg-muted p-2 rounded break-all">
                          {canonical}
                        </code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">HTTP Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Status: <Badge>{selectedResult.status}</Badge></div>
                  <div>Content-Type: {selectedResult.contentType || 'N/A'}</div>
                  <div>Word Count: {selectedResult.wordCount}</div>
                  <div>X-Robots-Tag: {selectedResult.xRobotsTag || 'N/A'}</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Flags</h4>
                <div className="flex gap-2 flex-wrap">
                  {selectedResult.noindex && <Badge variant="secondary">🚫 Noindex</Badge>}
                  {selectedResult.redirected && <Badge variant="secondary">↩️ Redirected</Badge>}
                  {selectedResult.soft404 && <Badge variant="destructive">⚠️ Soft-404</Badge>}
                  {selectedResult.thinContent && <Badge variant="secondary">📄 Thin Content</Badge>}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Fix Hint</h4>
                <div className="bg-muted p-4 rounded whitespace-pre-line text-sm">
                  {getFixHint(selectedResult)}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Genereer Canonical Tag</h4>
                <code className="block text-xs bg-muted p-2 rounded break-all">
                  {`<link rel="canonical" href="${selectedResult.url}" />`}
                </code>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
