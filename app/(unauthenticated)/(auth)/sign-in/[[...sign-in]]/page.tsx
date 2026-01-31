import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted">
      <SignIn
        appearance={{
          elements: {
            formButtonPrimary:
              "bg-primary text-primary-foreground hover:bg-primary/90",
            footerActionLink: "text-primary hover:text-primary/90"
          }
        }}
      />
    </div>
  )
}
