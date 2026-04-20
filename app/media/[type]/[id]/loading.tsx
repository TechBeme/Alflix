import NavbarWrapper from '@/components/NavbarWrapper';

export default function Loading() {
    return (
        <div className="min-h-screen bg-black animate-pulse">
            <NavbarWrapper />

            {/* Hero Skeleton */}
            <div className="relative h-[70vh] md:h-[80vh] bg-gray-900">
                <div className="absolute bottom-0 left-0 right-0 z-10 px-4 md:px-8 pb-8 md:pb-12">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                            {/* Poster Skeleton */}
                            <div className="hidden md:block flex-shrink-0">
                                <div className="w-48 lg:w-56 aspect-[2/3] bg-gray-800 rounded-lg" />
                            </div>

                            {/* Info Skeleton */}
                            <div className="flex-1 flex flex-col justify-end space-y-4">
                                {/* Title */}
                                <div className="h-12 bg-gray-800 rounded w-3/4" />

                                {/* Tagline */}
                                <div className="h-6 bg-gray-800 rounded w-1/2" />

                                {/* Meta */}
                                <div className="flex gap-4">
                                    <div className="h-8 w-20 bg-gray-800 rounded" />
                                    <div className="h-8 w-20 bg-gray-800 rounded" />
                                    <div className="h-8 w-32 bg-gray-800 rounded" />
                                </div>

                                {/* Genres */}
                                <div className="flex gap-2">
                                    <div className="h-8 w-24 bg-gray-800 rounded-full" />
                                    <div className="h-8 w-24 bg-gray-800 rounded-full" />
                                    <div className="h-8 w-24 bg-gray-800 rounded-full" />
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-3">
                                    <div className="h-14 w-48 bg-gray-800 rounded" />
                                    <div className="h-14 w-40 bg-gray-800 rounded" />
                                    <div className="h-14 w-40 bg-gray-800 rounded" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 space-y-12">
                {/* Overview */}
                <div className="space-y-4">
                    <div className="h-8 w-32 bg-gray-800 rounded" />
                    <div className="space-y-2">
                        <div className="h-6 bg-gray-800 rounded w-full" />
                        <div className="h-6 bg-gray-800 rounded w-full" />
                        <div className="h-6 bg-gray-800 rounded w-3/4" />
                    </div>
                </div>

                {/* Episodes Section */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="h-8 w-40 bg-gray-800 rounded" />
                        <div className="h-12 w-64 bg-gray-800 rounded" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="space-y-3">
                                <div className="aspect-video bg-gray-800 rounded-lg" />
                                <div className="h-6 bg-gray-800 rounded w-3/4" />
                                <div className="h-4 bg-gray-800 rounded w-full" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cast Section */}
                <div className="space-y-6">
                    <div className="h-8 w-48 bg-gray-800 rounded" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="space-y-2">
                                <div className="aspect-[2/3] bg-gray-800 rounded-lg" />
                                <div className="h-4 bg-gray-800 rounded w-3/4" />
                                <div className="h-3 bg-gray-800 rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
