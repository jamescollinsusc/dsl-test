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
		//Iterate sequentially and evaluate
		for (let i = 0; i < node.nodes.length; ++i){
			output.push(evalNode(node.nodes[i]));
		}
		return output;
	}

	else if (node.shape == "Assignment"){
		//Update the map of identifiers on the scopestack 
		let result = evalNode(node.value); 
		scopeStack[0][node.name] = result;
		return result;
	}

	else if (node.shape == "Block"){
		let newMap = new Object();
		//Inherit assignments made in the parent scope
		for (let a in scopeStack[0]){
			if(scopeStack[0].hasOwnProperty(a)){
				newMap[a] = scopeStack[0][a];
			}
		}
		//Redefine the map of identifiers based on the content of the block's bindings
		for (let a in node.bindings){
			if(node.bindings.hasOwnProperty(a)){
				newMap[a] = node.bindings[a];
			}
			
		}
		//Add new identifier map to the scope stack
		scopeStack.unshift(newMap);
		//Need to evaluate nodes not in the last line of the block in case of identifier assignment
		for (let i = 0; i < node.nodes.length - 1; ++i){
			evalNode(node.nodes[i]);
		}
		//Only return last line of block
		let result = evalNode(node.nodes[node.nodes.length - 1]);
		//Remove map from stack as block is going out of scope
		scopeStack.shift();
		return result;
	}

	else if (node.shape == "Function"){
		if (node.args.length != 2){
			alert("Wrong number of arguments entered for function!");
			return;
		}
		//Handle addition and subtraction functions
		if(node.callee.name == "+"){
			return(evalNode(node.args[0]) + evalNode(node.args[1]));
		}
		else if(node.callee.name == "-"){
			return(evalNode(node.args[0]) - evalNode(node.args[1]));
		}
	}

	else if (node.shape == "Identifier"){
		//Return value of identifier in current scope
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
	
	let nodesToDo = new Object();
	let output = new Object();

	//Need to evaluate all nodes in same scope as interest nodes in case of prerequisite assignments
	for (let i = 0; i < ast.nodes.length; ++i){
		nodesToDo[ast.nodes[i].id] = evalNode(ast.nodes[i]) 
	}

	//Only return nodes we are interested in
	for (let a in nodesToDo){
		for (let i = 0; i < interestIds.length; ++i){
			if(interestIds[i] == a){
				output[a] = nodesToDo[a];
			}
		}
	}
	
	return output;
};
