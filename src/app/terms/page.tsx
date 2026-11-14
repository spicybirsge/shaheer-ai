import Link from "next/link";
import { SiteFrame } from "@/components/site-frame";
export const metadata = { title: "Terms of service — Shaheer" };
export default function Terms() {
  return (
    <SiteFrame>
      <article className="legal-copy mx-auto max-w-2xl">
        <p className="text-xs tracking-[.2em]">THE SMALL PRINT</p>
        <h1 className="mt-4 text-4xl font-medium tracking-tight">
          Terms of service
        </h1>
        <p className="mt-5">
          Effective November 14, 2026. These terms apply to the Shaheer chat
          service at ai.shaheerahamed.com. By using it, you agree to these
          terms.
        </p>
        <h2>Using the service</h2>
        <p>
          Shaheer is an experimental AI assistant operated by Shaheer Ahamed.
          You must be at least 18 and legally able to agree to these terms. Keep
          your Google account secure and use the service only for lawful
          purposes. Do not abuse access limits, compromise accounts, or use the
          service to harm others.
        </p>
        <h2>AI output</h2>
        <p>
          AI responses can be inaccurate or inappropriate. Check important
          information independently; responses are not professional medical,
          legal, or financial advice. The service may use third-party AI and
          infrastructure services to generate responses. Features and results
          vary by request.
        </p>
        <h2>Your content</h2>
        <p>
          You keep your rights to content you submit. You give us permission to
          process, store, and transmit it to service providers to operate the
          chat and maintain your conversations. Submit only information you have
          permission to share. Do not submit passwords, payment details, or
          sensitive personal information.
        </p>
        <h2>Availability and limits</h2>
        <p>
          The free service currently allows 50 message attempts per account per
          UTC day. Attempts may count even when a provider fails. Limits,
          models, features, and availability may change. Access may be suspended
          for abuse or discontinued. No uninterrupted service or specific output
          quality is promised.
        </p>
        <h2>Privacy and account deletion</h2>
        <p>
          Our <Link href="/privacy">Privacy policy</Link> explains data
          processing and retention. You can request account deletion from{" "}
          <Link href="/settings">Account settings</Link>. Deletion removes
          account-linked records from the application database; third-party
          records and backups may have separate retention periods.
        </p>
        <h2>Responsibility</h2>
        <p>
          The service is provided “as is” and “as available” to the extent
          permitted by law. You are responsible for decisions and actions based
          on its output. Nothing in these terms excludes rights or liabilities
          that applicable law does not allow us to exclude.
        </p>
        <h2>Changes and contact</h2>
        <p>
          We may update these terms as the service evolves and will update the
          effective date when we do. For service or privacy inquiries, contact
          the operator by email at{" "}
          <a href="mailto:contact@shaheerahamed.com">
            contact@shaheerahamed.com
          </a>
          .
        </p>
      </article>
    </SiteFrame>
  );
}
