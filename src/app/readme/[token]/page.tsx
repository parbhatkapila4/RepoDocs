import React from 'react';
import { getPublicReadme } from '@/lib/actions';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Star,
  GitFork,
  Globe,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { notFound } from 'next/navigation';

interface PublicReadmePageProps {
  params: {
    token: string;
  };
}

interface ReadmeMetadata {
  title: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  license: string;
}

function parseReadmeMetadata(content: string): ReadmeMetadata {
  const lines = content.split('\n');
  let title = 'README';
  let description = '';
  let stars = 0;
  let forks = 0;
  let language = 'Unknown';
  let license = 'Unknown';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('# ')) {
      title = line.substring(2);
    } else if (line.includes('stars') && line.includes('img.shields.io')) {
      const match = line.match(/stars\/(\d+)/);
      if (match) stars = parseInt(match[1]);
    } else if (line.includes('forks') && line.includes('img.shields.io')) {
      const match = line.match(/forks\/(\d+)/);
      if (match) forks = parseInt(match[1]);
    } else if (line.includes('Language-TypeScript')) {
      language = 'TypeScript';
    } else if (line.includes('License-MIT')) {
      license = 'MIT';
    } else if (line.startsWith('## ') && line.toLowerCase().includes('description')) {
      if (i + 1 < lines.length) {
        description = lines[i + 1].trim();
      }
    }
  }

  return { title, description, stars, forks, language, license };
}

export default async function PublicReadmePage({ params }: PublicReadmePageProps) {
  try {
    const share = await getPublicReadme(params.token);
    const metadata = parseReadmeMetadata(share.readme.content);

    return (
      <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        

            <Card className="border border-white/20 shadow-xl">
              <CardContent className="p-0">
                <ScrollArea className="h-screen">
                  <div className="p-8">
                    <div className="max-w-4xl mx-auto">
                      <div className="prose prose-invert prose-lg max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          className="text-white"
                          components={{
                            h1: ({ children }) => (
                              <h1 className="text-3xl font-bold text-white mb-6 border-b border-white/20 pb-3">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-2xl font-semibold text-white mb-4 mt-8">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-xl font-semibold text-white mb-3 mt-6">
                                {children}
                              </h3>
                            ),
                            p: ({ children }) => {
                              const hasOnlyImages = React.Children.toArray(children).every(
                                child => React.isValidElement(child) && child.type === 'img'
                              );
                              
                              return (
                                <p className={`text-white/80 leading-relaxed ${hasOnlyImages ? 'mb-4' : 'mb-4'}`}>
                                  {children}
                                </p>
                              );
                            },
                            ul: ({ children }) => (
                              <ul className="text-white/80 mb-4 space-y-2">
                                {children}
                              </ul>
                            ),
                            li: ({ children }) => (
                              <li className="flex items-start gap-2">
                                <span className="text-white/40 mt-2">•</span>
                                <span>{children}</span>
                              </li>
                            ),
                            code: ({ children }) => (
                              <code className="bg-white/10 text-white/90 px-2 py-1 rounded text-sm font-mono">
                                {children}
                              </code>
                            ),
                            pre: ({ children }) => (
                              <pre className="bg-gray-900/50 border border-white/10 rounded-lg p-4 overflow-x-auto mb-4">
                                {children}
                              </pre>
                            ),
                            img: ({ src, alt, ...props }) => (
                              <img 
                                src={src} 
                                alt={alt} 
                                {...props}
                                className="inline-block mr-2 mb-2"
                                style={{ display: 'inline-block', marginRight: '8px', marginBottom: '8px' }}
                              />
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-white/20 pl-4 italic text-white/70 mb-4">
                                {children}
                              </blockquote>
                            ),
                          }}
                        >
                          {share.readme.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          
        
      </div>
    );
  } catch (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <Card className="border-red-500/50 bg-red-500/10">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Link Not Found</h3>
                <p className="text-white/50">
                  This README share link is invalid or has expired.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
}
