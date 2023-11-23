const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

let translationsFolderPath = null;
let translationsFileName = null;

function activate(context) {
  let disposable = vscode.commands.registerCommand(
    "extension.extractI18nKeys",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const document = editor.document;
        const text = document.getText();
        const regex = /i18n\.t\(['"](.+?)['"]\)/g;
        const matches = [];
        let match;
        while ((match = regex.exec(text))) {
          matches.push(match[1]);
        }

        const translations = {};
        matches.forEach((key) => {
          translations[key] = key;
        });

        if (translationsFolderPath && translationsFileName) {
          const translationsFilePath = path.join(
            translationsFolderPath,
            translationsFileName + ".json"
          );
          appendTranslationsToFile(translations, translationsFilePath);
        } else {
          vscode.window
            .showOpenDialog({
              canSelectFiles: false,
              canSelectFolders: true,
              canSelectMany: false,
              openLabel: "Select Folder for Translations",
            })
            .then((folderUri) => {
              if (folderUri && folderUri[0]) {
                translationsFolderPath = folderUri[0].fsPath;
                vscode.window
                  .showInputBox({
                    prompt:
                      "Enter the name of the translations file (without extension because it end with json already)",
                    validateInput: validateFileName,
                  })
                  .then((fileName) => {
                    if (fileName) {
                      translationsFileName = fileName;
                      const translationsFilePath = path.join(
                        translationsFolderPath,
                        translationsFileName + ".json"
                      );
                      appendTranslationsToFile(
                        translations,
                        translationsFilePath
                      );
                    }
                  });
              }
            });
        }
      }
    }
  );

  context.subscriptions.push(disposable);
}

function validateFileName(fileName) {
  if (!fileName) {
    return "Please enter a file name.";
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(fileName)) {
    return "File name can only contain letters, numbers, underscores, and hyphens.";
  }
  return null;
}

function appendTranslationsToFile(translations, filePath) {
  let existingTranslations = {};
  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    existingTranslations = JSON.parse(fileContent);
  } catch (err) {
    // If the file doesn't exist or can't be parsed, continue with an empty object
  }

  const mergedTranslations = { ...existingTranslations, ...translations };
  const updatedContent = JSON.stringify(mergedTranslations, null, 2);

  fs.writeFile(filePath, updatedContent, (err) => {
    if (err) {
      vscode.window.showErrorMessage("Failed to write translations file.");
    } else {
      vscode.window.showInformationMessage(
        "i18n keys extracted and appended successfully."
      );
    }
  });
}

module.exports = {
  activate,
};
