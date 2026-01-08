import { ImageResponse } from "next/og"

export const size = {
  width: 32,
  height: 32
}

export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "6px"
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 3v18h18" />
          <path d="M7 12h10" />
          <path d="M7 8h10" />
          <path d="M7 16h10" />
          <path d="M9 6v12" />
          <path d="M15 6v12" />
        </svg>
      </div>
    ),
    {
      ...size
    }
  )
}

