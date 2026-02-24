
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model WalletOwner
 * 
 */
export type WalletOwner = $Result.DefaultSelection<Prisma.$WalletOwnerPayload>
/**
 * Model Swap
 * 
 */
export type Swap = $Result.DefaultSelection<Prisma.$SwapPayload>
/**
 * Model SwapError
 * 
 */
export type SwapError = $Result.DefaultSelection<Prisma.$SwapErrorPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more WalletOwners
 * const walletOwners = await prisma.walletOwner.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more WalletOwners
   * const walletOwners = await prisma.walletOwner.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.walletOwner`: Exposes CRUD operations for the **WalletOwner** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more WalletOwners
    * const walletOwners = await prisma.walletOwner.findMany()
    * ```
    */
  get walletOwner(): Prisma.WalletOwnerDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.swap`: Exposes CRUD operations for the **Swap** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Swaps
    * const swaps = await prisma.swap.findMany()
    * ```
    */
  get swap(): Prisma.SwapDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.swapError`: Exposes CRUD operations for the **SwapError** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SwapErrors
    * const swapErrors = await prisma.swapError.findMany()
    * ```
    */
  get swapError(): Prisma.SwapErrorDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.19.2
   * Query Engine version: c2990dca591cba766e3b7ef5d9e8a84796e47ab7
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    WalletOwner: 'WalletOwner',
    Swap: 'Swap',
    SwapError: 'SwapError'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "walletOwner" | "swap" | "swapError"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      WalletOwner: {
        payload: Prisma.$WalletOwnerPayload<ExtArgs>
        fields: Prisma.WalletOwnerFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WalletOwnerFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletOwnerPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WalletOwnerFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletOwnerPayload>
          }
          findFirst: {
            args: Prisma.WalletOwnerFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletOwnerPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WalletOwnerFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletOwnerPayload>
          }
          findMany: {
            args: Prisma.WalletOwnerFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletOwnerPayload>[]
          }
          create: {
            args: Prisma.WalletOwnerCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletOwnerPayload>
          }
          createMany: {
            args: Prisma.WalletOwnerCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WalletOwnerCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletOwnerPayload>[]
          }
          delete: {
            args: Prisma.WalletOwnerDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletOwnerPayload>
          }
          update: {
            args: Prisma.WalletOwnerUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletOwnerPayload>
          }
          deleteMany: {
            args: Prisma.WalletOwnerDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WalletOwnerUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.WalletOwnerUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletOwnerPayload>[]
          }
          upsert: {
            args: Prisma.WalletOwnerUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletOwnerPayload>
          }
          aggregate: {
            args: Prisma.WalletOwnerAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWalletOwner>
          }
          groupBy: {
            args: Prisma.WalletOwnerGroupByArgs<ExtArgs>
            result: $Utils.Optional<WalletOwnerGroupByOutputType>[]
          }
          count: {
            args: Prisma.WalletOwnerCountArgs<ExtArgs>
            result: $Utils.Optional<WalletOwnerCountAggregateOutputType> | number
          }
        }
      }
      Swap: {
        payload: Prisma.$SwapPayload<ExtArgs>
        fields: Prisma.SwapFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SwapFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SwapPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SwapFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SwapPayload>
          }
          findFirst: {
            args: Prisma.SwapFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SwapPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SwapFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SwapPayload>
          }
          findMany: {
            args: Prisma.SwapFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SwapPayload>[]
          }
          create: {
            args: Prisma.SwapCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SwapPayload>
          }
          createMany: {
            args: Prisma.SwapCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SwapCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SwapPayload>[]
          }
          delete: {
            args: Prisma.SwapDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SwapPayload>
          }
          update: {
            args: Prisma.SwapUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SwapPayload>
          }
          deleteMany: {
            args: Prisma.SwapDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SwapUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SwapUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SwapPayload>[]
          }
          upsert: {
            args: Prisma.SwapUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SwapPayload>
          }
          aggregate: {
            args: Prisma.SwapAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSwap>
          }
          groupBy: {
            args: Prisma.SwapGroupByArgs<ExtArgs>
            result: $Utils.Optional<SwapGroupByOutputType>[]
          }
          count: {
            args: Prisma.SwapCountArgs<ExtArgs>
            result: $Utils.Optional<SwapCountAggregateOutputType> | number
          }
        }
      }
      SwapError: {
        payload: Prisma.$SwapErrorPayload<ExtArgs>
        fields: Prisma.SwapErrorFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SwapErrorFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SwapErrorPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SwapErrorFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SwapErrorPayload>
          }
          findFirst: {
            args: Prisma.SwapErrorFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SwapErrorPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SwapErrorFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SwapErrorPayload>
          }
          findMany: {
            args: Prisma.SwapErrorFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SwapErrorPayload>[]
          }
          create: {
            args: Prisma.SwapErrorCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SwapErrorPayload>
          }
          createMany: {
            args: Prisma.SwapErrorCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SwapErrorCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SwapErrorPayload>[]
          }
          delete: {
            args: Prisma.SwapErrorDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SwapErrorPayload>
          }
          update: {
            args: Prisma.SwapErrorUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SwapErrorPayload>
          }
          deleteMany: {
            args: Prisma.SwapErrorDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SwapErrorUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SwapErrorUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SwapErrorPayload>[]
          }
          upsert: {
            args: Prisma.SwapErrorUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SwapErrorPayload>
          }
          aggregate: {
            args: Prisma.SwapErrorAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSwapError>
          }
          groupBy: {
            args: Prisma.SwapErrorGroupByArgs<ExtArgs>
            result: $Utils.Optional<SwapErrorGroupByOutputType>[]
          }
          count: {
            args: Prisma.SwapErrorCountArgs<ExtArgs>
            result: $Utils.Optional<SwapErrorCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    walletOwner?: WalletOwnerOmit
    swap?: SwapOmit
    swapError?: SwapErrorOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type WalletOwnerCountOutputType
   */

  export type WalletOwnerCountOutputType = {
    swaps: number
    errors: number
  }

  export type WalletOwnerCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    swaps?: boolean | WalletOwnerCountOutputTypeCountSwapsArgs
    errors?: boolean | WalletOwnerCountOutputTypeCountErrorsArgs
  }

  // Custom InputTypes
  /**
   * WalletOwnerCountOutputType without action
   */
  export type WalletOwnerCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WalletOwnerCountOutputType
     */
    select?: WalletOwnerCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * WalletOwnerCountOutputType without action
   */
  export type WalletOwnerCountOutputTypeCountSwapsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SwapWhereInput
  }

  /**
   * WalletOwnerCountOutputType without action
   */
  export type WalletOwnerCountOutputTypeCountErrorsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SwapErrorWhereInput
  }


  /**
   * Models
   */

  /**
   * Model WalletOwner
   */

  export type AggregateWalletOwner = {
    _count: WalletOwnerCountAggregateOutputType | null
    _avg: WalletOwnerAvgAggregateOutputType | null
    _sum: WalletOwnerSumAggregateOutputType | null
    _min: WalletOwnerMinAggregateOutputType | null
    _max: WalletOwnerMaxAggregateOutputType | null
  }

  export type WalletOwnerAvgAggregateOutputType = {
    dailySwaps: number | null
    weeklySwaps: number | null
    monthlySwaps: number | null
    yearlySwaps: number | null
  }

  export type WalletOwnerSumAggregateOutputType = {
    dailySwaps: number | null
    weeklySwaps: number | null
    monthlySwaps: number | null
    yearlySwaps: number | null
  }

  export type WalletOwnerMinAggregateOutputType = {
    id: string | null
    walletAddress: string | null
    appConnectionId: string | null
    appConnectionDescription: string | null
    dailySwaps: number | null
    weeklySwaps: number | null
    monthlySwaps: number | null
    yearlySwaps: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type WalletOwnerMaxAggregateOutputType = {
    id: string | null
    walletAddress: string | null
    appConnectionId: string | null
    appConnectionDescription: string | null
    dailySwaps: number | null
    weeklySwaps: number | null
    monthlySwaps: number | null
    yearlySwaps: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type WalletOwnerCountAggregateOutputType = {
    id: number
    walletAddress: number
    appConnectionId: number
    appConnectionDescription: number
    dailySwaps: number
    weeklySwaps: number
    monthlySwaps: number
    yearlySwaps: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type WalletOwnerAvgAggregateInputType = {
    dailySwaps?: true
    weeklySwaps?: true
    monthlySwaps?: true
    yearlySwaps?: true
  }

  export type WalletOwnerSumAggregateInputType = {
    dailySwaps?: true
    weeklySwaps?: true
    monthlySwaps?: true
    yearlySwaps?: true
  }

  export type WalletOwnerMinAggregateInputType = {
    id?: true
    walletAddress?: true
    appConnectionId?: true
    appConnectionDescription?: true
    dailySwaps?: true
    weeklySwaps?: true
    monthlySwaps?: true
    yearlySwaps?: true
    createdAt?: true
    updatedAt?: true
  }

  export type WalletOwnerMaxAggregateInputType = {
    id?: true
    walletAddress?: true
    appConnectionId?: true
    appConnectionDescription?: true
    dailySwaps?: true
    weeklySwaps?: true
    monthlySwaps?: true
    yearlySwaps?: true
    createdAt?: true
    updatedAt?: true
  }

  export type WalletOwnerCountAggregateInputType = {
    id?: true
    walletAddress?: true
    appConnectionId?: true
    appConnectionDescription?: true
    dailySwaps?: true
    weeklySwaps?: true
    monthlySwaps?: true
    yearlySwaps?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type WalletOwnerAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WalletOwner to aggregate.
     */
    where?: WalletOwnerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WalletOwners to fetch.
     */
    orderBy?: WalletOwnerOrderByWithRelationInput | WalletOwnerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WalletOwnerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WalletOwners from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WalletOwners.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned WalletOwners
    **/
    _count?: true | WalletOwnerCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: WalletOwnerAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: WalletOwnerSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WalletOwnerMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WalletOwnerMaxAggregateInputType
  }

  export type GetWalletOwnerAggregateType<T extends WalletOwnerAggregateArgs> = {
        [P in keyof T & keyof AggregateWalletOwner]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWalletOwner[P]>
      : GetScalarType<T[P], AggregateWalletOwner[P]>
  }




  export type WalletOwnerGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WalletOwnerWhereInput
    orderBy?: WalletOwnerOrderByWithAggregationInput | WalletOwnerOrderByWithAggregationInput[]
    by: WalletOwnerScalarFieldEnum[] | WalletOwnerScalarFieldEnum
    having?: WalletOwnerScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WalletOwnerCountAggregateInputType | true
    _avg?: WalletOwnerAvgAggregateInputType
    _sum?: WalletOwnerSumAggregateInputType
    _min?: WalletOwnerMinAggregateInputType
    _max?: WalletOwnerMaxAggregateInputType
  }

  export type WalletOwnerGroupByOutputType = {
    id: string
    walletAddress: string
    appConnectionId: string | null
    appConnectionDescription: string | null
    dailySwaps: number
    weeklySwaps: number
    monthlySwaps: number
    yearlySwaps: number
    createdAt: Date
    updatedAt: Date
    _count: WalletOwnerCountAggregateOutputType | null
    _avg: WalletOwnerAvgAggregateOutputType | null
    _sum: WalletOwnerSumAggregateOutputType | null
    _min: WalletOwnerMinAggregateOutputType | null
    _max: WalletOwnerMaxAggregateOutputType | null
  }

  type GetWalletOwnerGroupByPayload<T extends WalletOwnerGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WalletOwnerGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WalletOwnerGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WalletOwnerGroupByOutputType[P]>
            : GetScalarType<T[P], WalletOwnerGroupByOutputType[P]>
        }
      >
    >


  export type WalletOwnerSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    walletAddress?: boolean
    appConnectionId?: boolean
    appConnectionDescription?: boolean
    dailySwaps?: boolean
    weeklySwaps?: boolean
    monthlySwaps?: boolean
    yearlySwaps?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    swaps?: boolean | WalletOwner$swapsArgs<ExtArgs>
    errors?: boolean | WalletOwner$errorsArgs<ExtArgs>
    _count?: boolean | WalletOwnerCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["walletOwner"]>

  export type WalletOwnerSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    walletAddress?: boolean
    appConnectionId?: boolean
    appConnectionDescription?: boolean
    dailySwaps?: boolean
    weeklySwaps?: boolean
    monthlySwaps?: boolean
    yearlySwaps?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["walletOwner"]>

  export type WalletOwnerSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    walletAddress?: boolean
    appConnectionId?: boolean
    appConnectionDescription?: boolean
    dailySwaps?: boolean
    weeklySwaps?: boolean
    monthlySwaps?: boolean
    yearlySwaps?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["walletOwner"]>

  export type WalletOwnerSelectScalar = {
    id?: boolean
    walletAddress?: boolean
    appConnectionId?: boolean
    appConnectionDescription?: boolean
    dailySwaps?: boolean
    weeklySwaps?: boolean
    monthlySwaps?: boolean
    yearlySwaps?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type WalletOwnerOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "walletAddress" | "appConnectionId" | "appConnectionDescription" | "dailySwaps" | "weeklySwaps" | "monthlySwaps" | "yearlySwaps" | "createdAt" | "updatedAt", ExtArgs["result"]["walletOwner"]>
  export type WalletOwnerInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    swaps?: boolean | WalletOwner$swapsArgs<ExtArgs>
    errors?: boolean | WalletOwner$errorsArgs<ExtArgs>
    _count?: boolean | WalletOwnerCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type WalletOwnerIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type WalletOwnerIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $WalletOwnerPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "WalletOwner"
    objects: {
      swaps: Prisma.$SwapPayload<ExtArgs>[]
      errors: Prisma.$SwapErrorPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      walletAddress: string
      appConnectionId: string | null
      appConnectionDescription: string | null
      dailySwaps: number
      weeklySwaps: number
      monthlySwaps: number
      yearlySwaps: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["walletOwner"]>
    composites: {}
  }

  type WalletOwnerGetPayload<S extends boolean | null | undefined | WalletOwnerDefaultArgs> = $Result.GetResult<Prisma.$WalletOwnerPayload, S>

  type WalletOwnerCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<WalletOwnerFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: WalletOwnerCountAggregateInputType | true
    }

  export interface WalletOwnerDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['WalletOwner'], meta: { name: 'WalletOwner' } }
    /**
     * Find zero or one WalletOwner that matches the filter.
     * @param {WalletOwnerFindUniqueArgs} args - Arguments to find a WalletOwner
     * @example
     * // Get one WalletOwner
     * const walletOwner = await prisma.walletOwner.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WalletOwnerFindUniqueArgs>(args: SelectSubset<T, WalletOwnerFindUniqueArgs<ExtArgs>>): Prisma__WalletOwnerClient<$Result.GetResult<Prisma.$WalletOwnerPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one WalletOwner that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {WalletOwnerFindUniqueOrThrowArgs} args - Arguments to find a WalletOwner
     * @example
     * // Get one WalletOwner
     * const walletOwner = await prisma.walletOwner.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WalletOwnerFindUniqueOrThrowArgs>(args: SelectSubset<T, WalletOwnerFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WalletOwnerClient<$Result.GetResult<Prisma.$WalletOwnerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WalletOwner that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletOwnerFindFirstArgs} args - Arguments to find a WalletOwner
     * @example
     * // Get one WalletOwner
     * const walletOwner = await prisma.walletOwner.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WalletOwnerFindFirstArgs>(args?: SelectSubset<T, WalletOwnerFindFirstArgs<ExtArgs>>): Prisma__WalletOwnerClient<$Result.GetResult<Prisma.$WalletOwnerPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WalletOwner that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletOwnerFindFirstOrThrowArgs} args - Arguments to find a WalletOwner
     * @example
     * // Get one WalletOwner
     * const walletOwner = await prisma.walletOwner.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WalletOwnerFindFirstOrThrowArgs>(args?: SelectSubset<T, WalletOwnerFindFirstOrThrowArgs<ExtArgs>>): Prisma__WalletOwnerClient<$Result.GetResult<Prisma.$WalletOwnerPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more WalletOwners that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletOwnerFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all WalletOwners
     * const walletOwners = await prisma.walletOwner.findMany()
     * 
     * // Get first 10 WalletOwners
     * const walletOwners = await prisma.walletOwner.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const walletOwnerWithIdOnly = await prisma.walletOwner.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WalletOwnerFindManyArgs>(args?: SelectSubset<T, WalletOwnerFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WalletOwnerPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a WalletOwner.
     * @param {WalletOwnerCreateArgs} args - Arguments to create a WalletOwner.
     * @example
     * // Create one WalletOwner
     * const WalletOwner = await prisma.walletOwner.create({
     *   data: {
     *     // ... data to create a WalletOwner
     *   }
     * })
     * 
     */
    create<T extends WalletOwnerCreateArgs>(args: SelectSubset<T, WalletOwnerCreateArgs<ExtArgs>>): Prisma__WalletOwnerClient<$Result.GetResult<Prisma.$WalletOwnerPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many WalletOwners.
     * @param {WalletOwnerCreateManyArgs} args - Arguments to create many WalletOwners.
     * @example
     * // Create many WalletOwners
     * const walletOwner = await prisma.walletOwner.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WalletOwnerCreateManyArgs>(args?: SelectSubset<T, WalletOwnerCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many WalletOwners and returns the data saved in the database.
     * @param {WalletOwnerCreateManyAndReturnArgs} args - Arguments to create many WalletOwners.
     * @example
     * // Create many WalletOwners
     * const walletOwner = await prisma.walletOwner.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many WalletOwners and only return the `id`
     * const walletOwnerWithIdOnly = await prisma.walletOwner.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WalletOwnerCreateManyAndReturnArgs>(args?: SelectSubset<T, WalletOwnerCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WalletOwnerPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a WalletOwner.
     * @param {WalletOwnerDeleteArgs} args - Arguments to delete one WalletOwner.
     * @example
     * // Delete one WalletOwner
     * const WalletOwner = await prisma.walletOwner.delete({
     *   where: {
     *     // ... filter to delete one WalletOwner
     *   }
     * })
     * 
     */
    delete<T extends WalletOwnerDeleteArgs>(args: SelectSubset<T, WalletOwnerDeleteArgs<ExtArgs>>): Prisma__WalletOwnerClient<$Result.GetResult<Prisma.$WalletOwnerPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one WalletOwner.
     * @param {WalletOwnerUpdateArgs} args - Arguments to update one WalletOwner.
     * @example
     * // Update one WalletOwner
     * const walletOwner = await prisma.walletOwner.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WalletOwnerUpdateArgs>(args: SelectSubset<T, WalletOwnerUpdateArgs<ExtArgs>>): Prisma__WalletOwnerClient<$Result.GetResult<Prisma.$WalletOwnerPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more WalletOwners.
     * @param {WalletOwnerDeleteManyArgs} args - Arguments to filter WalletOwners to delete.
     * @example
     * // Delete a few WalletOwners
     * const { count } = await prisma.walletOwner.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WalletOwnerDeleteManyArgs>(args?: SelectSubset<T, WalletOwnerDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WalletOwners.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletOwnerUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many WalletOwners
     * const walletOwner = await prisma.walletOwner.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WalletOwnerUpdateManyArgs>(args: SelectSubset<T, WalletOwnerUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WalletOwners and returns the data updated in the database.
     * @param {WalletOwnerUpdateManyAndReturnArgs} args - Arguments to update many WalletOwners.
     * @example
     * // Update many WalletOwners
     * const walletOwner = await prisma.walletOwner.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more WalletOwners and only return the `id`
     * const walletOwnerWithIdOnly = await prisma.walletOwner.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends WalletOwnerUpdateManyAndReturnArgs>(args: SelectSubset<T, WalletOwnerUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WalletOwnerPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one WalletOwner.
     * @param {WalletOwnerUpsertArgs} args - Arguments to update or create a WalletOwner.
     * @example
     * // Update or create a WalletOwner
     * const walletOwner = await prisma.walletOwner.upsert({
     *   create: {
     *     // ... data to create a WalletOwner
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the WalletOwner we want to update
     *   }
     * })
     */
    upsert<T extends WalletOwnerUpsertArgs>(args: SelectSubset<T, WalletOwnerUpsertArgs<ExtArgs>>): Prisma__WalletOwnerClient<$Result.GetResult<Prisma.$WalletOwnerPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of WalletOwners.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletOwnerCountArgs} args - Arguments to filter WalletOwners to count.
     * @example
     * // Count the number of WalletOwners
     * const count = await prisma.walletOwner.count({
     *   where: {
     *     // ... the filter for the WalletOwners we want to count
     *   }
     * })
    **/
    count<T extends WalletOwnerCountArgs>(
      args?: Subset<T, WalletOwnerCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WalletOwnerCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a WalletOwner.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletOwnerAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WalletOwnerAggregateArgs>(args: Subset<T, WalletOwnerAggregateArgs>): Prisma.PrismaPromise<GetWalletOwnerAggregateType<T>>

    /**
     * Group by WalletOwner.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletOwnerGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends WalletOwnerGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WalletOwnerGroupByArgs['orderBy'] }
        : { orderBy?: WalletOwnerGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, WalletOwnerGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWalletOwnerGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the WalletOwner model
   */
  readonly fields: WalletOwnerFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for WalletOwner.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WalletOwnerClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    swaps<T extends WalletOwner$swapsArgs<ExtArgs> = {}>(args?: Subset<T, WalletOwner$swapsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SwapPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    errors<T extends WalletOwner$errorsArgs<ExtArgs> = {}>(args?: Subset<T, WalletOwner$errorsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SwapErrorPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the WalletOwner model
   */
  interface WalletOwnerFieldRefs {
    readonly id: FieldRef<"WalletOwner", 'String'>
    readonly walletAddress: FieldRef<"WalletOwner", 'String'>
    readonly appConnectionId: FieldRef<"WalletOwner", 'String'>
    readonly appConnectionDescription: FieldRef<"WalletOwner", 'String'>
    readonly dailySwaps: FieldRef<"WalletOwner", 'Int'>
    readonly weeklySwaps: FieldRef<"WalletOwner", 'Int'>
    readonly monthlySwaps: FieldRef<"WalletOwner", 'Int'>
    readonly yearlySwaps: FieldRef<"WalletOwner", 'Int'>
    readonly createdAt: FieldRef<"WalletOwner", 'DateTime'>
    readonly updatedAt: FieldRef<"WalletOwner", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * WalletOwner findUnique
   */
  export type WalletOwnerFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WalletOwner
     */
    select?: WalletOwnerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WalletOwner
     */
    omit?: WalletOwnerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletOwnerInclude<ExtArgs> | null
    /**
     * Filter, which WalletOwner to fetch.
     */
    where: WalletOwnerWhereUniqueInput
  }

  /**
   * WalletOwner findUniqueOrThrow
   */
  export type WalletOwnerFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WalletOwner
     */
    select?: WalletOwnerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WalletOwner
     */
    omit?: WalletOwnerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletOwnerInclude<ExtArgs> | null
    /**
     * Filter, which WalletOwner to fetch.
     */
    where: WalletOwnerWhereUniqueInput
  }

  /**
   * WalletOwner findFirst
   */
  export type WalletOwnerFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WalletOwner
     */
    select?: WalletOwnerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WalletOwner
     */
    omit?: WalletOwnerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletOwnerInclude<ExtArgs> | null
    /**
     * Filter, which WalletOwner to fetch.
     */
    where?: WalletOwnerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WalletOwners to fetch.
     */
    orderBy?: WalletOwnerOrderByWithRelationInput | WalletOwnerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WalletOwners.
     */
    cursor?: WalletOwnerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WalletOwners from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WalletOwners.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WalletOwners.
     */
    distinct?: WalletOwnerScalarFieldEnum | WalletOwnerScalarFieldEnum[]
  }

  /**
   * WalletOwner findFirstOrThrow
   */
  export type WalletOwnerFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WalletOwner
     */
    select?: WalletOwnerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WalletOwner
     */
    omit?: WalletOwnerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletOwnerInclude<ExtArgs> | null
    /**
     * Filter, which WalletOwner to fetch.
     */
    where?: WalletOwnerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WalletOwners to fetch.
     */
    orderBy?: WalletOwnerOrderByWithRelationInput | WalletOwnerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WalletOwners.
     */
    cursor?: WalletOwnerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WalletOwners from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WalletOwners.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WalletOwners.
     */
    distinct?: WalletOwnerScalarFieldEnum | WalletOwnerScalarFieldEnum[]
  }

  /**
   * WalletOwner findMany
   */
  export type WalletOwnerFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WalletOwner
     */
    select?: WalletOwnerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WalletOwner
     */
    omit?: WalletOwnerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletOwnerInclude<ExtArgs> | null
    /**
     * Filter, which WalletOwners to fetch.
     */
    where?: WalletOwnerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WalletOwners to fetch.
     */
    orderBy?: WalletOwnerOrderByWithRelationInput | WalletOwnerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing WalletOwners.
     */
    cursor?: WalletOwnerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WalletOwners from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WalletOwners.
     */
    skip?: number
    distinct?: WalletOwnerScalarFieldEnum | WalletOwnerScalarFieldEnum[]
  }

  /**
   * WalletOwner create
   */
  export type WalletOwnerCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WalletOwner
     */
    select?: WalletOwnerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WalletOwner
     */
    omit?: WalletOwnerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletOwnerInclude<ExtArgs> | null
    /**
     * The data needed to create a WalletOwner.
     */
    data: XOR<WalletOwnerCreateInput, WalletOwnerUncheckedCreateInput>
  }

  /**
   * WalletOwner createMany
   */
  export type WalletOwnerCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many WalletOwners.
     */
    data: WalletOwnerCreateManyInput | WalletOwnerCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WalletOwner createManyAndReturn
   */
  export type WalletOwnerCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WalletOwner
     */
    select?: WalletOwnerSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WalletOwner
     */
    omit?: WalletOwnerOmit<ExtArgs> | null
    /**
     * The data used to create many WalletOwners.
     */
    data: WalletOwnerCreateManyInput | WalletOwnerCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WalletOwner update
   */
  export type WalletOwnerUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WalletOwner
     */
    select?: WalletOwnerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WalletOwner
     */
    omit?: WalletOwnerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletOwnerInclude<ExtArgs> | null
    /**
     * The data needed to update a WalletOwner.
     */
    data: XOR<WalletOwnerUpdateInput, WalletOwnerUncheckedUpdateInput>
    /**
     * Choose, which WalletOwner to update.
     */
    where: WalletOwnerWhereUniqueInput
  }

  /**
   * WalletOwner updateMany
   */
  export type WalletOwnerUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update WalletOwners.
     */
    data: XOR<WalletOwnerUpdateManyMutationInput, WalletOwnerUncheckedUpdateManyInput>
    /**
     * Filter which WalletOwners to update
     */
    where?: WalletOwnerWhereInput
    /**
     * Limit how many WalletOwners to update.
     */
    limit?: number
  }

  /**
   * WalletOwner updateManyAndReturn
   */
  export type WalletOwnerUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WalletOwner
     */
    select?: WalletOwnerSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WalletOwner
     */
    omit?: WalletOwnerOmit<ExtArgs> | null
    /**
     * The data used to update WalletOwners.
     */
    data: XOR<WalletOwnerUpdateManyMutationInput, WalletOwnerUncheckedUpdateManyInput>
    /**
     * Filter which WalletOwners to update
     */
    where?: WalletOwnerWhereInput
    /**
     * Limit how many WalletOwners to update.
     */
    limit?: number
  }

  /**
   * WalletOwner upsert
   */
  export type WalletOwnerUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WalletOwner
     */
    select?: WalletOwnerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WalletOwner
     */
    omit?: WalletOwnerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletOwnerInclude<ExtArgs> | null
    /**
     * The filter to search for the WalletOwner to update in case it exists.
     */
    where: WalletOwnerWhereUniqueInput
    /**
     * In case the WalletOwner found by the `where` argument doesn't exist, create a new WalletOwner with this data.
     */
    create: XOR<WalletOwnerCreateInput, WalletOwnerUncheckedCreateInput>
    /**
     * In case the WalletOwner was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WalletOwnerUpdateInput, WalletOwnerUncheckedUpdateInput>
  }

  /**
   * WalletOwner delete
   */
  export type WalletOwnerDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WalletOwner
     */
    select?: WalletOwnerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WalletOwner
     */
    omit?: WalletOwnerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletOwnerInclude<ExtArgs> | null
    /**
     * Filter which WalletOwner to delete.
     */
    where: WalletOwnerWhereUniqueInput
  }

  /**
   * WalletOwner deleteMany
   */
  export type WalletOwnerDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WalletOwners to delete
     */
    where?: WalletOwnerWhereInput
    /**
     * Limit how many WalletOwners to delete.
     */
    limit?: number
  }

  /**
   * WalletOwner.swaps
   */
  export type WalletOwner$swapsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Swap
     */
    select?: SwapSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Swap
     */
    omit?: SwapOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SwapInclude<ExtArgs> | null
    where?: SwapWhereInput
    orderBy?: SwapOrderByWithRelationInput | SwapOrderByWithRelationInput[]
    cursor?: SwapWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SwapScalarFieldEnum | SwapScalarFieldEnum[]
  }

  /**
   * WalletOwner.errors
   */
  export type WalletOwner$errorsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SwapError
     */
    select?: SwapErrorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SwapError
     */
    omit?: SwapErrorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SwapErrorInclude<ExtArgs> | null
    where?: SwapErrorWhereInput
    orderBy?: SwapErrorOrderByWithRelationInput | SwapErrorOrderByWithRelationInput[]
    cursor?: SwapErrorWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SwapErrorScalarFieldEnum | SwapErrorScalarFieldEnum[]
  }

  /**
   * WalletOwner without action
   */
  export type WalletOwnerDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WalletOwner
     */
    select?: WalletOwnerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WalletOwner
     */
    omit?: WalletOwnerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletOwnerInclude<ExtArgs> | null
  }


  /**
   * Model Swap
   */

  export type AggregateSwap = {
    _count: SwapCountAggregateOutputType | null
    _min: SwapMinAggregateOutputType | null
    _max: SwapMaxAggregateOutputType | null
  }

  export type SwapMinAggregateOutputType = {
    id: string | null
    fromTokenAddress: string | null
    toTokenAddress: string | null
    toWalletAddress: string | null
    buyAmount: string | null
    sellAmount: string | null
    transactionHash: string | null
    application: string | null
    environment: string | null
    walletOwnerId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SwapMaxAggregateOutputType = {
    id: string | null
    fromTokenAddress: string | null
    toTokenAddress: string | null
    toWalletAddress: string | null
    buyAmount: string | null
    sellAmount: string | null
    transactionHash: string | null
    application: string | null
    environment: string | null
    walletOwnerId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SwapCountAggregateOutputType = {
    id: number
    fromTokenAddress: number
    toTokenAddress: number
    toWalletAddress: number
    buyAmount: number
    sellAmount: number
    transactionHash: number
    application: number
    environment: number
    walletOwnerId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SwapMinAggregateInputType = {
    id?: true
    fromTokenAddress?: true
    toTokenAddress?: true
    toWalletAddress?: true
    buyAmount?: true
    sellAmount?: true
    transactionHash?: true
    application?: true
    environment?: true
    walletOwnerId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SwapMaxAggregateInputType = {
    id?: true
    fromTokenAddress?: true
    toTokenAddress?: true
    toWalletAddress?: true
    buyAmount?: true
    sellAmount?: true
    transactionHash?: true
    application?: true
    environment?: true
    walletOwnerId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SwapCountAggregateInputType = {
    id?: true
    fromTokenAddress?: true
    toTokenAddress?: true
    toWalletAddress?: true
    buyAmount?: true
    sellAmount?: true
    transactionHash?: true
    application?: true
    environment?: true
    walletOwnerId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SwapAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Swap to aggregate.
     */
    where?: SwapWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Swaps to fetch.
     */
    orderBy?: SwapOrderByWithRelationInput | SwapOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SwapWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Swaps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Swaps.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Swaps
    **/
    _count?: true | SwapCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SwapMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SwapMaxAggregateInputType
  }

  export type GetSwapAggregateType<T extends SwapAggregateArgs> = {
        [P in keyof T & keyof AggregateSwap]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSwap[P]>
      : GetScalarType<T[P], AggregateSwap[P]>
  }




  export type SwapGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SwapWhereInput
    orderBy?: SwapOrderByWithAggregationInput | SwapOrderByWithAggregationInput[]
    by: SwapScalarFieldEnum[] | SwapScalarFieldEnum
    having?: SwapScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SwapCountAggregateInputType | true
    _min?: SwapMinAggregateInputType
    _max?: SwapMaxAggregateInputType
  }

  export type SwapGroupByOutputType = {
    id: string
    fromTokenAddress: string
    toTokenAddress: string
    toWalletAddress: string
    buyAmount: string
    sellAmount: string
    transactionHash: string
    application: string | null
    environment: string | null
    walletOwnerId: string | null
    createdAt: Date
    updatedAt: Date
    _count: SwapCountAggregateOutputType | null
    _min: SwapMinAggregateOutputType | null
    _max: SwapMaxAggregateOutputType | null
  }

  type GetSwapGroupByPayload<T extends SwapGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SwapGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SwapGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SwapGroupByOutputType[P]>
            : GetScalarType<T[P], SwapGroupByOutputType[P]>
        }
      >
    >


  export type SwapSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    fromTokenAddress?: boolean
    toTokenAddress?: boolean
    toWalletAddress?: boolean
    buyAmount?: boolean
    sellAmount?: boolean
    transactionHash?: boolean
    application?: boolean
    environment?: boolean
    walletOwnerId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    walletOwner?: boolean | Swap$walletOwnerArgs<ExtArgs>
  }, ExtArgs["result"]["swap"]>

  export type SwapSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    fromTokenAddress?: boolean
    toTokenAddress?: boolean
    toWalletAddress?: boolean
    buyAmount?: boolean
    sellAmount?: boolean
    transactionHash?: boolean
    application?: boolean
    environment?: boolean
    walletOwnerId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    walletOwner?: boolean | Swap$walletOwnerArgs<ExtArgs>
  }, ExtArgs["result"]["swap"]>

  export type SwapSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    fromTokenAddress?: boolean
    toTokenAddress?: boolean
    toWalletAddress?: boolean
    buyAmount?: boolean
    sellAmount?: boolean
    transactionHash?: boolean
    application?: boolean
    environment?: boolean
    walletOwnerId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    walletOwner?: boolean | Swap$walletOwnerArgs<ExtArgs>
  }, ExtArgs["result"]["swap"]>

  export type SwapSelectScalar = {
    id?: boolean
    fromTokenAddress?: boolean
    toTokenAddress?: boolean
    toWalletAddress?: boolean
    buyAmount?: boolean
    sellAmount?: boolean
    transactionHash?: boolean
    application?: boolean
    environment?: boolean
    walletOwnerId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SwapOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "fromTokenAddress" | "toTokenAddress" | "toWalletAddress" | "buyAmount" | "sellAmount" | "transactionHash" | "application" | "environment" | "walletOwnerId" | "createdAt" | "updatedAt", ExtArgs["result"]["swap"]>
  export type SwapInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    walletOwner?: boolean | Swap$walletOwnerArgs<ExtArgs>
  }
  export type SwapIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    walletOwner?: boolean | Swap$walletOwnerArgs<ExtArgs>
  }
  export type SwapIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    walletOwner?: boolean | Swap$walletOwnerArgs<ExtArgs>
  }

  export type $SwapPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Swap"
    objects: {
      walletOwner: Prisma.$WalletOwnerPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      fromTokenAddress: string
      toTokenAddress: string
      toWalletAddress: string
      buyAmount: string
      sellAmount: string
      transactionHash: string
      application: string | null
      environment: string | null
      walletOwnerId: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["swap"]>
    composites: {}
  }

  type SwapGetPayload<S extends boolean | null | undefined | SwapDefaultArgs> = $Result.GetResult<Prisma.$SwapPayload, S>

  type SwapCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SwapFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SwapCountAggregateInputType | true
    }

  export interface SwapDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Swap'], meta: { name: 'Swap' } }
    /**
     * Find zero or one Swap that matches the filter.
     * @param {SwapFindUniqueArgs} args - Arguments to find a Swap
     * @example
     * // Get one Swap
     * const swap = await prisma.swap.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SwapFindUniqueArgs>(args: SelectSubset<T, SwapFindUniqueArgs<ExtArgs>>): Prisma__SwapClient<$Result.GetResult<Prisma.$SwapPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Swap that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SwapFindUniqueOrThrowArgs} args - Arguments to find a Swap
     * @example
     * // Get one Swap
     * const swap = await prisma.swap.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SwapFindUniqueOrThrowArgs>(args: SelectSubset<T, SwapFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SwapClient<$Result.GetResult<Prisma.$SwapPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Swap that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SwapFindFirstArgs} args - Arguments to find a Swap
     * @example
     * // Get one Swap
     * const swap = await prisma.swap.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SwapFindFirstArgs>(args?: SelectSubset<T, SwapFindFirstArgs<ExtArgs>>): Prisma__SwapClient<$Result.GetResult<Prisma.$SwapPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Swap that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SwapFindFirstOrThrowArgs} args - Arguments to find a Swap
     * @example
     * // Get one Swap
     * const swap = await prisma.swap.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SwapFindFirstOrThrowArgs>(args?: SelectSubset<T, SwapFindFirstOrThrowArgs<ExtArgs>>): Prisma__SwapClient<$Result.GetResult<Prisma.$SwapPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Swaps that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SwapFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Swaps
     * const swaps = await prisma.swap.findMany()
     * 
     * // Get first 10 Swaps
     * const swaps = await prisma.swap.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const swapWithIdOnly = await prisma.swap.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SwapFindManyArgs>(args?: SelectSubset<T, SwapFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SwapPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Swap.
     * @param {SwapCreateArgs} args - Arguments to create a Swap.
     * @example
     * // Create one Swap
     * const Swap = await prisma.swap.create({
     *   data: {
     *     // ... data to create a Swap
     *   }
     * })
     * 
     */
    create<T extends SwapCreateArgs>(args: SelectSubset<T, SwapCreateArgs<ExtArgs>>): Prisma__SwapClient<$Result.GetResult<Prisma.$SwapPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Swaps.
     * @param {SwapCreateManyArgs} args - Arguments to create many Swaps.
     * @example
     * // Create many Swaps
     * const swap = await prisma.swap.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SwapCreateManyArgs>(args?: SelectSubset<T, SwapCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Swaps and returns the data saved in the database.
     * @param {SwapCreateManyAndReturnArgs} args - Arguments to create many Swaps.
     * @example
     * // Create many Swaps
     * const swap = await prisma.swap.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Swaps and only return the `id`
     * const swapWithIdOnly = await prisma.swap.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SwapCreateManyAndReturnArgs>(args?: SelectSubset<T, SwapCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SwapPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Swap.
     * @param {SwapDeleteArgs} args - Arguments to delete one Swap.
     * @example
     * // Delete one Swap
     * const Swap = await prisma.swap.delete({
     *   where: {
     *     // ... filter to delete one Swap
     *   }
     * })
     * 
     */
    delete<T extends SwapDeleteArgs>(args: SelectSubset<T, SwapDeleteArgs<ExtArgs>>): Prisma__SwapClient<$Result.GetResult<Prisma.$SwapPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Swap.
     * @param {SwapUpdateArgs} args - Arguments to update one Swap.
     * @example
     * // Update one Swap
     * const swap = await prisma.swap.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SwapUpdateArgs>(args: SelectSubset<T, SwapUpdateArgs<ExtArgs>>): Prisma__SwapClient<$Result.GetResult<Prisma.$SwapPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Swaps.
     * @param {SwapDeleteManyArgs} args - Arguments to filter Swaps to delete.
     * @example
     * // Delete a few Swaps
     * const { count } = await prisma.swap.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SwapDeleteManyArgs>(args?: SelectSubset<T, SwapDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Swaps.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SwapUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Swaps
     * const swap = await prisma.swap.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SwapUpdateManyArgs>(args: SelectSubset<T, SwapUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Swaps and returns the data updated in the database.
     * @param {SwapUpdateManyAndReturnArgs} args - Arguments to update many Swaps.
     * @example
     * // Update many Swaps
     * const swap = await prisma.swap.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Swaps and only return the `id`
     * const swapWithIdOnly = await prisma.swap.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SwapUpdateManyAndReturnArgs>(args: SelectSubset<T, SwapUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SwapPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Swap.
     * @param {SwapUpsertArgs} args - Arguments to update or create a Swap.
     * @example
     * // Update or create a Swap
     * const swap = await prisma.swap.upsert({
     *   create: {
     *     // ... data to create a Swap
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Swap we want to update
     *   }
     * })
     */
    upsert<T extends SwapUpsertArgs>(args: SelectSubset<T, SwapUpsertArgs<ExtArgs>>): Prisma__SwapClient<$Result.GetResult<Prisma.$SwapPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Swaps.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SwapCountArgs} args - Arguments to filter Swaps to count.
     * @example
     * // Count the number of Swaps
     * const count = await prisma.swap.count({
     *   where: {
     *     // ... the filter for the Swaps we want to count
     *   }
     * })
    **/
    count<T extends SwapCountArgs>(
      args?: Subset<T, SwapCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SwapCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Swap.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SwapAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SwapAggregateArgs>(args: Subset<T, SwapAggregateArgs>): Prisma.PrismaPromise<GetSwapAggregateType<T>>

    /**
     * Group by Swap.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SwapGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SwapGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SwapGroupByArgs['orderBy'] }
        : { orderBy?: SwapGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SwapGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSwapGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Swap model
   */
  readonly fields: SwapFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Swap.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SwapClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    walletOwner<T extends Swap$walletOwnerArgs<ExtArgs> = {}>(args?: Subset<T, Swap$walletOwnerArgs<ExtArgs>>): Prisma__WalletOwnerClient<$Result.GetResult<Prisma.$WalletOwnerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Swap model
   */
  interface SwapFieldRefs {
    readonly id: FieldRef<"Swap", 'String'>
    readonly fromTokenAddress: FieldRef<"Swap", 'String'>
    readonly toTokenAddress: FieldRef<"Swap", 'String'>
    readonly toWalletAddress: FieldRef<"Swap", 'String'>
    readonly buyAmount: FieldRef<"Swap", 'String'>
    readonly sellAmount: FieldRef<"Swap", 'String'>
    readonly transactionHash: FieldRef<"Swap", 'String'>
    readonly application: FieldRef<"Swap", 'String'>
    readonly environment: FieldRef<"Swap", 'String'>
    readonly walletOwnerId: FieldRef<"Swap", 'String'>
    readonly createdAt: FieldRef<"Swap", 'DateTime'>
    readonly updatedAt: FieldRef<"Swap", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Swap findUnique
   */
  export type SwapFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Swap
     */
    select?: SwapSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Swap
     */
    omit?: SwapOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SwapInclude<ExtArgs> | null
    /**
     * Filter, which Swap to fetch.
     */
    where: SwapWhereUniqueInput
  }

  /**
   * Swap findUniqueOrThrow
   */
  export type SwapFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Swap
     */
    select?: SwapSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Swap
     */
    omit?: SwapOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SwapInclude<ExtArgs> | null
    /**
     * Filter, which Swap to fetch.
     */
    where: SwapWhereUniqueInput
  }

  /**
   * Swap findFirst
   */
  export type SwapFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Swap
     */
    select?: SwapSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Swap
     */
    omit?: SwapOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SwapInclude<ExtArgs> | null
    /**
     * Filter, which Swap to fetch.
     */
    where?: SwapWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Swaps to fetch.
     */
    orderBy?: SwapOrderByWithRelationInput | SwapOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Swaps.
     */
    cursor?: SwapWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Swaps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Swaps.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Swaps.
     */
    distinct?: SwapScalarFieldEnum | SwapScalarFieldEnum[]
  }

  /**
   * Swap findFirstOrThrow
   */
  export type SwapFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Swap
     */
    select?: SwapSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Swap
     */
    omit?: SwapOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SwapInclude<ExtArgs> | null
    /**
     * Filter, which Swap to fetch.
     */
    where?: SwapWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Swaps to fetch.
     */
    orderBy?: SwapOrderByWithRelationInput | SwapOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Swaps.
     */
    cursor?: SwapWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Swaps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Swaps.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Swaps.
     */
    distinct?: SwapScalarFieldEnum | SwapScalarFieldEnum[]
  }

  /**
   * Swap findMany
   */
  export type SwapFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Swap
     */
    select?: SwapSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Swap
     */
    omit?: SwapOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SwapInclude<ExtArgs> | null
    /**
     * Filter, which Swaps to fetch.
     */
    where?: SwapWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Swaps to fetch.
     */
    orderBy?: SwapOrderByWithRelationInput | SwapOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Swaps.
     */
    cursor?: SwapWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Swaps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Swaps.
     */
    skip?: number
    distinct?: SwapScalarFieldEnum | SwapScalarFieldEnum[]
  }

  /**
   * Swap create
   */
  export type SwapCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Swap
     */
    select?: SwapSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Swap
     */
    omit?: SwapOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SwapInclude<ExtArgs> | null
    /**
     * The data needed to create a Swap.
     */
    data: XOR<SwapCreateInput, SwapUncheckedCreateInput>
  }

  /**
   * Swap createMany
   */
  export type SwapCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Swaps.
     */
    data: SwapCreateManyInput | SwapCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Swap createManyAndReturn
   */
  export type SwapCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Swap
     */
    select?: SwapSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Swap
     */
    omit?: SwapOmit<ExtArgs> | null
    /**
     * The data used to create many Swaps.
     */
    data: SwapCreateManyInput | SwapCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SwapIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Swap update
   */
  export type SwapUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Swap
     */
    select?: SwapSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Swap
     */
    omit?: SwapOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SwapInclude<ExtArgs> | null
    /**
     * The data needed to update a Swap.
     */
    data: XOR<SwapUpdateInput, SwapUncheckedUpdateInput>
    /**
     * Choose, which Swap to update.
     */
    where: SwapWhereUniqueInput
  }

  /**
   * Swap updateMany
   */
  export type SwapUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Swaps.
     */
    data: XOR<SwapUpdateManyMutationInput, SwapUncheckedUpdateManyInput>
    /**
     * Filter which Swaps to update
     */
    where?: SwapWhereInput
    /**
     * Limit how many Swaps to update.
     */
    limit?: number
  }

  /**
   * Swap updateManyAndReturn
   */
  export type SwapUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Swap
     */
    select?: SwapSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Swap
     */
    omit?: SwapOmit<ExtArgs> | null
    /**
     * The data used to update Swaps.
     */
    data: XOR<SwapUpdateManyMutationInput, SwapUncheckedUpdateManyInput>
    /**
     * Filter which Swaps to update
     */
    where?: SwapWhereInput
    /**
     * Limit how many Swaps to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SwapIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Swap upsert
   */
  export type SwapUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Swap
     */
    select?: SwapSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Swap
     */
    omit?: SwapOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SwapInclude<ExtArgs> | null
    /**
     * The filter to search for the Swap to update in case it exists.
     */
    where: SwapWhereUniqueInput
    /**
     * In case the Swap found by the `where` argument doesn't exist, create a new Swap with this data.
     */
    create: XOR<SwapCreateInput, SwapUncheckedCreateInput>
    /**
     * In case the Swap was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SwapUpdateInput, SwapUncheckedUpdateInput>
  }

  /**
   * Swap delete
   */
  export type SwapDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Swap
     */
    select?: SwapSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Swap
     */
    omit?: SwapOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SwapInclude<ExtArgs> | null
    /**
     * Filter which Swap to delete.
     */
    where: SwapWhereUniqueInput
  }

  /**
   * Swap deleteMany
   */
  export type SwapDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Swaps to delete
     */
    where?: SwapWhereInput
    /**
     * Limit how many Swaps to delete.
     */
    limit?: number
  }

  /**
   * Swap.walletOwner
   */
  export type Swap$walletOwnerArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WalletOwner
     */
    select?: WalletOwnerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WalletOwner
     */
    omit?: WalletOwnerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletOwnerInclude<ExtArgs> | null
    where?: WalletOwnerWhereInput
  }

  /**
   * Swap without action
   */
  export type SwapDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Swap
     */
    select?: SwapSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Swap
     */
    omit?: SwapOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SwapInclude<ExtArgs> | null
  }


  /**
   * Model SwapError
   */

  export type AggregateSwapError = {
    _count: SwapErrorCountAggregateOutputType | null
    _min: SwapErrorMinAggregateOutputType | null
    _max: SwapErrorMaxAggregateOutputType | null
  }

  export type SwapErrorMinAggregateOutputType = {
    id: string | null
    message: string | null
    walletOwnerId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SwapErrorMaxAggregateOutputType = {
    id: string | null
    message: string | null
    walletOwnerId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SwapErrorCountAggregateOutputType = {
    id: number
    message: number
    walletOwnerId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SwapErrorMinAggregateInputType = {
    id?: true
    message?: true
    walletOwnerId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SwapErrorMaxAggregateInputType = {
    id?: true
    message?: true
    walletOwnerId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SwapErrorCountAggregateInputType = {
    id?: true
    message?: true
    walletOwnerId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SwapErrorAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SwapError to aggregate.
     */
    where?: SwapErrorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SwapErrors to fetch.
     */
    orderBy?: SwapErrorOrderByWithRelationInput | SwapErrorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SwapErrorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SwapErrors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SwapErrors.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SwapErrors
    **/
    _count?: true | SwapErrorCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SwapErrorMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SwapErrorMaxAggregateInputType
  }

  export type GetSwapErrorAggregateType<T extends SwapErrorAggregateArgs> = {
        [P in keyof T & keyof AggregateSwapError]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSwapError[P]>
      : GetScalarType<T[P], AggregateSwapError[P]>
  }




  export type SwapErrorGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SwapErrorWhereInput
    orderBy?: SwapErrorOrderByWithAggregationInput | SwapErrorOrderByWithAggregationInput[]
    by: SwapErrorScalarFieldEnum[] | SwapErrorScalarFieldEnum
    having?: SwapErrorScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SwapErrorCountAggregateInputType | true
    _min?: SwapErrorMinAggregateInputType
    _max?: SwapErrorMaxAggregateInputType
  }

  export type SwapErrorGroupByOutputType = {
    id: string
    message: string
    walletOwnerId: string | null
    createdAt: Date
    updatedAt: Date
    _count: SwapErrorCountAggregateOutputType | null
    _min: SwapErrorMinAggregateOutputType | null
    _max: SwapErrorMaxAggregateOutputType | null
  }

  type GetSwapErrorGroupByPayload<T extends SwapErrorGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SwapErrorGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SwapErrorGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SwapErrorGroupByOutputType[P]>
            : GetScalarType<T[P], SwapErrorGroupByOutputType[P]>
        }
      >
    >


  export type SwapErrorSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    message?: boolean
    walletOwnerId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    walletOwner?: boolean | SwapError$walletOwnerArgs<ExtArgs>
  }, ExtArgs["result"]["swapError"]>

  export type SwapErrorSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    message?: boolean
    walletOwnerId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    walletOwner?: boolean | SwapError$walletOwnerArgs<ExtArgs>
  }, ExtArgs["result"]["swapError"]>

  export type SwapErrorSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    message?: boolean
    walletOwnerId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    walletOwner?: boolean | SwapError$walletOwnerArgs<ExtArgs>
  }, ExtArgs["result"]["swapError"]>

  export type SwapErrorSelectScalar = {
    id?: boolean
    message?: boolean
    walletOwnerId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SwapErrorOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "message" | "walletOwnerId" | "createdAt" | "updatedAt", ExtArgs["result"]["swapError"]>
  export type SwapErrorInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    walletOwner?: boolean | SwapError$walletOwnerArgs<ExtArgs>
  }
  export type SwapErrorIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    walletOwner?: boolean | SwapError$walletOwnerArgs<ExtArgs>
  }
  export type SwapErrorIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    walletOwner?: boolean | SwapError$walletOwnerArgs<ExtArgs>
  }

  export type $SwapErrorPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SwapError"
    objects: {
      walletOwner: Prisma.$WalletOwnerPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      message: string
      walletOwnerId: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["swapError"]>
    composites: {}
  }

  type SwapErrorGetPayload<S extends boolean | null | undefined | SwapErrorDefaultArgs> = $Result.GetResult<Prisma.$SwapErrorPayload, S>

  type SwapErrorCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SwapErrorFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SwapErrorCountAggregateInputType | true
    }

  export interface SwapErrorDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SwapError'], meta: { name: 'SwapError' } }
    /**
     * Find zero or one SwapError that matches the filter.
     * @param {SwapErrorFindUniqueArgs} args - Arguments to find a SwapError
     * @example
     * // Get one SwapError
     * const swapError = await prisma.swapError.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SwapErrorFindUniqueArgs>(args: SelectSubset<T, SwapErrorFindUniqueArgs<ExtArgs>>): Prisma__SwapErrorClient<$Result.GetResult<Prisma.$SwapErrorPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one SwapError that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SwapErrorFindUniqueOrThrowArgs} args - Arguments to find a SwapError
     * @example
     * // Get one SwapError
     * const swapError = await prisma.swapError.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SwapErrorFindUniqueOrThrowArgs>(args: SelectSubset<T, SwapErrorFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SwapErrorClient<$Result.GetResult<Prisma.$SwapErrorPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SwapError that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SwapErrorFindFirstArgs} args - Arguments to find a SwapError
     * @example
     * // Get one SwapError
     * const swapError = await prisma.swapError.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SwapErrorFindFirstArgs>(args?: SelectSubset<T, SwapErrorFindFirstArgs<ExtArgs>>): Prisma__SwapErrorClient<$Result.GetResult<Prisma.$SwapErrorPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SwapError that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SwapErrorFindFirstOrThrowArgs} args - Arguments to find a SwapError
     * @example
     * // Get one SwapError
     * const swapError = await prisma.swapError.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SwapErrorFindFirstOrThrowArgs>(args?: SelectSubset<T, SwapErrorFindFirstOrThrowArgs<ExtArgs>>): Prisma__SwapErrorClient<$Result.GetResult<Prisma.$SwapErrorPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more SwapErrors that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SwapErrorFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SwapErrors
     * const swapErrors = await prisma.swapError.findMany()
     * 
     * // Get first 10 SwapErrors
     * const swapErrors = await prisma.swapError.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const swapErrorWithIdOnly = await prisma.swapError.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SwapErrorFindManyArgs>(args?: SelectSubset<T, SwapErrorFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SwapErrorPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a SwapError.
     * @param {SwapErrorCreateArgs} args - Arguments to create a SwapError.
     * @example
     * // Create one SwapError
     * const SwapError = await prisma.swapError.create({
     *   data: {
     *     // ... data to create a SwapError
     *   }
     * })
     * 
     */
    create<T extends SwapErrorCreateArgs>(args: SelectSubset<T, SwapErrorCreateArgs<ExtArgs>>): Prisma__SwapErrorClient<$Result.GetResult<Prisma.$SwapErrorPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many SwapErrors.
     * @param {SwapErrorCreateManyArgs} args - Arguments to create many SwapErrors.
     * @example
     * // Create many SwapErrors
     * const swapError = await prisma.swapError.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SwapErrorCreateManyArgs>(args?: SelectSubset<T, SwapErrorCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SwapErrors and returns the data saved in the database.
     * @param {SwapErrorCreateManyAndReturnArgs} args - Arguments to create many SwapErrors.
     * @example
     * // Create many SwapErrors
     * const swapError = await prisma.swapError.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SwapErrors and only return the `id`
     * const swapErrorWithIdOnly = await prisma.swapError.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SwapErrorCreateManyAndReturnArgs>(args?: SelectSubset<T, SwapErrorCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SwapErrorPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a SwapError.
     * @param {SwapErrorDeleteArgs} args - Arguments to delete one SwapError.
     * @example
     * // Delete one SwapError
     * const SwapError = await prisma.swapError.delete({
     *   where: {
     *     // ... filter to delete one SwapError
     *   }
     * })
     * 
     */
    delete<T extends SwapErrorDeleteArgs>(args: SelectSubset<T, SwapErrorDeleteArgs<ExtArgs>>): Prisma__SwapErrorClient<$Result.GetResult<Prisma.$SwapErrorPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one SwapError.
     * @param {SwapErrorUpdateArgs} args - Arguments to update one SwapError.
     * @example
     * // Update one SwapError
     * const swapError = await prisma.swapError.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SwapErrorUpdateArgs>(args: SelectSubset<T, SwapErrorUpdateArgs<ExtArgs>>): Prisma__SwapErrorClient<$Result.GetResult<Prisma.$SwapErrorPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more SwapErrors.
     * @param {SwapErrorDeleteManyArgs} args - Arguments to filter SwapErrors to delete.
     * @example
     * // Delete a few SwapErrors
     * const { count } = await prisma.swapError.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SwapErrorDeleteManyArgs>(args?: SelectSubset<T, SwapErrorDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SwapErrors.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SwapErrorUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SwapErrors
     * const swapError = await prisma.swapError.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SwapErrorUpdateManyArgs>(args: SelectSubset<T, SwapErrorUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SwapErrors and returns the data updated in the database.
     * @param {SwapErrorUpdateManyAndReturnArgs} args - Arguments to update many SwapErrors.
     * @example
     * // Update many SwapErrors
     * const swapError = await prisma.swapError.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SwapErrors and only return the `id`
     * const swapErrorWithIdOnly = await prisma.swapError.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SwapErrorUpdateManyAndReturnArgs>(args: SelectSubset<T, SwapErrorUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SwapErrorPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one SwapError.
     * @param {SwapErrorUpsertArgs} args - Arguments to update or create a SwapError.
     * @example
     * // Update or create a SwapError
     * const swapError = await prisma.swapError.upsert({
     *   create: {
     *     // ... data to create a SwapError
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SwapError we want to update
     *   }
     * })
     */
    upsert<T extends SwapErrorUpsertArgs>(args: SelectSubset<T, SwapErrorUpsertArgs<ExtArgs>>): Prisma__SwapErrorClient<$Result.GetResult<Prisma.$SwapErrorPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of SwapErrors.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SwapErrorCountArgs} args - Arguments to filter SwapErrors to count.
     * @example
     * // Count the number of SwapErrors
     * const count = await prisma.swapError.count({
     *   where: {
     *     // ... the filter for the SwapErrors we want to count
     *   }
     * })
    **/
    count<T extends SwapErrorCountArgs>(
      args?: Subset<T, SwapErrorCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SwapErrorCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SwapError.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SwapErrorAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SwapErrorAggregateArgs>(args: Subset<T, SwapErrorAggregateArgs>): Prisma.PrismaPromise<GetSwapErrorAggregateType<T>>

    /**
     * Group by SwapError.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SwapErrorGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SwapErrorGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SwapErrorGroupByArgs['orderBy'] }
        : { orderBy?: SwapErrorGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SwapErrorGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSwapErrorGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SwapError model
   */
  readonly fields: SwapErrorFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SwapError.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SwapErrorClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    walletOwner<T extends SwapError$walletOwnerArgs<ExtArgs> = {}>(args?: Subset<T, SwapError$walletOwnerArgs<ExtArgs>>): Prisma__WalletOwnerClient<$Result.GetResult<Prisma.$WalletOwnerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SwapError model
   */
  interface SwapErrorFieldRefs {
    readonly id: FieldRef<"SwapError", 'String'>
    readonly message: FieldRef<"SwapError", 'String'>
    readonly walletOwnerId: FieldRef<"SwapError", 'String'>
    readonly createdAt: FieldRef<"SwapError", 'DateTime'>
    readonly updatedAt: FieldRef<"SwapError", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SwapError findUnique
   */
  export type SwapErrorFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SwapError
     */
    select?: SwapErrorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SwapError
     */
    omit?: SwapErrorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SwapErrorInclude<ExtArgs> | null
    /**
     * Filter, which SwapError to fetch.
     */
    where: SwapErrorWhereUniqueInput
  }

  /**
   * SwapError findUniqueOrThrow
   */
  export type SwapErrorFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SwapError
     */
    select?: SwapErrorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SwapError
     */
    omit?: SwapErrorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SwapErrorInclude<ExtArgs> | null
    /**
     * Filter, which SwapError to fetch.
     */
    where: SwapErrorWhereUniqueInput
  }

  /**
   * SwapError findFirst
   */
  export type SwapErrorFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SwapError
     */
    select?: SwapErrorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SwapError
     */
    omit?: SwapErrorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SwapErrorInclude<ExtArgs> | null
    /**
     * Filter, which SwapError to fetch.
     */
    where?: SwapErrorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SwapErrors to fetch.
     */
    orderBy?: SwapErrorOrderByWithRelationInput | SwapErrorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SwapErrors.
     */
    cursor?: SwapErrorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SwapErrors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SwapErrors.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SwapErrors.
     */
    distinct?: SwapErrorScalarFieldEnum | SwapErrorScalarFieldEnum[]
  }

  /**
   * SwapError findFirstOrThrow
   */
  export type SwapErrorFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SwapError
     */
    select?: SwapErrorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SwapError
     */
    omit?: SwapErrorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SwapErrorInclude<ExtArgs> | null
    /**
     * Filter, which SwapError to fetch.
     */
    where?: SwapErrorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SwapErrors to fetch.
     */
    orderBy?: SwapErrorOrderByWithRelationInput | SwapErrorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SwapErrors.
     */
    cursor?: SwapErrorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SwapErrors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SwapErrors.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SwapErrors.
     */
    distinct?: SwapErrorScalarFieldEnum | SwapErrorScalarFieldEnum[]
  }

  /**
   * SwapError findMany
   */
  export type SwapErrorFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SwapError
     */
    select?: SwapErrorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SwapError
     */
    omit?: SwapErrorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SwapErrorInclude<ExtArgs> | null
    /**
     * Filter, which SwapErrors to fetch.
     */
    where?: SwapErrorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SwapErrors to fetch.
     */
    orderBy?: SwapErrorOrderByWithRelationInput | SwapErrorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SwapErrors.
     */
    cursor?: SwapErrorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SwapErrors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SwapErrors.
     */
    skip?: number
    distinct?: SwapErrorScalarFieldEnum | SwapErrorScalarFieldEnum[]
  }

  /**
   * SwapError create
   */
  export type SwapErrorCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SwapError
     */
    select?: SwapErrorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SwapError
     */
    omit?: SwapErrorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SwapErrorInclude<ExtArgs> | null
    /**
     * The data needed to create a SwapError.
     */
    data: XOR<SwapErrorCreateInput, SwapErrorUncheckedCreateInput>
  }

  /**
   * SwapError createMany
   */
  export type SwapErrorCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SwapErrors.
     */
    data: SwapErrorCreateManyInput | SwapErrorCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SwapError createManyAndReturn
   */
  export type SwapErrorCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SwapError
     */
    select?: SwapErrorSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SwapError
     */
    omit?: SwapErrorOmit<ExtArgs> | null
    /**
     * The data used to create many SwapErrors.
     */
    data: SwapErrorCreateManyInput | SwapErrorCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SwapErrorIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * SwapError update
   */
  export type SwapErrorUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SwapError
     */
    select?: SwapErrorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SwapError
     */
    omit?: SwapErrorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SwapErrorInclude<ExtArgs> | null
    /**
     * The data needed to update a SwapError.
     */
    data: XOR<SwapErrorUpdateInput, SwapErrorUncheckedUpdateInput>
    /**
     * Choose, which SwapError to update.
     */
    where: SwapErrorWhereUniqueInput
  }

  /**
   * SwapError updateMany
   */
  export type SwapErrorUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SwapErrors.
     */
    data: XOR<SwapErrorUpdateManyMutationInput, SwapErrorUncheckedUpdateManyInput>
    /**
     * Filter which SwapErrors to update
     */
    where?: SwapErrorWhereInput
    /**
     * Limit how many SwapErrors to update.
     */
    limit?: number
  }

  /**
   * SwapError updateManyAndReturn
   */
  export type SwapErrorUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SwapError
     */
    select?: SwapErrorSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SwapError
     */
    omit?: SwapErrorOmit<ExtArgs> | null
    /**
     * The data used to update SwapErrors.
     */
    data: XOR<SwapErrorUpdateManyMutationInput, SwapErrorUncheckedUpdateManyInput>
    /**
     * Filter which SwapErrors to update
     */
    where?: SwapErrorWhereInput
    /**
     * Limit how many SwapErrors to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SwapErrorIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * SwapError upsert
   */
  export type SwapErrorUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SwapError
     */
    select?: SwapErrorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SwapError
     */
    omit?: SwapErrorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SwapErrorInclude<ExtArgs> | null
    /**
     * The filter to search for the SwapError to update in case it exists.
     */
    where: SwapErrorWhereUniqueInput
    /**
     * In case the SwapError found by the `where` argument doesn't exist, create a new SwapError with this data.
     */
    create: XOR<SwapErrorCreateInput, SwapErrorUncheckedCreateInput>
    /**
     * In case the SwapError was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SwapErrorUpdateInput, SwapErrorUncheckedUpdateInput>
  }

  /**
   * SwapError delete
   */
  export type SwapErrorDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SwapError
     */
    select?: SwapErrorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SwapError
     */
    omit?: SwapErrorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SwapErrorInclude<ExtArgs> | null
    /**
     * Filter which SwapError to delete.
     */
    where: SwapErrorWhereUniqueInput
  }

  /**
   * SwapError deleteMany
   */
  export type SwapErrorDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SwapErrors to delete
     */
    where?: SwapErrorWhereInput
    /**
     * Limit how many SwapErrors to delete.
     */
    limit?: number
  }

  /**
   * SwapError.walletOwner
   */
  export type SwapError$walletOwnerArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WalletOwner
     */
    select?: WalletOwnerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WalletOwner
     */
    omit?: WalletOwnerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletOwnerInclude<ExtArgs> | null
    where?: WalletOwnerWhereInput
  }

  /**
   * SwapError without action
   */
  export type SwapErrorDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SwapError
     */
    select?: SwapErrorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SwapError
     */
    omit?: SwapErrorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SwapErrorInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const WalletOwnerScalarFieldEnum: {
    id: 'id',
    walletAddress: 'walletAddress',
    appConnectionId: 'appConnectionId',
    appConnectionDescription: 'appConnectionDescription',
    dailySwaps: 'dailySwaps',
    weeklySwaps: 'weeklySwaps',
    monthlySwaps: 'monthlySwaps',
    yearlySwaps: 'yearlySwaps',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type WalletOwnerScalarFieldEnum = (typeof WalletOwnerScalarFieldEnum)[keyof typeof WalletOwnerScalarFieldEnum]


  export const SwapScalarFieldEnum: {
    id: 'id',
    fromTokenAddress: 'fromTokenAddress',
    toTokenAddress: 'toTokenAddress',
    toWalletAddress: 'toWalletAddress',
    buyAmount: 'buyAmount',
    sellAmount: 'sellAmount',
    transactionHash: 'transactionHash',
    application: 'application',
    environment: 'environment',
    walletOwnerId: 'walletOwnerId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SwapScalarFieldEnum = (typeof SwapScalarFieldEnum)[keyof typeof SwapScalarFieldEnum]


  export const SwapErrorScalarFieldEnum: {
    id: 'id',
    message: 'message',
    walletOwnerId: 'walletOwnerId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SwapErrorScalarFieldEnum = (typeof SwapErrorScalarFieldEnum)[keyof typeof SwapErrorScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type WalletOwnerWhereInput = {
    AND?: WalletOwnerWhereInput | WalletOwnerWhereInput[]
    OR?: WalletOwnerWhereInput[]
    NOT?: WalletOwnerWhereInput | WalletOwnerWhereInput[]
    id?: StringFilter<"WalletOwner"> | string
    walletAddress?: StringFilter<"WalletOwner"> | string
    appConnectionId?: StringNullableFilter<"WalletOwner"> | string | null
    appConnectionDescription?: StringNullableFilter<"WalletOwner"> | string | null
    dailySwaps?: IntFilter<"WalletOwner"> | number
    weeklySwaps?: IntFilter<"WalletOwner"> | number
    monthlySwaps?: IntFilter<"WalletOwner"> | number
    yearlySwaps?: IntFilter<"WalletOwner"> | number
    createdAt?: DateTimeFilter<"WalletOwner"> | Date | string
    updatedAt?: DateTimeFilter<"WalletOwner"> | Date | string
    swaps?: SwapListRelationFilter
    errors?: SwapErrorListRelationFilter
  }

  export type WalletOwnerOrderByWithRelationInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    appConnectionId?: SortOrderInput | SortOrder
    appConnectionDescription?: SortOrderInput | SortOrder
    dailySwaps?: SortOrder
    weeklySwaps?: SortOrder
    monthlySwaps?: SortOrder
    yearlySwaps?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    swaps?: SwapOrderByRelationAggregateInput
    errors?: SwapErrorOrderByRelationAggregateInput
  }

  export type WalletOwnerWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    walletAddress?: string
    AND?: WalletOwnerWhereInput | WalletOwnerWhereInput[]
    OR?: WalletOwnerWhereInput[]
    NOT?: WalletOwnerWhereInput | WalletOwnerWhereInput[]
    appConnectionId?: StringNullableFilter<"WalletOwner"> | string | null
    appConnectionDescription?: StringNullableFilter<"WalletOwner"> | string | null
    dailySwaps?: IntFilter<"WalletOwner"> | number
    weeklySwaps?: IntFilter<"WalletOwner"> | number
    monthlySwaps?: IntFilter<"WalletOwner"> | number
    yearlySwaps?: IntFilter<"WalletOwner"> | number
    createdAt?: DateTimeFilter<"WalletOwner"> | Date | string
    updatedAt?: DateTimeFilter<"WalletOwner"> | Date | string
    swaps?: SwapListRelationFilter
    errors?: SwapErrorListRelationFilter
  }, "id" | "walletAddress">

  export type WalletOwnerOrderByWithAggregationInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    appConnectionId?: SortOrderInput | SortOrder
    appConnectionDescription?: SortOrderInput | SortOrder
    dailySwaps?: SortOrder
    weeklySwaps?: SortOrder
    monthlySwaps?: SortOrder
    yearlySwaps?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: WalletOwnerCountOrderByAggregateInput
    _avg?: WalletOwnerAvgOrderByAggregateInput
    _max?: WalletOwnerMaxOrderByAggregateInput
    _min?: WalletOwnerMinOrderByAggregateInput
    _sum?: WalletOwnerSumOrderByAggregateInput
  }

  export type WalletOwnerScalarWhereWithAggregatesInput = {
    AND?: WalletOwnerScalarWhereWithAggregatesInput | WalletOwnerScalarWhereWithAggregatesInput[]
    OR?: WalletOwnerScalarWhereWithAggregatesInput[]
    NOT?: WalletOwnerScalarWhereWithAggregatesInput | WalletOwnerScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"WalletOwner"> | string
    walletAddress?: StringWithAggregatesFilter<"WalletOwner"> | string
    appConnectionId?: StringNullableWithAggregatesFilter<"WalletOwner"> | string | null
    appConnectionDescription?: StringNullableWithAggregatesFilter<"WalletOwner"> | string | null
    dailySwaps?: IntWithAggregatesFilter<"WalletOwner"> | number
    weeklySwaps?: IntWithAggregatesFilter<"WalletOwner"> | number
    monthlySwaps?: IntWithAggregatesFilter<"WalletOwner"> | number
    yearlySwaps?: IntWithAggregatesFilter<"WalletOwner"> | number
    createdAt?: DateTimeWithAggregatesFilter<"WalletOwner"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"WalletOwner"> | Date | string
  }

  export type SwapWhereInput = {
    AND?: SwapWhereInput | SwapWhereInput[]
    OR?: SwapWhereInput[]
    NOT?: SwapWhereInput | SwapWhereInput[]
    id?: StringFilter<"Swap"> | string
    fromTokenAddress?: StringFilter<"Swap"> | string
    toTokenAddress?: StringFilter<"Swap"> | string
    toWalletAddress?: StringFilter<"Swap"> | string
    buyAmount?: StringFilter<"Swap"> | string
    sellAmount?: StringFilter<"Swap"> | string
    transactionHash?: StringFilter<"Swap"> | string
    application?: StringNullableFilter<"Swap"> | string | null
    environment?: StringNullableFilter<"Swap"> | string | null
    walletOwnerId?: StringNullableFilter<"Swap"> | string | null
    createdAt?: DateTimeFilter<"Swap"> | Date | string
    updatedAt?: DateTimeFilter<"Swap"> | Date | string
    walletOwner?: XOR<WalletOwnerNullableScalarRelationFilter, WalletOwnerWhereInput> | null
  }

  export type SwapOrderByWithRelationInput = {
    id?: SortOrder
    fromTokenAddress?: SortOrder
    toTokenAddress?: SortOrder
    toWalletAddress?: SortOrder
    buyAmount?: SortOrder
    sellAmount?: SortOrder
    transactionHash?: SortOrder
    application?: SortOrderInput | SortOrder
    environment?: SortOrderInput | SortOrder
    walletOwnerId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    walletOwner?: WalletOwnerOrderByWithRelationInput
  }

  export type SwapWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SwapWhereInput | SwapWhereInput[]
    OR?: SwapWhereInput[]
    NOT?: SwapWhereInput | SwapWhereInput[]
    fromTokenAddress?: StringFilter<"Swap"> | string
    toTokenAddress?: StringFilter<"Swap"> | string
    toWalletAddress?: StringFilter<"Swap"> | string
    buyAmount?: StringFilter<"Swap"> | string
    sellAmount?: StringFilter<"Swap"> | string
    transactionHash?: StringFilter<"Swap"> | string
    application?: StringNullableFilter<"Swap"> | string | null
    environment?: StringNullableFilter<"Swap"> | string | null
    walletOwnerId?: StringNullableFilter<"Swap"> | string | null
    createdAt?: DateTimeFilter<"Swap"> | Date | string
    updatedAt?: DateTimeFilter<"Swap"> | Date | string
    walletOwner?: XOR<WalletOwnerNullableScalarRelationFilter, WalletOwnerWhereInput> | null
  }, "id">

  export type SwapOrderByWithAggregationInput = {
    id?: SortOrder
    fromTokenAddress?: SortOrder
    toTokenAddress?: SortOrder
    toWalletAddress?: SortOrder
    buyAmount?: SortOrder
    sellAmount?: SortOrder
    transactionHash?: SortOrder
    application?: SortOrderInput | SortOrder
    environment?: SortOrderInput | SortOrder
    walletOwnerId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SwapCountOrderByAggregateInput
    _max?: SwapMaxOrderByAggregateInput
    _min?: SwapMinOrderByAggregateInput
  }

  export type SwapScalarWhereWithAggregatesInput = {
    AND?: SwapScalarWhereWithAggregatesInput | SwapScalarWhereWithAggregatesInput[]
    OR?: SwapScalarWhereWithAggregatesInput[]
    NOT?: SwapScalarWhereWithAggregatesInput | SwapScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Swap"> | string
    fromTokenAddress?: StringWithAggregatesFilter<"Swap"> | string
    toTokenAddress?: StringWithAggregatesFilter<"Swap"> | string
    toWalletAddress?: StringWithAggregatesFilter<"Swap"> | string
    buyAmount?: StringWithAggregatesFilter<"Swap"> | string
    sellAmount?: StringWithAggregatesFilter<"Swap"> | string
    transactionHash?: StringWithAggregatesFilter<"Swap"> | string
    application?: StringNullableWithAggregatesFilter<"Swap"> | string | null
    environment?: StringNullableWithAggregatesFilter<"Swap"> | string | null
    walletOwnerId?: StringNullableWithAggregatesFilter<"Swap"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Swap"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Swap"> | Date | string
  }

  export type SwapErrorWhereInput = {
    AND?: SwapErrorWhereInput | SwapErrorWhereInput[]
    OR?: SwapErrorWhereInput[]
    NOT?: SwapErrorWhereInput | SwapErrorWhereInput[]
    id?: StringFilter<"SwapError"> | string
    message?: StringFilter<"SwapError"> | string
    walletOwnerId?: StringNullableFilter<"SwapError"> | string | null
    createdAt?: DateTimeFilter<"SwapError"> | Date | string
    updatedAt?: DateTimeFilter<"SwapError"> | Date | string
    walletOwner?: XOR<WalletOwnerNullableScalarRelationFilter, WalletOwnerWhereInput> | null
  }

  export type SwapErrorOrderByWithRelationInput = {
    id?: SortOrder
    message?: SortOrder
    walletOwnerId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    walletOwner?: WalletOwnerOrderByWithRelationInput
  }

  export type SwapErrorWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SwapErrorWhereInput | SwapErrorWhereInput[]
    OR?: SwapErrorWhereInput[]
    NOT?: SwapErrorWhereInput | SwapErrorWhereInput[]
    message?: StringFilter<"SwapError"> | string
    walletOwnerId?: StringNullableFilter<"SwapError"> | string | null
    createdAt?: DateTimeFilter<"SwapError"> | Date | string
    updatedAt?: DateTimeFilter<"SwapError"> | Date | string
    walletOwner?: XOR<WalletOwnerNullableScalarRelationFilter, WalletOwnerWhereInput> | null
  }, "id">

  export type SwapErrorOrderByWithAggregationInput = {
    id?: SortOrder
    message?: SortOrder
    walletOwnerId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SwapErrorCountOrderByAggregateInput
    _max?: SwapErrorMaxOrderByAggregateInput
    _min?: SwapErrorMinOrderByAggregateInput
  }

  export type SwapErrorScalarWhereWithAggregatesInput = {
    AND?: SwapErrorScalarWhereWithAggregatesInput | SwapErrorScalarWhereWithAggregatesInput[]
    OR?: SwapErrorScalarWhereWithAggregatesInput[]
    NOT?: SwapErrorScalarWhereWithAggregatesInput | SwapErrorScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"SwapError"> | string
    message?: StringWithAggregatesFilter<"SwapError"> | string
    walletOwnerId?: StringNullableWithAggregatesFilter<"SwapError"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"SwapError"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"SwapError"> | Date | string
  }

  export type WalletOwnerCreateInput = {
    id?: string
    walletAddress: string
    appConnectionId?: string | null
    appConnectionDescription?: string | null
    dailySwaps?: number
    weeklySwaps?: number
    monthlySwaps?: number
    yearlySwaps?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    swaps?: SwapCreateNestedManyWithoutWalletOwnerInput
    errors?: SwapErrorCreateNestedManyWithoutWalletOwnerInput
  }

  export type WalletOwnerUncheckedCreateInput = {
    id?: string
    walletAddress: string
    appConnectionId?: string | null
    appConnectionDescription?: string | null
    dailySwaps?: number
    weeklySwaps?: number
    monthlySwaps?: number
    yearlySwaps?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    swaps?: SwapUncheckedCreateNestedManyWithoutWalletOwnerInput
    errors?: SwapErrorUncheckedCreateNestedManyWithoutWalletOwnerInput
  }

  export type WalletOwnerUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    appConnectionId?: NullableStringFieldUpdateOperationsInput | string | null
    appConnectionDescription?: NullableStringFieldUpdateOperationsInput | string | null
    dailySwaps?: IntFieldUpdateOperationsInput | number
    weeklySwaps?: IntFieldUpdateOperationsInput | number
    monthlySwaps?: IntFieldUpdateOperationsInput | number
    yearlySwaps?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    swaps?: SwapUpdateManyWithoutWalletOwnerNestedInput
    errors?: SwapErrorUpdateManyWithoutWalletOwnerNestedInput
  }

  export type WalletOwnerUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    appConnectionId?: NullableStringFieldUpdateOperationsInput | string | null
    appConnectionDescription?: NullableStringFieldUpdateOperationsInput | string | null
    dailySwaps?: IntFieldUpdateOperationsInput | number
    weeklySwaps?: IntFieldUpdateOperationsInput | number
    monthlySwaps?: IntFieldUpdateOperationsInput | number
    yearlySwaps?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    swaps?: SwapUncheckedUpdateManyWithoutWalletOwnerNestedInput
    errors?: SwapErrorUncheckedUpdateManyWithoutWalletOwnerNestedInput
  }

  export type WalletOwnerCreateManyInput = {
    id?: string
    walletAddress: string
    appConnectionId?: string | null
    appConnectionDescription?: string | null
    dailySwaps?: number
    weeklySwaps?: number
    monthlySwaps?: number
    yearlySwaps?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WalletOwnerUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    appConnectionId?: NullableStringFieldUpdateOperationsInput | string | null
    appConnectionDescription?: NullableStringFieldUpdateOperationsInput | string | null
    dailySwaps?: IntFieldUpdateOperationsInput | number
    weeklySwaps?: IntFieldUpdateOperationsInput | number
    monthlySwaps?: IntFieldUpdateOperationsInput | number
    yearlySwaps?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WalletOwnerUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    appConnectionId?: NullableStringFieldUpdateOperationsInput | string | null
    appConnectionDescription?: NullableStringFieldUpdateOperationsInput | string | null
    dailySwaps?: IntFieldUpdateOperationsInput | number
    weeklySwaps?: IntFieldUpdateOperationsInput | number
    monthlySwaps?: IntFieldUpdateOperationsInput | number
    yearlySwaps?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SwapCreateInput = {
    id?: string
    fromTokenAddress: string
    toTokenAddress: string
    toWalletAddress: string
    buyAmount: string
    sellAmount: string
    transactionHash: string
    application?: string | null
    environment?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    walletOwner?: WalletOwnerCreateNestedOneWithoutSwapsInput
  }

  export type SwapUncheckedCreateInput = {
    id?: string
    fromTokenAddress: string
    toTokenAddress: string
    toWalletAddress: string
    buyAmount: string
    sellAmount: string
    transactionHash: string
    application?: string | null
    environment?: string | null
    walletOwnerId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SwapUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    fromTokenAddress?: StringFieldUpdateOperationsInput | string
    toTokenAddress?: StringFieldUpdateOperationsInput | string
    toWalletAddress?: StringFieldUpdateOperationsInput | string
    buyAmount?: StringFieldUpdateOperationsInput | string
    sellAmount?: StringFieldUpdateOperationsInput | string
    transactionHash?: StringFieldUpdateOperationsInput | string
    application?: NullableStringFieldUpdateOperationsInput | string | null
    environment?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    walletOwner?: WalletOwnerUpdateOneWithoutSwapsNestedInput
  }

  export type SwapUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    fromTokenAddress?: StringFieldUpdateOperationsInput | string
    toTokenAddress?: StringFieldUpdateOperationsInput | string
    toWalletAddress?: StringFieldUpdateOperationsInput | string
    buyAmount?: StringFieldUpdateOperationsInput | string
    sellAmount?: StringFieldUpdateOperationsInput | string
    transactionHash?: StringFieldUpdateOperationsInput | string
    application?: NullableStringFieldUpdateOperationsInput | string | null
    environment?: NullableStringFieldUpdateOperationsInput | string | null
    walletOwnerId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SwapCreateManyInput = {
    id?: string
    fromTokenAddress: string
    toTokenAddress: string
    toWalletAddress: string
    buyAmount: string
    sellAmount: string
    transactionHash: string
    application?: string | null
    environment?: string | null
    walletOwnerId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SwapUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    fromTokenAddress?: StringFieldUpdateOperationsInput | string
    toTokenAddress?: StringFieldUpdateOperationsInput | string
    toWalletAddress?: StringFieldUpdateOperationsInput | string
    buyAmount?: StringFieldUpdateOperationsInput | string
    sellAmount?: StringFieldUpdateOperationsInput | string
    transactionHash?: StringFieldUpdateOperationsInput | string
    application?: NullableStringFieldUpdateOperationsInput | string | null
    environment?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SwapUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    fromTokenAddress?: StringFieldUpdateOperationsInput | string
    toTokenAddress?: StringFieldUpdateOperationsInput | string
    toWalletAddress?: StringFieldUpdateOperationsInput | string
    buyAmount?: StringFieldUpdateOperationsInput | string
    sellAmount?: StringFieldUpdateOperationsInput | string
    transactionHash?: StringFieldUpdateOperationsInput | string
    application?: NullableStringFieldUpdateOperationsInput | string | null
    environment?: NullableStringFieldUpdateOperationsInput | string | null
    walletOwnerId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SwapErrorCreateInput = {
    id?: string
    message: string
    createdAt?: Date | string
    updatedAt?: Date | string
    walletOwner?: WalletOwnerCreateNestedOneWithoutErrorsInput
  }

  export type SwapErrorUncheckedCreateInput = {
    id?: string
    message: string
    walletOwnerId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SwapErrorUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    walletOwner?: WalletOwnerUpdateOneWithoutErrorsNestedInput
  }

  export type SwapErrorUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    walletOwnerId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SwapErrorCreateManyInput = {
    id?: string
    message: string
    walletOwnerId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SwapErrorUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SwapErrorUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    walletOwnerId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type SwapListRelationFilter = {
    every?: SwapWhereInput
    some?: SwapWhereInput
    none?: SwapWhereInput
  }

  export type SwapErrorListRelationFilter = {
    every?: SwapErrorWhereInput
    some?: SwapErrorWhereInput
    none?: SwapErrorWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type SwapOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SwapErrorOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type WalletOwnerCountOrderByAggregateInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    appConnectionId?: SortOrder
    appConnectionDescription?: SortOrder
    dailySwaps?: SortOrder
    weeklySwaps?: SortOrder
    monthlySwaps?: SortOrder
    yearlySwaps?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WalletOwnerAvgOrderByAggregateInput = {
    dailySwaps?: SortOrder
    weeklySwaps?: SortOrder
    monthlySwaps?: SortOrder
    yearlySwaps?: SortOrder
  }

  export type WalletOwnerMaxOrderByAggregateInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    appConnectionId?: SortOrder
    appConnectionDescription?: SortOrder
    dailySwaps?: SortOrder
    weeklySwaps?: SortOrder
    monthlySwaps?: SortOrder
    yearlySwaps?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WalletOwnerMinOrderByAggregateInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    appConnectionId?: SortOrder
    appConnectionDescription?: SortOrder
    dailySwaps?: SortOrder
    weeklySwaps?: SortOrder
    monthlySwaps?: SortOrder
    yearlySwaps?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WalletOwnerSumOrderByAggregateInput = {
    dailySwaps?: SortOrder
    weeklySwaps?: SortOrder
    monthlySwaps?: SortOrder
    yearlySwaps?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type WalletOwnerNullableScalarRelationFilter = {
    is?: WalletOwnerWhereInput | null
    isNot?: WalletOwnerWhereInput | null
  }

  export type SwapCountOrderByAggregateInput = {
    id?: SortOrder
    fromTokenAddress?: SortOrder
    toTokenAddress?: SortOrder
    toWalletAddress?: SortOrder
    buyAmount?: SortOrder
    sellAmount?: SortOrder
    transactionHash?: SortOrder
    application?: SortOrder
    environment?: SortOrder
    walletOwnerId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SwapMaxOrderByAggregateInput = {
    id?: SortOrder
    fromTokenAddress?: SortOrder
    toTokenAddress?: SortOrder
    toWalletAddress?: SortOrder
    buyAmount?: SortOrder
    sellAmount?: SortOrder
    transactionHash?: SortOrder
    application?: SortOrder
    environment?: SortOrder
    walletOwnerId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SwapMinOrderByAggregateInput = {
    id?: SortOrder
    fromTokenAddress?: SortOrder
    toTokenAddress?: SortOrder
    toWalletAddress?: SortOrder
    buyAmount?: SortOrder
    sellAmount?: SortOrder
    transactionHash?: SortOrder
    application?: SortOrder
    environment?: SortOrder
    walletOwnerId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SwapErrorCountOrderByAggregateInput = {
    id?: SortOrder
    message?: SortOrder
    walletOwnerId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SwapErrorMaxOrderByAggregateInput = {
    id?: SortOrder
    message?: SortOrder
    walletOwnerId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SwapErrorMinOrderByAggregateInput = {
    id?: SortOrder
    message?: SortOrder
    walletOwnerId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SwapCreateNestedManyWithoutWalletOwnerInput = {
    create?: XOR<SwapCreateWithoutWalletOwnerInput, SwapUncheckedCreateWithoutWalletOwnerInput> | SwapCreateWithoutWalletOwnerInput[] | SwapUncheckedCreateWithoutWalletOwnerInput[]
    connectOrCreate?: SwapCreateOrConnectWithoutWalletOwnerInput | SwapCreateOrConnectWithoutWalletOwnerInput[]
    createMany?: SwapCreateManyWalletOwnerInputEnvelope
    connect?: SwapWhereUniqueInput | SwapWhereUniqueInput[]
  }

  export type SwapErrorCreateNestedManyWithoutWalletOwnerInput = {
    create?: XOR<SwapErrorCreateWithoutWalletOwnerInput, SwapErrorUncheckedCreateWithoutWalletOwnerInput> | SwapErrorCreateWithoutWalletOwnerInput[] | SwapErrorUncheckedCreateWithoutWalletOwnerInput[]
    connectOrCreate?: SwapErrorCreateOrConnectWithoutWalletOwnerInput | SwapErrorCreateOrConnectWithoutWalletOwnerInput[]
    createMany?: SwapErrorCreateManyWalletOwnerInputEnvelope
    connect?: SwapErrorWhereUniqueInput | SwapErrorWhereUniqueInput[]
  }

  export type SwapUncheckedCreateNestedManyWithoutWalletOwnerInput = {
    create?: XOR<SwapCreateWithoutWalletOwnerInput, SwapUncheckedCreateWithoutWalletOwnerInput> | SwapCreateWithoutWalletOwnerInput[] | SwapUncheckedCreateWithoutWalletOwnerInput[]
    connectOrCreate?: SwapCreateOrConnectWithoutWalletOwnerInput | SwapCreateOrConnectWithoutWalletOwnerInput[]
    createMany?: SwapCreateManyWalletOwnerInputEnvelope
    connect?: SwapWhereUniqueInput | SwapWhereUniqueInput[]
  }

  export type SwapErrorUncheckedCreateNestedManyWithoutWalletOwnerInput = {
    create?: XOR<SwapErrorCreateWithoutWalletOwnerInput, SwapErrorUncheckedCreateWithoutWalletOwnerInput> | SwapErrorCreateWithoutWalletOwnerInput[] | SwapErrorUncheckedCreateWithoutWalletOwnerInput[]
    connectOrCreate?: SwapErrorCreateOrConnectWithoutWalletOwnerInput | SwapErrorCreateOrConnectWithoutWalletOwnerInput[]
    createMany?: SwapErrorCreateManyWalletOwnerInputEnvelope
    connect?: SwapErrorWhereUniqueInput | SwapErrorWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type SwapUpdateManyWithoutWalletOwnerNestedInput = {
    create?: XOR<SwapCreateWithoutWalletOwnerInput, SwapUncheckedCreateWithoutWalletOwnerInput> | SwapCreateWithoutWalletOwnerInput[] | SwapUncheckedCreateWithoutWalletOwnerInput[]
    connectOrCreate?: SwapCreateOrConnectWithoutWalletOwnerInput | SwapCreateOrConnectWithoutWalletOwnerInput[]
    upsert?: SwapUpsertWithWhereUniqueWithoutWalletOwnerInput | SwapUpsertWithWhereUniqueWithoutWalletOwnerInput[]
    createMany?: SwapCreateManyWalletOwnerInputEnvelope
    set?: SwapWhereUniqueInput | SwapWhereUniqueInput[]
    disconnect?: SwapWhereUniqueInput | SwapWhereUniqueInput[]
    delete?: SwapWhereUniqueInput | SwapWhereUniqueInput[]
    connect?: SwapWhereUniqueInput | SwapWhereUniqueInput[]
    update?: SwapUpdateWithWhereUniqueWithoutWalletOwnerInput | SwapUpdateWithWhereUniqueWithoutWalletOwnerInput[]
    updateMany?: SwapUpdateManyWithWhereWithoutWalletOwnerInput | SwapUpdateManyWithWhereWithoutWalletOwnerInput[]
    deleteMany?: SwapScalarWhereInput | SwapScalarWhereInput[]
  }

  export type SwapErrorUpdateManyWithoutWalletOwnerNestedInput = {
    create?: XOR<SwapErrorCreateWithoutWalletOwnerInput, SwapErrorUncheckedCreateWithoutWalletOwnerInput> | SwapErrorCreateWithoutWalletOwnerInput[] | SwapErrorUncheckedCreateWithoutWalletOwnerInput[]
    connectOrCreate?: SwapErrorCreateOrConnectWithoutWalletOwnerInput | SwapErrorCreateOrConnectWithoutWalletOwnerInput[]
    upsert?: SwapErrorUpsertWithWhereUniqueWithoutWalletOwnerInput | SwapErrorUpsertWithWhereUniqueWithoutWalletOwnerInput[]
    createMany?: SwapErrorCreateManyWalletOwnerInputEnvelope
    set?: SwapErrorWhereUniqueInput | SwapErrorWhereUniqueInput[]
    disconnect?: SwapErrorWhereUniqueInput | SwapErrorWhereUniqueInput[]
    delete?: SwapErrorWhereUniqueInput | SwapErrorWhereUniqueInput[]
    connect?: SwapErrorWhereUniqueInput | SwapErrorWhereUniqueInput[]
    update?: SwapErrorUpdateWithWhereUniqueWithoutWalletOwnerInput | SwapErrorUpdateWithWhereUniqueWithoutWalletOwnerInput[]
    updateMany?: SwapErrorUpdateManyWithWhereWithoutWalletOwnerInput | SwapErrorUpdateManyWithWhereWithoutWalletOwnerInput[]
    deleteMany?: SwapErrorScalarWhereInput | SwapErrorScalarWhereInput[]
  }

  export type SwapUncheckedUpdateManyWithoutWalletOwnerNestedInput = {
    create?: XOR<SwapCreateWithoutWalletOwnerInput, SwapUncheckedCreateWithoutWalletOwnerInput> | SwapCreateWithoutWalletOwnerInput[] | SwapUncheckedCreateWithoutWalletOwnerInput[]
    connectOrCreate?: SwapCreateOrConnectWithoutWalletOwnerInput | SwapCreateOrConnectWithoutWalletOwnerInput[]
    upsert?: SwapUpsertWithWhereUniqueWithoutWalletOwnerInput | SwapUpsertWithWhereUniqueWithoutWalletOwnerInput[]
    createMany?: SwapCreateManyWalletOwnerInputEnvelope
    set?: SwapWhereUniqueInput | SwapWhereUniqueInput[]
    disconnect?: SwapWhereUniqueInput | SwapWhereUniqueInput[]
    delete?: SwapWhereUniqueInput | SwapWhereUniqueInput[]
    connect?: SwapWhereUniqueInput | SwapWhereUniqueInput[]
    update?: SwapUpdateWithWhereUniqueWithoutWalletOwnerInput | SwapUpdateWithWhereUniqueWithoutWalletOwnerInput[]
    updateMany?: SwapUpdateManyWithWhereWithoutWalletOwnerInput | SwapUpdateManyWithWhereWithoutWalletOwnerInput[]
    deleteMany?: SwapScalarWhereInput | SwapScalarWhereInput[]
  }

  export type SwapErrorUncheckedUpdateManyWithoutWalletOwnerNestedInput = {
    create?: XOR<SwapErrorCreateWithoutWalletOwnerInput, SwapErrorUncheckedCreateWithoutWalletOwnerInput> | SwapErrorCreateWithoutWalletOwnerInput[] | SwapErrorUncheckedCreateWithoutWalletOwnerInput[]
    connectOrCreate?: SwapErrorCreateOrConnectWithoutWalletOwnerInput | SwapErrorCreateOrConnectWithoutWalletOwnerInput[]
    upsert?: SwapErrorUpsertWithWhereUniqueWithoutWalletOwnerInput | SwapErrorUpsertWithWhereUniqueWithoutWalletOwnerInput[]
    createMany?: SwapErrorCreateManyWalletOwnerInputEnvelope
    set?: SwapErrorWhereUniqueInput | SwapErrorWhereUniqueInput[]
    disconnect?: SwapErrorWhereUniqueInput | SwapErrorWhereUniqueInput[]
    delete?: SwapErrorWhereUniqueInput | SwapErrorWhereUniqueInput[]
    connect?: SwapErrorWhereUniqueInput | SwapErrorWhereUniqueInput[]
    update?: SwapErrorUpdateWithWhereUniqueWithoutWalletOwnerInput | SwapErrorUpdateWithWhereUniqueWithoutWalletOwnerInput[]
    updateMany?: SwapErrorUpdateManyWithWhereWithoutWalletOwnerInput | SwapErrorUpdateManyWithWhereWithoutWalletOwnerInput[]
    deleteMany?: SwapErrorScalarWhereInput | SwapErrorScalarWhereInput[]
  }

  export type WalletOwnerCreateNestedOneWithoutSwapsInput = {
    create?: XOR<WalletOwnerCreateWithoutSwapsInput, WalletOwnerUncheckedCreateWithoutSwapsInput>
    connectOrCreate?: WalletOwnerCreateOrConnectWithoutSwapsInput
    connect?: WalletOwnerWhereUniqueInput
  }

  export type WalletOwnerUpdateOneWithoutSwapsNestedInput = {
    create?: XOR<WalletOwnerCreateWithoutSwapsInput, WalletOwnerUncheckedCreateWithoutSwapsInput>
    connectOrCreate?: WalletOwnerCreateOrConnectWithoutSwapsInput
    upsert?: WalletOwnerUpsertWithoutSwapsInput
    disconnect?: WalletOwnerWhereInput | boolean
    delete?: WalletOwnerWhereInput | boolean
    connect?: WalletOwnerWhereUniqueInput
    update?: XOR<XOR<WalletOwnerUpdateToOneWithWhereWithoutSwapsInput, WalletOwnerUpdateWithoutSwapsInput>, WalletOwnerUncheckedUpdateWithoutSwapsInput>
  }

  export type WalletOwnerCreateNestedOneWithoutErrorsInput = {
    create?: XOR<WalletOwnerCreateWithoutErrorsInput, WalletOwnerUncheckedCreateWithoutErrorsInput>
    connectOrCreate?: WalletOwnerCreateOrConnectWithoutErrorsInput
    connect?: WalletOwnerWhereUniqueInput
  }

  export type WalletOwnerUpdateOneWithoutErrorsNestedInput = {
    create?: XOR<WalletOwnerCreateWithoutErrorsInput, WalletOwnerUncheckedCreateWithoutErrorsInput>
    connectOrCreate?: WalletOwnerCreateOrConnectWithoutErrorsInput
    upsert?: WalletOwnerUpsertWithoutErrorsInput
    disconnect?: WalletOwnerWhereInput | boolean
    delete?: WalletOwnerWhereInput | boolean
    connect?: WalletOwnerWhereUniqueInput
    update?: XOR<XOR<WalletOwnerUpdateToOneWithWhereWithoutErrorsInput, WalletOwnerUpdateWithoutErrorsInput>, WalletOwnerUncheckedUpdateWithoutErrorsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type SwapCreateWithoutWalletOwnerInput = {
    id?: string
    fromTokenAddress: string
    toTokenAddress: string
    toWalletAddress: string
    buyAmount: string
    sellAmount: string
    transactionHash: string
    application?: string | null
    environment?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SwapUncheckedCreateWithoutWalletOwnerInput = {
    id?: string
    fromTokenAddress: string
    toTokenAddress: string
    toWalletAddress: string
    buyAmount: string
    sellAmount: string
    transactionHash: string
    application?: string | null
    environment?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SwapCreateOrConnectWithoutWalletOwnerInput = {
    where: SwapWhereUniqueInput
    create: XOR<SwapCreateWithoutWalletOwnerInput, SwapUncheckedCreateWithoutWalletOwnerInput>
  }

  export type SwapCreateManyWalletOwnerInputEnvelope = {
    data: SwapCreateManyWalletOwnerInput | SwapCreateManyWalletOwnerInput[]
    skipDuplicates?: boolean
  }

  export type SwapErrorCreateWithoutWalletOwnerInput = {
    id?: string
    message: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SwapErrorUncheckedCreateWithoutWalletOwnerInput = {
    id?: string
    message: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SwapErrorCreateOrConnectWithoutWalletOwnerInput = {
    where: SwapErrorWhereUniqueInput
    create: XOR<SwapErrorCreateWithoutWalletOwnerInput, SwapErrorUncheckedCreateWithoutWalletOwnerInput>
  }

  export type SwapErrorCreateManyWalletOwnerInputEnvelope = {
    data: SwapErrorCreateManyWalletOwnerInput | SwapErrorCreateManyWalletOwnerInput[]
    skipDuplicates?: boolean
  }

  export type SwapUpsertWithWhereUniqueWithoutWalletOwnerInput = {
    where: SwapWhereUniqueInput
    update: XOR<SwapUpdateWithoutWalletOwnerInput, SwapUncheckedUpdateWithoutWalletOwnerInput>
    create: XOR<SwapCreateWithoutWalletOwnerInput, SwapUncheckedCreateWithoutWalletOwnerInput>
  }

  export type SwapUpdateWithWhereUniqueWithoutWalletOwnerInput = {
    where: SwapWhereUniqueInput
    data: XOR<SwapUpdateWithoutWalletOwnerInput, SwapUncheckedUpdateWithoutWalletOwnerInput>
  }

  export type SwapUpdateManyWithWhereWithoutWalletOwnerInput = {
    where: SwapScalarWhereInput
    data: XOR<SwapUpdateManyMutationInput, SwapUncheckedUpdateManyWithoutWalletOwnerInput>
  }

  export type SwapScalarWhereInput = {
    AND?: SwapScalarWhereInput | SwapScalarWhereInput[]
    OR?: SwapScalarWhereInput[]
    NOT?: SwapScalarWhereInput | SwapScalarWhereInput[]
    id?: StringFilter<"Swap"> | string
    fromTokenAddress?: StringFilter<"Swap"> | string
    toTokenAddress?: StringFilter<"Swap"> | string
    toWalletAddress?: StringFilter<"Swap"> | string
    buyAmount?: StringFilter<"Swap"> | string
    sellAmount?: StringFilter<"Swap"> | string
    transactionHash?: StringFilter<"Swap"> | string
    application?: StringNullableFilter<"Swap"> | string | null
    environment?: StringNullableFilter<"Swap"> | string | null
    walletOwnerId?: StringNullableFilter<"Swap"> | string | null
    createdAt?: DateTimeFilter<"Swap"> | Date | string
    updatedAt?: DateTimeFilter<"Swap"> | Date | string
  }

  export type SwapErrorUpsertWithWhereUniqueWithoutWalletOwnerInput = {
    where: SwapErrorWhereUniqueInput
    update: XOR<SwapErrorUpdateWithoutWalletOwnerInput, SwapErrorUncheckedUpdateWithoutWalletOwnerInput>
    create: XOR<SwapErrorCreateWithoutWalletOwnerInput, SwapErrorUncheckedCreateWithoutWalletOwnerInput>
  }

  export type SwapErrorUpdateWithWhereUniqueWithoutWalletOwnerInput = {
    where: SwapErrorWhereUniqueInput
    data: XOR<SwapErrorUpdateWithoutWalletOwnerInput, SwapErrorUncheckedUpdateWithoutWalletOwnerInput>
  }

  export type SwapErrorUpdateManyWithWhereWithoutWalletOwnerInput = {
    where: SwapErrorScalarWhereInput
    data: XOR<SwapErrorUpdateManyMutationInput, SwapErrorUncheckedUpdateManyWithoutWalletOwnerInput>
  }

  export type SwapErrorScalarWhereInput = {
    AND?: SwapErrorScalarWhereInput | SwapErrorScalarWhereInput[]
    OR?: SwapErrorScalarWhereInput[]
    NOT?: SwapErrorScalarWhereInput | SwapErrorScalarWhereInput[]
    id?: StringFilter<"SwapError"> | string
    message?: StringFilter<"SwapError"> | string
    walletOwnerId?: StringNullableFilter<"SwapError"> | string | null
    createdAt?: DateTimeFilter<"SwapError"> | Date | string
    updatedAt?: DateTimeFilter<"SwapError"> | Date | string
  }

  export type WalletOwnerCreateWithoutSwapsInput = {
    id?: string
    walletAddress: string
    appConnectionId?: string | null
    appConnectionDescription?: string | null
    dailySwaps?: number
    weeklySwaps?: number
    monthlySwaps?: number
    yearlySwaps?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    errors?: SwapErrorCreateNestedManyWithoutWalletOwnerInput
  }

  export type WalletOwnerUncheckedCreateWithoutSwapsInput = {
    id?: string
    walletAddress: string
    appConnectionId?: string | null
    appConnectionDescription?: string | null
    dailySwaps?: number
    weeklySwaps?: number
    monthlySwaps?: number
    yearlySwaps?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    errors?: SwapErrorUncheckedCreateNestedManyWithoutWalletOwnerInput
  }

  export type WalletOwnerCreateOrConnectWithoutSwapsInput = {
    where: WalletOwnerWhereUniqueInput
    create: XOR<WalletOwnerCreateWithoutSwapsInput, WalletOwnerUncheckedCreateWithoutSwapsInput>
  }

  export type WalletOwnerUpsertWithoutSwapsInput = {
    update: XOR<WalletOwnerUpdateWithoutSwapsInput, WalletOwnerUncheckedUpdateWithoutSwapsInput>
    create: XOR<WalletOwnerCreateWithoutSwapsInput, WalletOwnerUncheckedCreateWithoutSwapsInput>
    where?: WalletOwnerWhereInput
  }

  export type WalletOwnerUpdateToOneWithWhereWithoutSwapsInput = {
    where?: WalletOwnerWhereInput
    data: XOR<WalletOwnerUpdateWithoutSwapsInput, WalletOwnerUncheckedUpdateWithoutSwapsInput>
  }

  export type WalletOwnerUpdateWithoutSwapsInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    appConnectionId?: NullableStringFieldUpdateOperationsInput | string | null
    appConnectionDescription?: NullableStringFieldUpdateOperationsInput | string | null
    dailySwaps?: IntFieldUpdateOperationsInput | number
    weeklySwaps?: IntFieldUpdateOperationsInput | number
    monthlySwaps?: IntFieldUpdateOperationsInput | number
    yearlySwaps?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    errors?: SwapErrorUpdateManyWithoutWalletOwnerNestedInput
  }

  export type WalletOwnerUncheckedUpdateWithoutSwapsInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    appConnectionId?: NullableStringFieldUpdateOperationsInput | string | null
    appConnectionDescription?: NullableStringFieldUpdateOperationsInput | string | null
    dailySwaps?: IntFieldUpdateOperationsInput | number
    weeklySwaps?: IntFieldUpdateOperationsInput | number
    monthlySwaps?: IntFieldUpdateOperationsInput | number
    yearlySwaps?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    errors?: SwapErrorUncheckedUpdateManyWithoutWalletOwnerNestedInput
  }

  export type WalletOwnerCreateWithoutErrorsInput = {
    id?: string
    walletAddress: string
    appConnectionId?: string | null
    appConnectionDescription?: string | null
    dailySwaps?: number
    weeklySwaps?: number
    monthlySwaps?: number
    yearlySwaps?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    swaps?: SwapCreateNestedManyWithoutWalletOwnerInput
  }

  export type WalletOwnerUncheckedCreateWithoutErrorsInput = {
    id?: string
    walletAddress: string
    appConnectionId?: string | null
    appConnectionDescription?: string | null
    dailySwaps?: number
    weeklySwaps?: number
    monthlySwaps?: number
    yearlySwaps?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    swaps?: SwapUncheckedCreateNestedManyWithoutWalletOwnerInput
  }

  export type WalletOwnerCreateOrConnectWithoutErrorsInput = {
    where: WalletOwnerWhereUniqueInput
    create: XOR<WalletOwnerCreateWithoutErrorsInput, WalletOwnerUncheckedCreateWithoutErrorsInput>
  }

  export type WalletOwnerUpsertWithoutErrorsInput = {
    update: XOR<WalletOwnerUpdateWithoutErrorsInput, WalletOwnerUncheckedUpdateWithoutErrorsInput>
    create: XOR<WalletOwnerCreateWithoutErrorsInput, WalletOwnerUncheckedCreateWithoutErrorsInput>
    where?: WalletOwnerWhereInput
  }

  export type WalletOwnerUpdateToOneWithWhereWithoutErrorsInput = {
    where?: WalletOwnerWhereInput
    data: XOR<WalletOwnerUpdateWithoutErrorsInput, WalletOwnerUncheckedUpdateWithoutErrorsInput>
  }

  export type WalletOwnerUpdateWithoutErrorsInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    appConnectionId?: NullableStringFieldUpdateOperationsInput | string | null
    appConnectionDescription?: NullableStringFieldUpdateOperationsInput | string | null
    dailySwaps?: IntFieldUpdateOperationsInput | number
    weeklySwaps?: IntFieldUpdateOperationsInput | number
    monthlySwaps?: IntFieldUpdateOperationsInput | number
    yearlySwaps?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    swaps?: SwapUpdateManyWithoutWalletOwnerNestedInput
  }

  export type WalletOwnerUncheckedUpdateWithoutErrorsInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    appConnectionId?: NullableStringFieldUpdateOperationsInput | string | null
    appConnectionDescription?: NullableStringFieldUpdateOperationsInput | string | null
    dailySwaps?: IntFieldUpdateOperationsInput | number
    weeklySwaps?: IntFieldUpdateOperationsInput | number
    monthlySwaps?: IntFieldUpdateOperationsInput | number
    yearlySwaps?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    swaps?: SwapUncheckedUpdateManyWithoutWalletOwnerNestedInput
  }

  export type SwapCreateManyWalletOwnerInput = {
    id?: string
    fromTokenAddress: string
    toTokenAddress: string
    toWalletAddress: string
    buyAmount: string
    sellAmount: string
    transactionHash: string
    application?: string | null
    environment?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SwapErrorCreateManyWalletOwnerInput = {
    id?: string
    message: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SwapUpdateWithoutWalletOwnerInput = {
    id?: StringFieldUpdateOperationsInput | string
    fromTokenAddress?: StringFieldUpdateOperationsInput | string
    toTokenAddress?: StringFieldUpdateOperationsInput | string
    toWalletAddress?: StringFieldUpdateOperationsInput | string
    buyAmount?: StringFieldUpdateOperationsInput | string
    sellAmount?: StringFieldUpdateOperationsInput | string
    transactionHash?: StringFieldUpdateOperationsInput | string
    application?: NullableStringFieldUpdateOperationsInput | string | null
    environment?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SwapUncheckedUpdateWithoutWalletOwnerInput = {
    id?: StringFieldUpdateOperationsInput | string
    fromTokenAddress?: StringFieldUpdateOperationsInput | string
    toTokenAddress?: StringFieldUpdateOperationsInput | string
    toWalletAddress?: StringFieldUpdateOperationsInput | string
    buyAmount?: StringFieldUpdateOperationsInput | string
    sellAmount?: StringFieldUpdateOperationsInput | string
    transactionHash?: StringFieldUpdateOperationsInput | string
    application?: NullableStringFieldUpdateOperationsInput | string | null
    environment?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SwapUncheckedUpdateManyWithoutWalletOwnerInput = {
    id?: StringFieldUpdateOperationsInput | string
    fromTokenAddress?: StringFieldUpdateOperationsInput | string
    toTokenAddress?: StringFieldUpdateOperationsInput | string
    toWalletAddress?: StringFieldUpdateOperationsInput | string
    buyAmount?: StringFieldUpdateOperationsInput | string
    sellAmount?: StringFieldUpdateOperationsInput | string
    transactionHash?: StringFieldUpdateOperationsInput | string
    application?: NullableStringFieldUpdateOperationsInput | string | null
    environment?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SwapErrorUpdateWithoutWalletOwnerInput = {
    id?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SwapErrorUncheckedUpdateWithoutWalletOwnerInput = {
    id?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SwapErrorUncheckedUpdateManyWithoutWalletOwnerInput = {
    id?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}