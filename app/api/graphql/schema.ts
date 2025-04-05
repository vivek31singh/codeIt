import gql from "graphql-tag";


export const typeDefs = gql`


type UserResponse {
    id: String!
    email: String!
    profileImg: String!
    fullName: String!
    message:  String
}

type RunCodeOutput {
  output: String
  error: String
}


type Query {
    Users: [UserResponse]
}

type Mutation {
  createUser(email: String!, fullName: String, profileImg: String): UserResponse
  runCode(id: String!,language: String!,code: String!): RunCodeOutput
}
`;

