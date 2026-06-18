import './globals.css';

export const metadata = {
  title: 'Yacht Uniform Lookbook Builder',
  description: 'Interactive yacht crew uniform configurator and PDF lookbook generator.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
