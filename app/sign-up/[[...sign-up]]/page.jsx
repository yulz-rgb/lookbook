import { SignUp } from '@clerk/nextjs';

export const metadata = { title: 'Sign up - Yacht Uniform Lookbook' };

export default function SignUpPage() {
  return (
    <div className="auth-screen">
      <SignUp />
    </div>
  );
}
