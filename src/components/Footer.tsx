import React from 'react';
import { Link } from 'react-router-dom';
import { Music, Heart, Mail, Github, Twitter, Instagram } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-4 py-12">
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
              {t('footer.description')}
            </p>
          </div>

          {/* Platform Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">{t('footer.platform')}</h3>
            <div className="space-y-2">
              <Link to="/scan" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('footer.musicScanner')}
              </Link>
              <Link to="/ai-analysis" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('footer.musicAnalysis')}
              </Link>
              <Link to="/collection-chat" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('footer.collectionChat')}
              </Link>
              <Link to="/catalog" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('footer.publicCatalog')}
              </Link>
            </div>
          </div>

          {/* Content Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">{t('footer.content')}</h3>
            <div className="space-y-2">
              <Link to="/news" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('footer.musicNews')}
              </Link>
              <Link to="/shops" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('footer.shops')}
              </Link>
              <Link to="/social" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('footer.social')}
              </Link>
              <Link to="/quiz" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('footer.quiz')}
              </Link>
            </div>
          </div>

          {/* Support & Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">{t('footer.support')}</h3>
            <div className="space-y-2">
              <Link to="/about" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('footer.aboutMusicScan')}
              </Link>
              <Link to="/pricing" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('footer.pricing')}
              </Link>
              <a href="mailto:info@musicscan.nl" target="_blank" rel="noopener noreferrer" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('footer.contact')}
              </a>
              <Link to="/privacy" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('footer.privacy')}
              </Link>
              <Link to="/voorwaarden" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('footer.terms')}
              </Link>
              <Link to="/retourbeleid" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('footer.returnPolicy')}
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <span>{t('footer.copyright')}</span>
            <span>•</span>
            <span>{t('footer.madeWith')}</span>
            <Heart className="w-4 h-4 text-red-500 fill-current" />
            <span>{t('footer.forMusicLovers')}</span>
          </div>

          <div className="flex items-center space-x-4">
            <a href="https://twitter.com/musicscan" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Twitter">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="https://instagram.com/musicscan" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Instagram">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="https://github.com/musicscan" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="GitHub">
              <Github className="w-5 h-5" />
            </a>
            <a href="mailto:info@musicscan.nl" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Email">
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
