"use client"; // ✅ Mark this as a client component


import client from "@/lib/apolloClient";
import { ApolloProvider } from "@apollo/client";

interface ApolloWrapperProps {
  children: React.ReactNode;
}

const ApolloWrapper = ({ children }: ApolloWrapperProps) => {
return (
  <ApolloProvider client={client}>{children}</ApolloProvider>
) 

};

export default ApolloWrapper;
