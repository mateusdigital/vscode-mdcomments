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
//  File      : vscode-utils.ts                                               //
//  Project   : mdcomments                                                    //
//  Date      : 2024-04-29                                                    //
//  License   : See project's COPYING.TXT for full info.                      //
//  Author    : mateus.digital <hello@mateus.digital>                         //
//  Copyright : mateus.digital - 2024                                         //
//                                                                            //
//  Description :                                                             //
//   Functionality inspired and taken from:                                   //
//    - https://github.com/daniel-junior-dube/vscode_banner_comments.git      //
//      Thanks a lot :)                                                       //
//                                                                            //
//----------------------------------------------------------------------------//


//
// Imports
//

// -----------------------------------------------------------------------------
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as JSON5 from "json5";

//
//
//

// -----------------------------------------------------------------------------
export default class VSCodeUtils
{
  // ---------------------------------------------------------------------------
  static GetCommentInfo(languageId: string)
  {
    const config:  any = VSCodeUtils.GetLanguageInfo(languageId);
    if(!config) {
      return null;
    }

    const comments = config.comments;
    return comments;
  }

  // ---------------------------------------------------------------------------
  static GetLanguageInfo(languageId: string)
  {
    let config_file_path: string | null = null;
    for (const ext of vscode.extensions.all) {
      const is_lang_config  = ext.id.startsWith("vscode.")
        && ext.packageJSON.contributes
        && ext.packageJSON.contributes.languages

      if (!is_lang_config) {
        continue;
      }

      const language_packages: any[] = ext.packageJSON.contributes.languages;
      const language_package_data : any = language_packages.find(pack => pack.id === languageId);
      if (!!language_package_data && language_package_data.configuration) {
        config_file_path = path.join(ext.extensionPath, language_package_data.configuration);
        break;
      }
    }

    if (!config_file_path || !fs.existsSync(config_file_path)) {
      return null;
    }

    const config = JSON5.parse(fs.readFileSync(config_file_path, "utf8"));
    return config;
  }
}
