import './globals.css';

export const metadata = {
  title: 'Yacht Uniform Lookbook',
  description: 'Interactive yacht crew uniform configurator — build looks, manage crew sizing, and export PDF lookbooks.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
