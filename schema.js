const typeDefs = `
  type Book {
    title: String!
    published: Int
    author: Author!
    id: ID
    genres: [String!]
  }

  type Author {
    name: String!
    id: ID!
    born: Int
  }

  type AuthorDetail {
    name: String!
    bookCount: Int!
    born: Int
  }

  type User {
    username: String!
    favouriteGenre: String!
    id: ID!
  }
  
  type Token {
    value: String!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [AuthorDetail!]!
    me: User
  }

  type Mutation {
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String!]!
    ): Book
    editAuthor(
      name: String!
      setBornTo: Int
    ): AuthorDetail
    createUser(
      username: String!
      favouriteGenre: String!
    ): User
    login(
      username: String!
      password: String!
    ): Token
  }

  type Subscription{
    bookAdded: Book!
  }
`

module.exports = typeDefs