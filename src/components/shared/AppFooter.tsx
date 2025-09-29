/**
 * Application Footer Component
 * 
 * A customizable footer component with settings persistence in localStorage.
 * Supports various display options including social links, custom text,
 * and branding elements with RTL layout support.
 * 
 * Features:
 * - Configurable visibility and content through localStorage settings
 * - Custom text and colors for branding consistency
 * - Social media links with automatic icon selection
 * - Regular navigation links support
 * - Copyright text display
 * - Right-to-left (RTL) layout support for Arabic content
 * - Responsive design with proper spacing
 * 
 * Settings are stored in localStorage under 'footer_settings' key
 * and can be customized through admin panels or system settings.
 * 
 * @author Educational Platform Team
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react';

/**
 * Footer Settings Interface
 * 
 * Defines the structure for footer customization options.
 * All settings are persisted in localStorage and can be modified
 * through admin interfaces.
 */
interface FooterSettings {
  /** Whether to display the footer at all */
  show_footer: boolean;
  /** Main footer text/brand message */
  footer_text: string;
  /** Background color in hex format */
  footer_background_color: string;
  /** Text color in hex format */
  footer_text_color: string;
  /** Whether to show copyright information */
  show_copyright: boolean;
  /** Copyright text content */
  copyright_text: string;
  /** Whether to display navigation links */
  show_links: boolean;
  /** Array of regular navigation links */
  links: Array<{ title: string; url: string; }>;
  /** Array of social media platform links */
  social_links: Array<{ platform: string; url: string; icon: string; }>;
}

/**
 * AppFooter Component Implementation
 * 
 * Main footer component that renders based on localStorage settings.
 * Automatically loads and applies saved customizations.
 */
const AppFooter: React.FC = () => {
  // Footer settings state with default values
  const [footerSettings, setFooterSettings] = useState<FooterSettings>({
    show_footer: true,
    footer_text: 'جميع الحقوق محفوظة لنظام إدارة المدارس',
    footer_background_color: '#1f2937',
    footer_text_color: '#ffffff',
    show_copyright: true,
    copyright_text: '© 2024 نظام إدارة المدارس',
    show_links: false,
    links: [],
    social_links: []
  });

  // Load footer settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('footer_settings');
    if (savedSettings) {
      setFooterSettings(JSON.parse(savedSettings));
    }
  }, []);

  /**
   * Social Media Icon Helper Function
   * 
   * Returns appropriate emoji or icon for social media platforms.
   * Falls back to custom icon if provided, or default icon for unknown platforms.
   * 
   * @param social - Social media link object with platform and icon
   * @returns Emoji or icon string for the platform
   */
  const getSocialIcon = (social: { platform: string; icon: string; }) => {
    // Use custom saved icon if available
    if (social.icon) {
      return social.icon;
    }
    
    // Default platform icons
    switch (social.platform) {
      case 'Facebook': return '📘';
      case 'Twitter': return '🐦';
      case 'Instagram': return '📷';
      case 'LinkedIn': return '💼';
      case 'YouTube': return '🎥';
      case 'WhatsApp': return '💬';
      default: return '🔗';
    }
  };

  if (!footerSettings.show_footer) {
    return null;
  }

  return (
    <footer 
      className="py-6 mt-auto"
      style={{ 
        backgroundColor: footerSettings.footer_background_color,
        color: footerSettings.footer_text_color
      }}
      dir="rtl"
    >
      <div className="container mx-auto px-6 text-center">
        <div className="space-y-4 flex flex-col items-center justify-center">
          {/* النص الرئيسي للفوتر */}
          {footerSettings.footer_text && (
            <h3 className="text-lg font-bold">{footerSettings.footer_text}</h3>
          )}
          
          {/* الروابط العادية */}
          {footerSettings.show_links && footerSettings.links.length > 0 && (
            <div className="flex justify-center gap-4 flex-wrap">
              {footerSettings.links.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  className="text-sm underline cursor-pointer hover:opacity-80 transition-opacity"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.title || 'رابط'}
                </a>
              ))}
            </div>
          )}
          
          {/* روابط وسائل التواصل الاجتماعي */}
          {footerSettings.social_links.length > 0 && (
            <div className="flex justify-center gap-3">
              {footerSettings.social_links.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  className="text-sm bg-white/20 px-3 py-1 rounded hover:bg-white/30 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  title={social.platform}
                >
                  {social.platform}
                </a>
              ))}
            </div>
          )}
          
          {/* حقوق الطبع والنشر */}
          {footerSettings.show_copyright && footerSettings.copyright_text && (
            <p className="text-sm opacity-80">{footerSettings.copyright_text}</p>
          )}
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;