import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  FileText,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Server,
  KeyRound,
  RefreshCw
} from 'lucide-react';

const PRIMARY_API_URL = 'http://localhost:8080/api/content';
const PROXY_API_URL = '/api/content';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState('');
  const [signedUrl, setSignedUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [showArchDetails, setShowArchDetails] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);
  const [popupBlocked, setPopupBlocked] = useState(false);

  // Helper to extract and clean the URL string from backend response
  const extractUrl = (raw) => {
    if (!raw) return '';
    if (typeof raw === 'string') {
      let trimmed = raw.trim();
      // Remove surrounding quotes if returning JSON string e.g. "https://..."
      if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        trimmed = trimmed.slice(1, -1);
      }
      return trimmed;
    }
    if (typeof raw === 'object') {
      return raw.url || raw.signedUrl || raw.link || raw.contentUrl || Object.values(raw)[0] || '';
    }
    return String(raw);
  };

  // Robust fetcher trying direct backend first, then Vite proxy fallback
  const fetchSignedUrl = async () => {
    const errorLogs = [];

    // Helper to safely extract URL from response text or json
    const parseResponse = async (res) => {
      const rawText = (await res.text()).trim();
      try {
        const json = JSON.parse(rawText);
        return extractUrl(json);
      } catch {
        return extractUrl(rawText);
      }
    };

    // 1. Try Direct Spring Boot endpoint (http://localhost:8080/api/content)
    try {
      const res = await fetch(PRIMARY_API_URL, {
        method: 'GET'
      });

      if (res.ok) {
        const url = await parseResponse(res);
        if (url && url.startsWith('http')) {
          return url;
        }
      } else {
        errorLogs.push(`Direct call returned status ${res.status}`);
      }
    } catch (err) {
      errorLogs.push(`Direct call failed: ${err.message}`);
    }

    // 2. Try Vite Proxy (/api/content) to bypass any local browser CORS
    try {
      const res = await fetch(PROXY_API_URL, {
        method: 'GET'
      });

      if (res.ok) {
        const url = await parseResponse(res);
        if (url && url.startsWith('http')) {
          return url;
        }
      } else {
        errorLogs.push(`Proxy call returned status ${res.status}`);
      }
    } catch (err) {
      errorLogs.push(`Proxy call failed: ${err.message}`);
    }

    throw new Error(errorLogs.join(' | '));
  };

  const handleAccessPdf = async () => {
    setLoading(true);
    setError(null);
    setErrorDetails('');
    setPopupBlocked(false);

    // Pre-open a blank tab in the click handler to prevent Chrome's popup blocker
    let newWindow = null;
    try {
      newWindow = window.open('about:blank', '_blank');
    } catch {
      newWindow = null;
    }

    try {
      const url = await fetchSignedUrl();
      setSignedUrl(url);
      setLastFetchedAt(new Date().toLocaleTimeString());

      // Navigate the opened tab or fallback
      if (newWindow && !newWindow.closed) {
        newWindow.location.href = url;
      } else {
        const fallbackWin = window.open(url, '_blank', 'noopener,noreferrer');
        if (!fallbackWin || fallbackWin.closed || typeof fallbackWin.closed === 'undefined') {
          setPopupBlocked(true);
        }
      }
    } catch (err) {
      if (newWindow && !newWindow.closed) {
        newWindow.close();
      }
      console.error('Failed to get signed URL:', err);
      // Prompt requirement 7: display exactly "Unable to generate secure access link. Please try again."
      setError('Unable to generate secure access link. Please try again.');
      setErrorDetails(err.message || 'Network or CORS connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = () => {
    if (!signedUrl) return;
    navigator.clipboard.writeText(signedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const parseUrlParams = (urlStr) => {
    try {
      const parsed = new URL(urlStr);
      return {
        domain: parsed.origin,
        expires: parsed.searchParams.get('Expires'),
        keyPairId: parsed.searchParams.get('Key-Pair-Id'),
        signature: parsed.searchParams.get('Signature')
          ? `${parsed.searchParams.get('Signature').substring(0, 18)}...`
          : null
      };
    } catch {
      return null;
    }
  };

  const urlParams = signedUrl ? parseUrlParams(signedUrl) : null;

  return (
    <div className="min-h-screen app-container">
      {/* Background ambient glow lights */}
      <div className="ambient-glow glow-1"></div>
      <div className="ambient-glow glow-2"></div>

      <div className="content-wrapper">
        {/* Header Section */}
        <header className="header-card">
          <div className="header-badge">
            <span className="pulse-dot"></span>
            <span className="badge-text">AWS CloudFront & Spring Boot Integration</span>
          </div>

          <h1 className="project-title">
            <span className="icon-badge">🔐</span>
            Secure Paid Content Delivery System
          </h1>

          <p className="project-description">
            Securely access premium content using AWS CloudFront Signed URLs.
          </p>

          <div className="backend-tag">
            <Server size={14} className="tag-icon" />
            <span>Target Backend:</span>
            <code>http://localhost:8080/api/content</code>
          </div>
        </header>

        {/* Main Content Dashboard */}
        <main className="main-card">
          {/* Card Header matching Wireframe */}
          <div className="card-top-banner">
            <div className="banner-title-group">
              <span className="banner-icon">🔐</span>
              <div>
                <h2 className="banner-title">Secure Paid Content</h2>
                <p className="banner-subtitle">AWS CloudFront Protected Content</p>
              </div>
            </div>
            <span className="status-pill status-active">
              <Lock size={12} />
              Access Protected
            </span>
          </div>

          {/* Central Item Display */}
          <div className="card-content-body">
            <div className="document-icon-wrapper">
              <div className="doc-icon-inner">
                <FileText size={44} className="doc-svg" />
                <span className="doc-badge">PDF</span>
              </div>
            </div>

            <h3 className="content-name">Scrum Fundamentals Certified</h3>
            <p className="content-sub-detail">Exclusive Certification Material & Study Guide</p>

            {/* Metadata Badges */}
            <div className="metadata-grid">
              <div className="meta-badge">
                <span className="meta-emoji">📄</span>
                <span className="meta-label">Type:</span>
                <span className="meta-value">PDF</span>
              </div>

              <div className="meta-badge">
                <span className="meta-emoji">🔒</span>
                <span className="meta-label">Access:</span>
                <span className="meta-value highlight-protected">Protected</span>
              </div>

              <div className="meta-badge">
                <span className="meta-emoji">☁️</span>
                <span className="meta-label">Delivery:</span>
                <span className="meta-value highlight-aws">AWS CloudFront</span>
              </div>
            </div>

            {/* Error Message Alert (Requirement 7) */}
            {error && (
              <div className="alert alert-error" role="alert">
                <AlertCircle size={20} className="alert-icon" />
                <div className="alert-content">
                  <div className="alert-heading">{error}</div>
                  <div className="alert-subtext">
                    Ensure your Spring Boot backend is active on <code>http://localhost:8080</code> with endpoint <code>/api/content</code>.
                  </div>
                  {errorDetails && (
                    <div className="error-diagnostic-details">
                      Details: {errorDetails}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Loading State Banner (Requirement 6) */}
            {loading && (
              <div className="alert alert-loading" role="status">
                <Loader2 size={20} className="spinner" />
                <div className="alert-content">
                  <span className="loading-text">Generating secure access link...</span>
                  <span className="loading-sub">Requesting CloudFront signed token from Spring Boot</span>
                </div>
              </div>
            )}

            {/* Success Notification */}
            {signedUrl && !loading && !error && (
              <div className="alert alert-success">
                <CheckCircle2 size={20} className="alert-icon-success" />
                <div className="alert-content">
                  <span className="success-text">Secure CloudFront link generated!</span>
                  <span className="success-sub">Ready at {lastFetchedAt}. Content verified with CloudFront key pair.</span>
                </div>
              </div>
            )}

            {/* Browser Popup Blocked Warning & Direct Link */}
            {popupBlocked && signedUrl && (
              <div className="alert alert-warning">
                <AlertCircle size={20} className="alert-icon-warning" />
                <div className="alert-content">
                  <span className="warning-text">Your browser prevented opening the new tab automatically.</span>
                  <a
                    href={signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="direct-popup-link"
                  >
                    Click here to open the PDF now ➔
                  </a>
                </div>
              </div>
            )}

            {/* Action Button (Requirement 4 & 5) */}
            <div className="cta-wrapper">
              <button
                id="access-pdf-button"
                className={`access-button ${loading ? 'button-loading' : ''}`}
                onClick={handleAccessPdf}
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="spinner" />
                    <span>Generating secure access link...</span>
                  </>
                ) : (
                  <>
                    <Lock size={19} className="btn-icon" />
                    <span>Access PDF</span>
                    <ExternalLink size={18} className="btn-icon-right" />
                  </>
                )}
              </button>
            </div>

            {/* Direct Open Button when URL is ready */}
            {signedUrl && (
              <div className="ready-action-row">
                <a
                  href={signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="open-pdf-direct-btn"
                >
                  <ExternalLink size={16} />
                  <span>Open PDF in New Tab</span>
                </a>
              </div>
            )}

            {/* URL Inspector for Demo & Viva Presentations */}
            {signedUrl && (
              <div className="signed-url-inspector">
                <div className="inspector-header">
                  <div className="inspector-title">
                    <KeyRound size={15} />
                    <span>CloudFront Signed URL Token Breakdown</span>
                  </div>
                  <button className="copy-button" onClick={handleCopyUrl} title="Copy full signed URL">
                    {copied ? (
                      <>
                        <Check size={14} className="text-emerald" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="url-preview-box">
                  <code>{signedUrl}</code>
                </div>

                {urlParams && (
                  <div className="token-params-grid">
                    <div className="param-item">
                      <span className="param-key">Edge CDN:</span>
                      <span className="param-val">{urlParams.domain}</span>
                    </div>
                    {urlParams.keyPairId && (
                      <div className="param-item">
                        <span className="param-key">Key-Pair-Id:</span>
                        <span className="param-val code-font">{urlParams.keyPairId}</span>
                      </div>
                    )}
                    {urlParams.expires && (
                      <div className="param-item">
                        <span className="param-key">Expires Epoch:</span>
                        <span className="param-val code-font">{urlParams.expires}</span>
                      </div>
                    )}
                    {urlParams.signature && (
                      <div className="param-item">
                        <span className="param-key">RSA Signature:</span>
                        <span className="param-val code-font">{urlParams.signature}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Security & How It Works Section (Requirement 8) */}
          <div className="security-section">
            <div className="security-header">
              <div className="sec-title-wrap">
                <span className="sec-icon">🔐</span>
                <h4 className="sec-title">Security & How it works</h4>
              </div>
              <button
                className="toggle-diagram-btn"
                onClick={() => setShowArchDetails(!showArchDetails)}
              >
                {showArchDetails ? 'Hide Diagram' : 'Show Architecture Diagram'}
              </button>
            </div>

            <p className="security-intro">
              Your content is protected using <strong>AWS CloudFront Signed URLs</strong>. Direct S3 access is blocked, ensuring zero unauthorized distribution.
            </p>

            <ul className="security-checklist">
              <li className="security-check-item">
                <span className="check-bullet">✓</span>
                <span className="check-text">
                  <strong>Private S3 content</strong>: PDF is stored privately in Amazon S3 with public access completely disabled.
                </span>
              </li>
              <li className="security-check-item">
                <span className="check-bullet">✓</span>
                <span className="check-text">
                  <strong>CloudFront protection</strong>: Origin Access Control (OAC) restricts direct S3 reads exclusively to CloudFront.
                </span>
              </li>
              <li className="security-check-item">
                <span className="check-bullet">✓</span>
                <span className="check-text">
                  <strong>Signed URL authentication</strong>: Spring Boot backend cryptographically signs the request using RSA key pairs.
                </span>
              </li>
              <li className="security-check-item">
                <span className="check-bullet">✓</span>
                <span className="check-text">
                  <strong>Time-limited access</strong>: The URL automatically expires after the predefined validity period.
                </span>
              </li>
              <li className="security-check-item">
                <span className="check-bullet">✓</span>
                <span className="check-text">
                  <strong>CloudFront verification</strong>: CloudFront edge servers verify the digital signature before providing the PDF.
                </span>
              </li>
            </ul>

            {/* Interactive Architecture Flow Diagram */}
            {showArchDetails && (
              <div className="architecture-diagram-container">
                <h5 className="diagram-title">System Request Flow</h5>
                <div className="flow-steps">
                  <div className="flow-step">
                    <div className="step-num">1</div>
                    <div className="step-card">
                      <div className="step-role">React Frontend</div>
                      <div className="step-desc">User clicks "Access PDF", initiates GET /api/content</div>
                    </div>
                  </div>

                  <div className="flow-arrow">➔</div>

                  <div className="flow-step">
                    <div className="step-num">2</div>
                    <div className="step-card highlight-step">
                      <div className="step-role">Spring Boot Backend</div>
                      <div className="step-desc">Signs URL with private key & expiration timestamp</div>
                    </div>
                  </div>

                  <div className="flow-arrow">➔</div>

                  <div className="flow-step">
                    <div className="step-num">3</div>
                    <div className="step-card">
                      <div className="step-role">CloudFront Signed URL</div>
                      <div className="step-desc">Returned to frontend & opened in browser tab</div>
                    </div>
                  </div>

                  <div className="flow-arrow">➔</div>

                  <div className="flow-step">
                    <div className="step-num">4</div>
                    <div className="step-card">
                      <div className="step-role">Edge Verification</div>
                      <div className="step-desc">CloudFront edge checks signature against public key</div>
                    </div>
                  </div>

                  <div className="flow-arrow">➔</div>

                  <div className="flow-step">
                    <div className="step-num">5</div>
                    <div className="step-card success-step">
                      <div className="step-role">Private S3 Origin</div>
                      <div className="step-desc">Streams private PDF securely to authenticated user</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Zero-Secret Compliance Notice */}
            <div className="compliance-note">
              <ShieldCheck size={16} className="compliance-icon" />
              <span>
                <strong>Enterprise Security Standard:</strong> No AWS access keys, CloudFront private keys, or RSA PEM files are stored in or exposed to this client application.
              </span>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="footer">
          <p>
            Secure Paid Content Delivery System • AWS CloudFront + Amazon S3 + Spring Boot + React
          </p>
        </footer>
      </div>
    </div>
  );
}
