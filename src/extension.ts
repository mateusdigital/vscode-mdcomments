//----------------------------------------------------------------------------//
//                               *       +                                    //
//                         '                  |                               //
//                     ()    .-.,="``"=.    - o -                             //
//                           '=/_       \     |                               //
//                        *   |  '=._    |                                    //
//                             \     `=./`,        '                          //
//                          .   '=.__.=' `='      *                           //
//                 +                         +                                //
//                      O      *        '       .                             //
//                                                                            //
//  File      : extension.ts                                                  //
//  Project   : mdcomments                                                    //
//  Date      : 2024-04-29                                                    //
//  License   : See project's COPYING.TXT for full info.                      //
//  Author    : mateus.digital <hello@mateus.digital>                         //
//  Copyright : mateus.digital - 2024, 2025                                   //
//                                                                            //
//  Description :                                                             //
//                                                                            //
//----------------------------------------------------------------------------//

//
// Imports
//

// -----------------------------------------------------------------------------
import * as vscode from "vscode";
import { CommentInfo, CommentUtils } from "../libs/lib-mdViseu/mdViseu/CommentUtils";
import { VSCodeUtils } from "../libs/lib-mdViseu/mdViseu/VSUtils";
import { ErrorUtils } from "../libs/lib-mdViseu/mdViseu//ErrorUtils";

//
// Public Functions
//

// -----------------------------------------------------------------------------
export function activate(context: vscode.ExtensionContext) {
  // ---------------------------------------------------------------------------
  const single_line_disposable = vscode.commands.registerCommand(
    "mdcomments.singleLineComment", () => { _SingleLineComment(); }
  );
  context.subscriptions.push(single_line_disposable);

  // ---------------------------------------------------------------------------
  const multi_line_disposable = vscode.commands.registerCommand(
    "mdcomments.multiLineComment", () => { _MultiLineComment(); }
  );
  context.subscriptions.push(multi_line_disposable);
}

// -----------------------------------------------------------------------------
export function deactivate() { }

//
// Private Functions
//

// -----------------------------------------------------------------------------
function _SingleLineComment() {
  try {
    const curr_editor = VSCodeUtils.ActiveEditor();
    if (!curr_editor) {
      return;
    }

    const selection = curr_editor.selection;
    let selection_text = curr_editor.document.lineAt(selection.start.line).text;

    let line = selection.start.line;
    const column = (selection_text.trim().length == 0)
      ? selection.start.character
      : selection_text.length - selection_text.trimStart().length;

    const comment_line = _CreateCommentLine(curr_editor, column, selection_text);
    if (!comment_line) {
      return;
    }

    curr_editor.edit((edit_builder) => {
      const range = new vscode.Range(line, column, line, selection_text.length);
      edit_builder.replace(range, comment_line);
    });
  }
  catch (error) {
    _ShowError(error);
  }
}

// -----------------------------------------------------------------------------
function _MultiLineComment() {
  try {
    const curr_editor = vscode.window.activeTextEditor;
    if (!curr_editor) {
      return;
    }

    const selection = curr_editor.selection;
    const selection_text = curr_editor.document.lineAt(selection.start.line).text;

    const line = selection.start.line;
    const column = (selection_text.trim().length == 0)
      ? selection.start.character
      : selection_text.length - selection_text.trimStart().length;

    //
    const comment_line = _CreateCommentLine(curr_editor, column, "");
    if (!comment_line) {
      return;
    }

    //
    const space_gap = " ".repeat(column);
    const comment_block =
      _CreateCommentBlock(curr_editor, space_gap, selection_text);

    if (!comment_block) {
      return;
    }

    const full_comment = `${comment_block}\n${space_gap}${comment_line}`;
    curr_editor
      .edit((edit_builder) => {
        const range =
          new vscode.Range(line, column, line, selection_text.length);
        edit_builder.replace(range, full_comment);
      })
      .then(() => {
        // Move the cursor
        const new_line = line + 1;
        const new_column = column + 3;
        const new_position = new vscode.Position(new_line, new_column);
        const new_selection = new vscode.Selection(new_position, new_position);

        curr_editor.selection = new_selection;
        curr_editor.revealRange(new_selection);
      });
  }
  catch (error) {
    _ShowError(error);
  }
}

// -----------------------------------------------------------------------------
function _ShowError(error: any) {
  console.log(error);
  ErrorUtils.ShowErrorToUser(`mdcomments - ${error}`);
}

// -----------------------------------------------------------------------------
function _CreateCommentInfo(editor: vscode.TextEditor) {
  const comment_info = CommentUtils.CreateCommentInfo(editor);
  return comment_info;
}

// -----------------------------------------------------------------------------
function _CreateCommentLine(
  editor: vscode.TextEditor, selectionColumn: number, selectionText: string = ""
) {
  const info = _CreateCommentInfo(editor);
  if (!info) {
    _ShowError(`mdcomments - failed to get comment info -${editor.document.languageId}`);
    return null;
  }

  selectionText = selectionText.trim();

  const comment_start = info.singleLineStart;
  const comment_end = info.singleLineEnd;

  const space_start = " ";
  const space_end = (info.singleLineEnd) ? " " : "";

  const first_spacer = "-".repeat(3);
  const second_spacer = "-".repeat(80);
  const text_margin = (selectionText.length != 0) ? " " : "";

  const first_half
    = comment_start
    + space_start
    + first_spacer
    + text_margin
    + selectionText
    + text_margin
    + second_spacer;

  const second_half
    = space_end
    + comment_end;

  const comment_line
    = first_half.substring(0, 80 - second_half.length)
    + second_half;

  console.log("comment_line", comment_line);
  return comment_line;
}

// -----------------------------------------------------------------------------
function _CreateCommentBlock(
  editor: vscode.TextEditor, spaceGap: string, selectedText: string
) {
  const comment_info = _CreateCommentInfo(editor);
  if (!comment_info) {
    return null;
  }
  selectedText = selectedText.trim();

  const start = comment_info.multiLineStart;
  const middle = comment_info.multiLineMiddle;
  const end = comment_info.multiLineEnd;

  let comment_header = start + "\n";
  comment_header += spaceGap + middle + " " + selectedText + "\n";
  comment_header += spaceGap + end + "\n";

  console.log("comment_header", comment_header);
  return comment_header;
}
