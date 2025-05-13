export interface NavItem {
  title: string;
  href: string;
  external?: boolean;
}

export interface SiteConfig {
  name: string;
  description: string;
  url: string;
  ogImage?: string;
  links: {
    github?: string;
    twitter?: string;
  };
}
