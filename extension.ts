import { rejects } from 'assert';
import { resolve } from 'path';
import { stringify } from 'querystring';
import * as vscode from 'vscode';
// Description
// Uncomment the current line if it has plt. in it
// and comment all the others plt lines where plt is not used inside (ex. plt +=) 

// !TO DO
// keep folded region

// check for plt when typeing

// when select a line that has plt commented 
// after 1.5 sec if the active line doesn't change 
// uncomment the line and comment all the others plt lines where
//  plt is not used inside (ex. plt +=) 


// when see a step uncomment the coresponding plt

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "ak-glsl-test" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('ak-glsl-test.test_glsl', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from ak_glsl_test!');

		// Desription:
		// select all plt except the active line that are not followed by [+|-|*|/]= and how don't start with //
		// when start a new line check if it has plt
		// then do all the above
		
		const activeEditor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
		if (!activeEditor) {
			console.log('no active editor or undefined');
			return;
		}

		comment_plt_except_active_ln(activeEditor);

		// for test folfding region
		// this provides the region with an icon but
		// doesn't fold it
		vscode.languages.registerFoldingRangeProvider('glsl', {
			provideFoldingRanges: async (document, context, token) => {
				console.log('provideFoldingRanges triggered');
				return [new vscode.FoldingRange(5, 13)];
			}
		});

		// fold the region
		// select the first line of region
		activeEditor.selection = new vscode.Selection(5, 0, 5, 0);
		vscode.commands.executeCommand('editor.fold');
		
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

function uncommentLine() {
	vscode.commands.executeCommand('editor.action.removeCommentLine');
}

function comment_plt_except_active_ln(activeEditor: vscode.TextEditor): void {
	const active_doc: vscode.TextDocument = activeEditor.document;

	// get document range
	const last_ln: number = active_doc.lineCount;
	const txt_last_ln: vscode.TextLine = active_doc.lineAt(last_ln-1);
	const pos_last_ln: vscode.Position = txt_last_ln.rangeIncludingLineBreak.end;

	let currsorPos: vscode.Position = activeEditor.selection.active;
	const active_line: number = currsorPos.line;
	let txt_skiped: string = active_doc.lineAt(active_line).text;
	
	// check if active line has plt and is commented
	const regExp = /\/\/\s*plt/gm;
	const has_plt: boolean = regExp.test(txt_skiped);
	
	// if it has commented plt at the line start then uncomment the line
	if (has_plt) {
		const length_string_bf = txt_skiped.length;
		txt_skiped = txt_skiped.replace(/^(\s{0,})\/\/\s*(plt.*)/gm, '$1$2');
		const length_string_af = txt_skiped.length;
		const missing_characters = length_string_bf-length_string_af;
		currsorPos = new vscode.Position(active_line, currsorPos.character - missing_characters)
	}
	
	const pos_before_active_ln: vscode.Position = active_doc.lineAt(active_line-1).rangeIncludingLineBreak.end;
	const pos_after_active_ln: vscode.Position = new vscode.Position(active_line+1, 0);

	const doc_range_before_active_ln: vscode.Range = new vscode.Range(new vscode.Position(0,0), pos_before_active_ln);
	const doc_range_after_active_ln: vscode.Range = new vscode.Range(pos_after_active_ln, pos_last_ln);

	const doc_txt_1: string = active_doc.getText(doc_range_before_active_ln);
	const txt_part_1: string = doc_txt_1.replace(/^(?!\/\/)(\s{0,})(plt.*)[^plt.*\+\-\*\/]=/gm, '$1// $2 =');

	const doc_txt_2: string = active_doc.getText(doc_range_after_active_ln);
	const txt_part_2: string = doc_txt_2.replace(/^(?!\/\/)(\s{0,})(plt.*)[^plt.*\+\-\*\/]=/gm, '$1// $2 =');

	const new_text: string = txt_part_1 + txt_skiped + '\n' + txt_part_2;
	// const doc_range: vscode.Range = new vscode.Range(new vscode.Position(0,0), new vscode.Position(last_ln, pos_last_ln.character));
	const doc_range: vscode.Range = new vscode.Range(new vscode.Position(0,0), pos_last_ln);

	activeEditor.edit(editBuilder => {
		editBuilder.replace(doc_range, new_text);
		console.log('callback executed');
	});
	
	// set the cursor position after modifying the text
	activeEditor.selection = new vscode.Selection(currsorPos, currsorPos);

}


// get regions
// remove active region from array
// fold regions


// private async foldLines(document: vscode.TextDocument, foldLines: Array<number>) {
// 	var str = "";
// 	foldLines.forEach(p => str += p + ",");
// 	console.log("folding lines: " + str);

// 	const textEditor = this.getTextEditor(document);
// 	if (!textEditor) { return; }
// 	const selection = textEditor.selection;

// 	for (const lineNumber of foldLines) {
// 		textEditor.selection = new vscode.Selection(lineNumber, 0, lineNumber, 0);
// 		await vscode.commands.executeCommand('editor.fold');
// 		console.log('folding ' + textEditor.selection.anchor.line);
// 	}
// 	textEditor.selection = selection;
// 	// textEditor.revealRange(textEditor.selection, vscode.TextEditorRevealType.InCenter);
// }



// let someTrackingIdCounter = 0;

// const provider: vscode.InlineCompletionItemProvider = {
// 	provideInlineCompletionItems: async (document, position, context, token) => {
// 		console.log('provideInlineCompletionItems triggered');

// 		const regexp = /\/\/ \[(.+),(.+)\):(.*)/;
// 		if (position.line <= 0) {
// 			return;
// 		}

// 		const lineBefore = document.lineAt(position.line - 1).text;
// 		const matches = lineBefore.match(regexp);
// 		if (matches) {
// 			const start = matches[1];
// 			const startInt = parseInt(start, 10);
// 			const end = matches[2];
// 			const endInt =
// 				end === '*' ? document.lineAt(position.line).text.length : parseInt(end, 10);
// 			const insertText = matches[3].replace(/\\n/g, '\n');

// 			return [
// 				{
// 					insertText,
// 					range: new vscode.Range(position.line, startInt, position.line, endInt),
// 					someTrackingId: someTrackingIdCounter++,
// 				},
// 			] as MyInlineCompletionItem[];
// 		}
// 	},
// };

// vscode.languages.registerInlineCompletionItemProvider({ pattern: '**' }, provider);


// put in to an async function
// for (const lineNumber of foldLines) {
// 	textEditor.selection = new vscode.Selection(lineNumber, 0, lineNumber, 0);
// 	await vscode.commands.executeCommand('editor.fold');
// 	console.log('folding ' + textEditor.selection.anchor.line);
// }