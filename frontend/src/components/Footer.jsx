import "./stylesheets/Footer.css";

function Footer() {
  return (
    <section className="footer">
      <section className="footer-column">
        <strong className="column-header">About</strong>
        <p className="column-item">Our Mission</p>
        <p className="column-item">Helping You Get in Sync</p>
      </section>
      <section className="footer-column">
        <strong className="column-header">Contact</strong>
        <p className="column-item">Email</p>
        <p className="column-item">Instagram</p>
        <p className="column-item">Facebook</p>
        <p className="column-item">LinkedIn</p>
      </section>
      <section className="footer-column">
        <strong className="column-header">Legal</strong>
        <p className="column-item">Privacy Policy</p>
        <p className="column-item">Frequently Asked Questions</p>
      </section>
    </section>
  );
}

export default Footer;
