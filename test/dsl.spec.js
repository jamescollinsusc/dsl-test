import { assert } from 'chai';
import { dsl } from '../src/dsl';
import { run } from '../src/runner';

describe('Dsl', () => {
	it('gives correct execution for the readme example', () => {
		const ast = dsl.block({
			'+': (a, b) => a + b,
			'-': (a, b) => a - b,
		}, [
			// x = 2 + 2, id: 4
			dsl.assign('x', dsl.fn(dsl.id('+'), [
				dsl.lit(2), dsl.lit(2),
			])),
			// y = x * x, id: 9
			dsl.assign('y', dsl.fn(dsl.id('-'), [
				dsl.id('x'), dsl.lit(5),
			])),
			// dsl block id: 16
			dsl.block({}, [
				dsl.assign('x', dsl.lit(25)),
				dsl.fn(dsl.id('+'), [
					dsl.id('x'), dsl.id('x'),
				]),
			]),
			// dsl block id: 20
			dsl.fn(dsl.id('+'), [
				dsl.id('x'), dsl.id('x'),
			]),
		]);

		// Execute the anonymous block and the last node:
		const results = run(ast, [
			ast.nodes[2].id,
			ast.nodes[3].id,
		]);

		const expected = {
			[ast.nodes[2].id]: 50,
			[ast.nodes[3].id]: 8,
		};

		assert.deepEqual(results, expected, 'Run yields correct values for the interested nodes');
	});

	it('can run each type of node', () => {
		const ast = dsl.block({
			'+': (a, b) => a + b,
		}, [
			// 10
			dsl.lit(10),
			// x = 10 + 20
			dsl.assign('x', dsl.fn(dsl.id('+'), [
				dsl.lit(10), dsl.lit(20),
			])),
			// [10, x, 10 + x]
			dsl.arr([
				dsl.lit(10),
				dsl.id('x'),
				dsl.fn(dsl.id('+'), [
					dsl.lit(10), dsl.id('x'),
				]),
			]),
			// ...
			dsl.block({ x: 25 }, [
				dsl.assign('y', dsl.lit(2000)),
				dsl.arr([dsl.lit('NOT RUN')]),
				dsl.fn(dsl.id('+'), [
					dsl.id('x'), dsl.id('x'),
				]),
			]),
		]);

		const results = run(ast, ast.nodes.map(x => x.id));

		const expected = {
			[ast.nodes[0].id]: 10,
			[ast.nodes[1].id]: 30,
			[ast.nodes[2].id]: [10, 30, 40],
			[ast.nodes[3].id]: 50,
		};

		assert.deepEqual(results, expected, 'Run yields correct values for the interested nodes');
	});

});
