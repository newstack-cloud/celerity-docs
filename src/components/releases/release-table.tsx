import {
  type ComponentKey,
  type ComponentRelease,
  COMPONENT_DISPLAY_NAMES,
  formatBytes,
  formatDate,
  getComponentReleases,
} from '@/data/releases';
import { cn } from '@/lib/cn';
import { buttonVariants } from '@/components/ui/button';
import { Download, FileText, Shield, ExternalLink } from 'lucide-react';

interface ReleaseTableProps {
  component: ComponentKey;
  showVersions?: number;
}

const PLATFORM_ORDER = [
  'darwin_arm64',
  'darwin_amd64',
  'linux_amd64',
  'linux_arm64',
  'windows_amd64',
] as const;

export default function ReleaseTable({ component, showVersions = 3 }: ReleaseTableProps) {
  const releases = getComponentReleases(component).slice(0, showVersions);
  const displayName = COMPONENT_DISPLAY_NAMES[component];

  if (releases.length === 0) {
    return (
      <div className="rounded-lg border border-fd-border bg-fd-card p-6 text-center text-fd-muted-foreground">
        <p>No releases available for {displayName} yet. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 not-prose">
      {releases.map((release) => (
        <ReleaseVersion key={release.version} release={release} />
      ))}
    </div>
  );
}

function ReleaseVersion({ release }: { release: ComponentRelease }) {
  return (
    <div className="rounded-lg border border-fd-border bg-fd-card overflow-hidden">
      {/* Version header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-fd-border bg-fd-muted/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold">v{release.version}</span>
          <span className="text-sm text-fd-muted-foreground">{formatDate(release.publishedAt)}</span>
          <a
            href={release.releaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-fd-muted-foreground hover:text-fd-foreground transition-colors"
            title="View release on GitHub"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        <div className="flex items-center gap-3 text-sm pr-4">
          {release.checksumsUrl && (
            <a
              href={release.checksumsUrl}
              className="flex items-center gap-1.5 text-fd-muted-foreground hover:text-fd-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileText className="h-4 w-4" />
              checksums.txt
            </a>
          )}
          {release.checksumsSignatureUrl && (
            <a
              href={release.checksumsSignatureUrl}
              className="flex items-center gap-1.5 text-fd-muted-foreground hover:text-fd-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Shield className="h-4 w-4" />
              checksums.txt.sig
            </a>
          )}
        </div>
      </div>

      {/* Platform downloads table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-fd-border text-left text-sm text-fd-muted-foreground">
              <th className="px-4 py-2 font-medium">Platform</th>
              <th className="px-4 py-2 font-medium">Download</th>
              <th className="px-4 py-2 font-medium">Size</th>
              <th className="px-4 py-2 font-medium">SBOM</th>
            </tr>
          </thead>
          <tbody>
            {PLATFORM_ORDER.map((platform) => {
              const asset = release.assets[platform];
              if (!asset) return null;

              return (
                <tr
                  key={platform}
                  className="border-b border-fd-border last:border-b-0 hover:bg-fd-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{asset.displayName}</td>
                  <td className="px-4 py-3">
                    <a
                      href={asset.url}
                      className={cn(
                        buttonVariants({ size: 'sm' }),
                        'gap-1.5 text-xs'
                      )}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </a>
                  </td>
                  <td className="px-4 py-3 text-sm text-fd-muted-foreground">
                    {formatBytes(asset.size)}
                  </td>
                  <td className="px-4 py-3">
                    {asset.sbomUrl ? (
                      <a
                        href={asset.sbomUrl}
                        className="text-sm text-fd-muted-foreground hover:text-fd-foreground transition-colors underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        SBOM
                      </a>
                    ) : (
                      <span className="text-sm text-fd-muted-foreground">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
