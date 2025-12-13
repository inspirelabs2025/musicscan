import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic2, Twitter, Linkedin } from 'lucide-react';

interface Host {
  name: string;
  role: string;
  bio: string;
  imageUrl?: string;
  social?: {
    twitter?: string;
    linkedin?: string;
  };
}

const HOSTS: Host[] = [
  {
    name: 'Rogier Visser',
    role: 'Host & Muziekliefhebber',
    bio: 'Rogier is een gepassioneerde verzamelaar van vinyl en CD\'s met een voorliefde voor klassieke rock en progressive muziek. Hij duikt graag diep in de verhalen achter iconische albums.',
    imageUrl: undefined,
    social: {}
  },
  {
    name: 'Ingmar Loman',
    role: 'Co-host & Producer',
    bio: 'Ingmar brengt een frisse kijk op muziek met expertise in elektronische muziek en moderne producties. Hij zorgt voor de technische kant van de podcast en brengt interessante weetjes.',
    imageUrl: undefined,
    social: {}
  }
];

export function PodcastHosts() {
  return (
    <section className="py-12">
      <div className="text-center mb-8">
        <Badge variant="secondary" className="mb-3">
          <Mic2 className="h-3 w-3 mr-1" />
          Ontmoet de Hosts
        </Badge>
        <h2 className="text-3xl font-bold mb-2">De Stemmen Achter de Podcast</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Twee muziekliefhebbers die hun passie voor vinyl, verhalen en muziekgeschiedenis met je delen.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {HOSTS.map((host) => (
          <Card key={host.name} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Avatar placeholder */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-primary">
                    {host.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{host.name}</h3>
                  <p className="text-sm text-primary font-medium mb-2">{host.role}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {host.bio}
                  </p>
                  
                  {/* Social links */}
                  {(host.social?.twitter || host.social?.linkedin) && (
                    <div className="flex gap-2 mt-3">
                      {host.social.twitter && (
                        <a 
                          href={host.social.twitter} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Twitter className="h-4 w-4" />
                        </a>
                      )}
                      {host.social.linkedin && (
                        <a 
                          href={host.social.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Linkedin className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
