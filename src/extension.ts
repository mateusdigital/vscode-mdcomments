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

import {VSCodeUtils} from "./VSCodeUtils";

//
// Public Functions
//

// -----------------------------------------------------------------------------
export function activate(context: vscode.ExtensionContext)
{
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
export function deactivate() {}

//
// Private Functions
//

// -----------------------------------------------------------------------------
function _SingleLineComment()
{
  try {
    const curr_editor = vscode.window.activeTextEditor;
    if (!curr_editor) {
      return;
    }

    const selection    = curr_editor.selection;
    let selection_text = curr_editor.document.lineAt(selection.start.line).text;
    let line           = selection.start.line;
    let column         = selection.start.character;

    if (selection_text.trim().length != 0) {
      column = selection_text.length - selection_text.trimStart().length;
    }

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
function _MultiLineComment()
{
  try {
    const curr_editor = vscode.window.activeTextEditor;
    if (!curr_editor) {
      return;
    }

    const selection    = curr_editor.selection;
    let selection_text = curr_editor.document.lineAt(selection.start.line).text;
    let line           = selection.start.line;
    let column         = selection.start.character;

    if (selection_text.trim().length != 0) {
      column = selection_text.length - selection_text.trimStart().length;
    }

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
        const new_line      = line + 1;
        const new_column    = column + 3;
        const new_position  = new vscode.Position(new_line, new_column);
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
function _ShowError(error: any) { console.log(error); }

// -----------------------------------------------------------------------------
function _CreateCommentInfo(editor: vscode.TextEditor)
{
  const language_id  = editor.document.languageId;
  const comment_info = VSCodeUtils.GetCommentInfo(language_id);

  if (!comment_info) {
    VSCodeUtils.ShowError(
      `mdcomments - failed to get comment info -${language_id}`
    );

    return null;
  }

  let single_start = (comment_info.lineComment) ? comment_info.lineComment
                                                : comment_info.blockComment[0];
  let single_end =
    (comment_info.lineComment) ? "" : comment_info.blockComment[1];

  let multi_start = (comment_info.lineComment) ? comment_info.lineComment
                                               : comment_info.blockComment[0];
  let multi_end   = (comment_info.lineComment) ? comment_info.lineComment
                                               : comment_info.blockComment[1];
  let multi_middle =
    (comment_info.lineComment)
      ? comment_info.lineComment
      : comment_info.blockComment[0][comment_info.blockComment[0].length - 1];

  if (single_start && single_start.length < 2) {
    single_start += single_start;
  }
  if (single_end && single_end.length != 0 && single_end < 2) {
    single_end += single_end;
  }

  if (multi_start && multi_start.length < 2) {
    multi_start += multi_start;
  }
  if (multi_end && multi_end.length != 0 && multi_end < 2) {
    multi_end += multi_end;
  }

  const obj = {
    singleLineStart : single_start,
    singleLineEnd : single_end,

    multiLineStart : multi_start,
    multiLineMiddle : multi_middle,
    multiLineEnd : multi_end,

    singleLineLength : single_start.length + single_end.length,
    multiLineLength : multi_start.length + multi_end.length,
  };

  return obj;
}

// -----------------------------------------------------------------------------
function _CreateCommentLine(
  editor: vscode.TextEditor, selectionColumn: number, selectionText: string = ""
)
{
  const info = _CreateCommentInfo(editor);
  if (!info) {
    return null;
  }

  selectionText = selectionText.trim();

  const comment_start = info.singleLineStart;
  const comment_end   = info.singleLineEnd;

  const space_start = " ";
  const space_end   = (info.singleLineEnd) ? " " : "";

  const first_spacer  = "-".repeat(3);
  const second_spacer = "-".repeat(80);
  const text_margin   = (selectionText.length != 0) ? " " : "";

  const comment_line =
    (comment_start + space_start + first_spacer + text_margin + selectionText +
     text_margin + second_spacer + space_end
    ).substring(0, 80 - (selectionColumn + comment_end.length));

  return comment_line;
}

// -----------------------------------------------------------------------------
function _CreateCommentBlock(
  editor: vscode.TextEditor, spaceGap: string, selectedText: string
)
{
  const comment_info = _CreateCommentInfo(editor);
  if (!comment_info) {
    return null;
  }
  selectedText = selectedText.trim();

  const start  = comment_info.multiLineStart;
  const middle = comment_info.multiLineMiddle;
  const end    = comment_info.multiLineEnd;

  let   comment_header  = start + "\n";
  comment_header       += spaceGap + middle + " " + selectedText + "\n";
  comment_header       += spaceGap + end + "\n";

  return comment_header;
}
