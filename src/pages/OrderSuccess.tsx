import React from 'react';
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useShopOrder } from '@/hooks/useShopOrders';
import { BreadcrumbNavigation } from '@/components/SEO/BreadcrumbNavigation';

export default function OrderSuccess() {
  const navigate = useNavigate();
  const { order_id } = useParams();
  const { data: order, isLoading } = useShopOrder(order_id || '');

  useEffect(() => {
    if (!order_id) {
      navigate('/');
    }
  }, [order_id, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-8">
              <h1 className="text-xl font-bold text-destructive mb-2">Bestelling niet gevonden</h1>
              <p className="text-muted-foreground mb-4">We konden je bestelling niet vinden.</p>
              <Button onClick={() => navigate('/')}>
                Terug naar home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => `€${price.toFixed(2)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <BreadcrumbNavigation />
        
        <div className="max-w-2xl mx-auto mt-8">
          <Card className="mb-8">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl text-green-600">
                Betaling Geslaagd!
              </CardTitle>
              <p className="text-muted-foreground">
                Bedankt voor je aankoop. Je bestelling is bevestigd.
              </p>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Bestelling Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Bestelnummer:</span>
                  <span className="font-mono text-sm">{order.id}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant="default">{order.status}</Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Besteldatum:</span>
                  <span className="text-sm">
                    {new Date(order.created_at).toLocaleDateString('nl-NL')}
                  </span>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3">Bestelde Items:</h3>
                  <div className="space-y-3">
                    {order.order_items?.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {item.item_data?.artist} - {item.item_data?.title}
                          </h4>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {item.item_type === 'cd_scan' ? 'CD' : 'VINYL'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {item.item_data?.condition_grade}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold">{formatPrice(item.price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Totaal:</span>
                  <span>{formatPrice(order.total_amount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Wat gebeurt er nu?</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Je ontvangt een bevestigingsmail</li>
                  <li>• De verkoper wordt op de hoogte gebracht</li>
                  <li>• Je kunt de bestelling volgen in je account</li>
                  <li>• De verkoper neemt contact met je op voor verzending</li>
                </ul>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button 
                onClick={() => navigate('/my-orders')} 
                className="flex-1"
              >
                <Package className="w-4 h-4 mr-2" />
                Mijn Bestellingen
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/shops')} 
                className="flex-1"
              >
                Verder Winkelen
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}