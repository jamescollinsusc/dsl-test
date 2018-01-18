/**
 * Execute and return interestIds given the passed ast
 *
 * @param {DslNode} ast - The root ast to execute
 * @param {DslNode.id[]} interestIds - List of interested ids
 * @returns {Object<DslNode.id, *>} - Result map of id -> value
 */

const scopeStack = [new Object()]; 

const evalNode = (node) =>{
	if(node.shape == "Array"){
		let output = [];
		for (let i = 0; i < node.nodes.length; ++i){
			output.push(evalNode(node.nodes[i]));
		}
		return output;
	}

	else if (node.shape == "Assignment"){
		let result = evalNode(node.value); 
		scopeStack[0][node.name] = result;
		return result;
	}

	else if (node.shape == "Block"){
		let newMap = new Object();
		for (let a in scopeStack[0]){
			if(scopeStack[0].hasOwnProperty(a)){
				newMap[a] = scopeStack[0][a];
			}
		}
		for (let a in node.bindings){
			if(node.bindings.hasOwnProperty(a)){
				newMap[a] = node.bindings[a];
			}
			
		}
		scopeStack.unshift(newMap);
		let result = evalNode(node.nodes[node.nodes.length - 1]);
		scopeStack.shift();
		return result;
	}

	else if (node.shape == "Function"){
		if (node.args.length != 2){
			alert("Wrong number of arguments entered for function!");
			return;
		}
		if(node.callee.name == "+"){
			return(evalNode(node.args[0]) + evalNode(node.args[1]));
		}
		else if(node.callee.name == "-"){
			return(evalNode(node.args[0]) - evalNode(node.args[1]));
		}
	}

	else if (node.shape == "Identifier"){
		return scopeStack[0][node.name];
	}

	else if (node.shape == "Literal"){
		return node.value;
	}

	else{
		alert("This node does not have a valid shape specified");
		return;
	}

}



export const run = (ast, interestIds) => {
	console.debug('@todo: optimize and execute', { ast, interestIds });
	
	const nodesToDo = [];

	for (let i = 0; i < interestIds.length; ++i){
		for (let j = 0; j < ast.nodes.length; ++j){
			if(interestIds[i] == ast.nodes[j].id){
				nodesToDo.push(ast.nodes[j]);
			}
		}
	}

	let output = new Object();
	for (let i = 0; i < nodesToDo.length; ++i){
		output[nodesToDo[i].id] = evalNode(nodesToDo[i]);
	}
	
	return output;
};
