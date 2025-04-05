"use client";

import { AuthSchema } from '@/lib/zod/schemas/AuthSchema';
import React from 'react'

type EmailDataType = {
  email?: string;
  isEmailEntered?: boolean;
  emailError?: string;
}

interface EmailInputProps {
  handleEmail: (Email: EmailDataType) => void;
}


export default function EmailInput({handleEmail}: EmailInputProps) {
  
  const [email, setEmail] = React.useState('');
  const [emailError, setEmailError] = React.useState('');

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  React.useEffect(() => {
    if (AuthSchema.safeParse({ email: email ?? '' }).success) {
      setEmailError('');
      handleEmail({email, isEmailEntered: true, emailError: ''});
    } else {
      const error = AuthSchema.safeParse({ email: email ?? '' }).error?.issues[0].message;
      setEmailError(error ?? '');
      handleEmail({email, isEmailEntered: false, emailError: error ?? ''});
    }
  }, [email, emailError, handleEmail]);

  return (
    <div>
    <label htmlFor="email" className="block text-sm/6 font-medium text-gray-900">
      Email address
    </label>
    <div className="mt-2">
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
        value={email}
        onChange={handleEmailChange}
        />
        {emailError && email && <p className="text-red-500 text-sm/6 font-medium mt-2 justify-self-end">{emailError}</p>}
    </div>
  </div>
  )
}
