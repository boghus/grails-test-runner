import * as vscode from 'vscode';
import * as path from 'path';

// Regex para detectar clases Spec y métodos de test
const CLASS_REGEX = /^class\s+(\w+Spec)\s+/m;
const METHOD_REGEX = /void\s+['"](.+?)['"]\s*\(\s*\)/g;

/**
 * CodeLensProvider para archivos *Spec.groovy
 */
class GrailsTestCodeLensProvider implements vscode.CodeLensProvider {
    
    public provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        const codeLenses: vscode.CodeLens[] = [];
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
            codeLenses.push(
                new vscode.CodeLens(range, {
                    title: '▶ Run All Tests',
                    command: 'grails-test-runner.runTestClass',
                    arguments: [fullClassName, testType]
                }),
                new vscode.CodeLens(range, {
                    title: '↺ Rerun All Tests',
                    command: 'grails-test-runner.rerunTestClass',
                    arguments: [fullClassName, testType]
                })
            );
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
                codeLenses.push(
                    new vscode.CodeLens(range, {
                        title: '▶ Run Test',
                        command: 'grails-test-runner.runTest',
                        arguments: [fullClassName, testName, testType]
                    }),
                    new vscode.CodeLens(range, {
                        title: '↺ Rerun Test',
                        command: 'grails-test-runner.rerunTest',
                        arguments: [fullClassName, testName, testType]
                    })
                );
            }
        }

        return codeLenses;
    }

    /**
     * Extrae el nombre del paquete del archivo
     */
    private extractPackage(text: string): string | null {
        const packageMatch = /^package\s+([\w.]+)/m.exec(text);
        return packageMatch ? packageMatch[1] : null;
    }

    /**
     * Determina si es test unitario o de integración basado en la ruta
     */
    private getTestType(filePath: string): string {
        if (filePath.includes('integration-test')) {
            return 'integrationTest';
        }
        return 'test';
    }
}

/**
 * Ejecuta un test usando Gradle en la terminal integrada
 */
function runGradleTest(className: string, testName: string | null, testType: string, rerunTasks = false): void {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No hay workspace abierto');
        return;
    }

    const workspacePath = workspaceFolders[0].uri.fsPath;
    
    // Construir el comando Gradle
    let testFilter: string;
    if (testName) {
        // Escapar caracteres especiales en el nombre del test
        const escapedTestName = testName.replace(/['"]/g, '');
        // Usar wildcard al final para manejar tests parametrizados
        testFilter = `"${className}.${escapedTestName}*"`;
    } else {
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
export function activate(context: vscode.ExtensionContext): void {
    console.log('Grails Test Runner activado');

    // Registrar el CodeLensProvider para archivos Groovy
    const codeLensProvider = new GrailsTestCodeLensProvider();
    const codeLensDisposable = vscode.languages.registerCodeLensProvider(
        { language: 'groovy', pattern: '**/*Spec.groovy' },
        codeLensProvider
    );
    context.subscriptions.push(codeLensDisposable);

    // Comando para ejecutar un test individual
    const runTestCommand = vscode.commands.registerCommand(
        'grails-test-runner.runTest',
        (className: string, testName: string, testType: string) => {
            runGradleTest(className, testName, testType);
        }
    );
    context.subscriptions.push(runTestCommand);

    // Comando para ejecutar toda la clase de test
    const runTestClassCommand = vscode.commands.registerCommand(
        'grails-test-runner.runTestClass',
        (className: string, testType: string) => {
            runGradleTest(className, null, testType);
        }
    );
    context.subscriptions.push(runTestClassCommand);

    // Comando para rerun un test individual con --rerun-tasks
    const rerunTestCommand = vscode.commands.registerCommand(
        'grails-test-runner.rerunTest',
        (className: string, testName: string, testType: string) => {
            runGradleTest(className, testName, testType, true);
        }
    );
    context.subscriptions.push(rerunTestCommand);

    // Comando para rerun toda la clase con --rerun-tasks
    const rerunTestClassCommand = vscode.commands.registerCommand(
        'grails-test-runner.rerunTestClass',
        (className: string, testType: string) => {
            runGradleTest(className, null, testType, true);
        }
    );
    context.subscriptions.push(rerunTestClassCommand);
}

/**
 * Desactiva la extensión
 */
export function deactivate(): void {
    console.log('Grails Test Runner desactivado');
}
