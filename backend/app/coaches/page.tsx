import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { buildPageMetadata, getAltResolver } from "@/lib/seo/resolve";
import { getStructuredData } from "@/lib/seo/structuredDataResolve";
import { StructuredData } from "@/components/seo/StructuredData";
import { getContentGetter } from "@/lib/content/pageContent";
import { authorPath, type StaffMember, type StaffSection } from "@/lib/content/staff";
import { getVisibleStaff, staffPhotoAlt, staffSocialLinks } from "@/lib/content/staffStore";
import { SocialIcons } from "@/components/SocialIcons";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("/coaches");
}

type TeamMember = StaffMember & { socials: ReturnType<typeof staffSocialLinks>; href?: string };

/** Grey placeholder with initials for someone added without a photo. */
function PhotoPlaceholder({ name }: { name: string }) {
  const initials = name.replace(/^coach\s+/i, "").split(/\s+/).map((word) => word[0]).slice(0, 2).join("").toUpperCase();
  return <div className="absolute inset-0 flex items-center justify-center bg-gray-300 text-4xl font-black text-white">{initials}</div>;
}

function DirectorCard({
  person,
  imageAlt,
  eyebrow,
  linkLabel,
}: {
  eyebrow: string;
  linkLabel: string;
  person: TeamMember;
  imageAlt: string;
}) {
  return (
    <div className="group flex flex-col md:flex-row gap-0 overflow-hidden bg-gray-50 border border-gray-100">
      {/* Photo */}
      <div className="relative w-full md:w-64 lg:w-72 shrink-0 aspect-[3/4] md:aspect-auto md:h-80 bg-gray-200">
        {person.image ? (
          <Image
            src={person.image}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 288px"
            className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
            priority
          />
        ) : (
          <PhotoPlaceholder name={person.name} />
        )}
      </div>
      {/* Content */}
      <div className="flex flex-col justify-center px-8 py-8 md:py-10">
        <span className="text-primary font-bold uppercase tracking-widest text-xs mb-3 block">{eyebrow}</span>
        <h3 className="text-3xl md:text-4xl font-black uppercase leading-none mb-2">{person.name}</h3>
        <p className="text-primary font-bold uppercase text-xs tracking-widest mb-5">{person.role}</p>
        <SocialIcons links={person.socials} personName={person.name} className="mb-5" />
        <p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-xl">{person.bio}</p>
        {person.href && (
          <Link href={person.href} className="mt-5 self-start text-sm font-bold uppercase tracking-wider text-primary hover:underline">
            {linkLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

function CoachCard({
  person,
  isAlumni,
  imageAlt,
}: {
  person: TeamMember;
  isAlumni: boolean;
  imageAlt: string;
}) {
  return (
    <div className="group cursor-pointer">
      <div className="overflow-hidden mb-4 relative bg-gray-100 aspect-[3/4]">
        {person.image ? (
          <Image
            src={person.image}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className={
              isAlumni
                ? "object-cover transition-all duration-500 group-hover:scale-105 filter grayscale group-hover:grayscale-0"
                : "object-cover transition-transform duration-500 group-hover:scale-105"
            }
          />
        ) : (
          <PhotoPlaceholder name={person.name} />
        )}
        {/* Desktop hover overlay — hidden on mobile */}
        <div className="hidden md:flex absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-end p-6">
          <p className="text-white text-sm leading-relaxed">{person.bio}</p>
        </div>
      </div>
      <h3 className="text-xl md:text-2xl font-black uppercase leading-none mb-1">{person.name}</h3>
      <p className="text-primary font-bold uppercase text-xs tracking-widest mb-2">{person.role}</p>
      <SocialIcons links={person.socials} personName={person.name} size="sm" className="mb-3" />
      {/* Bio always visible on mobile */}
      <p className="md:hidden text-sm text-gray-600 leading-relaxed">{person.bio}</p>
    </div>
  );
}

export default async function Coaches() {
  const alt = await getAltResolver();
  const schema = await getStructuredData("/coaches", "Coaches");
  const c = await getContentGetter();
  const staff = (await getVisibleStaff()).map((member): TeamMember => ({
    ...member,
    socials: staffSocialLinks(member),
    href: member.isAuthor ? authorPath(member.slug) : undefined,
  }));
  const inSection = (section: StaffSection) => staff.filter((member) => member.section === section);
  const [leadership, managementTeam, coachingTeam, alumniTeam] = [
    inSection("Leadership"),
    inSection("Management & Operations"),
    inSection("Coaching Staff"),
    inSection("Alumni Coaches"),
  ];
  const photoAlt = (member: TeamMember) => staffPhotoAlt(member, alt);
  return (
    <>
      <StructuredData data={schema} />
      <div className="bg-black text-white py-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <span className="text-primary font-bold uppercase tracking-widest text-sm mb-4 block">{c("staff.hero.eyebrow")}</span>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6">{c("staff.hero.title")}</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            {c("staff.hero.subtext")}
          </p>
        </div>
      </div>

      {/* Director */}
      {leadership.length > 0 && (
        <div className="container mx-auto px-4 md:px-6 pt-20 pb-12">
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-8">{c("staff.section.leadership")}</h2>
          <div className="space-y-6">
            {leadership.map((person) => (
              <DirectorCard key={person.slug} person={person} imageAlt={photoAlt(person)} eyebrow={c("staff.section.leadership-card")} linkLabel={c("staff.section.leadership-link")} />
            ))}
          </div>
        </div>
      )}

      {/* Management & Operations */}
      {managementTeam.length > 0 && (
        <div className="container mx-auto px-4 md:px-6 pb-16">
          <div className="border-t border-gray-200 pt-16">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-10">{c("staff.section.management")}</h2>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {managementTeam.map((person) => (
                <CoachCard
                  key={person.slug}
                  person={person}
                  isAlumni={false}
                  imageAlt={photoAlt(person)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Coaching Staff */}
      {coachingTeam.length > 0 && (
        <div className="container mx-auto px-4 md:px-6 pb-16">
          <div className="border-t border-gray-200 pt-16">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-10">{c("staff.section.coaching")}</h2>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {coachingTeam.map((person) => (
                <CoachCard
                  key={person.slug}
                  person={person}
                  isAlumni={false}
                  imageAlt={photoAlt(person)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Alumni Coaches */}
      {alumniTeam.length > 0 && (
        <div className="container mx-auto px-4 md:px-6 pb-20">
          <div className="border-t border-gray-200 pt-16">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-2">{c("staff.section.alumni")}</h2>
            <p className="text-gray-500 text-sm mb-10">{c("staff.section.alumni-text")}</p>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {alumniTeam.map((person) => (
                <CoachCard
                  key={person.slug}
                  person={person}
                  isAlumni
                  imageAlt={photoAlt(person)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-primary py-20 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-black uppercase mb-6 text-white">{c("staff.join.title")}</h2>
          <p className="text-white/80 max-w-xl mx-auto mb-8">
            {c("staff.join.text")}
          </p>
          <Link href="mailto:info@valenciabasket.ae">
            <Button variant="outline" className="uppercase font-bold tracking-wider rounded-none border-white text-white hover:bg-white hover:text-primary">
              {c("staff.join.button")}
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
