"use client";

import { useSidebarOption } from "@/lib/store/useSideBarOption";
import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { motion } from "motion/react";
import { Chart } from "@/components/reusable/Chart";

interface Assignment {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  status: string;
}

export default function Page() {
  const { isSidebarOpen } = useSidebarOption();

  const recentAssignments: Assignment[] = [
    {
      id: 1,
      title: "Introduction to Programming",
      description: "Complete the first 4 chapters of the book",
      dueDate: "2023-09-27",
      status: "In Progress",
    },
    {
      id: 2,
      title: "Data Analysis",
      description: "Create a data visualization using matplotlib",
      dueDate: "2023-10-04",
      status: "Not Started",
    },
    {
      id: 3,
      title: "Algorithms",
      description: "Write a sorting algorithm using Python",
      dueDate: "2023-10-11",
      status: "Completed",
    },
    {
      id: 4,
      title: "Statistics",
      description: "Complete the quiz on Descriptive Statistics",
      dueDate: "2023-10-18",
      status: "Not Started",
    },
    {
      id: 5,
      title: "Machine Learning Basics",
      description: "Study the basics of machine learning algorithms",
      dueDate: "2023-10-25",
      status: "In Progress",
    },
    {
      id: 6,
      title: "Web Development",
      description: "Build a simple website using HTML, CSS, and JavaScript",
      dueDate: "2023-11-01",
      status: "Not Started",
    },
    {
      id: 7,
      title: "Database Management",
      description: "Design and implement a database using SQL",
      dueDate: "2023-11-08",
      status: "Not Started",
    },
    {
      id: 8,
      title: "Cybersecurity",
      description: "Learn the basics of network security and encryption",
      dueDate: "2023-11-15",
      status: "In Progress",
    },
  ];

  const recentQuizes: Pick<
    Assignment,
    "id" | "title" | "description" | "dueDate" | "status"
  >[] = [
    {
      id: 1,
      title: "Introduction to Programming Quiz",
      description: "Complete the quiz on the first 4 chapters of the book",
      dueDate: "2023-09-27",
      status: "In Progress",
    },
    {
      id: 2,
      title: "Data Analysis Quiz",
      description: "Create a quiz on data visualization using matplotlib",
      dueDate: "2023-10-04",
      status: "Not Started",
    },
    {
      id: 3,
      title: "Algorithms Quiz",
      description: "Complete the quiz on sorting algorithms using Python",
      dueDate: "2023-10-11",
      status: "Completed",
    },
    {
      id: 4,
      title: "Statistics Quiz",
      description: "Complete the quiz on Descriptive Statistics",
      dueDate: "2023-10-18",
      status: "Not Started",
    },
    {
      id: 5,
      title: "Machine Learning Basics Quiz",
      description: "Complete the quiz on basics of machine learning algorithms",
      dueDate: "2023-10-25",
      status: "In Progress",
    },
    {
      id: 6,
      title: "Web Development Quiz",
      description: "Complete the quiz on building a simple website",
      dueDate: "2023-11-01",
      status: "Not Started",
    },
    {
      id: 7,
      title: "Database Management Quiz",
      description: "Complete the quiz on designing and implementing a database",
      dueDate: "2023-11-08",
      status: "Not Started",
    },
    {
      id: 8,
      title: "Cybersecurity Quiz",
      description: "Complete the quiz on network security and encryption",
      dueDate: "2023-11-15",
      status: "In Progress",
    },
  ];

  const AssignmentCard = ({
    id,
    title,
    description,
    dueDate,
    status,
  }: Assignment) => {
    return (
      <>
      <TooltipProvider>
     <Tooltip>
       <TooltipTrigger asChild>
     <div
       className="bg-white rounded-lg shadow-md p-4 h-40 min-w-72 flex flex-col justify-between cursor-pointer"
       key={id}
     >
       <div className="flex items-center justify-between">
         <h3 className="text-lg font-sans font-semibold truncate w-1/2">{title}</h3>
         <p className="text-xs text-gray-600 font-sans">{status}</p>
       </div>
       <p className="mt-2 text-gray-600 font-sans">{description}</p>
       <div className="mt-4 flex items-center border-t border-gray-200 pt-4">
         <p className="text-xs text-gray-600 font-sans mr-2">Due Date:</p>
         <p className="text-xs text-gray-600 font-sans">{dueDate}</p>
       </div>
     </div>
     </TooltipTrigger>
       <TooltipContent className="bg-gray-100 space-y-4">
         <p className="text-lg font-sans font-semibold text-black">{title}</p>
         <p className="text-xs font-sans text-black">{description}</p>
       </TooltipContent>
     </Tooltip>
   </TooltipProvider>
       </>
    );
  };

  const QuizCard = ({
    id,
    title,
    description,
    dueDate,
    status,
  }: Pick<
    Assignment,
    "id" | "title" | "description" | "dueDate" | "status"
  >) => {
    return (
      <>
       <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
      <div
        className="bg-white rounded-lg shadow-md p-4 h-40 min-w-72 flex flex-col justify-between cursor-pointer"
        key={id}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-sans font-semibold truncate w-1/2">{title}</h3>
          <p className="text-xs text-gray-600 font-sans">{status}</p>
        </div>
        <p className="mt-2 text-gray-600 font-sans">{description}</p>
        <div className="mt-4 flex items-center border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-600 font-sans mr-2">Due Date:</p>
          <p className="text-xs text-gray-600 font-sans">{dueDate}</p>
        </div>
      </div>
      </TooltipTrigger>
        <TooltipContent className="bg-gray-100 space-y-4">
          <p className="text-lg font-sans font-semibold text-black">{title}</p>
          <p className="text-xs font-sans text-black">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
        </>
    );
  };

  return (
    <motion.main
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`bg-white w-full tranistion ease duration-300 ml-0 overflow-hidden ${
        isSidebarOpen ? "lg:ml-72" : "lg:ml-[155px]"
      }`}
    >
      <div className="w-full flex flex-col bg-gray-200 items-center justify-between py-12 px-8 space-y-24">
        <div className="flex items-center justify-start w-full">
          <h1 className="text-4xl font-semibold">Dashboard</h1>
        </div>

        <div className="flex flex-col items-start w-full space-y-12">
          <h2 className="text-2xl font-semibold">Recent Assignments</h2>
          <div className="flex  items-center space-x-2 w-full overflow-y-hidden overflow-x-scroll scrollbar-hidden">
            {recentAssignments.length > 0 &&
              recentAssignments.map((assignment) => (
                <AssignmentCard
                key={assignment.id}
                id={assignment.id}
                title={assignment.title}
                description={assignment.description}
                dueDate={assignment.dueDate}
                status={assignment.status}
                />
              ))}
          </div>
        </div>

        <div className="w-full h-96 flex flex-col items-start justify-center space-y-12">

          <h2 className="text-2xl font-semibold">Analytics</h2>
          <div className="w-full">
<Chart />
          </div>
        </div>

        <div className="flex flex-col items-start w-full space-y-12">
          <h2 className="text-2xl font-semibold">Recent Quizes</h2>
          <div className="flex  items-center space-x-2 w-full overflow-y-hidden overflow-x-scroll scrollbar-hidden">
            {recentQuizes.length > 0 &&
              recentQuizes.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  id={quiz.id}
                  title={quiz.title}
                  description={quiz.description}
                  dueDate={quiz.dueDate}
                  status={quiz.status}
                />
              ))}
          </div>
        </div>
      </div>
    </motion.main>
  );
}
