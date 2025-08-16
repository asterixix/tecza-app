"use client"

export async function uploadInChunks(
  file: Blob,
  putUrlFactory: (chunkIndex: number, totalChunks: number) => Promise<string>,
  chunkSize = 5 * 1024 * 1024,
) {
  const totalChunks = Math.ceil(file.size / chunkSize)
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize
    const end = Math.min(start + chunkSize, file.size)
    const chunk = file.slice(start, end)
    const url = await putUrlFactory(i, totalChunks)
    const res = await fetch(url, { method: "PUT", body: chunk })
    if (!res.ok) throw new Error(`Chunk ${i + 1}/${totalChunks} failed`)
  }
}
