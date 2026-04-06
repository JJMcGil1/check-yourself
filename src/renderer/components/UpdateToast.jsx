import React, { useState, useEffect } from 'react';

const styles = {
  container: {
    position: 'fixed',
    top: 20,
    right: 20,
    zIndex: 9999,
    width: 300,
    background: 'rgba(26, 26, 31, 0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: 14,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: 16,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
    color: '#F0F0F2',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#8B8B97',
    marginBottom: 12,
  },
  buttons: {
    display: 'flex',
    gap: 8,
    justifyContent: 'flex-end',
  },
  btnSecondary: {
    padding: '6px 14px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    background: 'transparent',
    color: '#8B8B97',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  btnPrimary: {
    padding: '6px 14px',
    border: 'none',
    borderRadius: 8,
    background: 'linear-gradient(135deg, #34D399 0%, #06B6D4 100%)',
    color: '#0C0C0E',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(52, 211, 153, 0.3)',
  },
  progressBar: {
    width: '100%',
    height: 3,
    background: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #34D399, #06B6D4)',
    borderRadius: 2,
    transition: 'width 0.3s ease',
    boxShadow: '0 0 8px rgba(52, 211, 153, 0.4)',
  },
  spinner: {
    display: 'inline-block',
    width: 14,
    height: 14,
    border: '2px solid rgba(255, 255, 255, 0.08)',
    borderTopColor: '#34D399',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginRight: 8,
    verticalAlign: 'middle',
  },
  error: {
    fontSize: 12,
    color: '#FB7185',
    marginBottom: 8,
  },
};

export default function UpdateToast() {
  const [state, setState] = useState(null);
  const [version, setVersion] = useState('');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!window.updater) return;

    const cleanups = [
      window.updater.onUpdateAvailable((info) => {
        setVersion(info.version);
        setState('available');
      }),
      window.updater.onDownloadProgress((p) => {
        setState('downloading');
        setProgress(p.percent);
      }),
      window.updater.onUpdateDownloaded(() => {
        setState('installing');
      }),
      window.updater.onUpdateError((err) => {
        setErrorMsg(typeof err === 'string' ? err : 'Update failed');
        setState('error');
      }),
    ];

    return () => cleanups.forEach((fn) => fn && fn());
  }, []);

  if (!state) return null;

  return (
    <div style={styles.container}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {state === 'available' && (
        <>
          <div style={styles.title}>Update Available</div>
          <div style={styles.subtitle}>Version {version} is ready to download</div>
          <div style={styles.buttons}>
            <button style={styles.btnSecondary} onClick={() => { setState(null); window.updater.dismissUpdate(); }}>
              Later
            </button>
            <button style={styles.btnPrimary} onClick={() => { setState('downloading'); window.updater.downloadUpdate(); }}>
              Download
            </button>
          </div>
        </>
      )}

      {state === 'downloading' && (
        <>
          <div style={styles.title}>Downloading Update...</div>
          <div style={styles.subtitle}>{progress}% complete</div>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
          </div>
        </>
      )}

      {state === 'installing' && (
        <>
          <div style={styles.title}>
            <span style={styles.spinner} />
            Restarting Check Yourself...
          </div>
        </>
      )}

      {state === 'error' && (
        <>
          <div style={styles.title}>Update Error</div>
          <div style={styles.error}>{errorMsg}</div>
          <div style={styles.buttons}>
            <button style={styles.btnSecondary} onClick={() => setState(null)}>
              Dismiss
            </button>
            <button style={styles.btnPrimary} onClick={() => { setState('downloading'); setProgress(0); window.updater.downloadUpdate(); }}>
              Retry
            </button>
          </div>
        </>
      )}
    </div>
  );
}
