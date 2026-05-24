import { getWindowsInstaller, formatBytes, formatDate } from '@/data/releases';
import { cn } from '@/lib/cn';
import { buttonVariants } from '@/components/ui/button';
import { Download, FileText, ExternalLink } from 'lucide-react';

export default function WindowsInstallerDownload() {
  const installer = getWindowsInstaller();

  if (!installer) {
    return (
      <div className="rounded-lg border border-fd-border bg-fd-card p-6 text-center text-fd-muted-foreground not-prose">
        <p>Windows installer not available yet. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-fd-border bg-fd-card overflow-hidden not-prose">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-fd-border bg-fd-muted/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold">Celerity Windows Installer</span>
          <a
            href={installer.releaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-fd-muted-foreground hover:text-fd-foreground transition-colors"
            title="View release on GitHub"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        {installer.checksumUrl && (
          <a
            href={installer.checksumUrl}
            className="flex items-center gap-1.5 text-sm text-fd-muted-foreground hover:text-fd-foreground transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FileText className="h-4 w-4" />
            SHA256 checksum
          </a>
        )}
      </div>

      <div className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <a
            href={installer.url}
            className={cn(buttonVariants({ color: 'primary', size: 'sm' }), 'gap-2 px-4 py-2.5 text-sm')}
          >
            <Download className="h-5 w-5" />
            Download Installer ({formatBytes(installer.size)})
          </a>
          <span className="text-sm text-fd-muted-foreground">{installer.filename}</span>
        </div>
        <p className="mt-3 text-sm text-fd-muted-foreground">
          This installer will set up the Bluelink Manager with the Celerity profile, configure startup services, and prepare all necessary directories.
        </p>
        <p className="mt-2 text-sm text-fd-muted-foreground">
          Released on {formatDate(installer.publishedAt)}
        </p>
      </div>
    </div>
  );
}
