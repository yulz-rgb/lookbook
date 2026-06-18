import { SignIn } from '@clerk/nextjs';

export const metadata = { title: 'Sign in - Yacht Uniform Lookbook' };

export default function SignInPage() {
  return (
    <div className="auth-screen">
      <SignIn />
    </div>
  );
}
