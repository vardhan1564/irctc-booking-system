// Port of Footer.jsp (it existed in the old project but no page included it).
const devs = [
  { name: 'Vardhan Adheli', linkedin: 'https://www.linkedin.com/in/vardhanadheli/', instagram: 'https://www.instagram.com/vardhan__1506/' },
  { name: 'Ashutosh Kumar', linkedin: 'https://www.linkedin.com/in/ashutosh-kumar-329699259', instagram: 'https://www.instagram.com/axhutosh_/' },
];

export default function Footer() {
  return (
    <footer className="irctc-footer">
      <div className="footer-content">
        <span className="footer-label">Designed &amp; Developed by</span>
        {devs.map((d) => (
          <div className="developer-row" key={d.name}>
            <span className="dev-name">{d.name}</span>
            <div className="social-group">
              <a href={d.linkedin} target="_blank" rel="noreferrer" className="social-icon" title={`${d.name.split(' ')[0]}'s LinkedIn`}>
                <i className="bi bi-linkedin" />
              </a>
              <a href={d.instagram} target="_blank" rel="noreferrer" className="social-icon" title={`${d.name.split(' ')[0]}'s Instagram`}>
                <i className="bi bi-instagram" />
              </a>
            </div>
          </div>
        ))}
        <div className="copyright"><b>All rights to us only &copy; 2025</b></div>
      </div>
    </footer>
  );
}
