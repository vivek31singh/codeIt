import Link from "next/link";

export default function ConfirmMail() {
    return (
      <>
        <main className="grid min-h-full place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8">
          <div className="text-center max-w-2xl">
            <p className="text-base font-semibold text-indigo-600">Confirm your email address</p>
            <h1 className="mt-4 text-balance text-5xl font-semibold tracking-tight text-gray-900 sm:text-7xl">
              Verify your email
            </h1>
            <p className="mt-6 text-pretty text-lg font-medium text-gray-500 sm:text-xl/8">
              We&apos;ve sent an email to your inbox to verify your email address. Please click on the link in the email to confirm your email address and complete your sign up. After confirmation, you can close this tab.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-y-4 gap-x-6">
             
              <p className="text-sm text-gray-500">
                Didn&apos;t receive a confirmation email? <Link href="/signup" className="font-semibold text-indigo-600 hover:text-indigo-500">Go back to the signup page</Link> and try again.
              </p>
            </div>
          </div>
        </main>
      </>
    )
  }
