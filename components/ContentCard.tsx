import { ReactNode } from 'react';

interface ContentSection {
    title: string;
    content: string | ReactNode;
    subsections?: Array<{
        title: string;
        content: string | ReactNode;
    }>;
}

interface ContentCardProps {
    sections: ContentSection[];
    className?: string;
}

/**
 * ContentCard - Display structured text content
 * Used in: privacy, terms, cookies pages
 */
export default function ContentCard({ sections, className = '' }: ContentCardProps) {
    return (
        <div className={`prose prose-invert prose-lg max-w-none ${className}`}>
            <div className="space-y-8">
                {sections.map((section, index) => (
                    <div key={index}>
                        <h2 className="text-3xl font-bold text-white mb-4">
                            {section.title}
                        </h2>
                        {typeof section.content === 'string' ? (
                            <p className="text-gray-300 leading-relaxed mb-4">
                                {section.content}
                            </p>
                        ) : (
                            <div className="text-gray-300 leading-relaxed mb-4">
                                {section.content}
                            </div>
                        )}

                        {section.subsections && section.subsections.length > 0 && (
                            <div className="space-y-6 mt-6">
                                {section.subsections.map((subsection, subIndex) => (
                                    <div key={subIndex}>
                                        <h3 className="text-2xl font-semibold text-white mb-3">
                                            {subsection.title}
                                        </h3>
                                        {typeof subsection.content === 'string' ? (
                                            <p className="text-gray-300 leading-relaxed">
                                                {subsection.content}
                                            </p>
                                        ) : (
                                            <div className="text-gray-300 leading-relaxed">
                                                {subsection.content}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
