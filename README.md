# dsl-test

A major part of the Datavore application is the ability to represent a data manipulation and analytics process in a way that can be manipulated and reasoned about in different contexts. This is a toy example, exploring ideas in client side execution of an example representation.

Your mission, if you choose to accept it, is to solve the example problem. The notes below outline the problem structure, expected results, and how to test your solution.


## Project goals and spec
An [abstract syntax tree](https://www.wikiwand.com/en/Abstract_syntax_tree) representation of a program is given.

In the context of an AST, we use "interest" to express desire for output or information about a certain node in the tree. It can be any node -- a leaf, the root, or an intermediary node.

Given an AST for a specific language and interest in the result of specific nodes, the task is to generate an optimized plan and execute it, resulting in the interested values.


For example, if we had the expression `2 + 2` which could be represented as:
```
  +
 / \
2   2
```
"Interest" in either `2` node would be the literal value, `2`. Interest in the `+` node itself would be the function associated with `+`, and interest in the entire tree would expect `4` -- the result of "evaluating the subtree" (assuming `+` is `(a, b) => a + b`).


### The dsl specification
The dsl is composed of JavaScript objects.

The shapes of dsl nodes are: `Block`, `Function`, `Literal`, `Assignment`, `Identifier`, and `Array`.

The documentation and properties of each shape are defined in [`./src/dsl.js`](src/dsl.js).

General notes on Javascript syntax are located in [`./docs/syntax.md`](docs/syntax.md).

### Execution rules
A `block` is a unique node in that it defines a `scope`.
+ Every node in a `block`'s `nodes` property falls inside that block's scope.
+ Every binding in a `block`'s `bindings` property is available

A `scope` is a way of the language to contain assignment definitions and bindings.
`scopes` have a parent-child relationship, where child scopes inherit from and shadow bindings from parent scopes.

Example:
```js
dsl.block({ a: '10', b: -5 }, [
  dsl.id('a'), // resolves to the string: '10'
  dsl.id('b'), // resolves to the number: -5
  dsl.block({ a: 3.141589 }, [
    dsl.id('a'), // resolves to the number: 3.141589, as this block's bindings shadow the parent
    dsl.id('b'), // resolves to the number: -5, as this block inheirts from its parent
  ])
])
```

The execution rules for the dsl nodes are:
* `Block` - If a block itself is executed, only the last line of the block is run.
* `Assignment` - Can only occur as a direct child of a `block`. Defines a reference-able value, `name` that takes on the result of executing `value`.
* `Array` - Every element in the `nodes` of an array are executed.
* `Function` - The callee and args are executed, then the result of the args are applied to the result of the callee.
* `Literal` - A literal simply returns its own value
* `Identifier` - An identifier returns the value that is bound to it, defined by the scope it is in.


### Your task
Write a function that, given a full AST and interest in the result of a set of nodes, determines an optimal execution path and executes the result. Your code must validate against the tests included in this repository (see [Project Setup](#project-setup) below).

Your code will have to deal with:
+ The execution rules of the DSL
+ Handle failure cases gracefully
+ Produce an optimized execution plan given interest
+ Correctly resolve identifiers through scopes

##### One example
```js
// NOTE: ids here are for tracking, in reality the ids would be much different!

const ast = dsl.block({
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
}, [
  // x = 2 + 2, id: 0
  dsl.assign('x', dsl.fn(dsl.id('+'), [
    dsl.lit(2), dsl.lit(2)
  ])),
  // y = x - 5, id: 1
  dsl.assign('y', dsl.fn(dsl.id('-'), [
    dsl.id('x'), dsl.lit(5)
  ])),
  // dsl block id: 2
  dsl.block({}, [
    dsl.assign('x', dsl.lit(25)),
    dsl.fn(dsl.id('+'), [
      dsl.id('x'), dsl.id('x')
    ])
  ]),
  // dsl block id: 3
  dsl.fn(dsl.id('+'), [
    dsl.id('x') + dsl.id('x')
  ]),
]);

// Execute the anonymous block and the last node:
const results = run(ast, [2, 3]);

// Of note: the y = x - 5 line should never be run in this execution
const expected = {
  '2': 50, // block's x assignment shadows the parent
  '3': 8, // this node is inside the parent block, and does not see the inner x
};
```

## Project setup

### General notes
+ All work should be completed in a fork of this repository.
+ Your main function will be written in the [`./src/runner.js`](src/runner.js) file. You may import other files/modules into this file as needed.
+ The task is considered completed when all tests run on the command line with `npm test` pass.

### Node.js
+ Install node.js we love using [nvm](https://github.com/creationix/nvm) to mange node versions
+ Install project dependencies `npm install`
+ Run the unit tests to make sure it worked `npm test`

### Webstorm
If you don't have a favorite editor I suggest webstorm setup as follows
+ Install [webstorm](https://www.jetbrains.com/webstorm/download)
+ Open webstorm and `file > open...` this projects directory
+ Setup es6 - `file > settings > Languages and Frameworks > Javascript` from the dropdown choose `ECMAScript 6`
+ Setup linter - `file > settings` in the search bar type `eslint` in the menu that comes up check the `enable` box at the top

### Useful commands

Install the project dependencies
```
npm install
```

Lint the code and run the tests on the commandline
```
npm test // lint and run tests
```

Start a development server and run the tests in the browser (useful for debugging)
```
npm run test-web
open localhost:8080/test.bundle // the tests are now running here
```
