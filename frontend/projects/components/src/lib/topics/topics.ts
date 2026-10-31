/** The fixed topic set; each has a hue and is always shown with its name. */
export const TOPICS = ['ai', 'dotnet', 'azure', 'angular', 'react', 'aws'] as const;
export type TopicKey = (typeof TOPICS)[number];

export const TOPIC_LABELS: Record<TopicKey, string> = {
  ai: 'AI',
  dotnet: '.NET',
  azure: 'Azure',
  angular: 'Angular',
  react: 'React',
  aws: 'AWS',
};

export const isTopic = (value: string): value is TopicKey => (TOPICS as readonly string[]).includes(value);
