"use client"
import React from 'react'

interface ButtonParams {
    type?: 'submit' | 'reset' | 'button';
    className: string;
    onClickFn?: () => void;
    children: React.ReactNode;
    disabled?: boolean;
}

export default function CustomButton({type, className, onClickFn, children, disabled}: ButtonParams) {
  return (
    <button
          type={type}
          className={className}
          disabled={disabled}
          onClick={onClickFn}
>
          {children}
        </button>
  )
}

