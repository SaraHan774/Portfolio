export default function Footer() {
  return (
    <footer
      className="border-t border-gray-200"
      style={{
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 'var(--font-size-xs)',
        color: 'var(--color-text-muted)',
      }}
    >
      © 2025 Portfolio | Contact: email@example.com
    </footer>
  );
}

