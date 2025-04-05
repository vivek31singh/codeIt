"use client";

import React from "react";
import { useWelcomeNotification } from "@/lib/store/useUser";
import Image from "next/image";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { CodeBlock } from "@/components/reusable/CodeBlock";
import CustomNotification from "@/components/reusable/CustomNotification";
import { motion } from "motion/react";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function Page() {
  const { isWelcomeNotificationVisible, toggleWelcomeNotificationVisibility } =
    useWelcomeNotification();

  const toggleNotificationVisibility = () => {
    toggleWelcomeNotificationVisibility();
  };

  const DummyComponent = `
  const DummyComponent = () => {
    const [count, setCount] = React.useState(0);
   
    const handleClick = () => {
      setCount(prev => prev + 1);
    };
   
    return (
      <article className="p-4 border rounded-lg">
        <header className="mb-4">
          <h2 className="text-xl font-bold">Fights Counter</h2>
        </header>
        <p className="mb-2">Fight Club Fights Count: {count}</p>
        <button 
          onClick={handleClick}
          className="px-4 py-2 bg-blue-500 text-white"
        >
          Increment
        </button>
      </article>
    );
  };
  `;

  const TimerComponent = `
  const TimerComponent = () => {
    const [seconds, setSeconds] = React.useState(0);

    React.useEffect(() => {
      const timer = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }, []);

    return (
      <article className="p-4 border rounded-lg">
        <header className="mb-4">
          <h2 className="text-xl font-bold">Timer</h2>
        </header>
        <p className="mb-2">Elapsed Time: {seconds}s</p>
      </article>
    );
  };
  `;

  const ToggleComponent = `
  const ToggleComponent = () => {
    const [isToggled, setIsToggled] = React.useState(false);

    const handleToggle = () => {
      setIsToggled(prev => !prev);
    };

    return (
      <article className="p-4 border rounded-lg">
        <header className="mb-4">
          <h2 className="text-xl font-bold">Toggle Example</h2>
        </header>
        <p className="mb-2">Status: {isToggled ? 'On' : 'Off'}</p>
        <button 
          onClick={handleToggle}
          className="px-4 py-2 bg-green-500 text-white"
        >
          Toggle
        </button>
      </article>
    );
  };
  `;

  return (
    <>
      <motion.main
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`bg-white w-full tranistion ease duration-300 ml-0`}
      >
        <SidebarTrigger />
        <section className="relative isolate overflow-hidden bg-gradient-to-b from-indigo-100/20 w-full">
          <div className="mx-auto pb-24 pt-10 sm:pb-32 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:px-8 lg:py-40">
            <header className="px-6 lg:px-0 lg:pt-4">
              <div className="mx-auto max-w-2xl">
                <div className="max-w-lg">
                  <Image
                    className="h-12 object-contain w-12"
                    src="https://tailwindui.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
                    alt="Your Company"
                    width={50}
                    height={50}
                  />
                  <div className="mt-24 sm:mt-32 lg:mt-16">
                    <nav className="inline-flex space-x-6">
                      <a
                        href="#"
                        className="inline-flex space-x-2 text-sm font-semibold text-gray-600"
                      >
                        <span>What&apos;s new</span>
                        <ChevronRightIcon
                          className="size-5 text-gray-400"
                          aria-hidden="true"
                        />
                      </a>
                      <a
                        href="#"
                        className="inline-flex items-center space-x-2 text-sm font-semibold text-gray-600"
                      >
                        <span>Just shipped v0.1.0</span>
                      </a>
                    </nav>
                  </div>
                  <h1 className="mt-10 text-pretty text-5xl font-semibold tracking-tight text-gray-900 sm:text-6xl">
                    CodeIt: Learn & Teach Coding Together in a Dynamic Setting
                  </h1>
                  <p className="mt-6 text-lg/8 text-gray-600">
                    CodeIt is a collaborative platform designed to facilitate
                    both learning and teaching coding in an interactive
                    environment.
                  </p>
                  <div className="mt-10 flex items-center gap-x-6">
                    <a
                      href="#"
                      className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      Documentation
                    </a>
                    <a
                      href="#"
                      className="text-sm/6 font-semibold text-gray-900"
                    >
                      View on GitHub <span aria-hidden="true">→</span>
                    </a>
                  </div>
                </div>
              </div>
            </header>
            <section className="mt-20 sm:mt-24 md:mx-auto md:max-w-2xl lg:mx-0 lg:mt-0 lg:w-screen">
              <div
                className="absolute inset-y-0 right-1/2 -z-10 -mr-10 w-[200%] skew-x-[-30deg] bg-white shadow-xl shadow-indigo-600/10 ring-1 ring-indigo-50 md:-mr-20 lg:-mr-36"
                aria-hidden="true"
              />
              <figure className="shadow-lg md:rounded-3xl">
                <div className="bg-indigo-500 [clip-path:inset(0)] md:[clip-path:inset(0_round_theme(borderRadius.3xl))]">
                  <div
                    className="absolute -inset-y-px left-1/2 -z-10 ml-10 w-[200%] skew-x-[-30deg] bg-indigo-100 opacity-20 ring-1 ring-inset ring-white md:ml-20 lg:ml-36"
                    aria-hidden="true"
                  />
                  <CodeBlock
                    language="jsx"
                    filename="DummyComponent.jsx"
                    tabs={[
                      {
                        name: "DummyComponent.jsx",
                        code: DummyComponent,
                        language: "js",
                        highlightLines: [2, 3, 5, 6, 7],
                      },
                      {
                        name: "TimerComponent.jsx",
                        code: TimerComponent,
                        language: "js",
                        highlightLines: [5, 6, 7, 8, 9, 10],
                      },
                      {
                        name: "ToggleComponent.jsx",
                        code: ToggleComponent,
                        language: "js",
                      },
                    ]}
                  />
                </div>
              </figure>
            </section>
          </div>
          <div className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t from-white sm:h-32" />
        </section>
      </motion.main>

      <CustomNotification
        isVisible={isWelcomeNotificationVisible}
        toggleNotificationVisibility={toggleNotificationVisibility}
      />
    </>
  );
}
