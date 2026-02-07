export const PRISMA_QUERY = `
; Detect Prisma Client usage
(call_expression
  function: (member_expression
    object: (member_expression
      object: (identifier) @prisma_client
      property: (property_identifier) @model)
    property: (property_identifier) @method)
  (#eq? @prisma_client "prisma")
  (#match? @method "^(findMany|findUnique|findFirst|create|update|delete|upsert|count|createMany|updateMany|deleteMany)$")) @prisma.operation

; Prisma transactions
(call_expression
  function: (member_expression
    object: (identifier) @prisma_client
    property: (property_identifier) @transaction)
  (#eq? @prisma_client "prisma")
  (#eq? @transaction "$transaction")) @prisma.transaction

; Prisma raw queries
(call_expression
  function: (member_expression
    object: (identifier) @prisma_client
    property: (property_identifier) @raw)
  (#eq? @prisma_client "prisma")
  (#match? @raw "^\\$(queryRaw|executeRaw)$")) @prisma.raw

; PrismaClient instantiation
(new_expression
  constructor: (identifier) @constructor
  (#eq? @constructor "PrismaClient")) @prisma.constructor

; Prisma imports
(import_clause
  (named_imports
    (import_specifier
      name: (identifier) @import_name
      (#eq? @import_name "PrismaClient")))) @prisma.import
`;

export const TYPEORM_QUERY = `
; TypeORM Entity decorator
(decorator
  (call_expression
    function: (identifier) @decorator_name
    (#eq? @decorator_name "Entity"))) @typeorm.entity

; TypeORM Column decorator
(decorator
  (call_expression
    function: (identifier) @decorator_name
    (#match? @decorator_name "^(Column|PrimaryGeneratedColumn|PrimaryColumn|CreateDateColumn|UpdateDateColumn)$"))) @typeorm.column

; TypeORM Relationship decorators
(decorator
  (call_expression
    function: (identifier) @decorator_name
    (#match? @decorator_name "^(OneToOne|OneToMany|ManyToOne|ManyToMany)$"))) @typeorm.relation

; getRepository calls
(call_expression
  function: (identifier) @function_name
  (#eq? @function_name "getRepository")) @typeorm.repository

; createQueryBuilder calls
(call_expression
  function: (member_expression
    property: (property_identifier) @method)
  (#eq? @method "createQueryBuilder")) @typeorm.querybuilder

; TypeORM imports
(import_clause
  (named_imports
    (import_specifier
      name: (identifier) @import_name
      (#match? @import_name "^(Entity|Column|Repository|getRepository|DataSource)$")))) @typeorm.import
`;

export const MONGOOSE_QUERY = `
; Mongoose model definition
(call_expression
  function: (member_expression
    object: (identifier) @mongoose
    property: (property_identifier) @method)
  (#eq? @mongoose "mongoose")
  (#eq? @method "model")) @mongoose.model

; Mongoose Schema
(new_expression
  constructor: (identifier) @constructor
  (#eq? @constructor "Schema")) @mongoose.schema

; Mongoose query methods
(call_expression
  function: (member_expression
    property: (property_identifier) @method)
  (#match? @method "^(find|findOne|findById|create|updateOne|updateMany|deleteOne|deleteMany|aggregate|populate)$")) @mongoose.query

; Mongoose connection
(call_expression
  function: (member_expression
    object: (identifier) @mongoose
    property: (property_identifier) @method)
  (#eq? @mongoose "mongoose")
  (#eq? @method "connect")) @mongoose.connect

; Mongoose imports
(import_clause
  (named_imports
    (import_specifier
      name: (identifier) @import_name
      (#match? @import_name "^(Schema|Model|Document|mongoose)$")))) @mongoose.import
`;

export const SEQUELIZE_QUERY = `
; Sequelize instantiation
(new_expression
  constructor: (identifier) @constructor
  (#eq? @constructor "Sequelize")) @sequelize.constructor

; Model definition
(call_expression
  function: (member_expression
    object: (identifier) @sequelize
    property: (property_identifier) @method)
  (#eq? @method "define")) @sequelize.define

; Sequelize associations
(call_expression
  function: (member_expression
    property: (property_identifier) @method)
  (#match? @method "^(hasMany|hasOne|belongsTo|belongsToMany)$")) @sequelize.association

; Sequelize imports
(import_clause
  (named_imports
    (import_specifier
      name: (identifier) @import_name
      (#match? @import_name "^(Sequelize|Model|DataTypes)$")))) @sequelize.import
`;

