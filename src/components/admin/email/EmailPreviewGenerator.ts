interface TemplateConfig {
  branding: {
    companyName: string;
    fromEmail: string;
    replyToEmail: string;
  };
  styling: {
    headerGradientStart: string;
    headerGradientEnd: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    linkColor: string;
  };
  content: {
    showSections?: Record<string, boolean>;
    introText?: string;
    outroText?: string;
    headerText?: string;
    ctaButtonText: string;
    ctaButtonUrl: string;
  };
  footer: {
    footerText: string;
    socialLinks: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
    };
    unsubscribeText: string;
  };
}

export const generatePreviewHTML = (
  config: TemplateConfig,
  templateType: 'daily_digest' | 'weekly_discussion'
): string => {
  const { branding, styling, content, footer } = config;

  const headerStyle = `
    background: linear-gradient(135deg, ${styling.headerGradientStart}, ${styling.headerGradientEnd});
    padding: 40px 20px;
    text-align: center;
    border-radius: 8px 8px 0 0;
  `;

  const buttonStyle = `
    background-color: ${styling.accentColor};
    color: white;
    padding: 14px 32px;
    text-decoration: none;
    border-radius: 6px;
    display: inline-block;
    font-weight: 600;
    margin: 20px 0;
  `;

  const cardStyle = `
    background: white;
    border-radius: 8px;
    padding: 20px;
    margin: 16px 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  `;

  let sectionsHTML = '';

  if (templateType === 'daily_digest') {
    if (content.showSections?.releases) {
      sectionsHTML += `
        <div style="${cardStyle}">
          <h3 style="color: ${styling.accentColor}; margin-top: 0;">🎵 Nieuwe Releases</h3>
          <p style="color: ${styling.textColor};">Ontdek de nieuwste muziek releases van vandaag...</p>
        </div>
      `;
    }

    if (content.showSections?.blogs) {
      sectionsHTML += `
        <div style="${cardStyle}">
          <h3 style="color: ${styling.accentColor}; margin-top: 0;">📝 Laatste Blog Posts</h3>
          <p style="color: ${styling.textColor};">Lees de nieuwste verhalen en analyses...</p>
        </div>
      `;
    }

    if (content.showSections?.stats) {
      sectionsHTML += `
        <div style="${cardStyle}">
          <h3 style="color: ${styling.accentColor}; margin-top: 0;">📊 Community Stats</h3>
          <div style="display: flex; gap: 20px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 150px; text-align: center;">
              <div style="font-size: 32px; font-weight: bold; color: ${styling.accentColor};">42</div>
              <div style="color: ${styling.textColor};">Nieuwe Uploads</div>
            </div>
            <div style="flex: 1; min-width: 150px; text-align: center;">
              <div style="font-size: 32px; font-weight: bold; color: ${styling.accentColor};">18</div>
              <div style="color: ${styling.textColor};">Nieuwe Gebruikers</div>
            </div>
          </div>
        </div>
      `;
    }

    if (content.showSections?.news) {
      sectionsHTML += `
        <div style="${cardStyle}">
          <h3 style="color: ${styling.accentColor}; margin-top: 0;">📰 Nieuws</h3>
          <p style="color: ${styling.textColor};">De laatste updates uit de muziekwereld...</p>
        </div>
      `;
    }
  }

  if (templateType === 'weekly_discussion') {
    if (content.showSections?.albumCover) {
      sectionsHTML += `
        <div style="${cardStyle}; text-align: center;">
          <div style="width: 200px; height: 200px; background: ${styling.accentColor}; margin: 0 auto; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 48px;">
            🎵
          </div>
        </div>
      `;
    }

    if (content.showSections?.artistInfo) {
      sectionsHTML += `
        <div style="${cardStyle}">
          <h3 style="color: ${styling.accentColor}; margin-top: 0;">Artist Info</h3>
          <p style="color: ${styling.textColor};">Informatie over de artist en het album...</p>
        </div>
      `;
    }
  }

  const socialLinksHTML = Object.entries(footer.socialLinks)
    .filter(([_, url]) => url)
    .map(([platform, url]) => `
      <a href="${url}" style="color: ${styling.linkColor}; text-decoration: none; margin: 0 10px;">
        ${platform.charAt(0).toUpperCase() + platform.slice(1)}
      </a>
    `)
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: ${styling.backgroundColor}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: ${styling.backgroundColor};">
          <!-- Header -->
          <div style="${headerStyle}">
            <h1 style="color: white; margin: 0; font-size: 32px;">${branding.companyName}</h1>
            ${content.headerText ? `<p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${content.headerText}</p>` : ''}
          </div>

          <!-- Main Content -->
          <div style="padding: 20px;">
            ${content.introText ? `
              <p style="color: ${styling.textColor}; font-size: 16px; line-height: 1.6;">
                ${content.introText}
              </p>
            ` : ''}

            ${sectionsHTML}

            ${content.outroText ? `
              <p style="color: ${styling.textColor}; font-size: 16px; line-height: 1.6;">
                ${content.outroText}
              </p>
            ` : ''}

            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${content.ctaButtonUrl}" style="${buttonStyle}">
                ${content.ctaButtonText}
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: ${styling.textColor}; font-size: 14px; margin: 0 0 10px 0;">
              ${footer.footerText}
            </p>
            ${socialLinksHTML ? `
              <div style="margin: 20px 0;">
                ${socialLinksHTML}
              </div>
            ` : ''}
            <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
              <a href="#" style="color: ${styling.linkColor}; text-decoration: none;">
                ${footer.unsubscribeText}
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
};
