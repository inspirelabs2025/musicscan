import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent } from '@/components/ui/card';
import { Smartphone, Camera, Disc, Sparkles, Zap } from 'lucide-react';
const Scan = () => {
  const currentUrl = window.location.origin;
  return <div className="min-h-screen bg-gradient-to-br from-background via-accent/3 to-background relative overflow-hidden">
      {/* Musical Background Elements */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-20 left-10 text-4xl animate-bounce delay-100">🎵</div>
        <div className="absolute top-40 right-20 text-3xl animate-pulse delay-500">🎶</div>
        <div className="absolute bottom-20 right-10 text-3xl animate-pulse delay-700">🎸</div>
        <div className="absolute top-60 left-1/2 text-2xl animate-pulse delay-300">🥁</div>
        <div className="absolute bottom-40 left-20 text-3xl animate-bounce delay-200">🎤</div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="w-8 h-8 text-vinyl-purple animate-pulse" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-vinyl-purple to-vinyl-gold bg-clip-text text-transparent">
                MusicScan App
              </h1>
              <Sparkles className="w-8 h-8 text-vinyl-gold animate-pulse" />
            </div>
            <p className="text-xl text-muted-foreground">Scan je vinyl en CD collectie met foto herkenning</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* QR Code Section */}
            <Card className="p-8 text-center bg-gradient-to-br from-card to-accent/10 border-2 border-vinyl-purple/20 shadow-xl">
              <CardContent className="space-y-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Smartphone className="w-6 h-6 text-vinyl-purple" />
                  <h2 className="text-2xl font-semibold">Scan deze QR code</h2>
                </div>
                
                <div className="flex justify-center p-6 bg-white rounded-xl shadow-inner">
                  <QRCodeSVG value={currentUrl} size={200} level="M" includeMargin={true} fgColor="#1a1a1a" bgColor="#ffffff" />
                </div>
                
                <p className="text-muted-foreground">
                  Open de camera app op je telefoon en richt deze op de QR code
                </p>
                
                <div className="flex items-center justify-center gap-2 text-sm text-vinyl-purple font-medium">
                  <Zap className="w-4 h-4" />
                  Direct naar MusicScan.app
                </div>
              </CardContent>
            </Card>

            {/* App Info Section */}
            <div className="space-y-6">
              <Card className="p-6 bg-gradient-to-br from-vinyl-purple/5 to-vinyl-gold/5 border border-vinyl-purple/10">
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Camera className="w-8 h-8 text-vinyl-purple" />
                    <h3 className="text-xl font-semibold">AI-Powered Scanning</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Maak gewoon een foto van je vinyl of CD en onze AI herkent automatisch 
                    het album, de artiest en alle details. Geen barcode scanner nodig!
                  </p>
                </CardContent>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-vinyl-gold/5 to-vinyl-purple/5 border border-vinyl-gold/10">
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Disc className="w-8 h-8 text-vinyl-gold" />
                    <h3 className="text-xl font-semibold">Voor Vinyl & CD</h3>
                  </div>
                  <p className="text-muted-foreground">Scan zowel vinyl platen als CD's. Maak jouw collectie zichtbaar , ontdek de waarde.</p>
                </CardContent>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-accent/5 to-muted/5 border border-accent/10">
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-8 h-8 text-accent-foreground" />
                    <h3 className="text-xl font-semibold">Instant Waardering</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Krijg direct de huidige marktwaarde van je album gebaseerd op 
                    real-time Discogs data en de staat van je item.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-vinyl-purple/10 to-vinyl-gold/10 rounded-full border border-vinyl-purple/20">
              <Smartphone className="w-5 h-5 text-vinyl-purple" />
              <span className="text-sm font-medium">
                Werkt op alle mobiele apparaten - geen app download vereist!
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default Scan;