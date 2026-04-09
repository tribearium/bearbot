export default function PrivacyPolicy() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-gray-300">
      <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: April 9, 2025</p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-2">1. Overview</h2>
        <p>
          Bear Bot is a WhatsApp-based AI assistant operated by Tribearium Solutions.
          This policy explains how we handle information received through WhatsApp
          interactions with our automated assistant.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-2">2. Information We Collect</h2>
        <p>When you message Bear Bot on WhatsApp, we collect:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
          <li>Your WhatsApp phone number</li>
          <li>The content of messages you send to the assistant</li>
          <li>The AI-generated responses sent back to you</li>
          <li>Timestamps of messages</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-2">3. How We Use Your Information</h2>
        <p>We use the information collected to:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
          <li>Provide automated responses via the AI assistant</li>
          <li>Maintain conversation history for continuity</li>
          <li>Allow our team to review conversations through an internal dashboard</li>
          <li>Improve the quality of our assistant over time</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-2">4. Data Storage</h2>
        <p>
          Message data is stored securely in Supabase, a cloud database provider.
          Data is retained for as long as necessary to provide our services.
          We do not sell or share your data with third parties for marketing purposes.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-2">5. Third-Party Services</h2>
        <p>Bear Bot uses the following third-party services to operate:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
          <li>WhatsApp Cloud API (Meta) — message delivery</li>
          <li>OpenAI — AI response generation</li>
          <li>Supabase — data storage</li>
        </ul>
        <p className="mt-2">
          Each provider has their own privacy policies governing their use of data.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-2">6. Your Rights</h2>
        <p>
          You may request deletion of your conversation data at any time by contacting
          us at{' '}
          <a
            href="mailto:team@tribeariumsolutions.com"
            className="text-brand-light hover:underline"
          >
            team@tribeariumsolutions.com
          </a>
          .
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-2">7. Contact</h2>
        <p>
          Tribearium Solutions
          <br />
          <a
            href="mailto:team@tribeariumsolutions.com"
            className="text-brand-light hover:underline"
          >
            team@tribeariumsolutions.com
          </a>
        </p>
      </section>
    </main>
  );
}
