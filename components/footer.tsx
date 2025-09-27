import Logo from '@/components/logo';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 sm:mt-20 lg:mt-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 lg:py-12 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 sm:gap-8">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-3 sm:mb-4">
              <Logo className="size-6 text-sky-600" />
              <span className="text-2xl font-serif text-sky-600 italic font-medium">ogpreview.co</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500">© {currentYear} OG Preview. All rights reserved.</p>
          </div>

          <div className="flex flex-col sm:items-end text-xs sm:text-sm text-gray-500 space-y-1">
            <p>
              Made by{' '}
              <a
                href="https://www.linkedin.com/in/danilo-vilhena/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-gray-900 transition-colors underline"
              >
                Danilo Vilhena
              </a>
            </p>
            <p>Website may contain affiliate links.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
