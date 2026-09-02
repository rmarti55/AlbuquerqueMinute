import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-center text-xl font-semibold">The Albuquerque Minute</h1>
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-in" />
      </div>
    </main>
  );
}
