import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Text,
} from "@react-email/components"

interface PostCommentEmailProps {
  postTitle: string
  postUrl: string
  commenterName: string
  commentContent: string
  toName: string
}

export function PostCommentEmail({
  postTitle,
  postUrl,
  commenterName,
  commentContent,
  toName,
}: PostCommentEmailProps) {
  const previewContent =
    commentContent.length > 300 ? `${commentContent.slice(0, 300)}...` : commentContent

  return (
    <Html>
      <Head />
      <Preview>
        {commenterName} commented on your post &quot;{postTitle}&quot;
      </Preview>
      <Body
        style={{
          backgroundColor: "#f4f4f5",
          fontFamily: "Arial, sans-serif",
          margin: 0,
          padding: "40px 16px",
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            margin: "0 auto",
            maxWidth: "520px",
            padding: "40px",
          }}
        >
          <Text
            style={{
              color: "#111111",
              fontSize: "22px",
              fontWeight: 700,
              margin: "0 0 8px",
            }}
          >
            New comment on your post
          </Text>
          <Text style={{ color: "#52525b", lineHeight: "1.6" }}>
            Hi {toName}, <strong>{commenterName}</strong> left a new
            comment on your post <strong>{postTitle}</strong>.
          </Text>
          <Container
            style={{
              backgroundColor: "#f4f4f5",
              borderLeft: "3px solid #a1a1aa",
              borderRadius: "6px",
              margin: "20px 0",
              padding: "16px",
            }}
          >
            <Text
              style={{
                color: "#3f3f46",
                fontSize: "14px",
                lineHeight: "1.6",
                margin: 0,
              }}
            >
              {previewContent}
            </Text>
          </Container>
          <Button
            href={postUrl}
            style={{
              backgroundColor: "#18181b",
              borderRadius: "6px",
              color: "#ffffff",
              display: "inline-block",
              fontSize: "14px",
              fontWeight: 600,
              marginTop: "8px",
              padding: "12px 28px",
              textDecoration: "none",
            }}
          >
            View comment
          </Button>
          <Hr style={{ borderColor: "#e4e4e7", margin: "32px 0" }} />
          <Text style={{ color: "#71717a", fontSize: "12px" }}>
            You are receiving this because you are the author of the post.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
