export interface Post {
  id: number;
  title: string;
  category: string;
  excerpt: string;
  author: string;
  authorInitials: string;
  coAuthor?: string;
  coAuthorInitials?: string;
  date: string;
  readTime: string;
  commentCount: string;
  tags: string[];
  thumbnailImage: string; // for homepage card (16:9 ratio)
  coverImage: string;     // for post details hero (high-res)
  authorBio: string;
}

export const POSTS: Post[] = [
  {
    id: 1,
    title: "The Quiet Revolution of Frieren's Animation Direction",
    category: 'Animation Analysis',
    excerpt: "When Frieren: Beyond Journey's End premiered, few expected it to become one of the most visually ambitious productions of the decade. Yet episode after episode, director Atsushi Ookubo and his team delivered masterclasses in visual pacing.",
    author: 'Haruki Tanaka',
    authorInitials: 'H',
    coAuthor: 'Mei Yoshida',
    coAuthorInitials: 'M',
    date: 'March 14, 2025',
    readTime: '12 min read',
    commentCount: '24 comments',
    tags: ['Ufotable', 'Sakuga', 'Seinen', '2024'],
    thumbnailImage: 'https://picsum.photos/seed/frieren/1280/720',
    coverImage: 'https://picsum.photos/seed/frieren/1920/1080',
    authorBio: 'Haruki has been writing about anime production for eight years. He specializes in animation direction and the technical craft behind contemporary sakuga culture. Previously at Sakuga Database and Anime News Network.'
  },
  {
    id: 2,
    title: 'How Ufotable Redefined the Visual Language of Action Anime',
    category: 'Historical Outline',
    excerpt: "The shift in compositing techniques at Ufotable during the mid-2010s established a new baseline for digital lighting in television anime. By breaking down their layer structures, we find a unique fusion of CGI and digital painted overlays.",
    author: 'Mei Yoshida',
    authorInitials: 'M',
    coAuthor: 'Sora K.',
    coAuthorInitials: 'S',
    date: 'March 02, 2025',
    readTime: '10 min read',
    commentCount: '18 comments',
    tags: ['Ufotable', 'Compositing', 'Action'],
    thumbnailImage: 'https://picsum.photos/seed/ufotable/1280/720',
    coverImage: 'https://picsum.photos/seed/ufotable/1920/1080',
    authorBio: 'Mei is a film history graduate who spends her time analyzing the intersection of traditional cel painting styles and modern high-end digital compositing pipelines.'
  },
  {
    id: 3,
    title: "WIT Studio's Architectural Approach to Storytelling in Vinland Saga",
    category: 'Narrative Analysis',
    excerpt: "Space in Vinland Saga is never just a background. The way structures are built, broken, and framed tells a parallel story of civilization and violence that requires no dialogue to be profoundly understood.",
    author: 'Sora K.',
    authorInitials: 'S',
    coAuthor: 'Haruki Tanaka',
    coAuthorInitials: 'H',
    date: 'February 18, 2025',
    readTime: '15 min read',
    commentCount: '42 comments',
    tags: ['WIT Studio', 'Background Art', 'Seinen'],
    thumbnailImage: 'https://picsum.photos/seed/vinland/1280/720',
    coverImage: 'https://picsum.photos/seed/vinland/1920/1080',
    authorBio: 'Sora is an architect and animator based in Kyoto. He focuses on structural layout, background details, and structural continuity as narrative instruments in seinen animation.'
  }
];
