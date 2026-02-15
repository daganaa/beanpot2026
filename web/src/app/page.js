import styles from './page.module.css';

export default function Home() {
  return (
    <div className="page-enter">
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.tagline}>✨ AI-Powered Photo Sharing</div>
          <h1 className={styles.title}>
            Your event photos,
            <br />
            <span className={styles.titleAccent}>found automatically.</span>
          </h1>
          <p className={styles.subtitle}>
            Upload event photos and let our facial recognition find every shot
            you're in. No more scrolling through hundreds of photos — just yours.
          </p>
          <div className={styles.ctas}>
            <a
              href="/auth/login"
              className={`btn btn-primary ${styles.ctaPrimary}`}
            >
              Get Started Free
            </a>
            <a
              href="#how-it-works"
              className={`btn btn-secondary ${styles.ctaSecondary}`}
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className={styles.howItWorks}>
        <p className={styles.sectionLabel}>How It Works</p>
        <h2 className={styles.sectionTitle}>Three simple steps</h2>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepIcon}>🤳</div>
            <p className={styles.stepNumber}>STEP 1</p>
            <h3 className={styles.stepTitle}>Enroll Your Face</h3>
            <p className={styles.stepDesc}>
              Take a quick selfie so our system can recognize you in event
              photos. One-time setup, instant results.
            </p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepIcon}>📤</div>
            <p className={styles.stepNumber}>STEP 2</p>
            <h3 className={styles.stepTitle}>Upload Photos</h3>
            <p className={styles.stepDesc}>
              Anyone at the event can upload their photos. Our AI scans every
              face and matches them to enrolled users.
            </p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepIcon}>🖼️</div>
            <p className={styles.stepNumber}>STEP 3</p>
            <h3 className={styles.stepTitle}>Get Your Photos</h3>
            <p className={styles.stepDesc}>
              Browse your personal gallery — only photos you appear in. Share
              with friends or download instantly.
            </p>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className={styles.footerCta}>
        <h2 className={styles.footerTitle}>Ready to find your photos?</h2>
        <p className={styles.footerText}>
          Join now and never miss a moment from your next event.
        </p>
        <a href="/auth/login" className="btn btn-primary">
          Create Your Account
        </a>
      </section>
    </div>
  );
}
