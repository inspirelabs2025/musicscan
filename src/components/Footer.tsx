import React from 'react';
import { Link } from 'react-router-dom';
import { Music, Heart, Mail, Github, Twitter, Instagram } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-vinyl flex items-center justify-center">
                <Music className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-vinyl bg-clip-text text-transparent">
                MusicScan
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Het leukste muziekplatform voor het ontdekken, analyseren en waarderen van je muziekcollectie.
            </p>
          </div>

          {/* Platform Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Platform</h3>
            <div className="space-y-2">
              <Link to="/scan" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Music Scanner
              </Link>
              <Link to="/ai-analysis" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                AI Analyse
              </Link>
              <Link to="/collection-chat" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Collectie Chat
              </Link>
              <Link to="/catalog" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Publieke Catalogus
              </Link>
            </div>
          </div>

          {/* Content Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Content</h3>
            <div className="space-y-2">
              <Link to="/news" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Muzieknieuws
              </Link>
              <Link to="/shops" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Winkels
              </Link>
              <Link to="/social" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Sociaal
              </Link>
              <Link to="/quiz" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Quiz
              </Link>
            </div>
          </div>

          {/* Support & Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Support</h3>
            <div className="space-y-2">
              <Link to="/pricing" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Prijzen
              </Link>
              <a
                href="mailto:info@musicscan.nl"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Contact
              </a>
              <a href="/privacy" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Privacy
              </a>
              <a href="/terms" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Voorwaarden
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Copyright */}
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <span>© 2024 MusicScan</span>
            <span>•</span>
            <span>Gemaakt met</span>
            <Heart className="w-4 h-4 text-red-500 fill-current" />
            <span>voor muziekliefhebbers</span>
          </div>

          {/* Social Links */}
          <div className="flex items-center space-x-4">
            <a
              href="https://twitter.com/musicscan"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="https://instagram.com/musicscan"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://github.com/musicscan"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="mailto:info@musicscan.nl"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Email"
            >
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};