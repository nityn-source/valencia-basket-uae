import Link from "next/link";
import Image from "next/image";

interface ProgramCardProps {
  title: string;
  age: string;
  description: string;
  image: string;
  imageAlt: string;
  href: string;
  buttonLabel?: string;
}

export function ProgramCard({ title, age, description, image, imageAlt, href, buttonLabel = "Learn More" }: ProgramCardProps) {
  return (
    <Link href={href} className="block">
      <div className="group relative h-[420px] overflow-hidden bg-black cursor-pointer">
        <Image
          src={image}
          alt={imageAlt}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        <div className="absolute bottom-0 left-0 p-8 w-full">
          {/* Age badge */}
          <span className="inline-block py-1 px-2 bg-primary text-white text-xs font-bold uppercase tracking-wider mb-3">
            {age}
          </span>

          {/* Title */}
          <h3 className="text-3xl font-black uppercase text-white mb-4 leading-none">
            {title}
          </h3>

          {/*
            Description wrapper:
            - Mobile: full height, mb-5, always visible (no md: overrides active)
            - Desktop default: max-h-0, mb-0, opacity-0, overflow-hidden → zero space, button sits directly under title
            - Desktop hover: max-h-40, mb-5, opacity-100 → expands to show text
          */}
          <div className="overflow-hidden mb-5
            md:max-h-0 md:mb-0 md:opacity-0
            md:group-hover:max-h-40 md:group-hover:mb-5 md:group-hover:opacity-100
            md:transition-all md:duration-500 md:delay-75">
            <p className="text-gray-300 text-sm max-w-[90%] leading-relaxed">
              {description}
            </p>
          </div>

          {/* Learn More — always visible, 44px min touch target */}
          <span className="inline-flex items-center gap-2 bg-primary text-white text-xs font-bold uppercase tracking-widest px-5 min-h-[44px] transition-colors duration-200 group-hover:bg-orange-600">
            {buttonLabel} <span aria-hidden="true">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
