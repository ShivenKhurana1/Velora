import './globals.css';
import CustomCursor from '@/components/CustomCursor';

export const metadata = {
  title: 'Velora Focus',
  description: 'The Open Window'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
