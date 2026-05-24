'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Shield, FileCheck } from 'lucide-react';

const GPG_KEY_URL = 'https://keys.bluelink.dev/release-signing.asc';

export default function VerificationInstructions() {
  const [checksumExpanded, setChecksumExpanded] = useState(false);
  const [gpgExpanded, setGpgExpanded] = useState(false);

  return (
    <div className="space-y-3 not-prose mt-6">
      {/* Checksum verification */}
      <div className="rounded-lg border border-fd-border bg-fd-card overflow-hidden">
        <button
          onClick={() => setChecksumExpanded(!checksumExpanded)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-fd-muted/30 transition-colors"
        >
          {checksumExpanded ? (
            <ChevronDown className="h-5 w-5 text-fd-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-fd-muted-foreground" />
          )}
          <FileCheck className="h-5 w-5 text-blue-500" />
          <span className="font-medium">Verifying Checksums</span>
        </button>

        {checksumExpanded && (
          <div className="border-t border-fd-border px-4 py-4 space-y-4">
            <p className="text-sm text-fd-muted-foreground">
              After downloading, verify the integrity of the file using the SHA256 checksum.
            </p>

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium mb-2">macOS</h4>
                <pre className="bg-fd-muted rounded-md p-3 text-sm overflow-x-auto">
                  <code>{`# Verify a specific file against checksums.txt
shasum -a 256 -c checksums.txt --ignore-missing`}</code>
                </pre>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Linux</h4>
                <pre className="bg-fd-muted rounded-md p-3 text-sm overflow-x-auto">
                  <code>{`# Verify a specific file against checksums.txt
sha256sum -c checksums.txt --ignore-missing`}</code>
                </pre>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Windows (PowerShell)</h4>
                <pre className="bg-fd-muted rounded-md p-3 text-sm overflow-x-auto">
                  <code>{`# Get expected hash from checksums.txt
$file = "celerity_1.0.0_windows_amd64.zip"
$expected = (Get-Content checksums.txt | Select-String $file).Line.Split(" ")[0]
$actual = (Get-FileHash $file -Algorithm SHA256).Hash.ToLower()

if ($expected -eq $actual) {
    Write-Host "Checksum valid" -ForegroundColor Green
} else {
    Write-Host "Checksum INVALID" -ForegroundColor Red
}`}</code>
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* GPG verification */}
      <div className="rounded-lg border border-fd-border bg-fd-card overflow-hidden">
        <button
          onClick={() => setGpgExpanded(!gpgExpanded)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-fd-muted/30 transition-colors"
        >
          {gpgExpanded ? (
            <ChevronDown className="h-5 w-5 text-fd-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-fd-muted-foreground" />
          )}
          <Shield className="h-5 w-5 text-green-500" />
          <span className="font-medium">Verifying GPG Signatures</span>
        </button>

        {gpgExpanded && (
          <div className="border-t border-fd-border px-4 py-4 space-y-4">
            <p className="text-sm text-fd-muted-foreground">
              For additional security, verify the GPG signature of the checksums file to ensure it was signed by NewStack Cloud.
            </p>

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium mb-2">1. Import the release signing public key</h4>
                <pre className="bg-fd-muted rounded-md p-3 text-sm overflow-x-auto">
                  <code>{`curl -fsSL ${GPG_KEY_URL} | gpg --import`}</code>
                </pre>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">2. Verify the signature</h4>
                <pre className="bg-fd-muted rounded-md p-3 text-sm overflow-x-auto">
                  <code>{`gpg --verify checksums.txt.sig checksums.txt`}</code>
                </pre>
              </div>

              <div className="bg-fd-muted/50 rounded-md p-3 text-sm">
                <p className="font-medium mb-1">Expected output:</p>
                <code className="text-fd-muted-foreground">
                  gpg: Good signature from &quot;Bluelink Release Signing &lt;release@newstack.cloud&gt;&quot;
                </code>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
