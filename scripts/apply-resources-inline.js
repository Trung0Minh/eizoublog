const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/(public)/resources/ResourcesClient.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add ArrowUp, ArrowDown to imports
content = content.replace('GripVertical, Pencil, Plus, Save, Trash2, X', 'ArrowUp, ArrowDown, Pencil, Plus, Save, Trash2, X');

// 2. Remove the old if (isEditing) block completely
const isEditingBlockStart = content.indexOf('  if (isEditing) {');
const isEditingBlockEnd = content.indexOf('  // Group by category');
content = content.substring(0, isEditingBlockStart) + content.substring(isEditingBlockEnd);

// 3. Update the main render to include the floating bar and inline inputs
const mainRenderStart = content.indexOf('  return (');
const newMainRender = `  return (
    <div className="relative group min-h-screen flex flex-col pt-0 pb-20">
      {isAdmin && !isEditing && (
        <Button
          onClick={() => setIsEditing(true)}
          className="absolute right-0 top-0 z-10 shadow-sm opacity-0 transition-opacity group-hover:opacity-100"
          size="sm"
          variant="outline"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Chỉnh sửa trang
        </Button>
      )}

      {isEditing && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center justify-between bg-background/95 backdrop-blur-md py-3 px-6 rounded-full border-[2px] border-border-default shadow-2xl gap-8 animate-in slide-in-from-bottom-8">
          <h2 className="text-sm font-bold uppercase tracking-widest text-editorial whitespace-nowrap">
            Đang chỉnh sửa Nguồn tham khảo
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-border-default font-bold"
              onClick={() => {
                setData(initialData)
                setIsEditing(false)
              }}
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-2" />
              Hủy
            </Button>
            <Button size="sm" className="rounded-full bg-accent text-white hover:bg-accent/90 font-bold" onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </div>
      )}

      <main className={cn("flex-1 w-full max-w-[1200px] mx-auto px-5 pt-8 md:pt-16 pb-20", isEditing && "mt-[60px]")}>
        <div className="text-center mb-8">
          <ScrollReveal>
            {isEditing ? (
              <input
                className="w-full text-center border-none bg-transparent text-[40px] md:text-[56px] font-bold font-display tracking-tight text-text-primary leading-[1.1] outline-none focus:ring-2 focus:ring-accent rounded-[8px] placeholder:text-text-tertiary"
                value={data.title}
                onChange={(e) => setData({ ...data, title: e.target.value })}
                placeholder="Tiêu đề trang..."
              />
            ) : (
              <h1 className="text-[40px] md:text-[56px] font-bold font-display tracking-tight text-text-primary leading-[1.1] mb-6">
                <TextReveal text={data.title.split(" ")[0] || "Nguồn"} /> <br />
                <TextReveal text={data.title.split(" ").slice(1).join(" ") || "tham khảo"} className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-500" />
              </h1>
            )}
          </ScrollReveal>
          
          <ScrollReveal delay={0.2}>
            {isEditing ? (
              <Textarea
                className="text-[18px] text-text-secondary leading-relaxed max-w-[600px] mx-auto text-center border-t border-b border-border/50 py-4 mt-4 resize-none bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-accent rounded-none"
                value={data.description}
                onChange={(e) => setData({ ...data, description: e.target.value })}
                placeholder="Mô tả..."
                rows={4}
              />
            ) : (
              <p className="text-[18px] text-text-secondary leading-relaxed mb-16 max-w-[600px] mx-auto whitespace-pre-wrap">
                {data.description}
              </p>
            )}
          </ScrollReveal>
        </div>

        <div className="space-y-16">
          {categories.map((category) => (
            <div key={category}>
              <ScrollReveal delay={0.1}>
                <h2 className="text-[24px] font-bold font-display text-text-primary mb-6 flex items-center gap-3">
                  <span className="w-8 h-[2px] bg-accent rounded-full inline-block"></span>
                  {category}
                </h2>
              </ScrollReveal>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.resources
                  .map((resource, index) => ({ resource, index }))
                  .filter(({ resource }) => (resource.category || "Khác") === category)
                  .map(({ resource, index }) => {
                    const isLink = resource.isLink !== false

                    const CardContent = () => (
                      <>
                        {!isEditing && (
                          <div className="absolute top-0 right-0 p-4 opacity-0 transition-opacity translate-x-2 duration-300 group-hover/resource:translate-x-0 group-hover/resource:opacity-100">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                              <path d="M7 17l9.2-9.2M17 17V7H7" />
                            </svg>
                          </div>
                        )}
                        
                        {isEditing && (
                          <div className="absolute top-2 right-2 flex gap-1 z-10">
                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background" onClick={(e) => {
                              e.preventDefault();
                              if (index > 0) {
                                const newR = [...data.resources];
                                [newR[index - 1], newR[index]] = [newR[index], newR[index - 1]];
                                setData({...data, resources: newR});
                              }
                            }}>
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background" onClick={(e) => {
                              e.preventDefault();
                              if (index < data.resources.length - 1) {
                                const newR = [...data.resources];
                                [newR[index + 1], newR[index]] = [newR[index], newR[index + 1]];
                                setData({...data, resources: newR});
                              }
                            }}>
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 bg-background/80 hover:bg-red-500 hover:text-white" onClick={(e) => {
                              e.preventDefault();
                              const newR = [...data.resources];
                              newR.splice(index, 1);
                              setData({...data, resources: newR});
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}

                        <div className="flex items-center gap-4 mb-4">
                          <div className={cn(
                            "w-12 h-12 bg-background rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-border shadow-sm",
                            isAvatarLogo(resource.logo || "") ? "p-0" : "p-2"
                          )}>
                            {resource.logo === "X" ? (
                              <svg viewBox="0 0 24 24" aria-hidden="true" className="w-full h-full fill-current text-text-primary">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.936H5.045z"></path>
                              </svg>
                            ) : resource.logo ? (
                              <img
                                src={resource.logo}
                                alt={\`\${resource.domain} logo\`}
                                className={cn(
                                  "w-full h-full",
                                  isAvatarLogo(resource.logo) ? "object-cover" : "object-contain"
                                )}
                              />
                            ) : null}
                          </div>
                          
                          {isEditing ? (
                            <div className="flex flex-col gap-2 flex-1">
                              <Input 
                                value={resource.domain} 
                                onChange={(e) => { const newR = [...data.resources]; newR[index].domain = e.target.value; setData({...data, resources: newR}); }} 
                                placeholder="Tên web (VD: Sakugabooru)" 
                                className="h-8 text-[16px] font-bold"
                              />
                              <Input 
                                value={resource.url} 
                                onChange={(e) => { const newR = [...data.resources]; newR[index].url = e.target.value; setData({...data, resources: newR}); }} 
                                placeholder="URL (https://...)" 
                                className="h-8 text-[12px]"
                              />
                            </div>
                          ) : (
                            <h3 className="text-[20px] font-bold font-display text-text-primary transition-colors group-hover/resource:text-accent">
                              {resource.domain}
                            </h3>
                          )}
                        </div>
                        
                        {isEditing ? (
                          <div className="space-y-3 mt-4 border-t border-border/50 pt-4">
                            <Input 
                              value={resource.logo} 
                              onChange={(e) => { const newR = [...data.resources]; newR[index].logo = e.target.value; setData({...data, resources: newR}); }} 
                              placeholder="Logo URL (/logos/... hoặc X)" 
                              className="h-8 text-[13px]"
                            />
                            <Input 
                              value={resource.category || ""} 
                              onChange={(e) => { const newR = [...data.resources]; newR[index].category = e.target.value; setData({...data, resources: newR}); }} 
                              placeholder="Phân loại (Category)" 
                              className="h-8 text-[13px]"
                            />
                            <Textarea 
                              value={resource.description} 
                              onChange={(e) => { const newR = [...data.resources]; newR[index].description = e.target.value; setData({...data, resources: newR}); }} 
                              placeholder="Mô tả..." 
                              className="text-[14px] leading-relaxed text-text-secondary resize-none"
                              rows={4}
                            />
                          </div>
                        ) : (
                          <p className="text-[14px] leading-relaxed text-text-secondary">
                            {resource.description}
                          </p>
                        )}
                      </>
                    )

                    const commonClasses = cn(
                      "glass-card group/resource block p-6 overflow-hidden relative",
                      isEditing && "border-accent/40 shadow-md"
                    )

                    if (isLink && !isEditing) {
                      return (
                        <ScrollReveal key={index} delay={index * 0.1}>
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={commonClasses}
                          >
                            <CardContent />
                          </a>
                        </ScrollReveal>
                      )
                    }

                    return (
                      <ScrollReveal key={index} delay={index * 0.1}>
                        <div className={commonClasses}>
                          <CardContent />
                        </div>
                      </ScrollReveal>
                    )
                  })}
              </div>
            </div>
          ))}
          
          {isEditing && (
            <div className="flex justify-center mt-12 pt-8 border-t border-border-default">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full font-bold border-[2px] text-text-secondary hover:text-text-primary hover:border-accent"
                onClick={() => {
                  setData({
                    ...data,
                    resources: [...data.resources, { domain: "Nguồn mới", url: "", logo: "", description: "", category: "Khác" }]
                  })
                }}
              >
                <Plus className="h-5 w-5 mr-2" /> Thêm nguồn tham khảo mới
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
`;

content = content.substring(0, mainRenderStart) + newMainRender;

fs.writeFileSync(filePath, content, 'utf8');
console.log('Applied inline editing to ResourcesClient.tsx successfully.');
