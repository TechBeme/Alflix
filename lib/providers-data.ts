// Gerado automaticamente por scripts/fetch-providers.ts
// Não edite manualmente - Execute: npm run fetch:providers

export interface StreamingProvider {
  id: number;
  name: string;
  logoPath: string | null;
  displayPriority: number;
}

export const streamingProviders: StreamingProvider[] = [
  {
    "id": 337,
    "name": "Disney Plus",
    "logoPath": "/providers/disney-plus.jpg",
    "displayPriority": 1
  },
  {
    "id": 119,
    "name": "Amazon Prime Video",
    "logoPath": "/providers/amazon-prime-video.jpg",
    "displayPriority": 2
  },
  {
    "id": 8,
    "name": "Netflix",
    "logoPath": "/providers/netflix.jpg",
    "displayPriority": 4
  },
  {
    "id": 531,
    "name": "Paramount Plus",
    "logoPath": "/providers/paramount-plus.jpg",
    "displayPriority": 6
  },
  {
    "id": 15,
    "name": "Hulu",
    "logoPath": "/providers/hulu.jpg",
    "displayPriority": 8
  },
  {
    "id": 350,
    "name": "Apple TV",
    "logoPath": "/providers/apple-tv.jpg",
    "displayPriority": 8
  },
  {
    "id": 386,
    "name": "Peacock Premium",
    "logoPath": "/providers/peacock-premium.jpg",
    "displayPriority": 15
  },
  {
    "id": 524,
    "name": "Discovery+",
    "logoPath": "/providers/discovery-plus.jpg",
    "displayPriority": 20
  },
  {
    "id": 283,
    "name": "Crunchyroll",
    "logoPath": "/providers/crunchyroll.jpg",
    "displayPriority": 25
  },
  {
    "id": 1899,
    "name": "HBO Max",
    "logoPath": "/providers/hbo-max.jpg",
    "displayPriority": 27
  }
];

export default streamingProviders;
