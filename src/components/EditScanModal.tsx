import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useLanguage } from "@/contexts/LanguageContext";

type AIScanResult = Tables<"ai_scan_results">;

interface EditScanModalProps {
  scan: AIScanResult | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const conditionGrades = [
  "Mint (M)", "Near Mint (NM or M-)", "Very Good Plus (VG+)",
  "Very Good (VG)", "Good Plus (G+)", "Good (G)", "Fair (F)", "Poor (P)"
];
const mediaTypes = ["vinyl", "cd", "cassette", "dvd"];

export function EditScanModal({ scan, isOpen, onClose, onSuccess }: EditScanModalProps) {
  const { tr } = useLanguage();
  const sc = tr.scanCollectionUI;
  const [formData, setFormData] = useState({
    artist: scan?.artist || "", title: scan?.title || "", label: scan?.label || "",
    catalog_number: scan?.catalog_number || "", condition_grade: scan?.condition_grade || "",
    media_type: scan?.media_type || "", discogs_id: scan?.discogs_id?.toString() || "",
    discogs_url: scan?.discogs_url || "", year: scan?.year?.toString() || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scan) return;
    setIsLoading(true);
    try {
      const updateData: any = {
        artist: formData.artist || null, title: formData.title || null,
        label: formData.label || null, catalog_number: formData.catalog_number || null,
        condition_grade: formData.condition_grade, media_type: formData.media_type,
        discogs_url: formData.discogs_url || null,
        year: formData.year ? parseInt(formData.year) : null,
        manual_edits: {
          ...(scan.manual_edits as Record<string, any> || {}),
          edited_fields: Object.keys(formData).filter(key => formData[key as keyof typeof formData] !== scan[key as keyof AIScanResult]?.toString()),
          last_edited: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      };
      if (formData.discogs_id) {
        const discogsId = parseInt(formData.discogs_id);
        if (!isNaN(discogsId)) updateData.discogs_id = discogsId;
      } else { updateData.discogs_id = null; }

      const { error } = await supabase.from("ai_scan_results").update(updateData).eq("id", scan.id);
      if (error) throw error;
      toast({ title: sc.scanUpdated, description: sc.scanUpdatedDesc });
      onSuccess(); onClose();
    } catch (error) {
      console.error("Error updating scan:", error);
      toast({ title: sc.updateError, description: sc.updateErrorDesc, variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  const handleInputChange = (field: string, value: string) => { setFormData(prev => ({ ...prev, [field]: value })); };

  if (!scan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{sc.editScan}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="artist">{sc.artistLabel}</Label>
              <Input id="artist" value={formData.artist} onChange={(e) => handleInputChange("artist", e.target.value)} placeholder={sc.artistPlaceholder} />
            </div>
            <div>
              <Label htmlFor="title">{sc.titleLabel}</Label>
              <Input id="title" value={formData.title} onChange={(e) => handleInputChange("title", e.target.value)} placeholder={sc.titlePlaceholder} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="label">{sc.labelLabel}</Label>
              <Input id="label" value={formData.label} onChange={(e) => handleInputChange("label", e.target.value)} placeholder={sc.labelPlaceholder} />
            </div>
            <div>
              <Label htmlFor="catalog_number">{sc.catNumLabel}</Label>
              <Input id="catalog_number" value={formData.catalog_number} onChange={(e) => handleInputChange("catalog_number", e.target.value)} placeholder={sc.catNumPlaceholder} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="condition_grade">{sc.condition}</Label>
              <Select value={formData.condition_grade} onValueChange={(value) => handleInputChange("condition_grade", value)}>
                <SelectTrigger><SelectValue placeholder={sc.selectCondition} /></SelectTrigger>
                <SelectContent>{conditionGrades.map((grade) => (<SelectItem key={grade} value={grade}>{grade}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="media_type">{sc.mediaType}</Label>
              <Select value={formData.media_type} onValueChange={(value) => handleInputChange("media_type", value)}>
                <SelectTrigger><SelectValue placeholder={sc.selectMediaType} /></SelectTrigger>
                <SelectContent>{mediaTypes.map((type) => (<SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year">{sc.yearLabel}</Label>
              <Input id="year" type="number" value={formData.year} onChange={(e) => handleInputChange("year", e.target.value)} placeholder={sc.yearPlaceholder} min="1900" max={new Date().getFullYear() + 5} />
            </div>
            <div>
              <Label htmlFor="discogs_id">{sc.discogsIdLabel}</Label>
              <Input id="discogs_id" type="number" value={formData.discogs_id} onChange={(e) => handleInputChange("discogs_id", e.target.value)} placeholder={sc.discogsIdPlaceholder} />
            </div>
          </div>
          <div>
            <Label htmlFor="discogs_url">{sc.discogsUrlLabel}</Label>
            <Input id="discogs_url" type="url" value={formData.discogs_url} onChange={(e) => handleInputChange("discogs_url", e.target.value)} placeholder="https://www.discogs.com/release/..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>{sc.cancel}</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? sc.saving : sc.save}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