export const DRIZZLE_QUERY = `
; Drizzle table definitions
(call_expression
  function: (identifier) @function_name
  (#match? @function_name "^(pgTable|mysqlTable|sqliteTable)$")) @drizzle.table

; Drizzle function call
(call_expression
  function: (identifier) @function_name
  (#eq? @function_name "drizzle")) @drizzle.constructor

; Drizzle column types
(call_expression
  function: (identifier) @function_name
  (#match? @function_name "^(serial|text|varchar|integer|boolean|timestamp|json|uuid|pgEnum)$")) @drizzle.column

; Drizzle imports
(import_clause
  (named_imports
    (import_specifier
      name: (identifier) @import_name
      (#match? @import_name "^(drizzle|pgTable|mysqlTable|sqliteTable)$")))) @drizzle.import
`;

export const NESTJS_QUERY = `
; Controller decorator
(decorator
  (call_expression
    function: (identifier) @decorator_name
    (#eq? @decorator_name "Controller"))) @nestjs.controller

; Injectable decorator
(decorator
  (call_expression
    function: (identifier) @decorator_name
    (#eq? @decorator_name "Injectable"))) @nestjs.injectable

; Module decorator
(decorator
  (call_expression
    function: (identifier) @decorator_name
    (#eq? @decorator_name "Module"))) @nestjs.module

; HTTP method decorators
(decorator
  (call_expression
    function: (identifier) @decorator_name
    (#match? @decorator_name "^(Get|Post|Put|Delete|Patch|Options|Head)$"))) @nestjs.route

; Param decorators
(decorator
  (call_expression
    function: (identifier) @decorator_name
    (#match? @decorator_name "^(Body|Query|Param|Headers|Req|Res)$"))) @nestjs.param

; Guard/Interceptor decorators
(decorator
  (call_expression
    function: (identifier) @decorator_name
    (#match? @decorator_name "^(UseGuards|UseInterceptors|UsePipes)$"))) @nestjs.middleware

; NestJS imports
(import_clause
  (named_imports
    (import_specifier
      name: (identifier) @import_name
      (#match? @import_name "^(Controller|Injectable|Module|Get|Post|Body|Query)$")))) @nestjs.import
`;

export const REACT_QUERY = `
; useState hook
(call_expression
  function: (identifier) @hook_name
  (#eq? @hook_name "useState")) @react.usestate

; useEffect hook
(call_expression
  function: (identifier) @hook_name
  (#eq? @hook_name "useEffect")) @react.useeffect

; useCallback hook
(call_expression
  function: (identifier) @hook_name
  (#eq? @hook_name "useCallback")) @react.usecallback

; useMemo hook
(call_expression
  function: (identifier) @hook_name
  (#eq? @hook_name "useMemo")) @react.usememo

; useContext hook
(call_expression
  function: (identifier) @hook_name
  (#eq? @hook_name "useContext")) @react.usecontext

; useRef hook
(call_expression
  function: (identifier) @hook_name
  (#eq? @hook_name "useRef")) @react.useref

; useReducer hook
(call_expression
  function: (identifier) @hook_name
  (#eq? @hook_name "useReducer")) @react.usereducer

; React imports
(import_clause
  (named_imports
    (import_specifier
      name: (identifier) @import_name
      (#match? @import_name "^(useState|useEffect|useCallback|useMemo|useContext|useRef|Component)$")))) @react.import
`;

export const REACT_TSX_QUERY = `
; useState hook
(call_expression
  function: (identifier) @hook_name
  (#eq? @hook_name "useState")) @react.usestate

; useEffect hook
(call_expression
  function: (identifier) @hook_name
  (#eq? @hook_name "useEffect")) @react.useeffect

; useCallback hook
(call_expression
  function: (identifier) @hook_name
  (#eq? @hook_name "useCallback")) @react.usecallback

; useMemo hook
(call_expression
  function: (identifier) @hook_name
  (#eq? @hook_name "useMemo")) @react.usememo

; useContext hook
(call_expression
  function: (identifier) @hook_name
  (#eq? @hook_name "useContext")) @react.usecontext

; useRef hook
(call_expression
  function: (identifier) @hook_name
  (#eq? @hook_name "useRef")) @react.useref

; useReducer hook
(call_expression
  function: (identifier) @hook_name
  (#eq? @hook_name "useReducer")) @react.usereducer

; JSX elements (TSX specific)
(jsx_element) @react.jsx

; React imports
(import_clause
  (named_imports
    (import_specifier
      name: (identifier) @import_name
      (#match? @import_name "^(useState|useEffect|useCallback|useMemo|useContext|useRef|Component)$")))) @react.import
`;

