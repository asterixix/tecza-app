import Image from "next/image"
import Link from "next/link"

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" aria-label="Tęcza.app – przejdź na stronę główną" className={className}>
      <div className="flex items-center gap-2">
        <Image src="/icons/tecza-icons-500x270/2.svg" alt="Logo Tęcza.app" width={100} height={28} />
      </div>
    </Link>
  )
}
