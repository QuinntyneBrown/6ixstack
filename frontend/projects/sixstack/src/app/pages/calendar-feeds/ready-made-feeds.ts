/** One ready-made feed as the page lists it; keys match the API's catalogue (L2-034). */
export interface ReadyMadeFeed {
  key: string;
  name: string;
  description: string;
  slug: string;
}

export const READY_MADE_FEEDS: ReadyMadeFeed[] = [
  {
    key: 'everything',
    name: 'Everything',
    description: 'All GTA and streaming events',
    slug: 'all-gta-stream',
  },
  { key: 'gta', name: 'In the GTA', description: 'In-person and hybrid events only', slug: 'all-gta' },
  {
    key: 'streaming',
    name: 'Streaming',
    description: 'Online talks you can watch from anywhere',
    slug: 'all-stream',
  },
  { key: 'ai', name: 'AI', description: 'Every AI event, local or streamed', slug: 'ai-gta-stream' },
  { key: 'dotnet', name: '.NET', description: '.NET and C# events', slug: 'dotnet-gta-stream' },
  { key: 'azure', name: 'Azure', description: 'Azure and Fabric events', slug: 'azure-gta-stream' },
];
