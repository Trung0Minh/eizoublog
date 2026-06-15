const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

if (!content.includes('enum CoAuthorStatus')) {
  content = content.replace(
    'enum PostStatus {',
    'enum CoAuthorStatus {\n  PENDING\n  ACCEPTED\n}\n\nenum PostStatus {'
  );
  content = content.replace(
    'model PostAuthor {\n  postId String\n  userId String\n  order  Int    @default(0)',
    'model PostAuthor {\n  postId String\n  userId String\n  order  Int    @default(0)\n  status CoAuthorStatus @default(PENDING)'
  );
  fs.writeFileSync('prisma/schema.prisma', content);
  console.log('Updated schema.prisma');
}
