import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Store, ExternalLink, ArrowRight } from "lucide-react";
import { useUserShop } from "@/hooks/useUserShop";
import { useToast } from "@/hooks/use-toast";

interface ShopSetupWizardProps {
  onComplete?: () => void;
}

export function ShopSetupWizard({ onComplete }: ShopSetupWizardProps) {
  const { shop, updateShop, isUpdating } = useUserShop();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    shop_name: shop?.shop_name || "",
    shop_description: shop?.shop_description || "",
    contact_info: shop?.contact_info || "",
    is_public: shop?.is_public || false,
  });

  const isStep1Complete = formData.shop_name.trim().length >= 3;
  const isStep2Complete = formData.shop_description.trim().length >= 10;
  const isStep3Complete = formData.contact_info.trim().length >= 5;

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = () => {
    updateShop(formData, {
      onSuccess: () => {
        toast({
          title: "Winkel opgezet! 🎉",
          description: "Je winkel is succesvol geconfigureerd en kan nu bezocht worden.",
        });
        onComplete?.();
      },
      onError: () => {
        toast({
          title: "Fout bij opslaan",
          description: "Er is een probleem opgetreden. Probeer het opnieuw.",
          variant: "destructive",
        });
      },
    });
  };

  const generatePreviewSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <Store className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Winkel Setup Wizard</CardTitle>
          <div className="flex justify-center space-x-2 mt-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i <= step ? 'bg-primary' : 'bg-muted'
                } transition-colors`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Shop Name */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Stap 1: Winkel Naam</h3>
                <p className="text-muted-foreground mb-4">
                  Kies een naam voor je winkel. Deze wordt gebruikt in je winkel URL.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="shop_name">Winkel Naam *</Label>
                <Input
                  id="shop_name"
                  value={formData.shop_name}
                  onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                  placeholder="Bijv. Vinyl Vondsten, CD Corner, Muziek Magie"
                />
                {formData.shop_name && (
                  <div className="text-sm text-muted-foreground">
                    URL preview: <code>/shop/{generatePreviewSlug(formData.shop_name)}</code>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 text-sm">
                {isStep1Complete ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">Naam is geldig</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span className="text-amber-600">Naam moet minimaal 3 karakters lang zijn</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Description */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Stap 2: Beschrijving</h3>
                <p className="text-muted-foreground mb-4">
                  Vertel bezoekers wat ze kunnen verwachten van je winkel.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="shop_description">Winkel Beschrijving *</Label>
                <Textarea
                  id="shop_description"
                  value={formData.shop_description}
                  onChange={(e) => setFormData({ ...formData, shop_description: e.target.value })}
                  placeholder="Beschrijf je winkel, welke muziek je verkoopt, je specialiteiten..."
                  rows={4}
                />
                <div className="text-sm text-muted-foreground">
                  {formData.shop_description.length}/500 karakters
                </div>
              </div>

              <div className="flex items-center space-x-2 text-sm">
                {isStep2Complete ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">Beschrijving is voldoende</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span className="text-amber-600">Beschrijving moet minimaal 10 karakters lang zijn</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Contact Info */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Stap 3: Contact Informatie</h3>
                <p className="text-muted-foreground mb-4">
                  Hoe kunnen kopers contact met je opnemen?
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact_info">Contact Informatie *</Label>
                <Textarea
                  id="contact_info"
                  value={formData.contact_info}
                  onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                  placeholder="E-mail adres, telefoonnummer, of andere contactgegevens..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2 text-sm">
                {isStep3Complete ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">Contact informatie ingevuld</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span className="text-amber-600">Contact informatie is verplicht</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Final Settings */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Stap 4: Laatste Instellingen</h3>
                <p className="text-muted-foreground mb-4">
                  Maak je winkel publiek zichtbaar en controleer je instellingen.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Winkel publiek maken</h4>
                    <p className="text-sm text-muted-foreground">
                      Anderen kunnen je winkel vinden en bezoeken
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_public}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                  />
                </div>

                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Samenvatting:</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Naam:</strong> {formData.shop_name}
                      </div>
                      <div>
                        <strong>URL:</strong> /shop/{generatePreviewSlug(formData.shop_name)}
                      </div>
                      <div>
                        <strong>Status:</strong> 
                        <Badge variant={formData.is_public ? "default" : "secondary"} className="ml-2">
                          {formData.is_public ? "Publiek" : "Privé"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
            >
              Vorige
            </Button>

            {step < 4 ? (
              <Button
                onClick={handleNext}
                disabled={
                  (step === 1 && !isStep1Complete) ||
                  (step === 2 && !isStep2Complete) ||
                  (step === 3 && !isStep3Complete)
                }
              >
                Volgende
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={isUpdating || !isStep1Complete || !isStep2Complete || !isStep3Complete}
              >
                {isUpdating ? "Opslaan..." : "Winkel Voltooien"}
                <Store className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}