import "./TrustNotice.css";

export default function TrustNotice() {
  return (
    <section className="trust container" aria-labelledby="trust-title">
      <div className="trust__box">
        <div>
          <h2 id="trust-title" className="trust__title">How answers work</h2>
          <p className="trust__lead">
            This assistant is designed to answer from university documents. It is a
            helper, not an official decision-maker.
          </p>
        </div>
        <ul className="trust__list">
          <li>Answers use approved university documents, and the sources are shown next to each answer.</li>
          <li>An answer may not always be available. If the documents don’t contain enough information, the assistant says so.</li>
          <li>For official decisions, confirm with the relevant university office.</li>
        </ul>
      </div>
    </section>
  );
}