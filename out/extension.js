"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
// Regex para detectar clases Spec y métodos de test
const CLASS_REGEX = /^class\s+(\w+Spec)\s+/m;
const METHOD_REGEX = /void\s+['"](.+?)['"]\s*\(\s*\)/g;
/**
 * CodeLensProvider para archivos *Spec.groovy
 */
class GrailsTestCodeLensProvider {
    provideCodeLenses(document) {
        const codeLenses = [];
        const text = document.getText();
        const filePath = document.uri.fsPath;
        // Solo procesar archivos Spec.groovy
        if (!filePath.endsWith('Spec.groovy')) {
            return codeLenses;
        }
        // Detectar la clase Spec
        const classMatch = CLASS_REGEX.exec(text);
        if (classMatch) {
            const className = classMatch[1];
            const packageName = this.extractPackage(text);
            const fullClassName = packageName ? `${packageName}.${className}` : className;
            const testType = this.getTestType(filePath);
            // Encontrar la línea donde está la clase
            const classLine = document.positionAt(classMatch.index).line;
            const range = new vscode.Range(classLine, 0, classLine, 0);
            // CodeLens para ejecutar y rerun toda la clase
            codeLenses.push(new vscode.CodeLens(range, {
                title: '▶ Run All Tests',
                command: 'grails-test-runner.runTestClass',
                arguments: [fullClassName, testType]
            }), new vscode.CodeLens(range, {
                title: '↺ Rerun All Tests',
                command: 'grails-test-runner.rerunTestClass',
                arguments: [fullClassName, testType]
            }));
        }
        // Detectar métodos de test individuales
        let methodMatch;
        const methodRegex = /void\s+['"](.+?)['"]\s*\(\s*\)/g;
        while ((methodMatch = methodRegex.exec(text)) !== null) {
            const testName = methodMatch[1];
            const classMatch2 = CLASS_REGEX.exec(text);
            if (classMatch2) {
                const className = classMatch2[1];
                const packageName = this.extractPackage(text);
                const fullClassName = packageName ? `${packageName}.${className}` : className;
                const testType = this.getTestType(filePath);
                // Encontrar la línea del método
                const methodLine = document.positionAt(methodMatch.index).line;
                const range = new vscode.Range(methodLine, 0, methodLine, 0);
                // CodeLens para ejecutar y rerun test individual
                codeLenses.push(new vscode.CodeLens(range, {
                    title: '▶ Run Test',
                    command: 'grails-test-runner.runTest',
                    arguments: [fullClassName, testName, testType]
                }), new vscode.CodeLens(range, {
                    title: '↺ Rerun Test',
                    command: 'grails-test-runner.rerunTest',
                    arguments: [fullClassName, testName, testType]
                }));
            }
        }
        return codeLenses;
    }
    /**
     * Extrae el nombre del paquete del archivo
     */
    extractPackage(text) {
        const packageMatch = /^package\s+([\w.]+)/m.exec(text);
        return packageMatch ? packageMatch[1] : null;
    }
    /**
     * Determina si es test unitario o de integración basado en la ruta
     */
    getTestType(filePath) {
        if (filePath.includes('integration-test')) {
            return 'integrationTest';
        }
        return 'test';
    }
}
/**
 * Ejecuta un test usando Gradle en la terminal integrada
 */
function runGradleTest(className, testName, testType, rerunTasks = false) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No hay workspace abierto');
        return;
    }
    const workspacePath = workspaceFolders[0].uri.fsPath;
    // Construir el comando Gradle
    let testFilter;
    if (testName) {
        // Escapar caracteres especiales en el nombre del test
        const escapedTestName = testName.replace(/['"]/g, '');
        // Usar wildcard al final para manejar tests parametrizados
        testFilter = `"${className}.${escapedTestName}*"`;
    }
    else {
        testFilter = `"${className}"`;
    }
    const rerunFlag = rerunTasks ? ' --rerun-tasks' : '';
    const command = `./gradlew ${testType} --tests ${testFilter}${rerunFlag}`;
    // Crear o reusar terminal
    let terminal = vscode.window.terminals.find(t => t.name === 'Grails Tests');
    if (!terminal) {
        terminal = vscode.window.createTerminal({
            name: 'Grails Tests',
            cwd: workspacePath
        });
    }
    terminal.show();
    terminal.sendText(command);
}
/**
 * Activa la extensión
 */
function activate(context) {
    console.log('Grails Test Runner activado');
    // Registrar el CodeLensProvider para archivos Groovy
    const codeLensProvider = new GrailsTestCodeLensProvider();
    const codeLensDisposable = vscode.languages.registerCodeLensProvider({ language: 'groovy', pattern: '**/*Spec.groovy' }, codeLensProvider);
    context.subscriptions.push(codeLensDisposable);
    // Comando para ejecutar un test individual
    const runTestCommand = vscode.commands.registerCommand('grails-test-runner.runTest', (className, testName, testType) => {
        runGradleTest(className, testName, testType);
    });
    context.subscriptions.push(runTestCommand);
    // Comando para ejecutar toda la clase de test
    const runTestClassCommand = vscode.commands.registerCommand('grails-test-runner.runTestClass', (className, testType) => {
        runGradleTest(className, null, testType);
    });
    context.subscriptions.push(runTestClassCommand);
    // Comando para rerun un test individual con --rerun-tasks
    const rerunTestCommand = vscode.commands.registerCommand('grails-test-runner.rerunTest', (className, testName, testType) => {
        runGradleTest(className, testName, testType, true);
    });
    context.subscriptions.push(rerunTestCommand);
    // Comando para rerun toda la clase con --rerun-tasks
    const rerunTestClassCommand = vscode.commands.registerCommand('grails-test-runner.rerunTestClass', (className, testType) => {
        runGradleTest(className, null, testType, true);
    });
    context.subscriptions.push(rerunTestClassCommand);
}
/**
 * Desactiva la extensión
 */
function deactivate() {
    console.log('Grails Test Runner desactivado');
}
//# sourceMappingURL=extension.js.map