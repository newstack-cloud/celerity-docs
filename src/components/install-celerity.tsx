'use client'

import getPlatform, { PlatformData } from "@/lib/platform";
import { useState, useEffect } from "react";

const expectedPlatforms = ["mac", "linux", "windows"]

export default function InstallCelerity({ matchPlatform, fallback, children }: {
    matchPlatform?: string, fallback?: boolean, children: React.ReactNode
}) {
    const [platform, setPlatform] = useState<PlatformData | null>(null)
    useEffect(() => {
        const platformData = getPlatform(
            window.navigator.userAgent,
            // eslint-disable-next-line
            // @ts-ignore
            window.navigator.userAgentData,
        )
        setPlatform(platformData)
    }, [setPlatform])

    if (platform && (matchPlatform === platform.os || (fallback && !expectedPlatforms.includes(platform.os ?? "")))) {
        return (
            <div>
                {children}
            </div>
        )
    }

    return null;
}
