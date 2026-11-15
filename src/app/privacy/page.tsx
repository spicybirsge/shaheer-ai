import Link from "next/link";
import { SiteFrame } from "@/components/site-frame";
export const metadata = { title: "Privacy policy — Shaheer Ai" };
export default function Privacy() {
  return (
    <SiteFrame>
      <article className="legal-copy mx-auto max-w-2xl">
        <p className="text-xs tracking-[.2em]">YOUR DATA</p>
        <h1 className="mt-4 text-4xl font-medium tracking-tight">
          Privacy policy
        </h1>
        <p className="mt-5">
          Effective November 14, 2026. This policy describes how Shaheer Ahamed
          operates the Shaheer chat service at ai.shaheerahamed.com.
        </p>
        <h2>What we collect</h2>
        <ul>
          <li>
            Google account identity: name, email, verification status, profile
            picture URL, and the provider identifiers and tokens needed for
            authentication.
          </li>
          <li>
            Chat content: messages, replies, model-provided reasoning, tool
            activity, conversation titles, and associated timestamps.
          </li>
          <li>
            Service records: sign-in sessions, session IP addresses and user
            agents where provided, daily usage counts, and IP-based
            authentication rate-limit records.
          </li>
        </ul>
        <h2>How we use it</h2>
        <p>
          We use this information to sign you in, show your profile and
          conversation history, generate AI responses, enforce limits, secure
          the service, and investigate errors. Your Google profile picture URL
          is stored in your account and may be loaded from Google when you view
          your account menu.
        </p>
        <h2>Providers and data sharing</h2>
        <p>
          We use service providers to support authentication, hosting, data
          storage, and response generation. They process information on our
          behalf as needed to operate the service and may process it outside
          your country. Their retention and security policies may also apply. We
          do not sell your personal information.
        </p>
        <h2>Cookies and browser storage</h2>
        <p>
          Authentication uses essential cookies. Theme preferences are saved in
          browser storage. Recently viewed conversations may be cached in memory
          during your visit to make navigation faster; this cache is not written
          to browser storage by the app. We do not add advertising trackers.
        </p>
        <h2>Retention and deletion</h2>
        <p>
          Application account and chat records are retained while your account
          exists unless removed. Removing an individual chat hides it and
          prevents future access; it does not by itself erase the saved records.
          To delete your account and its associated records, use{" "}
          <Link href="/settings">Account settings</Link>.
        </p>
        <p>
          Account deletion first attempts to cancel your active agent runs, then
          deletes your account, authentication sessions, connected provider
          tokens, conversations and saved events, and usage records from the
          application database. New Workflow runs are configured for zero
          content retention when they finish; enforcement depends on the runtime
          backend. Previously created runs, infrastructure metadata, security
          logs, backups, and records held by Google, Vercel, or model/database
          providers may persist under their retention policies. Deletion from
          this service does not delete your Google account or provider-held
          copies.
        </p>
        <h2>Your choices</h2>
        <p>
          You may request access, correction, or deletion of your personal
          information and raise privacy questions by email at{" "}
          <a href="mailto:contact@shaheerahamed.com">
            contact@shaheerahamed.com
          </a>
          . Available rights depend on applicable law. Deleting your account is
          available directly in settings; requests concerning provider-held
          records may require contacting that provider.
        </p>
        <h2>Security and children</h2>
        <p>
          We use authentication and conversation ownership checks to restrict
          access. No service can guarantee absolute security; do not submit
          sensitive information. This service is intended for adults, and we do
          not knowingly collect children’s data.
        </p>
        <h2>Updates</h2>
        <p>
          We may update this policy as processing changes. The effective date
          above identifies the current version.
        </p>
      </article>
    </SiteFrame>
  );
}
