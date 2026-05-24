const navigatorErrorMessage = 'Could not find `userAgent` or `userAgentData` window.navigator properties to set `os`, `browser` and `version`'
const removeExcessMozillaAndVersion = /^mozilla\/\d\.\d\W/
const browserPattern = /(\w+)\/(\d+\.\d+(?:\.\d+)?(?:\.\d+)?)/g
const engineAndVersionPattern = /^(ver|cri|gec)/
const brandList = ['chrome', 'opera', 'safari', 'edge', 'firefox']
const unknown = 'Unknown'
const empty = ''
const { isArray } = Array

export type NavigatorUAData = {
    readonly brands: { brand: string; version: string; }[];
    readonly mobile: boolean;
    readonly platform: string;
}

// User agent data is a feature in chrome and few other browsers
// that will eventually replace navigator.userAgent
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
let userAgentData = typeof window !== 'undefined' ? window.navigator.userAgentData as NavigatorUAData : null
let userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : null

const mobiles = {
    iphone: /iphone/,
    ipad: /ipad|macintosh/,
    android: /android/
} as const

const desktops = {
    windows: /win/,
    mac: /macintosh/,
    linux: /linux/
}

export type PlatformData = {
    os?: string;
    browser: string | null;
    version: string | null;
}

function getPlatform(customUserAgent: string, customUserAgentData: NavigatorUAData): PlatformData {
    // Use a provided UA string instead of the browser's UA
    userAgent = typeof customUserAgent === 'string' ? customUserAgent : userAgent

    // Use a provided UA data string instead of the browser's UA data
    userAgentData = typeof customUserAgentData === 'string' ? customUserAgentData : userAgentData

    if (userAgent) {
        const ua = userAgent.toLowerCase().replace(removeExcessMozillaAndVersion, empty)

        // Determine the operating system.
        const mobileKeys = Object.keys(mobiles) as (keyof typeof mobiles)[];
        const desktopKeys = Object.keys(desktops) as (keyof typeof desktops)[];
        const mobileOS = mobileKeys.find(os => mobiles[os].test(ua) && window.navigator.maxTouchPoints >= 1)
        const desktopOS = desktopKeys.find(os => desktops[os].test(ua))
        const os = mobileOS || desktopOS

        // Extract browser and version information.
        const browserTest = ua.match(browserPattern)
        const versionRegex = /version\/(\d+(\.\d+)*)/
        const safariVersion = ua.match(versionRegex)
        const saVersion = isArray(safariVersion) ? safariVersion[1] : null
        const browserOffset = browserTest && (browserTest.length > 2 && !(engineAndVersionPattern.test(browserTest[1])) ? 1 : 0)
        const browserResult = browserTest && browserTest[browserTest.length - 1 - (browserOffset || 0)].split('/')
        let browser = browserResult && browserResult[0]
        let version = saVersion ? saVersion : browserResult && browserResult[1]

        // Check specifically for Edge
        if (ua.includes('edg/')) {
            const edgeMatch = ua.match(/edg\/(\d+\.\d+)/);
            browser = 'edge';
            version = edgeMatch && edgeMatch[1];
        }

        return { os, browser, version }
    } else if (userAgentData) {
        const os = userAgentData.platform.toLowerCase()
        let platformData

        // Extract platform brand and version information.
        for (const agentBrand of userAgentData.brands) {
            const agentBrandEntry = agentBrand.brand.toLowerCase()
            const foundBrand = brandList.find(brand => {
                if (agentBrandEntry.includes(brand)) {
                    return brand
                }
            })
            if (foundBrand) {
                platformData = { browser: foundBrand, version: agentBrand.version }
                break
            }
        }
        const brandVersionData = platformData || { browser: unknown, version: unknown }
        return { os, ...brandVersionData }
    } else {
        // Log error message if there's a problem.
        console
            .error(navigatorErrorMessage)

        return {
            // Ignore strikethrough for deprecation, this is just a fallback.
            os: navigator.platform || unknown,
            browser: unknown,
            version: unknown
        }
    }
}

export default getPlatform
