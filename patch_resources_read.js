const fs = require('fs');

let content = fs.readFileSync('app/(public)/resources/ResourcesClient.tsx', 'utf8');

// Add TextReveal import
if (!content.includes('import { TextReveal }')) {
  content = content.replace(
    'import { updateResourcesPage } from "./actions"',
    'import { updateResourcesPage } from "./actions"\nimport { TextReveal } from "@/components/ui/TextReveal"'
  );
}

// Replace the return section
const returnSectionRegex = /return \([\s\S]*?className="relative group"[\s\S]*?\{isAdmin && \([\s\S]*?<main className="flex-1 w-full max-w-\[1200px\] mx-auto px-5 pt-8 md:pt-16 pb-20">([\s\S]*?)<\/main>[\s\S]*?<\/div>\s*\)\s*\}\s*$/;

const newReturnSection = `
  // Group by category
  const categories = Array.from(new Set(data.resources.map((r) => r.category || "Khác")));

  return (
    <div className="relative group">
      {isAdmin && (
        <Button
          onClick={() => setIsEditing(true)}
          className="absolute right-0 top-0 opacity-0 transition-opacity group-hover:opacity-100 z-10"
          size="sm"
          variant="outline"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Chỉnh sửa trang
        </Button>
      )}

      <div className="min-h-screen flex flex-col pt-0">
        <main className="flex-1 w-full max-w-[1200px] mx-auto px-5 pt-8 md:pt-16 pb-20">
          <h1 className="text-[40px] md:text-[56px] font-bold font-display tracking-tight text-text-primary leading-[1.1] mb-6">
            <TextReveal text={data.title.split(" ")[0] || "Nguồn"} /> <br />
            <TextReveal text={data.title.split(" ").slice(1).join(" ") || "tham khảo"} className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-500" />
          </h1>
          <p className="text-[18px] text-text-secondary leading-relaxed mb-16 max-w-[600px] whitespace-pre-wrap">
            {data.description}
          </p>

          <div className="space-y-16">
            {categories.map((category) => (
              <div key={category}>
                <h2 className="text-[24px] font-bold font-display text-text-primary mb-6 flex items-center gap-3">
                  <span className="w-8 h-[2px] bg-accent/40 rounded-full inline-block"></span>
                  {category}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data.resources
                    .filter((r) => (r.category || "Khác") === category)
                    .map((resource, index) => {
                      const isLink = resource.isLink !== false

                      const CardContent = () => (
                        <>
                          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                              <path d="M7 17l9.2-9.2M17 17V7H7" />
                            </svg>
                          </div>
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-background rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-border shadow-sm p-2">
                              {resource.logo === "X" ? (
                                <svg viewBox="0 0 24 24" aria-hidden="true" className="w-full h-full fill-current text-text-primary">
                                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.936H5.045z"></path>
                                </svg>
                              ) : resource.logo ? (
                                <img src={resource.logo} alt={\`\${resource.domain} logo\`} className="w-full h-full object-contain" />
                              ) : null}
                            </div>
                            <h3 className="text-[20px] font-bold font-display text-text-primary group-hover:text-accent transition-colors">
                              {resource.domain}
                            </h3>
                          </div>
                          <p className="text-[14px] leading-relaxed text-text-secondary">
                            {resource.description}
                          </p>
                        </>
                      )

                      const commonClasses = "group block p-6 rounded-[24px] bg-subtle-bg/30 backdrop-blur-md border-[2px] border-border-default hover:border-accent/40 hover:shadow-lg transition-all duration-300 relative overflow-hidden"

                      if (isLink) {
                        return (
                          <a
                            key={index}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={commonClasses}
                          >
                            <CardContent />
                          </a>
                        )
                      }

                      return (
                        <div key={index} className={commonClasses}>
                          <CardContent />
                        </div>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
`;

content = content.replace(/return \(\s*<div className="relative group">[\s\S]*?<\/main>\s*<\/div>\s*<\/div>\s*\)\s*\}\s*$/, newReturnSection);

fs.writeFileSync('app/(public)/resources/ResourcesClient.tsx', content);
