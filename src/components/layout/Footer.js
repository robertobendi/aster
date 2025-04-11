import websiteInfo from './../../utils/websiteInfo';

function Footer() {
  const { site } = websiteInfo;
  
  return (
    <footer className="bg-surface border-t border-border-primary font-sans relative" style={{ zIndex: 10 }}>
      <div className="max-w-container mx-auto px-container-default sm:px-container-sm">
        <div className="py-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-text-secondary text-sm">
            © {new Date().getFullYear()} {site.author}. All rights reserved.
          </div>
          <div className="mt-4 md:mt-0">
            <a
              href={site.links.github}
              className="text-text-accent text-sm transition-all duration-fast hover:text-text-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;