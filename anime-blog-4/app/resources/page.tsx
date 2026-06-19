import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { TextReveal } from '@/components/TextReveal';

type Resource = {
  name: string;
  url: string;
  description: string;
  category: string;
};

const resources: Resource[] = [
  {
    name: 'Sakugabooru',
    url: 'https://www.sakugabooru.com/',
    description: 'An image/video board focused on cataloging impressive animation (sakuga) in anime, tracking animators, sequences, and techniques.',
    category: 'Animation Databases',
  },
  {
    name: 'Sakuga Blog',
    url: 'https://blog.sakugabooru.com/',
    description: 'Detailed analysis, industry news, and long-form writing about anime production, specific animators, and the art of animation.',
    category: 'Editorial & Analysis',
  },
  {
    name: 'Anime News Network',
    url: 'https://www.animenewsnetwork.com/',
    description: 'The most comprehensive encyclopedia and news platform for everything related to anime, manga, and the Japanese pop culture industry.',
    category: 'News & Encyclopedia',
  },
  {
    name: 'MyAnimeList',
    url: 'https://myanimelist.net/',
    description: 'The premier community-driven database for tracking anime and manga, finding recommendations, and reading community reviews.',
    category: 'Community Datasets',
  },
  {
    name: 'AnimeFeminist',
    url: 'https://www.animefeminist.com/',
    description: 'An independent pop culture website providing a feminist viewpoint on Japanese media, delivering reviews, essays, and watch guides.',
    category: 'Editorial & Analysis',
  },
  {
    name: 'Crunchyroll News',
    url: 'https://www.crunchyroll.com/news',
    description: 'Official news source from Crunchyroll, providing immediate industry updates, interviews, and features from the streaming giant.',
    category: 'News & Encyclopedia',
  },
];

export default function ResourcesPage() {
  // Group by category
  const categories = Array.from(new Set(resources.map((r) => r.category)));

  return (
    <div className="min-h-screen flex flex-col pt-0">
      <Navbar />

      <main className="flex-1 w-full max-w-[900px] mx-auto px-5 py-12 md:py-20">
        <h1 className="text-[40px] md:text-[56px] font-bold font-display tracking-tight text-primary leading-[1.1] mb-6">
          <TextReveal text="Sakuga & Anime" /> <br />
          <TextReveal text="Resources" className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-500" />
        </h1>
        <p className="text-[18px] text-secondary leading-relaxed mb-16 max-w-[600px]">
          A curated collection of databases, blogs, and industry encyclopedias essential for researching animation techniques, following your favorite animators, and staying updated on anime production.
        </p>

        <div className="space-y-16">
          {categories.map((category) => (
            <div key={category}>
              <h2 className="text-[24px] font-bold font-display text-primary mb-6 flex items-center gap-3">
                <span className="w-8 h-[2px] bg-accent/40 rounded-full inline-block"></span>
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {resources
                  .filter((r) => r.category === category)
                  .map((resource, i) => (
                    <a
                      key={i}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block p-6 rounded-2xl bg-subtle/40 backdrop-blur-md border border-border/50 hover:border-accent/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] transition-all duration-300 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                          <path d="M7 17l9.2-9.2M17 17V7H7" />
                        </svg>
                      </div>
                      <h3 className="text-[20px] font-bold font-display text-primary group-hover:text-accent transition-colors mb-2">
                        {resource.name}
                      </h3>
                      <p className="text-[14px] leading-relaxed text-secondary">
                        {resource.description}
                      </p>
                    </a>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
