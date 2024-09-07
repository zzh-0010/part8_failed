const { UserInputError, AuthenticationError } = require('apollo-server')
const Book = require('./models/book')
const Author = require('./models/author')
const User = require('./models/user')
const _ = require('lodash')
const { PubSub } = require('graphql-subscriptions')
const pubsub = new PubSub()
const jwt = require('jsonwebtoken')

const JWT_SECRET = 'NEED_HERE_A_SECRET_KEY'

const resolvers = {
    Query: {
      bookCount: async() => Book.collection.countDocuments(),
      authorCount: async() => Author.collection.countDocuments(),
      allBooks: async(root, args, context) => {
        try{
          const books = await Book.find({}).populate('author', {name:1, id: 1})
          console.log('all books in backend', books)
          // console.log('args', args)
          if(!args.author && !args.genre){
            return books
          }
          if(args.author && !args.genre){
            const cleared = _.compact(books.map(book => book.author.name === args.author ? book : null))
            console.log('cleared',cleared)
            return cleared
          }
          if(args.genre){
            const genreBooks = _.compact(books.map(b => b.genres.includes(args.genre) ? b : null))
            console.log('genreBook',genreBooks)
            if(!args.author){
            return genreBooks
            }
            else{
              const genreAuthBook = _.compact(genreBooks.map(g => g.author.name === args.author ? g :null))
              console.log('genreAuth', genreAuthBook)
              return genreAuthBook
              }
            }
        }catch(error){
          console.log(error)
        }
  
      },
      allAuthors: async(root, args, context) => {
        try{
          const books = await Book.find({})
          const authors = await Author.find({})
          const groupedBooks = _.groupBy(books, 'author')
          //console.log(groupedBooks)
          const pairedBooks = _.toPairs(groupedBooks)
          console.log(pairedBooks[0][0])
          return pairedBooks.map(p => {
            const authorFind = authors.find(author => author.id === p[0])
            return ({name: authorFind.name, born: authorFind.born, bookCount: p[1].length})})
        }catch(error){
          console.log(error)
        }
      },
      me: (root, args, context) => {
        console.log('it is me', context)
        return context.currentUser
      }
    },
  
    Mutation: {
      addBook: async(root, args, context) => {
          const currentUser = context.currentUser

          if(!currentUser){
            throw new AuthenticationError('not authenticated')
          }
          //如果没有author则添加一下
          let author = await Author.findOne({name: args.author})
          if(!author){
            author = new Author({name: args.author})
            author.save()
          }

          const book = new Book({...args, author: author.id})
          console.log('mutat book',book)
          try{
            await book.save()
          }catch(error){
            throw new UserInputError(error.message, {
              invalidArgs: args
            })
          }
          pubsub.publish('BOOK_ADDED', {bookAdded: book})
          return Book.findById(book._id).populate('author')
      },
      editAuthor: async(root, args, context) => {
          console.log('editAuth', args)
          const authors = await Author.find({})
          const author = authors.find(a => a.name === args.name)
          if(!author){
              return null
          }
          return await Author.findOneAndUpdate({name: args.name}, {born: args.setBornTo}, {new: true})
      },
      createUser: async(root, args) => {
        const user = new User({...args})
        try{
          await user.save()
        }catch(error){
          throw new UserInputError(error.message, {
            invalidArgs: args
          })
        }
        return user
      },
      login: async(root, args) => {
        console.log('loging', args)
        const user = await User.findOne({username: args.username})
        if( !user || args.password !== 'secret' ){
          throw new UserInputError('wrong credentials')
        }
  
        const userForToken = {
          username: user.username,
          id: user._id
        }
        return {value: jwt.sign(userForToken, JWT_SECRET)}
      },
    },
    Subscription: {
      bookAdded: {
        subscribe: () => pubsub.asyncIterator(['BOOK_ADDED'])
      },
    },
  }


module.exports = resolvers