export const EXPRESS_QUERY = `
; Express app creation
(call_expression
  function: (identifier) @function_name
  (#eq? @function_name "express")) @express.app

; Route methods
(call_expression
  function: (member_expression
    object: (identifier) @app
    property: (property_identifier) @method)
  (#match? @method "^(get|post|put|delete|patch|use|all)$")) @express.route

; Listen call
(call_expression
  function: (member_expression
    object: (identifier) @app
    property: (property_identifier) @method)
  (#eq? @method "listen")) @express.listen

; Middleware usage
(call_expression
  function: (member_expression
    object: (identifier) @app
    property: (property_identifier) @method)
  (#eq? @method "use")) @express.middleware

; Express Router
(call_expression
  function: (member_expression
    object: (identifier) @express
    property: (property_identifier) @router)
  (#eq? @express "express")
  (#eq? @router "Router")) @express.router

; Express imports (named imports)
(import_clause
  (named_imports
    (import_specifier
      name: (identifier) @import_name
      (#eq? @import_name "express")))) @express.import
`;

export const POSTGRESQL_QUERY = `
; pg.Pool instantiation
(new_expression
  constructor: (identifier) @constructor
  (#eq? @constructor "Pool")) @postgres.pool

; pg.Client instantiation
(new_expression
  constructor: (identifier) @constructor
  (#eq? @constructor "Client")) @postgres.client

; Pool from pg
(call_expression
  function: (member_expression
    object: (identifier) @pg
    property: (property_identifier) @pool)
  (#eq? @pg "pg")
  (#eq? @pool "Pool")) @postgres.pool_alt

; Query calls
(call_expression
  function: (member_expression
    object: (identifier)
    property: (property_identifier) @method)
  (#eq? @method "query")) @postgres.query

; pg imports
(import_clause
  (named_imports
    (import_specifier
      name: (identifier) @import_name
      (#match? @import_name "^(Pool|Client|QueryResult)$")))) @postgres.import
`;

export const MONGODB_QUERY = `
; MongoClient usage
(call_expression
  function: (member_expression
    object: (identifier) @mongo
    property: (property_identifier) @method)
  (#eq? @mongo "MongoClient")
  (#eq? @method "connect")) @mongodb.connect

; Collection operations
(call_expression
  function: (member_expression
    property: (property_identifier) @method)
  (#match? @method "^(insertOne|insertMany|find|findOne|updateOne|updateMany|deleteOne|deleteMany)$")) @mongodb.operation

; MongoDB imports
(import_clause
  (named_imports
    (import_specifier
      name: (identifier) @import_name
      (#match? @import_name "^(MongoClient|Db|Collection|ObjectId)$")))) @mongodb.import
`;

export const REDIS_QUERY = `
; createClient call
(call_expression
  function: (identifier) @function_name
  (#eq? @function_name "createClient")) @redis.client

; Redis constructor (ioredis)
(new_expression
  constructor: (identifier) @constructor
  (#eq? @constructor "Redis")) @redis.constructor

; Redis operations
(call_expression
  function: (member_expression
    property: (property_identifier) @method)
  (#match? @method "^(get|set|del|exists|expire|keys|hget|hset|lpush|rpush|sadd|zadd)$")) @redis.operation

; Redis imports
(import_clause
  (named_imports
    (import_specifier
      name: (identifier) @import_name
      (#match? @import_name "^(createClient|Redis)$")))) @redis.import
`;

export const MYSQL_QUERY = `
; mysql.createConnection
(call_expression
  function: (member_expression
    object: (identifier) @mysql
    property: (property_identifier) @method)
  (#match? @mysql "^(mysql|mysql2)$")
  (#match? @method "^(createConnection|createPool)$")) @mysql.connection

; Query calls
(call_expression
  function: (member_expression
    property: (property_identifier) @method)
  (#eq? @method "query")) @mysql.query

; MySQL imports (named imports)
(import_clause
  (named_imports
    (import_specifier
      name: (identifier) @import_name
      (#match? @import_name "^(mysql|mysql2)$")))) @mysql.import
`;
