/**
 * Execute and return interestIds given the passed ast
 *
 * @param {DslNode} ast - The root ast to execute
 * @param {DslNode.id[]} interestIds - List of interested ids
 * @returns {Object<DslNode.id, *>} - Result map of id -> value
 */

const scope_stack = [new Object()]; 


const scope_update = (node) =>{
	let newMap = new Object();
	//Inherit assignments made in the parent scope
	for (let a in scope_stack[0]){
		if(scope_stack[0].hasOwnProperty(a)){
			newMap[a] = scope_stack[0][a];
		}
	}
	//Redefine the map of identifiers based on the content of the block's bindings
	for (let a in node.bindings){
		if(node.bindings.hasOwnProperty(a)){
			newMap[a] = node.bindings[a];
		}
		
	}
	return newMap;
}

//This function finds any specific node within the AST, and keeps track of identifiers in the scope in the process
const find_node = (node, id) =>{
	if (node.id == id){
		return node;
	}
	else if(node.shape == "Function"){
		for (let i = 0; i < node.args.length; ++i){
			let result = find_node(node.args[i], id);
			if (result != null){
				return result;
			}
		}
		return;
	}
	else if(node.shape == "Array"){
		for (let i = 0; i < node.nodes.length; ++i){
			let result = find_node(node.nodes[i], id);
			if (result != null){
				return result;
			}
		}
		return;
	}
	else if(node.shape == "Assignment"){
		return find_node(node.value, id);
	}
	else if(node.shape == "Block"){
		let newMap = scope_update(node);
		for (let i = 0; i < node.nodes.length; ++i){
			//Have to only update the map with assignments before our specified node
			//in case there is an assignment block after the node and we accidentally track 
			//the new value for the identifier
			let result = find_node(node.nodes[i], id);
			if (result != null){
				scope_stack.unshift(newMap);
				return result;
			}
			else if(node.nodes[i].shape == "Assignment"){
				newMap[node.nodes[i].name] = node.nodes[i].value;
			}
		}
		scope_stack.shift();
		return;

	}
	else if(node.shape == "Identifier"){
		return;
	}
	else if(node.shape == "Literal"){
		return;
	}
}



const eval_array = (args) =>{
	let output = [];
	for (let i = 0; i < args.length; ++i){
		output.push(eval_node(args[i]))
	}
	return output;
}

const eval_node = (node) =>{
	if(node.shape == "Array"){
		let output = [];
		//Iterate sequentially and evaluate
		for (let i = 0; i < node.nodes.length; ++i){
			output.push(eval_node(node.nodes[i]));
		}
		return output;
	}

	else if (node.shape == "Assignment"){
		//Update the map of identifiers on the scope_stack 
		let result = eval_node(node.value); 
		scope_stack[0][node.name] = node.value;
		return result;
	}

	else if (node.shape == "Block"){
		let newMap = scope_update(node);
		for (let i = 0; i < node.nodes.length - 1; ++i){
			if(node.nodes[i].shape == "Assignment"){
				newMap[node.nodes[i].name] = node.nodes[i].value;
			}
		}
		//Add new identifier map to the scope stack
		scope_stack.unshift(newMap);
		//Only return last line of block
		let result = eval_node(node.nodes[node.nodes.length - 1]);
		//Remove map from stack as block is going out of scope
		scope_stack.shift();
		return result;
	}

	else if (node.shape == "Function"){
		//Now with functionality to run any kind of function with any number of args
		return scope_stack[0][node.callee.name].apply(null, eval_array(node.args));
	}

	else if (node.shape == "Identifier"){
		//I changed this function so that instead of evaluating all assignment blocks and storing the values, 
		//I store a reference to the block that needs to be evaluated, and only evaluate when some other block
		//tries to access that identifier
		return eval_node(scope_stack[0][node.name]);
	}

	else if (node.shape == "Literal"){
		return node.value;
	}

	else{
		//Need this in case identifiers are defined explicitly in a block's bindings instead of in an assignment node
		return node;
	}

}


export const run = (ast, interestIds) => {
	console.debug('@todo: optimize and execute', { ast, interestIds });

	let output = new Object();
	for (let i = 0; i < interestIds.length; ++i){
		let result = eval_node(find_node(ast,interestIds[i]));
		//console.log(result);
		output[interestIds[i]] = result;
	}

	return output;
};
