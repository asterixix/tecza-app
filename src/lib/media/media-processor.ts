"use client"

function isValidBlobUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === "blob:"
  } catch {
    return false
  }
}

export class MediaProcessor {
  // Convert image to WebP with size optimization
  static async processImage(
    file: File,
    maxWidth = 1920,
    maxHeight = 1080,
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      const objectUrl = URL.createObjectURL(file)
      const cleanup = () => {
        try {
          URL.revokeObjectURL(objectUrl)
        } catch {}
      }

      img.onload = () => {
        try {
          // Calculate new dimensions
          let width = img.width
          let height = img.height

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width *= ratio
            height *= ratio
          }

          canvas.width = width
          canvas.height = height

          // Draw and convert to WebP
          ctx?.drawImage(img, 0, 0, width, height)
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob)
              else reject(new Error("Failed to process image"))
            },
            "image/webp",
            0.85,
          )
        } finally {
          cleanup()
        }
      }

      img.onerror = () => {
        cleanup()
        reject(new Error("Failed to load image"))
      }

      // Validate and assign URL
      if (!isValidBlobUrl(objectUrl)) {
        cleanup()
        reject(new Error("Invalid image URL"))
        return
      }
      img.src = objectUrl
    })
  }

  // Convert video to WebM (requires browser MediaRecorder support)
  static async processVideo(file: File, maxSizeMB = 10): Promise<Blob> {
    // For now, just check size - full video transcoding would require a backend service
    if (file.size > maxSizeMB * 1024 * 1024) {
      throw new Error(`Video size exceeds ${maxSizeMB}MB limit`)
    }

    // Check if browser supports WebM
    if (file.type.includes("webm")) {
      return file
    }

    // For other formats, we'd need server-side processing with ffmpeg
    console.warn("Video conversion to WebM requires server-side processing")
    return file
  }

  // Validate and limit file size
  static validateFile(file: File, maxSizeMB = 10): void {
    if (file.size > maxSizeMB * 1024 * 1024) {
      throw new Error(`File size exceeds ${maxSizeMB}MB limit`)
    }

    // Check for allowed file types
    const allowedTypes = [
      "image/",
      "video/",
      "audio/",
      "application/pdf",
      "application/zip",
      "text/",
      "application/msword",
      "application/vnd.openxmlformats-officedocument",
    ]

    if (!allowedTypes.some((type) => file.type.startsWith(type))) {
      throw new Error("File type not allowed")
    }
  }

  // Generate thumbnail for media
  static async generateThumbnail(file: File): Promise<string | null> {
    if (file.type.startsWith("image/")) {
      return URL.createObjectURL(file)
    }

    if (file.type.startsWith("video/")) {
      return new Promise((resolve) => {
        const video = document.createElement("video")
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        const cleanup = (url?: string) => {
          if (url) URL.revokeObjectURL(url)
        }

        video.onloadedmetadata = () => {
          // Draw a frame at 1s (or 0 if shorter)
          try {
            video.currentTime = Math.min(1, Math.max(0, video.duration ? 1 : 0))
          } catch {
            // Fallback: try 0s
            video.currentTime = 0
          }
        }

        video.onseeked = () => {
          try {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            ctx?.drawImage(video, 0, 0)
            canvas.toBlob((blob) => {
              resolve(blob ? URL.createObjectURL(blob) : null)
            }, "image/jpeg")
          } finally {
            cleanup(currentUrl)
          }
        }

        video.onerror = () => {
          cleanup(currentUrl)
          resolve(null)
        }

        // Create and validate a blob URL, then assign and ensure cleanup
        const objectUrl = URL.createObjectURL(file)
        let currentUrl: string | undefined = objectUrl
        try {
          const u = new URL(objectUrl)
          if (u.protocol !== "blob:")
            throw new Error("Invalid object URL scheme")
          if (!isValidBlobUrl(objectUrl))
            throw new Error("Invalid object URL scheme")
          video.src = objectUrl
        } catch {
          cleanup(currentUrl)
          currentUrl = undefined
          resolve(null)
        }
      })
    }

    return null
  }
}
