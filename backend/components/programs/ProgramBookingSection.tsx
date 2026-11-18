import { BookTrialForm } from "@/components/home/BookTrialForm";

/**
 * The booking form at the foot of a program page: the same form as the homepage, tagged with the page it sits on so the
 * lead shows where it came from. "Book a free trial" buttons on the page scroll here (id "book-trial").
 */
export function ProgramBookingSection({
  sourcePage,
  heading,
  subheading,
  submitLabel,
  defaultAgeGroup,
  defaultProgram,
}: {
  sourcePage: string;
  heading: string;
  subheading: string;
  submitLabel: string;
  defaultAgeGroup?: string;
  defaultProgram?: string;
}) {
  return (
    <section id="book-trial" className="relative scroll-mt-24 bg-primary py-12 md:py-16">
      <div className="container mx-auto max-w-3xl px-4 md:px-6">
        <BookTrialForm sourcePage={sourcePage} headingAs="h2" heading={heading} subheading={subheading} submitLabel={submitLabel} defaultAgeGroup={defaultAgeGroup} defaultProgram={defaultProgram} hideLevel />
      </div>
    </section>
  );
}
