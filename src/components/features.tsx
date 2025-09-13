import { CloudIcon, RectangleGroupIcon, RocketLaunchIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'

const features = [
    {
        name: 'Move Fast',
        description: (
            <>
                Celerity is designed to help you move fast with its comprehensive
                set of tools to shorten feedback loops and get you swiftly deploying
                software you can trust will work.
            </>
        ),
        icon: RocketLaunchIcon,
    },
    {
        name: 'Run Anywhere with Ease',
        description: (
            <>
                Celerity lets you focus on the problems you are trying to solve,
                you can write your applications once and run them on any cloud provider
                as containerised or serverless applications.
                <br />
                <i>Current cloud provider support will be limited, see the <Link className="text-indigo-600 dark:text-indigo-400" href="/docs/framework/versions">versions</Link> page for more information.</i>
            </>
        ),
        icon: CloudIcon,
    },
    {
        name: 'Build with Useful Primitives',
        description: (
            <>
                Build with a set of useful primitives focusing on common types of applications
                such as a REST API, WebSocket API, Workflow or a Pub/Sub Consumer.
            </>
        ),
        icon: RectangleGroupIcon,
    },
]

export default function Features() {
    return (
        <div className="pt-24 pb-32 sm:pt-32 sm:pb-48">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl lg:text-center">
                    <h2 className="text-base/7 font-semibold text-indigo-600 dark:text-indigo-400" id="features">Build with freedom</h2>
                    <p className="mt-2 text-pretty text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl lg:text-balance dark:text-white">
                        Leave cloud lock-in behind
                    </p>
                    <p className="mt-6 text-lg/8 text-gray-600 dark:text-gray-300">
                        Swiftly build your backend applications using essential building blocks without being locked into a specific cloud provider.
                    </p>
                </div>
                <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                    <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                        {features.map((feature) => (
                            <div key={feature.name} className="flex flex-col">
                                <dt className="flex items-center gap-x-3 text-base/7 font-semibold text-gray-900 dark:text-white">
                                    <feature.icon aria-hidden="true" className="size-5 flex-none text-indigo-600 dark:text-indigo-400" />
                                    {feature.name}
                                </dt>
                                <dd className="mt-4 flex flex-auto flex-col text-base/7 text-gray-600 dark:text-gray-400">
                                    <p className="flex-auto">{feature.description}</p>
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
                <div className="mt-20 flex items-center justify-center gap-x-6">
                    <Link
                        href="/docs/framework/overview"
                        className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
                    >
                        Read the overview
                    </Link>
                </div>
            </div>
        </div>
    )
}
