'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        // Get session to ensure user is logged in
        const session = await getSession();
        if (session) {
          router.push('/dashboard');
          router.refresh();
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to ChangeFlow
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              href="/signup"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create a new account
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              New to ChangeFlow?{' '}
              <Link
                href="/signup"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Create an account
              </Link>
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm font-medium text-blue-900 mb-3">Test Accounts (Password: password123):</p>
              <div className="grid grid-cols-1 gap-1.5 text-xs text-blue-700">
                <div className="flex justify-between items-center">
                  <span><strong>Admin:</strong></span>
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('admin@test.com')}
                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    admin@test.com
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span><strong>Manager:</strong></span>
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('manager@test.com')}
                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    manager@test.com
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span><strong>Engineer:</strong></span>
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('engineer@test.com')}
                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    engineer@test.com
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span><strong>Quality:</strong></span>
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('quality@test.com')}
                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    quality@test.com
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span><strong>Manufacturing:</strong></span>
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('manufacturing@test.com')}
                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    manufacturing@test.com
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span><strong>Requestor:</strong></span>
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('requestor@test.com')}
                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    requestor@test.com
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span><strong>Document Control:</strong></span>
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('document@test.com')}
                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    document@test.com
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span><strong>Viewer:</strong></span>
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('viewer@test.com')}
                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    viewer@test.com
                  </button>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-blue-200">
                <p className="text-xs text-blue-600 italic">
                  Click any email to auto-fill the form
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}