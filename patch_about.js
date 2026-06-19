const fs = require('fs');

let content = fs.readFileSync('app/(public)/about/AboutClient.tsx', 'utf8');

// Update initialData
content = content.replace(
  'title: `${appName} là một nơi yên tĩnh dành cho những bài viết nghiêm túc về hoạt hình Nhật Bản.`,',
  'title: `Chào mừng bạn đến với Eizou Blog!`, // Updated title\n    whyWeDoThis: "Để lan tỏa tình yêu với hoạt hình và ghi nhận công sức của những nhà sáng tạo tuyệt vời đã thổi hồn vào những thế giới yêu thích của chúng ta. Chúng mình muốn tạo ra một nơi mà fan có thể đọc những bài tiểu luận sâu sắc cùng một tách trà trong một không gian ấm cúng, dễ thương! 💖",'
);

// Update Edit UI to include whyWeDoThis
const editUiInjection = `
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Lý do chúng mình tạo blog này (Why we do this)</label>
            <Textarea
              value={data.whyWeDoThis}
              onChange={(e) => setData({ ...data, whyWeDoThis: e.target.value })}
              className="text-base resize-none rounded-[16px] bg-background border-[2px]"
              rows={4}
            />
          </div>
`;

content = content.replace(
  '          <div>\n            <label className="block text-sm font-semibold text-text-primary mb-2">Nội dung giới thiệu</label>',
  editUiInjection + '\n          <div>\n            <label className="block text-sm font-semibold text-text-primary mb-2">Nội dung giới thiệu</label>'
);

// Update Read UI
const whyWeDoThisRender = `
                {data.whyWeDoThis && (
                  <div className="bg-background/60 p-4 rounded-xl border border-border mt-6">
                    <h3 className="font-display font-bold text-text-primary flex items-center gap-2 text-[18px] mb-2">
                      <Heart className="w-5 h-5 text-accent" /> Tại sao chúng mình làm blog này
                    </h3>
                    <p className="text-[14px]">
                      {data.whyWeDoThis}
                    </p>
                  </div>
                )}
`;

content = content.replace(
  '<PostBody content={data.body} />\n                \n\n\n                <div className="mt-6 flex flex-col gap-3 sm:flex-row pt-4 border-t border-border/50">',
  '<PostBody content={data.body} />\n                ' + whyWeDoThisRender + '\n                <div className="mt-6 flex flex-col gap-3 sm:flex-row pt-4 border-t border-border/50">'
);

// Also change the rendering of the title in view mode from <span className="text-accent">{data.title}</span>
// to match "Welcome to <span className="text-accent">Anime Blog!</span>" logic, but since it's user provided:
// Actually, in the screenshot, "Eizou Blog" is pink. If title is "Chào mừng bạn đến với Eizou Blog!", we can split.
// Let's just change the title rendering:
content = content.replace(
  '<h1 className="text-[32px] md:text-[42px] font-display font-bold text-primary leading-tight">\n                  <span className="text-accent">{data.title}</span>\n                </h1>',
  `<h1 className="text-[32px] md:text-[42px] font-display font-bold text-text-primary leading-tight">
                  {data.title.includes('Eizou Blog!') ? (
                    <>Chào mừng bạn đến với <span className="text-accent">Eizou Blog!</span></>
                  ) : (
                    <span className="text-accent">{data.title}</span>
                  )}
                </h1>`
);

fs.writeFileSync('app/(public)/about/AboutClient.tsx', content);
