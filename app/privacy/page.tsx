export const metadata = {
  title: "Privacy Policy | Alessandro Enterprises",
  description:
    "Learn how Alessandro Enterprises collects, uses, shares, and protects personal information across our website and services.",
  alternates: { canonical: "/privacy" },
};

const sections = [
  {
    title: "Information we collect",
    paragraphs: [
      "We collect information you choose to provide when you contact us, request a consultation or quote, make a booking or order, use the customer portal, apply for a loan, or interact with website posts. This may include your name, email address, phone number, delivery or service details, account details, and the information you include in a request.",
      "When you sign in with Google to like or comment on website posts, we receive basic profile information made available by Google, such as your name, email address, profile image, and Google account identifier. We use this information to identify your account and associate your interactions with it. We do not use Google sign-in to read your Gmail, contacts, files, or other Google content.",
      "Our website and service providers may also process basic technical information, such as browser and device details, security logs, and pages or features used, to keep the site working and protect it from misuse.",
    ],
  },
  {
    title: "How we use information",
    paragraphs: [
      "We use information to respond to enquiries, provide and support our products and services, manage accounts and requests, process bookings and orders, assess and administer loan applications, deliver customer support, and operate website features such as comments and likes.",
      "We may also use information to maintain security, prevent fraud or abuse, keep business records, meet legal obligations, and improve our services. We do not sell personal information.",
    ],
  },
  {
    title: "Website posts and public interactions",
    paragraphs: [
      "Comments and other content you submit to public website posts may be visible to other visitors. Your display name and profile image may appear with your comment. Please do not include sensitive personal or financial information in a public comment. Likes may be associated with your account and used to prevent duplicate interactions.",
      "You can contact us to request removal of a comment or to ask about your account information. We may retain limited records where needed for security, dispute handling, or legal obligations.",
    ],
  },
  {
    title: "How information is shared",
    paragraphs: [
      "We share information with service providers that help us operate the website and deliver our services, including hosting, database, authentication, and communications providers. These providers may process information on our behalf under their own security and privacy terms.",
      "We may disclose information when required by law, to protect people or our services, or as part of a business transfer. We do not allow service providers to use your information for their own unrelated advertising.",
    ],
  },
  {
    title: "Google sign-in",
    paragraphs: [
      "If you choose Google sign-in for website community features, Google authenticates you and shares the basic profile details described above. Your use of Google sign-in is also subject to Google's privacy policy. You can use other website areas that do not require an account without signing in; transactions and services that require an AEOS customer account may ask you to create one separately.",
    ],
  },
  {
    title: "Security, storage, and international processing",
    paragraphs: [
      "We use reasonable administrative and technical safeguards designed to protect personal information. No online service can guarantee absolute security. Information is kept for as long as needed for the purposes described here, including service delivery, recordkeeping, security, and legal obligations, and is then deleted or de-identified where practical.",
      "Our technology providers may process or store information in countries outside Zambia. Where this happens, we take reasonable steps to use providers and safeguards appropriate to the information and applicable requirements.",
    ],
  },
  {
    title: "Your choices and requests",
    paragraphs: [
      "You may choose not to provide information, though this can limit our ability to respond or provide a requested service. You can ask us to access, correct, or delete personal information, withdraw consent where processing is based on consent, or raise a privacy concern. We will review and respond to requests in line with applicable law; some records may need to be retained for legitimate or legal reasons.",
    ],
  },
  {
    title: "Children",
    paragraphs: [
      "Our website services are not intended for children to use independently. If you believe a child has provided personal information without appropriate permission, contact us so we can review and take suitable action.",
    ],
  },
  {
    title: "Changes to this policy",
    paragraphs: [
      "We may update this policy as our services or legal requirements change. The date below shows when it was most recently revised. Material changes will be reflected on this page.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] px-4 py-10 text-[#12213a] sm:px-6 sm:py-16">
      <article className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 px-6 py-9 sm:px-10 sm:py-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
            Alessandro Enterprises
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-4 max-w-3xl leading-7 text-slate-600">
            This policy explains how Alessandro Enterprises handles personal
            information when you visit our website or use our services,
            including Google sign-in for public website interactions.
          </p>
          <p className="mt-4 text-sm text-slate-500">Last updated: November 23, 2026</p>
        </header>

        <div className="divide-y divide-slate-100 px-6 sm:px-10">
          {sections.map((section, index) => (
            <section key={section.title} className="py-7">
              <h2 className="text-lg font-semibold text-[#12213a]">
                {index + 1}. {section.title}
              </h2>
              <div className="mt-3 space-y-3 text-[15px] leading-7 text-slate-600">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}

          <section className="py-7">
            <h2 className="text-lg font-semibold text-[#12213a]">
              Contact us about privacy
            </h2>
            <p className="mt-3 leading-7 text-slate-600">
              For privacy questions or requests, contact Alessandro Enterprises
              at{" "}
              <a
                className="font-medium text-blue-700 underline underline-offset-4"
                href="mailto:alessandrosenterprises@gmail.com"
              >
                alessandrosenterprises@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
