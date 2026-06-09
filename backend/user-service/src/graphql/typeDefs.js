/**
 * GraphQL type definitions for User & Auth Service.
 *
 * These are exported as a plain string so the GraphQL Gateway team
 * can import and merge them into the federated schema.
 *
 * Usage in Gateway:
 *   const { typeDefs } = require('user-auth-service/src/graphql/typeDefs');
 */

const typeDefs = `
  enum Role {
    mahasiswa
    dosen
    merchant
  }

  type User {
    id: Int!
    full_name: String!
    email: String!
    role: Role!
    phone: String
    nim_nip: String
    created_at: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type MessagePayload {
    message: String!
  }

  input RegisterInput {
    full_name: String!
    email: String!
    password: String!
    role: Role
    phone: String
    nim_nip: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input UpdateProfileInput {
    full_name: String!
    phone: String
    nim_nip: String
  }

  type Query {
    me: User!
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    updateProfile(input: UpdateProfileInput!): MessagePayload!
  }
`;

module.exports = { typeDefs };
