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
//  Copyright : mateus.digital - 2024                                         //
//                                                                            //
//  Description :                                                             //
//                                                                            //
//----------------------------------------------------------------------------//

//
// Imports
//

// -----------------------------------------------------------------------------
import * as vscode from "vscode";

import VSCodeUtils from "./vscode-utils";

//
// Private Functions
//

// -----------------------------------------------------------------------------
function _ShowError(error: any) { console.log(error); }

// -----------------------------------------------------------------------------
function _CreateCommentInfo(editor: vscode.TextEditor)
{
  const comment_info = VSCodeUtils.GetCommentInfo(editor.document.languageId);
  if (!comment_info) {
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
function _CreateCommentLine(editor: vscode.TextEditor, selectionColumn: number)
{
  const info = _CreateCommentInfo(editor);
  if (!info) {
    return null;
  }

  const space_start = " ";
  const space_end   = (info.singleLineEnd) ? " " : "";

  const max_columns  = 80 - (selectionColumn + info.singleLineLength +
                            space_start.length + space_end.length);
  const spacer       = "-".repeat(max_columns);
  const comment_line = `${info.singleLineStart}${space_start}${spacer}${
    space_end}${info.singleLineEnd}`;

  return comment_line;
}

// -----------------------------------------------------------------------------
function _CreateCommentBlock(editor: vscode.TextEditor, spaceGap: string)
{
  const comment_info = _CreateCommentInfo(editor);
  if (!comment_info) {
    return null;
  }

  const start  = comment_info.multiLineStart;
  const middle = comment_info.multiLineMiddle;
  const end    = comment_info.multiLineEnd;

  const comment_header = `${start}\n${spaceGap}${middle}  \n${spaceGap}${end}\n`;
  return comment_header;
}

//
// Public Functions
//

// -----------------------------------------------------------------------------
export function activate(context: vscode.ExtensionContext)
{
  // ---------------------------------------------------------------------------
  const single_line_disposable =
    vscode.commands.registerCommand("mdcomments.singleLineComment", () => {
      try {
        const curr_editor = vscode.window.activeTextEditor;
        if (!curr_editor) {
          return;
        }

        const selection        = curr_editor.selection;
        const selection_line   = selection.active.line;
        const selection_column = selection.active.character;

        const comment_line = _CreateCommentLine(curr_editor, selection_column);
        if (!comment_line) {
          return;
        }

        curr_editor.edit((edit_builder) => {
          const position = new vscode.Position(selection_line, selection_column);
          edit_builder.insert(position, comment_line);
        });
      }
      catch (error) {
        _ShowError(error);
      }
    });

  context.subscriptions.push(single_line_disposable);

  // ---------------------------------------------------------------------------
  const multi_line_disposable =
    vscode.commands.registerCommand("mdcomments.multiLineComment", () => {
      try {
        const curr_editor = vscode.window.activeTextEditor;
        if (!curr_editor) {
          return;
        }

        const selection        = curr_editor.selection;
        const selection_line   = selection.active.line;
        const selection_column = selection.active.character;

        const comment_line = _CreateCommentLine(curr_editor, selection_column);
        if (!comment_line) {
          return;
        }

        const space_gap     = " ".repeat(selection_column);
        const comment_block = _CreateCommentBlock(curr_editor, space_gap);
        if (!comment_block) {
          return;
        }

        const full_comment = `${comment_block}\n${space_gap}${comment_line}`;

        curr_editor
          .edit((edit_builder) => {
            const position =
              new vscode.Position(selection_line, selection_column);
            edit_builder.insert(position, full_comment);
          })
          .then(() => {
            // Move the cursor
            const new_line     = selection_line + 1;
            const new_column   = selection_column + 3;
            const new_position = new vscode.Position(new_line, new_column);
            const new_selection =
              new vscode.Selection(new_position, new_position);

            curr_editor.selection = new_selection;
            curr_editor.revealRange(new_selection);
          });
      }
      catch (error) {
        _ShowError(error);
      }
    });

  context.subscriptions.push(multi_line_disposable);
}

// -----------------------------------------------------------------------------
export function deactivate() {}
