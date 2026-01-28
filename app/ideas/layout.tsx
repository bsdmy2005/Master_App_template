import { Toaster } from "sonner"

export const metadata = {
  title: "Ideas Portal | Black Glass",
  description: "Submit your feature requests and ideas for Black Glass solutions"
}

export default function IdeasLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="top-right" richColors />
    </>
  )
}
